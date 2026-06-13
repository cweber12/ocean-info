import { useEffect, useMemo, useState } from "react";
import { divIcon, icon, latLngBounds } from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import marineSightingFishSvg from "../assets/fish-left-svgrepo-com.svg?raw";
import type { AnimalSighting } from "../../domain/animal-sightings/types";
import type { CoastalLocation } from "../../domain/location/types";
import type { TideStation } from "../../domain/tide/types";
import type { BuoyStation } from "../../locations/buoy-stations";

export interface CoastalMapPanelProps {
  buoyStation?: BuoyStation;
  location: CoastalLocation;
  sightings: AnimalSighting[];
  tideStation: TideStation;
}

export function CoastalMapPanel({
  buoyStation,
  location,
  sightings,
  tideStation,
}: CoastalMapPanelProps) {
  const [selectedSightingId, setSelectedSightingId] = useState<number | null>(null);

  const stationMarkers = useMemo(
    () => [
      {
        id: `tide-${tideStation.id}`,
        label: tideStation.name,
        point: tideStation.point,
        tone: "tide" as const,
      },
      ...(buoyStation
        ? [
            {
              id: `buoy-${buoyStation.id}`,
              label: buoyStation.name,
              point: buoyStation.point,
              tone: "buoy" as const,
            },
          ]
        : []),
    ],
    [buoyStation, tideStation],
  );

  const sightingMarkers = useMemo(
    () => {
      const markers: Array<{
        id: number;
        point: NonNullable<AnimalSighting["point"]>;
        sighting: AnimalSighting;
      }> = [];

      for (const sighting of sightings) {
        if (!sighting.point) {
          continue;
        }
        markers.push({
          id: sighting.id,
          point: sighting.point,
          sighting,
        });

        if (markers.length >= 120) {
          break;
        }
      }

      return markers;
    },
    [sightings],
  );

  const markers = [...stationMarkers, ...sightingMarkers];
  const selectedSighting = useMemo(
    () => sightings.find((sighting) => sighting.id === selectedSightingId),
    [selectedSightingId, sightings],
  );

  const hasSightingDetail = Boolean(selectedSighting);

  return (
    <section className="coastal-map-panel" aria-labelledby="coastal-map-heading">
      <div className="section-heading coastal-map-heading">
        <div>
          <p className="eyebrow">Map</p>
          <h2 id="coastal-map-heading">Stations and sightings</h2>
        </div>
        <span>{markers.length > 0 ? `${markers.length} pins` : "No pins"}</span>
      </div>

      <div className="coastal-map-frame">
        {hasSightingDetail && selectedSighting ? (
          <div className="coastal-map-detail" aria-live="polite">
            <div className="coastal-map-detail-top">
              <p className="eyebrow">Animal sighting</p>
              <button
                className="icon-button coastal-map-exit-button"
                type="button"
                aria-label="Return to map"
                onClick={() => setSelectedSightingId(null)}
              >
                ×
              </button>
            </div>

            <div className="coastal-map-detail-body">
              <div className="coastal-map-detail-media">
                {selectedSighting.photo?.url ? (
                  <img
                    alt={selectedSighting.taxon.commonName ?? selectedSighting.taxon.name}
                    src={selectedSighting.photo.url}
                  />
                ) : (
                  <span>{getInitial(selectedSighting.taxon.commonName ?? selectedSighting.taxon.name)}</span>
                )}
              </div>

              <div className="coastal-map-detail-copy">
                <strong>{selectedSighting.taxon.commonName ?? selectedSighting.taxon.name}</strong>
                <small>{selectedSighting.taxon.name}</small>
                <div className="coastal-map-detail-area">
                  <span className="coastal-map-detail-area-icon" aria-hidden="true">
                    {selectedSighting.searchArea === "ocean" ? (
                      <FishAreaIcon />
                    ) : (
                      <AnemoneAreaIcon />
                    )}
                  </span>
                  <span>
                    {selectedSighting.searchArea === "ocean"
                      ? "Ocean sighting"
                      : "Coastline sighting"}
                  </span>
                </div>

                <dl className="coastal-map-detail-grid">
                  <div>
                    <dt>Observed</dt>
                    <dd>{formatObservedDate(selectedSighting.observedOn)}</dd>
                  </div>
                  <div>
                    <dt>Grade</dt>
                    <dd>{formatQualityGrade(selectedSighting.qualityGrade)}</dd>
                  </div>
                  {selectedSighting.placeGuess ? (
                    <div>
                      <dt>Place</dt>
                      <dd>{selectedSighting.placeGuess}</dd>
                    </div>
                  ) : null}
                  {selectedSighting.userLogin ? (
                    <div>
                      <dt>Observer</dt>
                      <dd>{selectedSighting.userLogin}</dd>
                    </div>
                  ) : null}
                  {selectedSighting.photo?.attribution ? (
                    <div>
                      <dt>Photo</dt>
                      <dd>{selectedSighting.photo.attribution}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="coastal-map-detail-actions">
                  <a href={selectedSighting.uri} rel="noreferrer" target="_blank">
                    Open observation
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[location.point.latitude, location.point.longitude]}
            className="coastal-map"
            scrollWheelZoom
            zoom={11.5}
            zoomControl={true}
          >
            <TileLayer
              attribution="Map data © OpenStreetMap contributors, map style © CARTO"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <ViewportController center={location.point} markers={markers} />

            {stationMarkers.map((marker) => (
              <Marker
                icon={buildStationIcon(marker.tone)}
                key={marker.id}
                position={[marker.point.latitude, marker.point.longitude]}
              >
                <Tooltip direction="top" offset={[0, -14]} opacity={0.96} permanent={false}>
                  {marker.label}
                </Tooltip>
              </Marker>
            ))}

            {sightingMarkers.map(({ sighting, point }) => (
              <Marker
                eventHandlers={{ click: () => setSelectedSightingId(sighting.id) }}
                icon={buildSightingIcon(sighting.searchArea)}
                key={`${sighting.id}-${sighting.searchArea}-${marineSightingIconVersion}`}
                position={[point.latitude, point.longitude]}
              >
                <Tooltip direction="top" offset={[0, -14]} opacity={0.96} permanent={false}>
                  {sighting.taxon.commonName ?? sighting.taxon.name}
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </section>
  );
}

function ViewportController({
  center,
  markers,
}: {
  center: { latitude: number; longitude: number };
  markers: Array<{ point: { latitude: number; longitude: number } }>;
}) {
  const map = useMap();

  useEffect(() => {
    const fitToDisplayedPins = () => {
      map.invalidateSize({ animate: false });

      if (markers.length === 0) {
        map.setView([center.latitude, center.longitude], 11.5, { animate: false });
        return;
      }

      if (markers.length === 1) {
        map.setView([markers[0].point.latitude, markers[0].point.longitude], 12, {
          animate: false,
        });
        return;
      }

      const bounds = latLngBounds(
        markers.map((marker) => [marker.point.latitude, marker.point.longitude]),
      );
      map.fitBounds(bounds.pad(0.22), { animate: false });
    };

    fitToDisplayedPins();
    const frame = window.requestAnimationFrame(fitToDisplayedPins);
    return () => window.cancelAnimationFrame(frame);
  }, [center.latitude, center.longitude, markers, map]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize({ animate: false });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  return null;
}

function buildStationIcon(tone: "tide" | "buoy") {
  return divIcon({
    className: `coastal-map-marker coastal-map-marker-station coastal-map-marker-${tone}`,
    html: `${mapPinBackground}<span>${tone === "tide" ? "T" : "B"}</span>`,
    iconAnchor: [16, 40],
    iconSize: [32, 40],
    popupAnchor: [0, -30],
  });
}

function buildSightingIcon(searchArea: AnimalSighting["searchArea"]) {
  return searchArea === "ocean" ? marineSightingIcon : coastlineSightingIcon;
}

const mapPinBackground = `
  <svg aria-hidden="true" class="coastal-map-pin-bg" focusable="false" viewBox="0 0 36 44">
    <path d="M18 1.5C9.16 1.5 2 8.66 2 17.5c0 10.74 12.88 22.25 15.08 24.12.53.45 1.31.45 1.84 0C21.12 39.75 34 28.24 34 17.5 34 8.66 26.84 1.5 18 1.5Z" />
  </svg>
`;

const marineSightingIcon = icon({
  iconAnchor: [18, 44],
  iconSize: [36, 44],
  iconUrl: buildMarineSightingPinDataUri(),
  popupAnchor: [0, -30],
});

const coastlineSightingIcon = icon({
  iconAnchor: [18, 44],
  iconSize: [36, 44],
  iconUrl: buildCoastlineSightingPinDataUri(),
  popupAnchor: [0, -30],
});

const marineSightingIconVersion = "dark-blue-fish-pin-v1";

function buildMarineSightingPinDataUri() {
  const fishPath = extractFirstSvgPath(marineSightingFishSvg);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 44">
      <path d="M18 1.5C9.16 1.5 2 8.66 2 17.5c0 10.74 12.88 22.25 15.08 24.12.53.45 1.31.45 1.84 0C21.12 39.75 34 28.24 34 17.5 34 8.66 26.84 1.5 18 1.5Z" fill="#033c45" stroke="#ffffff" stroke-opacity="0.88" stroke-width="2"/>
      <g transform="translate(5.7 6.2) scale(1.03)">
        <path d="${fishPath}" fill="none" stroke="#f0a14c" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.25"/>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildCoastlineSightingPinDataUri() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 44">
      <path d="M18 1.5C9.16 1.5 2 8.66 2 17.5c0 10.74 12.88 22.25 15.08 24.12.53.45 1.31.45 1.84 0C21.12 39.75 34 28.24 34 17.5 34 8.66 26.84 1.5 18 1.5Z" fill="#1f5c41" stroke="#ffffff" stroke-opacity="0.88" stroke-width="2"/>
      <g transform="translate(18 17)">
        <circle cx="0" cy="1" r="3.2" fill="none" stroke="#f4d483" stroke-width="1.8"/>
        <path d="M0 -11v4.2M-3.9 -10l1.9 3.7M3.9 -10L2 -6.3M-7 -7.5l2.8 2.6M7 -7.5L4.2 -4.9M-8.7 -3.6l3.7 1.4M8.7 -3.6L5 -2.2M-3.6 6.8C-2.6 7.8-1.5 8.3 0 8.3S2.6 7.8 3.6 6.8" stroke="#f4d483" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function extractFirstSvgPath(svg: string) {
  return svg.match(/\sd="([^"]+)"/)?.[1] ?? "";
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
  if (qualityGrade === "research") {
    return "Research";
  }

  if (qualityGrade === "casual") {
    return "Casual";
  }

  return "Needs ID";
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
