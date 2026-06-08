export interface WaterQualityAdvisory {
  status: "open" | "advisory" | "closed" | "unknown";
  issuedAt?: string;
  sourceName: string;
  message?: string;
}

export interface WaterTemperatureReading {
  at: string;
  fahrenheit: number;
  sourceName: string;
}
