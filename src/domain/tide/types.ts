export type TideEventType = "high" | "low";

export interface TideStation {
  id: string;
  name: string;
  point: {
    latitude: number;
    longitude: number;
  };
  type: "reference" | "subordinate";
}

export interface TidePrediction {
  at: string;
  heightFeet: number;
  type: TideEventType;
}

export interface TideChartPoint {
  at: string;
  heightFeet: number;
}

export interface TideReport {
  station: TideStation;
  date: string;
  datum: "MLLW";
  units: "english";
  sourceName: string;
  highLow: TidePrediction[];
  chart: TideChartPoint[];
}
