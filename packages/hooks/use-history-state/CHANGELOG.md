# @usefy/use-history-state

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

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

### Minor Changes

- 41e74f7: Add `useHistoryState` — a hook for state with built-in undo/redo history (time travel). Records each `set` (value or updater) on an immutable timeline; navigate with `undo`/`redo`/`goTo`, read `canUndo`/`canRedo`, and inspect the full `history` array + `currentIndex`. Includes an optional `limit` to bound memory (oldest entries drop off the front), `clear`/`reset`, no-op skipping, and stable control identities that are safe as effect dependencies.
