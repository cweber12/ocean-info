import { z } from "zod";
import type {
  MonitoringStation,
  OceanConditionObservation,
} from "../../domain/water/types";

export const SCCOOS_SCRIPPS_DATASET_ID = "scripps-pier-automated-shore-sta-1";

export const SCCOOS_SCRIPPS_VARIABLES = [
  "time",
  "latitude",
  "longitude",
  "sea_water_temperature_ctd",
  "sea_water_practical_salinity_ctd",
  "mass_concentration_of_chlorophyll_in_sea_water_ctd",
  "sea_water_turbidity_eco",
  "sea_water_ph_reported_on_total_scale_seaphox_internal",
  "mass_concentration_of_oxygen_in_sea_water_seaphox",
] as const;

export const SCCOOS_FALLBACK_VARIABLES = {
  chlorophyll: [
    "mass_concentration_of_chlorophyll_in_sea_water_ctd",
    "mass_concentration_of_chlorophyll_in_sea_water_eco",
  ],
  dissolvedOxygen: [
    "mass_concentration_of_oxygen_in_sea_water_seaphox",
    "mole_concentration_of_dissolved_molecular_oxygen_in_sea_water_seaphox",
    "fractional_saturation_of_oxygen_in_sea_water_seaphox",
  ],
  ph: [
    "sea_water_ph_reported_on_total_scale_seaphox_internal",
    "sea_water_ph_reported_on_total_scale_seaphox_external",
  ],
  salinity: [
    "sea_water_practical_salinity_ctd",
    "sea_water_practical_salinity_seaphox",
  ],
  turbidity: ["sea_water_turbidity_eco"],
  waterTemperature: [
    "sea_water_temperature_ctd",
    "sea_water_temperature_seaphox",
  ],
} as const;

export const SCCOOS_SCRIPPS_STATION: MonitoringStation = {
  source: "SCCOOS",
  stationId: SCCOOS_SCRIPPS_DATASET_ID,
  name: "Scripps Pier Automated Shore Station",
  latitude: 32.867,
  longitude: -117.257,
  waterbody: "Nearshore Pacific Ocean / La Jolla",
  siteType: "Automated shore station",
  provider: "SCCOOS",
  availableParameters: [
    "water_temperature",
    "salinity",
    "chlorophyll",
    "turbidity",
    "ph",
    "dissolved_oxygen",
  ],
  raw: null,
};

export const erddapTableResponseSchema = z.object({
  table: z.object({
    columnNames: z.array(z.string()),
    columnUnits: z.array(z.string()).optional(),
    rows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))),
  }),
});

export function normalizeSccoosObservations(
  payload: z.infer<typeof erddapTableResponseSchema>,
): OceanConditionObservation[] {
  const { columnNames, columnUnits = [], rows } = payload.table;
  const unitMap = new Map(columnNames.map((name, index) => [name, columnUnits[index]]));
  const grouped = new Map<string, OceanConditionObservation>();

  for (const row of rows) {
    const rawRow = Object.fromEntries(columnNames.map((name, index) => [name, row[index] ?? null]));
    const time = asString(rawRow.time);

    if (!time) {
      continue;
    }

    const minuteKey = toMinuteKey(time);
    const latitude = toNumber(rawRow.latitude) ?? SCCOOS_SCRIPPS_STATION.latitude;
    const longitude = toNumber(rawRow.longitude) ?? SCCOOS_SCRIPPS_STATION.longitude;
    const current = grouped.get(minuteKey) ?? {
      source: "SCCOOS" as const,
      stationId: SCCOOS_SCRIPPS_DATASET_ID,
      stationName: "Scripps Pier Automated Shore Station" as const,
      latitude,
      longitude,
      observedAt: minuteKey,
      raw: [],
    };

    current.latitude = latitude;
    current.longitude = longitude;
    current.raw = [...((current.raw as unknown[]) ?? []), rawRow];

    const waterTemperature = toNumber(rawRow.sea_water_temperature_ctd);
    if (waterTemperature !== undefined) {
      current.waterTemperatureC = waterTemperature;
    }

    const salinity = toNumber(rawRow.sea_water_practical_salinity_ctd);
    if (salinity !== undefined) {
      current.salinityPsu = salinity;
    }

    const chlorophyll = toNumber(rawRow.mass_concentration_of_chlorophyll_in_sea_water_ctd);
    if (chlorophyll !== undefined) {
      current.chlorophyllUgL = chlorophyll;
    }

    const turbidity = toNumber(rawRow.sea_water_turbidity_eco);
    if (turbidity !== undefined) {
      current.turbidityNtu = turbidity;
    }

    const ph = toNumber(rawRow.sea_water_ph_reported_on_total_scale_seaphox_internal);
    if (ph !== undefined) {
      current.phTotalScale = ph;
    }

    const oxygen = toNumber(rawRow.mass_concentration_of_oxygen_in_sea_water_seaphox);
    if (oxygen !== undefined) {
      current.dissolvedOxygen = {
        value: oxygen,
        unit: unitMap.get("mass_concentration_of_oxygen_in_sea_water_seaphox"),
        type: "mass_concentration",
      };
    }

    grouped.set(minuteKey, current);
  }

  return Array.from(grouped.values()).sort((left, right) => {
    return Date.parse(left.observedAt) - Date.parse(right.observedAt);
  });
}

function toMinuteKey(value: string) {
  return value.length >= 16 ? `${value.slice(0, 16)}:00Z` : value;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function toNumber(value: unknown) {
  if (typeof value !== "number") {
    return undefined;
  }

  if (!Number.isFinite(value) || value <= -9999) {
    return undefined;
  }

  return value;
}
