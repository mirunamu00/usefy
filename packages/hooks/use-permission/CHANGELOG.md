# @usefy/use-permission

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

### Minor Changes

- 65b754f: feat(use-permission): add usePermission hook for Permissions API status with live updates

  - `usePermission(descriptor)` returns `{ state, status, isSupported, error }` — `state` is the raw `PermissionState` (or null), `status` is a coarse union (`idle`/`pending`/`granted`/`denied`/`prompt`/`unsupported`/`error`).
  - Subscribes to the `PermissionStatus` `change` event for live updates; race-safe async query and listener cleanup on unmount.
  - Accepts a superset of `PermissionDescriptor` so all permission names (`camera`, `microphone`, `push`, `midi`, …) typecheck.
  - Effect keyed on the descriptor's serialized contents, so inline literals don't re-query every render. SSR-safe (`unsupported` on the server).
