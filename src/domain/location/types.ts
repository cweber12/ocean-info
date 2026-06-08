import type { ActivityId } from "../../activities";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface StationHints {
  tideStationId?: string;
  buoyStationId?: string;
  weatherGridId?: string;
  waterQualityAreaId?: string;
}

export interface CoastalLocation {
  id: string;
  name: string;
  area: string;
  point: GeoPoint;
  activityIds: ActivityId[];
  stationHints?: StationHints;
}
