import type { ActivityId } from "../../activities";
import type {
  TideChartPoint,
  TidePrediction,
  TideReport as TideReportData,
} from "../../domain/tide/types";

export interface TideReportProps {
  activityId: ActivityId;
  errorMessage?: string;
  isLoading: boolean;
  report?: TideReportData;
}

type TideReportVariant = "compact" | "feature" | "standard";

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
        <TideReportHeading variant={variant} />
        <div className="tide-loading">Loading NOAA tide predictions...</div>
      </section>
    );
  }

  if (errorMessage || !report) {
    return (
      <section className="tide-report" data-variant={variant} aria-live="polite">
        <TideReportHeading variant={variant} />
        <div className="tide-error">
          Tide predictions are unavailable for this station right now.
        </div>
      </section>
    );
  }

  const highs = report.highLow.filter((prediction) => prediction.type === "high");
  const lows = report.highLow.filter((prediction) => prediction.type === "low");
  const nextTides = report.highLow.slice(0, variant === "compact" ? 2 : 4);
  const lowestLow = getLowestTide(lows);
  const highestHigh = getHighestTide(highs);
  const chartSummary = getChartSummary(report.chart);

  return (
    <section className="tide-report" data-variant={variant} aria-labelledby="tide-report-heading">
      <TideReportHeading variant={variant} />

      <div className="tide-report-grid">
        <div className="tide-chart-panel">
          <TideChart points={report.chart} events={report.highLow} />
        </div>

        <div className="tide-summary-panel">
          <div className="tide-stat-grid">
            <TideStat
              label={variant === "feature" ? "Lowest tide" : "Next low"}
              value={lowestLow ? formatHeight(lowestLow.heightFeet) : "No low"}
              detail={lowestLow ? formatTime(lowestLow.at) : "Unavailable"}
            />
            <TideStat
              label={variant === "feature" ? "Highest tide" : "Next high"}
              value={highestHigh ? formatHeight(highestHigh.heightFeet) : "No high"}
              detail={highestHigh ? formatTime(highestHigh.at) : "Unavailable"}
            />
            {variant !== "compact" ? (
              <TideStat
                label="Daily range"
                value={chartSummary ? formatHeight(chartSummary.rangeFeet) : "No data"}
                detail="Predicted spread"
              />
            ) : null}
          </div>

          <div className="tide-events">
            <div className="tide-events-heading">
              <span>Upcoming</span>
              <small>{report.station.name}</small>
            </div>
            <ol>
              {nextTides.map((prediction) => (
                <li key={`${prediction.at}-${prediction.type}`}>
                  <span>{formatTime(prediction.at)}</span>
                  <strong>{prediction.type === "high" ? "High" : "Low"}</strong>
                  <span>{formatHeight(prediction.heightFeet)}</span>
                </li>
              ))}
            </ol>
          </div>

          {variant === "feature" ? (
            <p className="tide-source-note">
              {report.sourceName} predictions in feet relative to {report.datum}.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TideReportHeading({ variant }: { variant: TideReportVariant }) {
  return (
    <div className="section-heading tide-report-heading">
      <div>
        <p className="eyebrow">Tide report</p>
        <h2 id="tide-report-heading">
          {variant === "feature" ? "Tidepool timing" : "Tide timing"}
        </h2>
      </div>
      <span>{variant === "feature" ? "NOAA chart" : "NOAA"}</span>
    </div>
  );
}

function TideChart({
  events,
  points,
}: {
  events: TidePrediction[];
  points: TideChartPoint[];
}) {
  const width = 720;
  const height = 260;
  const padding = 28;

  if (points.length === 0) {
    return <div className="tide-chart-empty">No chart points available.</div>;
  }

  const heights = points.map((point) => point.heightFeet);
  const minHeight = Math.min(...heights);
  const maxHeight = Math.max(...heights);
  const range = Math.max(maxHeight - minHeight, 1);
  const coordinates = points.map((point, index) => {
    const x =
      padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((point.heightFeet - minHeight) / range) * (height - padding * 2);

    return { ...point, x, y };
  });

  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;

  return (
    <svg
      className="tide-chart"
      role="img"
      aria-label="Predicted tide height chart for the selected date"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polygon className="tide-chart-area" points={area} />
      <polyline className="tide-chart-line" points={line} />
      <line
        className="tide-chart-axis"
        x1={padding}
        x2={width - padding}
        y1={height - padding}
        y2={height - padding}
      />
      {events.slice(0, 4).map((event) => {
        const point = getNearestChartPoint(event.at, coordinates);

        return point ? (
          <g className="tide-chart-event" data-type={event.type} key={`${event.at}-${event.type}`}>
            <circle cx={point.x} cy={point.y} r="5" />
          </g>
        ) : null;
      })}
      <text x={padding} y={height - 8}>
        12a
      </text>
      <text x={width / 2 - 12} y={height - 8}>
        noon
      </text>
      <text x={width - padding - 24} y={height - 8}>
        11p
      </text>
    </svg>
  );
}

function TideStat({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="tide-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function getTideReportVariant(activityId: ActivityId): TideReportVariant {
  if (activityId === "tidepools") {
    return "feature";
  }

  if (activityId === "surf" || activityId === "dive") {
    return "compact";
  }

  return "standard";
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
  const eventHour = Number(eventTime.slice(11, 13));
  const eventMinute = Number(eventTime.slice(14, 16));
  const eventMinutes = eventHour * 60 + eventMinute;

  return points.reduce<typeof points[number] | undefined>((nearest, point) => {
    const pointHour = Number(point.at.slice(11, 13));
    const pointMinute = Number(point.at.slice(14, 16));
    const pointMinutes = pointHour * 60 + pointMinute;
    const pointDistance = Math.abs(pointMinutes - eventMinutes);

    if (!nearest) {
      return point;
    }

    const nearestHour = Number(nearest.at.slice(11, 13));
    const nearestMinute = Number(nearest.at.slice(14, 16));
    const nearestDistance = Math.abs(nearestHour * 60 + nearestMinute - eventMinutes);

    return pointDistance < nearestDistance ? point : nearest;
  }, undefined);
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
