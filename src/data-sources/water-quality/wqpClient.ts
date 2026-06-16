import { z } from "zod";
import type { CoastalLocation } from "../../domain/location/types";
import type { MonitoringStation, WaterQualitySample } from "../../domain/water/types";
import { createBoundingBox, formatBoundingBox, type BoundingBox } from "./geo";
import { debugRequest, fetchTextWithTimeout } from "./http";
import { normalizeWqpResults, normalizeWqpStations } from "./normalizeWqp";
import { createCacheKey, getCachedValue } from "./waterQualityCache";

const WQP_BASE_URL = "https://www.waterqualitydata.us/data";
const WQP_STATION_TTL_MS = 24 * 60 * 60 * 1000;
const WQP_RESULTS_TTL_MS = 3 * 60 * 60 * 1000;

const stationCollectionSchema = z.object({
  features: z.array(
    z.object({
      geometry: z
        .object({
          coordinates: z.tuple([z.number(), z.number()]),
        })
        .nullable()
        .optional(),
      properties: z.record(z.string(), z.string().optional()),
    }),
  ),
});

export interface WqpStationSearchOptions {
  bBox?: BoundingBox;
  mimeType?: "json" | "geojson" | "csv";
  organizationId?: string;
  siteType?: string;
  characteristicName?: string;
}

export interface WqpResultSearchOptions {
  bBox?: BoundingBox;
  characteristicNames?: string[];
  startDateLo?: string;
  startDateHi?: string;
  siteId?: string;
  organizationId?: string;
  mimeType?: "json" | "csv";
  limit?: number;
}

export async function fetchWqpStations(
  options: WqpStationSearchOptions = {},
): Promise<MonitoringStation[]> {
  const url = buildWqpStationUrl(options);
  const cacheKey = createCacheKey("wqp-stations", url);

  return getCachedValue(cacheKey, WQP_STATION_TTL_MS, async () => {
    debugRequest("WQP", url);
    const response = await fetch(url);

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        detail
          ? `WQP station request failed with ${response.status}: ${detail}`
          : `WQP station request failed with ${response.status}.`,
      );
    }

    const payload = stationCollectionSchema.parse(await response.json());
    return normalizeWqpStations(payload.features);
  });
}

export async function fetchWqpResults({
  characteristicNames = [],
  limit,
  ...options
}: WqpResultSearchOptions & {
  location?: CoastalLocation;
  stations?: MonitoringStation[];
}): Promise<Record<string, string>[]> {
  const requests = characteristicNames.length > 0 ? characteristicNames : [undefined];

  const batches = await Promise.all(
    requests.map(async (characteristicName) => {
      const url = buildWqpResultUrl({
        ...options,
        characteristicName,
      });
      const cacheKey = createCacheKey("wqp-results", url);

      return getCachedValue(cacheKey, WQP_RESULTS_TTL_MS, async () => {
        debugRequest("WQP", url);
        const csv = await fetchTextWithTimeout({
          source: "WQP",
          url,
        });
        return parseCsv(csv);
      });
    }),
  );

  const rows = batches.flat();
  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export function normalizeFetchedWqpResults({
  location,
  rows,
  stations,
}: {
  location: CoastalLocation;
  rows: Record<string, string>[];
  stations: MonitoringStation[];
}): WaterQualitySample[] {
  return normalizeWqpResults(rows, stations, location);
}

export function buildWqpStationUrl(options: WqpStationSearchOptions = {}) {
  const params = new URLSearchParams();
  params.set("mimeType", options.mimeType ?? "geojson");
  params.set(
    "bBox",
    formatBoundingBox(
      options.bBox ?? {
        west: -117.45,
        south: 32.52,
        east: -116.9,
        north: 33.3,
      },
    ),
  );

  if (options.organizationId) {
    params.set("organizationIdentifier", options.organizationId);
  }

  if (options.siteType) {
    params.set("siteType", options.siteType);
  }

  if (options.characteristicName) {
    params.set("characteristicName", options.characteristicName);
  }

  return `${WQP_BASE_URL}/Station/search?${params.toString()}`;
}

export function buildWqpResultUrl(
  options: WqpResultSearchOptions & {
    characteristicName?: string;
  } = {},
) {
  const params = new URLSearchParams();
  params.set("mimeType", options.mimeType ?? "csv");

  if (options.bBox) {
    params.set("bBox", formatBoundingBox(options.bBox));
  }

  if (options.characteristicName) {
    params.set("characteristicName", options.characteristicName);
  }

  if (options.startDateLo) {
    params.set("startDateLo", options.startDateLo);
  }

  if (options.startDateHi) {
    params.set("startDateHi", options.startDateHi);
  }

  if (options.siteId) {
    params.set("siteid", options.siteId);
  }

  if (options.organizationId) {
    params.set("organizationIdentifier", options.organizationId);
  }

  if (typeof options.limit === "number") {
    params.set("limit", String(options.limit));
  }

  return `${WQP_BASE_URL}/Result/search?${params.toString()}`;
}

export function getLocationScopedWaterQualityBox(location: CoastalLocation, radiusKm = 10) {
  return createBoundingBox(location.point, radiusKm);
}

function parseCsv(csvText: string): Record<string, string>[] {
  const rows = parseCsvRows(csvText.trim());

  if (rows.length <= 1) {
    return [];
  }

  const [headers, ...records] = rows;

  return records
    .filter((record) => record.some((value) => value.length > 0))
    .map((record) => {
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = record[index] ?? "";
      });

      return row;
    });
}

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let isQuoted = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === "\"") {
      if (isQuoted && nextCharacter === "\"") {
        cell += "\"";
        index += 1;
      } else {
        isQuoted = !isQuoted;
      }
      continue;
    }

    if (character === "," && !isQuoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !isQuoted) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}
