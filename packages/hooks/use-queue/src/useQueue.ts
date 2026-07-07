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

  // The mirror ref is the single source of truth for every mutator: each action
  // reads and advances it synchronously (in event handlers only, never during
  // render) so returned values and multi-call interleaving stay consistent even
  // before React commits the next render. We intentionally use plain-value
  // `setQueue` (not an updater) so the ref and committed state never diverge.
  const queueStateRef = useRef(queue);

  const add = useCallback((...items: T[]) => {
    if (items.length === 0) return; // no-op: keep the same reference
    const next = [...queueStateRef.current, ...items];
    queueStateRef.current = next;
    setQueue(next);
  }, []);

  const remove = useCallback((): T | undefined => {
    const cur = queueStateRef.current;
    if (cur.length === 0) return undefined; // no-op when empty
    const front = cur[0];
    const next = cur.slice(1);
    queueStateRef.current = next;
    setQueue(next);
    return front;
  }, []);

  const peek = useCallback((): T | undefined => queueStateRef.current[0], []);

  const clear = useCallback(() => {
    if (queueStateRef.current.length === 0) return; // no-op when already empty
    const next: T[] = [];
    queueStateRef.current = next;
    setQueue(next);
  }, []);

  const reset = useCallback(() => {
    const initial = initialRef.current as T[];
    const cur = queueStateRef.current;
    // Bail when the queue already equals the initial value: no new array, no
    // re-render.
    if (
      cur.length === initial.length &&
      cur.every((v, i) => Object.is(v, initial[i]))
    ) {
      return;
    }
    const next = [...initial];
    queueStateRef.current = next;
    setQueue(next);
  }, []);

  const actions = useMemo<UseQueueActions<T>>(
    () => ({ add, remove, peek, clear, reset }),
    [add, remove, peek, clear, reset]
  );

  return [queue, actions];
}
