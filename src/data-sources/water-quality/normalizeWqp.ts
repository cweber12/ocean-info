import { z } from "zod";
import type { CoastalLocation } from "../../domain/location/types";
import type {
  MonitoringStation,
  WaterQualityParameter,
  WaterQualitySample,
} from "../../domain/water/types";
import { getDistanceKm } from "./geo";

const wqpResultRowSchema = z
  .object({
    ActivityMediaName: z.string().optional(),
    ActivityStartDate: z.string().optional(),
    CharacteristicName: z.string(),
    MonitoringLocationIdentifier: z.string().optional(),
    OrganizationFormalName: z.string().optional(),
    OrganizationIdentifier: z.string().optional(),
    ProviderName: z.string().optional(),
    ResultDetectionConditionText: z.string().optional(),
    ResultMeasureValue: z.string().optional(),
    ResultStatusIdentifier: z.string().optional(),
    "ActivityStartTime/Time": z.string().optional(),
    "ActivityStartTime/TimeZoneCode": z.string().optional(),
    "ResultMeasure/MeasureUnitCode": z.string().optional(),
  })
  .passthrough();

export const WQP_CHARACTERISTICS = [
  "Enterococcus",
  "Escherichia coli",
  "Fecal Coliform",
  "Total Coliform",
  "Temperature, water",
  "pH",
  "Dissolved oxygen (DO)",
  "Turbidity",
  "Salinity",
  "Specific conductance",
  "Nitrate",
  "Nitrite",
  "Phosphate",
  "Chlorophyll a",
] as const;

export const WQP_BACTERIA_CHARACTERISTICS = [
  "Enterococcus",
  "Escherichia coli",
  "Fecal Coliform",
  "Total Coliform",
] as const;

export const WQP_CHEMISTRY_CHARACTERISTICS = [
  "Temperature, water",
  "pH",
  "Dissolved oxygen (DO)",
  "Turbidity",
  "Salinity",
  "Specific conductance",
  "Nitrate",
  "Nitrite",
  "Phosphate",
  "Chlorophyll a",
] as const;

export function normalizeWqpStations(
  features: Array<{
    geometry?: {
      coordinates?: [number, number];
    } | null;
    properties: Record<string, string | undefined>;
  }>,
): MonitoringStation[] {
  const stations = features
    .map((feature): MonitoringStation | undefined => {
      const coordinates = feature.geometry?.coordinates;

      if (!coordinates) {
        return undefined;
      }

      const availableParameters = inferAvailableParameters(feature.properties);

      return {
        source: "WQP" as const,
        stationId:
          feature.properties.MonitoringLocationIdentifier ??
          feature.properties.MonitoringLocationName ??
          `${coordinates[1]}:${coordinates[0]}`,
        name:
          feature.properties.MonitoringLocationName ??
          feature.properties.MonitoringLocationIdentifier ??
          "Unnamed monitoring station",
        latitude: coordinates[1],
        longitude: coordinates[0],
        waterbody: feature.properties.CountyName,
        siteType:
          feature.properties.ResolvedMonitoringLocationTypeName ??
          feature.properties.MonitoringLocationTypeName,
        provider: feature.properties.ProviderName,
        availableParameters,
        raw: feature,
      };
    })
    .filter(isDefined);

  return stations;
}

export function normalizeWqpResults(
  rows: Record<string, string>[],
  stations: MonitoringStation[],
  location: CoastalLocation,
): WaterQualitySample[] {
  const stationMap = new Map(stations.map((station) => [station.stationId, station]));

  return rows
    .map((row) => {
      const parsed = wqpResultRowSchema.parse(row);
      const station = parsed.MonitoringLocationIdentifier
        ? stationMap.get(parsed.MonitoringLocationIdentifier)
        : undefined;
      const value = toNumber(parsed.ResultMeasureValue);
      const sampleDateTime = toSampleDateTime(
        parsed.ActivityStartDate,
        parsed["ActivityStartTime/Time"],
        parsed["ActivityStartTime/TimeZoneCode"],
      );

      return {
        source: "WQP" as const,
        provider: parsed.ProviderName,
        organizationId: parsed.OrganizationIdentifier,
        organizationName: parsed.OrganizationFormalName,
        stationId: parsed.MonitoringLocationIdentifier,
        stationName: station?.name,
        stationType: station?.siteType,
        latitude: station?.latitude,
        longitude: station?.longitude,
        sampleDate: parsed.ActivityStartDate,
        sampleTime: parsed["ActivityStartTime/Time"],
        sampleDateTime,
        characteristicName: parsed.CharacteristicName,
        normalizedParameter: mapWqpCharacteristicName(parsed.CharacteristicName),
        value,
        rawValue: parsed.ResultMeasureValue,
        unit: parsed["ResultMeasure/MeasureUnitCode"],
        resultDetectionCondition: parsed.ResultDetectionConditionText,
        resultStatusIdentifier: parsed.ResultStatusIdentifier,
        sampleMedia: parsed.ActivityMediaName,
        distanceKm:
          station &&
          getDistanceKm(location.point, {
            latitude: station.latitude,
            longitude: station.longitude,
          }),
        raw: row,
      } satisfies WaterQualitySample;
    })
    .filter((sample) => Boolean(sample.stationId || sample.characteristicName));
}

export function mapWqpCharacteristicName(characteristicName: string): WaterQualityParameter {
  const normalized = characteristicName.trim().toLowerCase();

  if (normalized.includes("enterococcus")) {
    return "enterococcus";
  }

  if (normalized.includes("escherichia coli") || normalized.includes("e. coli")) {
    return "e_coli";
  }

  if (normalized.includes("fecal coliform")) {
    return "fecal_coliform";
  }

  if (normalized.includes("total coliform")) {
    return "total_coliform";
  }

  if (normalized.includes("temperature")) {
    return "water_temperature";
  }

  if (normalized === "ph") {
    return "ph";
  }

  if (normalized.includes("oxygen")) {
    return "dissolved_oxygen";
  }

  if (normalized.includes("turbidity")) {
    return "turbidity";
  }

  if (normalized.includes("salinity")) {
    return "salinity";
  }

  if (normalized.includes("specific conductance")) {
    return "specific_conductance";
  }

  if (normalized.includes("nitrate")) {
    return "nitrate";
  }

  if (normalized.includes("nitrite")) {
    return "nitrite";
  }

  if (normalized.includes("phosphate")) {
    return "phosphate";
  }

  if (normalized.includes("chlorophyll")) {
    return "chlorophyll";
  }

  return "unknown";
}

export function isBacteriaParameter(parameter: WaterQualityParameter) {
  return (
    parameter === "enterococcus" ||
    parameter === "e_coli" ||
    parameter === "fecal_coliform" ||
    parameter === "total_coliform"
  );
}

function inferAvailableParameters(properties: Record<string, string | undefined>) {
  const resultCount = toNumber(properties.resultCount ?? properties.activityCount);

  if (!resultCount || resultCount <= 0) {
    return undefined;
  }

  return ["unknown"] as WaterQualityParameter[];
}

function toSampleDateTime(
  date?: string,
  time?: string,
  timeZoneCode?: string,
): string | undefined {
  if (!date) {
    return undefined;
  }

  if (!time) {
    return `${date}T12:00:00`;
  }

  const zoneOffset = timezoneOffsetMap[timeZoneCode?.trim() ?? ""];
  return zoneOffset ? `${date}T${time}${zoneOffset}` : `${date}T${time}`;
}

function toNumber(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

const timezoneOffsetMap: Record<string, string> = {
  PST: "-08:00",
  PDT: "-07:00",
};
