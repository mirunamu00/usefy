# @usefy/use-focus-within

## 0.22.0

### Patch Changes

- @usefy/use-latest@0.22.0

## 0.21.1

### Patch Changes

- @usefy/use-latest@0.21.1

## 0.21.0

### Patch Changes

- @usefy/use-latest@0.21.0

## 0.20.0

### Patch Changes

- @usefy/use-latest@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-latest@0.19.0

## 0.18.0

### Patch Changes

- @usefy/use-latest@0.18.0

## 0.17.0

### Minor Changes

- ae97a69: feat(use-focus-within): add useFocusWithin hook for tracking focus within a subtree

  - Returns a `[ref, focused]` tuple — `focused` is `true` whenever keyboard focus is on the container or any descendant (reactive `:focus-within`).
  - Built on the bubbling `focusin`/`focusout` events; keeps `focused` steady when focus moves between descendants (no flicker) and only flips off when focus leaves the subtree.
  - Robust `relatedTarget: null` handling via a deferred `document.activeElement` re-check.
  - Optional `onFocus`/`onBlur` edge callbacks (stable via `@usefy/use-latest`), a stable callback ref, and SSR / StrictMode safety.
  - Also exports the `isFocusInside` predicate.

### Patch Changes

- @usefy/use-latest@0.17.0
