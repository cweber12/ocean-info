import type { CoastalLocation } from "../domain/location/types";

const allActivities: CoastalLocation["activityIds"] = [
  "beach-day",
  "dive",
  "sail",
  "sup-kayak",
  "surf",
  "tidepools",
];

export const coastalLocations: CoastalLocation[] = [
  {
    id: "san-diego-la-jolla-shores",
    name: "La Jolla Shores",
    area: "San Diego",
    point: { latitude: 32.8569, longitude: -117.2574 },
    activityIds: allActivities,
  },
  {
    id: "san-diego-la-jolla-cove",
    name: "La Jolla Cove",
    area: "San Diego",
    point: { latitude: 32.8507, longitude: -117.2727 },
    activityIds: ["beach-day", "dive", "sup-kayak", "tidepools"],
  },
  {
    id: "san-diego-mission-beach",
    name: "Mission Beach",
    area: "San Diego",
    point: { latitude: 32.7707, longitude: -117.2525 },
    activityIds: ["beach-day", "surf", "sup-kayak"],
  },
  {
    id: "del-mar",
    name: "Del Mar",
    area: "Del Mar",
    point: { latitude: 32.9595, longitude: -117.2653 },
    activityIds: ["beach-day", "surf", "tidepools"],
  },
  {
    id: "encinitas-swamis",
    name: "Swami's",
    area: "Encinitas",
    point: { latitude: 33.0369, longitude: -117.292 },
    activityIds: ["beach-day", "surf", "tidepools"],
  },
  {
    id: "carlsbad-tamarack",
    name: "Tamarack",
    area: "Carlsbad",
    point: { latitude: 33.1502, longitude: -117.347 },
    activityIds: ["beach-day", "surf", "sup-kayak"],
  },
  {
    id: "oceanside-harbor",
    name: "Oceanside Harbor",
    area: "Oceanside",
    point: { latitude: 33.2077, longitude: -117.3943 },
    activityIds: ["beach-day", "sail", "sup-kayak", "surf"],
  },
];
