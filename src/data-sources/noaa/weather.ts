import type { CoastalLocation } from "../../domain/location/types";
import type { TideStation } from "../../domain/tide/types";
import type { MarineWeatherReport } from "../../domain/weather/types";
import { fetchNdbcWaveObservation } from "../ndbc/waves";
import { fetchCoopsObservationSummary } from "./observations";
import { fetchNwsWeatherForecast } from "../nws/weather";

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
  const [forecast, observations, waves] = await Promise.all([
    fetchNwsWeatherForecast({
      date,
      latitude: location.point.latitude,
      longitude: location.point.longitude,
    }),
    fetchOptional(() =>
      fetchCoopsObservationSummary({
        currentStationId: location.stationHints?.currentStationId,
        date,
        stationId: tideStation.id,
        stationName: tideStation.name,
      }),
    ),
    location.stationHints?.buoyStationId
      ? fetchOptional(() =>
          fetchNdbcWaveObservation({
            date,
            stationId: location.stationHints?.buoyStationId ?? "",
          }),
        )
      : Promise.resolve(undefined),
  ]);
  const unavailable = [
    observations?.windObservation ? undefined : "CO-OPS wind observation",
    observations?.waterTemperature ? undefined : "CO-OPS water temperature",
    observations?.currentObservation ? undefined : "CO-OPS current observation",
    waves ? undefined : "NDBC wave observation",
  ].filter((item): item is string => Boolean(item));

  return {
    date,
    hourlyForecast: forecast.hourlyForecast,
    locationId: location.id,
    sourceName: "NOAA / National Weather Service",
    stationNames: {
      current: location.stationHints?.currentStationId,
      water: tideStation.name,
      waves: location.stationHints?.buoyStationId,
      weather: forecast.stationName,
    },
    summary: forecast.summary,
    unavailable,
    currentObservation: observations?.currentObservation,
    waterTemperature: observations?.waterTemperature,
    waveObservation: waves,
    windObservation: observations?.windObservation,
  };
}

async function fetchOptional<T>(request: () => Promise<T>): Promise<T | undefined> {
  try {
    return await request();
  } catch {
    return undefined;
  }
}
