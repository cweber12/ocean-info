import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { activityDefinitions, type ActivityId } from "../activities";
import { fetchMovebankAnimalTracks } from "../data-sources/movebank/tracking";
import {
  fetchInaturalistAnimalSightingGroups,
  fetchInaturalistAnimalSightings,
} from "../data-sources/inaturalist/observations";
import { fetchNoaaTideReport } from "../data-sources/noaa/tides";
import { fetchMarineWeatherReport } from "../data-sources/noaa/weather";
import type { AnimalSightingSearch } from "../domain/animal-sightings/types";
import type { AnimalTrackingSearch } from "../domain/animal-tracking/types";
import type { AnimalSightingActivityId } from "../domain/location/types";
import { coastalLocations } from "../locations/southern-california-coast";
import { getBuoyStationById } from "../locations/buoy-stations";
import { getNearestTideStation, getTideStationById } from "../locations/tide-stations";
import { AnimalSightingsPanel } from "../shared/components/AnimalSightingsPanel";
import { AnimalTrackingPanel } from "../shared/components/AnimalTrackingPanel";
import { CoastalMapPanel } from "../shared/components/CoastalMapPanel";
import { DaySummaryPanel } from "../shared/components/DaySummaryPanel";
import { TideReport } from "../shared/components/TideReport";
import {
  HeaderWeatherSummary,
  MarineWeatherReport,
} from "../shared/components/WeatherReport";
import { appConfig } from "../shared/config/app";
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
const animalSightingActivityIds = new Set<ActivityId>(["dive", "tidepools"]);

function NotebookWaveMark() {
  return (
    <svg
      aria-hidden="true"
      className="brand-mark-icon"
      fill="none"
      viewBox="0 0 48 48"
    >
      <path
        d="M15 8h22a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H15a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6Z"
        className="brand-mark-page"
      />
      <path d="M15 8v36" className="brand-mark-spine" />
      <path d="M11 16h6M11 24h6M11 32h6" className="brand-mark-rings" />
      <path
        d="M22 19c2.8-2.2 5.4 2.2 8.2 0s5.3 2.2 7.3 0"
        className="brand-mark-wave"
      />
      <path
        d="M22 27c2.8-2.2 5.4 2.2 8.2 0s5.3 2.2 7.3 0"
        className="brand-mark-wave"
      />
      <path
        d="M22 35c2.8-2.2 5.4 2.2 8.2 0s5.3 2.2 7.3 0"
        className="brand-mark-wave"
      />
    </svg>
  );
}

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

function isAnimalSightingActivityId(
  activityId: ActivityId,
): activityId is AnimalSightingActivityId {
  return animalSightingActivityIds.has(activityId);
}

function getIsoDateDaysAgo(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return toIsoDate(date);
}

export function App() {
  const [plannerState, setPlannerState] = useState(getPlannerStateFromUrl);
  const [animalDaysBack, setAnimalDaysBack] = useState(7);
  const [animalIsExpanded, setAnimalIsExpanded] = useState(false);
  const [animalPage, setAnimalPage] = useState(1);
  const [animalQuery, setAnimalQuery] = useState("");
  const [animalRadiusKm, setAnimalRadiusKm] = useState(5);
  const [isCautionOpen, setIsCautionOpen] = useState(false);

  const isMovebankTrackingEnabled = appConfig.features.movebankTracking;

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

  const tideStation = useMemo(() => {
    const hintedStation = selectedLocation.stationHints?.tideStationId
      ? getTideStationById(selectedLocation.stationHints.tideStationId)
      : undefined;

    return hintedStation ?? getNearestTideStation(selectedLocation.point);
  }, [selectedLocation]);

  const buoyStation = useMemo(() => {
    const buoyStationId = selectedLocation.stationHints?.buoyStationId;

    return buoyStationId ? getBuoyStationById(buoyStationId) : undefined;
  }, [selectedLocation]);

  const tideReportQuery = useQuery({
    queryKey: ["noaa-tide-report", tideStation.id, plannerState.date],
    queryFn: () =>
      fetchNoaaTideReport({
        date: plannerState.date,
        station: tideStation,
      }),
  });

  const marineWeatherQuery = useQuery({
    queryKey: [
      "noaa-marine-weather-report",
      selectedLocation.id,
      tideStation.id,
      plannerState.date,
    ],
    queryFn: () =>
      fetchMarineWeatherReport({
        date: plannerState.date,
        location: selectedLocation,
        tideStation,
      }),
  });

  const animalSearch = useMemo<AnimalSightingSearch | undefined>(() => {
    if (!isAnimalSightingActivityId(plannerState.activityId)) {
      return undefined;
    }

    return {
      activityId: plannerState.activityId,
      center:
        selectedLocation.animalSightingCenters?.[plannerState.activityId] ??
        selectedLocation.point,
      dateEnd: toIsoDate(new Date()),
      daysBack: animalDaysBack,
      page: animalPage,
      perPage: 4,
      query: animalQuery,
      radiusKm: animalRadiusKm,
    };
  }, [
    animalDaysBack,
    animalPage,
    animalQuery,
    animalRadiusKm,
    plannerState.activityId,
    selectedLocation,
  ]);

  const animalSearchQuery =
    animalSearch && animalSearch.query?.trim() && animalSearch.query.trim().length < 2
      ? { ...animalSearch, query: "" }
      : animalSearch;

  const animalTrackingSearch = useMemo<AnimalTrackingSearch | undefined>(() => {
    if (!isMovebankTrackingEnabled) {
      return undefined;
    }

    if (!isAnimalSightingActivityId(plannerState.activityId)) {
      return undefined;
    }

    return {
      activityId: plannerState.activityId,
      center:
        selectedLocation.animalSightingCenters?.[plannerState.activityId] ??
        selectedLocation.point,
      dateEnd: toIsoDate(new Date()),
      daysBack: appConfig.movebank.defaultDaysBack,
      radiusKm: appConfig.movebank.defaultRadiusKm,
    };
  }, [isMovebankTrackingEnabled, plannerState.activityId, selectedLocation]);

  const animalGroupsQuery = useQuery({
    enabled: Boolean(animalSearchQuery),
    queryKey: [
      "inaturalist-animal-sighting-groups",
      animalSearchQuery?.activityId,
      animalSearchQuery?.center.latitude,
      animalSearchQuery?.center.longitude,
      animalSearchQuery?.dateEnd,
      animalSearchQuery?.daysBack,
      animalSearchQuery?.query,
      animalSearchQuery?.radiusKm,
    ],
    queryFn: () => {
      if (!animalSearchQuery) {
        throw new Error("Animal sighting search is not available.");
      }

      return fetchInaturalistAnimalSightingGroups(animalSearchQuery);
    },
  });

  const animalSightingsQuery = useQuery({
    enabled: Boolean(animalSearchQuery),
    queryKey: [
      "inaturalist-animal-sightings",
      animalSearchQuery?.activityId,
      animalSearchQuery?.center.latitude,
      animalSearchQuery?.center.longitude,
      animalSearchQuery?.dateEnd,
      animalSearchQuery?.daysBack,
      animalSearchQuery?.page,
      animalSearchQuery?.query,
      animalSearchQuery?.radiusKm,
    ],
    queryFn: () => {
      if (!animalSearchQuery) {
        throw new Error("Animal sighting search is not available.");
      }

      return fetchInaturalistAnimalSightings(animalSearchQuery);
    },
  });

  const animalTrackingQuery = useQuery({
    enabled: Boolean(animalTrackingSearch),
    queryKey: [
      "movebank-animal-tracks",
      animalTrackingSearch?.activityId,
      animalTrackingSearch?.center.latitude,
      animalTrackingSearch?.center.longitude,
      animalTrackingSearch?.radiusKm,
      getIsoDateDaysAgo(animalTrackingSearch?.daysBack ?? appConfig.movebank.defaultDaysBack),
      animalTrackingSearch?.dateEnd,
    ],
    queryFn: () => {
      if (!animalTrackingSearch) {
        throw new Error("Animal tracking search is not available.");
      }

      return fetchMovebankAnimalTracks(animalTrackingSearch);
    },
  });

  const plannerContent = useMemo(
    () => getPlannerContent(plannerState.activityId),
    [plannerState.activityId],
  );

  const mapSightings = animalSightingsQuery.data?.allSightings ?? [];

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
    setAnimalIsExpanded(false);
    setAnimalPage(1);
  }, [plannerState.activityId, plannerState.locationId]);

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

  return (
    <main className="app-frame">
      <header className="site-header">
        <div className="shell header-shell">
          <div className="header-top">
            <div className="brand-lockup">
              <div className="brand-mark" aria-hidden="true">
                <NotebookWaveMark />
              </div>
              <div className="brand-copy">
                <div className="brand-heading">
                  <h1 className="header-title">Tide Guide</h1>
                </div>
                <p className="header-intro">
                  Compare local tide, wind, and water conditions by activity,
                  location, and date.
                </p>
              </div>
            </div>
            <HeaderWeatherSummary
              isLoading={marineWeatherQuery.isLoading}
              report={marineWeatherQuery.data}
            />
            <section
              className="header-planner"
              aria-label="Plan by location and date"
            >
              <div className="control-strip">
                <div>
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
                </div>
                <div>
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
                </div>
                <div>
                  <label htmlFor="activity-select" id="activity-select-label">
                    <span>Activity</span>
                    <select
                      id="activity-select"
                      value={plannerState.activityId}
                      onChange={(event) => selectActivity(event.target.value as ActivityId)}
                    >
                      {activityDefinitions.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>
      </header>

      <section className="ocean-stage">
        <div className="shell">
          <section className="planner-layout" aria-label="Ocean planner">
            <section className="planner-board" aria-label="Activity details">
              <div className="planner-hero-row">
                <DaySummaryPanel
                  activityId={plannerState.activityId}
                  formattedDate={formattedDate}
                  isCautionOpen={isCautionOpen}
                  isTideLoading={tideReportQuery.isLoading}
                  isWeatherLoading={marineWeatherQuery.isLoading}
                  onCautionClose={() => setIsCautionOpen(false)}
                  onCautionToggle={() => setIsCautionOpen((open) => !open)}
                  plannerContent={plannerContent}
                  selectedActivity={selectedActivity}
                  selectedLocation={selectedLocation}
                  tideReport={tideReportQuery.data}
                  weatherReport={marineWeatherQuery.data}
                />

                <CoastalMapPanel
                  buoyStation={buoyStation}
                  location={selectedLocation}
                  showSightingPins={isAnimalSightingActivityId(plannerState.activityId)}
                  sightings={mapSightings}
                  tideStation={tideStation}
                />
              </div>

              <div className="data-module-grid">
                {animalTrackingSearch ? (
                  <div className="data-module data-module-animal-tracking">
                    <AnimalTrackingPanel
                      errorMessage={
                        animalTrackingQuery.error instanceof Error
                          ? animalTrackingQuery.error.message
                          : undefined
                      }
                      isLoading={animalTrackingQuery.isLoading}
                      report={animalTrackingQuery.data}
                    />
                  </div>
                ) : null}

                {animalSearchQuery ? (
                  <div className="data-module data-module-animal">
                    <AnimalSightingsPanel
                      daysBack={animalDaysBack}
                      errorMessage={
                        animalGroupsQuery.error instanceof Error
                          ? animalGroupsQuery.error.message
                          : animalSightingsQuery.error instanceof Error
                            ? animalSightingsQuery.error.message
                            : undefined
                      }
                      groupReport={animalGroupsQuery.data}
                      isExpanded={animalIsExpanded}
                      isGroupsLoading={animalGroupsQuery.isLoading}
                      isSightingsLoading={animalSightingsQuery.isLoading}
                      onDaysBackChange={setAnimalDaysBack}
                      onExpandedChange={setAnimalIsExpanded}
                      onPageChange={setAnimalPage}
                      onQueryChange={setAnimalQuery}
                      onRadiusKmChange={setAnimalRadiusKm}
                      page={animalPage}
                      query={animalQuery}
                      radiusKm={animalRadiusKm}
                      sightingPage={animalSightingsQuery.data}
                      variant={animalSearchQuery.activityId}
                    />
                  </div>
                ) : null}

                <div className="data-module data-module-tide">
                  <TideReport
                    activityId={plannerState.activityId}
                    errorMessage={
                      tideReportQuery.error instanceof Error
                        ? tideReportQuery.error.message
                        : undefined
                    }
                    isLoading={tideReportQuery.isLoading}
                    report={tideReportQuery.data}
                  />
                </div>

                <div className="data-module data-module-weather">
                  <MarineWeatherReport
                    activityId={plannerState.activityId}
                    errorMessage={
                      marineWeatherQuery.error instanceof Error
                        ? marineWeatherQuery.error.message
                        : undefined
                    }
                    isLoading={marineWeatherQuery.isLoading}
                    report={marineWeatherQuery.data}
                  />
                </div>
              </div>

            <section
              className="conditions-section"
              aria-labelledby="conditions-heading"
            >
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
      </section>
    </main>
  );
}
