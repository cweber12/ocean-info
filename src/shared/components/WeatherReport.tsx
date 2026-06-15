import { useId } from "react";
import {
  CircleDashed,
  CloudOff,
  CloudSun,
  Compass,
  Droplets,
  LoaderCircle,
  TriangleAlert,
  Waves,
  Wind,
} from "lucide-react";
import type { ActivityId } from "../../activities";
import type {
  HourlyWeatherPoint,
  MarineWeatherReport as MarineWeatherReportData,
} from "../../domain/weather/types";
import {
  emptyValue,
  filledValue,
  ReportState,
  ReportValueText,
  type ReportValue,
} from "./ReportState";

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
  value: ReportValue;
}

const miniChartDimensions = {
  height: 236,
  padding: { bottom: 38, left: 56, right: 18, top: 18 },
  width: 720,
} as const;

export function HeaderWeatherSummary({
  isLoading,
  report,
}: HeaderWeatherSummaryProps) {
  if (isLoading) {
    return (
      <div className="weather-summary weather-summary--state" aria-live="polite">
        <ReportState
          className="weather-summary-state"
          detail="Fetching NOAA weather"
          icon={LoaderCircle}
          title="Loading weather"
          variant="compact"
        />
      </div>
    );
  }

  if (!report?.summary) {
    return (
      <div className="weather-summary weather-summary--state" aria-live="polite">
        <ReportState
          className="weather-summary-state"
          detail="No coastal forecast returned"
          icon={CloudOff}
          title="Weather unavailable"
          variant="compact"
        />
      </div>
    );
  }

  return (
    <div className="weather-summary" aria-label="Weather summary">
      <span>
        <CloudSun aria-hidden="true" size={18} strokeWidth={2.2} />
        <ReportValueText as="span" value={formatTemperatureValue(report.summary.temperatureFahrenheit)} />
      </span>
      <span>
        <Wind aria-hidden="true" size={18} strokeWidth={2.2} />
        <ReportValueText
          as="span"
          value={formatWindSummaryValue(report.summary.windDirection, report.summary.windSpeedMph)}
        />
      </span>
      <span className="weather-summary-forecast">
        {report.summary.shortForecast ?? "Forecast unavailable"}
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
        <div className="weather-loading">
          <ReportState
            detail="Forecast grids and coastal observations are on the way."
            icon={LoaderCircle}
            title="Loading weather report"
          />
        </div>
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
          <ReportState
            detail="Forecast and buoy readings are unavailable for this location right now."
            icon={TriangleAlert}
            title="Weather report unavailable"
          />
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
              yAxisLabel="Wind speed"
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
      <ReportValueText value={stat.value} />
      <small>{stat.detail}</small>
    </div>
  );
}

function WaveObservationChart({ report }: { report: MarineWeatherReportData }) {
  const observation = report.waveObservation;
  const { height, padding, width } = miniChartDimensions;

  if (!observation) {
    return (
      <ChartEmptyState
        detail="Latest water readings still appear below when available."
        icon={CircleDashed}
        title="No wave chart data"
      />
    );
  }

  const hasWaveMetric =
    observation.heightFeet !== undefined ||
    observation.periodSeconds !== undefined ||
    observation.directionDegrees !== undefined;

  if (!hasWaveMetric) {
    return (
      <ChartEmptyState
        detail="The selected buoy did not report height, period, or direction."
        icon={CircleDashed}
        title="No wave chart data"
      />
    );
  }

  const cycleSeconds = Math.max(observation.periodSeconds ?? 12, 6);
  const waveHeight = Math.max(observation.heightFeet ?? 4, 1);
  const plotBottom = height - padding.bottom;
  const plotHeight = height - padding.top - padding.bottom;
  const plotWidth = width - padding.left - padding.right;
  const cyclePoints = Array.from({ length: 33 }, (_, index) => {
    const progress = index / 32;
    const phase = progress * Math.PI * 2 - Math.PI / 2;
    const relativeHeight = ((Math.sin(phase) + 1) / 2) * waveHeight;

    return {
      x: padding.left + progress * plotWidth,
      y: plotBottom - (relativeHeight / waveHeight) * plotHeight,
    };
  });
  const wavePath = buildSmoothPath(cyclePoints);
  const yTicks = [waveHeight, waveHeight * 0.66, waveHeight * 0.33, 0].map(
    (value, index, tickValues) => ({
      emphasis: index === tickValues.length - 1,
      label: `${value.toFixed(value >= 10 ? 0 : 1)} ft`,
      y: plotBottom - (value / waveHeight) * plotHeight,
    }),
  );
  const xTicks = [0, cycleSeconds / 2, cycleSeconds].map((value) => ({
    label: `${Math.round(value)}s`,
    x: padding.left + (value / cycleSeconds) * plotWidth,
  }));

  return (
    <svg
      className="mini-chart wave-chart"
      role="img"
      aria-label={buildWaveChartLabel(observation)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {yTicks.map((tick) => (
        <g
          className="mini-chart-grid-row"
          data-emphasis={tick.emphasis ? "baseline" : undefined}
          key={tick.label}
        >
          <line
            className="mini-chart-grid-line"
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

      <path className="wave-chart-line" d={wavePath} />
      <path
        className="wave-chart-fill"
        d={`${wavePath} L ${width - padding.right} ${plotBottom} L ${padding.left} ${plotBottom} Z`}
      />

      {xTicks.map((tick) => (
        <g className="mini-chart-x-tick" key={tick.label}>
          <line
            className="mini-chart-tick-mark"
            x1={tick.x}
            x2={tick.x}
            y1={plotBottom}
            y2={plotBottom + 5}
          />
          <text x={tick.x} y={height - 8} textAnchor="middle">
            {tick.label}
          </text>
        </g>
      ))}

      <text className="mini-chart-axis-label" x={padding.left} y={14} textAnchor="start">
        Wave height
      </text>
      <text
        className="mini-chart-axis-label"
        x={padding.left + plotWidth / 2}
        y={height - 2}
        textAnchor="middle"
      >
        Observed cycle
      </text>

      {observation.directionDegrees !== undefined ? (
        <g
          className="wave-chart-direction"
          transform={`translate(${width - padding.right - 24} ${padding.top + 22}) rotate(${observation.directionDegrees})`}
        >
          <circle cx="0" cy="0" r="12" />
          <path d="M 0 -7 L 4 3 L 0 1 L -4 3 Z" />
        </g>
      ) : null}
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
  const { height, padding, width } = miniChartDimensions;
  const chartPoints = points.slice(0, 24);
  const domainStartMinute = 0;
  const domainEndMinute = 24 * 60 - 1;

  if (chartPoints.length === 0) {
    return (
      <ChartEmptyState
        detail="NWS did not return hourly periods for this date."
        icon={CircleDashed}
        title="No hourly wind data"
      />
    );
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
    const x = padding.left + ((getChartMinute(point.at) - domainStartMinute) / minuteRange) * plotWidth;
    const speedY = plotBottom - (((point.windSpeedMph ?? 0) / maxSpeed) * plotHeight);
    const gustY = plotBottom - (((point.windGustMph ?? point.windSpeedMph ?? 0) / maxSpeed) * plotHeight);

    return { ...point, gustY, speedY, x };
  });
  const speedPath = buildSmoothPath(coordinates.map((point) => ({ x: point.x, y: point.speedY })));
  const gustPath = buildSmoothPath(coordinates.map((point) => ({ x: point.x, y: point.gustY })));
  const areaPath = `${speedPath} L ${coordinates[coordinates.length - 1].x} ${plotBottom} L ${coordinates[0].x} ${plotBottom} Z`;
  const yTicks = getSpeedTicks(maxSpeed).map((speed, index, tickValues) => {
    const knots = mphToKnots(speed);

    return {
      emphasis: index === tickValues.length - 1,
      label: `${Math.round(knots)} kt`,
      y: plotBottom - (speed / maxSpeed) * plotHeight,
    };
  });
  const xTicks = getTimeTicks(domainStartMinute, domainEndMinute, 6).map((minute) => ({
    label: formatChartHour(minute),
    x: padding.left + ((minute - domainStartMinute) / minuteRange) * plotWidth,
  }));
  const directionMarkers = getDirectionMarkers(coordinates, plotBottom);

  return (
    <svg
      className="mini-chart wind-chart"
      role="img"
      aria-label={buildWindChartLabel(chartPoints)}
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
        <g
          className="mini-chart-grid-row"
          data-emphasis={tick.emphasis ? "baseline" : undefined}
          key={tick.label}
        >
          <line
            className="mini-chart-grid-line"
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

      {directionMarkers.map((marker) => (
        <g
          className="wind-chart-direction"
          key={`${marker.at}-${marker.x}`}
          transform={`translate(${marker.x} ${marker.y}) rotate(${marker.windDirectionDegrees ?? 0})`}
        >
          <circle cx="0" cy="0" r="10" />
          <path d="M 0 -6 L 3.75 2.5 L 0 0.5 L -3.75 2.5 Z" />
        </g>
      ))}

      {xTicks.map((tick) => (
        <g className="mini-chart-x-tick" key={tick.label}>
          <line
            className="mini-chart-tick-mark"
            x1={tick.x}
            x2={tick.x}
            y1={plotBottom}
            y2={plotBottom + 5}
          />
          <text x={tick.x} y={height - 8} textAnchor="middle">
            {tick.label}
          </text>
        </g>
      ))}

      <text className="mini-chart-axis-label" x={padding.left} y={14} textAnchor="start">
        {yAxisLabel}
      </text>
      <text
        className="mini-chart-axis-label"
        x={padding.left + plotWidth / 2}
        y={height - 2}
        textAnchor="middle"
      >
        {xAxisLabel}
      </text>
    </svg>
  );
}

function ChartEmptyState({
  detail,
  icon,
  title,
}: {
  detail: string;
  icon: typeof CircleDashed;
  title: string;
}) {
  return (
    <div className="weather-chart-empty">
      <ReportState detail={detail} icon={icon} title={title} />
    </div>
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
    value: formatTemperatureValue(
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
    detail: observed?.direction ?? summary?.windDirection ?? "Direction unavailable",
    icon: Wind,
    label: "Wind",
    value:
      speedMph === undefined
        ? emptyValue(Wind, "No reading")
        : filledValue(formatKnotsFromMph(speedMph)),
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
    value:
      gustMph === undefined
        ? emptyValue(Compass, "No gusts")
        : filledValue(formatKnotsFromMph(gustMph)),
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
        ? emptyValue(Droplets, "No reading")
        : filledValue(formatTemperature(waterTemperature.temperatureFahrenheit)),
  };
}

function getWaveStats(report: MarineWeatherReportData): WeatherStat[] {
  const wave = report.waveObservation;

  if (!wave) {
    return [];
  }

  return [
    {
      detail: "Significant wave height",
      icon: Waves,
      label: "Height",
      value:
        wave.heightFeet === undefined
          ? emptyValue(Waves, "No height")
          : filledValue(`${wave.heightFeet.toFixed(1)} ft`),
    },
    {
      detail: "Dominant period",
      icon: Waves,
      label: "Period",
      value:
        wave.periodSeconds === undefined
          ? emptyValue(Waves, "No period")
          : filledValue(`${Math.round(wave.periodSeconds)} sec`),
    },
    {
      detail: "Mean wave direction",
      icon: Compass,
      label: "Direction",
      value:
        wave.directionDegrees === undefined
          ? emptyValue(Compass, "No direction")
          : filledValue(`${Math.round(wave.directionDegrees)} deg`),
    },
  ];
}

function getCurrentStats(report: MarineWeatherReportData): WeatherStat[] {
  const current = report.currentObservation;

  if (!current) {
    return [];
  }

  return [
    {
      detail: current.direction ?? "Current direction unavailable",
      icon: Waves,
      label: "Current",
      value:
        current.speedKnots === undefined
          ? emptyValue(Waves, "No current")
          : filledValue(`${current.speedKnots.toFixed(1)} kt`),
    },
    {
      detail: "Current direction",
      icon: Compass,
      label: "Set",
      value:
        current.directionDegrees === undefined
          ? emptyValue(Compass, "No set")
          : filledValue(`${Math.round(current.directionDegrees)} deg`),
    },
  ];
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
  return `${Math.round(value ?? 0)}°F`;
}

function formatTemperatureValue(value?: number): ReportValue {
  return value === undefined ? emptyValue(CloudSun, "No temp") : filledValue(formatTemperature(value));
}

function formatWindSummaryValue(direction?: string, speedMph?: number): ReportValue {
  if (speedMph === undefined) {
    return emptyValue(Wind, "No wind");
  }

  return filledValue(`${direction ?? "Variable"} ${formatKnotsFromMph(speedMph)}`);
}

function formatKnotsFromMph(speedMph?: number): string {
  return `${Math.round(mphToKnots(speedMph ?? 0))} kt`;
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

function getDirectionMarkers(
  points: Array<HourlyWeatherPoint & { gustY: number; speedY: number; x: number }>,
  plotBottom: number,
) {
  if (points.length === 0) {
    return [];
  }

  const targetIndexes = [0, 0.33, 0.66, 1].map((ratio) =>
    Math.min(points.length - 1, Math.round((points.length - 1) * ratio)),
  );
  const uniqueIndexes = Array.from(new Set(targetIndexes));

  return uniqueIndexes
    .map((index) => points[index])
    .filter((point) => point.windDirectionDegrees !== undefined)
    .map((point) => ({
      ...point,
      y: plotBottom - 16,
    }));
}

function buildWindChartLabel(points: HourlyWeatherPoint[]): string {
  const maxSpeed = Math.max(...points.map((point) => point.windSpeedMph ?? 0), 0);
  const maxGust = Math.max(
    ...points.map((point) => point.windGustMph ?? point.windSpeedMph ?? 0),
    0,
  );

  return `Hourly wind forecast up to ${Math.round(mphToKnots(maxSpeed))} knots with gusts up to ${Math.round(mphToKnots(maxGust))} knots.`;
}

function buildWaveChartLabel(observation: MarineWeatherReportData["waveObservation"]): string {
  if (!observation) {
    return "Wave observation unavailable.";
  }

  const parts = [
    observation.heightFeet !== undefined
      ? `${observation.heightFeet.toFixed(1)} foot wave height`
      : "wave height unavailable",
    observation.periodSeconds !== undefined
      ? `${Math.round(observation.periodSeconds)} second period`
      : "period unavailable",
    observation.directionDegrees !== undefined
      ? `${Math.round(observation.directionDegrees)} degree direction`
      : "direction unavailable",
  ];

  return `Observed wave cycle with ${parts.join(", ")}.`;
}
