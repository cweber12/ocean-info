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
  showSightingPins: boolean;
  sightings: AnimalSighting[];
  tideStation: TideStation;
}

export function CoastalMapPanel({
  buoyStation,
  location,
  showSightingPins,
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
      if (!showSightingPins) {
        return [];
      }

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
    [showSightingPins, sightings],
  );

  const markers = [...stationMarkers, ...sightingMarkers];
  const selectedSighting = useMemo(
    () => sightings.find((sighting) => sighting.id === selectedSightingId),
    [selectedSightingId, sightings],
  );

  const hasSightingDetail = Boolean(selectedSighting && showSightingPins);

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
                icon={buildSightingIcon()}
                key={`${sighting.id}-${marineSightingIconVersion}`}
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

function buildSightingIcon() {
  return marineSightingIcon;
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
