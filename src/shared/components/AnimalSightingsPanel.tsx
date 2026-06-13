import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ActivityId } from "../../activities";
import type {
  AnimalSightingGroupReport,
  AnimalSightingPage,
} from "../../domain/animal-sightings/types";

export interface AnimalSightingsPanelProps {
  activityId: ActivityId;
  daysBack: number;
  errorMessage?: string;
  groupReport?: AnimalSightingGroupReport;
  isGroupsLoading: boolean;
  isSightingsLoading: boolean;
  onDaysBackChange: (daysBack: number) => void;
  onPageChange: (page: number) => void;
  onQueryChange: (query: string) => void;
  onRadiusKmChange: (radiusKm: number) => void;
  page: number;
  query: string;
  radiusKm: number;
  sightingPage?: AnimalSightingPage;
}

export function AnimalSightingsPanel({
  activityId,
  daysBack,
  errorMessage,
  groupReport,
  isGroupsLoading,
  isSightingsLoading,
  onDaysBackChange,
  onPageChange,
  onQueryChange,
  onRadiusKmChange,
  page,
  query,
  radiusKm,
  sightingPage,
}: AnimalSightingsPanelProps) {
  const hasNextPage = Boolean(sightingPage && page * 4 < sightingPage.totalResults);

  return (
    <section className="animal-sightings" aria-labelledby="animal-sightings-heading">
      <div className="section-heading animal-sightings-heading">
        <div>
          <p className="eyebrow">Animal sightings</p>
          <h2 id="animal-sightings-heading">{getActivitySightingHeading(activityId)}</h2>
        </div>
        <span>{groupReport?.sourceName ?? "iNaturalist"}</span>
      </div>

      <div className="animal-sightings-panel">
      <div className="animal-sightings-controls">
        <label htmlFor="animal-search">
          <span>Animal name</span>
          <div className="animal-search-field">
            <Search aria-hidden="true" size={18} strokeWidth={2.2} />
            <input
              id="animal-search"
              type="search"
              value={query}
              placeholder="Search animals"
              onChange={(event) => {
                onPageChange(1);
                onQueryChange(event.target.value);
              }}
            />
          </div>
        </label>

        <label htmlFor="animal-radius">
          <span>Radius</span>
          <select
            id="animal-radius"
            value={radiusKm}
            onChange={(event) => {
              onPageChange(1);
              onRadiusKmChange(Number(event.target.value));
            }}
          >
            {[1, 3, 5, 10, 15, 25].map((radius) => (
              <option key={radius} value={radius}>
                {radius} km
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="animal-timeline">
          <span>Timeline</span>
          <select
            id="animal-timeline"
            value={daysBack}
            onChange={(event) => {
              onPageChange(1);
              onDaysBackChange(Number(event.target.value));
            }}
          >
            {[1, 3, 7, 14, 30].map((days) => (
              <option key={days} value={days}>
                Past {days} {days === 1 ? "day" : "days"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {errorMessage ? (
        <div className="animal-sightings-state">
          Animal sightings are unavailable from iNaturalist right now.
        </div>
      ) : isGroupsLoading || isSightingsLoading ? (
        <div className="animal-sightings-state">Loading recent sightings...</div>
      ) : sightingPage && sightingPage.sightings.length > 0 ? (
        <>
          <div className="animal-sighting-list">
            {sightingPage.sightings.map((sighting) => (
              <a
                className="animal-sighting-item"
                href={sighting.uri}
                key={sighting.id}
                rel="noreferrer"
                target="_blank"
              >
                <div className="animal-sighting-thumb" aria-hidden="true">
                  {sighting.photo ? (
                    <img
                      src={sighting.photo.url}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span>{getInitial(sighting.taxon.commonName ?? sighting.taxon.name)}</span>
                  )}
                </div>
                <div className="animal-sighting-copy">
                  <strong>{sighting.taxon.commonName ?? sighting.taxon.name}</strong>
                  <small>{sighting.taxon.name}</small>
                </div>
                <div className="animal-sighting-meta">
                  <span data-grade={sighting.qualityGrade}>{formatQualityGrade(sighting.qualityGrade)}</span>
                  <span className="animal-sighting-area-badge">
                    <span className="animal-sighting-area-icon" aria-hidden="true">
                      {sighting.searchArea === "ocean" ? <FishAreaIcon /> : <AnemoneAreaIcon />}
                    </span>
                    {getSearchAreaLabel(sighting.searchArea)}
                  </span>
                  <small>{formatObservedDate(sighting.observedOn)}</small>
                </div>
              </a>
            ))}
          </div>

          <div className="animal-pagination">
            <button
              className="icon-button"
              type="button"
              aria-label="Previous animal sightings page"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(page - 1, 1))}
            >
              <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.2} />
            </button>
            <span>Page {page}</span>
            <button
              className="icon-button"
              type="button"
              aria-label="Next animal sightings page"
              disabled={!hasNextPage}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight aria-hidden="true" size={18} strokeWidth={2.2} />
            </button>
          </div>
        </>
      ) : (
        <div className="animal-sightings-state">No sighting details matched the current filters.</div>
      )}
      </div>
    </section>
  );
}

function getSearchAreaLabel(area: "coastline" | "ocean") {
  return area === "ocean" ? "Ocean" : "Coastline";
}

function getActivitySightingHeading(activityId: ActivityId) {
  if (activityId === "tidepools") {
    return "Recent shoreline life";
  }

  if (activityId === "dive") {
    return "Recent offshore life";
  }

  return "Recent marine sightings";
}

function FishAreaIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path
        d="M4 12c2.6-3.3 6-4.8 10.2-4.5l4.3-2.1v4.3l2.1 2.3-2.1 2.3v4.3l-4.3-2.1C10 17 6.6 15.4 4 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="13.6" cy="10.2" r="1.1" fill="currentColor" />
    </svg>
  );
}

function AnemoneAreaIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.4v4.2M8.1 3.4l1.9 3.7M15.9 3.4L14 7.1M5.1 5.9l2.8 2.6M18.9 5.9l-2.8 2.6M3.4 9.8l3.7 1.4M20.6 9.8l-3.7 1.4M8.4 18.6c1 1 2.1 1.5 3.6 1.5s2.6-.5 3.6-1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "?";
}

function formatObservedDate(date?: string) {
  if (!date) {
    return "Date unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

function formatQualityGrade(qualityGrade: string) {
  return qualityGrade === "research" ? "Research" : "Needs ID";
}
