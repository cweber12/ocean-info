import type { ActivityDefinition } from "../types";

export const diveActivity: ActivityDefinition = {
  id: "dive",
  name: "Dive",
  summary: "Visibility-sensitive planning for shore dives and marine life opportunities.",
  dataNeeds: [
    "water-temperature",
    "water-quality",
    "swell",
    "tide",
    "wind",
    "marine-life",
  ],
};
