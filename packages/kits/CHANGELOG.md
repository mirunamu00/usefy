# @usefy/components

## 0.2.6

### Patch Changes

- @usefy/memory-monitor@0.2.6

## 0.2.5

### Patch Changes

- @usefy/memory-monitor@0.2.5

## 0.2.4

### Patch Changes

- @usefy/memory-monitor@0.2.4

## 0.2.3

### Patch Changes

- 779427c: update README.md
- Updated dependencies [779427c]
  - @usefy/memory-monitor@0.2.3

## 0.2.2

### Patch Changes

- 33b5de7: summary
- 7168031: summary
- Updated dependencies [14def35]
- Updated dependencies [33b5de7]
- Updated dependencies [7168031]
  - @usefy/memory-monitor@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [61401b4]
  - @usefy/memory-monitor@0.2.1

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

- 17932a5: refactor(screen-recorder): migrate from Tailwind CSS to CSS Modules

  ### Changes

  - **Replaced Tailwind CSS with CSS Modules (SCSS)**

    - Migrated all components from Tailwind utility classes to `.module.scss` files
    - Created centralized design system with `_variables.scss` and `_mixins.scss`
    - Implemented custom esbuild plugin for SCSS module processing with class name scoping

  - **Build System Updates**

    - Added `sass` dependency for SCSS compilation
    - Removed `tailwind-merge` and `tailwindcss` dependencies
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

- Updated dependencies [0eb1277]
  - @usefy/memory-monitor@0.2.0

## 0.1.5

### Patch Changes

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

- Updated dependencies [ac055e6]
- Updated dependencies [c6fd0e8]
  - @usefy/memory-monitor@0.1.5

## 0.1.4

### Patch Changes

- fd66eb7: Fix unlimited duration recording, timer display, Re-record button, dark mode support, and update Storybook paths from Components to Kits
- Updated dependencies [fd66eb7]
  - @usefy/memory-monitor@0.1.4

## 0.1.3

### Patch Changes

- e2a04ba: ### @usefy/screen-recorder

  - Fix unlimited duration recording with `maxDuration={Infinity}`
  - Fix timer display showing "Infinity:NaN" for unlimited recordings
  - Fix Re-record button to immediately start new recording
  - Fix dark mode in preview modal (explicit theme prop support)
  - Add `theme` prop for explicit light/dark mode control

  ### @usefy/kits

  - Re-export ScreenRecorder with unlimited duration fix
  - @usefy/memory-monitor@0.1.3

## 0.1.2

### Patch Changes

- 2a91a40: update README.md
- Updated dependencies [2a91a40]
  - @usefy/memory-monitor@0.1.2

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
- Updated dependencies [f691328]
- Updated dependencies [3df45f8]
  - @usefy/memory-monitor@0.1.1

## 0.0.38

### Patch Changes

- a5586b3: init @usefy/components
- Updated dependencies [a5586b3]
  - @usefy/button@0.0.38
