---
"@usefy/use-async": minor
"@usefy/hooks": minor
---

feat(use-async): add useAsync hook for the full lifecycle of a single async task

The object-style, abortable sibling of `useAsyncFn`. Returns
`{ data, error, status, isLoading, execute, reset }` with the same state shape
(`status` is the source of truth; `data` retained on error). Adds the three
things a self-contained data-load needs on top of `useAsyncFn`: it runs itself
on mount (`immediate`, default `true`), passes your function an `AbortSignal`
as its first argument so obsolete requests are truly cancelled
(`fetch(url, { signal })`), and can be `reset()` back to idle. `execute` aborts
the previous in-flight request when a new one starts; `reset()` and unmount
abort too. A monotonic call-id stale-guard backs up the abort so a superseded
call never updates state. `execute`/`reset` are referentially stable and
`execute` never rejects (errors surface via `state.error`). SSR-safe (immediate
never runs during server render) and StrictMode-safe (the first auto-run is
aborted, the second wins). Reuses the shared `AsyncStatus`/`AsyncState`/`AsyncFn`
types from `@usefy/use-async-fn`. Deliberately not a query cache.
