# @usefy/use-focus-within

## 1.0.0

### Major Changes

- 8924240: usefy 1.0.0 — first stable release.

  All `@usefy/*` packages graduate to a stable **1.0.0** together (they share a
  fixed-version group). No API changes are required by this bump — it marks the
  public API as stable and ready for production semver guarantees.

  Also adds a `homepage` field to every published package, pointing at its page on
  the docs site (https://usefy-web.vercel.app) so the npm listing links straight
  to live docs.

### Patch Changes

- Updated dependencies [8924240]
  - @usefy/use-latest@1.0.0

## 0.25.1

### Patch Changes

- @usefy/use-latest@0.25.1

## 0.25.0

### Patch Changes

- @usefy/use-latest@0.25.0

## 0.24.0

### Patch Changes

- @usefy/use-latest@0.24.0

## 0.23.0

### Patch Changes

- @usefy/use-latest@0.23.0

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
