# @usefy/use-selection

## 1.1.0

## 1.0.0

### Major Changes

- 8924240: usefy 1.0.0 — first stable release.

  All `@usefy/*` packages graduate to a stable **1.0.0** together (they share a
  fixed-version group). No API changes are required by this bump — it marks the
  public API as stable and ready for production semver guarantees.

  Also adds a `homepage` field to every published package, pointing at its page on
  the docs site (https://usefy-web.vercel.app) so the npm listing links straight
  to live docs.

## 0.25.1

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

## 0.20.0

## 0.19.0

### Minor Changes

- f561890: feat(use-selection): add useSelection hook for multi/single selection state in lists and tables

  Set-backed selection for checkbox lists and data tables. Stores keys (via a
  `getKey` option, default identity for primitives), so a selection survives new
  item identities across renders. Returns `selected` items (derived from the
  current `items`), `isSelected`/`toggle`/`select`/`deselect`/`selectAll`/`clear`,
  and `isAllSelected`/`isPartiallySelected`/`isNoneSelected` flags for an
  indeterminate header checkbox. Supports a single-selection mode
  (`multiple: false`) that replaces the selection. Item-facing values reconcile
  automatically when `items` changes; immutable Set updates, stable actions,
  no-op skipping, and SSR/StrictMode safe.
