export interface MarineLifeObservation {
  speciesName: string;
  observedAt: string;
  sourceName: string;
  locationLabel?: string;
  notes?: string;
}

export interface MarineMigrationWindow {
  speciesName: string;
  seasonLabel: string;
  likelihood: "low" | "moderate" | "high";
  sourceName: string;
}
