<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-geolocation</h1>

<p align="center">
  <strong>A powerful React hook for accessing device geolocation with real-time tracking and distance calculation</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-geolocation">
    <img src="https://img.shields.io/npm/v/@usefy/use-geolocation.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-geolocation">
    <img src="https://img.shields.io/npm/dm/@usefy/use-geolocation.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-geolocation">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-geolocation?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-geolocation.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usegeolocation--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-geolocation` is a feature-rich React hook for accessing device geolocation with real-time tracking, distance calculation, and comprehensive error handling. It provides a simple API for getting current position, watching position changes, calculating distances, and tracking permission states.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-geolocation?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with comprehensive type definitions
- **Real-Time Tracking** — Watch position changes as device moves
- **Distance Calculation** — Built-in Haversine formula for accurate distance calculations
- **Bearing Calculation** — Calculate direction/bearing between coordinates
- **Permission Tracking** — Monitor geolocation permission state changes
- **Error Handling** — Comprehensive error handling with typed error codes
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Stable References** — Memoized functions for optimal performance
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-geolocation

# yarn
yarn add @usefy/use-geolocation

# pnpm
pnpm add @usefy/use-geolocation
```

### Peer Dependencies

This package requires React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Quick Start

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

function MyLocation() {
  const { position, loading, error } = useGeolocation();

  if (loading) return <p>Loading location...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!position) return <p>No position yet</p>;

  return (
    <div>
      <p>Latitude: {position.coords.latitude}</p>
      <p>Longitude: {position.coords.longitude}</p>
      <p>Accuracy: {position.coords.accuracy}m</p>
    </div>
  );
}
```

---

## API Reference

### `useGeolocation(options?)`

A hook that manages geolocation state with real-time tracking and utility functions.

#### Parameters

| Parameter | Type                    | Description                   |
| --------- | ----------------------- | ----------------------------- |
| `options` | `UseGeolocationOptions` | Optional configuration object |

#### Options

| Option               | Type                                | Default | Description                                                 |
| -------------------- | ----------------------------------- | ------- | ----------------------------------------------------------- |
| `enableHighAccuracy` | `boolean`                           | `false` | Enable high accuracy mode (uses GPS, consumes more battery) |
| `maximumAge`         | `number`                            | `0`     | Maximum age of cached position in milliseconds              |
| `timeout`            | `number`                            | `30000` | Timeout in milliseconds for position request                |
| `watch`              | `boolean`                           | `false` | Start watching position immediately on mount                |
| `immediate`          | `boolean`                           | `true`  | Get initial position immediately on mount                   |
| `onSuccess`          | `(position: GeoPosition) => void`   | —       | Callback when position is successfully retrieved            |
| `onError`            | `(error: GeolocationError) => void` | —       | Callback when an error occurs                               |
| `onPositionChange`   | `(position: GeoPosition) => void`   | —       | Callback when position changes (during watch mode)          |
| `onPermissionChange` | `(state: PermissionState) => void`  | —       | Callback when permission state changes                      |

#### Returns `UseGeolocationReturn`

| Property             | Type                                           | Description                                                                             |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `position`           | `GeoPosition \| null`                          | Current position data (null if not yet retrieved)                                       |
| `loading`            | `boolean`                                      | Loading state (true while fetching position)                                            |
| `error`              | `GeolocationError \| null`                     | Error object (null if no error)                                                         |
| `permission`         | `PermissionState`                              | Current permission state (`prompt`, `granted`, `denied`, `unavailable`)                 |
| `isSupported`        | `boolean`                                      | Whether geolocation is supported in this environment                                    |
| `getCurrentPosition` | `() => void`                                   | Manually get current position (one-time request)                                        |
| `watchPosition`      | `() => void`                                   | Start watching position for real-time updates                                           |
| `clearWatch`         | `() => void`                                   | Stop watching position                                                                  |
| `distanceFrom`       | `(lat: number, lon: number) => number \| null` | Calculate distance from current position to target coordinates in meters                |
| `bearingTo`          | `(lat: number, lon: number) => number \| null` | Calculate bearing/direction from current position to target coordinates (0-360 degrees) |

#### Error Codes

| Code                   | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `PERMISSION_DENIED`    | User denied geolocation permission               |
| `POSITION_UNAVAILABLE` | Position information unavailable                 |
| `TIMEOUT`              | Position request timed out                       |
| `NOT_SUPPORTED`        | Geolocation is not supported in this environment |

---

## Examples

### Basic Usage

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

function CurrentLocation() {
  const { position, loading, error } = useGeolocation();

  if (loading) return <div>Loading location...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!position) return <div>No position available</div>;

  return (
    <div>
      <p>Latitude: {position.coords.latitude}</p>
      <p>Longitude: {position.coords.longitude}</p>
      <p>Accuracy: {position.coords.accuracy}m</p>
    </div>
  );
}
```

### Manual Control

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

function ManualLocation() {
  const {
    position,
    loading,
    error,
    getCurrentPosition,
    watchPosition,
    clearWatch,
  } = useGeolocation({ immediate: false, watch: false });

  return (
    <div>
      <button onClick={getCurrentPosition} disabled={loading}>
        Get Location
      </button>
      <button onClick={watchPosition}>Start Tracking</button>
      <button onClick={clearWatch}>Stop Tracking</button>

      {position && (
        <p>
          {position.coords.latitude}, {position.coords.longitude}
        </p>
      )}
    </div>
  );
}
```

### Real-Time Tracking

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

function LiveTracking() {
  const { position, watchPosition, clearWatch } = useGeolocation({
    immediate: false,
    watch: false,
    onPositionChange: (pos) => {
      console.log("Position updated:", pos);
    },
  });

  const [isTracking, setIsTracking] = useState(false);

  const handleStart = () => {
    watchPosition();
    setIsTracking(true);
  };

  const handleStop = () => {
    clearWatch();
    setIsTracking(false);
  };

  return (
    <div>
      <button onClick={handleStart} disabled={isTracking}>
        Start Tracking
      </button>
      <button onClick={handleStop} disabled={!isTracking}>
        Stop Tracking
      </button>

      {isTracking && <p>🔴 Live tracking active</p>}

      {position && (
        <p>
          {position.coords.latitude.toFixed(6)},{" "}
          {position.coords.longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
}
```

### Distance Calculation

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

function DistanceToDestination() {
  const { position, distanceFrom } = useGeolocation();

  // New York City coordinates
  const nyLat = 40.7128;
  const nyLon = -74.006;

  const distance = distanceFrom(nyLat, nyLon);

  return (
    <div>
      {distance && <p>Distance to NYC: {(distance / 1000).toFixed(2)} km</p>}
    </div>
  );
}
```

### Bearing/Direction Calculation

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

function DirectionToDestination() {
  const { position, bearingTo } = useGeolocation();

  // London coordinates
  const londonLat = 51.5074;
  const londonLon = -0.1278;

  const bearing = bearingTo(londonLat, londonLon);

  const getDirection = (bearing: number | null) => {
    if (bearing === null) return "—";
    if (bearing < 22.5 || bearing >= 337.5) return "North";
    if (bearing < 67.5) return "Northeast";
    if (bearing < 112.5) return "East";
    if (bearing < 157.5) return "Southeast";
    if (bearing < 202.5) return "South";
    if (bearing < 247.5) return "Southwest";
    if (bearing < 292.5) return "West";
    return "Northwest";
  };

  return (
    <div>
      {bearing !== null && (
        <p>
          Direction to London: {getDirection(bearing)} ({bearing.toFixed(0)}°)
        </p>
      )}
    </div>
  );
}
```

### High Accuracy Mode

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

function HighAccuracyLocation() {
  const { position, loading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
  });

  if (loading) return <div>Getting high accuracy location...</div>;

  return (
    <div>
      {position && <p>High accuracy: {position.coords.accuracy.toFixed(1)}m</p>}
    </div>
  );
}
```

### Permission State Tracking

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

function PermissionStatus() {
  const { permission, onPermissionChange } = useGeolocation({
    onPermissionChange: (state) => {
      console.log("Permission changed:", state);
    },
  });

  return (
    <div>
      <p>Permission: {permission}</p>
      {permission === "denied" && (
        <p>Please enable location permissions in your browser settings.</p>
      )}
    </div>
  );
}
```

### Error Handling

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

function RobustLocation() {
  const { position, error, getCurrentPosition } = useGeolocation({
    immediate: false,
    onError: (err) => {
      console.error("Geolocation error:", err.code, err.message);

      if (err.code === "PERMISSION_DENIED") {
        alert("Please allow location access");
      } else if (err.code === "TIMEOUT") {
        alert("Location request timed out. Please try again.");
      }
    },
  });

  return (
    <div>
      <button onClick={getCurrentPosition}>Get Location</button>

      {error && (
        <div className="error">
          <p>Error: {error.code}</p>
          <p>{error.message}</p>
        </div>
      )}

      {position && (
        <p>
          {position.coords.latitude}, {position.coords.longitude}
        </p>
      )}
    </div>
  );
}
```

### Auto-Watch Mode

```tsx
import { useGeolocation } from "@usefy/use-geolocation";

function AutoTracking() {
  const { position, clearWatch } = useGeolocation({
    watch: true, // Automatically start watching on mount
    immediate: false,
  });

  return (
    <div>
      <p>Auto-tracking is active</p>
      <button onClick={clearWatch}>Stop</button>

      {position && (
        <p>
          {position.coords.latitude.toFixed(6)},{" "}
          {position.coords.longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript and exports comprehensive type definitions.

```tsx
import {
  useGeolocation,
  type UseGeolocationOptions,
  type UseGeolocationReturn,
  type GeoPosition,
  type GeolocationError,
  type PermissionState,
} from "@usefy/use-geolocation";

// Full type inference
const geolocation: UseGeolocationReturn = useGeolocation({
  enableHighAccuracy: true,
  timeout: 10000,
  onSuccess: (position: GeoPosition) => {
    console.log("Got position:", position);
  },
  onError: (error: GeolocationError) => {
    console.error("Error:", error.code, error.message);
  },
});

// Permission state is typed as union
const permission: PermissionState = geolocation.permission;
// "prompt" | "granted" | "denied" | "unavailable"
```

---

## Performance

- **Stable Function References** — All control functions are memoized with `useCallback`
- **Smart Re-renders** — Only re-renders when position, loading, or error state changes
- **Automatic Cleanup** — Watch is automatically cleared on unmount
- **Options Auto-Restart** — Watch automatically restarts when options change

```tsx
const { getCurrentPosition, watchPosition, clearWatch } = useGeolocation();

// These references remain stable across renders
useEffect(() => {
  // Safe to use as dependencies
}, [getCurrentPosition, watchPosition, clearWatch]);
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-geolocation/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

<details>
<summary><strong>Initialization Tests</strong></summary>

- Initialize with correct default state
- Detect unsupported environment
- Set loading state when immediate is true

</details>

<details>
<summary><strong>getCurrentPosition Tests</strong></summary>

- Get current position successfully
- Handle PERMISSION_DENIED error
- Handle POSITION_UNAVAILABLE error
- Handle TIMEOUT error
- Handle NOT_SUPPORTED error when geolocation unavailable

</details>

<details>
<summary><strong>watchPosition Tests</strong></summary>

- Watch position and receive updates
- Clear watch on clearWatch call
- Clear existing watch before starting new one
- Call onPositionChange callback on updates

</details>

<details>
<summary><strong>Permission State Tests</strong></summary>

- Track permission state changes
- Set permission to unavailable when permissions API fails
- Call onPermissionChange callback when permission changes

</details>

<details>
<summary><strong>Utility Functions Tests</strong></summary>

- Calculate distance correctly using Haversine formula
- Return null when no position available for distanceFrom
- Calculate bearing correctly
- Return null when no position available for bearingTo

</details>

<details>
<summary><strong>Options Tests</strong></summary>

- Use custom options (enableHighAccuracy, timeout, maximumAge)
- Use default timeout of 30000ms
- Call onSuccess callback
- Call onError callback

</details>

<details>
<summary><strong>Auto-Watch and Immediate Tests</strong></summary>

- Start watching immediately when watch: true
- Get position immediately when immediate: true
- Not fetch position when immediate: false

</details>

<details>
<summary><strong>Options Auto-Restart Tests</strong></summary>

- Restart watch when enableHighAccuracy changes
- Restart watch when timeout changes
- Not restart watch when watch is false

</details>

<details>
<summary><strong>Function Reference Stability Tests</strong></summary>

- Maintain stable function references across renders
- Update distanceFrom and bearingTo when position changes

</details>

<details>
<summary><strong>Cleanup Tests</strong></summary>

- Clear watch on unmount
- Clear watch multiple times safely

</details>

---

## Browser Compatibility

This hook uses the [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API), which is supported in:

- ✅ Chrome 5+
- ✅ Firefox 3.5+
- ✅ Safari 5+
- ✅ Edge 12+
- ✅ Opera 10.6+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Note:** HTTPS is required for geolocation in most modern browsers (except localhost).

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
