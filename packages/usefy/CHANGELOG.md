# @usefy/usefy

## 0.0.31

### Patch Changes

- 881391c: add useSignal
- Updated dependencies [881391c]
  - @usefy/use-signal@0.0.31
  - @usefy/use-click-any-where@0.0.31
  - @usefy/use-copy-to-clipboard@0.0.31
  - @usefy/use-counter@0.0.31
  - @usefy/use-debounce@0.0.31
  - @usefy/use-debounce-callback@0.0.31
  - @usefy/use-event-listener@0.0.31
  - @usefy/use-geolocation@0.0.31
  - @usefy/use-init@0.0.31
  - @usefy/use-intersection-observer@0.0.31
  - @usefy/use-local-storage@0.0.31
  - @usefy/use-on-click-outside@0.0.31
  - @usefy/use-session-storage@0.0.31
  - @usefy/use-throttle@0.0.31
  - @usefy/use-throttle-callback@0.0.31
  - @usefy/use-timer@0.0.31
  - @usefy/use-toggle@0.0.31
  - @usefy/use-unmount@0.0.31

## 0.0.30

### Patch Changes

- 09c2151: update READEME.md
  - @usefy/use-click-any-where@0.0.30
  - @usefy/use-copy-to-clipboard@0.0.30
  - @usefy/use-counter@0.0.30
  - @usefy/use-debounce@0.0.30
  - @usefy/use-debounce-callback@0.0.30
  - @usefy/use-event-listener@0.0.30
  - @usefy/use-geolocation@0.0.30
  - @usefy/use-init@0.0.30
  - @usefy/use-intersection-observer@0.0.30
  - @usefy/use-local-storage@0.0.30
  - @usefy/use-on-click-outside@0.0.30
  - @usefy/use-session-storage@0.0.30
  - @usefy/use-throttle@0.0.30
  - @usefy/use-throttle-callback@0.0.30
  - @usefy/use-timer@0.0.30
  - @usefy/use-toggle@0.0.30
  - @usefy/use-unmount@0.0.30

## 0.0.29

### Patch Changes

- 07dd97e: update README.md
- Updated dependencies [07dd97e]
- Updated dependencies [9a1d3df]
  - @usefy/use-click-any-where@0.0.29
  - @usefy/use-copy-to-clipboard@0.0.29
  - @usefy/use-counter@0.0.29
  - @usefy/use-debounce@0.0.29
  - @usefy/use-debounce-callback@0.0.29
  - @usefy/use-event-listener@0.0.29
  - @usefy/use-geolocation@0.0.29
  - @usefy/use-init@0.0.29
  - @usefy/use-intersection-observer@0.0.29
  - @usefy/use-local-storage@0.0.29
  - @usefy/use-on-click-outside@0.0.29
  - @usefy/use-session-storage@0.0.29
  - @usefy/use-throttle@0.0.29
  - @usefy/use-throttle-callback@0.0.29
  - @usefy/use-timer@0.0.29
  - @usefy/use-toggle@0.0.29
  - @usefy/use-unmount@0.0.29

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

- Updated dependencies [6b8201c]
  - @usefy/use-geolocation@0.0.28
  - @usefy/use-click-any-where@0.0.28
  - @usefy/use-copy-to-clipboard@0.0.28
  - @usefy/use-counter@0.0.28
  - @usefy/use-debounce@0.0.28
  - @usefy/use-debounce-callback@0.0.28
  - @usefy/use-event-listener@0.0.28
  - @usefy/use-init@0.0.28
  - @usefy/use-local-storage@0.0.28
  - @usefy/use-on-click-outside@0.0.28
  - @usefy/use-session-storage@0.0.28
  - @usefy/use-throttle@0.0.28
  - @usefy/use-throttle-callback@0.0.28
  - @usefy/use-timer@0.0.28
  - @usefy/use-toggle@0.0.28
  - @usefy/use-unmount@0.0.28

## 0.0.27

### Patch Changes

- ac08714: update README.md
- Updated dependencies [ac08714]
  - @usefy/use-timer@0.0.27
  - @usefy/use-click-any-where@0.0.27
  - @usefy/use-copy-to-clipboard@0.0.27
  - @usefy/use-counter@0.0.27
  - @usefy/use-debounce@0.0.27
  - @usefy/use-debounce-callback@0.0.27
  - @usefy/use-event-listener@0.0.27
  - @usefy/use-init@0.0.27
  - @usefy/use-local-storage@0.0.27
  - @usefy/use-on-click-outside@0.0.27
  - @usefy/use-session-storage@0.0.27
  - @usefy/use-throttle@0.0.27
  - @usefy/use-throttle-callback@0.0.27
  - @usefy/use-toggle@0.0.27
  - @usefy/use-unmount@0.0.27

## 0.0.26

### Patch Changes

- e7548c1: Update repository references from geon0529 to mirunamu00 in documentation and package files
- Updated dependencies [e7548c1]
  - @usefy/use-click-any-where@0.0.26
  - @usefy/use-copy-to-clipboard@0.0.26
  - @usefy/use-counter@0.0.26
  - @usefy/use-debounce@0.0.26
  - @usefy/use-debounce-callback@0.0.26
  - @usefy/use-event-listener@0.0.26
  - @usefy/use-init@0.0.26
  - @usefy/use-local-storage@0.0.26
  - @usefy/use-on-click-outside@0.0.26
  - @usefy/use-session-storage@0.0.26
  - @usefy/use-throttle@0.0.26
  - @usefy/use-throttle-callback@0.0.26
  - @usefy/use-timer@0.0.26
  - @usefy/use-toggle@0.0.26
  - @usefy/use-unmount@0.0.26

## 0.0.25

### Patch Changes

- c908a3b: update README.md
- Updated dependencies [c908a3b]
  - @usefy/use-init@0.0.25
  - @usefy/use-click-any-where@0.0.25
  - @usefy/use-copy-to-clipboard@0.0.25
  - @usefy/use-counter@0.0.25
  - @usefy/use-debounce@0.0.25
  - @usefy/use-debounce-callback@0.0.25
  - @usefy/use-event-listener@0.0.25
  - @usefy/use-local-storage@0.0.25
  - @usefy/use-on-click-outside@0.0.25
  - @usefy/use-session-storage@0.0.25
  - @usefy/use-throttle@0.0.25
  - @usefy/use-throttle-callback@0.0.25
  - @usefy/use-timer@0.0.25
  - @usefy/use-toggle@0.0.25
  - @usefy/use-unmount@0.0.25

## 0.0.24

### Patch Changes

- Updated dependencies [6a255f0]
  - @usefy/use-init@0.0.24
  - @usefy/use-click-any-where@0.0.24
  - @usefy/use-copy-to-clipboard@0.0.24
  - @usefy/use-counter@0.0.24
  - @usefy/use-debounce@0.0.24
  - @usefy/use-debounce-callback@0.0.24
  - @usefy/use-event-listener@0.0.24
  - @usefy/use-local-storage@0.0.24
  - @usefy/use-on-click-outside@0.0.24
  - @usefy/use-session-storage@0.0.24
  - @usefy/use-throttle@0.0.24
  - @usefy/use-throttle-callback@0.0.24
  - @usefy/use-timer@0.0.24
  - @usefy/use-toggle@0.0.24
  - @usefy/use-unmount@0.0.24

## 0.0.23

### Patch Changes

- 10bb7e8: update READEM.md
- Updated dependencies [10bb7e8]
  - @usefy/use-click-any-where@0.0.23
  - @usefy/use-copy-to-clipboard@0.0.23
  - @usefy/use-counter@0.0.23
  - @usefy/use-debounce@0.0.23
  - @usefy/use-debounce-callback@0.0.23
  - @usefy/use-event-listener@0.0.23
  - @usefy/use-local-storage@0.0.23
  - @usefy/use-on-click-outside@0.0.23
  - @usefy/use-session-storage@0.0.23
  - @usefy/use-throttle@0.0.23
  - @usefy/use-throttle-callback@0.0.23
  - @usefy/use-timer@0.0.23
  - @usefy/use-toggle@0.0.23
  - @usefy/use-unmount@0.0.23

## 0.0.22

### Patch Changes

- b92d737: update README.md
- Updated dependencies [b92d737]
- Updated dependencies [4fb2093]
  - @usefy/use-click-any-where@0.0.22
  - @usefy/use-copy-to-clipboard@0.0.22
  - @usefy/use-counter@0.0.22
  - @usefy/use-debounce@0.0.22
  - @usefy/use-debounce-callback@0.0.22
  - @usefy/use-event-listener@0.0.22
  - @usefy/use-local-storage@0.0.22
  - @usefy/use-on-click-outside@0.0.22
  - @usefy/use-session-storage@0.0.22
  - @usefy/use-throttle@0.0.22
  - @usefy/use-throttle-callback@0.0.22
  - @usefy/use-timer@0.0.22
  - @usefy/use-toggle@0.0.22
  - @usefy/use-unmount@0.0.22

## 0.0.21

### Patch Changes

- 85acb01: feat: refactor useLocalStorage and useSessionStorage to use useSyncExternalStore for automatic same-tab component synchronization
- e4ee257: update README.md
- Updated dependencies [85acb01]
- Updated dependencies [e4ee257]
  - @usefy/use-local-storage@0.0.21
  - @usefy/use-session-storage@0.0.21
  - @usefy/use-click-any-where@0.0.21
  - @usefy/use-copy-to-clipboard@0.0.21
  - @usefy/use-counter@0.0.21
  - @usefy/use-debounce@0.0.21
  - @usefy/use-debounce-callback@0.0.21
  - @usefy/use-event-listener@0.0.21
  - @usefy/use-on-click-outside@0.0.21
  - @usefy/use-throttle@0.0.21
  - @usefy/use-throttle-callback@0.0.21
  - @usefy/use-timer@0.0.21
  - @usefy/use-toggle@0.0.21
  - @usefy/use-unmount@0.0.21

## 0.0.20

### Patch Changes

- Updated dependencies [6a855d2]
- Updated dependencies [17026ce]
  - @usefy/use-timer@0.0.20
  - @usefy/use-unmount@0.0.20
  - @usefy/use-click-any-where@0.0.20
  - @usefy/use-copy-to-clipboard@0.0.20
  - @usefy/use-counter@0.0.20
  - @usefy/use-debounce@0.0.20
  - @usefy/use-debounce-callback@0.0.20
  - @usefy/use-event-listener@0.0.20
  - @usefy/use-local-storage@0.0.20
  - @usefy/use-on-click-outside@0.0.20
  - @usefy/use-session-storage@0.0.20
  - @usefy/use-throttle@0.0.20
  - @usefy/use-throttle-callback@0.0.20
  - @usefy/use-toggle@0.0.20

## 0.0.19

### Patch Changes

- cc15dd3: update README.md
- Updated dependencies [d97addd]
- Updated dependencies [cc15dd3]
  - @usefy/use-timer@0.0.19
  - @usefy/use-click-any-where@0.0.19
  - @usefy/use-copy-to-clipboard@0.0.19
  - @usefy/use-counter@0.0.19
  - @usefy/use-debounce@0.0.19
  - @usefy/use-debounce-callback@0.0.19
  - @usefy/use-event-listener@0.0.19
  - @usefy/use-local-storage@0.0.19
  - @usefy/use-on-click-outside@0.0.19
  - @usefy/use-session-storage@0.0.19
  - @usefy/use-throttle@0.0.19
  - @usefy/use-throttle-callback@0.0.19
  - @usefy/use-toggle@0.0.19

## 0.0.18

### Patch Changes

- 67c32d7: update README.md
- dc5cb67: add logo
- Updated dependencies [dc5cb67]
  - @usefy/use-click-any-where@0.0.18
  - @usefy/use-copy-to-clipboard@0.0.18
  - @usefy/use-counter@0.0.18
  - @usefy/use-debounce@0.0.18
  - @usefy/use-debounce-callback@0.0.18
  - @usefy/use-event-listener@0.0.18
  - @usefy/use-local-storage@0.0.18
  - @usefy/use-on-click-outside@0.0.18
  - @usefy/use-session-storage@0.0.18
  - @usefy/use-throttle@0.0.18
  - @usefy/use-throttle-callback@0.0.18
  - @usefy/use-toggle@0.0.18

## 0.0.17

### Patch Changes

- d1f9cec: update README.md
  - @usefy/use-click-any-where@0.0.17
  - @usefy/use-copy-to-clipboard@0.0.17
  - @usefy/use-counter@0.0.17
  - @usefy/use-debounce@0.0.17
  - @usefy/use-debounce-callback@0.0.17
  - @usefy/use-event-listener@0.0.17
  - @usefy/use-local-storage@0.0.17
  - @usefy/use-on-click-outside@0.0.17
  - @usefy/use-session-storage@0.0.17
  - @usefy/use-throttle@0.0.17
  - @usefy/use-throttle-callback@0.0.17
  - @usefy/use-toggle@0.0.17

## 0.0.16

### Patch Changes

- Updated dependencies [40091df]
  - @usefy/use-event-listener@0.0.16
  - @usefy/use-click-any-where@0.0.16
  - @usefy/use-copy-to-clipboard@0.0.16
  - @usefy/use-counter@0.0.16
  - @usefy/use-debounce@0.0.16
  - @usefy/use-debounce-callback@0.0.16
  - @usefy/use-local-storage@0.0.16
  - @usefy/use-on-click-outside@0.0.16
  - @usefy/use-session-storage@0.0.16
  - @usefy/use-throttle@0.0.16
  - @usefy/use-throttle-callback@0.0.16
  - @usefy/use-toggle@0.0.16

## 0.0.15

### Patch Changes

- e03ef9b: update README.md
- Updated dependencies [e113f40]
- Updated dependencies [e03ef9b]
  - @usefy/use-on-click-outside@0.0.15
  - @usefy/use-click-any-where@0.0.15
  - @usefy/use-copy-to-clipboard@0.0.15
  - @usefy/use-counter@0.0.15
  - @usefy/use-debounce@0.0.15
  - @usefy/use-debounce-callback@0.0.15
  - @usefy/use-local-storage@0.0.15
  - @usefy/use-session-storage@0.0.15
  - @usefy/use-throttle@0.0.15
  - @usefy/use-throttle-callback@0.0.15
  - @usefy/use-toggle@0.0.15

## 0.0.14

### Patch Changes

- 64f17e0: update README.md
  - @usefy/use-click-any-where@0.0.14
  - @usefy/use-copy-to-clipboard@0.0.14
  - @usefy/use-counter@0.0.14
  - @usefy/use-debounce@0.0.14
  - @usefy/use-debounce-callback@0.0.14
  - @usefy/use-local-storage@0.0.14
  - @usefy/use-session-storage@0.0.14
  - @usefy/use-throttle@0.0.14
  - @usefy/use-throttle-callback@0.0.14
  - @usefy/use-toggle@0.0.14

## 0.0.13

### Patch Changes

- 8ee0b64: update README.md
  - @usefy/use-click-any-where@0.0.13
  - @usefy/use-copy-to-clipboard@0.0.13
  - @usefy/use-counter@0.0.13
  - @usefy/use-debounce@0.0.13
  - @usefy/use-debounce-callback@0.0.13
  - @usefy/use-local-storage@0.0.13
  - @usefy/use-session-storage@0.0.13
  - @usefy/use-throttle@0.0.13
  - @usefy/use-throttle-callback@0.0.13
  - @usefy/use-toggle@0.0.13

## 0.0.12

### Patch Changes

- 224c3e1: update README.md
- Updated dependencies [224c3e1]
  - @usefy/use-click-any-where@0.0.12
  - @usefy/use-copy-to-clipboard@0.0.12
  - @usefy/use-counter@0.0.12
  - @usefy/use-debounce@0.0.12
  - @usefy/use-debounce-callback@0.0.12
  - @usefy/use-local-storage@0.0.12
  - @usefy/use-session-storage@0.0.12
  - @usefy/use-throttle@0.0.12
  - @usefy/use-throttle-callback@0.0.12
  - @usefy/use-toggle@0.0.12

## 0.0.11

### Patch Changes

- 555f2dc: update README.md
- 5f7403c: update README.md
- Updated dependencies [555f2dc]
- Updated dependencies [5f7403c]
  - @usefy/use-click-any-where@0.0.11
  - @usefy/use-copy-to-clipboard@0.0.11
  - @usefy/use-counter@0.0.11
  - @usefy/use-debounce@0.0.11
  - @usefy/use-debounce-callback@0.0.11
  - @usefy/use-local-storage@0.0.11
  - @usefy/use-session-storage@0.0.11
  - @usefy/use-throttle@0.0.11
  - @usefy/use-throttle-callback@0.0.11
  - @usefy/use-toggle@0.0.11

## 0.0.10

### Patch Changes

- 6e70220: update README.md
- Updated dependencies [6e70220]
  - @usefy/use-click-any-where@0.0.10
  - @usefy/use-copy-to-clipboard@0.0.10
  - @usefy/use-counter@0.0.10
  - @usefy/use-debounce@0.0.10
  - @usefy/use-debounce-callback@0.0.10
  - @usefy/use-local-storage@0.0.10
  - @usefy/use-session-storage@0.0.10
  - @usefy/use-throttle@0.0.10
  - @usefy/use-throttle-callback@0.0.10
  - @usefy/use-toggle@0.0.10

## 0.0.9

### Patch Changes

- 05a8be8: update README.md
- Updated dependencies [05a8be8]
  - @usefy/use-click-any-where@0.0.9
  - @usefy/use-copy-to-clipboard@0.0.9
  - @usefy/use-counter@0.0.9
  - @usefy/use-debounce@0.0.9
  - @usefy/use-debounce-callback@0.0.9
  - @usefy/use-local-storage@0.0.9
  - @usefy/use-session-storage@0.0.9
  - @usefy/use-throttle@0.0.9
  - @usefy/use-throttle-callback@0.0.9
  - @usefy/use-toggle@0.0.9

## 0.0.8

### Patch Changes

- Updated dependencies [d32cd58]
  - @usefy/use-click-any-where@0.0.8
  - @usefy/use-copy-to-clipboard@0.0.8
  - @usefy/use-counter@0.0.8
  - @usefy/use-debounce@0.0.8
  - @usefy/use-debounce-callback@0.0.8
  - @usefy/use-local-storage@0.0.8
  - @usefy/use-session-storage@0.0.8
  - @usefy/use-throttle@0.0.8
  - @usefy/use-throttle-callback@0.0.8
  - @usefy/use-toggle@0.0.8

## 0.0.7

### Patch Changes

- Updated dependencies [f109dfc]
  - @usefy/use-copy-to-clipboard@0.0.7
  - @usefy/use-counter@0.0.7
  - @usefy/use-debounce@0.0.7
  - @usefy/use-debounce-callback@0.0.7
  - @usefy/use-local-storage@0.0.7
  - @usefy/use-session-storage@0.0.7
  - @usefy/use-throttle@0.0.7
  - @usefy/use-throttle-callback@0.0.7
  - @usefy/use-toggle@0.0.7

## 0.0.6

### Patch Changes

- Reorder exports to put types first for better TypeScript compatibility
- Updated dependencies
  - @usefy/use-counter@0.0.6
  - @usefy/use-debounce@0.0.6
  - @usefy/use-debounce-callback@0.0.6
  - @usefy/use-local-storage@0.0.6
  - @usefy/use-session-storage@0.0.6
  - @usefy/use-throttle@0.0.6
  - @usefy/use-throttle-callback@0.0.6
  - @usefy/use-toggle@0.0.6

## 0.0.5

### Patch Changes

- Simplify exports for better IDE support
- Updated dependencies
  - @usefy/use-counter@0.0.5
  - @usefy/use-debounce@0.0.5
  - @usefy/use-debounce-callback@0.0.5
  - @usefy/use-local-storage@0.0.5
  - @usefy/use-session-storage@0.0.5
  - @usefy/use-throttle@0.0.5
  - @usefy/use-throttle-callback@0.0.5
  - @usefy/use-toggle@0.0.5

## 0.0.4

### Patch Changes

- Improve TypeScript module resolution with explicit exports types and typesVersions
- Updated dependencies
  - @usefy/use-counter@0.0.4
  - @usefy/use-debounce@0.0.4
  - @usefy/use-debounce-callback@0.0.4
  - @usefy/use-local-storage@0.0.4
  - @usefy/use-session-storage@0.0.4
  - @usefy/use-throttle@0.0.4
  - @usefy/use-throttle-callback@0.0.4
  - @usefy/use-toggle@0.0.4

## 0.0.3

### Patch Changes

- Improve JSDoc comments
- Updated dependencies
  - @usefy/use-debounce@0.0.3
  - @usefy/use-throttle@0.0.3
  - @usefy/use-toggle@0.0.3
  - @usefy/use-counter@0.0.3
  - @usefy/use-debounce-callback@0.0.3
  - @usefy/use-local-storage@0.0.3
  - @usefy/use-session-storage@0.0.3
  - @usefy/use-throttle-callback@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [0664f3b]
  - @usefy/use-counter@0.0.2
  - @usefy/use-debounce@0.0.2
  - @usefy/use-debounce-callback@0.0.2
  - @usefy/use-local-storage@0.0.2
  - @usefy/use-session-storage@0.0.2
  - @usefy/use-throttle@0.0.2
  - @usefy/use-throttle-callback@0.0.2
  - @usefy/use-toggle@0.0.2
