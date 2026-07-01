# @usefy/use-list

## 0.6.0

### Minor Changes

- 0439340: feat(use-list): add useList hook for array state management

  Introduces `@usefy/use-list`, a hook for managing array state with immutable updates:

  - Returns `[list, { set, push, filter, sort, clear, removeAt, insertAt, updateAt, reset }]` with a `readonly T[]` to prevent accidental in-place mutation
  - Immutable updates — every change produces a new array; the initial value is copied and never mutated
  - `set` accepts a new array or an updater function; `sort` is immutable (`[...prev].sort()`)
  - Stable action identities, safe to use as effect dependencies
  - `useState`-style lazy initialization (accepts an array/iterable or a factory)
  - No-op skipping (out-of-range index, empty clear, unchanged value, filtering out nothing) to avoid needless re-renders
  - Full TypeScript generics `<T>`

  Also re-exported from the `@usefy/hooks` umbrella package.
