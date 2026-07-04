# @usefy/usefy

## 0.15.0

### Minor Changes

- f439fb6: Add `@usefy/use-mutation-observer` — a React hook wrapping the DOM `MutationObserver` API to watch an element for child, attribute, and character-data mutations.

  - Callback-`ref` API (`const { ref } = useMutationObserver(options)`); attaching a node observes it, `null` disconnects.
  - Full `MutationObserverInit` surface (`childList`, `attributes`, `attributeFilter`, `attributeOldValue`, `characterData`, `characterDataOldValue`, `subtree`) with a sensible `childList: true` default so `observe()` never throws.
  - React via the `onMutation` callback, the reactive `records` state, or both; `updateState: false` for a zero-re-render callback-only mode.
  - `enabled` toggle plus manual `observe` / `disconnect` / `takeRecords` controls.
  - `onMutation` is stored in a ref so changing its identity never re-registers the observer; SSR-safe and StrictMode/concurrent-safe.
  - Re-exported from the `@usefy/hooks` umbrella.

### Patch Changes

- Updated dependencies [f439fb6]
  - @usefy/use-mutation-observer@0.15.0
  - @usefy/use-click-any-where@0.15.0
  - @usefy/use-controllable-state@0.15.0
  - @usefy/use-copy-to-clipboard@0.15.0
  - @usefy/use-counter@0.15.0
  - @usefy/use-dark-mode@0.15.0
  - @usefy/use-debounce@0.15.0
  - @usefy/use-debounce-callback@0.15.0
  - @usefy/use-disclosure@0.15.0
  - @usefy/use-document-title@0.15.0
  - @usefy/use-event-callback@0.15.0
  - @usefy/use-event-listener@0.15.0
  - @usefy/use-geolocation@0.15.0
  - @usefy/use-history-state@0.15.0
  - @usefy/use-hover@0.15.0
  - @usefy/use-init@0.15.0
  - @usefy/use-intersection-observer@0.15.0
  - @usefy/use-is-client@0.15.0
  - @usefy/use-is-first-render@0.15.0
  - @usefy/use-isomorphic-layout-effect@0.15.0
  - @usefy/use-key-press@0.15.0
  - @usefy/use-latest@0.15.0
  - @usefy/use-list@0.15.0
  - @usefy/use-local-storage@0.15.0
  - @usefy/use-map@0.15.0
  - @usefy/use-measure@0.15.0
  - @usefy/use-media-query@0.15.0
  - @usefy/use-memory-monitor@0.15.0
  - @usefy/use-merged-refs@0.15.0
  - @usefy/use-mount@0.15.0
  - @usefy/use-on-click-outside@0.15.0
  - @usefy/use-preferred-color-scheme@0.15.0
  - @usefy/use-previous@0.15.0
  - @usefy/use-queue@0.15.0
  - @usefy/use-reduced-motion@0.15.0
  - @usefy/use-session-storage@0.15.0
  - @usefy/use-set@0.15.0
  - @usefy/use-signal@0.15.0
  - @usefy/use-step@0.15.0
  - @usefy/use-throttle@0.15.0
  - @usefy/use-throttle-callback@0.15.0
  - @usefy/use-timeout@0.15.0
  - @usefy/use-timer@0.15.0
  - @usefy/use-toggle@0.15.0
  - @usefy/use-unmount@0.15.0
  - @usefy/use-update-effect@0.15.0
  - @usefy/use-window-size@0.15.0

## 0.14.0

### Minor Changes

- ff59cfe: feat(use-measure): add useMeasure hook for reactive element bounds

  `const [ref, bounds] = useMeasure()` returns an element's live bounds — its size
  and viewport-relative position (`x, y, width, height, top, right, bottom, left`)
  — and keeps them in sync via ResizeObserver. It is the ergonomic "just give me
  the bounds" convenience layer over `@usefy/use-resize-observer`, reusing that
  hook internally rather than re-implementing observer wiring. SSR-safe,
  StrictMode-safe, with a stable callback ref and equality-guarded updates.

### Patch Changes

- Updated dependencies [ff59cfe]
  - @usefy/use-measure@0.14.0
  - @usefy/use-click-any-where@0.14.0
  - @usefy/use-controllable-state@0.14.0
  - @usefy/use-copy-to-clipboard@0.14.0
  - @usefy/use-counter@0.14.0
  - @usefy/use-dark-mode@0.14.0
  - @usefy/use-debounce@0.14.0
  - @usefy/use-debounce-callback@0.14.0
  - @usefy/use-disclosure@0.14.0
  - @usefy/use-document-title@0.14.0
  - @usefy/use-event-callback@0.14.0
  - @usefy/use-event-listener@0.14.0
  - @usefy/use-geolocation@0.14.0
  - @usefy/use-history-state@0.14.0
  - @usefy/use-hover@0.14.0
  - @usefy/use-init@0.14.0
  - @usefy/use-intersection-observer@0.14.0
  - @usefy/use-is-client@0.14.0
  - @usefy/use-is-first-render@0.14.0
  - @usefy/use-isomorphic-layout-effect@0.14.0
  - @usefy/use-key-press@0.14.0
  - @usefy/use-latest@0.14.0
  - @usefy/use-list@0.14.0
  - @usefy/use-local-storage@0.14.0
  - @usefy/use-map@0.14.0
  - @usefy/use-media-query@0.14.0
  - @usefy/use-memory-monitor@0.14.0
  - @usefy/use-merged-refs@0.14.0
  - @usefy/use-mount@0.14.0
  - @usefy/use-on-click-outside@0.14.0
  - @usefy/use-preferred-color-scheme@0.14.0
  - @usefy/use-previous@0.14.0
  - @usefy/use-queue@0.14.0
  - @usefy/use-reduced-motion@0.14.0
  - @usefy/use-session-storage@0.14.0
  - @usefy/use-set@0.14.0
  - @usefy/use-signal@0.14.0
  - @usefy/use-step@0.14.0
  - @usefy/use-throttle@0.14.0
  - @usefy/use-throttle-callback@0.14.0
  - @usefy/use-timeout@0.14.0
  - @usefy/use-timer@0.14.0
  - @usefy/use-toggle@0.14.0
  - @usefy/use-unmount@0.14.0
  - @usefy/use-update-effect@0.14.0
  - @usefy/use-window-size@0.14.0

## 0.13.0

### Minor Changes

- 1bcb3ea: Add design-system primitive (Batch 3): `useControllableState` — a controlled/uncontrolled state primitive (Radix/Mantine pattern) that lets a component accept a parent-driven `value`/`onChange` or manage its own state from `defaultValue` with a single hook. `useState` ergonomics (value or updater), stable setter identity, and StrictMode-safe `onChange`. Ships with tests (100% coverage), a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.
- 1bcb3ea: Add design-system primitive (Batch 3): `useDisclosure` — open/close/toggle state for modals, drawers, popovers, and accordions. Returns a `[opened, { open, close, toggle }]` tuple (Mantine shape) with stable handler identities and optional `onOpen`/`onClose` callbacks that fire only on a real transition. `open()` while open (and `close()` while closed) is a no-op, and callbacks are StrictMode-safe (never dispatched from inside a setState updater). Includes tests (100% coverage), a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.
- 1bcb3ea: Add design-system primitive (Batch 3): `useMergedRefs` — merges any mix of callback refs and ref objects into a single stable callback ref, the essential helper for `forwardRef` components that also need their own ref to a node. Supports React 19 callback-ref cleanup functions with a "set null on unmount" fallback for React 18, and ships a non-hook `mergeRefs` for composing refs outside render. Includes tests (100% coverage), a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.

### Patch Changes

- Updated dependencies [1bcb3ea]
- Updated dependencies [1bcb3ea]
- Updated dependencies [1bcb3ea]
  - @usefy/use-controllable-state@0.13.0
  - @usefy/use-disclosure@0.13.0
  - @usefy/use-merged-refs@0.13.0
  - @usefy/use-click-any-where@0.13.0
  - @usefy/use-copy-to-clipboard@0.13.0
  - @usefy/use-counter@0.13.0
  - @usefy/use-dark-mode@0.13.0
  - @usefy/use-debounce@0.13.0
  - @usefy/use-debounce-callback@0.13.0
  - @usefy/use-document-title@0.13.0
  - @usefy/use-event-callback@0.13.0
  - @usefy/use-event-listener@0.13.0
  - @usefy/use-geolocation@0.13.0
  - @usefy/use-history-state@0.13.0
  - @usefy/use-hover@0.13.0
  - @usefy/use-init@0.13.0
  - @usefy/use-intersection-observer@0.13.0
  - @usefy/use-is-client@0.13.0
  - @usefy/use-is-first-render@0.13.0
  - @usefy/use-isomorphic-layout-effect@0.13.0
  - @usefy/use-key-press@0.13.0
  - @usefy/use-latest@0.13.0
  - @usefy/use-list@0.13.0
  - @usefy/use-local-storage@0.13.0
  - @usefy/use-map@0.13.0
  - @usefy/use-media-query@0.13.0
  - @usefy/use-memory-monitor@0.13.0
  - @usefy/use-mount@0.13.0
  - @usefy/use-on-click-outside@0.13.0
  - @usefy/use-preferred-color-scheme@0.13.0
  - @usefy/use-previous@0.13.0
  - @usefy/use-queue@0.13.0
  - @usefy/use-reduced-motion@0.13.0
  - @usefy/use-session-storage@0.13.0
  - @usefy/use-set@0.13.0
  - @usefy/use-signal@0.13.0
  - @usefy/use-step@0.13.0
  - @usefy/use-throttle@0.13.0
  - @usefy/use-throttle-callback@0.13.0
  - @usefy/use-timeout@0.13.0
  - @usefy/use-timer@0.13.0
  - @usefy/use-toggle@0.13.0
  - @usefy/use-unmount@0.13.0
  - @usefy/use-update-effect@0.13.0
  - @usefy/use-window-size@0.13.0

## 0.12.2

### Patch Changes

- Updated dependencies [a188dd9]
  - @usefy/use-is-first-render@0.12.2
  - @usefy/use-update-effect@0.12.2
  - @usefy/use-dark-mode@0.12.2
  - @usefy/use-previous@0.12.2
  - @usefy/use-latest@0.12.2
  - @usefy/use-event-callback@0.12.2
  - @usefy/use-click-any-where@0.12.2
  - @usefy/use-copy-to-clipboard@0.12.2
  - @usefy/use-counter@0.12.2
  - @usefy/use-debounce@0.12.2
  - @usefy/use-debounce-callback@0.12.2
  - @usefy/use-document-title@0.12.2
  - @usefy/use-event-listener@0.12.2
  - @usefy/use-geolocation@0.12.2
  - @usefy/use-history-state@0.12.2
  - @usefy/use-hover@0.12.2
  - @usefy/use-init@0.12.2
  - @usefy/use-intersection-observer@0.12.2
  - @usefy/use-is-client@0.12.2
  - @usefy/use-isomorphic-layout-effect@0.12.2
  - @usefy/use-key-press@0.12.2
  - @usefy/use-list@0.12.2
  - @usefy/use-local-storage@0.12.2
  - @usefy/use-map@0.12.2
  - @usefy/use-media-query@0.12.2
  - @usefy/use-memory-monitor@0.12.2
  - @usefy/use-mount@0.12.2
  - @usefy/use-on-click-outside@0.12.2
  - @usefy/use-preferred-color-scheme@0.12.2
  - @usefy/use-queue@0.12.2
  - @usefy/use-reduced-motion@0.12.2
  - @usefy/use-session-storage@0.12.2
  - @usefy/use-set@0.12.2
  - @usefy/use-signal@0.12.2
  - @usefy/use-step@0.12.2
  - @usefy/use-throttle@0.12.2
  - @usefy/use-throttle-callback@0.12.2
  - @usefy/use-timeout@0.12.2
  - @usefy/use-timer@0.12.2
  - @usefy/use-toggle@0.12.2
  - @usefy/use-unmount@0.12.2
  - @usefy/use-window-size@0.12.2

## 0.12.1

### Patch Changes

- Updated dependencies [b850ad8]
  - @usefy/use-is-client@0.12.1
  - @usefy/use-isomorphic-layout-effect@0.12.1
  - @usefy/use-previous@0.12.1
  - @usefy/use-latest@0.12.1
  - @usefy/use-event-callback@0.12.1
  - @usefy/use-update-effect@0.12.1
  - @usefy/use-mount@0.12.1
  - @usefy/use-is-first-render@0.12.1
  - @usefy/use-media-query@0.12.1
  - @usefy/use-preferred-color-scheme@0.12.1
  - @usefy/use-reduced-motion@0.12.1
  - @usefy/use-dark-mode@0.12.1
  - @usefy/use-document-title@0.12.1
  - @usefy/use-click-any-where@0.12.1
  - @usefy/use-copy-to-clipboard@0.12.1
  - @usefy/use-counter@0.12.1
  - @usefy/use-debounce@0.12.1
  - @usefy/use-debounce-callback@0.12.1
  - @usefy/use-event-listener@0.12.1
  - @usefy/use-geolocation@0.12.1
  - @usefy/use-history-state@0.12.1
  - @usefy/use-hover@0.12.1
  - @usefy/use-init@0.12.1
  - @usefy/use-intersection-observer@0.12.1
  - @usefy/use-key-press@0.12.1
  - @usefy/use-list@0.12.1
  - @usefy/use-local-storage@0.12.1
  - @usefy/use-map@0.12.1
  - @usefy/use-memory-monitor@0.12.1
  - @usefy/use-on-click-outside@0.12.1
  - @usefy/use-queue@0.12.1
  - @usefy/use-session-storage@0.12.1
  - @usefy/use-set@0.12.1
  - @usefy/use-signal@0.12.1
  - @usefy/use-step@0.12.1
  - @usefy/use-throttle@0.12.1
  - @usefy/use-throttle-callback@0.12.1
  - @usefy/use-timeout@0.12.1
  - @usefy/use-timer@0.12.1
  - @usefy/use-toggle@0.12.1
  - @usefy/use-unmount@0.12.1
  - @usefy/use-window-size@0.12.1

## 0.12.0

### Minor Changes

- af0c72e: Add responsive & theme hooks (Batch 2): `useMediaQuery`, `usePreferredColorScheme`, `useReducedMotion`, `useDarkMode`, and `useDocumentTitle`. Each ships with tests, a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.

### Patch Changes

- Updated dependencies [af0c72e]
  - @usefy/use-media-query@0.12.0
  - @usefy/use-preferred-color-scheme@0.12.0
  - @usefy/use-reduced-motion@0.12.0
  - @usefy/use-dark-mode@0.12.0
  - @usefy/use-document-title@0.12.0
  - @usefy/use-click-any-where@0.12.0
  - @usefy/use-copy-to-clipboard@0.12.0
  - @usefy/use-counter@0.12.0
  - @usefy/use-debounce@0.12.0
  - @usefy/use-debounce-callback@0.12.0
  - @usefy/use-event-callback@0.12.0
  - @usefy/use-event-listener@0.12.0
  - @usefy/use-geolocation@0.12.0
  - @usefy/use-history-state@0.12.0
  - @usefy/use-hover@0.12.0
  - @usefy/use-init@0.12.0
  - @usefy/use-intersection-observer@0.12.0
  - @usefy/use-is-client@0.12.0
  - @usefy/use-is-first-render@0.12.0
  - @usefy/use-isomorphic-layout-effect@0.12.0
  - @usefy/use-key-press@0.12.0
  - @usefy/use-latest@0.12.0
  - @usefy/use-list@0.12.0
  - @usefy/use-local-storage@0.12.0
  - @usefy/use-map@0.12.0
  - @usefy/use-memory-monitor@0.12.0
  - @usefy/use-mount@0.12.0
  - @usefy/use-on-click-outside@0.12.0
  - @usefy/use-previous@0.12.0
  - @usefy/use-queue@0.12.0
  - @usefy/use-session-storage@0.12.0
  - @usefy/use-set@0.12.0
  - @usefy/use-signal@0.12.0
  - @usefy/use-step@0.12.0
  - @usefy/use-throttle@0.12.0
  - @usefy/use-throttle-callback@0.12.0
  - @usefy/use-timeout@0.12.0
  - @usefy/use-timer@0.12.0
  - @usefy/use-toggle@0.12.0
  - @usefy/use-unmount@0.12.0
  - @usefy/use-update-effect@0.12.0
  - @usefy/use-window-size@0.12.0

## 0.11.0

### Minor Changes

- 28b23d8: Add SSR & lifecycle hooks (Batch 1): `useIsClient`, `useIsomorphicLayoutEffect`, `usePrevious`, `useLatest`, `useEventCallback`, `useUpdateEffect`, `useMount`, and `useIsFirstRender`. Each ships with tests, a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.

### Patch Changes

- Updated dependencies [28b23d8]
  - @usefy/use-is-client@0.11.0
  - @usefy/use-isomorphic-layout-effect@0.11.0
  - @usefy/use-previous@0.11.0
  - @usefy/use-latest@0.11.0
  - @usefy/use-event-callback@0.11.0
  - @usefy/use-update-effect@0.11.0
  - @usefy/use-mount@0.11.0
  - @usefy/use-is-first-render@0.11.0
  - @usefy/use-click-any-where@0.11.0
  - @usefy/use-copy-to-clipboard@0.11.0
  - @usefy/use-counter@0.11.0
  - @usefy/use-debounce@0.11.0
  - @usefy/use-debounce-callback@0.11.0
  - @usefy/use-event-listener@0.11.0
  - @usefy/use-geolocation@0.11.0
  - @usefy/use-history-state@0.11.0
  - @usefy/use-hover@0.11.0
  - @usefy/use-init@0.11.0
  - @usefy/use-intersection-observer@0.11.0
  - @usefy/use-key-press@0.11.0
  - @usefy/use-list@0.11.0
  - @usefy/use-local-storage@0.11.0
  - @usefy/use-map@0.11.0
  - @usefy/use-memory-monitor@0.11.0
  - @usefy/use-on-click-outside@0.11.0
  - @usefy/use-queue@0.11.0
  - @usefy/use-session-storage@0.11.0
  - @usefy/use-set@0.11.0
  - @usefy/use-signal@0.11.0
  - @usefy/use-step@0.11.0
  - @usefy/use-throttle@0.11.0
  - @usefy/use-throttle-callback@0.11.0
  - @usefy/use-timeout@0.11.0
  - @usefy/use-timer@0.11.0
  - @usefy/use-toggle@0.11.0
  - @usefy/use-unmount@0.11.0
  - @usefy/use-window-size@0.11.0

## 0.10.0

### Minor Changes

- 4abbdc5: Add `useWindowSize` — a hook for tracking the browser window size with debounce/throttle, SSR-safe initial values, scrollbar control, an `onChange` callback, and no-op re-render skipping.

### Patch Changes

- Updated dependencies [4abbdc5]
  - @usefy/use-window-size@0.10.0
  - @usefy/use-click-any-where@0.10.0
  - @usefy/use-copy-to-clipboard@0.10.0
  - @usefy/use-counter@0.10.0
  - @usefy/use-debounce@0.10.0
  - @usefy/use-debounce-callback@0.10.0
  - @usefy/use-event-listener@0.10.0
  - @usefy/use-geolocation@0.10.0
  - @usefy/use-history-state@0.10.0
  - @usefy/use-hover@0.10.0
  - @usefy/use-init@0.10.0
  - @usefy/use-intersection-observer@0.10.0
  - @usefy/use-key-press@0.10.0
  - @usefy/use-list@0.10.0
  - @usefy/use-local-storage@0.10.0
  - @usefy/use-map@0.10.0
  - @usefy/use-memory-monitor@0.10.0
  - @usefy/use-on-click-outside@0.10.0
  - @usefy/use-queue@0.10.0
  - @usefy/use-session-storage@0.10.0
  - @usefy/use-set@0.10.0
  - @usefy/use-signal@0.10.0
  - @usefy/use-step@0.10.0
  - @usefy/use-throttle@0.10.0
  - @usefy/use-throttle-callback@0.10.0
  - @usefy/use-timeout@0.10.0
  - @usefy/use-timer@0.10.0
  - @usefy/use-toggle@0.10.0
  - @usefy/use-unmount@0.10.0

## 0.9.0

### Minor Changes

- c269c3d: Add `useStep` — a hook for multi-step navigation (wizards, multi-step forms, onboarding, carousels). Tracks a 0-based step index with automatic range validation: `goToNextStep`/`goToPrevStep` with ready-made `canGoToNextStep`/`canGoToPrevStep` flags, `setStep` (value or updater, clamped), and `reset`. Returns a `[currentStep, controls]` tuple with stable control identities, resilience to a changing step `count`, and no-op skipping at the edges.

### Patch Changes

- Updated dependencies [c269c3d]
  - @usefy/use-step@0.9.0
  - @usefy/use-click-any-where@0.9.0
  - @usefy/use-copy-to-clipboard@0.9.0
  - @usefy/use-counter@0.9.0
  - @usefy/use-debounce@0.9.0
  - @usefy/use-debounce-callback@0.9.0
  - @usefy/use-event-listener@0.9.0
  - @usefy/use-geolocation@0.9.0
  - @usefy/use-history-state@0.9.0
  - @usefy/use-hover@0.9.0
  - @usefy/use-init@0.9.0
  - @usefy/use-intersection-observer@0.9.0
  - @usefy/use-key-press@0.9.0
  - @usefy/use-list@0.9.0
  - @usefy/use-local-storage@0.9.0
  - @usefy/use-map@0.9.0
  - @usefy/use-memory-monitor@0.9.0
  - @usefy/use-on-click-outside@0.9.0
  - @usefy/use-queue@0.9.0
  - @usefy/use-session-storage@0.9.0
  - @usefy/use-set@0.9.0
  - @usefy/use-signal@0.9.0
  - @usefy/use-throttle@0.9.0
  - @usefy/use-throttle-callback@0.9.0
  - @usefy/use-timeout@0.9.0
  - @usefy/use-timer@0.9.0
  - @usefy/use-toggle@0.9.0
  - @usefy/use-unmount@0.9.0

## 0.8.0

### Minor Changes

- 41e74f7: Add `useHistoryState` — a hook for state with built-in undo/redo history (time travel). Records each `set` (value or updater) on an immutable timeline; navigate with `undo`/`redo`/`goTo`, read `canUndo`/`canRedo`, and inspect the full `history` array + `currentIndex`. Includes an optional `limit` to bound memory (oldest entries drop off the front), `clear`/`reset`, no-op skipping, and stable control identities that are safe as effect dependencies.

### Patch Changes

- Updated dependencies [41e74f7]
  - @usefy/use-history-state@0.8.0
  - @usefy/use-click-any-where@0.8.0
  - @usefy/use-copy-to-clipboard@0.8.0
  - @usefy/use-counter@0.8.0
  - @usefy/use-debounce@0.8.0
  - @usefy/use-debounce-callback@0.8.0
  - @usefy/use-event-listener@0.8.0
  - @usefy/use-geolocation@0.8.0
  - @usefy/use-hover@0.8.0
  - @usefy/use-init@0.8.0
  - @usefy/use-intersection-observer@0.8.0
  - @usefy/use-key-press@0.8.0
  - @usefy/use-list@0.8.0
  - @usefy/use-local-storage@0.8.0
  - @usefy/use-map@0.8.0
  - @usefy/use-memory-monitor@0.8.0
  - @usefy/use-on-click-outside@0.8.0
  - @usefy/use-queue@0.8.0
  - @usefy/use-session-storage@0.8.0
  - @usefy/use-set@0.8.0
  - @usefy/use-signal@0.8.0
  - @usefy/use-throttle@0.8.0
  - @usefy/use-throttle-callback@0.8.0
  - @usefy/use-timeout@0.8.0
  - @usefy/use-timer@0.8.0
  - @usefy/use-toggle@0.8.0
  - @usefy/use-unmount@0.8.0

## 0.7.0

### Minor Changes

- e42e45c: Add `useQueue` — a hook for managing FIFO queue state with immutable updates. Enqueue to the back with `add` (variadic), dequeue from the front with `remove` (which returns the removed item), inspect the front with `peek`, plus `clear` and `reset`. Returns a `[queue, actions]` tuple with a `readonly T[]` value, stable action identities, lazy initialization, and no-op skipping — consistent with `useMap`/`useSet`/`useList`.

### Patch Changes

- Updated dependencies [e42e45c]
  - @usefy/use-queue@0.7.0
  - @usefy/use-click-any-where@0.7.0
  - @usefy/use-copy-to-clipboard@0.7.0
  - @usefy/use-counter@0.7.0
  - @usefy/use-debounce@0.7.0
  - @usefy/use-debounce-callback@0.7.0
  - @usefy/use-event-listener@0.7.0
  - @usefy/use-geolocation@0.7.0
  - @usefy/use-hover@0.7.0
  - @usefy/use-init@0.7.0
  - @usefy/use-intersection-observer@0.7.0
  - @usefy/use-key-press@0.7.0
  - @usefy/use-list@0.7.0
  - @usefy/use-local-storage@0.7.0
  - @usefy/use-map@0.7.0
  - @usefy/use-memory-monitor@0.7.0
  - @usefy/use-on-click-outside@0.7.0
  - @usefy/use-session-storage@0.7.0
  - @usefy/use-set@0.7.0
  - @usefy/use-signal@0.7.0
  - @usefy/use-throttle@0.7.0
  - @usefy/use-throttle-callback@0.7.0
  - @usefy/use-timeout@0.7.0
  - @usefy/use-timer@0.7.0
  - @usefy/use-toggle@0.7.0
  - @usefy/use-unmount@0.7.0

## 0.6.0

### Minor Changes

- 0439340: feat(use-list): add useList hook for array state management

  Introduces `@usefy/use-list`, a hook for managing array state with immutable updates:

  - Returns `[list, { set, push, filter, sort, clear, removeAt, insertAt, updateAt, reset }]` with a `readonly T[]` to prevent accidental in-place mutation
  - Immutable updates — every change produces a new array; the initial value is copied and never mutated
  - `set` accepts a new array or an updater function; `sort` is immutable (`[...prev].sort()`)
  - Stable action identities, safe to use as effect dependencies
  - `useState`-style lazy initialization (accepts an array/iterable or a factory)
  - No-op skipping (out-of-range index, empty clear, unchanged value, filtering out nothing) to avoid needless re-renders
  - Full TypeScript generics `<T>`

  Also re-exported from the `@usefy/hooks` umbrella package.

### Patch Changes

- Updated dependencies [0439340]
  - @usefy/use-list@0.6.0
  - @usefy/use-click-any-where@0.6.0
  - @usefy/use-copy-to-clipboard@0.6.0
  - @usefy/use-counter@0.6.0
  - @usefy/use-debounce@0.6.0
  - @usefy/use-debounce-callback@0.6.0
  - @usefy/use-event-listener@0.6.0
  - @usefy/use-geolocation@0.6.0
  - @usefy/use-hover@0.6.0
  - @usefy/use-init@0.6.0
  - @usefy/use-intersection-observer@0.6.0
  - @usefy/use-key-press@0.6.0
  - @usefy/use-local-storage@0.6.0
  - @usefy/use-map@0.6.0
  - @usefy/use-memory-monitor@0.6.0
  - @usefy/use-on-click-outside@0.6.0
  - @usefy/use-session-storage@0.6.0
  - @usefy/use-set@0.6.0
  - @usefy/use-signal@0.6.0
  - @usefy/use-throttle@0.6.0
  - @usefy/use-throttle-callback@0.6.0
  - @usefy/use-timeout@0.6.0
  - @usefy/use-timer@0.6.0
  - @usefy/use-toggle@0.6.0
  - @usefy/use-unmount@0.6.0

## 0.5.0

### Minor Changes

- 2dc4d63: feat(use-set): add useSet hook for Set state management

  Introduces `@usefy/use-set`, a hook for managing `Set` state with immutable updates:

  - Returns `[set, { add, remove, toggle, has, clear, reset }]` with a `ReadonlySet` to prevent accidental in-place mutation
  - Immutable updates — every change produces a new `Set`; the initial value is copied and never mutated
  - `toggle(value, force?)` supports an optional force argument (like `DOMTokenList.toggle`)
  - Stable action identities, safe to use as effect dependencies
  - `useState`-style lazy initialization (accepts a `Set`, an iterable, or a factory)
  - No-op skipping (existing add, absent remove, empty clear) to avoid needless re-renders
  - Full TypeScript generics `<T>`

  Also re-exported from the `@usefy/hooks` umbrella package.

### Patch Changes

- Updated dependencies [2dc4d63]
  - @usefy/use-set@0.5.0
  - @usefy/use-click-any-where@0.5.0
  - @usefy/use-copy-to-clipboard@0.5.0
  - @usefy/use-counter@0.5.0
  - @usefy/use-debounce@0.5.0
  - @usefy/use-debounce-callback@0.5.0
  - @usefy/use-event-listener@0.5.0
  - @usefy/use-geolocation@0.5.0
  - @usefy/use-hover@0.5.0
  - @usefy/use-init@0.5.0
  - @usefy/use-intersection-observer@0.5.0
  - @usefy/use-key-press@0.5.0
  - @usefy/use-local-storage@0.5.0
  - @usefy/use-map@0.5.0
  - @usefy/use-memory-monitor@0.5.0
  - @usefy/use-on-click-outside@0.5.0
  - @usefy/use-session-storage@0.5.0
  - @usefy/use-signal@0.5.0
  - @usefy/use-throttle@0.5.0
  - @usefy/use-throttle-callback@0.5.0
  - @usefy/use-timeout@0.5.0
  - @usefy/use-timer@0.5.0
  - @usefy/use-toggle@0.5.0
  - @usefy/use-unmount@0.5.0

## 0.4.0

### Minor Changes

- c4305e9: feat(use-map): add useMap hook for Map state management

  Introduces `@usefy/use-map`, a hook for managing `Map` state with immutable updates:

  - Returns `[map, { set, setAll, remove, reset, clear, get }]` with a `ReadonlyMap` to prevent accidental in-place mutation
  - Immutable updates — every change produces a new `Map`; the initial value is copied and never mutated
  - Stable action identities, safe to use as effect dependencies
  - `useState`-style lazy initialization (accepts a `Map`, tuples, or a factory)
  - No-op skipping (absent-key removal, empty clear, same-value set) to avoid needless re-renders
  - Full TypeScript generics `<K, V>`

  Also re-exported from the `@usefy/hooks` umbrella package.

### Patch Changes

- Updated dependencies [c4305e9]
  - @usefy/use-map@0.4.0
  - @usefy/use-click-any-where@0.4.0
  - @usefy/use-copy-to-clipboard@0.4.0
  - @usefy/use-counter@0.4.0
  - @usefy/use-debounce@0.4.0
  - @usefy/use-debounce-callback@0.4.0
  - @usefy/use-event-listener@0.4.0
  - @usefy/use-geolocation@0.4.0
  - @usefy/use-hover@0.4.0
  - @usefy/use-init@0.4.0
  - @usefy/use-intersection-observer@0.4.0
  - @usefy/use-key-press@0.4.0
  - @usefy/use-local-storage@0.4.0
  - @usefy/use-memory-monitor@0.4.0
  - @usefy/use-on-click-outside@0.4.0
  - @usefy/use-session-storage@0.4.0
  - @usefy/use-signal@0.4.0
  - @usefy/use-throttle@0.4.0
  - @usefy/use-throttle-callback@0.4.0
  - @usefy/use-timeout@0.4.0
  - @usefy/use-timer@0.4.0
  - @usefy/use-toggle@0.4.0
  - @usefy/use-unmount@0.4.0

## 0.3.1

### Patch Changes

- 565a971: docs(use-key-press): add package README and update hooks documentation

  - Add the `@usefy/use-key-press` README with installation, full API reference (target forms, modifier/key aliases, all options), usage examples, behavior notes, and coverage links.
  - Update the `@usefy/hooks` README: add `useKeyPress` to the hooks table with a coverage badge, include it in the Quick Start imports, and add a Keyboard section to the feature list.

- Updated dependencies [565a971]
  - @usefy/use-key-press@0.3.1
  - @usefy/use-click-any-where@0.3.1
  - @usefy/use-copy-to-clipboard@0.3.1
  - @usefy/use-counter@0.3.1
  - @usefy/use-debounce@0.3.1
  - @usefy/use-debounce-callback@0.3.1
  - @usefy/use-event-listener@0.3.1
  - @usefy/use-geolocation@0.3.1
  - @usefy/use-hover@0.3.1
  - @usefy/use-init@0.3.1
  - @usefy/use-intersection-observer@0.3.1
  - @usefy/use-local-storage@0.3.1
  - @usefy/use-memory-monitor@0.3.1
  - @usefy/use-on-click-outside@0.3.1
  - @usefy/use-session-storage@0.3.1
  - @usefy/use-signal@0.3.1
  - @usefy/use-throttle@0.3.1
  - @usefy/use-throttle-callback@0.3.1
  - @usefy/use-timeout@0.3.1
  - @usefy/use-timer@0.3.1
  - @usefy/use-toggle@0.3.1
  - @usefy/use-unmount@0.3.1

## 0.3.0

### Minor Changes

- d0e98cd: feat(use-key-press): add useKeyPress hook for keyboard detection

  Introduces `@usefy/use-key-press`, a hook for detecting key presses, shortcuts, and combinations:

  - Single keys (`"Escape"`), combinations (`"ctrl+s"`, `"mod+shift+k"`), and alternative bindings via arrays (`["ctrl+s", "meta+s"]`, matched as OR)
  - Cross-platform `"mod"` alias (Ctrl on Windows/Linux, Cmd on macOS) and friendly aliases (`esc`, `space`, arrows, etc.)
  - Predicate targets for full control, plus match-by logical key (`event.key`) or physical key (`event.code`)
  - `onPress`/`onRelease` callbacks with the raw event, `preventDefault`/`stopPropagation`, exact/loose modifier matching
  - Robustness: ignores auto-repeat and typing inside editable elements (opt-in), resets on window blur, SSR-safe with automatic cleanup

  Also re-exported from the `@usefy/hooks` umbrella package.

### Patch Changes

- Updated dependencies [d0e98cd]
  - @usefy/use-key-press@0.3.0
  - @usefy/use-click-any-where@0.3.0
  - @usefy/use-copy-to-clipboard@0.3.0
  - @usefy/use-counter@0.3.0
  - @usefy/use-debounce@0.3.0
  - @usefy/use-debounce-callback@0.3.0
  - @usefy/use-event-listener@0.3.0
  - @usefy/use-geolocation@0.3.0
  - @usefy/use-hover@0.3.0
  - @usefy/use-init@0.3.0
  - @usefy/use-intersection-observer@0.3.0
  - @usefy/use-local-storage@0.3.0
  - @usefy/use-memory-monitor@0.3.0
  - @usefy/use-on-click-outside@0.3.0
  - @usefy/use-session-storage@0.3.0
  - @usefy/use-signal@0.3.0
  - @usefy/use-throttle@0.3.0
  - @usefy/use-throttle-callback@0.3.0
  - @usefy/use-timeout@0.3.0
  - @usefy/use-timer@0.3.0
  - @usefy/use-toggle@0.3.0
  - @usefy/use-unmount@0.3.0

## 0.2.6

### Patch Changes

- 7981be9: add useHover
- Updated dependencies [7981be9]
  - @usefy/use-hover@0.2.6
  - @usefy/use-click-any-where@0.2.6
  - @usefy/use-copy-to-clipboard@0.2.6
  - @usefy/use-counter@0.2.6
  - @usefy/use-debounce@0.2.6
  - @usefy/use-debounce-callback@0.2.6
  - @usefy/use-event-listener@0.2.6
  - @usefy/use-geolocation@0.2.6
  - @usefy/use-init@0.2.6
  - @usefy/use-intersection-observer@0.2.6
  - @usefy/use-local-storage@0.2.6
  - @usefy/use-memory-monitor@0.2.6
  - @usefy/use-on-click-outside@0.2.6
  - @usefy/use-session-storage@0.2.6
  - @usefy/use-signal@0.2.6
  - @usefy/use-throttle@0.2.6
  - @usefy/use-throttle-callback@0.2.6
  - @usefy/use-timeout@0.2.6
  - @usefy/use-timer@0.2.6
  - @usefy/use-toggle@0.2.6
  - @usefy/use-unmount@0.2.6

## 0.2.5

### Patch Changes

- e079da8: update README.md
- bcf6e57: add useTimeout
- Updated dependencies [e079da8]
- Updated dependencies [bcf6e57]
  - @usefy/use-timeout@0.2.5
  - @usefy/use-click-any-where@0.2.5
  - @usefy/use-copy-to-clipboard@0.2.5
  - @usefy/use-counter@0.2.5
  - @usefy/use-debounce@0.2.5
  - @usefy/use-debounce-callback@0.2.5
  - @usefy/use-event-listener@0.2.5
  - @usefy/use-geolocation@0.2.5
  - @usefy/use-init@0.2.5
  - @usefy/use-intersection-observer@0.2.5
  - @usefy/use-local-storage@0.2.5
  - @usefy/use-memory-monitor@0.2.5
  - @usefy/use-on-click-outside@0.2.5
  - @usefy/use-session-storage@0.2.5
  - @usefy/use-signal@0.2.5
  - @usefy/use-throttle@0.2.5
  - @usefy/use-throttle-callback@0.2.5
  - @usefy/use-timer@0.2.5
  - @usefy/use-toggle@0.2.5
  - @usefy/use-unmount@0.2.5

## 0.2.4

### Patch Changes

- 6af7994: add useResizeObserver
  - @usefy/use-click-any-where@0.2.4
  - @usefy/use-copy-to-clipboard@0.2.4
  - @usefy/use-counter@0.2.4
  - @usefy/use-debounce@0.2.4
  - @usefy/use-debounce-callback@0.2.4
  - @usefy/use-event-listener@0.2.4
  - @usefy/use-geolocation@0.2.4
  - @usefy/use-init@0.2.4
  - @usefy/use-intersection-observer@0.2.4
  - @usefy/use-local-storage@0.2.4
  - @usefy/use-memory-monitor@0.2.4
  - @usefy/use-on-click-outside@0.2.4
  - @usefy/use-session-storage@0.2.4
  - @usefy/use-signal@0.2.4
  - @usefy/use-throttle@0.2.4
  - @usefy/use-throttle-callback@0.2.4
  - @usefy/use-timer@0.2.4
  - @usefy/use-toggle@0.2.4
  - @usefy/use-unmount@0.2.4

## 0.2.3

### Patch Changes

- @usefy/use-click-any-where@0.2.3
- @usefy/use-copy-to-clipboard@0.2.3
- @usefy/use-counter@0.2.3
- @usefy/use-debounce@0.2.3
- @usefy/use-debounce-callback@0.2.3
- @usefy/use-event-listener@0.2.3
- @usefy/use-geolocation@0.2.3
- @usefy/use-init@0.2.3
- @usefy/use-intersection-observer@0.2.3
- @usefy/use-local-storage@0.2.3
- @usefy/use-memory-monitor@0.2.3
- @usefy/use-on-click-outside@0.2.3
- @usefy/use-session-storage@0.2.3
- @usefy/use-signal@0.2.3
- @usefy/use-throttle@0.2.3
- @usefy/use-throttle-callback@0.2.3
- @usefy/use-timer@0.2.3
- @usefy/use-toggle@0.2.3
- @usefy/use-unmount@0.2.3

## 0.2.2

### Patch Changes

- @usefy/use-click-any-where@0.2.2
- @usefy/use-copy-to-clipboard@0.2.2
- @usefy/use-counter@0.2.2
- @usefy/use-debounce@0.2.2
- @usefy/use-debounce-callback@0.2.2
- @usefy/use-event-listener@0.2.2
- @usefy/use-geolocation@0.2.2
- @usefy/use-init@0.2.2
- @usefy/use-intersection-observer@0.2.2
- @usefy/use-local-storage@0.2.2
- @usefy/use-memory-monitor@0.2.2
- @usefy/use-on-click-outside@0.2.2
- @usefy/use-session-storage@0.2.2
- @usefy/use-signal@0.2.2
- @usefy/use-throttle@0.2.2
- @usefy/use-throttle-callback@0.2.2
- @usefy/use-timer@0.2.2
- @usefy/use-toggle@0.2.2
- @usefy/use-unmount@0.2.2

## 0.2.1

### Patch Changes

- @usefy/use-click-any-where@0.2.1
- @usefy/use-copy-to-clipboard@0.2.1
- @usefy/use-counter@0.2.1
- @usefy/use-debounce@0.2.1
- @usefy/use-debounce-callback@0.2.1
- @usefy/use-event-listener@0.2.1
- @usefy/use-geolocation@0.2.1
- @usefy/use-init@0.2.1
- @usefy/use-intersection-observer@0.2.1
- @usefy/use-local-storage@0.2.1
- @usefy/use-memory-monitor@0.2.1
- @usefy/use-on-click-outside@0.2.1
- @usefy/use-session-storage@0.2.1
- @usefy/use-signal@0.2.1
- @usefy/use-throttle@0.2.1
- @usefy/use-throttle-callback@0.2.1
- @usefy/use-timer@0.2.1
- @usefy/use-toggle@0.2.1
- @usefy/use-unmount@0.2.1

## 0.2.0

### Patch Changes

- @usefy/use-click-any-where@0.2.0
- @usefy/use-copy-to-clipboard@0.2.0
- @usefy/use-counter@0.2.0
- @usefy/use-debounce@0.2.0
- @usefy/use-debounce-callback@0.2.0
- @usefy/use-event-listener@0.2.0
- @usefy/use-geolocation@0.2.0
- @usefy/use-init@0.2.0
- @usefy/use-intersection-observer@0.2.0
- @usefy/use-local-storage@0.2.0
- @usefy/use-memory-monitor@0.2.0
- @usefy/use-on-click-outside@0.2.0
- @usefy/use-session-storage@0.2.0
- @usefy/use-signal@0.2.0
- @usefy/use-throttle@0.2.0
- @usefy/use-throttle-callback@0.2.0
- @usefy/use-timer@0.2.0
- @usefy/use-toggle@0.2.0
- @usefy/use-unmount@0.2.0

## 0.1.5

### Patch Changes

- @usefy/use-click-any-where@0.1.5
- @usefy/use-copy-to-clipboard@0.1.5
- @usefy/use-counter@0.1.5
- @usefy/use-debounce@0.1.5
- @usefy/use-debounce-callback@0.1.5
- @usefy/use-event-listener@0.1.5
- @usefy/use-geolocation@0.1.5
- @usefy/use-init@0.1.5
- @usefy/use-intersection-observer@0.1.5
- @usefy/use-local-storage@0.1.5
- @usefy/use-memory-monitor@0.1.5
- @usefy/use-on-click-outside@0.1.5
- @usefy/use-session-storage@0.1.5
- @usefy/use-signal@0.1.5
- @usefy/use-throttle@0.1.5
- @usefy/use-throttle-callback@0.1.5
- @usefy/use-timer@0.1.5
- @usefy/use-toggle@0.1.5
- @usefy/use-unmount@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies [fd66eb7]
  - @usefy/use-memory-monitor@0.1.4
  - @usefy/use-click-any-where@0.1.4
  - @usefy/use-copy-to-clipboard@0.1.4
  - @usefy/use-counter@0.1.4
  - @usefy/use-debounce@0.1.4
  - @usefy/use-debounce-callback@0.1.4
  - @usefy/use-event-listener@0.1.4
  - @usefy/use-geolocation@0.1.4
  - @usefy/use-init@0.1.4
  - @usefy/use-intersection-observer@0.1.4
  - @usefy/use-local-storage@0.1.4
  - @usefy/use-on-click-outside@0.1.4
  - @usefy/use-session-storage@0.1.4
  - @usefy/use-signal@0.1.4
  - @usefy/use-throttle@0.1.4
  - @usefy/use-throttle-callback@0.1.4
  - @usefy/use-timer@0.1.4
  - @usefy/use-toggle@0.1.4
  - @usefy/use-unmount@0.1.4

## 0.1.3

### Patch Changes

- @usefy/use-click-any-where@0.1.3
- @usefy/use-copy-to-clipboard@0.1.3
- @usefy/use-counter@0.1.3
- @usefy/use-debounce@0.1.3
- @usefy/use-debounce-callback@0.1.3
- @usefy/use-event-listener@0.1.3
- @usefy/use-geolocation@0.1.3
- @usefy/use-init@0.1.3
- @usefy/use-intersection-observer@0.1.3
- @usefy/use-local-storage@0.1.3
- @usefy/use-memory-monitor@0.1.3
- @usefy/use-on-click-outside@0.1.3
- @usefy/use-session-storage@0.1.3
- @usefy/use-signal@0.1.3
- @usefy/use-throttle@0.1.3
- @usefy/use-throttle-callback@0.1.3
- @usefy/use-timer@0.1.3
- @usefy/use-toggle@0.1.3
- @usefy/use-unmount@0.1.3

## 0.1.2

### Patch Changes

- @usefy/use-click-any-where@0.1.2
- @usefy/use-copy-to-clipboard@0.1.2
- @usefy/use-counter@0.1.2
- @usefy/use-debounce@0.1.2
- @usefy/use-debounce-callback@0.1.2
- @usefy/use-event-listener@0.1.2
- @usefy/use-geolocation@0.1.2
- @usefy/use-init@0.1.2
- @usefy/use-intersection-observer@0.1.2
- @usefy/use-local-storage@0.1.2
- @usefy/use-memory-monitor@0.1.2
- @usefy/use-on-click-outside@0.1.2
- @usefy/use-session-storage@0.1.2
- @usefy/use-signal@0.1.2
- @usefy/use-throttle@0.1.2
- @usefy/use-throttle-callback@0.1.2
- @usefy/use-timer@0.1.2
- @usefy/use-toggle@0.1.2
- @usefy/use-unmount@0.1.2

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

- Updated dependencies [1db7b09]
- Updated dependencies [f691328]
  - @usefy/use-memory-monitor@0.1.1
  - @usefy/use-intersection-observer@0.1.1
  - @usefy/use-click-any-where@0.1.1
  - @usefy/use-copy-to-clipboard@0.1.1
  - @usefy/use-counter@0.1.1
  - @usefy/use-debounce@0.1.1
  - @usefy/use-debounce-callback@0.1.1
  - @usefy/use-event-listener@0.1.1
  - @usefy/use-geolocation@0.1.1
  - @usefy/use-init@0.1.1
  - @usefy/use-local-storage@0.1.1
  - @usefy/use-on-click-outside@0.1.1
  - @usefy/use-session-storage@0.1.1
  - @usefy/use-signal@0.1.1
  - @usefy/use-throttle@0.1.1
  - @usefy/use-throttle-callback@0.1.1
  - @usefy/use-timer@0.1.1
  - @usefy/use-toggle@0.1.1
  - @usefy/use-unmount@0.1.1

## 0.0.38

### Patch Changes

- @usefy/use-click-any-where@0.0.38
- @usefy/use-copy-to-clipboard@0.0.38
- @usefy/use-counter@0.0.38
- @usefy/use-debounce@0.0.38
- @usefy/use-debounce-callback@0.0.38
- @usefy/use-event-listener@0.0.38
- @usefy/use-geolocation@0.0.38
- @usefy/use-init@0.0.38
- @usefy/use-intersection-observer@0.0.38
- @usefy/use-local-storage@0.0.38
- @usefy/use-memory-monitor@0.0.38
- @usefy/use-on-click-outside@0.0.38
- @usefy/use-session-storage@0.0.38
- @usefy/use-signal@0.0.38
- @usefy/use-throttle@0.0.38
- @usefy/use-throttle-callback@0.0.38
- @usefy/use-timer@0.0.38
- @usefy/use-toggle@0.0.38
- @usefy/use-unmount@0.0.38

## 0.0.37

### Patch Changes

- eff700e: Rename umbrella package from @usefy/usefy to @usefy/hooks for clearer naming convention
  - @usefy/use-click-any-where@0.0.37
  - @usefy/use-copy-to-clipboard@0.0.37
  - @usefy/use-counter@0.0.37
  - @usefy/use-debounce@0.0.37
  - @usefy/use-debounce-callback@0.0.37
  - @usefy/use-event-listener@0.0.37
  - @usefy/use-geolocation@0.0.37
  - @usefy/use-init@0.0.37
  - @usefy/use-intersection-observer@0.0.37
  - @usefy/use-local-storage@0.0.37
  - @usefy/use-memory-monitor@0.0.37
  - @usefy/use-on-click-outside@0.0.37
  - @usefy/use-session-storage@0.0.37
  - @usefy/use-signal@0.0.37
  - @usefy/use-throttle@0.0.37
  - @usefy/use-throttle-callback@0.0.37
  - @usefy/use-timer@0.0.37
  - @usefy/use-toggle@0.0.37
  - @usefy/use-unmount@0.0.37

## 0.0.36

### Patch Changes

- 5866388: Rename umbrella package from @usefy/usefy to usefy for simpler installation via npm install usefy
  - @usefy/use-click-any-where@0.0.36
  - @usefy/use-copy-to-clipboard@0.0.36
  - @usefy/use-counter@0.0.36
  - @usefy/use-debounce@0.0.36
  - @usefy/use-debounce-callback@0.0.36
  - @usefy/use-event-listener@0.0.36
  - @usefy/use-geolocation@0.0.36
  - @usefy/use-init@0.0.36
  - @usefy/use-intersection-observer@0.0.36
  - @usefy/use-local-storage@0.0.36
  - @usefy/use-memory-monitor@0.0.36
  - @usefy/use-on-click-outside@0.0.36
  - @usefy/use-session-storage@0.0.36
  - @usefy/use-signal@0.0.36
  - @usefy/use-throttle@0.0.36
  - @usefy/use-throttle-callback@0.0.36
  - @usefy/use-timer@0.0.36
  - @usefy/use-toggle@0.0.36
  - @usefy/use-unmount@0.0.36

## 0.0.35

### Patch Changes

- Updated dependencies [30a0467]
  - @usefy/use-memory-monitor@0.0.35
  - @usefy/use-click-any-where@0.0.35
  - @usefy/use-copy-to-clipboard@0.0.35
  - @usefy/use-counter@0.0.35
  - @usefy/use-debounce@0.0.35
  - @usefy/use-debounce-callback@0.0.35
  - @usefy/use-event-listener@0.0.35
  - @usefy/use-geolocation@0.0.35
  - @usefy/use-init@0.0.35
  - @usefy/use-intersection-observer@0.0.35
  - @usefy/use-local-storage@0.0.35
  - @usefy/use-on-click-outside@0.0.35
  - @usefy/use-session-storage@0.0.35
  - @usefy/use-signal@0.0.35
  - @usefy/use-throttle@0.0.35
  - @usefy/use-throttle-callback@0.0.35
  - @usefy/use-timer@0.0.35
  - @usefy/use-toggle@0.0.35
  - @usefy/use-unmount@0.0.35

## 0.0.34

### Patch Changes

- dafb0af: ### Features

  - **Improved `requestGC` function**: Now attempts to call `globalThis.gc()` directly when available (Chrome with `--expose-gc` flag or Node.js), falling back to memory pressure hint if not available. Added descriptive console logging in dev mode.

  ### Documentation

  - Added `requestGC` to API Reference table in README
  - Added "Garbage Collection Request" section with usage example and platform-specific commands for enabling direct GC in Chrome (Windows/macOS/Linux)

  ### Bug Fixes

  - **Fixed RadialBarChart gauge accumulation bug in Storybook**: The mini gauge in the Usage card was incorrectly filling to 100% over time. Added `PolarAngleAxis` with `domain={[0, 100]}` to properly constrain the value range, ensuring the gauge accurately reflects the actual usage percentage.

- Updated dependencies [dafb0af]
  - @usefy/use-memory-monitor@0.0.34
  - @usefy/use-click-any-where@0.0.34
  - @usefy/use-copy-to-clipboard@0.0.34
  - @usefy/use-counter@0.0.34
  - @usefy/use-debounce@0.0.34
  - @usefy/use-debounce-callback@0.0.34
  - @usefy/use-event-listener@0.0.34
  - @usefy/use-geolocation@0.0.34
  - @usefy/use-init@0.0.34
  - @usefy/use-intersection-observer@0.0.34
  - @usefy/use-local-storage@0.0.34
  - @usefy/use-on-click-outside@0.0.34
  - @usefy/use-session-storage@0.0.34
  - @usefy/use-signal@0.0.34
  - @usefy/use-throttle@0.0.34
  - @usefy/use-throttle-callback@0.0.34
  - @usefy/use-timer@0.0.34
  - @usefy/use-toggle@0.0.34
  - @usefy/use-unmount@0.0.34

## 0.0.33

### Patch Changes

- 950197f: update README.md
- Updated dependencies [950197f]
  - @usefy/use-memory-monitor@0.0.33
  - @usefy/use-click-any-where@0.0.33
  - @usefy/use-copy-to-clipboard@0.0.33
  - @usefy/use-counter@0.0.33
  - @usefy/use-debounce@0.0.33
  - @usefy/use-debounce-callback@0.0.33
  - @usefy/use-event-listener@0.0.33
  - @usefy/use-geolocation@0.0.33
  - @usefy/use-init@0.0.33
  - @usefy/use-intersection-observer@0.0.33
  - @usefy/use-local-storage@0.0.33
  - @usefy/use-on-click-outside@0.0.33
  - @usefy/use-session-storage@0.0.33
  - @usefy/use-signal@0.0.33
  - @usefy/use-throttle@0.0.33
  - @usefy/use-throttle-callback@0.0.33
  - @usefy/use-timer@0.0.33
  - @usefy/use-toggle@0.0.33
  - @usefy/use-unmount@0.0.33

## 0.0.32

### Patch Changes

- 67af59f: add useMemoryMonitor
- Updated dependencies [67af59f]
  - @usefy/use-memory-monitor@0.0.32
  - @usefy/use-click-any-where@0.0.32
  - @usefy/use-copy-to-clipboard@0.0.32
  - @usefy/use-counter@0.0.32
  - @usefy/use-debounce@0.0.32
  - @usefy/use-debounce-callback@0.0.32
  - @usefy/use-event-listener@0.0.32
  - @usefy/use-geolocation@0.0.32
  - @usefy/use-init@0.0.32
  - @usefy/use-intersection-observer@0.0.32
  - @usefy/use-local-storage@0.0.32
  - @usefy/use-on-click-outside@0.0.32
  - @usefy/use-session-storage@0.0.32
  - @usefy/use-signal@0.0.32
  - @usefy/use-throttle@0.0.32
  - @usefy/use-throttle-callback@0.0.32
  - @usefy/use-timer@0.0.32
  - @usefy/use-toggle@0.0.32
  - @usefy/use-unmount@0.0.32

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
