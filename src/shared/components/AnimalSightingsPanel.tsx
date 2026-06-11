import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react";
import type {
  AnimalSightingGroupReport,
  AnimalSightingPage,
} from "../../domain/animal-sightings/types";

export interface AnimalSightingsPanelProps {
  daysBack: number;
  errorMessage?: string;
  groupReport?: AnimalSightingGroupReport;
  isExpanded: boolean;
  isGroupsLoading: boolean;
  isSightingsLoading: boolean;
  onDaysBackChange: (daysBack: number) => void;
  onExpandedChange: (isExpanded: boolean) => void;
  onPageChange: (page: number) => void;
  onQueryChange: (query: string) => void;
  onRadiusKmChange: (radiusKm: number) => void;
  page: number;
  query: string;
  radiusKm: number;
  sightingPage?: AnimalSightingPage;
  variant: "dive" | "tidepools";
}

const pageSize = 4;

export function AnimalSightingsPanel({
  daysBack,
  errorMessage,
  groupReport,
  isExpanded,
  isGroupsLoading,
  isSightingsLoading,
  onDaysBackChange,
  onExpandedChange,
  onPageChange,
  onQueryChange,
  onRadiusKmChange,
  page,
  query,
  radiusKm,
  sightingPage,
  variant,
}: AnimalSightingsPanelProps) {
  const groupCount = groupReport?.groups.length ?? 0;
  const hasNextPage = Boolean(
    sightingPage && page * pageSize < sightingPage.totalResults,
  );

  return (
    <section className="animal-sightings" aria-labelledby="animal-sightings-heading">
      <div className="section-heading animal-sightings-heading">
        <div>
          <p className="eyebrow">Animal sightings</p>
          <h2 id="animal-sightings-heading">
            {variant === "tidepools" ? "Recent shoreline life" : "Recent offshore life"}
          </h2>
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
        ) : (
          <>
            <div className="animal-sighting-row" aria-live="polite">
              {isGroupsLoading ? (
                <div className="animal-sightings-state">Loading recent sightings...</div>
              ) : groupReport && groupReport.groups.length > 0 ? (
                groupReport.groups.map((group) => (
                  <div className="animal-chip" key={group.taxon.id}>
                    <div className="animal-chip-thumb" aria-hidden="true">
                      {group.thumbnailUrl ? (
                        <img src={group.thumbnailUrl} alt="" loading="lazy" />
                      ) : (
                        <span>{getInitial(group.taxon.commonName ?? group.taxon.name)}</span>
                      )}
                    </div>
                    <div>
                      <strong>{group.taxon.commonName ?? group.taxon.name}</strong>
                      <small>
                        {group.count} {group.count === 1 ? "sighting" : "sightings"}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="animal-sightings-state">
                  No matching marine animal sightings found for this area.
                </div>
              )}
            </div>

            <div className="animal-sightings-actions">
              <span>
                {groupCount} grouped {groupCount === 1 ? "animal" : "animals"} in the
                current search
              </span>
              <button
                className="animal-expand-button"
                type="button"
                aria-expanded={isExpanded}
                onClick={() => onExpandedChange(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp aria-hidden="true" size={18} strokeWidth={2.2} />
                ) : (
                  <ChevronDown aria-hidden="true" size={18} strokeWidth={2.2} />
                )}
                {isExpanded ? "Collapse" : "Expand"}
              </button>
            </div>

            {isExpanded ? (
              <div className="animal-sightings-expanded">
                {isSightingsLoading ? (
                  <div className="animal-sightings-state">Loading sighting details...</div>
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
                              <span>
                                {getInitial(
                                  sighting.taxon.commonName ?? sighting.taxon.name,
                                )}
                              </span>
                            )}
                          </div>
                          <div className="animal-sighting-copy">
                            <strong>
                              {sighting.taxon.commonName ?? sighting.taxon.name}
                            </strong>
                            <small>{sighting.taxon.name}</small>
                          </div>
                          <div className="animal-sighting-meta">
                            <span data-grade={sighting.qualityGrade}>
                              {formatQualityGrade(sighting.qualityGrade)}
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
                  <div className="animal-sightings-state">
                    No sighting details matched the current filters.
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
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
