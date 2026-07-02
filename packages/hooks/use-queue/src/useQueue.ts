import { useCallback, useMemo, useRef, useState } from "react";
import type {
  QueueInitializer,
  UseQueueActions,
  UseQueueReturn,
} from "./types";

/**
 * Resolve a {@link QueueInitializer} to a concrete array. A function
 * initializer is invoked once; any iterable is copied into a fresh array so the
 * caller's original object is never mutated.
 */
function resolveInitial<T>(initial?: QueueInitializer<T>): T[] {
  const value = typeof initial === "function" ? initial() : initial;
  return value ? [...value] : [];
}

/**
 * A React hook for managing a FIFO (first-in, first-out) queue as React state
 * with immutable, ergonomic updates.
 *
 * Returns a tuple of the current (read-only) queue and a stable set of actions.
 * The front of the queue is index `0` (the next item to be dequeued) and new
 * items are appended to the back. Every mutation produces a brand-new array so
 * React re-renders correctly and the previous state is never mutated in place.
 * Updates that would not change anything (adding nothing, removing from or
 * clearing an empty queue) are skipped to avoid needless re-renders.
 *
 * Features:
 * - Immutable updates (new array on every change) with a `readonly T[]` return type
 * - FIFO semantics: `add` enqueues to the back, `remove` dequeues from the front
 * - `remove` returns the dequeued item (or `undefined` when empty)
 * - `peek` reads the front item without mutating; stable and always current
 * - Stable action identities — safe to use as effect dependencies
 * - `useState`-style lazy initialization; accepts an array, iterable, or factory
 * - Full TypeScript generics for the element type
 *
 * Reading `first` / `last` / `size` is done directly on the returned queue:
 * `queue[0]`, `queue[queue.length - 1]`, and `queue.length` respectively.
 *
 * @template T - Element type.
 * @param initialState - Initial items, or a factory returning them. Defaults to empty.
 * @returns `[queue, { add, remove, peek, clear, reset }]`
 *
 * @example
 * ```tsx
 * interface Task { id: number; label: string }
 *
 * function TaskRunner() {
 *   const [queue, { add, remove, peek }] = useQueue<Task>([]);
 *
 *   const processNext = () => {
 *     const task = remove(); // dequeue + get the item in one call
 *     if (task) runTask(task);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => add({ id: Date.now(), label: "New" })}>
 *         Add task
 *       </button>
 *       <button onClick={processNext} disabled={queue.length === 0}>
 *         Process next{peek() ? ` (${peek()!.label})` : ""}
 *       </button>
 *       <p>Pending: {queue.length}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Batch enqueue, drain from the front, reset
 * const [q, { add, remove, reset }] = useQueue<number>([1, 2]);
 * add(3, 4);        // queue: [1, 2, 3, 4]
 * remove();         // returns 1, queue: [2, 3, 4]
 * reset();          // back to [1, 2]
 * ```
 */
export function useQueue<T>(
  initialState?: QueueInitializer<T>
): UseQueueReturn<T> {
  // Resolve the initial queue exactly once and keep it for `reset`.
  const initialRef = useRef<T[] | null>(null);
  if (initialRef.current === null) {
    initialRef.current = resolveInitial(initialState);
  }

  const [queue, setQueue] = useState<T[]>(() => [
    ...(initialRef.current as T[]),
  ]);

  // Mirror the latest queue so `remove`/`peek` can be stable callbacks that
  // still read fresh state.
  const queueStateRef = useRef(queue);
  queueStateRef.current = queue;

  const add = useCallback((...items: T[]) => {
    setQueue((prev) => (items.length === 0 ? prev : [...prev, ...items]));
  }, []);

  const remove = useCallback((): T | undefined => {
    // Capture the front from the mirrored state so we can return it.
    const front = queueStateRef.current[0];
    setQueue((prev) => (prev.length === 0 ? prev : prev.slice(1)));
    return front;
  }, []);

  const peek = useCallback((): T | undefined => queueStateRef.current[0], []);

  const clear = useCallback(() => {
    setQueue((prev) => (prev.length === 0 ? prev : []));
  }, []);

  const reset = useCallback(() => {
    setQueue([...(initialRef.current as T[])]);
  }, []);

  const actions = useMemo<UseQueueActions<T>>(
    () => ({ add, remove, peek, clear, reset }),
    [add, remove, peek, clear, reset]
  );

  return [queue, actions];
}
