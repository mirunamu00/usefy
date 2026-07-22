# @usefy/use-scroll-lock

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
  - @usefy/use-isomorphic-layout-effect@1.0.0

## 0.25.1

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.25.1

## 0.25.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.25.0

## 0.24.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.24.0

## 0.23.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.23.0

## 0.22.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.22.0

## 0.21.1

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.21.1

## 0.21.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.21.0

## 0.20.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.19.0

## 0.18.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.18.0

## 0.17.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.17.0

## 0.16.0

### Minor Changes

- 2d11395: feat(use-scroll-lock): add useScrollLock hook to lock body scroll for modals, drawers, and menus

  - `const { lock, unlock, isLocked } = useScrollLock({ enabled? })`
  - Locks the page (`document.body`) scroll with `overflow: hidden` + scrollbar-width `padding-right` so content never shifts sideways
  - iOS-aware: pins the body with `position: fixed` (offset by the current scroll) and restores the scroll position with `window.scrollTo` on unlock, where `overflow: hidden` alone isn't enough
  - Shared module-level reference counter so N stacked locks apply the body styles once and restore the original inline styles only when the last lock is released
  - Per-instance idempotent, StrictMode/concurrent-safe (unmount always releases a held lock), and SSR-safe (`isLocked` is `false`, `lock`/`unlock` are no-ops on the server); `enabled` convenience to lock for a component's lifetime
  - Re-exported from `@usefy/hooks` (hook, the `isIOS` / `getScrollbarWidth` helpers, and the `UseScrollLockOptions`, `UseScrollLockReturn` types)

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.16.0
