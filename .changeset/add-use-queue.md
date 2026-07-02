---
"@usefy/use-queue": minor
"@usefy/hooks": minor
---

Add `useQueue` — a hook for managing FIFO queue state with immutable updates. Enqueue to the back with `add` (variadic), dequeue from the front with `remove` (which returns the removed item), inspect the front with `peek`, plus `clear` and `reset`. Returns a `[queue, actions]` tuple with a `readonly T[]` value, stable action identities, lazy initialization, and no-op skipping — consistent with `useMap`/`useSet`/`useList`.
