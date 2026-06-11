interface Env {
  MOVEBANK_BASE_URL: string;
  MOVEBANK_PASSWORD: string;
  MOVEBANK_STUDY_IDS: string;
  MOVEBANK_USERNAME: string;
  MAX_DAYS_BACK: string;
  MAX_RADIUS_KM: string;
}

interface TrackResponse {
  sourceName: "Movebank";
  totalTracks: number;
  tracks: MovebankTrack[];
}

interface MovebankTrack {
  id: string;
  individualId?: string;
  individualName?: string;
  latestPoint?: {
    point: {
      latitude: number;
      longitude: number;
    };
    timestamp: string;
  };
  pointCount: number;
  speciesName?: string;
  studyId: string;
  studyName?: string;
}

interface RequestQuery {
  centerLat: number;
  centerLng: number;
  dateEnd: string;
  daysBack: number;
  radiusKm: number;
}

const allowedQueryKeys = new Set([
  "centerLat",
  "centerLng",
  "dateEnd",
  "daysBack",
  "radiusKm",
]);

const corsHeaders = {
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-origin": "*",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);

    if (!url.pathname.endsWith("/tracks")) {
      return json({ error: "Not found" }, 404);
    }

    let query: RequestQuery;

    try {
      query = parseAndValidateQuery(url, env);
    } catch (error) {
      return json(
        {
          error: error instanceof Error ? error.message : "Invalid request",
        },
        400,
      );
    }

    const allowedStudyIds = parseAllowlistedStudyIds(env.MOVEBANK_STUDY_IDS);

    if (allowedStudyIds.length === 0) {
      return json(
        {
          error: "No allowlisted study IDs configured",
        },
        503,
      );
    }

    try {
      const tracks = await fetchTracks({
        allowedStudyIds,
        credentials: {
          password: env.MOVEBANK_PASSWORD,
          username: env.MOVEBANK_USERNAME,
        },
        query,
        request,
        upstreamBaseUrl: env.MOVEBANK_BASE_URL || "https://www.movebank.org",
      });

      const payload: TrackResponse = {
        sourceName: "Movebank",
        totalTracks: tracks.length,
        tracks,
      };

      return json(payload, 200, {
        "cache-control": "public, max-age=120, stale-while-revalidate=300",
      });
    } catch (error) {
      console.error("Movebank fetch failed", error);
      return json({ error: "Movebank upstream request failed" }, 502);
    }
  },
};

async function fetchTracks({
  allowedStudyIds,
  credentials,
  query,
  request,
  upstreamBaseUrl,
}: {
  allowedStudyIds: string[];
  credentials: { password: string; username: string };
  query: RequestQuery;
  request: Request;
  upstreamBaseUrl: string;
}): Promise<MovebankTrack[]> {
  const startDate = getStartDate(query.dateEnd, query.daysBack);
  const bbox = makeBbox(query.centerLat, query.centerLng, query.radiusKm);
  const authHeader = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  const tracks: MovebankTrack[] = [];

  for (const studyId of allowedStudyIds) {
    const upstreamUrl = new URL("/movebank/service/direct-read", upstreamBaseUrl);
    upstreamUrl.searchParams.set("entity_type", "event");
    upstreamUrl.searchParams.set("study_id", studyId);
    upstreamUrl.searchParams.set("attributes", "individual-local-identifier,timestamp,location-lat,location-long,taxon-canonical-name");
    upstreamUrl.searchParams.set("format", "json");
    upstreamUrl.searchParams.set("visible", "true");
    upstreamUrl.searchParams.set("timestamp_start", `${startDate} 00:00:00`);
    upstreamUrl.searchParams.set("timestamp_end", `${query.dateEnd} 23:59:59`);
    upstreamUrl.searchParams.set("bbox", bbox);

    const response = await fetch(upstreamUrl, {
      headers: {
        authorization: authHeader,
        "user-agent": request.headers.get("user-agent") ?? "TideGuideMovebankWorker/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream status ${response.status}`);
    }

    const payload = (await response.json()) as MovebankEvent[];
    const normalizedTracks = normalizeEventsToTracks(payload, studyId);
    tracks.push(...normalizedTracks);
  }

  return tracks
    .sort((a, b) => {
      const aTime = a.latestPoint?.timestamp ?? "";
      const bTime = b.latestPoint?.timestamp ?? "";
      return bTime.localeCompare(aTime);
    })
    .slice(0, 200);
}

type MovebankEvent = {
  [key: string]: unknown;
};

function normalizeEventsToTracks(events: MovebankEvent[], studyId: string): MovebankTrack[] {
  const byIndividual = new Map<string, MovebankTrack>();

  for (const event of events) {
    const individualId = asString(event["individual-local-identifier"]);
    const timestamp = asString(event.timestamp);
    const latitude = asNumber(event["location-lat"]);
    const longitude = asNumber(event["location-long"]);

    if (!individualId || !timestamp) {
      continue;
    }

    const trackId = `${studyId}:${individualId}`;
    const current = byIndividual.get(trackId) ?? {
      id: trackId,
      individualId,
      individualName: individualId,
      pointCount: 0,
      sourceName: "Movebank",
      speciesName: asString(event["taxon-canonical-name"]),
      studyId,
    };

    current.pointCount += 1;

    if (
      latitude !== undefined &&
      longitude !== undefined &&
      (!current.latestPoint || timestamp > current.latestPoint.timestamp)
    ) {
      current.latestPoint = {
        point: {
          latitude,
          longitude,
        },
        timestamp,
      };
    }

    byIndividual.set(trackId, current);
  }

  return Array.from(byIndividual.values());
}

function parseAndValidateQuery(url: URL, env: Env): RequestQuery {
  const params = url.searchParams;

  for (const key of params.keys()) {
    if (!allowedQueryKeys.has(key)) {
      throw new Error(`Unknown query parameter: ${key}`);
    }
  }

  const centerLat = Number(params.get("centerLat"));
  const centerLng = Number(params.get("centerLng"));
  const radiusKm = Number(params.get("radiusKm"));
  const daysBack = Number(params.get("daysBack"));
  const dateEnd = params.get("dateEnd") ?? "";

  if (!Number.isFinite(centerLat) || centerLat < -90 || centerLat > 90) {
    throw new Error("centerLat must be a valid latitude");
  }

  if (!Number.isFinite(centerLng) || centerLng < -180 || centerLng > 180) {
    throw new Error("centerLng must be a valid longitude");
  }

  const maxRadiusKm = Number(env.MAX_RADIUS_KM || "100");

  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > maxRadiusKm) {
    throw new Error(`radiusKm must be between 0 and ${maxRadiusKm}`);
  }

  const maxDaysBack = Number(env.MAX_DAYS_BACK || "30");

  if (!Number.isInteger(daysBack) || daysBack < 1 || daysBack > maxDaysBack) {
    throw new Error(`daysBack must be between 1 and ${maxDaysBack}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateEnd)) {
    throw new Error("dateEnd must be in YYYY-MM-DD format");
  }

  return {
    centerLat,
    centerLng,
    dateEnd,
    daysBack,
    radiusKm,
  };
}

function parseAllowlistedStudyIds(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function makeBbox(centerLat: number, centerLng: number, radiusKm: number): string {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos((centerLat * Math.PI) / 180), 0.2));

  const minLat = clamp(centerLat - latDelta, -90, 90);
  const maxLat = clamp(centerLat + latDelta, -90, 90);
  const minLng = clamp(centerLng - lngDelta, -180, 180);
  const maxLng = clamp(centerLng + lngDelta, -180, 180);

  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

function getStartDate(dateEndIso: string, daysBack: number): string {
  const endDate = new Date(`${dateEndIso}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() - daysBack);

  const yyyy = String(endDate.getUTCFullYear());
  const mm = String(endDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(endDate.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function json(payload: unknown, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
      ...extraHeaders,
    },
  });
}
