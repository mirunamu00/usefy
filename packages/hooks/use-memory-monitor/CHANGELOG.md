# @usefy/use-memory-monitor

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
