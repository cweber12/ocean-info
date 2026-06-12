import { z } from "zod";
import type {
  HeaderWeatherSummary,
  HourlyWeatherPoint,
  WindObservation,
} from "../../domain/weather/types";
import { getJson } from "../shared/http";

const defaultWeatherProxyPath = "/api/weather";

const openWeatherPointSchema = z.object({
  at: z.string(),
  airTemperatureFahrenheit: z.number().optional(),
  precipitationChancePercent: z.number().optional(),
  relativeHumidityPercent: z.number().optional(),
  shortForecast: z.string().optional(),
  sourceName: z.string(),
  windDirection: z.string().optional(),
  windDirectionDegrees: z.number().optional(),
  windGustMph: z.number().optional(),
  windSpeedMph: z.number().optional(),
});

const openWeatherSummarySchema = z.object({
  shortForecast: z.string().optional(),
  temperatureFahrenheit: z.number().optional(),
  windDirection: z.string().optional(),
  windSpeedMph: z.number().optional(),
});

const openWeatherWindObservationSchema = z.object({
  at: z.string(),
  direction: z.string().optional(),
  directionDegrees: z.number().optional(),
  gustKnots: z.number().optional(),
  sourceName: z.string(),
  speedKnots: z.number().optional(),
  stationName: z.string(),
});

const openWeatherFallbackSchema = z.object({
  sourceName: z.string().default("OpenWeather"),
  stationName: z.string(),
  hourlyForecast: z.array(openWeatherPointSchema).default([]),
  summary: openWeatherSummarySchema.optional(),
  windObservation: openWeatherWindObservationSchema.optional(),
});

export interface OpenWeatherFallbackRequest {
  date: string;
  latitude: number;
  longitude: number;
}

export interface OpenWeatherFallback {
  hourlyForecast: HourlyWeatherPoint[];
  sourceName: string;
  stationName: string;
  summary?: HeaderWeatherSummary;
  windObservation?: WindObservation;
}

export async function fetchOpenWeatherFallback({
  date,
  latitude,
  longitude,
}: OpenWeatherFallbackRequest): Promise<OpenWeatherFallback> {
  const payload = await getJson(
    buildOpenWeatherFallbackUrl({ date, latitude, longitude }),
    openWeatherFallbackSchema,
  );

  return {
    hourlyForecast: payload.hourlyForecast ?? [],
    sourceName: payload.sourceName ?? "OpenWeather",
    stationName: payload.stationName,
    summary: payload.summary,
    windObservation: payload.windObservation,
  };
}

function buildOpenWeatherFallbackUrl({
  date,
  latitude,
  longitude,
}: OpenWeatherFallbackRequest): string {
  const params = new URLSearchParams({
    date,
    latitude: String(latitude),
    longitude: String(longitude),
  });

  const baseUrl =
    import.meta.env.VITE_WEATHER_PROXY_BASE_URL?.trim() || defaultWeatherProxyPath;

  return `${baseUrl.replace(/\/$/, "")}/fallback?${params.toString()}`;
}
