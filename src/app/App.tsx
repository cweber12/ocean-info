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
    <main className="shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">San Diego to Oceanside</p>
          <h1>Ocean Info</h1>
        </div>
        <div className="status-pill">
          {selectedActivity.name} at {selectedLocation.name}
        </div>
      </header>

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

      <section className="activity-grid" aria-label="Ocean activities">
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
            <h2>{activity.name}</h2>
            <p>{activity.summary}</p>
            <ul>
              {activity.dataNeeds.map((need) => (
                <li key={need}>{need}</li>
              ))}
            </ul>
          </button>
        ))}
      </section>
    </main>
  );
}
