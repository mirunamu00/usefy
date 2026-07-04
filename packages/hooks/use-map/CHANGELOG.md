# @usefy/use-map

## 0.13.0

## 0.12.2

## 0.12.1

## 0.12.0

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.0

## 0.4.0

### Minor Changes

- c4305e9: feat(use-map): add useMap hook for Map state management

  Introduces `@usefy/use-map`, a hook for managing `Map` state with immutable updates:

  - Returns `[map, { set, setAll, remove, reset, clear, get }]` with a `ReadonlyMap` to prevent accidental in-place mutation
  - Immutable updates — every change produces a new `Map`; the initial value is copied and never mutated
  - Stable action identities, safe to use as effect dependencies
  - `useState`-style lazy initialization (accepts a `Map`, tuples, or a factory)
  - No-op skipping (absent-key removal, empty clear, same-value set) to avoid needless re-renders
  - Full TypeScript generics `<K, V>`

  Also re-exported from the `@usefy/hooks` umbrella package.
