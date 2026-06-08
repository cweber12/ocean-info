import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { CircleAlert, X } from "lucide-react";
import { activityDefinitions, type ActivityId } from "../activities";
import { coastalLocations } from "../locations/southern-california-coast";
import { toIsoDate } from "../shared/utils/date";
import { getPlannerContent } from "./plannerContent";

interface PlannerState {
  activityId: ActivityId;
  date: string;
  locationId: string;
}

const defaultActivityId: ActivityId =
  activityDefinitions.find((activity) => activity.id === "tidepools")?.id ??
  activityDefinitions[0].id;
const defaultLocationId = coastalLocations[0].id;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function isActivityId(value: string | null): value is ActivityId {
  return activityDefinitions.some((activity) => activity.id === value);
}

function isLocationId(value: string | null): value is string {
  return coastalLocations.some((location) => location.id === value);
}

function getPlannerStateFromUrl(): PlannerState {
  const today = toIsoDate(new Date());

  if (typeof window === "undefined") {
    return {
      activityId: defaultActivityId,
      date: today,
      locationId: defaultLocationId,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const activity = params.get("activity");
  const date = params.get("date");
  const location = params.get("location");

  return {
    activityId: isActivityId(activity) ? activity : defaultActivityId,
    date: date && isoDatePattern.test(date) ? date : today,
    locationId: isLocationId(location) ? location : defaultLocationId,
  };
}

function syncPlannerStateToUrl(state: PlannerState) {
  const params = new URLSearchParams();
  params.set("activity", state.activityId);
  params.set("location", state.locationId);
  params.set("date", state.date);

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  const currentUrl = `${window.location.pathname}${window.location.search}`;

  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}

export function App() {
  const [plannerState, setPlannerState] = useState(getPlannerStateFromUrl);
  const [isCautionOpen, setIsCautionOpen] = useState(false);

  const selectedLocation = useMemo(
    () =>
      coastalLocations.find((location) => location.id === plannerState.locationId) ??
      coastalLocations[0],
    [plannerState.locationId],
  );

  const selectedActivity = useMemo(
    () =>
      activityDefinitions.find((activity) => activity.id === plannerState.activityId) ??
      activityDefinitions[0],
    [plannerState.activityId],
  );

  const plannerContent = useMemo(
    () => getPlannerContent(plannerState.activityId),
    [plannerState.activityId],
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date(`${plannerState.date}T12:00:00`)),
    [plannerState.date],
  );

  useEffect(() => {
    syncPlannerStateToUrl(plannerState);
  }, [plannerState]);

  useEffect(() => {
    setIsCautionOpen(false);
  }, [plannerState.activityId, plannerState.date, plannerState.locationId]);

  useEffect(() => {
    function handlePopState() {
      setPlannerState(getPlannerStateFromUrl());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function selectActivity(activityId: ActivityId) {
    setPlannerState((current) => ({
      ...current,
      activityId,
    }));
  }

  function handleActivityKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    activityId: ActivityId,
  ) {
    const currentIndex = activityDefinitions.findIndex(
      (activity) => activity.id === activityId,
    );

    const keyMoves: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };

    let nextIndex = currentIndex;

    if (event.key in keyMoves) {
      event.preventDefault();
      nextIndex =
        (currentIndex + keyMoves[event.key] + activityDefinitions.length) %
        activityDefinitions.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = activityDefinitions.length - 1;
    } else {
      return;
    }

    const nextActivity = activityDefinitions[nextIndex];
    selectActivity(nextActivity.id);
    window.requestAnimationFrame(() => {
      document.getElementById(`activity-tab-${nextActivity.id}`)?.focus();
    });
  }

  return (
    <main className="app-frame">
      <div className="shell">
        <header className="app-header">
          <div className="brand-lockup">
            <div className="moon-mark" aria-hidden="true">
              <span />
            </div>
            <div>
              <p className="eyebrow">San Diego to Oceanside</p>
              <h1>Ocean Info</h1>
            </div>
          </div>

          <div className="header-card" aria-label="Current planner context">
            <p>{formattedDate}</p>
            <strong>
              {selectedActivity.name} at {selectedLocation.name}
            </strong>
          </div>
        </header>

        <section className="planner-workspace" aria-label="Ocean planner">
          <aside className="planner-rail">
            <div className="rail-intro">
              <p className="eyebrow">Moon, tide, shoreline</p>
              <h2>Plan the next coastal window</h2>
              <p>
                A light planning view for ocean activities, curious kids, and
                group days near the water.
              </p>
            </div>

            <section
              className="control-panel"
              aria-labelledby="planner-controls-heading"
            >
              <div className="control-panel-heading">
                <p className="eyebrow">Plan by</p>
                <h3 id="planner-controls-heading">Location and date</h3>
                <p>
                  Start with the beach, harbor, or cove you have in mind, then
                  choose the day you are planning around.
                </p>
              </div>

              <div className="control-strip">
                <label htmlFor="location-select">
                  <span>Location</span>
                  <select
                    id="location-select"
                    value={plannerState.locationId}
                    onChange={(event) =>
                      setPlannerState((current) => ({
                        ...current,
                        locationId: event.target.value,
                      }))
                    }
                  >
                    {coastalLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="field-hint">{selectedLocation.area}</p>

                <label htmlFor="date-select">
                  <span>Date</span>
                  <input
                    id="date-select"
                    type="date"
                    value={plannerState.date}
                    onChange={(event) =>
                      setPlannerState((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />
                </label>
                <p className="field-hint">{formattedDate}</p>
              </div>
            </section>

            <div className="tide-mark" aria-hidden="true">
              <span className="tide-line" />
              <span className="tide-line" />
              <span className="tide-line" />
            </div>
          </aside>

          <section className="planner-board" aria-labelledby="activity-heading">
            <div className="board-heading">
              <div>
                <p className="eyebrow">Activities</p>
                <h2 id="activity-heading">Choose your activity</h2>
              </div>
              <span>{selectedActivity.name} selected</span>
            </div>

            <p className="sr-only" id="activity-selector-help">
              Choose one ocean activity. Arrow keys move between activities.
            </p>

            <div
              className="activity-grid"
              role="tablist"
              aria-labelledby="activity-heading"
              aria-describedby="activity-selector-help"
            >
              {activityDefinitions.map((activity) => (
                <button
                  id={`activity-tab-${activity.id}`}
                  className="activity-card"
                  type="button"
                  role="tab"
                  aria-selected={activity.id === plannerState.activityId}
                  aria-controls="planner-panel"
                  tabIndex={activity.id === plannerState.activityId ? 0 : -1}
                  data-selected={activity.id === plannerState.activityId}
                  key={activity.id}
                  onClick={() => selectActivity(activity.id)}
                  onKeyDown={(event) => handleActivityKeyDown(event, activity.id)}
                >
                  <p className="activity-type">{activity.dataNeeds.length} data groups</p>
                  <h3>{activity.name}</h3>
                  <p>{activity.summary}</p>
                  <ul>
                    {activity.dataNeeds.map((need) => (
                      <li key={need}>{need}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <section
              className="recommendation-panel"
              id="planner-panel"
              role="tabpanel"
              aria-labelledby={`activity-tab-${plannerState.activityId}`}
              aria-live="polite"
              data-tone={plannerContent.recommendation.tone}
            >
              <div className="recommendation-top">
                <div className="recommendation-copy">
                  <p className="eyebrow">Recommendation</p>
                  <h2>{plannerContent.recommendation.label}</h2>
                  <p>{plannerContent.recommendation.summary}</p>
                </div>

                <div className="caution-popover-wrap">
                  <button
                    className="icon-button caution-trigger"
                    type="button"
                    aria-label={`Open cautions for ${selectedActivity.name}`}
                    aria-expanded={isCautionOpen}
                    aria-controls="caution-popover"
                    onClick={() => setIsCautionOpen((open) => !open)}
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
                          setIsCautionOpen(false);
                        }
                      }}
                    >
                      <div className="caution-popover-heading">
                        <div>
                          <p className="eyebrow">Cautions</p>
                          <h3 id="caution-popover-title">
                            {plannerContent.caution.label}
                          </h3>
                        </div>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label="Close cautions"
                          onClick={() => setIsCautionOpen(false)}
                        >
                          <X aria-hidden="true" size={18} strokeWidth={2.2} />
                        </button>
                      </div>
                      <p>{plannerContent.caution.message}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <dl className="recommendation-context">
                <div>
                  <dt>Activity</dt>
                  <dd>{selectedActivity.name}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{selectedLocation.name}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{formattedDate}</dd>
                </div>
              </dl>

              <div className="recommendation-reason">
                <span>Why this works</span>
                <p>{plannerContent.bestWindow.reason}</p>
              </div>
            </section>

            <section
              className="conditions-section"
              aria-labelledby="conditions-heading"
            >
              <article className="best-window-card">
                <p className="eyebrow">Best window</p>
                <h2>{plannerContent.bestWindow.label}</h2>
                <p>{plannerContent.bestWindow.reason}</p>
              </article>

              <div className="condition-group">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Conditions</p>
                    <h2 id="conditions-heading">What matters for this plan</h2>
                  </div>
                  <span>{plannerContent.conditions.length} checks</span>
                </div>

                <div className="condition-grid">
                  {plannerContent.conditions.map((condition) => (
                    <article
                      className="condition-card"
                      data-tone={condition.tone}
                      key={condition.id}
                    >
                      <div className="condition-card-heading">
                        <span>{condition.label}</span>
                        <strong>{condition.tone}</strong>
                      </div>
                      <h3>{condition.value}</h3>
                      <p>{condition.note}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="notice-section" aria-labelledby="notice-heading">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Connections</p>
                  <h2 id="notice-heading">What to notice</h2>
                </div>
                <span>Field notes</span>
              </div>

              <div className="notice-grid">
                {plannerContent.whatToNotice.map((note) => (
                  <article className="notice-card" key={note}>
                    <span aria-hidden="true" />
                    <p>{note}</p>
                  </article>
                ))}
              </div>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
