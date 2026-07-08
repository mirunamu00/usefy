# @usefy/use-object-state

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

## 0.20.0

## 0.19.0

### Minor Changes

- f561890: feat(use-object-state): add @usefy/use-object-state hook

  Object state with immutable partial updates (patch/merge) and reset. Returns a
  `useState`-style `[state, patch, reset]` tuple: `patch` shallow-merges a
  `Partial<T>` (or a functional updater) immutably, and `reset()` restores the
  captured initial value while `reset(next)` swaps in a provided object. `patch`
  and `reset` are referentially stable, and the hook is SSR- and StrictMode-safe.
  Re-exported from the `@usefy/hooks` umbrella.
