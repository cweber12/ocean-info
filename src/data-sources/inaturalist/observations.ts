import { z } from "zod";
import type {
  AnimalSighting,
  AnimalSightingGroup,
  AnimalSightingGroupReport,
  AnimalSightingPage,
  AnimalSightingQualityGrade,
  AnimalSightingSearch,
  AnimalTaxon,
} from "../../domain/animal-sightings/types";
import type { GeoPoint } from "../../domain/location/types";
import { getJson } from "../shared/http";

const inaturalistBaseUrl = "https://api.inaturalist.org/v1";
const inaturalistSourceName = "iNaturalist";
const animaliaTaxonId = "1";
const defaultGroupLimit = 100;
const defaultObservationPageSize = 4;
const observationFetchLimit = 200;

const taxonPhotoSchema = z.object({
  attribution: z.string().optional().nullable(),
  license_code: z.string().optional().nullable(),
  medium_url: z.string().optional().nullable(),
  square_url: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
});

const taxonSchema = z.object({
  ancestry: z.string().optional().nullable(),
  default_photo: taxonPhotoSchema.optional().nullable(),
  iconic_taxon_name: z.string().optional().nullable(),
  id: z.number(),
  name: z.string(),
  preferred_common_name: z.string().optional().nullable(),
  rank: z.string().optional().nullable(),
});

const photoSchema = z.object({
  attribution: z.string().optional().nullable(),
  license_code: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
});

const geojsonSchema = z
  .object({
    coordinates: z.tuple([z.number(), z.number()]),
    type: z.string(),
  })
  .optional()
  .nullable();

const speciesCountSchema = z.object({
  count: z.number(),
  taxon: taxonSchema,
});

const speciesCountsResponseSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  results: z.array(speciesCountSchema),
  total_results: z.number().optional().default(0),
});

const observationSchema = z.object({
  id: z.number(),
  geojson: geojsonSchema,
  observed_on: z.string().optional().nullable(),
  photos: z.array(photoSchema).optional().default([]),
  place_guess: z.string().optional().nullable(),
  quality_grade: z
    .enum(["casual", "needs_id", "research"])
    .optional()
    .default("needs_id"),
  taxon: taxonSchema.nullable().optional(),
  uri: z.string().optional().nullable(),
  user: z
    .object({
      login: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

const observationsResponseSchema = z.object({
  page: z.number().optional().default(1),
  per_page: z.number().optional().default(defaultObservationPageSize),
  results: z.array(observationSchema),
  total_results: z.number().optional().default(0),
});

type InaturalistObservation = z.input<typeof observationSchema>;
type InaturalistTaxon = z.infer<typeof taxonSchema>;

export async function fetchInaturalistAnimalSightingGroups(
  search: AnimalSightingSearch,
): Promise<AnimalSightingGroupReport> {
  const [researchResponse, needsIdResponse] = await Promise.all([
    getJson(
      buildObservationsUrl(search, {
        endpoint: "species_counts",
        perPage: defaultGroupLimit,
        qualityGrade: "research",
      }),
      speciesCountsResponseSchema,
    ),
    getJson(
      buildObservationsUrl(search, {
        endpoint: "species_counts",
        perPage: defaultGroupLimit,
        qualityGrade: "needs_id",
      }),
      speciesCountsResponseSchema,
    ),
  ]);

  return {
    groups: mergeSightingGroups({
      needsIdResults: needsIdResponse.results,
      researchResults: researchResponse.results,
    }).sort(compareSightingGroups),
    search,
    sourceName: inaturalistSourceName,
    totalResults:
      (researchResponse.total_results ?? 0) + (needsIdResponse.total_results ?? 0),
  };
}

export async function fetchInaturalistAnimalSightings(
  search: AnimalSightingSearch,
): Promise<AnimalSightingPage> {
  const page = search.page ?? 1;
  const perPage = search.perPage ?? defaultObservationPageSize;
  const researchResponse = await getJson(
    buildObservationsUrl(search, {
      endpoint: "observations",
      page: 1,
      perPage: observationFetchLimit,
      qualityGrade: "research",
    }),
    observationsResponseSchema,
  );
  const researchSightings = researchResponse.results
    .filter(hasMarineishTaxon)
    .map(mapSighting)
    .sort(compareSightings);
  const needsIdResponse = await getJson(
    buildObservationsUrl(search, {
      endpoint: "observations",
      page: 1,
      perPage: observationFetchLimit,
      qualityGrade: "needs_id",
    }),
    observationsResponseSchema,
  );
  const needsIdSightings = needsIdResponse.results
    .filter(hasMarineishTaxon)
    .map(mapSighting)
    .sort(compareSightings);
  const sightings = [...researchSightings, ...needsIdSightings];
  const pageStart = (page - 1) * perPage;

  return {
    allSightings: sightings,
    page,
    perPage,
    search,
    sightings: sightings.slice(pageStart, pageStart + perPage),
    sourceName: inaturalistSourceName,
    totalResults: sightings.length,
  };
}

function buildObservationsUrl(
  search: AnimalSightingSearch,
  options: {
    endpoint: "observations" | "species_counts";
    page?: number;
    perPage: number;
    qualityGrade?: "needs_id" | "research" | "research,needs_id";
  },
): string {
  const params = new URLSearchParams({
    d1: getDateStart(search.dateEnd, search.daysBack),
    d2: search.dateEnd,
    geoprivacy: "open",
    lat: String(search.center.latitude),
    lng: String(search.center.longitude),
    mappable: "true",
    order: "desc",
    order_by: "observed_on",
    page: String(options.page ?? 1),
    per_page: String(options.perPage),
    photos: "true",
    quality_grade: options.qualityGrade ?? "research,needs_id",
    radius: String(search.radiusKm),
    taxon_id: animaliaTaxonId,
    verifiable: "true",
  });

  const trimmedQuery = search.query?.trim();

  if (trimmedQuery && trimmedQuery.length >= 2) {
    params.set("q", trimmedQuery);
    params.set("search_on", "names");
  }

  const path =
    options.endpoint === "species_counts"
      ? "/observations/species_counts"
      : "/observations";

  return `${inaturalistBaseUrl}${path}?${params.toString()}`;
}

function mapSightingGroup(result: z.infer<typeof speciesCountSchema>): AnimalSightingGroup {
  return {
    count: result.count,
    taxon: mapTaxon(result.taxon),
    thumbnailUrl: getTaxonPhotoUrl(result.taxon),
  };
}

function mapSighting(
  observation: InaturalistObservation & {
    taxon: InaturalistTaxon;
  },
): AnimalSighting {
  const firstPhoto = (observation.photos ?? []).find((photo) => photo.url);
  const photoUrl = firstPhoto?.url ?? getTaxonPhotoUrl(observation.taxon);

  return {
    id: observation.id,
    point: mapObservationPoint(observation.geojson),
    observedOn: observation.observed_on ?? undefined,
    photo: photoUrl
      ? {
          attribution: firstPhoto?.attribution ?? undefined,
          licenseCode: firstPhoto?.license_code ?? undefined,
          url: toPhotoSize(photoUrl, "small"),
        }
      : undefined,
    placeGuess: observation.place_guess ?? undefined,
    qualityGrade: (observation.quality_grade ?? "needs_id") as AnimalSightingQualityGrade,
    taxon: mapTaxon(observation.taxon),
    uri: observation.uri ?? `https://www.inaturalist.org/observations/${observation.id}`,
    userLogin: observation.user?.login ?? undefined,
  };
}

function mergeSightingGroups({
  needsIdResults,
  researchResults,
}: {
  needsIdResults: Array<z.infer<typeof speciesCountSchema>>;
  researchResults: Array<z.infer<typeof speciesCountSchema>>;
}) {
  const groupsByTaxonId = new Map<number, AnimalSightingGroup>();

  for (const result of researchResults) {
    if (!isMarineishTaxon(result.taxon)) {
      continue;
    }

    const group = mapSightingGroup(result);
    groupsByTaxonId.set(group.taxon.id, {
      ...group,
      researchCount: result.count,
    });
  }

  for (const result of needsIdResults) {
    if (!isMarineishTaxon(result.taxon)) {
      continue;
    }

    const currentGroup = groupsByTaxonId.get(result.taxon.id);

    if (currentGroup) {
      groupsByTaxonId.set(result.taxon.id, {
        ...currentGroup,
        count: currentGroup.count + result.count,
        needsIdCount: result.count,
        thumbnailUrl: currentGroup.thumbnailUrl ?? getTaxonPhotoUrl(result.taxon),
      });
    } else {
      const group = mapSightingGroup(result);
      groupsByTaxonId.set(group.taxon.id, {
        ...group,
        needsIdCount: result.count,
      });
    }
  }

  return Array.from(groupsByTaxonId.values());
}

function getTaxonPhotoUrl(taxon: InaturalistTaxon) {
  const url =
    taxon.default_photo?.square_url ??
    taxon.default_photo?.url ??
    taxon.default_photo?.medium_url;

  return url ? toPhotoSize(url, "square") : undefined;
}

function mapTaxon(taxon: InaturalistTaxon): AnimalTaxon {
  return {
    commonName: taxon.preferred_common_name ?? undefined,
    iconicTaxonName: taxon.iconic_taxon_name ?? undefined,
    id: taxon.id,
    name: taxon.name,
    rank: taxon.rank ?? undefined,
  };
}

function hasMarineishTaxon(
  observation: InaturalistObservation,
): observation is InaturalistObservation & {
  taxon: InaturalistTaxon;
} {
  return Boolean(observation.taxon && isMarineishTaxon(observation.taxon));
}

function isMarineishTaxon(taxon: InaturalistTaxon): boolean {
  const iconicTaxonName = taxon.iconic_taxon_name?.toLowerCase();

  if (iconicTaxonName === "actinopterygii" || iconicTaxonName === "mollusca") {
    return true;
  }

  const ancestryTaxonIds = new Set((taxon.ancestry ?? "").split("/"));

  if (marineAncestryTaxonIds.some((taxonId) => ancestryTaxonIds.has(taxonId))) {
    return true;
  }

  const searchableName = [
    taxon.name,
    taxon.preferred_common_name,
    taxon.iconic_taxon_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return marineNameHints.some((hint) => searchableName.includes(hint));
}

const marineAncestryTaxonIds = [
  "47115", // Mollusca
  "85493", // Crustacea
  "47178", // ray-finned fishes
  "47549", // Echinodermata
  "47534", // Cnidaria
  "48824", // Porifera
  "41736", // sea lions and fur seals
  "41735", // seals
  "40268", // whales, dolphins, and porpoises
];

const marineNameHints = [
  "abalone",
  "anchovy",
  "anemone",
  "amphipod",
  "barnacle",
  "bass",
  "blenny",
  "brittle star",
  "chiton",
  "clam",
  "copepod",
  "coral",
  "cormorant",
  "crab",
  "dolphin",
  "eel",
  "fish",
  "goby",
  "gull",
  "hydroid",
  "jelly",
  "limpet",
  "lobster",
  "mussel",
  "nudibranch",
  "octopus",
  "oyster",
  "pelican",
  "ray",
  "sandpiper",
  "sculpin",
  "sea cucumber",
  "sea hare",
  "sea lion",
  "sea slug",
  "sea star",
  "seal",
  "shark",
  "shrimp",
  "skate",
  "snail",
  "sponge",
  "squid",
  "starfish",
  "tern",
  "tuna",
  "tunicate",
  "urchin",
  "whale",
  "wrasse",
];

function compareSightingGroups(
  first: AnimalSightingGroup,
  second: AnimalSightingGroup,
) {
  const firstHasResearch = (first.researchCount ?? 0) > 0;
  const secondHasResearch = (second.researchCount ?? 0) > 0;

  if (firstHasResearch !== secondHasResearch) {
    return firstHasResearch ? -1 : 1;
  }

  return second.count - first.count || getTaxonDisplayName(first.taxon).localeCompare(
    getTaxonDisplayName(second.taxon),
  );
}

function compareSightings(first: AnimalSighting, second: AnimalSighting) {
  if (first.qualityGrade !== second.qualityGrade) {
    return first.qualityGrade === "research" ? -1 : 1;
  }

  return getDateTime(second.observedOn) - getDateTime(first.observedOn);
}

function getTaxonDisplayName(taxon: AnimalTaxon) {
  return taxon.commonName ?? taxon.name;
}

function getDateTime(date?: string) {
  return date ? new Date(`${date}T12:00:00`).getTime() : 0;
}

function mapObservationPoint(
  geojson?: { coordinates: [number, number]; type: string } | null,
): GeoPoint | undefined {
  if (!geojson || geojson.type.toLowerCase() !== "point") {
    return undefined;
  }

  const [longitude, latitude] = geojson.coordinates;

  return {
    latitude,
    longitude,
  };
}

function getDateStart(dateEnd: string, daysBack: number): string {
  const parsedDate = new Date(`${dateEnd}T12:00:00`);
  parsedDate.setDate(parsedDate.getDate() - Math.max(daysBack - 1, 0));

  return parsedDate.toISOString().slice(0, 10);
}

function toPhotoSize(url: string, size: "small" | "square") {
  return url.replace(/\/(square|thumb|small|medium|large|original)\./, `/${size}.`);
}
