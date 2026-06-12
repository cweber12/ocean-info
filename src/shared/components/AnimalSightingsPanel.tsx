import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ActivityId } from "../../activities";
import type {
  AnimalSightingGroupReport,
  AnimalSightingPage,
} from "../../domain/animal-sightings/types";

interface SearchAreaPanelModel {
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

export interface AnimalSightingsPanelProps {
  activityId: ActivityId;
  coastlineArea: SearchAreaPanelModel;
  oceanArea: SearchAreaPanelModel;
}

export function AnimalSightingsPanel({
  activityId,
  coastlineArea,
  oceanArea,
}: AnimalSightingsPanelProps) {
  const sourceName = coastlineArea.groupReport?.sourceName ?? oceanArea.groupReport?.sourceName;

  return (
    <section className="animal-sightings" aria-labelledby="animal-sightings-heading">
      <div className="section-heading animal-sightings-heading">
        <div>
          <p className="eyebrow">Animal sightings</p>
          <h2 id="animal-sightings-heading">{getActivitySightingHeading(activityId)}</h2>
        </div>
        <span>{sourceName ?? "iNaturalist"}</span>
      </div>

      <div className="animal-sightings-panel">
        <div className="animal-sightings-area-grid">
          <SearchAreaSection area="coastline" model={coastlineArea} />
          <SearchAreaSection area="ocean" model={oceanArea} />
        </div>
      </div>
    </section>
  );
}

function SearchAreaSection({
  area,
  model,
}: {
  area: "coastline" | "ocean";
  model: SearchAreaPanelModel;
}) {
  const idPrefix = `animal-${area}`;
  const hasNextPage = Boolean(model.sightingPage && model.page * 4 < model.sightingPage.totalResults);

  return (
    <section className="animal-sightings-area" aria-label={`${getSearchAreaLabel(area)} sightings`}>
      <div className="animal-sightings-area-heading">
        <span className="animal-sighting-area-icon" aria-hidden="true">
          {area === "ocean" ? <FishAreaIcon /> : <SeaUrchinAreaIcon />}
        </span>
        <h3>{getSearchAreaLabel(area)}</h3>
      </div>

      <div className="animal-sightings-controls">
        <label htmlFor={`${idPrefix}-search`}>
          <span>Animal name</span>
          <div className="animal-search-field">
            <Search aria-hidden="true" size={18} strokeWidth={2.2} />
            <input
              id={`${idPrefix}-search`}
              type="search"
              value={model.query}
              placeholder="Search animals"
              onChange={(event) => {
                model.onPageChange(1);
                model.onQueryChange(event.target.value);
              }}
            />
          </div>
        </label>

        <label htmlFor={`${idPrefix}-radius`}>
          <span>Radius</span>
          <select
            id={`${idPrefix}-radius`}
            value={model.radiusKm}
            onChange={(event) => {
              model.onPageChange(1);
              model.onRadiusKmChange(Number(event.target.value));
            }}
          >
            {[1, 3, 5, 10, 15, 25].map((radius) => (
              <option key={radius} value={radius}>
                {radius} km
              </option>
            ))}
          </select>
        </label>

        <label htmlFor={`${idPrefix}-timeline`}>
          <span>Timeline</span>
          <select
            id={`${idPrefix}-timeline`}
            value={model.daysBack}
            onChange={(event) => {
              model.onPageChange(1);
              model.onDaysBackChange(Number(event.target.value));
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

      {model.errorMessage ? (
        <div className="animal-sightings-state">
          Animal sightings are unavailable from iNaturalist right now.
        </div>
      ) : model.isGroupsLoading || model.isSightingsLoading ? (
        <div className="animal-sightings-state">Loading recent sightings...</div>
      ) : model.sightingPage && model.sightingPage.sightings.length > 0 ? (
        <>
          <div className="animal-sighting-list">
            {model.sightingPage.sightings.map((sighting) => (
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
                      {sighting.searchArea === "ocean" ? <FishAreaIcon /> : <SeaUrchinAreaIcon />}
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
              aria-label={`Previous ${getSearchAreaLabel(area)} animal sightings page`}
              disabled={model.page <= 1}
              onClick={() => model.onPageChange(Math.max(model.page - 1, 1))}
            >
              <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.2} />
            </button>
            <span>Page {model.page}</span>
            <button
              className="icon-button"
              type="button"
              aria-label={`Next ${getSearchAreaLabel(area)} animal sightings page`}
              disabled={!hasNextPage}
              onClick={() => model.onPageChange(model.page + 1)}
            >
              <ChevronRight aria-hidden="true" size={18} strokeWidth={2.2} />
            </button>
          </div>
        </>
      ) : (
        <div className="animal-sightings-state">No sighting details matched the current filters.</div>
      )}
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

function SeaUrchinAreaIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.2V5.1M12 18.9v2.9M2.2 12h2.9M18.9 12h2.9M4.8 4.8l2 2M17.2 17.2l2 2M19.2 4.8l-2 2M6.8 17.2l-2 2M6.1 12h2.1M15.8 12h2.1M12 6.1v2.1M12 15.8v2.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
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
