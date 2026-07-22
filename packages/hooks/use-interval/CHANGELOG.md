# @usefy/use-interval

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

### Minor Changes

- 8a27e82: Retroactive enterprise-quality audit of the pre-existing (v0.9.x) hooks, plus a
  new `@usefy/use-interval` package. (`@usefy/*` is a fixed changeset group, so the
  whole set bumps together.)

  **New**

  - `@usefy/use-interval` — declarative `setInterval` with `start`/`stop`/`toggle`
    controls, an `isRunning` flag, `immediate`/`autoStart` options, a latest-callback
    ref, `null`-delay disable, automatic cleanup, and StrictMode/SSR safety. Wired
    into `@usefy/hooks`, with a Storybook story and README. (It was previously a
    spec-only stub.)

  **Correctness / SSR / StrictMode fixes**

  - `use-local-storage` / `use-session-storage`: fixed an infinite render loop on a
    corrupt value under an object/array initial (getSnapshot now keys its cache on
    the real raw string); moved `onError` out of the render phase to a deduped
    post-commit effect; added no-op-skip on `setValue`, memoized the server
    snapshot, and handled cross-tab `localStorage.clear()`.
  - `use-window-size`: deterministic first render (initial values) to prevent a
    hydration mismatch; the real size is measured after mount without firing
    `onChange`.
  - `use-resize-observer`: **wired into the `@usefy/hooks` umbrella** (it was
    published individually but missing from the umbrella).
  - Assorted correctness/StrictMode/ref-stability/no-op-skip/SSR fixes and
    additional regression tests across many hooks (init, timer, queue, signal, step,
    key-press, hover, event-listener, geolocation, intersection-observer,
    click-any-where, unmount, counter, map, set, list, history-state, copy-to-clipboard,
    debounce/throttle, memory-monitor), plus story "Show code" and README accuracy
    corrections.

  **Umbrella / types**

  - `@usefy/hooks` now re-exports `useCounter`'s `UseCounterReturn`, use-timer's `ms`,
    and no longer leaks internal helpers (CircularBuffer/linearRegression/
    calculateTrend, isWindowAvailable).
