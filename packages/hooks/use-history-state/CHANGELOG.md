# @usefy/use-history-state

## 0.8.0

### Minor Changes

- 41e74f7: Add `useHistoryState` — a hook for state with built-in undo/redo history (time travel). Records each `set` (value or updater) on an immutable timeline; navigate with `undo`/`redo`/`goTo`, read `canUndo`/`canRedo`, and inspect the full `history` array + `currentIndex`. Includes an optional `limit` to bound memory (oldest entries drop off the front), `clear`/`reset`, no-op skipping, and stable control identities that are safe as effect dependencies.
