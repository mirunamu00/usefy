# @usefy/memory-monitor

## 0.23.0

### Patch Changes

- @usefy/use-memory-monitor@0.23.0

## 0.22.0

### Patch Changes

- @usefy/use-memory-monitor@0.22.0

## 0.21.1

### Patch Changes

- 2e5ec3f: Restructure: remove the `@usefy/kits` umbrella package and flatten standalone
  components to the top level of `packages/`.

  Feature components are independent and share no common surface, so bundling them
  behind a single `@usefy/kits` install was not meaningful. The umbrella is removed;
  each component is published and installed on its own (e.g. `@usefy/memory-monitor`).

  `@usefy/memory-monitor` moves from `packages/kits/memory-monitor` to
  `packages/memory-monitor`; its `repository.directory` and `homepage` metadata are
  updated to the new path. No runtime/API changes.

  - @usefy/use-memory-monitor@0.21.1

## 0.21.0

### Patch Changes

- ba7c5da: Fix incorrect npm package-provenance metadata. The `repository.directory` field pointed at non-existent paths for these packages (e.g. `packages/use-toggle` instead of `packages/hooks/use-toggle`, and the `@usefy/hooks` umbrella pointed at `packages/usefy`), which broke the "source" link on each npm package page. Each now points at its real location in the monorepo. Additionally, `@usefy/memory-monitor` had its `repository.url`, `bugs.url`, and `homepage` pointing at a non-existent `usefy/usefy` GitHub org and a wrong `packages/components/...` path — these are corrected to `mirunamu00/usefy` and `packages/kits/memory-monitor`. Metadata-only; no code or runtime change.
- Updated dependencies [ba7c5da]
  - @usefy/use-memory-monitor@0.21.0

## 0.20.0

### Patch Changes

- @usefy/use-memory-monitor@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-memory-monitor@0.19.0

## 0.18.0

### Patch Changes

- @usefy/use-memory-monitor@0.18.0

## 0.17.0

### Patch Changes

- @usefy/use-memory-monitor@0.17.0

## 0.16.0

### Patch Changes

- @usefy/use-memory-monitor@0.16.0

## 0.15.0

### Patch Changes

- @usefy/use-memory-monitor@0.15.0

## 0.14.0

### Patch Changes

- @usefy/use-memory-monitor@0.14.0

## 0.13.0

### Patch Changes

- @usefy/use-memory-monitor@0.13.0

## 0.12.2

### Patch Changes

- @usefy/use-memory-monitor@0.12.2

## 0.12.1

### Patch Changes

- @usefy/use-memory-monitor@0.12.1

## 0.12.0

### Patch Changes

- @usefy/use-memory-monitor@0.12.0

## 0.11.0

### Patch Changes

- @usefy/use-memory-monitor@0.11.0

## 0.10.0

### Patch Changes

- @usefy/use-memory-monitor@0.10.0

## 0.9.0

### Patch Changes

- @usefy/use-memory-monitor@0.9.0

## 0.8.0

### Patch Changes

- @usefy/use-memory-monitor@0.8.0

## 0.7.0

### Patch Changes

- @usefy/use-memory-monitor@0.7.0

## 0.6.0

### Patch Changes

- @usefy/use-memory-monitor@0.6.0

## 0.5.0

### Patch Changes

- @usefy/use-memory-monitor@0.5.0

## 0.4.0

### Patch Changes

- @usefy/use-memory-monitor@0.4.0

## 0.3.1

### Patch Changes

- @usefy/use-memory-monitor@0.3.1

## 0.3.0

### Patch Changes

- @usefy/use-memory-monitor@0.3.0

## 0.2.6

### Patch Changes

- @usefy/use-memory-monitor@0.2.6

## 0.2.5

### Patch Changes

- @usefy/use-memory-monitor@0.2.5

## 0.2.4

### Patch Changes

- @usefy/use-memory-monitor@0.2.4

## 0.2.3

### Patch Changes

- 779427c: update README.md
  - @usefy/use-memory-monitor@0.2.3

## 0.2.2

### Patch Changes

- 14def35: Fix HistoryChart tooltip showing duplicate labels

  - Fixed formatter to correctly check Area component's name prop instead of dataKey
  - Changed heapTotal label from "Total" to "Allocated" to clarify the difference
  - Tooltip now correctly displays "Used" (current heap usage) and "Allocated" (total heap size)

- 33b5de7: summary
- 7168031: summary
  - @usefy/use-memory-monitor@0.2.2

## 0.2.1

### Patch Changes

- 61401b4: Enhance PanelTrigger floating button visibility for warning and critical states

  - Warning state: amber/orange gradient background with pulse glow animation
  - Critical state: red gradient background with shake and intense glow animations
  - Each severity level now has distinct visual feedback to better capture user attention
  - @usefy/use-memory-monitor@0.2.1

## 0.2.0

### Minor Changes

- 0eb1277: feat(memory-monitor): add `mode="headless"` for production monitoring without UI

  ### New Feature

  Added `mode="headless"` option to MemoryMonitor component, enabling production monitoring without UI while keeping the same component API.

  ### Usage

  ```tsx
  <MemoryMonitor
    // Easy environment switching with same API
    mode={process.env.NODE_ENV === "development" ? "always" : "headless"}
    onWarning={(data) => analytics.track("memory_warning", data)}
    onCritical={(data) => alertService.send(data)}
    onLeakDetected={(analysis) => Sentry.captureMessage("Leak", analysis)}
  />
  ```

  ### Mode Comparison

  | Mode          |    UI     | Monitoring | Use Case             |
  | ------------- | :-------: | :--------: | -------------------- |
  | `development` | Dev only  |   Active   | Default for dev      |
  | `production`  | Prod only |   Active   | Debug in prod        |
  | `always`      |  Always   |   Active   | Demo/testing         |
  | `headless`    |   Never   |   Active   | Production callbacks |
  | `never`       |   Never   |  Disabled  | Completely off       |

  ### Benefits

  - **Same API**: No need to switch between component and hook for dev/prod
  - **Easy environment switching**: Just change the `mode` prop
  - **Callbacks work the same**: `onWarning`, `onCritical`, `onLeakDetected`, `onAutoGC`
  - **Backward compatible**: `useMemoryMonitorHeadless` hook is still available for advanced use cases

### Patch Changes

- @usefy/use-memory-monitor@0.2.0

## 0.1.5

### Patch Changes

- ac055e6: update README.md
- c6fd0e8: refactor(memory-monitor): migrate from Tailwind CSS to CSS Modules

  ### Changes

  - **Replaced Tailwind CSS with CSS Modules (SCSS)**

    - Migrated all components from Tailwind utility classes to `.module.scss` files
    - Created centralized design system with `_variables.scss` and `_mixins.scss`
    - Implemented custom esbuild plugin for SCSS module processing with class name scoping

  - **Build System Updates**

    - Added `sass`, `postcss`, and `autoprefixer` dependencies
    - Removed `tailwind-merge` and `clsx` (kept `clsx` for conditional class joining)
    - Custom CSS bundling in `tsup.config.ts` with automatic style injection

  - **Dark Mode Implementation**

    - Uses `:global(.dark)` selector pattern for theme-aware styles
    - Parent `.dark` class controls dark mode styling across all components

  - **CSS Output**
    - Standalone `dist/styles.css` file generated for manual import
    - CSS automatically injected into JS bundles for zero-config usage

  ### No Breaking Changes

  - All public APIs remain unchanged
  - Component props and behavior are identical
  - Drop-in replacement for existing installations
  - @usefy/use-memory-monitor@0.1.5

## 0.1.4

### Patch Changes

- fd66eb7: Fix unlimited duration recording, timer display, Re-record button, dark mode support, and update Storybook paths from Components to Kits
- Updated dependencies [fd66eb7]
  - @usefy/use-memory-monitor@0.1.4

## 0.1.3

### Patch Changes

- @usefy/use-memory-monitor@0.1.3

## 0.1.2

### Patch Changes

- 2a91a40: update README.md
  - @usefy/use-memory-monitor@0.1.2

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

- f691328: update README.md
- 3df45f8: update README.md
- Updated dependencies [1db7b09]
  - @usefy/use-memory-monitor@0.1.1
