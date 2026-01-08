import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useGeolocation } from "@usefy/use-geolocation";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

const meta = {
  title: "Hooks/useGeolocation",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
\`useGeolocation\` is a feature-rich React hook for accessing device geolocation with real-time tracking, distance calculation, and comprehensive error handling. It provides a simple API for getting current position, watching position changes, calculating distances, and tracking permission states.
        `,
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic demo component showing current location
 */
function BasicGeolocationDemo() {
  const { position, loading, error, permission, isSupported } =
    useGeolocation();

  if (!isSupported) {
    return (
      <div className={storyTheme.container + " max-w-md mx-auto"}>
        <div className={storyTheme.cardWarning + " bg-amber-50 border border-amber-200 rounded-2xl p-5"}>
          <p className="text-amber-800">
            ⚠️ Geolocation is not supported in your browser
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={storyTheme.container + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Current Location</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Your device's geographic coordinates
      </p>

      {/* Permission Status */}
      <div className="mb-6">
        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-sm text-gray-500">Permission:</span>
          <span
            data-testid="permission-badge"
            className={`px-2 py-1 rounded text-xs font-semibold ${
              permission === "granted"
                ? "bg-green-100 text-green-700"
                : permission === "denied"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {permission}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          data-testid="loading-indicator"
          className={storyTheme.cardInfo + " text-center bg-slate-50 p-8 rounded-2xl"}
        >
          <div className="animate-pulse">📍 Getting your location...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div data-testid="error-message" className={storyTheme.cardError + " bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-800"}>
          <p className="font-semibold">Error: {error.code}</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Position Data */}
      {position && (
        <div data-testid="position-data" className={storyTheme.card + " bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-gray-600">Latitude:</span>
              <span className="font-mono font-semibold">
                {position.coords.latitude.toFixed(6)}°
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-gray-600">Longitude:</span>
              <span className="font-mono font-semibold">
                {position.coords.longitude.toFixed(6)}°
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-gray-600">Accuracy:</span>
              <span className="font-mono font-semibold">
                {position.coords.accuracy.toFixed(1)}m
              </span>
            </div>
            {position.coords.altitude !== null && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-gray-600">Altitude:</span>
                <span className="font-mono font-semibold">
                  {position.coords.altitude.toFixed(1)}m
                </span>
              </div>
            )}
            {position.coords.speed !== null && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-gray-600">Speed:</span>
                <span className="font-mono font-semibold">
                  {position.coords.speed.toFixed(1)}m/s
                </span>
              </div>
            )}
            {position.coords.heading !== null && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-gray-600">Heading:</span>
                <span className="font-mono font-semibold">
                  {position.coords.heading.toFixed(0)}°
                </span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Timestamp:</span>
              <span className="font-mono text-sm">
                {new Date(position.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Demo with manual controls
 */
function ManualControlDemo() {
  const {
    position,
    loading,
    error,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    isSupported,
  } = useGeolocation({ immediate: false, watch: false });

  const [isWatching, setIsWatching] = useState(false);

  const handleGetLocation = () => {
    getCurrentPosition();
  };

  const handleStartWatch = () => {
    watchPosition();
    setIsWatching(true);
  };

  const handleStopWatch = () => {
    clearWatch();
    setIsWatching(false);
  };

  if (!isSupported) {
    return (
      <div className={storyTheme.container + " max-w-md mx-auto"}>
        <div className={storyTheme.cardWarning + " bg-amber-50 border border-amber-200 rounded-2xl p-5"}>
          <p>Geolocation not supported</p>
        </div>
      </div>
    );
  }

  return (
    <div className={storyTheme.container + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Manual Control</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Get location on demand or track in real-time
      </p>

      {/* Control Buttons */}
      <div className="flex flex-col gap-3 mb-6">
        <button
          data-testid="get-location-btn"
          onClick={handleGetLocation}
          disabled={loading}
          className={storyTheme.buttonPrimary + " w-full py-3 rounded-xl font-bold shadow-lg"}
        >
          📍 Get Current Location
        </button>
        <div className="flex gap-3">
          <button
            data-testid="start-watch-btn"
            onClick={handleStartWatch}
            disabled={isWatching || loading}
            className={storyTheme.buttonSuccess + " flex-1 py-3 rounded-xl font-bold"}
          >
            ▶️ Start Tracking
          </button>
          <button
            data-testid="stop-watch-btn"
            onClick={handleStopWatch}
            disabled={!isWatching}
            className={storyTheme.buttonDanger + " flex-1 py-3 rounded-xl font-bold"}
          >
            ⏹️ Stop Tracking
          </button>
        </div>
      </div>

      {/* Status */}
      {isWatching && (
        <div className={storyTheme.cardSuccess + " bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4"}>
          <p className="text-green-800">🔴 Live tracking active</p>
        </div>
      )}

      {loading && (
        <div data-testid="loading-state" className={storyTheme.cardInfo + " bg-slate-50 p-4 rounded-2xl mb-4"}>
          <p>Loading...</p>
        </div>
      )}

      {error && (
        <div data-testid="error-state" className={storyTheme.cardError + " bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4 text-rose-800"}>
          <p>{error.message}</p>
        </div>
      )}

      {/* Position Display */}
      {position && (
        <div data-testid="position-display" className={storyTheme.card + " bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}>
          <p className="font-mono text-sm">
            {position.coords.latitude.toFixed(6)},{" "}
            {position.coords.longitude.toFixed(6)}
          </p>
          <p className="text-xs text-gray-500">±{position.coords.accuracy}m</p>
        </div>
      )}
    </div>
  );
}

/**
 * Demo showing distance calculation
 */
function DistanceCalculationDemo() {
  const { position, loading, distanceFrom, bearingTo } = useGeolocation();

  // Famous locations
  const locations = [
    { name: "New York", lat: 40.7128, lon: -74.006 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
  ];

  return (
    <div className={storyTheme.container + " max-w-2xl mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Distance Calculator</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Calculate distances and bearings to famous cities
      </p>

      {loading && (
        <div className={storyTheme.cardInfo + " bg-slate-50 p-4 rounded-2xl mb-4"}>
          <p>Getting your location...</p>
        </div>
      )}

      {position && (
        <div className="space-y-3">
          <div className={storyTheme.card + " bg-white rounded-2xl p-5 shadow-sm border border-slate-100"}>
            <p className="text-sm text-gray-600 mb-1">Your Location</p>
            <p className="font-mono">
              {position.coords.latitude.toFixed(4)}°,{" "}
              {position.coords.longitude.toFixed(4)}°
            </p>
          </div>

          <div className="space-y-2">
            {locations.map((loc) => {
              const distance = distanceFrom(loc.lat, loc.lon);
              const bearing = bearingTo(loc.lat, loc.lon);

              return (
                <div
                  key={loc.name}
                  data-testid={`distance-${loc.name.toLowerCase()}`}
                  className={storyTheme.card + " bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all"}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{loc.name}</p>
                      <p className="text-xs text-gray-500">
                        {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-blue-600">
                        {distance ? (distance / 1000).toFixed(0) : "—"} km
                      </p>
                      <p className="text-xs text-gray-500">
                        {bearing ? `${bearing.toFixed(0)}°` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Demo with high accuracy mode
 */
function HighAccuracyDemo() {
  const standard = useGeolocation({
    enableHighAccuracy: false,
    immediate: false,
  });
  const highAccuracy = useGeolocation({
    enableHighAccuracy: true,
    immediate: false,
  });

  const [mode, setMode] = useState<"standard" | "high">("standard");
  const current = mode === "standard" ? standard : highAccuracy;

  const handleFetch = () => {
    if (mode === "standard") {
      standard.getCurrentPosition();
    } else {
      highAccuracy.getCurrentPosition();
    }
  };

  return (
    <div className={storyTheme.container + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Accuracy Comparison</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Compare standard vs high accuracy mode
      </p>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
        <button
          data-testid="standard-mode-btn"
          onClick={() => setMode("standard")}
          className={
            mode === "standard"
              ? "flex-1 py-2 rounded-lg bg-white shadow-sm font-semibold text-slate-800"
              : "flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-700"
          }
        >
          Standard
        </button>
        <button
          data-testid="high-accuracy-mode-btn"
          onClick={() => setMode("high")}
          className={
            mode === "high"
              ? "flex-1 py-2 rounded-lg bg-white shadow-sm font-semibold text-slate-800"
              : "flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-700"
          }
        >
          High Accuracy
        </button>
      </div>

      <button
        data-testid="fetch-location-btn"
        onClick={handleFetch}
        disabled={current.loading}
        className={storyTheme.buttonPrimary + " w-full py-3 rounded-xl font-bold shadow-lg"}
      >
        Get Location ({mode})
      </button>

      {current.loading && (
        <div className={storyTheme.cardInfo + " mt-6 bg-slate-50 p-4 rounded-2xl"}>
          <p>Fetching with {mode} accuracy...</p>
        </div>
      )}

      {current.position && (
        <div
          data-testid="accuracy-result"
          className={storyTheme.card + " mt-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}
        >
          <p className="text-sm text-gray-600">
            Mode: <span className="font-semibold">{mode}</span>
          </p>
          <p className="font-mono text-lg">
            {current.position.coords.latitude.toFixed(6)}°
          </p>
          <p className="font-mono text-lg">
            {current.position.coords.longitude.toFixed(6)}°
          </p>
          <p className="text-sm mt-2">
            Accuracy:{" "}
            <span
              data-testid="accuracy-value"
              className="font-semibold text-blue-600"
            >
              ±{current.position.coords.accuracy.toFixed(1)}m
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Basic geolocation usage - automatically fetches on mount
 */
export const Basic: Story = {
  render: () => <BasicGeolocationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Basic usage that automatically fetches the user's current location on mount. Shows all available coordinate data including latitude, longitude, accuracy, and optional fields like altitude, speed, and heading.",
      },
    },
  },
};

/**
 * Manual control - fetch location on demand
 */
export const ManualControl: Story = {
  render: () => <ManualControlDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates manual control with immediate: false. Get location on demand with getCurrentPosition() or start/stop real-time tracking with watchPosition()/clearWatch().",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that buttons are present
    const getLocationBtn = canvas.getByTestId("get-location-btn");
    const startWatchBtn = canvas.getByTestId("start-watch-btn");
    const stopWatchBtn = canvas.getByTestId("stop-watch-btn");

    expect(getLocationBtn).toBeInTheDocument();
    expect(startWatchBtn).toBeInTheDocument();
    expect(stopWatchBtn).toBeInTheDocument();

    // Stop watch button should be disabled initially
    expect(stopWatchBtn).toBeDisabled();
  },
};

/**
 * Distance calculation to famous cities
 */
export const DistanceCalculation: Story = {
  render: () => <DistanceCalculationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Uses distanceFrom() and bearingTo() utility functions to calculate distances (in meters) and bearings (in degrees) to famous world cities. The Haversine formula is used for distance calculation.",
      },
    },
  },
};

/**
 * High accuracy mode comparison
 */
export const HighAccuracyMode: Story = {
  render: () => <HighAccuracyDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Compare standard vs high accuracy mode. High accuracy uses GPS which provides better precision but may take longer and consume more battery. Toggle between modes to see the difference in accuracy values.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test mode switching
    const standardBtn = canvas.getByTestId("standard-mode-btn");
    const highAccuracyBtn = canvas.getByTestId("high-accuracy-mode-btn");

    expect(standardBtn).toBeInTheDocument();
    expect(highAccuracyBtn).toBeInTheDocument();

    // Switch to high accuracy mode
    await userEvent.click(highAccuracyBtn);

    // Verify button states changed (active button has bg-white and shadow)
    await waitFor(() => {
      expect(highAccuracyBtn).toHaveClass("bg-white");
    });
  },
};

/**
 * Real-time tracking demo
 */
export const RealTimeTracking: Story = {
  render: () => {
    const { position, loading, watchPosition, clearWatch, isSupported } =
      useGeolocation({
        immediate: false,
        watch: false,
        onPositionChange: (pos) => {
          console.log("Position updated:", pos);
        },
      });

    const [isTracking, setIsTracking] = React.useState(false);
    const [updateCount, setUpdateCount] = React.useState(0);

    React.useEffect(() => {
      if (position) {
        setUpdateCount((prev) => prev + 1);
      }
    }, [position]);

    const handleStartTracking = () => {
      watchPosition();
      setIsTracking(true);
      setUpdateCount(0);
    };

    const handleStopTracking = () => {
      clearWatch();
      setIsTracking(false);
    };

    if (!isSupported) {
      return (
        <div className={storyTheme.container}>
          <div className={storyTheme.cardWarning}>
            <p>Geolocation not supported</p>
          </div>
        </div>
      );
    }

    return (
      <div className={storyTheme.container + " max-w-md mx-auto"}>
        <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Real-Time Tracking</h2>
        <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
          Watch position changes in real-time
        </p>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <button
            data-testid="start-tracking-btn"
            onClick={handleStartTracking}
            disabled={isTracking || loading}
            className={storyTheme.buttonSuccess + " flex-1 py-3 rounded-xl font-bold"}
          >
            🔴 Start Tracking
          </button>
          <button
            data-testid="stop-tracking-btn"
            onClick={handleStopTracking}
            disabled={!isTracking}
            className={storyTheme.buttonDanger + " flex-1 py-3 rounded-xl font-bold"}
          >
            ⏹️ Stop Tracking
          </button>
        </div>

        {/* Tracking Status */}
        {isTracking && (
          <div className={storyTheme.cardSuccess + " bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4"}>
            <div className="flex items-center justify-between">
              <span className="text-green-800 font-semibold">
                🔴 LIVE TRACKING
              </span>
              <span
                data-testid="update-count"
                className="text-sm text-green-600"
              >
                {updateCount} update{updateCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {loading && (
          <div className={storyTheme.cardInfo + " bg-slate-50 p-4 rounded-2xl mb-4"}>
            <p>Initializing tracking...</p>
          </div>
        )}

        {/* Current Position */}
        {position && (
          <div data-testid="tracking-position" className={storyTheme.card + " bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-mono">
                  {position.coords.latitude.toFixed(6)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-mono">
                  {position.coords.longitude.toFixed(6)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className="font-mono">
                  ±{position.coords.accuracy.toFixed(1)}m
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Last update:</span>
                <span>{new Date(position.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates real-time position tracking using watchPosition(). The position updates automatically as the device moves. Use onPositionChange callback to react to position updates.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const startBtn = canvas.getByTestId("start-tracking-btn");
    const stopBtn = canvas.getByTestId("stop-tracking-btn");

    // Initially stop button should be disabled
    expect(stopBtn).toBeDisabled();

    // Start button should be enabled
    expect(startBtn).not.toBeDisabled();
  },
};
