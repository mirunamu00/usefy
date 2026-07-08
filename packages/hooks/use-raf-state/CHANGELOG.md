# @usefy/use-raf-state

## 0.25.0

### Patch Changes

- @usefy/use-unmount@0.25.0

## 0.24.0

### Patch Changes

- @usefy/use-unmount@0.24.0

## 0.23.0

### Patch Changes

- @usefy/use-unmount@0.23.0

## 0.22.0

### Patch Changes

- @usefy/use-unmount@0.22.0

## 0.21.1

### Patch Changes

- @usefy/use-unmount@0.21.1

## 0.21.0

### Patch Changes

- Updated dependencies [ba7c5da]
  - @usefy/use-unmount@0.21.0

## 0.20.0

### Patch Changes

- @usefy/use-unmount@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-unmount@0.19.0

## 0.18.0

### Minor Changes

- 2e53177: feat(use-raf-state): add useRafState hook — a useState replacement that batches updates to requestAnimationFrame

  - Drop-in `useState` API: direct value or lazy `() => T` init, value-or-updater setter
  - Batches updates to `requestAnimationFrame`, coalescing rapid scroll/resize/pointer/animation updates to at most one commit per frame (**last-write-wins**)
  - Stable setter (`useCallback([])`), cancels the pending frame on unmount
  - SSR-safe (synchronous fallback when rAF is unavailable) and StrictMode / concurrent-safe

### Patch Changes

- @usefy/use-unmount@0.18.0
