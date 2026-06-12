import { useId } from "react";
import {
  CloudSun,
  Compass,
  Droplets,
  Waves,
  Wind,
} from "lucide-react";
import type { ActivityId } from "../../activities";
import type {
  HourlyWeatherPoint,
  MarineWeatherReport as MarineWeatherReportData,
} from "../../domain/weather/types";

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
        <h2 id="weather-report-heading" className="sr-only">
          {content.heading}
        </h2>
        <div className="weather-loading">Loading NOAA weather...</div>
      </section>
    );
  }

  if (errorMessage || !report) {
    return (
      <section className="marine-weather-report" aria-live="polite">
        <h2 id="weather-report-heading" className="sr-only">
          {content.heading}
        </h2>
        <div className="weather-error">
          Weather data is unavailable for this location right now.
        </div>
      </section>
    );
  }

  const windStats = getWindStats(report);
  const oceanStats = getOceanStats(report);

  return (
    <section
      className="marine-weather-report"
      aria-labelledby="weather-report-heading"
    >
      <h2 id="weather-report-heading" className="sr-only">
        {content.heading}
      </h2>

      <div className="api-card-grid weather-card-grid">
        <article className="api-data-card weather-data-card">
          <header className="api-data-card-header">
            <div>
              <p className="eyebrow">Wind and air</p>
              <h3>Wind, gusts, and air temperature</h3>
            </div>
            <span>{report.stationNames.weather ?? "NWS"}</span>
          </header>

          <div className="api-data-card-chart">
            <WindForecastChart
              points={report.hourlyForecast}
              xAxisLabel="Local time"
              yAxisLabel="Wind (kt)"
            />
          </div>

          <div className="api-data-card-content">
            <div className="weather-stat-grid weather-stat-grid-dual">
              {windStats.map((stat) => (
                <WeatherStatCard key={stat.label} stat={stat} />
              ))}
            </div>

            <p className="weather-source-note">
              {content.sourceNote} Forecast grid {report.stationNames.weather ?? "NWS"}; latest wind observation from{" "}
              {report.windObservation?.sourceName ?? "NOAA"}.
            </p>
          </div>
        </article>

        {oceanStats.length > 0 ? (
          <article className="api-data-card weather-data-card wave-data-card">
            <header className="api-data-card-header">
              <div>
                <p className="eyebrow">Ocean</p>
                <h3>Water, waves, and current</h3>
              </div>
              <span>{getOceanStationLabel(report)}</span>
            </header>

            <div className="api-data-card-chart">
              <WaveObservationChart report={report} />
            </div>

            <div className="api-data-card-content">
              <div className="weather-stat-grid wave-stat-grid">
                {oceanStats.map((stat) => (
                  <WeatherStatCard key={stat.label} stat={stat} />
                ))}
              </div>

              <p className="weather-source-note">
                {getOceanSourceNote(report)}
              </p>
            </div>
          </article>
        ) : null}
      </div>
    </section>
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

function WaveObservationChart({ report }: { report: MarineWeatherReportData }) {
  const width = 720;
  const height = 220;
  const padding = { bottom: 48, left: 58, right: 26, top: 22 };
  const observation = report.waveObservation;

  if (!observation) {
    return <div className="weather-chart-empty">No wave observation chart available.</div>;
  }

  const metrics = [
    {
      label: "Height",
      value: observation.heightFeet,
      max: 12,
      unit: "ft",
    },
    {
      label: "Period",
      value: observation.periodSeconds,
      max: 20,
      unit: "sec",
    },
    {
      label: "Direction",
      value: observation.directionDegrees,
      max: 360,
      unit: "deg",
    },
  ].filter((metric) => metric.value !== undefined);

  if (metrics.length === 0) {
    return <div className="weather-chart-empty">No wave observation chart available.</div>;
  }

  const plotBottom = height - padding.bottom;
  const plotTop = padding.top;
  const plotHeight = plotBottom - plotTop;
  const plotWidth = width - padding.left - padding.right;
  const slotWidth = plotWidth / metrics.length;
  const barWidth = Math.min(72, slotWidth * 0.44);
  const axisTicks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <svg
      className="wave-chart"
      role="img"
      aria-label="Latest wave observation chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {axisTicks.map((ratio) => {
        const y = plotTop + (1 - ratio) * plotHeight;

        return (
          <g className="wave-chart-y-tick" key={ratio}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            <text x={padding.left - 10} y={y + 4} textAnchor="end">
              {`${Math.round(ratio * 100)}%`}
            </text>
          </g>
        );
      })}
      {metrics.map((metric, index) => {
        const normalized = Math.max(0, Math.min((metric.value ?? 0) / metric.max, 1));
        const xCenter = padding.left + slotWidth * (index + 0.5);
        const barHeight = normalized * plotHeight;
        const y = plotBottom - barHeight;

        return (
          <g className="wave-chart-bar" key={metric.label}>
            <rect
              className="wave-chart-bar-fill"
              x={xCenter - barWidth / 2}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="8"
            />
            <text x={xCenter} y={plotBottom + 18} textAnchor="middle">
              {metric.label}
            </text>
            <text x={xCenter} y={y - 8} textAnchor="middle">
              {`${Math.round(metric.value ?? 0)} ${metric.unit}`}
            </text>
          </g>
        );
      })}
      <line
        className="wave-chart-axis"
        x1={padding.left}
        x2={width - padding.right}
        y1={plotBottom}
        y2={plotBottom}
      />
      <text
        className="wave-chart-axis-label wave-chart-axis-label-y"
        x={22}
        y={height / 2}
        textAnchor="middle"
        transform={`rotate(-90 22 ${height / 2})`}
      >
        Relative intensity
      </text>
      <text
        className="wave-chart-axis-label wave-chart-axis-label-x"
        x={padding.left + plotWidth / 2}
        y={height - 4}
        textAnchor="middle"
      >
        Latest buoy observation
      </text>
    </svg>
  );
}

function WindForecastChart({
  points,
  xAxisLabel,
  yAxisLabel,
}: {
  points: HourlyWeatherPoint[];
  xAxisLabel: string;
  yAxisLabel: string;
}) {
  const gradientId = `wind-chart-gradient-${useId().replace(/:/g, "")}`;
  const width = 720;
  const height = 280;
  const padding = { bottom: 44, left: 58, right: 24, top: 20 };
  const chartPoints = points.slice(0, 24);
  const domainStartMinute = 0;
  const domainEndMinute = 24 * 60 - 1;

  if (chartPoints.length === 0) {
    return <div className="weather-chart-empty">No hourly wind chart available.</div>;
  }

  const speeds = chartPoints.flatMap((point) => [
    point.windSpeedMph ?? 0,
    point.windGustMph ?? point.windSpeedMph ?? 0,
  ]);
  const maxSpeed = Math.max(...speeds, 10);
  const minuteRange = domainEndMinute - domainStartMinute;
  const plotBottom = height - padding.bottom;
  const plotHeight = height - padding.top - padding.bottom;
  const plotWidth = width - padding.left - padding.right;
  const coordinates = chartPoints.map((point) => {
    const x =
      padding.left +
      ((getChartMinute(point.at) - domainStartMinute) / minuteRange) * plotWidth;
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
  const yTicks = getSpeedTicks(maxSpeed).map((speed) => {
    const knots = mphToKnots(speed);

    return {
      label: `${Math.round(knots)} kt`,
      y: plotBottom - (speed / maxSpeed) * plotHeight,
    };
  });
  const xTicks = getTimeTicks(domainStartMinute, domainEndMinute, 6).map((minute) => ({
    label: formatChartHour(minute),
    x: padding.left + ((minute - domainStartMinute) / minuteRange) * plotWidth,
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
      <text
        className="wind-chart-axis-label wind-chart-axis-label-y"
        x={20}
        y={height / 2}
        textAnchor="middle"
        transform={`rotate(-90 20 ${height / 2})`}
      >
        {yAxisLabel}
      </text>
      {xTicks.map((tick) => (
        <g className="wind-chart-x-tick" key={tick.label}>
          <line x1={tick.x} x2={tick.x} y1={plotBottom} y2={plotBottom + 5} />
          <text x={tick.x} y={height - 8} textAnchor="middle">
            {tick.label}
          </text>
        </g>
      ))}
      <text
        className="wind-chart-axis-label wind-chart-axis-label-x"
        x={padding.left + plotWidth / 2}
        y={height - 2}
        textAnchor="middle"
      >
        {xAxisLabel}
      </text>
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
      sourceNote: "NWS forecast with NOAA water observations where available.",
    },
    sail: {
      badge: "Wind chart",
      heading: "Sailing weather",
      sourceNote: "NWS forecast with NOAA wind observations where available.",
    },
    "sup-kayak": {
      badge: "Paddle check",
      heading: "Paddling weather",
      sourceNote: "NWS forecast with NOAA wind and water observations where available.",
    },
    surf: {
      badge: "Surf check",
      heading: "Wind and weather setup",
      sourceNote: "NWS forecast with NOAA coastal observations where available.",
    },
    tidepools: {
      badge: "Field check",
      heading: "Low-tide comfort",
      sourceNote: "NWS forecast with NOAA coastal observations where available.",
    },
  };

  return contentByActivity[activityId];
}

function getWindStats(report: MarineWeatherReportData): WeatherStat[] {
  return [getAirTemperatureStat(report), getWindStat(report), getGustStat(report)];
}

function getOceanStats(report: MarineWeatherReportData): WeatherStat[] {
  return [getWaterTemperatureStat(report), ...getWaveStats(report), ...getCurrentStats(report)];
}

function getAirTemperatureStat(report: MarineWeatherReportData): WeatherStat {
  const forecastPoint = report.hourlyForecast.find(
    (point) => point.airTemperatureFahrenheit !== undefined,
  );

  return {
    detail: forecastPoint
      ? `Forecast at ${formatObservationTime(forecastPoint.at)}`
      : report.summary?.shortForecast ?? "Forecast unavailable",
    icon: CloudSun,
    label: "Air",
    value: formatTemperature(
      forecastPoint?.airTemperatureFahrenheit ?? report.summary?.temperatureFahrenheit,
    ),
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

function getWaveStats(report: MarineWeatherReportData): WeatherStat[] {
  const wave = report.waveObservation;

  if (!wave) {
    return [];
  }

  const stats: WeatherStat[] = [];

  if (wave.heightFeet !== undefined) {
    stats.push({
      detail: "Significant wave height",
      icon: Waves,
      label: "Height",
      value: `${wave.heightFeet.toFixed(1)} ft`,
    });
  }

  if (wave.periodSeconds !== undefined) {
    stats.push({
      detail: "Dominant period",
      icon: Waves,
      label: "Period",
      value: `${Math.round(wave.periodSeconds)} sec`,
    });
  }

  if (wave.directionDegrees !== undefined) {
    stats.push({
      detail: "Mean wave direction",
      icon: Compass,
      label: "Direction",
      value: `${Math.round(wave.directionDegrees)} deg`,
    });
  }

  return stats;
}

function getCurrentStats(report: MarineWeatherReportData): WeatherStat[] {
  const current = report.currentObservation;

  if (!current) {
    return [];
  }

  const stats: WeatherStat[] = [];

  if (current.speedKnots !== undefined) {
    stats.push({
      detail: current.direction ?? "Current direction unavailable",
      icon: Waves,
      label: "Current",
      value: `${current.speedKnots.toFixed(1)} kt`,
    });
  }

  if (current.directionDegrees !== undefined) {
    stats.push({
      detail: "Current direction",
      icon: Compass,
      label: "Set",
      value: `${Math.round(current.directionDegrees)} deg`,
    });
  }

  return stats;
}

function getOceanStationLabel(report: MarineWeatherReportData): string {
  return (
    report.stationNames.waves ??
    report.stationNames.current ??
    report.stationNames.water ??
    "NOAA"
  );
}

function getOceanSourceNote(report: MarineWeatherReportData): string {
  const notes = [
    report.waterTemperature
      ? `Water temperature from ${report.waterTemperature.sourceName} station ${
          report.stationNames.water ?? report.waterTemperature.stationName
        }`
      : "Water temperature station unavailable",
    report.waveObservation
      ? `waves from ${report.waveObservation.sourceName} station ${
          report.stationNames.waves ?? report.waveObservation.stationName
        }`
      : "wave station unavailable",
    report.currentObservation
      ? `current from ${report.currentObservation.sourceName} station ${
          report.stationNames.current ?? report.currentObservation.stationName
        }`
      : "current station unavailable",
  ];

  return `${notes.join("; ")}.`;
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

  if (ticks[ticks.length - 1] !== endMinute) {
    ticks.push(endMinute);
  }

  return ticks;
}

function getSpeedTicks(maxSpeed: number): number[] {
  const roundedMax = Math.max(10, Math.ceil(maxSpeed / 5) * 5);
  const step = roundedMax / 4;

  return [roundedMax, roundedMax - step, roundedMax - step * 2, roundedMax - step * 3, 0];
}

function formatChartHour(minuteOfDay: number): string {
  if (minuteOfDay >= 24 * 60 - 1) {
    return "11:59p";
  }

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
