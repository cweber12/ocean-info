import type { ActivityDefinition } from "../types";

export const sailActivity: ActivityDefinition = {
  id: "sail",
  name: "Sail",
  summary: "Wind, marine weather, tide, and nearshore sea-state context.",
  dataNeeds: ["weather", "wind", "swell", "tide"],
};
