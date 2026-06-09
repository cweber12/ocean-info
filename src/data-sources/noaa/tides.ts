import { z } from "zod";
import type {
  TideChartPoint,
  TidePrediction,
  TideReport,
  TideStation,
} from "../../domain/tide/types";
import { getJson } from "../shared/http";

const noaaPredictionRowSchema = z.object({
  t: z.string(),
  v: z.string(),
  type: z.enum(["H", "L"]).optional(),
});

const noaaPredictionsSchema = z.object({
  predictions: z.array(noaaPredictionRowSchema),
});

interface TideReportRequest {
  station: TideStation;
  date: string;
}

const noaaDataGetterUrl = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

export async function fetchNoaaTideReport({
  station,
  date,
}: TideReportRequest): Promise<TideReport> {
  const [highLowResponse, chartResponse] = await Promise.all([
    getJson(
      buildPredictionUrl({
        date,
        interval: "hilo",
        stationId: station.id,
        includeNextDay: true,
      }),
      noaaPredictionsSchema,
    ),
    getJson(
      buildPredictionUrl({
        date,
        interval: "60",
        stationId: station.id,
        includeNextDay: false,
      }),
      noaaPredictionsSchema,
    ),
  ]);

  return {
    station,
    date,
    datum: "MLLW",
    units: "english",
    sourceName: "NOAA CO-OPS",
    highLow: highLowResponse.predictions
      .filter((prediction) => prediction.type)
      .map(mapHighLowPrediction),
    chart: chartResponse.predictions.map(mapChartPoint),
  };
}

function buildPredictionUrl({
  date,
  includeNextDay,
  interval,
  stationId,
}: {
  date: string;
  includeNextDay: boolean;
  interval: "60" | "hilo";
  stationId: string;
}): string {
  const params = new URLSearchParams({
    begin_date: toNoaaDate(date),
    end_date: toNoaaDate(includeNextDay ? addDays(date, 1) : date),
    station: stationId,
    product: "predictions",
    datum: "MLLW",
    time_zone: "lst_ldt",
    interval,
    units: "english",
    application: "TideGuide",
    format: "json",
  });

  return `${noaaDataGetterUrl}?${params.toString()}`;
}

function mapHighLowPrediction(prediction: z.infer<typeof noaaPredictionRowSchema>): TidePrediction {
  return {
    at: prediction.t,
    heightFeet: Number(prediction.v),
    type: prediction.type === "H" ? "high" : "low",
  };
}

function mapChartPoint(prediction: z.infer<typeof noaaPredictionRowSchema>): TideChartPoint {
  return {
    at: prediction.t,
    heightFeet: Number(prediction.v),
  };
}

function toNoaaDate(date: string): string {
  return date.replaceAll("-", "");
}

function addDays(date: string, days: number): string {
  const parsedDate = new Date(`${date}T12:00:00`);
  parsedDate.setDate(parsedDate.getDate() + days);

  return parsedDate.toISOString().slice(0, 10);
}
