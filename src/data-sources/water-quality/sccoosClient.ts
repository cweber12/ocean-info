import type { OceanConditionObservation } from "../../domain/water/types";
import { createCacheKey, getCachedValue } from "./waterQualityCache";
import { debugRequest, fetchJsonWithSchema } from "./http";
import {
  erddapTableResponseSchema,
  normalizeSccoosObservations,
  SCCOOS_SCRIPPS_DATASET_ID,
  SCCOOS_SCRIPPS_VARIABLES,
} from "./normalizeSccoos";

const SCCOOS_BASE_URL = "https://erddap.cencoos.org/erddap/tabledap";
const SCCOOS_TTL_MS = 10 * 60 * 1000;

export interface SccoosFetchOptions {
  endTime?: string;
  responseFormat?: "csv" | "json";
  startTime?: string;
  variables?: string[];
}

export async function fetchSccoosObservations(
  options: SccoosFetchOptions = {},
): Promise<OceanConditionObservation[]> {
  const url = buildErddapTabledapUrl({
    baseUrl: SCCOOS_BASE_URL,
    datasetId: SCCOOS_SCRIPPS_DATASET_ID,
    format: options.responseFormat ?? "json",
    variables: options.variables ?? [...SCCOOS_SCRIPPS_VARIABLES],
    constraints: buildTimeConstraints(options),
  });
  const cacheKey = createCacheKey("sccoos-observations", url);

  return getCachedValue(cacheKey, SCCOOS_TTL_MS, async () => {
    debugRequest("SCCOOS", url);
    const payload = await fetchJsonWithSchema({
      source: "SCCOOS",
      url,
      schema: erddapTableResponseSchema,
    });
    return normalizeSccoosObservations(payload);
  });
}

export function buildErddapTabledapUrl({
  baseUrl,
  constraints,
  datasetId,
  format,
  variables,
}: {
  baseUrl: string;
  constraints: string[];
  datasetId: string;
  format: "csv" | "json";
  variables: string[];
}) {
  const variableList = variables.join(",");
  const constraintList = constraints.map((constraint) => `&${encodeConstraint(constraint)}`).join("");

  return `${baseUrl}/${datasetId}.${format}?${variableList}${constraintList}`;
}

function buildTimeConstraints(options: SccoosFetchOptions) {
  const constraints: string[] = [];

  if (options.startTime) {
    constraints.push(buildTimeConstraint(">=", options.startTime));
  } else {
    constraints.push("time>=now-3days");
  }

  if (options.endTime) {
    constraints.push(buildTimeConstraint("<=", options.endTime));
  }

  return constraints;
}

function buildTimeConstraint(operator: ">=" | "<=", value: string) {
  if (value.startsWith("now-") || value.startsWith("now+")) {
    return `time${operator}${value}`;
  }

  return `time${operator}${value}`;
}

function encodeConstraint(constraint: string) {
  const match = constraint.match(/^([^<>=]+)(<=|>=|=)(.+)$/);

  if (!match) {
    return encodeURIComponent(constraint);
  }

  const [, left, operator, right] = match;
  return `${left}${operator}${encodeURIComponent(right)}`;
}
