import type { ActivityDefinition } from "../types";

export const supKayakActivity: ActivityDefinition = {
  id: "sup-kayak",
  name: "SUP / kayak",
  summary: "Wind exposure, launch comfort, water quality, and tide movement.",
  dataNeeds: ["weather", "wind", "water-quality", "tide", "water-temperature"],
};
