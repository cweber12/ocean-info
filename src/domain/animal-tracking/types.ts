import type { AnimalSightingActivityId } from "../location/types";
import type { GeoPoint } from "../location/types";

export interface AnimalTrackingSearch {
  activityId: AnimalSightingActivityId;
  center: GeoPoint;
  dateEnd: string;
  daysBack: number;
  radiusKm: number;
}

export interface AnimalTrackPoint {
  point: GeoPoint;
  timestamp: string;
}

export interface AnimalTrack {
  id: string;
  individualId?: string;
  individualName?: string;
  latestPoint?: AnimalTrackPoint;
  pointCount: number;
  sourceName: string;
  speciesName?: string;
  studyId: string;
  studyName?: string;
}

export interface AnimalTrackingReport {
  search: AnimalTrackingSearch;
  sourceName: string;
  totalTracks: number;
  tracks: AnimalTrack[];
}
