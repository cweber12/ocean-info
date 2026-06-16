import type { GeoPoint } from "../../domain/location/types";

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export function createBoundingBox(point: GeoPoint, radiusKm: number): BoundingBox {
  const latitudeDelta = radiusKm / 111;
  const longitudeDelta = radiusKm / (111 * Math.cos((point.latitude * Math.PI) / 180));

  return {
    west: point.longitude - longitudeDelta,
    south: point.latitude - latitudeDelta,
    east: point.longitude + longitudeDelta,
    north: point.latitude + latitudeDelta,
  };
}

export function formatBoundingBox(boundingBox: BoundingBox): string {
  return [
    boundingBox.west,
    boundingBox.south,
    boundingBox.east,
    boundingBox.north,
  ]
    .map((value) => value.toFixed(4))
    .join(",");
}

export function getDistanceKm(from: GeoPoint, to: GeoPoint): number {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const latitudeA = toRadians(from.latitude);
  const latitudeB = toRadians(to.latitude);
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc)));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
