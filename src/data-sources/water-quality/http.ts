import { z } from "zod";
import type { WaterDataError } from "../../domain/water/types";

type WaterSource = "WQP" | "SCCOOS";

export async function fetchJsonWithSchema<T>({
  source,
  url,
  schema,
  timeoutMs = 15000,
}: {
  source: WaterSource;
  url: string;
  schema: z.ZodSchema<T>;
  timeoutMs?: number;
}): Promise<T> {
  const response = await fetchWithTimeout(url, timeoutMs);
  const payload = await parseResponseJson(source, url, response);
  return schema.parse(payload);
}

export async function fetchTextWithTimeout({
  source,
  url,
  timeoutMs = 20000,
}: {
  source: WaterSource;
  url: string;
  timeoutMs?: number;
}): Promise<string> {
  const response = await fetchWithTimeout(url, timeoutMs);

  if (!response.ok) {
    throw await createResponseError(source, url, response);
  }

  return response.text();
}

export function toWaterDataError(
  source: WaterSource,
  url: string,
  error: unknown,
): WaterDataError {
  if (isWaterDataError(error)) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return {
      source,
      requestUrl: url,
      message: `Timed out while requesting ${source} data.`,
      retryable: true,
    };
  }

  return {
    source,
    requestUrl: url,
    message: error instanceof Error ? error.message : `Unknown ${source} request failure.`,
    retryable: true,
  };
}

export function debugRequest(source: WaterSource, url: string) {
  if (import.meta.env.DEV) {
    console.debug(`[water-quality:${source}] ${url}`);
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function parseResponseJson(
  source: WaterSource,
  url: string,
  response: Response,
) {
  if (!response.ok) {
    throw await createResponseError(source, url, response);
  }

  try {
    return await response.json();
  } catch (error) {
    throw {
      source,
      requestUrl: url,
      message: `Invalid JSON returned by ${source}.`,
      retryable: false,
    } satisfies WaterDataError;
  }
}

async function createResponseError(
  source: WaterSource,
  url: string,
  response: Response,
): Promise<WaterDataError> {
  let detail = "";

  try {
    detail = (await response.text()).trim();
  } catch {
    detail = "";
  }

  return {
    source,
    requestUrl: url,
    status: response.status,
    message: detail
      ? `${source} request failed with ${response.status}: ${detail}`
      : `${source} request failed with ${response.status}.`,
    retryable: response.status >= 500 || response.status === 429,
  };
}

function isWaterDataError(value: unknown): value is WaterDataError {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "source" in value && "message" in value && "retryable" in value;
}
