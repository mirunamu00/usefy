# @usefy/use-pagination

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
  - @usefy/use-controllable-state@1.0.0

## 0.25.1

### Patch Changes

- @usefy/use-controllable-state@0.25.1

## 0.25.0

### Patch Changes

- @usefy/use-controllable-state@0.25.0

## 0.24.0

### Patch Changes

- @usefy/use-controllable-state@0.24.0

## 0.23.0

### Patch Changes

- @usefy/use-controllable-state@0.23.0

## 0.22.0

### Patch Changes

- @usefy/use-controllable-state@0.22.0

## 0.21.1

### Patch Changes

- @usefy/use-controllable-state@0.21.1

## 0.21.0

### Patch Changes

- Updated dependencies [547ac84]
- Updated dependencies [ba7c5da]
  - @usefy/use-controllable-state@0.21.0

## 0.20.0

### Minor Changes

- 65b754f: feat(use-pagination): add usePagination hook for headless pagination state

  A headless pagination state machine: controlled/uncontrolled current page (built on `@usefy/use-controllable-state`), a derived `pageCount`, a slice-ready 0-based `range` (`{ start, end }`, end exclusive and clamped to `total`), and an ellipsis-aware `items` pager model (page numbers + `"ellipsis"` tokens) driven by `siblingCount`/`boundaryCount`. The page is clamped into `[1, pageCount]` everywhere; `setPage`/`next`/`prev`/`first`/`last` are identity-stable and skip no-op moves (no wasted renders, no spurious `onChange`). Exports `usePagination` plus the `getPageCount` and `buildPaginationRange` helpers.

### Patch Changes

- @usefy/use-controllable-state@0.20.0
