import type { CoastalLocation } from "../../domain/location/types";
import type {
  OceanConditionObservation,
  WaterDataError,
  WaterQualityReport,
  WaterQualitySample,
} from "../../domain/water/types";
import {
  isBacteriaParameter,
  WQP_BACTERIA_CHARACTERISTICS,
  WQP_CHEMISTRY_CHARACTERISTICS,
} from "./normalizeWqp";
import { SCCOOS_SCRIPPS_STATION } from "./normalizeSccoos";
import { fetchSccoosObservations } from "./sccoosClient";
import { buildWaterQualityInsights } from "./waterQualityInsights";
import {
  fetchWqpStations,
  fetchWqpResults,
  getLocationScopedWaterQualityBox,
  normalizeFetchedWqpResults,
} from "./wqpClient";

const advisoryPlaceholder = {
  status: "not_integrated" as const,
  sourceName: "County advisory",
  message: "Not integrated yet. Use county advisory sources for current closures or posted warnings.",
};

export interface WaterQualityReportRequest {
  date: string;
  location: CoastalLocation;
}

export async function fetchWaterQualityReport({
  date,
  location,
}: WaterQualityReportRequest): Promise<WaterQualityReport> {
  const bBox = getLocationScopedWaterQualityBox(location, 10);
  const startDateLo = toWqpDate(getDaysBefore(date, 120));
  const errors: WaterDataError[] = [];
  const unavailable: string[] = [];

  let stations = [SCCOOS_SCRIPPS_STATION];
  let wqpSamples: WaterQualitySample[] = [];
  let observations: OceanConditionObservation[] = [];

  try {
    const wqpStations = await fetchWqpStations({
      bBox,
    });

    stations = [...sortStationsByDistance(location, wqpStations).slice(0, 6), SCCOOS_SCRIPPS_STATION];

    const rows = await fetchWqpResults({
      bBox,
      characteristicNames: [
        ...WQP_BACTERIA_CHARACTERISTICS,
        ...WQP_CHEMISTRY_CHARACTERISTICS,
      ],
      limit: 250,
      mimeType: "csv",
      startDateLo,
    });

    wqpSamples = sortSamples(
      normalizeFetchedWqpResults({
        location,
        rows,
        stations,
      }),
    );

    if (wqpSamples.length === 0) {
      unavailable.push("No recent WQP samples in this search area");
    }
  } catch (error) {
    errors.push(toError("WQP", error));
    unavailable.push("WQP samples");
  }

  try {
    observations = await fetchSccoosObservations({
      responseFormat: "json",
      startTime: "now-3days",
    });

    if (observations.length === 0) {
      unavailable.push("SCCOOS observations");
    } else {
      stations = stations.map((station) =>
        station.stationId === SCCOOS_SCRIPPS_STATION.stationId
          ? {
              ...station,
              lastObservedAt: observations.at(-1)?.observedAt,
            }
          : station,
      );
    }
  } catch (error) {
    errors.push(toError("SCCOOS", error));
    unavailable.push("SCCOOS observations");
  }

  const recentBacteriaSamples = wqpSamples
    .filter((sample) => isBacteriaParameter(sample.normalizedParameter))
    .slice(0, 4);
  const recentChemistrySamples = wqpSamples
    .filter((sample) => !isBacteriaParameter(sample.normalizedParameter))
    .slice(0, 4);
  const insights = buildWaterQualityInsights({
    bacteriaSamples: recentBacteriaSamples,
    observations,
  });

  return {
    date,
    advisoryStatus: advisoryPlaceholder,
    stations,
    wqpSamples,
    recentBacteriaSamples,
    recentChemistrySamples,
    latestOceanObservation: observations.at(-1),
    recentOceanObservations: observations,
    insights,
    errors,
    unavailable,
  };
}

function sortStationsByDistance(location: CoastalLocation, stations: typeof SCCOOS_SCRIPPS_STATION[]) {
  return [...stations].sort((left, right) => {
    const leftDistance = getDistance(location, left);
    const rightDistance = getDistance(location, right);
    return leftDistance - rightDistance;
  });
}

function sortSamples(samples: WaterQualitySample[]) {
  return [...samples].sort((left, right) => {
    const leftTime = Date.parse(left.sampleDateTime ?? left.sampleDate ?? "");
    const rightTime = Date.parse(right.sampleDateTime ?? right.sampleDate ?? "");

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return (left.distanceKm ?? Number.POSITIVE_INFINITY) - (right.distanceKm ?? Number.POSITIVE_INFINITY);
  });
}

function getDaysBefore(isoDate: string, days: number) {
  const reference = new Date(`${isoDate}T12:00:00`);

  if (Number.isNaN(reference.getTime())) {
    return new Date();
  }

  reference.setDate(reference.getDate() - days);
  return reference;
}

function toWqpDate(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${month}-${day}-${value.getFullYear()}`;
}

function toError(source: "WQP" | "SCCOOS", error: unknown): WaterDataError {
  if (
    error &&
    typeof error === "object" &&
    "source" in error &&
    "message" in error &&
    "retryable" in error
  ) {
    return error as WaterDataError;
  }

  return {
    source,
    message: error instanceof Error ? error.message : `Unknown ${source} failure.`,
    retryable: true,
  };
}

function getDistance(location: CoastalLocation, station: { latitude: number; longitude: number }) {
  const latitudeDelta = location.point.latitude - station.latitude;
  const longitudeDelta = location.point.longitude - station.longitude;
  return latitudeDelta ** 2 + longitudeDelta ** 2;
}
