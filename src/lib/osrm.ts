import { GeoPointLike, OsrmRouteResult, RdcId } from "@/types";

export const RDC_ROUTE_LOCATIONS: Record<RdcId, GeoPointLike> = {
  north: { lat: 9.6615, lng: 80.0255 },
  south: { lat: 6.0535, lng: 80.221 },
  east: { lat: 7.717, lng: 81.7005 },
  west: { lat: 6.9271, lng: 79.8612 },
  central: { lat: 7.2906, lng: 80.6337 },
};

function isValidCoordinate(value?: GeoPointLike | null) {
  return Boolean(
    value &&
      Number.isFinite(value.lat) &&
      Number.isFinite(value.lng) &&
      Math.abs(value.lat) <= 90 &&
      Math.abs(value.lng) <= 180,
  );
}

export async function getOsrmRoute(start?: GeoPointLike | null, end?: GeoPointLike | null) {
  if (!isValidCoordinate(start) || !isValidCoordinate(end)) {
    return null;
  }

  const safeStart = start as GeoPointLike;
  const safeEnd = end as GeoPointLike;

  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${safeStart.lng},${safeStart.lat};${safeEnd.lng},${safeEnd.lat}`,
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: {
          coordinates?: number[][];
        };
      }>;
    };

    const route = payload.routes?.[0];
    const coordinates =
      route?.geometry?.coordinates
        ?.map(([lng, lat]) => ({
          lat: Number(lat),
          lng: Number(lng),
        }))
        .filter((point) => isValidCoordinate(point)) ?? [];

    if (!route || coordinates.length < 2) {
      return null;
    }

    return {
      coordinates,
      distanceMeters: Number(route.distance ?? 0),
      durationSeconds: Number(route.duration ?? 0),
    } satisfies OsrmRouteResult;
  } catch {
    return null;
  }
}

export function getRdcRouteLocation(rdcId?: RdcId) {
  return rdcId ? RDC_ROUTE_LOCATIONS[rdcId] : undefined;
}

export function formatRouteDistance(distanceMeters?: number) {
  if (!distanceMeters) {
    return "Unavailable";
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatRouteDuration(durationSeconds?: number) {
  if (!durationSeconds) {
    return "Unavailable";
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.max(1, Math.round((durationSeconds % 3600) / 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes} min`;
}
