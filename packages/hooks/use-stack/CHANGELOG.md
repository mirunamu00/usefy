# @usefy/use-stack

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

## 0.21.1

## 0.21.0

## 0.20.0

## 0.19.0

### Minor Changes

- f561890: feat(use-stack): add @usefy/use-stack hook

  A LIFO (last-in, first-out) stack as React state — the LIFO sibling of
  `@usefy/use-queue`, identical in shape but `push` and `pop` both operate on the
  top (the array's end). Returns a `[stack, { push, pop, peek, clear, reset }]`
  tuple with a `readonly T[]` collection. `push` is variadic and appends to the
  top, `pop` removes and returns the top item (`undefined` + no-op when empty),
  `peek` reads the top without mutating, and no-op updates (empty `push`, and
  `pop`/`clear` on an empty stack) are skipped to avoid needless re-renders.
  Every mutation produces a new array (the previous state is never mutated), all
  actions are referentially stable, initialization supports arrays/iterables/lazy
  factories, and the hook is SSR- and StrictMode-safe. Re-exported from the
  `@usefy/hooks` umbrella.
