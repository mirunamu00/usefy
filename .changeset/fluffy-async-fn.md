---
"@usefy/use-async-fn": minor
"@usefy/hooks": minor
---

feat(use-async-fn): add useAsyncFn hook for manual-trigger async lifecycle tracking

The manual-trigger core for running a single async function and tracking its
lifecycle. Returns a `[state, run]` tuple — `state` is `{ data, error, status, isLoading }`
and `run(...args)` forwards its arguments to the wrapped function. Features
race-safe stale-response guarding (only the latest call updates state),
unmount safety, a referentially-stable `run` that reads the latest inline `fn`
through a ref, and a resolve-never-reject contract (errors surface via
`state.error`). SSR-safe and StrictMode-safe. Foundation for the upcoming
`useAsync` hook.
