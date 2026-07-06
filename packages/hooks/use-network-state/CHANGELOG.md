# @usefy/use-network-state

## 0.20.0

### Minor Changes

- 65b754f: feat(use-network-state): add useNetworkState hook for online/offline + Network Information

  Adds `@usefy/use-network-state`, a hook that combines `navigator.onLine` with the
  Network Information API (`navigator.connection`) into one reactive snapshot:
  `{ online, since, downlink, downlinkMax, effectiveType, rtt, saveData, type }`.

  - Built on `useSyncExternalStore` — tear-free under concurrent rendering and
    SSR-safe (returns `{ online: true }` on the server, no hydration mismatch).
  - Subscribes to the window `online`/`offline` events and the connection `change`
    event, with `mozConnection`/`webkitConnection` fallbacks.
  - Degrades gracefully: every Network Information field is `undefined` where the
    API is unsupported (Firefox, Safari); `online` always works and it never throws.
  - Exports the `NetworkState` return type plus the `EffectiveConnectionType` and
    `ConnectionType` unions, and helpers (`getNetworkState`, `getConnection`,
    `isNetworkInformationSupported`, `areNetworkStatesEqual`, `SERVER_NETWORK_STATE`).
  - Re-exported from the `@usefy/hooks` umbrella.
