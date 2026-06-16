interface Env {
  MOVEBANK_BASE_URL: string;
  MOVEBANK_PASSWORD: string;
  MOVEBANK_STUDY_IDS: string;
  MOVEBANK_USERNAME: string;
  OPEN_WEATHER_KEY?: string;
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

interface WeatherFallbackQuery {
  date: string;
  latitude: number;
  longitude: number;
}

interface WeatherFallbackResponse {
  hourlyForecast: Array<{
    at: string;
    airTemperatureFahrenheit?: number;
    precipitationChancePercent?: number;
    relativeHumidityPercent?: number;
    shortForecast?: string;
    sourceName: string;
    windDirection?: string;
    windDirectionDegrees?: number;
    windGustMph?: number;
    windSpeedMph?: number;
  }>;
  sourceName: "OpenWeather";
  stationName: string;
  summary?: {
    shortForecast?: string;
    temperatureFahrenheit?: number;
    windDirection?: string;
    windSpeedMph?: number;
  };
  windObservation?: {
    at: string;
    direction?: string;
    directionDegrees?: number;
    gustKnots?: number;
    sourceName: string;
    speedKnots?: number;
    stationName: string;
  };
}

const allowedQueryKeys = new Set([
  "centerLat",
  "centerLng",
  "dateEnd",
  "daysBack",
  "radiusKm",
]);

const weatherQueryKeys = new Set(["date", "latitude", "longitude"]);

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

    if (url.pathname.endsWith("/tracks")) {
      return handleTracksRequest(url, request, env);
    }

    if (url.pathname.endsWith("/fallback")) {
      return handleWeatherFallbackRequest(url, env);
    }

    return json({ error: "Not found" }, 404);
  },
};

async function handleTracksRequest(
  url: URL,
  request: Request,
  env: Env,
): Promise<Response> {
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
    const message = error instanceof Error ? error.message : String(error);
    console.error("Movebank fetch failed", message);
    return json({ error: `Movebank upstream request failed: ${message}` }, 502);
  }
}

async function handleWeatherFallbackRequest(
  url: URL,
  env: Env,
): Promise<Response> {
  if (!env.OPEN_WEATHER_KEY) {
    return json({ error: "OPEN_WEATHER_KEY is not configured" }, 503);
  }

  let query: WeatherFallbackQuery;

  try {
    query = parseAndValidateWeatherQuery(url);
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Invalid request",
      },
      400,
    );
  }

  if (!isWithinOpenWeatherWindow(query.date)) {
    return json(
      {
        error: "date must be from today through 5 days ahead",
      },
      400,
    );
  }

  try {
    const fallback = await fetchOpenWeatherFallback(query, env.OPEN_WEATHER_KEY);
    return json(fallback, 200, {
      "cache-control": "public, max-age=300, stale-while-revalidate=600",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("OpenWeather fetch failed", message);
    return json({ error: `OpenWeather upstream request failed: ${message}` }, 502);
  }
}

async function fetchOpenWeatherFallback(
  query: WeatherFallbackQuery,
  apiKey: string,
): Promise<WeatherFallbackResponse> {
  const upstreamUrl = new URL("https://api.openweathermap.org/data/2.5/forecast");
  upstreamUrl.searchParams.set("lat", query.latitude.toFixed(4));
  upstreamUrl.searchParams.set("lon", query.longitude.toFixed(4));
  upstreamUrl.searchParams.set("appid", apiKey);
  upstreamUrl.searchParams.set("units", "imperial");

  const response = await fetch(upstreamUrl);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upstream status ${response.status}: ${body.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    city?: {
      country?: string;
      name?: string;
      timezone?: number;
    };
    list?: Array<{
      dt?: number;
      main?: {
        humidity?: number;
        temp?: number;
      };
      pop?: number;
      weather?: Array<{ description?: string }>;
      wind?: {
        deg?: number;
        gust?: number;
        speed?: number;
      };
    }>;
  };

  const timezoneOffsetSeconds = payload.city?.timezone ?? 0;
  const stationSuffix = [payload.city?.name, payload.city?.country]
    .filter((item): item is string => Boolean(item && item.trim()))
    .join(", ");
  const stationName =
    stationSuffix.length > 0
      ? `OpenWeather ${stationSuffix}`
      : `OpenWeather ${query.latitude.toFixed(2)},${query.longitude.toFixed(2)}`;
  const hourlyForecast = (payload.list ?? [])
    .map((entry) => toFallbackPoint(entry, timezoneOffsetSeconds))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((point) => point.at.slice(0, 10) === query.date);

  const summaryPoint = getSummaryPoint(hourlyForecast, query.date);

  return {
    sourceName: "OpenWeather",
    stationName,
    hourlyForecast,
    summary: summaryPoint
      ? {
          shortForecast: summaryPoint.shortForecast,
          temperatureFahrenheit: summaryPoint.airTemperatureFahrenheit,
          windDirection: summaryPoint.windDirection,
          windSpeedMph: summaryPoint.windSpeedMph,
        }
      : undefined,
    windObservation: summaryPoint
      ? {
          at: summaryPoint.at,
          direction: summaryPoint.windDirection,
          directionDegrees: summaryPoint.windDirectionDegrees,
          gustKnots:
            summaryPoint.windGustMph !== undefined
              ? mphToKnots(summaryPoint.windGustMph)
              : undefined,
          sourceName: "OpenWeather",
          speedKnots:
            summaryPoint.windSpeedMph !== undefined
              ? mphToKnots(summaryPoint.windSpeedMph)
              : undefined,
          stationName,
        }
      : undefined,
  };
}

function toFallbackPoint(
  entry: {
    dt?: number;
    main?: {
      humidity?: number;
      temp?: number;
    };
    pop?: number;
    weather?: Array<{ description?: string }>;
    wind?: {
      deg?: number;
      gust?: number;
      speed?: number;
    };
  },
  timezoneOffsetSeconds: number,
) {
  if (typeof entry.dt !== "number") {
    return undefined;
  }

  const at = toIsoWithOffset(entry.dt, timezoneOffsetSeconds);
  const directionDegrees = asNumber(entry.wind?.deg);

  return {
    at,
    airTemperatureFahrenheit: asNumber(entry.main?.temp),
    precipitationChancePercent:
      typeof entry.pop === "number" ? Math.round(entry.pop * 100) : undefined,
    relativeHumidityPercent: asNumber(entry.main?.humidity),
    shortForecast: asString(entry.weather?.[0]?.description),
    sourceName: "OpenWeather",
    windDirection: toCardinal(directionDegrees),
    windDirectionDegrees: directionDegrees,
    windGustMph: asNumber(entry.wind?.gust),
    windSpeedMph: asNumber(entry.wind?.speed),
  };
}

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
    // Movebank direct-read returns CSV; bbox filtering is not supported for events
    // so we fetch the date-windowed events and filter to bbox in the Worker.
    const upstreamUrl = new URL("/movebank/service/direct-read", upstreamBaseUrl);
    upstreamUrl.searchParams.set("entity_type", "event");
    upstreamUrl.searchParams.set("study_id", studyId);
    upstreamUrl.searchParams.set("attributes", "individual_local_identifier,timestamp,location_lat,location_long,taxon_canonical_name");
    upstreamUrl.searchParams.set("timestamp_start", `${startDate} 00:00:00.000`);
    upstreamUrl.searchParams.set("timestamp_end", `${query.dateEnd} 23:59:59.000`);

    const response = await fetch(upstreamUrl, {
      headers: {
        authorization: authHeader,
        "user-agent": request.headers.get("user-agent") ?? "OceanPlannerMovebankWorker/1.0",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Upstream status ${response.status}: ${body.slice(0, 200)}`);
    }

    const csv = await response.text();
    const events = parseCsvEvents(csv);
    const bboxed = filterByBbox(events, bbox);
    const normalizedTracks = normalizeEventsToTracks(bboxed, studyId);
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

type MovebankEvent = Record<string, string>;

function parseCsvEvents(csv: string): MovebankEvent[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const events: MovebankEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row: MovebankEvent = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j].replace(/^"|"$/g, "").trim();
    }
    events.push(row);
  }

  return events;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function filterByBbox(events: MovebankEvent[], bbox: ReturnType<typeof parseBbox>): MovebankEvent[] {
  return events.filter((event) => {
    const lat = Number(event["location_lat"] ?? event["location-lat"]);
    const lng = Number(event["location_long"] ?? event["location-long"]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng;
  });
}

function normalizeEventsToTracks(events: MovebankEvent[], studyId: string): MovebankTrack[] {
  const byIndividual = new Map<string, MovebankTrack>();

  for (const event of events) {
    // Movebank CSV uses underscores in attribute names
    const individualId =
      event["individual_local_identifier"] ??
      event["individual-local-identifier"] ??
      "";
    const timestamp = event["timestamp"] ?? "";
    const latitude = asNumber(event["location_lat"] ?? event["location-lat"]);
    const longitude = asNumber(event["location_long"] ?? event["location-long"]);
    const species =
      event["taxon_canonical_name"] ??
      event["taxon-canonical-name"] ??
      undefined;

    if (!individualId || !timestamp) continue;

    const trackId = `${studyId}:${individualId}`;
    const existing = byIndividual.get(trackId);
    const current: MovebankTrack = existing ?? {
      id: trackId,
      individualId,
      individualName: individualId,
      pointCount: 0,
      speciesName: species || undefined,
      studyId,
    };

    current.pointCount += 1;

    if (
      latitude !== undefined &&
      longitude !== undefined &&
      (!current.latestPoint || timestamp > current.latestPoint.timestamp)
    ) {
      current.latestPoint = {
        point: { latitude, longitude },
        timestamp,
      };
    }

    byIndividual.set(trackId, current);
  }

  return Array.from(byIndividual.values());
}

function parseAndValidateQuery(url: URL, env: Env): RequestQuery {
  const params = url.searchParams;

  // Validate that no unexpected parameters are present.
  // URLSearchParams.keys() is not iterable in the Workers type lib so we
  // build a string from the raw query and check against the allowlist.
  const rawSearch = url.search.replace(/^\?/, "");
  for (const pair of rawSearch.split("&")) {
    const key = pair.split("=")[0];
    if (key && !allowedQueryKeys.has(decodeURIComponent(key))) {
      throw new Error(`Unknown query parameter: ${decodeURIComponent(key)}`);
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

function parseAndValidateWeatherQuery(url: URL): WeatherFallbackQuery {
  const params = url.searchParams;

  const rawSearch = url.search.replace(/^\?/, "");
  for (const pair of rawSearch.split("&")) {
    const key = pair.split("=")[0];
    if (key && !weatherQueryKeys.has(decodeURIComponent(key))) {
      throw new Error(`Unknown query parameter: ${decodeURIComponent(key)}`);
    }
  }

  const latitude = Number(params.get("latitude"));
  const longitude = Number(params.get("longitude"));
  const date = params.get("date") ?? "";

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("latitude must be a valid latitude");
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("longitude must be a valid longitude");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date must be in YYYY-MM-DD format");
  }

  return {
    date,
    latitude,
    longitude,
  };
}

function parseAllowlistedStudyIds(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function makeBbox(centerLat: number, centerLng: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos((centerLat * Math.PI) / 180), 0.2));

  return {
    minLat: clamp(centerLat - latDelta, -90, 90),
    maxLat: clamp(centerLat + latDelta, -90, 90),
    minLng: clamp(centerLng - lngDelta, -180, 180),
    maxLng: clamp(centerLng + lngDelta, -180, 180),
  };
}

const parseBbox = makeBbox;

function getStartDate(dateEndIso: string, daysBack: number): string {
  const endDate = new Date(`${dateEndIso}T00:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() - daysBack);

  const yyyy = String(endDate.getUTCFullYear());
  const mm = String(endDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(endDate.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function isWithinOpenWeatherWindow(date: string): boolean {
  const target = new Date(`${date}T00:00:00Z`);
  const today = new Date();
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const min = new Date(base);

  const max = new Date(base);
  max.setUTCDate(max.getUTCDate() + 5);

  return target >= min && target <= max;
}

function toIsoWithOffset(unixSeconds: number, timezoneOffsetSeconds: number): string {
  const utcMillis = unixSeconds * 1000;
  const localMillis = utcMillis + timezoneOffsetSeconds * 1000;
  const isoLocal = new Date(localMillis).toISOString().slice(0, 19);

  const sign = timezoneOffsetSeconds >= 0 ? "+" : "-";
  const abs = Math.abs(timezoneOffsetSeconds);
  const hours = String(Math.floor(abs / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((abs % 3600) / 60)).padStart(2, "0");

  return `${isoLocal}${sign}${hours}:${minutes}`;
}

function toCardinal(directionDegrees?: number): string | undefined {
  if (directionDegrees === undefined) {
    return undefined;
  }

  const normalized = ((directionDegrees % 360) + 360) % 360;
  const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(normalized / 45) % labels.length;
  return labels[index];
}

function mphToKnots(speedMph: number): number {
  return Number((speedMph * 0.868976).toFixed(2));
}

function getSummaryPoint<T extends { at: string }>(
  points: T[],
  date: string,
): T | undefined {
  if (points.length === 0) {
    return undefined;
  }

  const now = new Date();

  if (date !== now.toISOString().slice(0, 10)) {
    return points[0];
  }

  return points.find((point) => new Date(point.at) >= now) ?? points[0];
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
