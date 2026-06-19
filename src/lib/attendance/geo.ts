/**
 * Geo-fence math for attendance clock-in / clock-out.
 *
 * We use the haversine great-circle formula. Earth radius ≈ 6_371_000 m
 * gives metre-accurate results to ~0.5% — plenty for office-radius
 * checks (typical radius = 150 m).
 *
 * The math here is pure — no I/O, no Prisma. Tested by being called
 * deterministically from the route handlers.
 */

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Distance in metres between two WGS-84 coordinates. Rounded to the
 * nearest metre — sub-metre precision is meaningless given GPS error
 * margins and just creates noisy values in storage.
 */
export function haversineMeters(
  aLat: number, aLng: number,
  bLat: number, bLng: number,
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const a = sinDLat * sinDLat + sinDLng * sinDLng * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_M * c);
}

export interface SitePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

export interface SiteMatch {
  site: SitePoint;
  distanceMeters: number;
  inBounds: boolean;
}

/**
 * Given a point and a list of candidate sites, find the closest one and
 * report whether it's in-bounds. Returns null if `sites` is empty.
 *
 * "Closest" beats "first in-bounds" because two sites can overlap (a hub
 * and a sub-office on the same campus) — we want the most specific match
 * for audit display.
 */
export function findNearestSite(
  lat: number, lng: number,
  sites: SitePoint[],
): SiteMatch | null {
  if (sites.length === 0) return null;

  let nearest = sites[0];
  let nearestDist = haversineMeters(lat, lng, nearest.lat, nearest.lng);

  for (let i = 1; i < sites.length; i++) {
    const d = haversineMeters(lat, lng, sites[i].lat, sites[i].lng);
    if (d < nearestDist) {
      nearest = sites[i];
      nearestDist = d;
    }
  }

  return {
    site:           nearest,
    distanceMeters: nearestDist,
    inBounds:       nearestDist <= nearest.radiusMeters,
  };
}

/**
 * Sanity-check coordinate inputs from clients. Reject impossibly large
 * values early so a malformed payload doesn't reach the haversine and
 * produce nonsense distances.
 */
export function isValidCoord(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}
