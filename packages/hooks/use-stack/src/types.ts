/**
 * Accepted initial value for {@link useStack}.
 *
 * Mirrors `useState`'s lazy-initializer support: pass an array, any iterable of
 * values, or a function returning one of those (evaluated once on mount). The
 * **last** element becomes the top of the stack (the next item to be popped).
 *
 * @template T - Element type.
 *
 * @example
 * ```ts
 * useStack<string>();                  // empty
 * useStack<string>(["a", "b"]);        // "b" is the top
 * useStack(new Set(["a", "b"]));       // any iterable works
 * useStack(() => expensiveInit());     // lazy
 * ```
 */
export type StackInitializer<T> = Iterable<T> | (() => Iterable<T>);

/**
 * Stable action handlers returned by {@link useStack}. Every function keeps a
 * stable identity across renders, so the actions object is safe to use as a
 * `useEffect`/`useMemo` dependency.
 *
 * @template T - Element type.
 */
export interface UseStackActions<T> {
  /**
   * Push one or more items onto the top of the stack. Items are pushed in
   * argument order, so the **last** argument ends up on top. Calling with no
   * arguments is a no-op and does not trigger a re-render.
   */
  push: (...items: T[]) => void;

  /**
   * Pop the top item: remove it from the stack and return it. Returns
   * `undefined` when the stack is empty (in which case it is a no-op and does
   * not trigger a re-render).
   *
   * The returned value reflects the top of the stack at call time. When `pop`
   * is called multiple times synchronously within the same event (before React
   * re-renders), each call returns the same top snapshot even though the
   * underlying state correctly shrinks — read the returned `stack` array after
   * the render for the settled state.
   */
  pop: () => T | undefined;

  /**
   * Peek at the top item (the next item that `pop` would return) without
   * mutating the stack. Returns `undefined` when the stack is empty. Stable
   * across renders and always reflects the latest state.
   */
  peek: () => T | undefined;

  /**
   * Remove every item. Clearing an already-empty stack is a no-op.
   */
  clear: () => void;

  /**
   * Reset the stack back to the initial value provided at mount (a fresh copy,
   * so later mutations never affect the stored initial).
   */
  reset: () => void;
}

/**
 * Return type of {@link useStack}: a tuple of the current (read-only) stack and
 * the stable action handlers.
 *
 * The stack is typed as `readonly T[]` on purpose — mutating it directly (e.g.
 * `stack.push(...)`) would bypass React state and break immutability, so the
 * type steers callers to the actions instead. Read access works as usual:
 * `stack[stack.length - 1]` is the top, `stack[0]` is the bottom, and
 * `stack.length` is the size.
 *
 * @template T - Element type.
 */
export type UseStackReturn<T> = [readonly T[], UseStackActions<T>];
