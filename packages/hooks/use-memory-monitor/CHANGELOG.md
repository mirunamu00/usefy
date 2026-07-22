# @usefy/use-memory-monitor

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

### Patch Changes

- fd66eb7: Fix unlimited duration recording, timer display, Re-record button, dark mode support, and update Storybook paths from Components to Kits

## 0.1.3

## 0.1.2

## 0.1.1

### Patch Changes

- 1db7b09: feat(memory-monitor): Add dynamic historySize control in Settings tab

  ### Changes

  **@usefy/use-memory-monitor**

  - Added `resize()` method to `CircularBuffer` for dynamic capacity changes
  - When shrinking buffer, keeps most recent items and discards oldest
  - Hook now detects `historySize` prop changes and resizes buffer accordingly via `useEffect`

  **@usefy/memory-monitor**

  - Added `historySize` to `PanelSettings` type with constraints (10-200 samples, default: 50)
  - Added `HISTORY_SIZE_LIMITS` constant for min/max/default values
  - Added "Memory Trend" section in Settings tab with History Size slider
  - Settings are persisted to localStorage automatically

  **ThresholdSlider component**

  - Added `suffix` prop for customizable value display (e.g., "50 samples" instead of "50%")

## 0.0.38

## 0.0.37

## 0.0.36

## 0.0.35

### Patch Changes

- 30a0467: update README.md

## 0.0.34

### Patch Changes

- dafb0af: ### Features

  - **Improved `requestGC` function**: Now attempts to call `globalThis.gc()` directly when available (Chrome with `--expose-gc` flag or Node.js), falling back to memory pressure hint if not available. Added descriptive console logging in dev mode.

  ### Documentation

  - Added `requestGC` to API Reference table in README
  - Added "Garbage Collection Request" section with usage example and platform-specific commands for enabling direct GC in Chrome (Windows/macOS/Linux)

  ### Bug Fixes

  - **Fixed RadialBarChart gauge accumulation bug in Storybook**: The mini gauge in the Usage card was incorrectly filling to 100% over time. Added `PolarAngleAxis` with `domain={[0, 100]}` to properly constrain the value range, ensuring the gauge accurately reflects the actual usage percentage.

## 0.0.33

### Patch Changes

- 950197f: update README.md

## 0.0.32

### Patch Changes

- 67af59f: add useMemoryMonitor
