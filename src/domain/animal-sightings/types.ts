import type { ActivityId } from "../../activities";
import type { GeoPoint } from "../location/types";

export type AnimalSightingQualityGrade = "casual" | "needs_id" | "research";
export type AnimalSightingSearchArea = "coastline" | "ocean";

export interface AnimalSightingSearch {
  activityId: ActivityId;
  center: GeoPoint;
  dateEnd: string;
  daysBack: number;
  page?: number;
  perPage?: number;
  query?: string;
  radiusKm: number;
  searchArea: AnimalSightingSearchArea;
}

export interface AnimalTaxon {
  id: number;
  commonName?: string;
  iconicTaxonName?: string;
  name: string;
  rank?: string;
}

export interface AnimalSightingPhoto {
  attribution?: string;
  licenseCode?: string;
  url: string;
}

export interface AnimalSighting {
  id: number;
  observedOn?: string;
  photo?: AnimalSightingPhoto;
  point?: GeoPoint;
  placeGuess?: string;
  qualityGrade: AnimalSightingQualityGrade;
  searchArea: AnimalSightingSearchArea;
  taxon: AnimalTaxon;
  uri: string;
  userLogin?: string;
}

export interface AnimalSightingGroup {
  count: number;
  latestObservedOn?: string;
  needsIdCount?: number;
  researchCount?: number;
  taxon: AnimalTaxon;
  thumbnailUrl?: string;
}

export interface AnimalSightingGroupReport {
  groups: AnimalSightingGroup[];
  search: AnimalSightingSearch;
  sourceName: string;
  totalResults: number;
}

export interface AnimalSightingPage {
  allSightings: AnimalSighting[];
  page: number;
  perPage: number;
  search: AnimalSightingSearch;
  sightings: AnimalSighting[];
  sourceName: string;
  totalResults: number;
}
