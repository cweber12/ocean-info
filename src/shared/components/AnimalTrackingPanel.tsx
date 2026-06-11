import type { AnimalTrackingReport } from "../../domain/animal-tracking/types";

export interface AnimalTrackingPanelProps {
  errorMessage?: string;
  isLoading: boolean;
  report?: AnimalTrackingReport;
}

export function AnimalTrackingPanel({
  errorMessage,
  isLoading,
  report,
}: AnimalTrackingPanelProps) {
  return (
    <section className="tracking-panel" aria-labelledby="tracking-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Animal tracking</p>
          <h2 id="tracking-heading">Tagged animals nearby</h2>
        </div>
        <span>{report?.sourceName ?? "Movebank"}</span>
      </div>

      {errorMessage ? (
        <div className="tracking-state">Animal tracking is unavailable right now.</div>
      ) : isLoading ? (
        <div className="tracking-state">Loading recent tracks...</div>
      ) : report && report.tracks.length > 0 ? (
        <>
          <p className="tracking-meta">
            {report.totalTracks} {report.totalTracks === 1 ? "track" : "tracks"} in
            the current search window
          </p>
          <div className="tracking-list">
            {report.tracks.map((track) => (
              <article className="tracking-item" key={track.id}>
                <div>
                  <strong>{track.individualName ?? track.speciesName ?? "Unknown tag"}</strong>
                  <small>
                    {track.studyName ?? "Study"}
                    {track.speciesName ? ` · ${track.speciesName}` : ""}
                  </small>
                </div>
                <div className="tracking-item-meta">
                  <span>{track.pointCount} pts</span>
                  <small>{formatTrackAge(track.latestPoint?.timestamp)}</small>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="tracking-state">
          No tracked animal positions matched this location and date range.
        </div>
      )}
    </section>
  );
}

function formatTrackAge(timestamp?: string) {
  if (!timestamp) {
    return "Timestamp unknown";
  }

  const parsed = new Date(timestamp);
  const milliseconds = Date.now() - parsed.getTime();

  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return "Freshness unavailable";
  }

  const hours = Math.floor(milliseconds / (60 * 60 * 1000));

  if (hours < 1) {
    return "<1h ago";
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
