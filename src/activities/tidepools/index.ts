import type { ActivityDefinition } from "../types";

export const tidepoolsActivity: ActivityDefinition = {
  id: "tidepools",
  name: "Tidepools",
  summary: "Low-tide timing, daylight, weather, and coastal access context.",
  dataNeeds: ["tide", "weather", "wind", "water-quality", "marine-life"],
};
