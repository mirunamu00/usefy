/**
 * Accepted initial value for {@link useQueue}.
 *
 * Mirrors `useState`'s lazy-initializer support: pass an array, any iterable of
 * values, or a function returning one of those (evaluated once on mount). The
 * first element becomes the front of the queue (the next item to be dequeued).
 *
 * @template T - Element type.
 *
 * @example
 * ```ts
 * useQueue<string>();                  // empty
 * useQueue<string>(["a", "b"]);        // "a" is the front
 * useQueue(new Set(["a", "b"]));       // any iterable works
 * useQueue(() => expensiveInit());     // lazy
 * ```
 */
export type QueueInitializer<T> = Iterable<T> | (() => Iterable<T>);

/**
 * Stable action handlers returned by {@link useQueue}. Every function keeps a
 * stable identity across renders, so the actions object is safe to use as a
 * `useEffect`/`useMemo` dependency.
 *
 * @template T - Element type.
 */
export interface UseQueueActions<T> {
  /**
   * Enqueue one or more items onto the back of the queue. Calling with no
   * arguments is a no-op and does not trigger a re-render.
   */
  add: (...items: T[]) => void;

  /**
   * Dequeue the front item: remove it from the queue and return it. Returns
   * `undefined` when the queue is empty (in which case it is a no-op and does
   * not trigger a re-render).
   *
   * The queue advances synchronously, so calling `remove` multiple times in a
   * row within the same event (before React re-renders) dequeues successive
   * items: the first call returns the current front, the second returns the
   * next item, and so on. The returned `queue` array reflects the settled state
   * after the render.
   */
  remove: () => T | undefined;

  /**
   * Peek at the front item (the next item that `remove` would return) without
   * mutating the queue. Returns `undefined` when the queue is empty. Stable
   * across renders and always reflects the latest state.
   */
  peek: () => T | undefined;

  /**
   * Remove every item. Clearing an already-empty queue is a no-op.
   */
  clear: () => void;

  /**
   * Reset the queue back to the initial value provided at mount (a fresh copy,
   * so later mutations never affect the stored initial).
   */
  reset: () => void;
}

/**
 * Return type of {@link useQueue}: a tuple of the current (read-only) queue and
 * the stable action handlers.
 *
 * The queue is typed as `readonly T[]` on purpose — mutating it directly (e.g.
 * `queue.push(...)`) would bypass React state and break immutability, so the
 * type steers callers to the actions instead. Read access works as usual:
 * `queue[0]` is the front, `queue[queue.length - 1]` is the back, and
 * `queue.length` is the size.
 *
 * @template T - Element type.
 */
export type UseQueueReturn<T> = [readonly T[], UseQueueActions<T>];
