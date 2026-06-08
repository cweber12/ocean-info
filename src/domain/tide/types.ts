export interface TidePrediction {
  at: string;
  heightFeet: number;
  type: "high" | "low";
  sourceName: string;
}
