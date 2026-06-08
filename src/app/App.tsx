import { useEffect, useMemo, useState } from "react";
import { activityDefinitions, type ActivityId } from "../activities";
import { coastalLocations } from "../locations/southern-california-coast";
import { toIsoDate } from "../shared/utils/date";

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
    function handlePopState() {
      setPlannerState(getPlannerStateFromUrl());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

            <section className="control-strip" aria-label="Search filters">
              <label>
                Location
                <select
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

              <label>
                Date
                <input
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
                <h2 id="activity-heading">Choose an ocean day</h2>
              </div>
              <span>{activityDefinitions.length} ways to plan</span>
            </div>

            <div className="activity-grid" aria-label="Ocean activities">
              {activityDefinitions.map((activity) => (
                <button
                  className="activity-card"
                  type="button"
                  data-selected={activity.id === plannerState.activityId}
                  key={activity.id}
                  onClick={() =>
                    setPlannerState((current) => ({
                      ...current,
                      activityId: activity.id,
                    }))
                  }
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
          </section>
        </section>
      </div>
    </main>
  );
}
