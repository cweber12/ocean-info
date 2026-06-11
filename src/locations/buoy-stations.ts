import type { GeoPoint } from "../domain/location/types";

export interface BuoyStation {
  id: string;
  name: string;
  point: GeoPoint;
}

export const noaaBuoyStations: BuoyStation[] = [
  {
    id: "46254",
    name: "Scripps Nearshore, CA",
    point: { latitude: 32.868, longitude: -117.267 },
  },
  {
    id: "46258",
    name: "Mission Bay West, CA",
    point: { latitude: 32.749, longitude: -117.502 },
  },
  {
    id: "46224",
    name: "Oceanside Offshore, CA",
    point: { latitude: 33.178, longitude: -117.472 },
  },
];

export function getBuoyStationById(stationId: string): BuoyStation | undefined {
  return noaaBuoyStations.find((station) => station.id === stationId);
}