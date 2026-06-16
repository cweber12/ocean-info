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
    id: "imperial-beach",
    name: "Imperial Beach",
    area: "Imperial Beach",
    point: { latitude: 32.58, longitude: -117.14 },
    activityIds: ["beach-day", "surf", "tidepools"],
    animalSightingCenters: {
      tidepools: { latitude: 32.5795, longitude: -117.1359 },
    },
    stationHints: {
      buoyStationId: "46254",
      tideStationId: "9410120",
      weatherPoint: { latitude: 32.58, longitude: -117.12 },
    },
  },
  {
    id: "south-san-diego-bay",
    name: "South San Diego Bay",
    area: "San Diego Bay",
    point: { latitude: 32.63, longitude: -117.11 },
    activityIds: ["sail", "sup-kayak"],
    stationHints: {
      tideStationId: "9410135",
      weatherPoint: { latitude: 32.63, longitude: -117.09 },
    },
  },
  {
    id: "national-city-san-diego-bay",
    name: "National City, San Diego Bay",
    area: "San Diego Bay",
    point: { latitude: 32.66, longitude: -117.12 },
    activityIds: ["sail", "sup-kayak"],
    stationHints: {
      tideStationId: "9410152",
      weatherPoint: { latitude: 32.66, longitude: -117.1 },
    },
  },
  {
    id: "point-loma-quarantine-station",
    name: "Point Loma Quarantine Station",
    area: "San Diego",
    point: { latitude: 32.7, longitude: -117.23 },
    activityIds: ["dive", "sail", "sup-kayak"],
    animalSightingCenters: {
      dive: { latitude: 32.6978, longitude: -117.2415 },
    },
    stationHints: {
      buoyStationId: "46254",
      tideStationId: "9410166",
      weatherPoint: { latitude: 32.7, longitude: -117.2 },
    },
  },
  {
    id: "san-diego-broadway-pier",
    name: "San Diego Bay, Broadway Pier",
    area: "San Diego Bay",
    point: { latitude: 32.72, longitude: -117.18 },
    activityIds: ["sail", "sup-kayak", "beach-day"],
    stationHints: {
      tideStationId: "9410170",
      weatherPoint: { latitude: 32.72, longitude: -117.16 },
    },
  },
  {
    id: "mission-bay-campland",
    name: "Mission Bay, Campland",
    area: "Mission Bay",
    point: { latitude: 32.79, longitude: -117.22 },
    activityIds: ["beach-day", "sail", "sup-kayak"],
    stationHints: {
      buoyStationId: "46258",
      tideStationId: "9410196",
      weatherPoint: { latitude: 32.79, longitude: -117.2 },
    },
  },
  {
    id: "san-diego-la-jolla-shores",
    name: "La Jolla Shores",
    area: "San Diego",
    point: { latitude: 32.8569, longitude: -117.2574 },
    activityIds: allActivities,
    animalSightingCenters: {
      dive: { latitude: 32.8554, longitude: -117.262 },
      tidepools: { latitude: 32.8569, longitude: -117.2574 },
    },
    stationHints: {
      buoyStationId: "46254",
      tideStationId: "9410230",
      weatherPoint: { latitude: 32.8569, longitude: -117.245 },
    },
  },
  {
    id: "san-diego-la-jolla-cove",
    name: "La Jolla Cove",
    area: "San Diego",
    point: { latitude: 32.8507, longitude: -117.2727 },
    activityIds: ["beach-day", "dive", "sup-kayak", "tidepools"],
    animalSightingCenters: {
      dive: { latitude: 32.8507, longitude: -117.2755 },
      tidepools: { latitude: 32.8498, longitude: -117.2717 },
    },
    stationHints: {
      buoyStationId: "46254",
      tideStationId: "9410230",
      weatherPoint: { latitude: 32.8507, longitude: -117.26 },
    },
  },
  {
    id: "san-diego-mission-beach",
    name: "Mission Beach",
    area: "San Diego",
    point: { latitude: 32.7707, longitude: -117.2525 },
    activityIds: ["beach-day", "surf", "sup-kayak"],
    stationHints: {
      buoyStationId: "46258",
      tideStationId: "9410196",
      weatherPoint: { latitude: 32.7707, longitude: -117.24 },
    },
  },
  {
    id: "del-mar",
    name: "Del Mar",
    area: "Del Mar",
    point: { latitude: 32.9595, longitude: -117.2653 },
    activityIds: ["beach-day", "surf", "tidepools"],
    animalSightingCenters: {
      tidepools: { latitude: 32.9595, longitude: -117.2653 },
    },
    stationHints: {
      buoyStationId: "46254",
      tideStationId: "9410230",
      weatherPoint: { latitude: 32.9595, longitude: -117.25 },
    },
  },
  {
    id: "encinitas-swamis",
    name: "Swami's",
    area: "Encinitas",
    point: { latitude: 33.0369, longitude: -117.292 },
    activityIds: ["beach-day", "surf", "tidepools"],
    animalSightingCenters: {
      tidepools: { latitude: 33.0369, longitude: -117.292 },
    },
    stationHints: {
      buoyStationId: "46254",
      tideStationId: "9410230",
      weatherPoint: { latitude: 33.0369, longitude: -117.282 },
    },
  },
  {
    id: "carlsbad-tamarack",
    name: "Tamarack",
    area: "Carlsbad",
    point: { latitude: 33.1502, longitude: -117.347 },
    activityIds: ["beach-day", "surf", "sup-kayak"],
    stationHints: {
      buoyStationId: "46224",
      tideStationId: "9410230",
      weatherPoint: { latitude: 33.1502, longitude: -117.337 },
    },
  },
  {
    id: "oceanside-harbor",
    name: "Oceanside Harbor",
    area: "Oceanside",
    point: { latitude: 33.2077, longitude: -117.3943 },
    activityIds: ["beach-day", "sail", "sup-kayak", "surf"],
    stationHints: {
      buoyStationId: "46224",
      tideStationId: "9410230",
      weatherPoint: { latitude: 33.2077, longitude: -117.384 },
    },
  },
];
