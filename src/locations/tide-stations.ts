import type { GeoPoint } from "../domain/location/types";
import type { TideStation } from "../domain/tide/types";

export const noaaTideStations: TideStation[] = [
  {
    id: "9410120",
    name: "Imperial Beach",
    point: { latitude: 32.58, longitude: -117.14 },
    type: "subordinate",
  },
  {
    id: "9410135",
    name: "South San Diego Bay",
    point: { latitude: 32.63, longitude: -117.11 },
    type: "reference",
  },
  {
    id: "9410152",
    name: "National City, San Diego Bay",
    point: { latitude: 32.66, longitude: -117.12 },
    type: "subordinate",
  },
  {
    id: "9410166",
    name: "San Diego, Quarantine Station",
    point: { latitude: 32.7, longitude: -117.23 },
    type: "subordinate",
  },
  {
    id: "9410170",
    name: "San Diego (Broadway)",
    point: { latitude: 32.72, longitude: -117.18 },
    type: "reference",
  },
  {
    id: "9410196",
    name: "Mission Bay, Campland",
    point: { latitude: 32.79, longitude: -117.22 },
    type: "reference",
  },
  {
    id: "9410230",
    name: "La Jolla (Scripps Institution Wharf)",
    point: { latitude: 32.87, longitude: -117.26 },
    type: "reference",
  },
];

export function getTideStationById(stationId: string): TideStation | undefined {
  return noaaTideStations.find((station) => station.id === stationId);
}

export function getNearestTideStation(point: GeoPoint): TideStation {
  return noaaTideStations.reduce((nearest, station) => {
    const currentDistance = getApproximateDistanceMiles(point, station.point);
    const nearestDistance = getApproximateDistanceMiles(point, nearest.point);

    return currentDistance < nearestDistance ? station : nearest;
  }, noaaTideStations[0]);
}

function getApproximateDistanceMiles(a: GeoPoint, b: GeoPoint): number {
  const latitudeMiles = (a.latitude - b.latitude) * 69;
  const longitudeMiles =
    (a.longitude - b.longitude) *
    Math.cos(((a.latitude + b.latitude) / 2) * (Math.PI / 180)) *
    69;

  return Math.sqrt(latitudeMiles ** 2 + longitudeMiles ** 2);
}
