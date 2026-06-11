import { z } from "zod";
import type {
  HeaderWeatherSummary,
  HourlyWeatherPoint,
} from "../../domain/weather/types";
import { getJson } from "../shared/http";

const nwsPointSchema = z.object({
  properties: z.object({
    forecastHourly: z.string().url(),
    gridId: z.string(),
    gridX: z.number(),
    gridY: z.number(),
  }),
});

const nwsHourlyForecastSchema = z.object({
  properties: z.object({
    periods: z.array(
      z.object({
        startTime: z.string(),
        temperature: z.number().optional(),
        temperatureUnit: z.string().optional(),
        windSpeed: z.string().optional(),
        windDirection: z.string().optional(),
        shortForecast: z.string().optional(),
        probabilityOfPrecipitation: z
          .object({
            value: z.number().nullable().optional(),
          })
          .optional(),
        relativeHumidity: z
          .object({
            value: z.number().nullable().optional(),
          })
          .optional(),
      }),
    ),
  }),
});

interface FetchNwsWeatherRequest {
  date: string;
  latitude: number;
  longitude: number;
}

export interface NwsWeatherForecast {
  hourlyForecast: HourlyWeatherPoint[];
  stationName: string;
  summary?: HeaderWeatherSummary;
}

const nwsApiBaseUrl = "https://api.weather.gov";

export async function fetchNwsWeatherForecast({
  date,
  latitude,
  longitude,
}: FetchNwsWeatherRequest): Promise<NwsWeatherForecast> {
  const point = await getJson(
    `${nwsApiBaseUrl}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    nwsPointSchema,
  );
  const hourly = await getJson(
    point.properties.forecastHourly,
    nwsHourlyForecastSchema,
  );
  const sourceName = "National Weather Service";
  const hourlyForecast = hourly.properties.periods
    .map((period): HourlyWeatherPoint => {
      const wind = parseWindSpeed(period.windSpeed);

      return {
        at: period.startTime,
        airTemperatureFahrenheit:
          period.temperatureUnit === "F" ? period.temperature : undefined,
        precipitationChancePercent:
          period.probabilityOfPrecipitation?.value ?? undefined,
        relativeHumidityPercent: period.relativeHumidity?.value ?? undefined,
        shortForecast: period.shortForecast,
        sourceName,
        windDirection: period.windDirection,
        windSpeedMph: wind.speedMph,
        windGustMph: wind.gustMph,
      };
    })
    .filter((point) => point.at.slice(0, 10) === date);
  const summaryPoint = getSummaryPoint(hourlyForecast, date);

  return {
    hourlyForecast,
    stationName: `${point.properties.gridId} ${point.properties.gridX},${point.properties.gridY}`,
    summary: summaryPoint
      ? {
          shortForecast: summaryPoint.shortForecast,
          temperatureFahrenheit: summaryPoint.airTemperatureFahrenheit,
          windDirection: summaryPoint.windDirection,
          windSpeedMph: summaryPoint.windSpeedMph,
        }
      : undefined,
  };
}

function parseWindSpeed(value?: string): {
  gustMph?: number;
  speedMph?: number;
} {
  if (!value) {
    return {};
  }

  const numbers = value.match(/\d+/g)?.map(Number) ?? [];

  if (numbers.length === 0) {
    return {};
  }

  if (/gust/i.test(value) && numbers.length > 1) {
    return {
      gustMph: numbers[numbers.length - 1],
      speedMph: numbers[0],
    };
  }

  if (numbers.length > 1) {
    return {
      speedMph: Math.round((numbers[0] + numbers[1]) / 2),
    };
  }

  return {
    speedMph: numbers[0],
  };
}

function getSummaryPoint(
  points: HourlyWeatherPoint[],
  date: string,
): HourlyWeatherPoint | undefined {
  if (points.length === 0) {
    return undefined;
  }

  const now = new Date();

  if (date !== now.toISOString().slice(0, 10)) {
    return points[0];
  }

  return points.find((point) => new Date(point.at) >= now) ?? points[0];
}
