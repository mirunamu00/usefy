# @usefy/use-mutation-observer

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

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

### Minor Changes

- f439fb6: Add `@usefy/use-mutation-observer` — a React hook wrapping the DOM `MutationObserver` API to watch an element for child, attribute, and character-data mutations.

  - Callback-`ref` API (`const { ref } = useMutationObserver(options)`); attaching a node observes it, `null` disconnects.
  - Full `MutationObserverInit` surface (`childList`, `attributes`, `attributeFilter`, `attributeOldValue`, `characterData`, `characterDataOldValue`, `subtree`) with a sensible `childList: true` default so `observe()` never throws.
  - React via the `onMutation` callback, the reactive `records` state, or both; `updateState: false` for a zero-re-render callback-only mode.
  - `enabled` toggle plus manual `observe` / `disconnect` / `takeRecords` controls.
  - `onMutation` is stored in a ref so changing its identity never re-registers the observer; SSR-safe and StrictMode/concurrent-safe.
  - Re-exported from the `@usefy/hooks` umbrella.
