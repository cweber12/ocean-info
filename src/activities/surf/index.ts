import type { ActivityDefinition } from "../types";

export const surfActivity: ActivityDefinition = {
  id: "surf",
  name: "Surf",
  summary: "Swell, wind, tide, water temperature, and beach advisories.",
  dataNeeds: ["swell", "wind", "tide", "water-temperature", "water-quality"],
};
