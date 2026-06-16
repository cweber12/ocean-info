import { describe, expect, it } from "vitest";
import { buildWaterQualityInsights } from "./waterQualityInsights";
import { normalizeSccoosObservations, erddapTableResponseSchema } from "./normalizeSccoos";
import { buildErddapTabledapUrl } from "./sccoosClient";

describe("SCCOOS normalization and insights", () => {
  it("builds an ERDDAP tabledap URL", () => {
    expect(
      buildErddapTabledapUrl({
        baseUrl: "https://erddap.cencoos.org/erddap/tabledap",
        constraints: ["time>=now-3days"],
        datasetId: "scripps-pier-automated-shore-sta-1",
        format: "json",
        variables: ["time", "latitude", "longitude", "sea_water_temperature_ctd"],
      }),
    ).toBe(
      "https://erddap.cencoos.org/erddap/tabledap/scripps-pier-automated-shore-sta-1.json?time,latitude,longitude,sea_water_temperature_ctd&time>=now-3days",
    );
  });

  it("merges adjacent sensor rows for the same minute", () => {
    const payload = erddapTableResponseSchema.parse({
      table: {
        columnNames: [
          "time",
          "latitude",
          "longitude",
          "sea_water_temperature_ctd",
          "sea_water_practical_salinity_ctd",
          "mass_concentration_of_chlorophyll_in_sea_water_ctd",
          "sea_water_turbidity_eco",
          "sea_water_ph_reported_on_total_scale_seaphox_internal",
          "mass_concentration_of_oxygen_in_sea_water_seaphox",
        ],
        columnUnits: [
          "UTC",
          "degrees_north",
          "degrees_east",
          "degree_Celsius",
          "PSU",
          "ug/L",
          "NTU",
          "",
          "mg/L",
        ],
        rows: [
          ["2026-06-16T20:48:00Z", 32.867, -117.257, 20.8783, 33.4158, 0, 0.3, null, null],
          ["2026-06-16T20:48:10Z", 32.867, -117.257, null, null, null, null, 8.092392, 7.66],
        ],
      },
    });

    const observations = normalizeSccoosObservations(payload);

    expect(observations).toHaveLength(1);
    expect(observations[0]).toEqual(
      expect.objectContaining({
        chlorophyllUgL: 0,
        phTotalScale: 8.092392,
        salinityPsu: 33.4158,
        turbidityNtu: 0.3,
        waterTemperatureC: 20.8783,
      }),
    );
    expect(observations[0].dissolvedOxygen).toEqual({
      type: "mass_concentration",
      unit: "mg/L",
      value: 7.66,
    });
  });

  it("creates conservative data-gap and temperature insights", () => {
    const insights = buildWaterQualityInsights({
      bacteriaSamples: [],
      observations: [
        {
          source: "SCCOOS",
          stationId: "scripps-pier-automated-shore-sta-1",
          stationName: "Scripps Pier Automated Shore Station",
          latitude: 32.867,
          longitude: -117.257,
          observedAt: "2026-06-15T20:48:00Z",
          raw: [],
          waterTemperatureC: 19.2,
        },
        {
          source: "SCCOOS",
          stationId: "scripps-pier-automated-shore-sta-1",
          stationName: "Scripps Pier Automated Shore Station",
          latitude: 32.867,
          longitude: -117.257,
          observedAt: "2026-06-16T20:48:00Z",
          raw: [],
          waterTemperatureC: 20.2,
        },
      ],
    });

    expect(insights.map((insight) => insight.id)).toContain("wqp-bacteria-gap");
    expect(insights.map((insight) => insight.id)).toContain("sccoos-water-temperature");
    expect(
      insights.find((insight) => insight.id === "sccoos-water-temperature")?.summary,
    ).toContain("Up about 1.0 C versus 24 hours ago.");
  });
});
