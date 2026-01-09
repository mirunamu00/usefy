/**
 * Geolocation coordinates data
 * Note: Named GeoCoordinates to avoid conflict with native GeolocationCoordinates type
 */
export interface GeoCoordinates {
  /** Latitude in decimal degrees */
  latitude: number;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Altitude in meters above the WGS 84 ellipsoid (null if unavailable) */
  altitude: number | null;
  /** Accuracy of latitude/longitude in meters */
  accuracy: number;
  /** Accuracy of altitude in meters (null if unavailable) */
  altitudeAccuracy: number | null;
  /** Direction of travel in degrees (0-360, null if unavailable) */
  heading: number | null;
  /** Speed in meters per second (null if unavailable) */
  speed: number | null;
}

/**
 * Position data with timestamp
 * Note: Named GeoPosition to avoid conflict with native GeolocationPosition type
 */
export interface GeoPosition {
  /** Coordinates and related data */
  coords: GeoCoordinates;
  /** Timestamp when position was acquired */
  timestamp: number;
}

/**
 * Geolocation error types
 */
export type GeolocationErrorCode =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "NOT_SUPPORTED";

/**
 * Custom error object for geolocation failures
 */
export interface GeolocationError {
  /** Error code */
  code: GeolocationErrorCode;
  /** Human-readable error message */
  message: string;
  /** Original native error (if available) */
  nativeError?: GeolocationPositionError;
}

/**
 * Permission state for geolocation
 */
export type PermissionState = "prompt" | "granted" | "denied" | "unavailable";

/**
 * Options for useGeolocation hook
 */
export interface UseGeolocationOptions {
  /**
   * Enable high accuracy mode (uses GPS instead of network)
   * WARNING: High accuracy mode may consume more battery power
   * @default false
   */
  enableHighAccuracy?: boolean;

  /**
   * Maximum age of cached position in milliseconds
   * Set to 0 to always request fresh position
   * @default 0
   */
  maximumAge?: number;

  /**
   * Timeout in milliseconds for position request
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Start watching position immediately on mount
   * When true, automatically starts continuous position tracking
   * @default false
   */
  watch?: boolean;

  /**
   * Get initial position immediately on mount
   * When true, automatically fetches position once on mount
   * @default true
   */
  immediate?: boolean;

  /**
   * Callback when position is successfully retrieved
   * @param position - The geolocation position data
   */
  onSuccess?: (position: GeoPosition) => void;

  /**
   * Callback when an error occurs
   * @param error - The geolocation error
   */
  onError?: (error: GeolocationError) => void;

  /**
   * Callback when position changes (during watch mode)
   * @param position - The updated geolocation position data
   */
  onPositionChange?: (position: GeoPosition) => void;

  /**
   * Callback when permission state changes
   * @param state - The new permission state
   */
  onPermissionChange?: (state: PermissionState) => void;
}

/**
 * Return type for useGeolocation hook
 */
export interface UseGeolocationReturn {
  /** Current position data (null if not yet retrieved) */
  position: GeoPosition | null;

  /** Loading state (true while fetching position) */
  loading: boolean;

  /** Error object (null if no error) */
  error: GeolocationError | null;

  /** Current permission state */
  permission: PermissionState;

  /** Whether geolocation is supported in this environment */
  isSupported: boolean;

  /**
   * Manually get current position (one-time request)
   */
  getCurrentPosition: () => void;

  /**
   * Start watching position for real-time updates
   */
  watchPosition: () => void;

  /**
   * Stop watching position
   */
  clearWatch: () => void;

  /**
   * Calculate distance from current position to target coordinates in meters
   * Uses Haversine formula (assumes spherical Earth, ~0.5% error margin)
   * @param latitude - Target latitude in decimal degrees
   * @param longitude - Target longitude in decimal degrees
   * @returns Distance in meters, or null if position unavailable
   */
  distanceFrom: (latitude: number, longitude: number) => number | null;

  /**
   * Calculate bearing/direction from current position to target coordinates
   * @param latitude - Target latitude in decimal degrees
   * @param longitude - Target longitude in decimal degrees
   * @returns Bearing in degrees (0-360, where 0=North, 90=East, 180=South, 270=West), or null if position unavailable
   */
  bearingTo: (latitude: number, longitude: number) => number | null;
}
