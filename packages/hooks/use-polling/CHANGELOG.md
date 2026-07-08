# @usefy/use-polling

## 0.22.0

### Patch Changes

- @usefy/use-async@0.22.0
- @usefy/use-async-fn@0.22.0
- @usefy/use-latest@0.22.0

## 0.21.1

### Patch Changes

- @usefy/use-async@0.21.1
- @usefy/use-async-fn@0.21.1
- @usefy/use-latest@0.21.1

## 0.21.0

### Patch Changes

- @usefy/use-async@0.21.0
- @usefy/use-async-fn@0.21.0
- @usefy/use-latest@0.21.0

## 0.20.0

### Patch Changes

- @usefy/use-async@0.20.0
- @usefy/use-async-fn@0.20.0
- @usefy/use-latest@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-async@0.19.0
- @usefy/use-async-fn@0.19.0
- @usefy/use-latest@0.19.0

## 0.18.0

### Minor Changes

- 2e53177: feat(use-polling): add usePolling hook to poll an async function on an interval

  Polls `fn` on an interval and exposes the latest result with the same state
  shape as the async siblings (`{ data, error, status, isLoading }`; `status` is
  the source of truth, `isLoading === "pending"`, `data` retained on error) plus
  polling-loop control: `isPolling` and imperative `pause`/`resume` (with
  `start`/`stop` aliases). The next tick is scheduled **only after** the current
  poll settles — a self-rescheduling `setTimeout`, never a stacking `setInterval` —
  so a `fn` slower than the interval can never overlap in-flight requests.
  `enabled` (default `true`) is the declarative master gate; `pause`/`resume` are
  the imperative override within it (`isPolling === enabled && !paused`).
  `immediate` (default `true`) polls right away vs. after one interval. Optional
  **exponential backoff** grows the delay on consecutive failures (`true`,
  `{ factor, maxInterval }`, or a custom `(failures, base) => ms`) and resets on
  success. The `fn` receives an `AbortSignal` first (`AsyncFnWithSignal`); the
  in-flight poll is aborted on pause/stop/`enabled:false`/unmount, backed by a
  stale-guard. A changed `interval`/`args`/inline `fn` applies on the next tick
  without restarting the loop. Standalone minimal state machine that reuses the
  shared `AsyncState`/`AsyncStatus`/`AsyncFnWithSignal` types from
  `@usefy/use-async-fn` and `@usefy/use-async` for family consistency. SSR-safe and
  StrictMode-safe (exactly one self-scheduling loop — no runaway duplicate timers).

### Patch Changes

- Updated dependencies [2e53177]
- Updated dependencies [2e53177]
  - @usefy/use-async-fn@0.18.0
  - @usefy/use-async@0.18.0
  - @usefy/use-latest@0.18.0
