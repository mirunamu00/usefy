# @usefy/use-set

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

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

### Minor Changes

- 2dc4d63: feat(use-set): add useSet hook for Set state management

  Introduces `@usefy/use-set`, a hook for managing `Set` state with immutable updates:

  - Returns `[set, { add, remove, toggle, has, clear, reset }]` with a `ReadonlySet` to prevent accidental in-place mutation
  - Immutable updates — every change produces a new `Set`; the initial value is copied and never mutated
  - `toggle(value, force?)` supports an optional force argument (like `DOMTokenList.toggle`)
  - Stable action identities, safe to use as effect dependencies
  - `useState`-style lazy initialization (accepts a `Set`, an iterable, or a factory)
  - No-op skipping (existing add, absent remove, empty clear) to avoid needless re-renders
  - Full TypeScript generics `<T>`

  Also re-exported from the `@usefy/hooks` umbrella package.
