import { z } from "zod";
import type {
  CurrentObservation,
  WaterTemperatureObservation,
  WindObservation,
} from "../../domain/weather/types";
import { getJson } from "../shared/http";

const noaaWindRowSchema = z.object({
  t: z.string(),
  s: z.string().optional(),
  g: z.string().optional(),
  d: z.string().optional(),
  dr: z.string().optional(),
});

const noaaWaterTemperatureRowSchema = z.object({
  t: z.string(),
  v: z.string(),
});

const noaaCurrentRowSchema = z.object({
  t: z.string(),
  s: z.string().optional(),
  d: z.string().optional(),
  b: z.string().optional(),
});

const noaaWindSchema = z.object({
  data: z.array(noaaWindRowSchema),
});

const noaaWaterTemperatureSchema = z.object({
  data: z.array(noaaWaterTemperatureRowSchema),
});

const noaaCurrentSchema = z.object({
  data: z.array(noaaCurrentRowSchema),
});

export interface CoopsObservationRequest {
  currentStationId?: string;
  date: string;
  stationId: string;
  stationName: string;
}

export interface CoopsObservationSummary {
  currentObservation?: CurrentObservation;
  waterTemperature?: WaterTemperatureObservation;
  windObservation?: WindObservation;
}

const noaaDataGetterUrl = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const sourceName = "NOAA CO-OPS";

export async function fetchCoopsObservationSummary({
  currentStationId,
  date,
  stationId,
  stationName,
}: CoopsObservationRequest): Promise<CoopsObservationSummary> {
  const [wind, waterTemperature, current] = await Promise.allSettled([
    fetchWindObservation({ date, stationId, stationName }),
    fetchWaterTemperature({ date, stationId, stationName }),
    currentStationId
      ? fetchCurrentObservation({
          date,
          stationId: currentStationId,
          stationName: currentStationId,
        })
      : Promise.resolve(undefined),
  ]);

  return {
    currentObservation:
      current.status === "fulfilled" ? current.value : undefined,
    waterTemperature:
      waterTemperature.status === "fulfilled"
        ? waterTemperature.value
        : undefined,
    windObservation: wind.status === "fulfilled" ? wind.value : undefined,
  };
}

async function fetchWindObservation({
  date,
  stationId,
  stationName,
}: {
  date: string;
  stationId: string;
  stationName: string;
}): Promise<WindObservation | undefined> {
  const response = await getJson(
    buildCoopsUrl({ date, product: "wind", stationId }),
    noaaWindSchema,
  );
  const latest = getLatestRow(response.data);

  if (!latest) {
    return undefined;
  }

  return {
    at: latest.t,
    direction: latest.dr,
    directionDegrees: parseNumber(latest.d),
    gustKnots: parseNumber(latest.g),
    sourceName,
    speedKnots: parseNumber(latest.s),
    stationName,
  };
}

async function fetchWaterTemperature({
  date,
  stationId,
  stationName,
}: {
  date: string;
  stationId: string;
  stationName: string;
}): Promise<WaterTemperatureObservation | undefined> {
  const response = await getJson(
    buildCoopsUrl({ date, product: "water_temperature", stationId }),
    noaaWaterTemperatureSchema,
  );
  const latest = getLatestRow(response.data);
  const temperatureFahrenheit = parseNumber(latest?.v);

  if (!latest || temperatureFahrenheit === undefined) {
    return undefined;
  }

  return {
    at: latest.t,
    sourceName,
    stationName,
    temperatureFahrenheit,
  };
}

async function fetchCurrentObservation({
  date,
  stationId,
  stationName,
}: {
  date: string;
  stationId: string;
  stationName: string;
}): Promise<CurrentObservation | undefined> {
  const response = await getJson(
    buildCoopsUrl({ date, product: "currents", stationId }),
    noaaCurrentSchema,
  );
  const latest = getLatestRow(response.data);

  if (!latest) {
    return undefined;
  }

  return {
    at: latest.t,
    direction: latest.b,
    directionDegrees: parseNumber(latest.d),
    sourceName,
    speedKnots: parseNumber(latest.s),
    stationName,
  };
}

function buildCoopsUrl({
  date,
  product,
  stationId,
}: {
  date: string;
  product: "currents" | "water_temperature" | "wind";
  stationId: string;
}): string {
  const params = new URLSearchParams({
    begin_date: toNoaaDate(date),
    end_date: toNoaaDate(date),
    station: stationId,
    product,
    time_zone: "lst_ldt",
    units: "english",
    application: "OceanPlanner",
    format: "json",
  });

  if (product === "currents") {
    params.set("bin", "1");
  }

  return `${noaaDataGetterUrl}?${params.toString()}`;
}

function getLatestRow<T>(rows: T[]): T | undefined {
  return rows[rows.length - 1];
}

function parseNumber(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNoaaDate(date: string): string {
  return date.replaceAll("-", "");
}
