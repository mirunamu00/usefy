# @usefy/use-async-fn

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
