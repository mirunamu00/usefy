---
"@usefy/use-object-state": minor
"@usefy/hooks": minor
---

feat(use-object-state): add @usefy/use-object-state hook

Object state with immutable partial updates (patch/merge) and reset. Returns a
`useState`-style `[state, patch, reset]` tuple: `patch` shallow-merges a
`Partial<T>` (or a functional updater) immutably, and `reset()` restores the
captured initial value while `reset(next)` swaps in a provided object. `patch`
and `reset` are referentially stable, and the hook is SSR- and StrictMode-safe.
Re-exported from the `@usefy/hooks` umbrella.
