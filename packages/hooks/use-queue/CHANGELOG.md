# @usefy/use-queue

## 0.12.1

## 0.12.0

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

### Minor Changes

- e42e45c: Add `useQueue` — a hook for managing FIFO queue state with immutable updates. Enqueue to the back with `add` (variadic), dequeue from the front with `remove` (which returns the removed item), inspect the front with `peek`, plus `clear` and `reset`. Returns a `[queue, actions]` tuple with a `readonly T[]` value, stable action identities, lazy initialization, and no-op skipping — consistent with `useMap`/`useSet`/`useList`.
