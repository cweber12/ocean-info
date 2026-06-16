import {
  CircleDashed,
  FlaskConical,
  LoaderCircle,
  MapPin,
  RadioTower,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import type { ActivityId } from "../../activities";
import type {
  OceanConditionObservation,
  WaterQualityInsight,
  WaterQualityReport as WaterQualityReportData,
  WaterQualitySample,
} from "../../domain/water/types";
import { ReportState } from "./ReportState";

export interface WaterQualityReportProps {
  activityId: ActivityId;
  errorMessage?: string;
  isLoading: boolean;
  report?: WaterQualityReportData;
}

export function WaterQualityReport({
  activityId,
  errorMessage,
  isLoading,
  report,
}: WaterQualityReportProps) {
  if (isLoading) {
    return (
      <section className="water-quality-report" aria-live="polite">
        <h2 id="water-quality-report-heading" className="sr-only">
          Water quality report
        </h2>
        <div className="water-quality-loading">
          <ReportState
            detail="Loading WQP discrete samples and SCCOOS near-real-time sensor observations."
            icon={LoaderCircle}
            title="Loading water quality report"
          />
        </div>
      </section>
    );
  }

  if (errorMessage || !report) {
    return (
      <section className="water-quality-report" aria-live="polite">
        <h2 id="water-quality-report-heading" className="sr-only">
          Water quality report
        </h2>
        <div className="water-quality-error">
          <ReportState
            detail="Water quality sources are unavailable for this location right now."
            icon={TriangleAlert}
            title="Water quality report unavailable"
          />
        </div>
      </section>
    );
  }

  const nearestStation = report.stations.find((station) => station.source === "WQP");

  return (
    <section
      className="water-quality-report"
      aria-labelledby="water-quality-report-heading"
    >
      <h2 id="water-quality-report-heading" className="sr-only">
        Water quality report
      </h2>

      <div className="api-card-grid water-quality-card-grid">
        <article className="api-data-card water-quality-data-card">
          <header className="api-data-card-header">
            <div>
              <p className="eyebrow">Water quality</p>
              <h3>WQP samples and SCCOOS sensor context</h3>
            </div>
            <span>WQP + SCCOOS</span>
          </header>

          <div className="api-data-card-content">
            <div className="weather-stat-grid weather-stat-grid-dual">
              <WaterSummaryStat
                icon={ShieldAlert}
                label="County advisory"
                value="Not integrated yet"
                detail={report.advisoryStatus.message}
              />
              <WaterSummaryStat
                icon={MapPin}
                label="Nearest WQP station"
                value={nearestStation?.name ?? "No nearby station"}
                detail={nearestStation ? formatStationDetail(nearestStation) : "No WQP station metadata in range"}
              />
              <WaterSummaryStat
                icon={FlaskConical}
                label="Nearby WQP samples"
                value={`${report.recentBacteriaSamples.length + report.recentChemistrySamples.length} shown`}
                detail="WQP = discrete water-quality samples"
              />
              <WaterSummaryStat
                icon={RadioTower}
                label="Latest SCCOOS sensor"
                value={report.latestOceanObservation ? formatDateTime(report.latestOceanObservation.observedAt) : "Unavailable"}
                detail="SCCOOS = near-real-time ocean sensor data"
              />
            </div>

            <div className="water-quality-panel-grid">
              <DataSection
                emptyMessage="No recent WQP bacteria samples found nearby."
                items={report.recentBacteriaSamples}
                title="WQP nearby bacteria samples"
              />
              <DataSection
                emptyMessage="No recent WQP chemistry samples found nearby."
                items={report.recentChemistrySamples}
                title="WQP nearby chemistry samples"
              />
            </div>

            <OceanConditionsSection observation={report.latestOceanObservation} />
            <InsightsSection insights={report.insights} />

            {report.errors.length > 0 ? (
              <div className="water-quality-inline-note">
                <strong>Partial data only.</strong>
                <span>{report.errors.map((error) => error.message).join(" ")}</span>
              </div>
            ) : null}

            <p className="weather-source-note">
              County advisory = official beach safety status, not yet integrated. {getActivityHint(activityId)}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

function WaterSummaryStat({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: typeof ShieldAlert;
  label: string;
  value: string;
}) {
  return (
    <div className="weather-stat">
      <span>
        <Icon aria-hidden="true" size={16} strokeWidth={2.2} />
        {label}
      </span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function DataSection({
  emptyMessage,
  items,
  title,
}: {
  emptyMessage: string;
  items: WaterQualitySample[];
  title: string;
}) {
  return (
    <section className="water-quality-list" aria-label={title}>
      <header>
        <h4>{title}</h4>
      </header>

      {items.length > 0 ? (
        <ol>
          {items.map((item) => (
            <li key={buildSampleKey(item)}>
              <div>
                <strong>{item.characteristicName}</strong>
                <small>{formatSampleMeta(item)}</small>
              </div>
              <div>
                <strong>{formatSampleValue(item)}</strong>
                <small>{formatSampleAge(item)}</small>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="water-quality-empty">
          <ReportState
            detail={emptyMessage}
            icon={CircleDashed}
            title="No recent samples"
            variant="compact"
          />
        </div>
      )}
    </section>
  );
}

function OceanConditionsSection({
  observation,
}: {
  observation?: OceanConditionObservation;
}) {
  return (
    <section className="water-quality-list" aria-label="SCCOOS current ocean conditions">
      <header>
        <h4>SCCOOS current ocean conditions</h4>
      </header>

      {observation ? (
        <div className="water-quality-metric-grid">
          <Metric label="Water temp" value={formatTemperature(observation.waterTemperatureC)} />
          <Metric label="Salinity" value={formatMaybeNumber(observation.salinityPsu, "PSU")} />
          <Metric label="Chlorophyll" value={formatMaybeNumber(observation.chlorophyllUgL, "ug/L")} />
          <Metric label="Turbidity" value={formatMaybeNumber(observation.turbidityNtu, "NTU")} />
          <Metric label="pH" value={formatMaybeNumber(observation.phTotalScale)} />
          <Metric
            label="Oxygen"
            value={formatDissolvedOxygen(observation)}
          />
        </div>
      ) : (
        <div className="water-quality-empty">
          <ReportState
            detail="Scripps Pier sensor observations are unavailable right now."
            icon={CircleDashed}
            title="No sensor data"
            variant="compact"
          />
        </div>
      )}
    </section>
  );
}

function InsightsSection({
  insights,
}: {
  insights: WaterQualityInsight[];
}) {
  return (
    <section className="water-quality-list" aria-label="Water quality insights">
      <header>
        <h4>Insights</h4>
      </header>

      <div className="water-quality-insights">
        {insights.map((insight) => (
          <article className="water-quality-insight" key={insight.id}>
            <div className="water-quality-insight-header">
              <strong>{insight.title}</strong>
              <span data-severity={insight.severity}>{insight.severity}</span>
            </div>
            <p>{insight.summary}</p>
            {insight.evidence.length > 0 ? (
              <small>
                {insight.evidence
                  .map((item) => {
                    const value = item.value !== undefined ? `: ${item.value}${item.unit ? ` ${item.unit}` : ""}` : "";
                    return `${item.label}${value}`;
                  })
                  .join(" • ")}
              </small>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="water-quality-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildSampleKey(sample: WaterQualitySample) {
  return [
    sample.stationId ?? "unknown-station",
    sample.characteristicName,
    sample.sampleDateTime ?? sample.sampleDate ?? "unknown-date",
  ].join("|");
}

function formatSampleValue(sample: WaterQualitySample) {
  if (sample.value === undefined && !sample.rawValue) {
    return "No value";
  }

  const value = sample.value ?? sample.rawValue;
  return sample.unit ? `${value} ${sample.unit}` : String(value);
}

function formatSampleMeta(sample: WaterQualitySample) {
  const parts = [
    sample.stationName,
    sample.sampleDate ? formatDateTime(sample.sampleDateTime ?? sample.sampleDate) : undefined,
    sample.distanceKm !== undefined ? `${sample.distanceKm.toFixed(1)} km away` : undefined,
  ].filter((part): part is string => Boolean(part));

  return parts.join(" • ") || "Discrete sample";
}

function formatSampleAge(sample: WaterQualitySample) {
  const value = sample.sampleDateTime ?? sample.sampleDate;

  if (!value) {
    return "Sample age unavailable";
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return "Discrete sample";
  }

  const ageDays = Math.max(0, Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000)));

  return ageDays <= 0 ? "Recent sample" : `${ageDays} day${ageDays === 1 ? "" : "s"} old`;
}

function formatDateTime(value: string): string {
  const asDate = new Date(value);

  if (Number.isNaN(asDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(asDate);
}

function formatStationDetail(station: WaterQualityReportData["stations"][number]) {
  const parts = [station.siteType, station.provider].filter((part): part is string => Boolean(part));
  return parts.join(" • ") || station.stationId;
}

function formatTemperature(value?: number) {
  if (value === undefined) {
    return "Not available";
  }

  const fahrenheit = (value * 9) / 5 + 32;
  return `${value.toFixed(1)} C / ${fahrenheit.toFixed(1)} F`;
}

function formatMaybeNumber(value?: number, unit?: string) {
  if (value === undefined) {
    return "Not available";
  }

  return unit ? `${value.toFixed(2)} ${unit}` : value.toFixed(2);
}

function formatDissolvedOxygen(observation: OceanConditionObservation) {
  if (!observation.dissolvedOxygen) {
    return "Not available";
  }

  return observation.dissolvedOxygen.unit
    ? `${observation.dissolvedOxygen.value.toFixed(2)} ${observation.dissolvedOxygen.unit}`
    : observation.dissolvedOxygen.value.toFixed(2);
}

function getActivityHint(activityId: ActivityId): string {
  if (activityId === "surf" || activityId === "dive") {
    return "Use turbidity and chlorophyll as nearshore context, and treat bacteria samples as dated lab results rather than live status.";
  }

  if (activityId === "tidepools" || activityId === "beach-day") {
    return "Recent bacteria samples can add context after runoff, but they should not replace posted warnings or county closures.";
  }

  return "Use these readings as context alongside tides, weather, and local advisories.";
}
