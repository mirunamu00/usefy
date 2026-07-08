# @usefy/use-scroll-position

## 0.22.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.22.0
- @usefy/use-latest@0.22.0

## 0.21.1

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.21.1
- @usefy/use-latest@0.21.1

## 0.21.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.21.0
- @usefy/use-latest@0.21.0

## 0.20.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.20.0
- @usefy/use-latest@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.19.0
- @usefy/use-latest@0.19.0

## 0.18.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.18.0
- @usefy/use-latest@0.18.0

## 0.17.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.17.0
- @usefy/use-latest@0.17.0

## 0.16.0

### Minor Changes

- 2d11395: feat(use-scroll-position): add useScrollPosition hook for tracking the throttled scroll offset of the window or an element

  - `const { x, y } = useScrollPosition({ element?, throttleMs? })`
  - Tracks the window/document scroll by default, or a given `HTMLElement` / `RefObject<HTMLElement>`
  - Leading + trailing throttle (default 100ms; `0` disables) so the settled resting position is never dropped
  - Synchronous initial read on mount via `useIsomorphicLayoutEffect`, `{ passive: true }` listener, SSR-safe (`{ x: 0, y: 0 }`) and StrictMode-safe with listener/timer cleanup on unmount and target change
  - Re-exported from `@usefy/hooks` (hook, `ZERO_SCROLL_POSITION`, and the `ScrollPosition`, `ScrollPositionTarget`, `UseScrollPositionOptions`, `UseScrollPositionReturn` types)

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.16.0
- @usefy/use-latest@0.16.0
