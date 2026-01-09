/**
 * Calculate distance between two points using Haversine formula
 *
 * The Haversine formula determines the great-circle distance between two points
 * on a sphere given their longitudes and latitudes. This assumes a spherical Earth,
 * which introduces an error of up to 0.5% compared to more accurate ellipsoidal models.
 *
 * @param lat1 - Latitude of first point in decimal degrees
 * @param lon1 - Longitude of first point in decimal degrees
 * @param lat2 - Latitude of second point in decimal degrees
 * @param lon2 - Longitude of second point in decimal degrees
 * @returns Distance in meters
 *
 * @example
 * ```typescript
 * // Distance from San Francisco to Los Angeles
 * const distance = haversineDistance(37.7749, -122.4194, 34.0522, -118.2437);
 * console.log(distance); // ~559,000 meters (559 km)
 * ```
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Earth's radius in meters
  const R = 6371000;

  // Convert degrees to radians
  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

  // Convert all coordinates to radians
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in meters
  return R * c;
}

/**
 * Calculate initial bearing (forward azimuth) from point 1 to point 2
 *
 * The bearing is the direction you would need to travel from the first point
 * to reach the second point along a great circle path. Note that the bearing
 * may change along the path (except when traveling due north/south or along the equator).
 *
 * @param lat1 - Latitude of first point in decimal degrees
 * @param lon1 - Longitude of first point in decimal degrees
 * @param lat2 - Latitude of second point in decimal degrees
 * @param lon2 - Longitude of second point in decimal degrees
 * @returns Bearing in degrees (0-360, where 0=North, 90=East, 180=South, 270=West)
 *
 * @example
 * ```typescript
 * // Bearing from New York to London
 * const bearing = calculateBearing(40.7128, -74.0060, 51.5074, -0.1278);
 * console.log(bearing); // ~51 degrees (Northeast)
 * ```
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Convert degrees to radians
  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);
  const toDegrees = (radians: number): number => radians * (180 / Math.PI);

  // Convert all coordinates to radians
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);

  // Calculate bearing using forward azimuth formula
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);

  // Convert to degrees and normalize to 0-360 range
  const bearing = (toDegrees(θ) + 360) % 360;

  return bearing;
}
