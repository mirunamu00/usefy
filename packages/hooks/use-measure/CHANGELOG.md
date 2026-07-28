# @usefy/use-measure

## 1.1.0

### Patch Changes

- @usefy/use-resize-observer@1.1.0

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
  - @usefy/use-resize-observer@1.0.0

## 0.25.1

### Patch Changes

- @usefy/use-resize-observer@0.25.1

## 0.25.0

### Patch Changes

- @usefy/use-resize-observer@0.25.0

## 0.24.0

### Patch Changes

- @usefy/use-resize-observer@0.24.0

## 0.23.0

### Patch Changes

- @usefy/use-resize-observer@0.23.0

## 0.22.0

### Patch Changes

- @usefy/use-resize-observer@0.22.0

## 0.21.1

### Patch Changes

- @usefy/use-resize-observer@0.21.1

## 0.21.0

### Patch Changes

- @usefy/use-resize-observer@0.21.0

## 0.20.0

### Patch Changes

- @usefy/use-resize-observer@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-resize-observer@0.19.0

## 0.18.0

### Patch Changes

- @usefy/use-resize-observer@0.18.0

## 0.17.0

### Patch Changes

- @usefy/use-resize-observer@0.17.0

## 0.16.0

### Patch Changes

- @usefy/use-resize-observer@0.16.0

## 0.15.0

### Patch Changes

- @usefy/use-resize-observer@0.15.0

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

- @usefy/use-resize-observer@0.14.0
