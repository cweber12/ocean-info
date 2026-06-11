import type { WaveObservation } from "../../domain/weather/types";

export interface NdbcWaveObservationRequest {
  date: string;
  stationId: string;
}

const sourceName = "NDBC";

export async function fetchNdbcWaveObservation({
  date,
  stationId,
}: NdbcWaveObservationRequest): Promise<WaveObservation | undefined> {
  if (date !== toLocalIsoDate(new Date())) {
    return undefined;
  }

  const response = await fetch(
    `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`,
  );

  if (!response.ok) {
    throw new Error(`NDBC request failed with ${response.status}: ${stationId}`);
  }

  return parseNdbcLatestObservation(await response.text(), stationId);
}

function parseNdbcLatestObservation(
  text: string,
  stationId: string,
): WaveObservation | undefined {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const header = lines.find((line) => line.startsWith("#YY"));
  const data = lines.find((line) => !line.startsWith("#"));

  if (!header || !data) {
    return undefined;
  }

  const columns = header.replace(/^#/, "").trim().split(/\s+/);
  const values = data.split(/\s+/);
  const getValue = (column: string) => values[columns.indexOf(column)];
  const waveHeightMeters = parseNumber(getValue("WVHT"));
  const periodSeconds = parseNumber(getValue("DPD"));
  const directionDegrees = parseNumber(getValue("MWD"));
  const year = getValue("YY");
  const month = getValue("MM");
  const day = getValue("DD");
  const hour = getValue("hh");
  const minute = getValue("mm");

  if (!year || !month || !day || !hour || !minute) {
    return undefined;
  }

  return {
    at: `20${year}-${month}-${day}T${hour}:${minute}:00Z`,
    directionDegrees,
    heightFeet:
      waveHeightMeters === undefined ? undefined : waveHeightMeters * 3.28084,
    periodSeconds,
    sourceName,
    stationName: stationId,
  };
}

function parseNumber(value?: string): number | undefined {
  if (!value || value === "MM") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function toLocalIsoDate(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
}
