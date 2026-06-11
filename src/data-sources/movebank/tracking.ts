import { z } from "zod";
import type {
  AnimalTrack,
  AnimalTrackingReport,
  AnimalTrackingSearch,
} from "../../domain/animal-tracking/types";
import { getJson } from "../shared/http";

const defaultProxyPath = "/api/movebank";

const trackSchema = z.object({
  id: z.string(),
  individualId: z.string().optional(),
  individualName: z.string().optional(),
  latestPoint: z
    .object({
      point: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      timestamp: z.string(),
    })
    .optional(),
  pointCount: z.number().nonnegative(),
  speciesName: z.string().optional(),
  studyId: z.string(),
  studyName: z.string().optional(),
});

const tracksResponseSchema = z.object({
  sourceName: z.string().default("Movebank"),
  totalTracks: z.number().nonnegative().default(0),
  tracks: z.array(trackSchema).default([]),
});

export async function fetchMovebankAnimalTracks(
  search: AnimalTrackingSearch,
): Promise<AnimalTrackingReport> {
  const payload = await getJson(buildTracksUrl(search), tracksResponseSchema);

  return {
    search,
    sourceName: payload.sourceName ?? "Movebank",
    totalTracks: payload.totalTracks ?? payload.tracks?.length ?? 0,
    tracks: (payload.tracks ?? []).map(mapTrack),
  };
}

function mapTrack(track: z.infer<typeof trackSchema>): AnimalTrack {
  return {
    id: track.id,
    individualId: track.individualId,
    individualName: track.individualName,
    latestPoint: track.latestPoint,
    pointCount: track.pointCount,
    sourceName: "Movebank",
    speciesName: track.speciesName,
    studyId: track.studyId,
    studyName: track.studyName,
  };
}

function buildTracksUrl(search: AnimalTrackingSearch): string {
  const params = new URLSearchParams({
    centerLat: String(search.center.latitude),
    centerLng: String(search.center.longitude),
    dateEnd: search.dateEnd,
    daysBack: String(search.daysBack),
    radiusKm: String(search.radiusKm),
  });

  const baseUrl =
    import.meta.env.VITE_MOVEBANK_PROXY_BASE_URL?.trim() || defaultProxyPath;

  return `${baseUrl.replace(/\/$/, "")}/tracks?${params.toString()}`;
}
