import type { CoastalLocation } from "../../domain/location/types";
import type { TideStation } from "../../domain/tide/types";
import type {
  HeaderWeatherSummary,
  HourlyWeatherPoint,
  MarineWeatherReport,
  WindObservation,
} from "../../domain/weather/types";
import { fetchNdbcWaveObservation } from "../ndbc/waves";
import { fetchCoopsObservationSummary } from "./observations";
import { fetchNwsWeatherForecast } from "../nws/weather";
import { fetchOpenWeatherFallback } from "../open-weather/weather";

export interface MarineWeatherReportRequest {
  date: string;
  location: CoastalLocation;
  tideStation: TideStation;
}

export async function fetchMarineWeatherReport({
  date,
  location,
  tideStation,
}: MarineWeatherReportRequest): Promise<MarineWeatherReport> {
  const weatherPoint = location.stationHints?.weatherPoint ?? location.point;

  const [forecast, fallbackWeather, observations, waves] = await Promise.all([
    fetchOptional("NWS forecast", () =>
      fetchNwsWeatherForecast({
        date,
        latitude: weatherPoint.latitude,
        longitude: weatherPoint.longitude,
      }),
    ),
    fetchOptional("OpenWeather fallback", () =>
      fetchOpenWeatherFallback({
        date,
        latitude: location.point.latitude,
        longitude: location.point.longitude,
      }),
    ),
    fetchOptional("NOAA observations", () =>
      fetchCoopsObservationSummary({
        currentStationId: location.stationHints?.currentStationId,
        date,
        stationId: tideStation.id,
        stationName: tideStation.name,
      }),
    ),
    location.stationHints?.buoyStationId
      ? fetchOptional("NDBC waves", () =>
          fetchNdbcWaveObservation({
            date,
            stationId: location.stationHints?.buoyStationId ?? "",
          }),
        )
      : Promise.resolve(undefined),
  ]);

  const hourlyForecast = mergeHourlyForecast(
    forecast?.hourlyForecast,
    fallbackWeather?.hourlyForecast,
  );
  const summary = mergeSummary(forecast?.summary, fallbackWeather?.summary);
  const windObservation = mergeWindObservation(
    observations?.windObservation,
    fallbackWeather?.windObservation,
  );
  const weatherSourceName = getWeatherSourceName({
    fallbackUsed: Boolean(fallbackWeather),
    nwsUsed: Boolean(forecast),
  });

  const unavailable = [
    windObservation ? undefined : "Wind observation",
    observations?.waterTemperature ? undefined : "CO-OPS water temperature",
    observations?.currentObservation ? undefined : "CO-OPS current observation",
    hourlyForecast.length > 0 || summary ? undefined : "Hourly weather forecast",
    waves ? undefined : "NDBC wave observation",
  ].filter((item): item is string => Boolean(item));

  return {
    date,
    hourlyForecast,
    locationId: location.id,
    sourceName: weatherSourceName,
    stationNames: {
      current: location.stationHints?.currentStationId,
      water: tideStation.name,
      waves: location.stationHints?.buoyStationId,
      weather: forecast?.stationName ?? fallbackWeather?.stationName,
    },
    summary,
    unavailable,
    currentObservation: observations?.currentObservation,
    waterTemperature: observations?.waterTemperature,
    waveObservation: waves,
    windObservation,
  };
}

function mergeHourlyForecast(
  primary?: HourlyWeatherPoint[],
  fallback?: HourlyWeatherPoint[],
): HourlyWeatherPoint[] {
  if (!primary?.length) {
    return fallback ?? [];
  }

  if (!fallback?.length) {
    return primary;
  }

  const byTime = new Map(primary.map((point) => [point.at, point]));

  for (const point of fallback) {
    if (!byTime.has(point.at)) {
      byTime.set(point.at, point);
    }
  }

  return Array.from(byTime.values()).sort((a, b) => a.at.localeCompare(b.at));
}

function mergeSummary(
  primary?: HeaderWeatherSummary,
  fallback?: HeaderWeatherSummary,
): HeaderWeatherSummary | undefined {
  if (!primary) {
    return fallback;
  }

  return {
    shortForecast: primary.shortForecast ?? fallback?.shortForecast,
    temperatureFahrenheit:
      primary.temperatureFahrenheit ?? fallback?.temperatureFahrenheit,
    windDirection: primary.windDirection ?? fallback?.windDirection,
    windSpeedMph: primary.windSpeedMph ?? fallback?.windSpeedMph,
  };
}

function mergeWindObservation(
  primary?: WindObservation,
  fallback?: WindObservation,
): WindObservation | undefined {
  return primary ?? fallback;
}

function getWeatherSourceName({
  fallbackUsed,
  nwsUsed,
}: {
  fallbackUsed: boolean;
  nwsUsed: boolean;
}): string {
  if (nwsUsed && fallbackUsed) {
    return "NOAA / National Weather Service + OpenWeather";
  }

  if (nwsUsed) {
    return "NOAA / National Weather Service";
  }

  if (fallbackUsed) {
    return "OpenWeather";
  }

  return "Weather unavailable";
}

async function fetchOptional<T>(
  label: string,
  request: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await request();
  } catch (error) {
    console.warn(
      `[marine-weather] ${label} failed`,
      error instanceof Error ? error.message : error,
    );
    return undefined;
  }
}
