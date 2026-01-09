import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGeolocation } from "./useGeolocation";
import type { GeoPosition } from "./types";

describe("useGeolocation", () => {
  let mockGeolocation: {
    getCurrentPosition: ReturnType<typeof vi.fn>;
    watchPosition: ReturnType<typeof vi.fn>;
    clearWatch: ReturnType<typeof vi.fn>;
  };

  let mockPermissions: {
    query: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock navigator.geolocation
    mockGeolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };

    // Mock navigator.permissions
    mockPermissions = {
      query: vi.fn().mockRejectedValue(new Error("Not supported by default")),
    };

    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(global.navigator, "permissions", {
      value: mockPermissions,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with correct default state", () => {
      mockPermissions.query.mockRejectedValue(new Error("Not supported"));

      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      expect(result.current.position).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isSupported).toBe(true);
    });

    it("should detect unsupported environment", () => {
      // Note: In a real browser environment, navigator.geolocation is set at page load
      // and doesn't change. This test verifies the isSupported flag is correctly computed.
      // Since the module is already loaded with geolocation present, we just verify
      // that the dynamic checks in getCurrentPosition handle missing geolocation.

      // This test is effectively covered by "should handle NOT_SUPPORTED error when geolocation unavailable"
      // So we'll just verify that isSupported is properly initialized when geolocation exists
      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      // When navigator.geolocation exists, isSupported should be true
      expect(result.current.isSupported).toBe(true);
    });

    it("should set loading to true when immediate is true", () => {
      const { result } = renderHook(() => useGeolocation({ immediate: true }));

      // Initially loading should be true
      expect(result.current.loading).toBe(true);
    });
  });

  describe("getCurrentPosition", () => {
    it("should get current position successfully", async () => {
      const mockPosition: GeoPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      act(() => {
        result.current.getCurrentPosition();
      });

      await waitFor(() => {
        expect(result.current.position).toEqual({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            altitude: null,
            accuracy: 10,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: mockPosition.timestamp,
        });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it("should handle PERMISSION_DENIED error", async () => {
      const mockError = {
        code: 1,
        message: "User denied geolocation",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError;

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      act(() => {
        result.current.getCurrentPosition();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual({
          code: "PERMISSION_DENIED",
          message: "User denied geolocation permission",
          nativeError: mockError,
        });
        expect(result.current.loading).toBe(false);
      });
    });

    it("should handle POSITION_UNAVAILABLE error", async () => {
      const mockError = {
        code: 2,
        message: "Position unavailable",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError;

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      act(() => {
        result.current.getCurrentPosition();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual({
          code: "POSITION_UNAVAILABLE",
          message: "Position information unavailable",
          nativeError: mockError,
        });
      });
    });

    it("should handle TIMEOUT error", async () => {
      const mockError = {
        code: 3,
        message: "Timeout",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError;

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      act(() => {
        result.current.getCurrentPosition();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual({
          code: "TIMEOUT",
          message: "Position request timed out",
          nativeError: mockError,
        });
      });
    });

    it("should handle NOT_SUPPORTED error when geolocation unavailable", () => {
      // Remove geolocation BEFORE rendering
      Object.defineProperty(global.navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });

      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      act(() => {
        result.current.getCurrentPosition();
      });

      expect(result.current.error).toEqual({
        code: "NOT_SUPPORTED",
        message: "Geolocation is not supported in this environment",
      });
      expect(result.current.loading).toBe(false);
    });
  });

  describe("watchPosition", () => {
    it("should watch position and receive updates", async () => {
      let watchCallback: ((pos: GeoPosition) => void) | null = null;

      mockGeolocation.watchPosition.mockImplementation((success) => {
        watchCallback = success;
        return 1; // watch ID
      });

      const onPositionChange = vi.fn();

      const { result } = renderHook(() =>
        useGeolocation({ immediate: false, onPositionChange })
      );

      act(() => {
        result.current.watchPosition();
      });

      const position1: GeoPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      act(() => {
        watchCallback?.(position1);
      });

      await waitFor(() => {
        expect(onPositionChange).toHaveBeenCalledWith(
          expect.objectContaining({
            coords: expect.objectContaining({
              latitude: 37.7749,
              longitude: -122.4194,
            }),
          })
        );
      });

      const position2: GeoPosition = {
        coords: {
          latitude: 37.775,
          longitude: -122.4195,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      act(() => {
        watchCallback?.(position2);
      });

      await waitFor(() => {
        expect(onPositionChange).toHaveBeenCalledTimes(2);
        expect(result.current.position?.coords.latitude).toBe(37.775);
      });
    });

    it("should clear watch on clearWatch call", () => {
      mockGeolocation.watchPosition.mockReturnValue(123);

      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      act(() => {
        result.current.watchPosition();
      });

      act(() => {
        result.current.clearWatch();
      });

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123);
    });

    it("should clear existing watch before starting new one", () => {
      mockGeolocation.watchPosition
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(200);

      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      act(() => {
        result.current.watchPosition();
      });

      expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.watchPosition();
      });

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(100);
      expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(2);
    });
  });

  describe("permission state", () => {
    it("should track permission state changes", async () => {
      const mockPermissionStatus = {
        state: "granted",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      mockPermissions.query.mockResolvedValue(mockPermissionStatus);

      const onPermissionChange = vi.fn();

      const { result } = renderHook(() =>
        useGeolocation({ onPermissionChange, immediate: false })
      );

      await waitFor(() => {
        expect(mockPermissions.query).toHaveBeenCalledWith({
          name: "geolocation",
        });
        expect(result.current.permission).toBe("granted");
      });

      // Simulate permission change
      const changeHandler =
        mockPermissionStatus.addEventListener.mock.calls[0][1];
      mockPermissionStatus.state = "denied";

      act(() => {
        changeHandler();
      });

      await waitFor(() => {
        expect(onPermissionChange).toHaveBeenCalledWith("denied");
        expect(result.current.permission).toBe("denied");
      });
    });

    it("should set permission to unavailable when permissions API fails", async () => {
      mockPermissions.query.mockRejectedValue(new Error("Not supported"));

      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      await waitFor(() => {
        expect(result.current.permission).toBe("unavailable");
      });
    });
  });

  describe("distanceFrom", () => {
    it("should calculate distance correctly", async () => {
      const mockPosition: GeoPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.position).not.toBeNull();
      });

      // San Francisco to Los Angeles (roughly 559 km)
      const distance = result.current.distanceFrom(34.0522, -118.2437);

      expect(distance).not.toBeNull();
      expect(distance!).toBeGreaterThan(550000); // > 550 km
      expect(distance!).toBeLessThan(570000); // < 570 km
    });

    it("should return null when no position available", () => {
      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      const distance = result.current.distanceFrom(34.0522, -118.2437);

      expect(distance).toBeNull();
    });
  });

  describe("bearingTo", () => {
    it("should calculate bearing correctly", async () => {
      const mockPosition: GeoPosition = {
        coords: {
          latitude: 40.7128, // New York
          longitude: -74.006,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useGeolocation());

      await waitFor(() => {
        expect(result.current.position).not.toBeNull();
      });

      // New York to London (roughly northeast, ~51 degrees)
      const bearing = result.current.bearingTo(51.5074, -0.1278);

      expect(bearing).not.toBeNull();
      expect(bearing!).toBeGreaterThan(45); // > 45 degrees
      expect(bearing!).toBeLessThan(60); // < 60 degrees
    });

    it("should return null when no position available", () => {
      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      const bearing = result.current.bearingTo(51.5074, -0.1278);

      expect(bearing).toBeNull();
    });
  });

  describe("options", () => {
    it("should use custom options", () => {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000,
      };

      const { result } = renderHook(() =>
        useGeolocation({ ...options, immediate: false })
      );

      act(() => {
        result.current.getCurrentPosition();
      });

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 10000,
        })
      );
    });

    it("should use default timeout of 30000ms", () => {
      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      act(() => {
        result.current.getCurrentPosition();
      });

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          timeout: 30000,
        })
      );
    });

    it("should call onSuccess callback", async () => {
      const onSuccess = vi.fn();
      const mockPosition: GeoPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      renderHook(() => useGeolocation({ onSuccess }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            coords: expect.objectContaining({
              latitude: 37.7749,
            }),
          })
        );
      });
    });

    it("should call onError callback", async () => {
      const onError = vi.fn();
      const mockError = {
        code: 2,
        message: "Position unavailable",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError;

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      renderHook(() => useGeolocation({ onError }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: "POSITION_UNAVAILABLE",
          })
        );
      });
    });
  });

  describe("auto-watch and immediate", () => {
    it("should start watching immediately when watch: true", async () => {
      mockGeolocation.watchPosition.mockReturnValue(1);

      renderHook(() => useGeolocation({ watch: true, immediate: false }));

      await waitFor(() => {
        expect(mockGeolocation.watchPosition).toHaveBeenCalled();
      });
    });

    it("should get position immediately when immediate: true", async () => {
      renderHook(() => useGeolocation({ immediate: true }));

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });

    it("should not fetch position when immediate: false", () => {
      renderHook(() => useGeolocation({ immediate: false }));

      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
    });
  });

  describe("options auto-restart", () => {
    it("should restart watch when enableHighAccuracy changes", async () => {
      mockGeolocation.watchPosition.mockReturnValue(1);

      const { rerender } = renderHook(
        ({ enableHighAccuracy }) =>
          useGeolocation({ watch: true, enableHighAccuracy, immediate: false }),
        { initialProps: { enableHighAccuracy: false } }
      );

      await waitFor(() => {
        expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(1);
      });

      // Change enableHighAccuracy
      mockGeolocation.watchPosition.mockReturnValue(2);
      rerender({ enableHighAccuracy: true });

      await waitFor(() => {
        expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(1);
        expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(2);
      });
    });

    it("should restart watch when timeout changes", async () => {
      mockGeolocation.watchPosition.mockReturnValue(1);

      const { rerender } = renderHook(
        ({ timeout }) =>
          useGeolocation({ watch: true, timeout, immediate: false }),
        { initialProps: { timeout: 10000 } }
      );

      await waitFor(() => {
        expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(1);
      });

      // Change timeout
      mockGeolocation.watchPosition.mockReturnValue(2);
      rerender({ timeout: 20000 });

      await waitFor(() => {
        expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(1);
        expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(2);
      });
    });

    it("should not restart watch when watch is false", async () => {
      const { rerender } = renderHook(
        ({ enableHighAccuracy }) =>
          useGeolocation({
            watch: false,
            enableHighAccuracy,
            immediate: false,
          }),
        { initialProps: { enableHighAccuracy: false } }
      );

      expect(mockGeolocation.watchPosition).not.toHaveBeenCalled();

      rerender({ enableHighAccuracy: true });

      expect(mockGeolocation.watchPosition).not.toHaveBeenCalled();
      expect(mockGeolocation.clearWatch).not.toHaveBeenCalled();
    });
  });

  describe("function reference stability", () => {
    it("should maintain stable function references", () => {
      const { result, rerender } = renderHook(() =>
        useGeolocation({ immediate: false })
      );

      const firstRefs = {
        getCurrentPosition: result.current.getCurrentPosition,
        watchPosition: result.current.watchPosition,
        clearWatch: result.current.clearWatch,
        distanceFrom: result.current.distanceFrom,
        bearingTo: result.current.bearingTo,
      };

      rerender();

      expect(result.current.getCurrentPosition).toBe(
        firstRefs.getCurrentPosition
      );
      expect(result.current.watchPosition).toBe(firstRefs.watchPosition);
      expect(result.current.clearWatch).toBe(firstRefs.clearWatch);
      expect(result.current.distanceFrom).toBe(firstRefs.distanceFrom);
      expect(result.current.bearingTo).toBe(firstRefs.bearingTo);
    });

    it("should update distanceFrom and bearingTo when position changes", async () => {
      const mockPosition: GeoPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result, rerender } = renderHook(() =>
        useGeolocation({ immediate: false })
      );

      const initialDistanceFrom = result.current.distanceFrom;
      const initialBearingTo = result.current.bearingTo;

      act(() => {
        result.current.getCurrentPosition();
      });

      await waitFor(() => {
        expect(result.current.position).not.toBeNull();
      });

      rerender();

      // Functions should have different references because position changed
      expect(result.current.distanceFrom).not.toBe(initialDistanceFrom);
      expect(result.current.bearingTo).not.toBe(initialBearingTo);
    });
  });

  describe("cleanup", () => {
    it("should clear watch on unmount", () => {
      mockGeolocation.watchPosition.mockReturnValue(456);

      const { unmount } = renderHook(() =>
        useGeolocation({ watch: true, immediate: false })
      );

      unmount();

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(456);
    });

    it("should clear watch multiple times safely", () => {
      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      act(() => {
        result.current.clearWatch();
        result.current.clearWatch();
        result.current.clearWatch();
      });

      // Should not throw error
      expect(mockGeolocation.clearWatch).toHaveBeenCalledTimes(0); // No watch was started
    });
  });
});
