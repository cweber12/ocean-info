import type { CoastalLocation } from "./location/types";

export interface OceanDataQuery {
  location: CoastalLocation;
  date: string;
}
