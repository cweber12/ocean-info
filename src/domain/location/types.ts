import type { ActivityId } from "../../activities";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface StationHints {
  tideStationId?: string;
  buoyStationId?: string;
  currentStationId?: string;
  weatherPoint?: GeoPoint;
  weatherGridId?: string;
  waterQualityAreaId?: string;
}

export type AnimalSightingActivityId = "dive" | "tidepools";

export interface CoastalLocation {
  id: string;
  name: string;
  area: string;
  point: GeoPoint;
  activityIds: ActivityId[];
  animalSightingCenters?: Partial<Record<AnimalSightingActivityId, GeoPoint>>;
  stationHints?: StationHints;
}
