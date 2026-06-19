import { useId } from "react";
import {
  ArrowDownToLine,
  ArrowUpDown,
  ArrowUpToLine,
  CircleDashed,
  LoaderCircle,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { ActivityId } from "../../activities";
import type {
  TideChartPoint,
  TidePrediction,
  TideReport as TideReportData,
} from "../../domain/tide/types";
import { ReportState } from "./ReportState";

export interface TideReportProps {
  activityId: ActivityId;
  errorMessage?: string;
  isLoading: boolean;
  report?: TideReportData;
}

type TideReportVariant = "compact" | "feature";

const miniChartDimensions = {
  height: 236,
  padding: { bottom: 38, left: 56, right: 18, top: 18 },
  width: 720,
} as const;

const tideChartDimensions = {
  height: 252,
  padding: { bottom: 56, left: 58, right: 22, top: 30 },
  width: 720,
} as const;

export function TideReport({
  activityId,
  errorMessage,
  isLoading,
  report,
}: TideReportProps) {
  const variant = getTideReportVariant(activityId);

  if (isLoading) {
    return (
      <section className="tide-report" data-variant={variant} aria-live="polite">
        <h2 id="tide-report-heading" className="sr-only">
          Tide report
        </h2>
        <div className="tide-loading">
          <ReportState
            detail="Pulling NOAA predictions for the selected station."
            icon={LoaderCircle}
            title="Loading tide report"
          />
        </div>
      </section>
    );
  }

  if (errorMessage || !report) {
    return (
      <section className="tide-report" data-variant={variant} aria-live="polite">
        <h2 id="tide-report-heading" className="sr-only">
          Tide report
        </h2>
        <div className="tide-error">
          <ReportState
            detail="NOAA did not return predictions for this station right now."
            icon={TriangleAlert}
            title="Tide report unavailable"
          />
        </div>
      </section>
    );
  }

  const highs = report.highLow.filter((prediction) => prediction.type === "high");
  const lows = report.highLow.filter((prediction) => prediction.type === "low");
  const lowestLow = getLowestTide(lows);
  const highestHigh = getHighestTide(highs);
  const chartSummary = getChartSummary(report.chart);

  return (
    <section className="tide-report" data-variant={variant} aria-labelledby="tide-report-heading">
      <h2 id="tide-report-heading" className="sr-only">
        Tide report
      </h2>

      <div className="api-card-grid tide-card-grid">
        <article className="api-data-card tide-data-card">
          <header className="api-data-card-header">
            <div>
              <p className="eyebrow">Tide report</p>
              <h3>{variant === "feature" ? "Tidepool timing" : "Tide timing"}</h3>
            </div>
            <span>{variant === "feature" ? "NOAA chart" : "NOAA"}</span>
          </header>

          <div className="api-data-card-chart">
            <TideChart
              events={report.highLow}
              points={report.chart}
              xAxisLabel="Local time"
              xTickIntervalHours={variant === "feature" ? 4 : 6}
              yAxisLabel="Tide height"
            />
          </div>

          <div className="api-data-card-content">
            <div className="tide-stat-grid">
              <TideStat
                detail={lowestLow ? formatTime(lowestLow.at) : "Prediction unavailable"}
                emptyText="No low"
                icon={ArrowDownToLine}
                label={variant === "feature" ? "Lowest tide" : "Next low"}
                value={lowestLow ? formatHeight(lowestLow.heightFeet) : undefined}
              />
              <TideStat
                detail={highestHigh ? formatTime(highestHigh.at) : "Prediction unavailable"}
                emptyText="No high"
                icon={ArrowUpToLine}
                label={variant === "feature" ? "Highest tide" : "Next high"}
                value={highestHigh ? formatHeight(highestHigh.heightFeet) : undefined}
              />
              {variant !== "compact" ? (
                <TideStat
                  detail="Predicted spread"
                  emptyText="No range"
                  icon={ArrowUpDown}
                  label="Daily range"
                  value={chartSummary ? formatHeight(chartSummary.rangeFeet) : undefined}
                />
              ) : null}
            </div>

            <p className="tide-source-note">
              {report.sourceName} predictions in feet relative to {report.datum}.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

function TideChart({
  events,
  points,
  xAxisLabel,
  xTickIntervalHours,
  yAxisLabel,
}: {
  events: TidePrediction[];
  points: TideChartPoint[];
  xAxisLabel: string;
  xTickIntervalHours: number;
  yAxisLabel: string;
}) {
  const gradientId = `tide-chart-gradient-${useId().replace(/:/g, "")}`;
  const { height, padding, width } = tideChartDimensions;

  if (points.length === 0) {
    return (
      <div className="tide-chart-empty">
        <ReportState
          detail="NOAA did not return curve points for this day."
          icon={CircleDashed}
          title="No tide chart data"
        />
      </div>
    );
  }

  const heights = points.map((point) => point.heightFeet);
  const minHeight = Math.min(...heights);
  const maxHeight = Math.max(...heights);
  const range = Math.max(maxHeight - minHeight, 1);
  const startMinute = getChartMinute(points[0].at);
  const endMinute = getChartMinute(points[points.length - 1].at);
  const minuteRange = Math.max(endMinute - startMinute, 1);
  const plotBottom = height - padding.bottom;
  const plotHeight = height - padding.top - padding.bottom;
  const plotWidth = width - padding.left - padding.right;
  const coordinates = points.map((point) => {
    const pointMinute = getChartMinute(point.at);
    const x = padding.left + ((pointMinute - startMinute) / minuteRange) * plotWidth;
    const y = plotBottom - ((point.heightFeet - minHeight) / range) * plotHeight;

    return { ...point, x, y };
  });

  const linePath = buildSmoothPath(coordinates);
  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${plotBottom} L ${coordinates[0].x} ${plotBottom} Z`;
  const timeTicks = getTimeTicks(startMinute, endMinute, xTickIntervalHours).map((minute) => ({
    label: formatChartHour(minute),
    x: padding.left + ((minute - startMinute) / minuteRange) * plotWidth,
  }));
  const yTicks = getHeightTicks(minHeight, maxHeight).map((heightFeet, index, tickValues) => ({
    emphasis: index === tickValues.length - 1,
    heightFeet,
    y: plotBottom - ((heightFeet - minHeight) / range) * plotHeight,
  }));

  return (
    <svg
      className="mini-chart tide-chart"
      role="img"
      aria-label={buildTideChartLabel(events, maxHeight, minHeight)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
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
          <stop className="tide-chart-gradient-top" offset="0%" />
          <stop className="tide-chart-gradient-bottom" offset="100%" />
        </linearGradient>
      </defs>

      {yTicks.map((tick) => (
        <g
          className="mini-chart-grid-row"
          data-emphasis={tick.emphasis ? "baseline" : undefined}
          key={tick.heightFeet}
        >
          <line
            className="mini-chart-grid-line"
            x1={padding.left}
            x2={width - padding.right}
            y1={tick.y}
            y2={tick.y}
          />
          <text x={padding.left - 10} y={tick.y + 4} textAnchor="end">
            {formatHeight(tick.heightFeet)}
          </text>
        </g>
      ))}

      <path
        className="tide-chart-area"
        d={areaPath}
        style={{ fill: `url(#${gradientId})` }}
      />
      <path className="tide-chart-line" d={linePath} />

      {timeTicks.map((tick) => (
        <g className="mini-chart-x-tick" key={tick.label}>
          <line
            className="mini-chart-tick-mark"
            x1={tick.x}
            x2={tick.x}
            y1={plotBottom}
            y2={plotBottom + 5}
          />
          <text x={tick.x} y={plotBottom + 22} textAnchor="middle">
            {tick.label}
          </text>
        </g>
      ))}

      <text className="mini-chart-axis-label" x={padding.left} y={16} textAnchor="start">
        {yAxisLabel}
      </text>
      <text
        className="mini-chart-axis-label"
        x={padding.left + plotWidth / 2}
        y={height - 8}
        textAnchor="middle"
      >
        {xAxisLabel}
      </text>

      {events.slice(0, 4).map((event) => {
        const point = getNearestChartPoint(event.at, coordinates);

        return point ? (
          <g className="tide-chart-event" data-type={event.type} key={`${event.at}-${event.type}`}>
            <line className="tide-chart-event-stem" x1={point.x} x2={point.x} y1={point.y} y2={plotBottom} />
            <circle cx={point.x} cy={point.y} r="4.5" />
          </g>
        ) : null;
      })}
    </svg>
  );
}

function TideStat({
  detail,
  emptyText,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  emptyText: string;
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <div className="tide-stat">
      <span>
        <Icon aria-hidden="true" size={16} strokeWidth={2.2} />
        {label}
      </span>
      {value ? (
        <strong>{value}</strong>
      ) : (
        <span className="tide-stat-empty">{emptyText}</span>
      )}
      <small>{detail}</small>
    </div>
  );
}

function getTideReportVariant(activityId: ActivityId): TideReportVariant {
  if (activityId === "tidepools") {
    return "feature";
  }

  return "compact";
}

function getLowestTide(predictions: TidePrediction[]): TidePrediction | undefined {
  return predictions.reduce<TidePrediction | undefined>(
    (lowest, prediction) =>
      !lowest || prediction.heightFeet < lowest.heightFeet ? prediction : lowest,
    undefined,
  );
}

function getHighestTide(predictions: TidePrediction[]): TidePrediction | undefined {
  return predictions.reduce<TidePrediction | undefined>(
    (highest, prediction) =>
      !highest || prediction.heightFeet > highest.heightFeet ? prediction : highest,
    undefined,
  );
}

function getChartSummary(points: TideChartPoint[]) {
  if (points.length === 0) {
    return undefined;
  }

  const heights = points.map((point) => point.heightFeet);

  return {
    rangeFeet: Math.max(...heights) - Math.min(...heights),
  };
}

function getNearestChartPoint(
  eventTime: string,
  points: Array<TideChartPoint & { x: number; y: number }>,
) {
  const eventMinutes = getChartMinute(eventTime);

  return points.reduce<typeof points[number] | undefined>((nearest, point) => {
    const pointMinutes = getChartMinute(point.at);
    const pointDistance = Math.abs(pointMinutes - eventMinutes);

    if (!nearest) {
      return point;
    }

    const nearestDistance = Math.abs(getChartMinute(nearest.at) - eventMinutes);

    return pointDistance < nearestDistance ? point : nearest;
  }, undefined);
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

function getHeightTicks(minHeight: number, maxHeight: number): number[] {
  const range = Math.max(maxHeight - minHeight, 1);
  const step = range / 3;

  return Array.from({ length: 4 }, (_, index) => maxHeight - step * index);
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

function formatHeight(heightFeet: number): string {
  return `${heightFeet.toFixed(1)} ft`;
}

function formatTime(localTime: string): string {
  const hour = Number(localTime.slice(11, 13));
  const minute = localTime.slice(14, 16);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function buildTideChartLabel(
  events: TidePrediction[],
  maxHeight: number,
  minHeight: number,
): string {
  const nextEvent = events[0];

  if (!nextEvent) {
    return `Predicted tide range from ${formatHeight(minHeight)} to ${formatHeight(maxHeight)}.`;
  }

  return `Predicted tide range from ${formatHeight(minHeight)} to ${formatHeight(maxHeight)}. Next ${nextEvent.type} at ${formatTime(nextEvent.at)}.`;
}
