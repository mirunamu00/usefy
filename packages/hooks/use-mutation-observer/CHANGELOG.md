# @usefy/use-mutation-observer

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
