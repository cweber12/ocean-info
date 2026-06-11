import { useId } from "react";
import {
  CloudSun,
  Compass,
  Droplets,
  ThermometerSun,
  Waves,
  Wind,
} from "lucide-react";
import type { ActivityId } from "../../activities";
import type {
  HourlyWeatherPoint,
  MarineWeatherReport as MarineWeatherReportData,
} from "../../domain/weather/types";
import { ChartPanel, DataPanel } from "./DataDisplayPanels";

export interface HeaderWeatherSummaryProps {
  isLoading: boolean;
  report?: MarineWeatherReportData;
}

export interface MarineWeatherReportProps extends HeaderWeatherSummaryProps {
  activityId: ActivityId;
  errorMessage?: string;
}

interface WeatherStat {
  detail: string;
  icon: typeof Wind;
  label: string;
  value: string;
}

export function HeaderWeatherSummary({
  isLoading,
  report,
}: HeaderWeatherSummaryProps) {
  if (isLoading) {
    return (
      <div className="weather-summary" aria-live="polite">
        <span>Loading weather</span>
      </div>
    );
  }

  if (!report?.summary) {
    return (
      <div className="weather-summary" aria-live="polite">
        <CloudSun aria-hidden="true" size={18} strokeWidth={2.2} />
        <span>Weather unavailable</span>
      </div>
    );
  }

  return (
    <div className="weather-summary" aria-label="Weather summary">
      <span>
        <CloudSun aria-hidden="true" size={18} strokeWidth={2.2} />
        {formatTemperature(report.summary.temperatureFahrenheit)}
      </span>
      <span>
        <Wind aria-hidden="true" size={18} strokeWidth={2.2} />
        {formatWindSummary(report.summary.windDirection, report.summary.windSpeedMph)}
      </span>
      <span className="weather-summary-forecast">
        {report.summary.shortForecast ?? "Forecast"}
      </span>
    </div>
  );
}

export function MarineWeatherReport({
  activityId,
  errorMessage,
  isLoading,
  report,
}: MarineWeatherReportProps) {
  const content = getActivityWeatherContent(activityId);

  if (isLoading) {
    return (
      <section className="marine-weather-report" aria-live="polite">
        <WeatherReportHeading content={content} />
        <div className="weather-loading">Loading NOAA weather...</div>
      </section>
    );
  }

  if (errorMessage || !report) {
    return (
      <section className="marine-weather-report" aria-live="polite">
        <WeatherReportHeading content={content} />
        <div className="weather-error">
          Weather data is unavailable for this location right now.
        </div>
      </section>
    );
  }

  const stats = getWeatherStats(activityId, report);

  return (
    <section
      className="marine-weather-report"
      aria-labelledby="weather-report-heading"
    >
      <WeatherReportHeading content={content} />

      <div className="weather-report-grid">
        <ChartPanel className="weather-chart-panel">
          <WindForecastChart points={report.hourlyForecast} />
        </ChartPanel>

        <DataPanel className="weather-data-panel">
          <div className="weather-stat-grid">
            {stats.map((stat) => (
              <WeatherStatCard key={stat.label} stat={stat} />
            ))}
          </div>

          <p className="weather-source-note">
            {content.sourceNote} Forecast grid {report.stationNames.weather ?? "NWS"}.
          </p>
        </DataPanel>
      </div>
    </section>
  );
}

function WeatherReportHeading({
  content,
}: {
  content: ReturnType<typeof getActivityWeatherContent>;
}) {
  return (
    <div className="section-heading weather-report-heading">
      <div>
        <p className="eyebrow">Weather</p>
        <h2 id="weather-report-heading">{content.heading}</h2>
      </div>
      <span>{content.badge}</span>
    </div>
  );
}

function WeatherStatCard({ stat }: { stat: WeatherStat }) {
  const Icon = stat.icon;

  return (
    <div className="weather-stat">
      <span>
        <Icon aria-hidden="true" size={16} strokeWidth={2.2} />
        {stat.label}
      </span>
      <strong>{stat.value}</strong>
      <small>{stat.detail}</small>
    </div>
  );
}

function WindForecastChart({ points }: { points: HourlyWeatherPoint[] }) {
  const gradientId = `wind-chart-gradient-${useId().replace(/:/g, "")}`;
  const width = 720;
  const height = 260;
  const padding = { bottom: 34, left: 44, right: 24, top: 18 };
  const chartPoints = points.slice(0, 24);

  if (chartPoints.length === 0) {
    return <div className="weather-chart-empty">No hourly wind chart available.</div>;
  }

  const speeds = chartPoints.flatMap((point) => [
    point.windSpeedMph ?? 0,
    point.windGustMph ?? point.windSpeedMph ?? 0,
  ]);
  const maxSpeed = Math.max(...speeds, 10);
  const startMinute = getChartMinute(chartPoints[0].at);
  const endMinute = getChartMinute(chartPoints[chartPoints.length - 1].at);
  const minuteRange = Math.max(endMinute - startMinute, 1);
  const plotBottom = height - padding.bottom;
  const plotHeight = height - padding.top - padding.bottom;
  const plotWidth = width - padding.left - padding.right;
  const coordinates = chartPoints.map((point) => {
    const x =
      padding.left +
      ((getChartMinute(point.at) - startMinute) / minuteRange) * plotWidth;
    const speedY =
      plotBottom -
      (((point.windSpeedMph ?? 0) / maxSpeed) * plotHeight);
    const gustY =
      plotBottom -
      (((point.windGustMph ?? point.windSpeedMph ?? 0) / maxSpeed) * plotHeight);

    return { ...point, gustY, speedY, x };
  });
  const speedPath = buildSmoothPath(coordinates.map((point) => ({ x: point.x, y: point.speedY })));
  const gustPath = buildSmoothPath(coordinates.map((point) => ({ x: point.x, y: point.gustY })));
  const areaPath = `${gustPath} L ${coordinates[coordinates.length - 1].x} ${plotBottom} L ${coordinates[0].x} ${plotBottom} Z`;
  const yTicks = getSpeedTicks(maxSpeed).map((speed) => ({
    label: `${Math.round(mphToKnots(speed))} kt`,
    y: plotBottom - (speed / maxSpeed) * plotHeight,
  }));
  const xTicks = getTimeTicks(startMinute, endMinute, 6).map((minute) => ({
    label: formatChartHour(minute),
    x: padding.left + ((minute - startMinute) / minuteRange) * plotWidth,
  }));

  return (
    <svg
      className="wind-chart"
      role="img"
      aria-label="Hourly wind and gust forecast chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          x2="0"
          y1={padding.top}
          y2={plotBottom}
          gradientUnits="userSpaceOnUse"
        >
          <stop className="wind-chart-gradient-top" offset="0%" />
          <stop className="wind-chart-gradient-bottom" offset="100%" />
        </linearGradient>
      </defs>
      {yTicks.map((tick) => (
        <g className="wind-chart-y-tick" key={tick.label}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={tick.y}
            y2={tick.y}
          />
          <text x={padding.left - 10} y={tick.y + 4} textAnchor="end">
            {tick.label}
          </text>
        </g>
      ))}
      <path className="wind-chart-area" d={areaPath} style={{ fill: `url(#${gradientId})` }} />
      <path className="wind-chart-gust-line" d={gustPath} />
      <path className="wind-chart-speed-line" d={speedPath} />
      <line
        className="wind-chart-axis"
        x1={padding.left}
        x2={width - padding.right}
        y1={plotBottom}
        y2={plotBottom}
      />
      {xTicks.map((tick) => (
        <g className="wind-chart-x-tick" key={tick.label}>
          <line x1={tick.x} x2={tick.x} y1={plotBottom} y2={plotBottom + 5} />
          <text x={tick.x} y={height - 8} textAnchor="middle">
            {tick.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function getActivityWeatherContent(activityId: ActivityId) {
  const contentByActivity: Record<
    ActivityId,
    { badge: string; heading: string; sourceNote: string }
  > = {
    "beach-day": {
      badge: "Comfort",
      heading: "Beach comfort",
      sourceNote: "NWS forecast with NOAA coastal observations where available.",
    },
    dive: {
      badge: "Entry check",
      heading: "Surface and exposure",
      sourceNote: "NWS forecast with NOAA water and buoy observations where available.",
    },
    sail: {
      badge: "Wind chart",
      heading: "Sailing weather",
      sourceNote: "NWS forecast with NOAA wind, wave, and current observations where available.",
    },
    "sup-kayak": {
      badge: "Paddle check",
      heading: "Paddling weather",
      sourceNote: "NWS forecast with NOAA wind and water observations where available.",
    },
    surf: {
      badge: "Surf check",
      heading: "Wind and wave setup",
      sourceNote: "NWS forecast with NOAA buoy observations where available.",
    },
    tidepools: {
      badge: "Field check",
      heading: "Low-tide comfort",
      sourceNote: "NWS forecast with NOAA coastal observations where available.",
    },
  };

  return contentByActivity[activityId];
}

function getWeatherStats(
  activityId: ActivityId,
  report: MarineWeatherReportData,
): WeatherStat[] {
  const statsByActivity: Record<ActivityId, WeatherStat[]> = {
    "beach-day": [
      getSkyStat(report),
      getWindStat(report),
      getWaterTemperatureStat(report),
      getWaveStat(report),
    ],
    dive: [
      getWaveStat(report),
      getWaterTemperatureStat(report),
      getWindStat(report),
      getCurrentStat(report),
    ],
    sail: [
      getWindStat(report),
      getGustStat(report),
      getWaveStat(report),
      getCurrentStat(report),
    ],
    "sup-kayak": [
      getWindStat(report),
      getCurrentStat(report),
      getSkyStat(report),
      getWaterTemperatureStat(report),
    ],
    surf: [
      getWaveStat(report),
      getWindStat(report),
      getWaterTemperatureStat(report),
      getSkyStat(report),
    ],
    tidepools: [
      getSkyStat(report),
      getWindStat(report),
      getWaveStat(report),
      getWaterTemperatureStat(report),
    ],
  };

  return statsByActivity[activityId];
}

function getSkyStat(report: MarineWeatherReportData): WeatherStat {
  const summary = report.summary;

  return {
    detail: summary?.shortForecast ?? "Forecast unavailable",
    icon: CloudSun,
    label: "Sky",
    value: formatTemperature(summary?.temperatureFahrenheit),
  };
}

function getWindStat(report: MarineWeatherReportData): WeatherStat {
  const observed = report.windObservation;
  const summary = report.summary;
  const speedMph =
    observed?.speedKnots === undefined ? summary?.windSpeedMph : observed.speedKnots / 0.868976;

  return {
    detail:
      observed?.direction ??
      summary?.windDirection ??
      "Direction unavailable",
    icon: Wind,
    label: "Wind",
    value: formatKnotsFromMph(speedMph),
  };
}

function getGustStat(report: MarineWeatherReportData): WeatherStat {
  const observed = report.windObservation;
  const forecastGust = report.hourlyForecast
    .map((point) => point.windGustMph)
    .find((gust): gust is number => gust !== undefined);
  const gustMph =
    observed?.gustKnots === undefined ? forecastGust : observed.gustKnots / 0.868976;

  return {
    detail: observed ? `Observed at ${formatObservationTime(observed.at)}` : "Forecast gust",
    icon: Compass,
    label: "Gusts",
    value: formatKnotsFromMph(gustMph),
  };
}

function getWaveStat(report: MarineWeatherReportData): WeatherStat {
  const wave = report.waveObservation;

  return {
    detail:
      wave?.periodSeconds === undefined
        ? "Latest buoy data unavailable"
        : `${Math.round(wave.periodSeconds)} sec period`,
    icon: Waves,
    label: "Waves",
    value:
      wave?.heightFeet === undefined
        ? "No buoy"
        : `${wave.heightFeet.toFixed(1)} ft`,
  };
}

function getCurrentStat(report: MarineWeatherReportData): WeatherStat {
  const current = report.currentObservation;

  return {
    detail:
      current?.direction ??
      (current?.directionDegrees === undefined
        ? "Current station unavailable"
        : `${Math.round(current.directionDegrees)} deg`),
    icon: Compass,
    label: "Current",
    value:
      current?.speedKnots === undefined
        ? "No station"
        : `${current.speedKnots.toFixed(1)} kt`,
  };
}

function getWaterTemperatureStat(report: MarineWeatherReportData): WeatherStat {
  const waterTemperature = report.waterTemperature;

  return {
    detail: waterTemperature
      ? `Observed at ${formatObservationTime(waterTemperature.at)}`
      : "Water station unavailable",
    icon: Droplets,
    label: "Water",
    value:
      waterTemperature === undefined
        ? "No reading"
        : formatTemperature(waterTemperature.temperatureFahrenheit),
  };
}

function formatTemperature(value?: number): string {
  return value === undefined ? "--°F" : `${Math.round(value)}°F`;
}

function formatWindSummary(direction?: string, speedMph?: number): string {
  return `${direction ?? "--"} ${formatKnotsFromMph(speedMph)}`;
}

function formatKnotsFromMph(speedMph?: number): string {
  return speedMph === undefined ? "-- kt" : `${Math.round(mphToKnots(speedMph))} kt`;
}

function mphToKnots(speedMph: number): number {
  return speedMph * 0.868976;
}

function formatObservationTime(value: string): string {
  const match = value.match(/(\d{2}):(\d{2})/);

  if (!match) {
    return value;
  }

  const hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function getChartMinute(localTime: string): number {
  const hour = Number(localTime.slice(11, 13));
  const minute = Number(localTime.slice(14, 16));

  return hour * 60 + minute;
}

function getTimeTicks(
  startMinute: number,
  endMinute: number,
  intervalHours: number,
): number[] {
  const intervalMinutes = intervalHours * 60;
  const firstTick = Math.ceil(startMinute / intervalMinutes) * intervalMinutes;
  const ticks: number[] = [];

  for (let minute = firstTick; minute <= endMinute; minute += intervalMinutes) {
    ticks.push(minute);
  }

  return ticks;
}

function getSpeedTicks(maxSpeed: number): number[] {
  return [maxSpeed, maxSpeed * 0.66, maxSpeed * 0.33, 0];
}

function formatChartHour(minuteOfDay: number): string {
  const hour = Math.floor(minuteOfDay / 60);

  if (hour === 0) {
    return "12a";
  }

  if (hour === 12) {
    return "noon";
  }

  if (hour < 12) {
    return `${hour}a`;
  }

  return `${hour - 12}p`;
}

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  return points.slice(0, -1).reduce((path, point, index) => {
    const previousPoint = points[index - 1] ?? point;
    const nextPoint = points[index + 1];
    const afterNextPoint = points[index + 2] ?? nextPoint;
    const controlPointOne = {
      x: point.x + (nextPoint.x - previousPoint.x) / 6,
      y: point.y + (nextPoint.y - previousPoint.y) / 6,
    };
    const controlPointTwo = {
      x: nextPoint.x - (afterNextPoint.x - point.x) / 6,
      y: nextPoint.y - (afterNextPoint.y - point.y) / 6,
    };

    return `${path} C ${controlPointOne.x} ${controlPointOne.y}, ${controlPointTwo.x} ${controlPointTwo.y}, ${nextPoint.x} ${nextPoint.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}
