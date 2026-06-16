export type WaterDataSource = "WQP" | "SCCOOS" | "USGS" | "County" | "Other";

export type WaterQualityParameter =
  | "enterococcus"
  | "e_coli"
  | "fecal_coliform"
  | "total_coliform"
  | "water_temperature"
  | "ph"
  | "dissolved_oxygen"
  | "turbidity"
  | "salinity"
  | "specific_conductance"
  | "nitrate"
  | "nitrite"
  | "phosphate"
  | "chlorophyll"
  | "unknown";

export interface MonitoringStation {
  source: "WQP" | "SCCOOS";
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  waterbody?: string;
  siteType?: string;
  provider?: string;
  availableParameters?: WaterQualityParameter[];
  lastObservedAt?: string;
  raw: unknown;
}

export interface WaterQualitySample {
  source: "WQP";
  provider?: string;
  organizationId?: string;
  organizationName?: string;
  stationId?: string;
  stationName?: string;
  stationType?: string;
  latitude?: number;
  longitude?: number;
  sampleDate?: string;
  sampleTime?: string;
  sampleDateTime?: string;
  characteristicName: string;
  normalizedParameter: WaterQualityParameter;
  value?: number;
  rawValue?: string;
  unit?: string;
  resultDetectionCondition?: string;
  resultStatusIdentifier?: string;
  sampleMedia?: string;
  distanceKm?: number;
  raw: unknown;
}

export interface DissolvedOxygenObservation {
  value: number;
  unit?: string;
  type?: "mass_concentration" | "mole_concentration" | "percent_saturation";
}

export interface OceanConditionObservation {
  source: "SCCOOS";
  stationId: "scripps-pier-automated-shore-sta-1";
  stationName: "Scripps Pier Automated Shore Station";
  latitude: number;
  longitude: number;
  observedAt: string;
  waterTemperatureC?: number;
  salinityPsu?: number;
  chlorophyllUgL?: number;
  turbidityNtu?: number;
  phTotalScale?: number;
  dissolvedOxygen?: DissolvedOxygenObservation;
  qualityFlags?: Record<string, number | string | null>;
  raw: unknown;
}

export interface WaterQualityInsightEvidence {
  source: WaterDataSource;
  label: string;
  value?: string | number;
  unit?: string;
  observedAt?: string;
  stationName?: string;
}

export interface WaterQualityInsight {
  id: string;
  severity: "info" | "watch" | "caution" | "warning";
  category:
    | "bacteria"
    | "runoff"
    | "visibility"
    | "algae"
    | "water_temperature"
    | "oxygen"
    | "chemistry"
    | "data_gap";
  title: string;
  summary: string;
  evidence: WaterQualityInsightEvidence[];
  limitations: string[];
}

export interface WaterDataError {
  source: "WQP" | "SCCOOS";
  requestUrl?: string;
  status?: number;
  message: string;
  retryable: boolean;
}

export interface WaterQualityAdvisoryStatus {
  status: "not_integrated";
  sourceName: string;
  message: string;
  advisoryUrl?: string;
}

export interface WaterQualityReport {
  date: string;
  advisoryStatus: WaterQualityAdvisoryStatus;
  stations: MonitoringStation[];
  wqpSamples: WaterQualitySample[];
  recentBacteriaSamples: WaterQualitySample[];
  recentChemistrySamples: WaterQualitySample[];
  latestOceanObservation?: OceanConditionObservation;
  recentOceanObservations: OceanConditionObservation[];
  insights: WaterQualityInsight[];
  errors: WaterDataError[];
  unavailable: string[];
}
