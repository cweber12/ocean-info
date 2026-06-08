import type { ActivityDefinition } from "../types";

export const beachDayActivity: ActivityDefinition = {
  id: "beach-day",
  name: "Beach day",
  summary: "Surface conditions, comfort, water quality, and basic ocean safety.",
  dataNeeds: ["weather", "water-quality", "water-temperature", "tide", "wind"],
};
