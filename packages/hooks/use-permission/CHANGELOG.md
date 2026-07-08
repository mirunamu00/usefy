# @usefy/use-permission

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
