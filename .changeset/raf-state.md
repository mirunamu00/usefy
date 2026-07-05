---
"@usefy/use-raf-state": minor
"@usefy/hooks": minor
---

feat(use-raf-state): add useRafState hook — a useState replacement that batches updates to requestAnimationFrame

- Drop-in `useState` API: direct value or lazy `() => T` init, value-or-updater setter
- Batches updates to `requestAnimationFrame`, coalescing rapid scroll/resize/pointer/animation updates to at most one commit per frame (**last-write-wins**)
- Stable setter (`useCallback([])`), cancels the pending frame on unmount
- SSR-safe (synchronous fallback when rAF is unavailable) and StrictMode / concurrent-safe
