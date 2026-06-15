import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, CircleX, X } from "lucide-react";
import type { ActivityDefinition, ActivityId } from "../../activities";
import type { PlannerActivityContent } from "../../app/plannerContent";
import type { CoastalLocation } from "../../domain/location/types";
import type { TideReport } from "../../domain/tide/types";
import type { HourlyWeatherPoint, MarineWeatherReport } from "../../domain/weather/types";

type VerdictTone = "great" | "watch" | "avoid";

const verdictMeta: Record<VerdictTone, { icon: typeof CircleCheck; label: string }> = {
  great: { icon: CircleCheck, label: "Great conditions" },
  watch: { icon: CircleAlert, label: "Worth a look" },
  avoid: { icon: CircleX, label: "Plan carefully" },
};

function isVerdictTone(value: string): value is VerdictTone {
  return value === "great" || value === "watch" || value === "avoid";
}

export interface DaySummaryPanelProps {
  activityId: ActivityId;
  formattedDate: string;
  isCautionOpen: boolean;
  isTideLoading: boolean;
  isWeatherLoading: boolean;
  onCautionClose: () => void;
  onCautionToggle: () => void;
  plannerContent: PlannerActivityContent;
  selectedActivity: ActivityDefinition;
  selectedLocation: CoastalLocation;
  tideReport?: TideReport;
  weatherReport?: MarineWeatherReport;
}

function Accent({ children }: { children: ReactNode }) {
  return <span className="summary-accent">{children}</span>;
}

function getTempAtHour(
  hourly: HourlyWeatherPoint[] | undefined,
  targetHour: number,
): number | undefined {
  if (!hourly || hourly.length === 0) return undefined;

  const scored = hourly
    .filter((pt) => pt.airTemperatureFahrenheit !== undefined)
    .map((pt) => {
      const hour = Number(pt.at.slice(11, 13));
      return { pt, distance: Math.abs(hour - targetHour) };
    });

  if (scored.length === 0) return undefined;
  scored.sort((a, b) => a.distance - b.distance);
  return scored[0].pt.airTemperatureFahrenheit;
}

function getWindAtHour(
  hourly: HourlyWeatherPoint[] | undefined,
  targetHour: number,
): { speedMph?: number; direction?: string } {
  if (!hourly || hourly.length === 0) return {};

  const scored = hourly
    .filter((pt) => pt.windSpeedMph !== undefined)
    .map((pt) => {
      const hour = Number(pt.at.slice(11, 13));
      return { pt, distance: Math.abs(hour - targetHour) };
    });

  if (scored.length === 0) return {};
  scored.sort((a, b) => a.distance - b.distance);
  const pt = scored[0].pt;
  return { speedMph: pt.windSpeedMph, direction: pt.windDirection };
}

function mphToKnots(mph: number): number {
  return mph * 0.868976;
}

function formatTemp(f: number | undefined): string {
  return f === undefined ? "--°F" : `${Math.round(f)}°F`;
}

function formatKnots(mph: number | undefined): string {
  return mph === undefined ? "--" : `${Math.round(mphToKnots(mph))} kt`;
}

function buildSummaryParagraphs(
  activityId: ActivityId,
  weatherReport: MarineWeatherReport | undefined,
  tideReport: TideReport | undefined,
  locationName: string,
): ReactNode[] {
  const hourly = weatherReport?.hourlyForecast;
  const morningTemp = getTempAtHour(hourly, 8);
  const afternoonTemp = getTempAtHour(hourly, 13);
  const eveningTemp = getTempAtHour(hourly, 19);
  const morningWind = getWindAtHour(hourly, 8);
  const afternoonWind = getWindAtHour(hourly, 14);
  const waterTemp = weatherReport?.waterTemperature?.temperatureFahrenheit;
  const forecast = weatherReport?.summary?.shortForecast;
  const waveHeight = weatherReport?.waveObservation?.heightFeet;
  const wavePeriod = weatherReport?.waveObservation?.periodSeconds;
  const tides = tideReport?.highLow ?? [];
  const nextLow = tides.find((t) => t.type === "low");
  const nextHigh = tides.find((t) => t.type === "high");

  const sentences: ReactNode[] = [];

  // ── Sentence 1: temperature arc across the day ──────────────────────────────
  if (morningTemp !== undefined && afternoonTemp !== undefined) {
    const tempArc =
      afternoonTemp > morningTemp + 3
        ? "warming through the afternoon"
        : afternoonTemp < morningTemp - 3
          ? "cooling as the day progresses"
          : "staying consistent through the day";

    sentences.push(
      <span>
        At <Accent>{locationName}</Accent>, morning air temperatures around{" "}
        <Accent>{formatTemp(morningTemp)}</Accent> climb to{" "}
        <Accent>{formatTemp(afternoonTemp)}</Accent> by early afternoon
        {eveningTemp !== undefined ? (
          <>
            {" "}
            and ease back to <Accent>{formatTemp(eveningTemp)}</Accent> by evening
          </>
        ) : null}
        {" "}— {tempArc}
        {forecast ? ` with ${forecast.toLowerCase()}` : ""}.
      </span>,
    );
  } else if (morningTemp !== undefined) {
    sentences.push(
      <span>
        Morning air temperatures at <Accent>{locationName}</Accent> are near{" "}
        <Accent>{formatTemp(morningTemp)}</Accent>
        {forecast ? ` with ${forecast.toLowerCase()}` : ""}.
      </span>,
    );
  }

  // ── Sentence 2: water + wind ─────────────────────────────────────────────────
  const hasWater = waterTemp !== undefined;
  const hasWind = morningWind.speedMph !== undefined;

  if (hasWater || hasWind || (waveHeight !== undefined)) {
    const parts: ReactNode[] = [];

    if (hasWater) {
      parts.push(
        <span>
          Water temperature is <Accent>{formatTemp(waterTemp)}</Accent>
        </span>,
      );
    }

    if (waveHeight !== undefined && (activityId === "surf" || activityId === "sup-kayak" || activityId === "sail" || activityId === "dive")) {
      parts.push(
        <span>
          {wavePeriod ? (
            <>
              surf is running at <Accent>{waveHeight.toFixed(1)} ft</Accent> with{" "}
              <Accent>{Math.round(wavePeriod)} sec</Accent> period
            </>
          ) : (
            <>
              waves are near <Accent>{waveHeight.toFixed(1)} ft</Accent>
            </>
          )}
        </span>,
      );
    }

    if (hasWind && morningWind.speedMph !== undefined) {
      const afternoonSpeedKt = afternoonWind.speedMph
        ? Math.round(mphToKnots(afternoonWind.speedMph))
        : undefined;
      const morningSpeedKt = Math.round(mphToKnots(morningWind.speedMph));
      const windGrows =
        afternoonSpeedKt !== undefined && afternoonSpeedKt > morningSpeedKt + 4;

      parts.push(
        <span>
          {morningWind.direction ? (
            <>
              <Accent>{morningWind.direction}</Accent> winds at{" "}
              <Accent>{formatKnots(morningWind.speedMph)}</Accent> in the morning
            </>
          ) : (
            <>
              winds at <Accent>{formatKnots(morningWind.speedMph)}</Accent> in the morning
            </>
          )}
          {windGrows && afternoonSpeedKt !== undefined ? (
            <>
              {" "}building to <Accent>{afternoonSpeedKt} kt</Accent> by afternoon
            </>
          ) : null}
        </span>,
      );
    }

    if (parts.length > 0) {
      sentences.push(
        <span>
          {parts.map((part, i) => (
            <span key={i}>
              {i === 0
                ? part
                : i === parts.length - 1
                  ? <>, and {part}</>
                  : <>, {part}</>}
            </span>
          ))}
          .
        </span>,
      );
    }
  }

  // ── Sentence 3: tide context ──────────────────────────────────────────────────
  if (nextLow || nextHigh) {
    const formatTideTime = (at: string) => {
      const hour = Number(at.slice(11, 13));
      const minute = at.slice(14, 16);
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minute} ${period}`;
    };

    const tideParts: ReactNode[] = [];

    if (nextLow) {
      const isNegative = nextLow.heightFeet < 0;
      tideParts.push(
        <span>
          low tide of <Accent>{nextLow.heightFeet.toFixed(1)} ft</Accent>
          {isNegative ? <> (a minus tide — excellent for exploring)</> : null} at{" "}
          <Accent>{formatTideTime(nextLow.at)}</Accent>
        </span>,
      );
    }

    if (nextHigh) {
      tideParts.push(
        <span>
          high tide of <Accent>{nextHigh.heightFeet.toFixed(1)} ft</Accent> at{" "}
          <Accent>{formatTideTime(nextHigh.at)}</Accent>
        </span>,
      );
    }

    if (tideParts.length > 0) {
      const tideVerb =
        activityId === "tidepools"
          ? "Tidepool exposure is driven by a"
          : activityId === "surf"
            ? "The tide runs through a"
            : "Tides today reach a";

      sentences.push(
        <span>
          {tideVerb}{" "}
          {tideParts.map((part, i) => (
            <span key={i}>
              {i === 0
                ? part
                : <>, reaching a {part}</>}
            </span>
          ))}
          .
        </span>,
      );
    }
  }

  // ── Sentence 4: activity-specific note ──────────────────────────────────────
  const activityNote = getActivityNote(activityId, weatherReport, waveHeight);
  if (activityNote) {
    sentences.push(<span>{activityNote}</span>);
  }

  // Fallback if no data available yet
  if (sentences.length === 0) {
    return [
      <span>
        Loading conditions for <Accent>{locationName}</Accent>. Check back once weather
        and tide data have loaded.
      </span>,
    ];
  }

  return sentences;
}

function getActivityNote(
  activityId: ActivityId,
  weatherReport: MarineWeatherReport | undefined,
  waveHeight: number | undefined,
): ReactNode | null {
  const wind = weatherReport?.summary;
  const windKnots = wind?.windSpeedMph
    ? Math.round(wind.windSpeedMph * 0.868976)
    : undefined;

  switch (activityId) {
    case "surf":
      if (waveHeight !== undefined && waveHeight < 1.5) {
        return (
          <>
            Surf is on the <Accent>smaller side</Accent> — better for longboards and
            learning; shortboarders may find it flat.
          </>
        );
      }
      if (waveHeight !== undefined && waveHeight >= 4) {
        return (
          <>
            <Accent>Solid swell</Accent> in the water — intermediate and advanced surfers
            will find quality waves; beginners should sit this one out.
          </>
        );
      }
      return null;

    case "sail":
      if (windKnots !== undefined && windKnots > 20) {
        return (
          <>
            <Accent>Strong winds</Accent> today favor experienced sailors; check for small
            craft advisories before heading out.
          </>
        );
      }
      if (windKnots !== undefined && windKnots < 8) {
        return (
          <>
            Light winds may make for a <Accent>drifty afternoon</Accent> — good for
            casual sailing but not performance.
          </>
        );
      }
      return null;

    case "tidepools":
      return (
        <>
          Arrive <Accent>30–45 min before low tide</Accent> to maximize exposed pool
          coverage and settle in before water rushes back.
        </>
      );

    case "dive":
      return (
        <>
          Surface conditions look manageable; visibility will depend on surge and{" "}
          <Accent>recent runoff</Accent> — check local dive reports before entry.
        </>
      );

    case "beach-day":
      if (windKnots !== undefined && windKnots > 15) {
        return (
          <>
            <Accent>Afternoon winds</Accent> will kick up sand — stake out a windbreak or
            plan to wrap up before 2 PM.
          </>
        );
      }
      return null;

    case "sup-kayak":
      if (windKnots !== undefined && windKnots > 12) {
        return (
          <>
            Wind over <Accent>12 kt</Accent> will push you around on a SUP — hug the
            coast and paddle early while it stays manageable.
          </>
        );
      }
      return null;

    default:
      return null;
  }
}

export function DaySummaryPanel({
  activityId,
  formattedDate,
  isCautionOpen,
  onCautionClose,
  onCautionToggle,
  plannerContent,
  selectedActivity,
  selectedLocation,
  tideReport,
  weatherReport,
}: DaySummaryPanelProps) {
  const summaryParagraphs = buildSummaryParagraphs(
    activityId,
    weatherReport,
    tideReport,
    selectedLocation.name,
  );

  const verdictTone = isVerdictTone(plannerContent.recommendation.tone)
    ? plannerContent.recommendation.tone
    : "watch";
  const verdict = verdictMeta[verdictTone];
  const VerdictIcon = verdict.icon;

  return (
    <section
      className="day-summary-panel"
      id="planner-panel"
      aria-labelledby="activity-select-label"
      aria-live="polite"
      data-tone={plannerContent.recommendation.tone}
    >
      <div className="day-summary-header">
        <div className="day-summary-meta">
          <span className="day-summary-activity">{selectedActivity.name}</span>
          <span className="day-summary-sep" aria-hidden="true">·</span>
          <span className="day-summary-location">{selectedLocation.name}</span>
          <span className="day-summary-sep" aria-hidden="true">·</span>
          <span className="day-summary-date">{formattedDate}</span>
        </div>

        <div className="caution-popover-wrap">
          <button
            className="icon-button caution-trigger"
            type="button"
            aria-label={`Open cautions for ${selectedActivity.name}`}
            aria-expanded={isCautionOpen}
            aria-controls="caution-popover"
            onClick={onCautionToggle}
          >
            <CircleAlert aria-hidden="true" size={20} strokeWidth={2.2} />
          </button>

          {isCautionOpen ? (
            <div
              className="caution-popover"
              id="caution-popover"
              role="dialog"
              aria-labelledby="caution-popover-title"
              data-tone={plannerContent.caution.tone}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  onCautionClose();
                }
              }}
            >
              <div className="caution-popover-heading">
                <div>
                  <p className="eyebrow">Cautions</p>
                  <h3 id="caution-popover-title">{plannerContent.caution.label}</h3>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Close cautions"
                  onClick={onCautionClose}
                >
                  <X aria-hidden="true" size={18} strokeWidth={2.2} />
                </button>
              </div>
              <p>{plannerContent.caution.message}</p>
            </div>
          ) : null}
        </div>
      </div>

      <span className="day-summary-verdict" data-tone={verdictTone}>
        <VerdictIcon aria-hidden="true" size={16} strokeWidth={2.4} />
        {verdict.label}
      </span>

      <h2 className="day-summary-heading">{plannerContent.recommendation.label}</h2>

      <div className="day-summary-body">
        {summaryParagraphs.map((sentence, i) => (
          <p key={i} className="day-summary-sentence">
            {sentence}
          </p>
        ))}
      </div>

      <div className="day-summary-window">
        <span className="day-summary-window-label">Best window</span>
        <strong className="day-summary-window-time">
          {plannerContent.bestWindow.label}
        </strong>
        <p className="day-summary-window-reason">
          {plannerContent.bestWindow.reason}
        </p>
      </div>
    </section>
  );
}
