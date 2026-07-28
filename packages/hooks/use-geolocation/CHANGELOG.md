# @usefy/use-geolocation

## 1.1.0

## 1.0.0

### Major Changes

- 8924240: usefy 1.0.0 — first stable release.

  All `@usefy/*` packages graduate to a stable **1.0.0** together (they share a
  fixed-version group). No API changes are required by this bump — it marks the
  public API as stable and ready for production semver guarantees.

  Also adds a `homepage` field to every published package, pointing at its page on
  the docs site (https://usefy-web.vercel.app) so the npm listing links straight
  to live docs.

## 0.25.1

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

### Patch Changes

- ba7c5da: Fix incorrect npm package-provenance metadata. The `repository.directory` field pointed at non-existent paths for these packages (e.g. `packages/use-toggle` instead of `packages/hooks/use-toggle`, and the `@usefy/hooks` umbrella pointed at `packages/usefy`), which broke the "source" link on each npm package page. Each now points at its real location in the monorepo. Additionally, `@usefy/memory-monitor` had its `repository.url`, `bugs.url`, and `homepage` pointing at a non-existent `usefy/usefy` GitHub org and a wrong `packages/components/...` path — these are corrected to `mirunamu00/usefy` and `packages/kits/memory-monitor`. Metadata-only; no code or runtime change.

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.2

## 0.12.1

## 0.12.0

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.0

## 0.4.0

## 0.3.1

## 0.3.0

## 0.2.6

## 0.2.5

## 0.2.4

## 0.2.3

## 0.2.2

## 0.2.1

## 0.2.0

## 0.1.5

## 0.1.4

## 0.1.3

## 0.1.2

## 0.1.1

## 0.0.38

## 0.0.37

## 0.0.36

## 0.0.35

## 0.0.34

## 0.0.33

## 0.0.32

## 0.0.31

## 0.0.30

## 0.0.29

### Patch Changes

- 07dd97e: update README.md

## 0.0.28

### Patch Changes

- 6b8201c: # Changelog Summary - @usefy/use-geolocation

  ## 🎉 Initial Release

  ### ✨ Features

  - **Core Hook Implementation**

    - Added `useGeolocation` hook for accessing device geolocation API
    - Support for one-time position retrieval via `getCurrentPosition()`
    - Real-time position tracking via `watchPosition()` and `clearWatch()`
    - Automatic cleanup on component unmount

  - **Position Tracking**

    - Real-time position updates with `watch` option
    - Manual control with `immediate: false` option
    - Position state management with loading and error states
    - Support for high accuracy mode (GPS) with `enableHighAccuracy` option

  - **Distance & Bearing Utilities**

    - `distanceFrom()` function using Haversine formula for accurate distance calculation
    - `bearingTo()` function for calculating direction/bearing between coordinates
    - Returns distance in meters and bearing in degrees (0-360)

  - **Permission Management**

    - Permission state tracking (`prompt`, `granted`, `denied`, `unavailable`)
    - Automatic permission status monitoring via Permissions API
    - `onPermissionChange` callback for permission state changes

  - **Error Handling**

    - Comprehensive error handling with typed error codes:
      - `PERMISSION_DENIED` - User denied geolocation permission
      - `POSITION_UNAVAILABLE` - Position information unavailable
      - `TIMEOUT` - Position request timed out
      - `NOT_SUPPORTED` - Geolocation not supported in environment
    - `onError` callback for error handling
    - `onSuccess` callback for successful position retrieval
    - `onPositionChange` callback for position updates during watch mode

  - **Configuration Options**

    - `enableHighAccuracy` - Enable GPS mode (default: `false`)
    - `maximumAge` - Maximum age of cached position in milliseconds (default: `0`)
    - `timeout` - Timeout for position request in milliseconds (default: `30000`)
    - `watch` - Automatically start watching on mount (default: `false`)
    - `immediate` - Get position immediately on mount (default: `true`)

  - **TypeScript Support**

    - Full TypeScript definitions with exported types
    - Type-safe error codes and permission states
    - Comprehensive type definitions for `GeoPosition`, `GeoCoordinates`, and `GeolocationError`

  - **SSR Compatibility**
    - Safe checks for `navigator` and `geolocation` availability
    - Graceful degradation in non-browser environments

  ### 📚 Documentation

  - **README.md**

    - Comprehensive API reference with parameter and option tables
    - 9 practical usage examples covering all features
    - TypeScript usage examples
    - Browser compatibility information
    - Performance optimization notes

  - **Storybook Stories**
    - Basic usage demo with automatic position fetching
    - Manual control demo with start/stop tracking buttons
    - Real-time tracking demo with live position updates
    - Distance calculation demo showing distances to famous cities
    - High accuracy mode comparison demo
    - Interactive examples with test coverage

  ### 🧪 Testing

  - **Comprehensive Test Suite** (758 lines, ~90% coverage)
    - Initialization tests
    - `getCurrentPosition` tests with all error scenarios
    - `watchPosition` tests with position update handling
    - Permission state tracking tests
    - Distance and bearing calculation tests
    - Options and callback tests
    - Auto-watch and immediate mode tests
    - Options auto-restart tests
    - Function reference stability tests
    - Cleanup and unmount tests

  ### 🔗 Integration

  - **Main Package Integration**
    - Added `@usefy/use-geolocation` to main `@usefy/usefy` package
    - Updated main README.md with useGeolocation documentation
    - Added to packages table with npm badges and coverage information
    - Added Location category in Features section

  ### 📦 Package Details

  - **Package**: `@usefy/use-geolocation`
  - **Version**: `0.0.1`
  - **Zero Dependencies**: Pure React implementation
  - **Peer Dependencies**: React 18 or 19
  - **Bundle Size**: Optimized with tree-shaking support

  ### 🎯 Use Cases

  Perfect for:

  - Location-based applications
  - Maps and navigation apps
  - Distance tracking and geofencing
  - Real-time location sharing
  - Location-aware features
  - GPS tracking applications
