---
"@usefy/use-stack": minor
"@usefy/hooks": minor
---

feat(use-stack): add @usefy/use-stack hook

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
