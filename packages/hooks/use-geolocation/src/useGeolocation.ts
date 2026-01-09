import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GeolocationError,
  GeolocationErrorCode,
  GeoPosition,
  PermissionState,
  UseGeolocationOptions,
  UseGeolocationReturn,
} from "./types";
import { calculateBearing, haversineDistance } from "./utils";

/**
 * A React hook for accessing device geolocation with real-time tracking and distance calculation.
 *
 * Features:
 * - Get current position (one-time)
 * - Watch position for real-time updates
 * - Permission state tracking
 * - Distance calculation using Haversine formula
 * - Bearing/direction calculation
 * - SSR compatible
 * - TypeScript support
 *
 * @param options - Configuration options
 * @returns Geolocation state and control functions
 *
 * @example
 * ```tsx
 * // Basic usage - get current position
 * function MyLocation() {
 *   const { position, loading, error } = useGeolocation();
 *
 *   if (loading) return <p>Loading location...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!position) return <p>No position yet</p>;
 *
 *   return (
 *     <div>
 *       <p>Latitude: {position.coords.latitude}</p>
 *       <p>Longitude: {position.coords.longitude}</p>
 *       <p>Accuracy: {position.coords.accuracy}m</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Real-time tracking with watch
 * function LiveTracking() {
 *   const { position, watchPosition, clearWatch } = useGeolocation({
 *     immediate: false,
 *     watch: false,
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={watchPosition}>Start Tracking</button>
 *       <button onClick={clearWatch}>Stop Tracking</button>
 *       {position && (
 *         <p>Current: {position.coords.latitude}, {position.coords.longitude}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Distance calculation
 * function DistanceToDestination() {
 *   const { position, distanceFrom } = useGeolocation();
 *
 *   // New York City coordinates
 *   const nyLat = 40.7128;
 *   const nyLon = -74.0060;
 *
 *   const distance = distanceFrom(nyLat, nyLon);
 *
 *   return (
 *     <div>
 *       {distance && (
 *         <p>Distance to NYC: {(distance / 1000).toFixed(2)} km</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With callbacks and high accuracy
 * const geolocation = useGeolocation({
 *   enableHighAccuracy: true,
 *   timeout: 10000,
 *   onSuccess: (pos) => console.log('Got position:', pos),
 *   onError: (err) => console.error('Geolocation error:', err),
 *   onPositionChange: (pos) => console.log('Position updated:', pos),
 *   onPermissionChange: (state) => console.log('Permission:', state),
 * });
 * ```
 */
export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  // ============ Parse Options ============
  const {
    enableHighAccuracy = false,
    maximumAge = 0,
    timeout = 30000, // Default 30 seconds
    watch = false,
    immediate = true,
    onSuccess,
    onError,
    onPositionChange,
    onPermissionChange,
  } = options;

  // ============ State ============
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [permission, setPermission] = useState<PermissionState>("unavailable");

  // ============ Check Support ============
  const isSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  // ============ Refs for Callbacks ============
  // Store callbacks in refs to avoid re-registering listeners when they change
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onPositionChangeRef = useRef(onPositionChange);
  const onPermissionChangeRef = useRef(onPermissionChange);

  // Update callback refs on every render
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onPositionChangeRef.current = onPositionChange;
  onPermissionChangeRef.current = onPermissionChange;

  // ============ Refs for Watch Management ============
  const watchIdRef = useRef<number | null>(null);

  // ============ Refs for Options ============
  const optionsRef = useRef<PositionOptions>({
    enableHighAccuracy,
    maximumAge,
    timeout,
  });

  // ============ Error Handler ============
  const handleError = useCallback((nativeError: GeolocationPositionError) => {
    setLoading(false);

    let errorCode: GeolocationErrorCode;
    let errorMessage: string;

    switch (nativeError.code) {
      case nativeError.PERMISSION_DENIED:
        errorCode = "PERMISSION_DENIED";
        errorMessage = "User denied geolocation permission";
        break;
      case nativeError.POSITION_UNAVAILABLE:
        errorCode = "POSITION_UNAVAILABLE";
        errorMessage = "Position information unavailable";
        break;
      case nativeError.TIMEOUT:
        errorCode = "TIMEOUT";
        errorMessage = "Position request timed out";
        break;
      default:
        errorCode = "POSITION_UNAVAILABLE";
        errorMessage = "Unknown error occurred";
    }

    const geolocationError: GeolocationError = {
      code: errorCode,
      message: errorMessage,
      nativeError,
    };

    setError(geolocationError);
    onErrorRef.current?.(geolocationError);
  }, []);

  // ============ Success Handler ============
  const handleSuccess = useCallback(
    (nativePosition: globalThis.GeolocationPosition) => {
      setLoading(false);
      setError(null);

      // Convert to plain object to avoid issues with frozen/readonly native object
      const geoPosition: GeoPosition = {
        coords: {
          latitude: nativePosition.coords.latitude,
          longitude: nativePosition.coords.longitude,
          altitude: nativePosition.coords.altitude,
          accuracy: nativePosition.coords.accuracy,
          altitudeAccuracy: nativePosition.coords.altitudeAccuracy,
          heading: nativePosition.coords.heading,
          speed: nativePosition.coords.speed,
        },
        timestamp: nativePosition.timestamp,
      };

      setPosition(geoPosition);
      onSuccessRef.current?.(geoPosition);
    },
    []
  );

  // ============ getCurrentPosition ============
  const getCurrentPosition = useCallback(() => {
    // Check support dynamically in case it changes
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const notSupportedError: GeolocationError = {
        code: "NOT_SUPPORTED",
        message: "Geolocation is not supported in this environment",
      };
      setError(notSupportedError);
      onErrorRef.current?.(notSupportedError);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      optionsRef.current
    );
  }, [handleSuccess, handleError]);

  // ============ clearWatch ============
  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // ============ watchPosition ============
  const watchPosition = useCallback(() => {
    // Check support dynamically in case it changes
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const notSupportedError: GeolocationError = {
        code: "NOT_SUPPORTED",
        message: "Geolocation is not supported in this environment",
      };
      setError(notSupportedError);
      onErrorRef.current?.(notSupportedError);
      return;
    }

    // Clear existing watch if any
    clearWatch();

    setLoading(true);
    setError(null);

    // Success handler for watch includes onPositionChange callback
    const handleWatchSuccess = (nativePosition: globalThis.GeolocationPosition) => {
      handleSuccess(nativePosition);

      // Convert to plain object for callback
      const geoPosition: GeoPosition = {
        coords: {
          latitude: nativePosition.coords.latitude,
          longitude: nativePosition.coords.longitude,
          altitude: nativePosition.coords.altitude,
          accuracy: nativePosition.coords.accuracy,
          altitudeAccuracy: nativePosition.coords.altitudeAccuracy,
          heading: nativePosition.coords.heading,
          speed: nativePosition.coords.speed,
        },
        timestamp: nativePosition.timestamp,
      };

      onPositionChangeRef.current?.(geoPosition);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleWatchSuccess,
      handleError,
      optionsRef.current
    );
  }, [handleSuccess, handleError, clearWatch]);

  // ============ Update Options Ref & Auto-Restart Watch ============
  useEffect(() => {
    optionsRef.current = {
      enableHighAccuracy,
      maximumAge,
      timeout,
    };

    // If currently watching, restart with new options
    if (watchIdRef.current !== null) {
      clearWatch();
      watchPosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableHighAccuracy, maximumAge, timeout]);
  // Note: clearWatch and watchPosition are intentionally omitted to avoid infinite loop

  // ============ Permission Monitoring ============
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      setPermission("unavailable");
      return;
    }

    let permissionStatus: PermissionStatus | null = null;
    let changeHandler: (() => void) | null = null;

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        permissionStatus = status;
        setPermission(status.state as PermissionState);

        changeHandler = () => {
          const newState = status.state as PermissionState;
          setPermission(newState);
          onPermissionChangeRef.current?.(newState);
        };

        status.addEventListener("change", changeHandler);
      })
      .catch(() => {
        // Permissions API not supported or query failed
        setPermission("unavailable");
      });

    return () => {
      if (permissionStatus && changeHandler) {
        permissionStatus.removeEventListener("change", changeHandler);
      }
    };
  }, []);

  // ============ Immediate Fetch on Mount ============
  useEffect(() => {
    if (immediate && isSupported) {
      getCurrentPosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, isSupported]);
  // getCurrentPosition is intentionally omitted to run only once on mount

  // ============ Watch on Mount ============
  useEffect(() => {
    if (watch && isSupported) {
      watchPosition();
    }

    return () => {
      clearWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, isSupported]);
  // watchPosition and clearWatch are intentionally omitted to run only once on mount

  // ============ Cleanup on Unmount ============
  useEffect(() => {
    return () => {
      clearWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ Utility: distanceFrom ============
  const distanceFrom = useCallback(
    (latitude: number, longitude: number): number | null => {
      if (!position) {
        return null;
      }

      return haversineDistance(
        position.coords.latitude,
        position.coords.longitude,
        latitude,
        longitude
      );
    },
    [position]
  );

  // ============ Utility: bearingTo ============
  const bearingTo = useCallback(
    (latitude: number, longitude: number): number | null => {
      if (!position) {
        return null;
      }

      return calculateBearing(
        position.coords.latitude,
        position.coords.longitude,
        latitude,
        longitude
      );
    },
    [position]
  );

  // ============ Return ============
  return {
    position,
    loading,
    error,
    permission,
    isSupported,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    distanceFrom,
    bearingTo,
  };
}
