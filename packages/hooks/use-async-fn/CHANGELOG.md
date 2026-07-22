# @usefy/use-async-fn

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
  - @usefy/use-latest@1.0.0

## 0.25.1

### Patch Changes

- @usefy/use-latest@0.25.1

## 0.25.0

### Patch Changes

- @usefy/use-latest@0.25.0

## 0.24.0

### Patch Changes

- @usefy/use-latest@0.24.0

## 0.23.0

### Patch Changes

- @usefy/use-latest@0.23.0

## 0.22.0

### Patch Changes

- @usefy/use-latest@0.22.0

## 0.21.1

### Patch Changes

- @usefy/use-latest@0.21.1

## 0.21.0

### Patch Changes

- @usefy/use-latest@0.21.0

## 0.20.0

### Patch Changes

- @usefy/use-latest@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-latest@0.19.0

## 0.18.0

### Minor Changes

- 2e53177: feat(use-async-fn): add useAsyncFn hook for manual-trigger async lifecycle tracking

  The manual-trigger core for running a single async function and tracking its
  lifecycle. Returns a `[state, run]` tuple — `state` is `{ data, error, status, isLoading }`
  and `run(...args)` forwards its arguments to the wrapped function. Features
  race-safe stale-response guarding (only the latest call updates state),
  unmount safety, a referentially-stable `run` that reads the latest inline `fn`
  through a ref, and a resolve-never-reject contract (errors surface via
  `state.error`). SSR-safe and StrictMode-safe. Foundation for the upcoming
  `useAsync` hook.

### Patch Changes

- @usefy/use-latest@0.18.0
