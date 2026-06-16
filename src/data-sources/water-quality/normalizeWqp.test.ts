import { describe, expect, it } from "vitest";
import type { CoastalLocation } from "../../domain/location/types";
import { mapWqpCharacteristicName, normalizeWqpResults, normalizeWqpStations } from "./normalizeWqp";

const location: CoastalLocation = {
  id: "la-jolla-shores",
  name: "La Jolla Shores",
  area: "San Diego",
  point: {
    latitude: 32.8569,
    longitude: -117.2574,
  },
  activityIds: ["beach-day", "dive", "sail", "sup-kayak", "surf", "tidepools"],
};

describe("WQP normalization", () => {
  it("maps station geojson into monitoring stations", () => {
    const stations = normalizeWqpStations([
      {
        geometry: {
          coordinates: [-117.26, 32.85] as [number, number],
        },
        properties: {
          CountyName: "San Diego County",
          MonitoringLocationIdentifier: "CABEACH_WQX-LJ-001",
          MonitoringLocationName: "La Jolla Sample Point",
          ProviderName: "STORET",
          ResolvedMonitoringLocationTypeName: "Beach Program Site-Station",
          resultCount: "12",
        },
      },
    ]);

    expect(stations).toEqual([
      expect.objectContaining({
        latitude: 32.85,
        longitude: -117.26,
        name: "La Jolla Sample Point",
        siteType: "Beach Program Site-Station",
        source: "WQP",
        stationId: "CABEACH_WQX-LJ-001",
      }),
    ]);
  });

  it("normalizes result rows and preserves raw values", () => {
    const stations = normalizeWqpStations([
      {
        geometry: {
          coordinates: [-117.26, 32.85] as [number, number],
        },
        properties: {
          MonitoringLocationIdentifier: "CABEACH_WQX-LJ-001",
          MonitoringLocationName: "La Jolla Sample Point",
        },
      },
    ]);

    const samples = normalizeWqpResults(
      [
        {
          "ActivityStartTime/Time": "08:30:00",
          "ActivityStartTime/TimeZoneCode": "PST",
          "ResultMeasure/MeasureUnitCode": "MPN/100mL",
          ActivityMediaName: "Water",
          ActivityStartDate: "2025-01-06",
          CharacteristicName: "Enterococcus",
          MonitoringLocationIdentifier: "CABEACH_WQX-LJ-001",
          OrganizationFormalName: "California State Water Resource Control Board",
          OrganizationIdentifier: "CABEACH_WQX",
          ProviderName: "STORET",
          ResultMeasureValue: "10",
          ResultStatusIdentifier: "Final",
        },
        {
          ActivityStartDate: "2025-01-07",
          CharacteristicName: "Turbidity",
          MonitoringLocationIdentifier: "CABEACH_WQX-LJ-001",
          ResultMeasureValue: "Not reported",
        },
      ],
      stations,
      location,
    );

    expect(samples[0]).toEqual(
      expect.objectContaining({
        characteristicName: "Enterococcus",
        normalizedParameter: "enterococcus",
        sampleDateTime: "2025-01-06T08:30:00-08:00",
        stationName: "La Jolla Sample Point",
        unit: "MPN/100mL",
        value: 10,
      }),
    );
    expect(samples[1]).toEqual(
      expect.objectContaining({
        normalizedParameter: "turbidity",
        rawValue: "Not reported",
        value: undefined,
      }),
    );
    expect(samples[0].distanceKm).toBeLessThan(2);
  });

  it("maps known WQP characteristic aliases", () => {
    expect(mapWqpCharacteristicName("Escherichia coli")).toBe("e_coli");
    expect(mapWqpCharacteristicName("Chlorophyll a")).toBe("chlorophyll");
    expect(mapWqpCharacteristicName("Unmapped parameter")).toBe("unknown");
  });
});
