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
                      <SeaUrchinAreaIcon />
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
        <circle cx="0" cy="0" r="5" fill="none" stroke="#f4d483" stroke-width="1.9"/>
        <path d="M0 -10V-6.8M0 6.8V10M-10 0h3.2M6.8 0H10M-7.3 -7.3l2.3 2.3M5 5l2.3 2.3M7.3 -7.3L5 -5M-5 5l-2.3 2.3M-6.2 0h2M4.2 0h2M0 -6.2v2M0 4.2v2" stroke="#f4d483" stroke-width="1.6" stroke-linecap="round"/>
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
