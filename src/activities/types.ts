export type ActivityId =
  | "beach-day"
  | "dive"
  | "sail"
  | "sup-kayak"
  | "surf"
  | "tidepools";

export type ActivityDataNeed =
  | "marine-life"
  | "swell"
  | "tide"
  | "water-quality"
  | "water-temperature"
  | "weather"
  | "wind";

export interface ActivityDefinition {
  id: ActivityId;
  name: string;
  summary: string;
  dataNeeds: ActivityDataNeed[];
}
