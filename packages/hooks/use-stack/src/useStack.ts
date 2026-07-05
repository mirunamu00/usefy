import { useCallback, useMemo, useRef, useState } from "react";
import type {
  StackInitializer,
  UseStackActions,
  UseStackReturn,
} from "./types";

/**
 * Resolve a {@link StackInitializer} to a concrete array. A function
 * initializer is invoked once; any iterable is copied into a fresh array so the
 * caller's original object is never mutated.
 */
function resolveInitial<T>(initial?: StackInitializer<T>): T[] {
  const value = typeof initial === "function" ? initial() : initial;
  return value ? [...value] : [];
}

/**
 * A React hook for managing a LIFO (last-in, first-out) stack as React state
 * with immutable, ergonomic updates.
 *
 * The LIFO sibling of {@link https://npmjs.com/package/@usefy/use-queue | useQueue}
 * — identical in shape and conventions, but pushes and pops from the same end.
 *
 * Returns a tuple of the current (read-only) stack and a stable set of actions.
 * The **top** of the stack is the last element (`stack[stack.length - 1]`, the
 * next item to be popped) and new items are pushed onto the end. Every mutation
 * produces a brand-new array so React re-renders correctly and the previous
 * state is never mutated in place. Updates that would not change anything
 * (pushing nothing, popping from or clearing an empty stack) are skipped to
 * avoid needless re-renders.
 *
 * Features:
 * - Immutable updates (new array on every change) with a `readonly T[]` return type
 * - LIFO semantics: `push` and `pop` both operate on the top (the array's end)
 * - `pop` returns the popped item (or `undefined` when empty)
 * - `peek` reads the top item without mutating; stable and always current
 * - Stable action identities — safe to use as effect dependencies
 * - `useState`-style lazy initialization; accepts an array, iterable, or factory
 * - Full TypeScript generics for the element type
 *
 * Reading `top` / `bottom` / `size` is done directly on the returned stack:
 * `stack[stack.length - 1]`, `stack[0]`, and `stack.length` respectively.
 *
 * @template T - Element type.
 * @param initialState - Initial items, or a factory returning them. Defaults to empty.
 * @returns `[stack, { push, pop, peek, clear, reset }]`
 *
 * @example
 * ```tsx
 * // An undo / navigation history stack
 * interface Snapshot { id: number; label: string }
 *
 * function Editor() {
 *   const [history, { push, pop, peek }] = useStack<Snapshot>([]);
 *
 *   const undo = () => {
 *     const last = pop(); // remove + read the most recent change in one call
 *     if (last) restore(last);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => push({ id: Date.now(), label: "Edit" })}>
 *         Record change
 *       </button>
 *       <button onClick={undo} disabled={history.length === 0}>
 *         Undo{peek() ? ` (${peek()!.label})` : ""}
 *       </button>
 *       <p>History depth: {history.length}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Push, pop from the top (LIFO), reset
 * const [s, { push, pop, reset }] = useStack<number>([1, 2]);
 * push(3, 4);       // stack: [1, 2, 3, 4] (4 is the top)
 * pop();            // returns 4, stack: [1, 2, 3]
 * reset();          // back to [1, 2]
 * ```
 */
export function useStack<T>(
  initialState?: StackInitializer<T>
): UseStackReturn<T> {
  // Resolve the initial stack exactly once and keep it for `reset`.
  const initialRef = useRef<T[] | null>(null);
  if (initialRef.current === null) {
    initialRef.current = resolveInitial(initialState);
  }

  const [stack, setStack] = useState<T[]>(() => [
    ...(initialRef.current as T[]),
  ]);

  // Mirror the latest stack so `pop`/`peek` can be stable callbacks that still
  // read fresh state.
  const stackStateRef = useRef(stack);
  stackStateRef.current = stack;

  const push = useCallback((...items: T[]) => {
    setStack((prev) => (items.length === 0 ? prev : [...prev, ...items]));
  }, []);

  const pop = useCallback((): T | undefined => {
    // Capture the top from the mirrored state so we can return it.
    const top = stackStateRef.current[stackStateRef.current.length - 1];
    setStack((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
    return top;
  }, []);

  const peek = useCallback(
    (): T | undefined =>
      stackStateRef.current[stackStateRef.current.length - 1],
    []
  );

  const clear = useCallback(() => {
    setStack((prev) => (prev.length === 0 ? prev : []));
  }, []);

  const reset = useCallback(() => {
    setStack([...(initialRef.current as T[])]);
  }, []);

  const actions = useMemo<UseStackActions<T>>(
    () => ({ push, pop, peek, clear, reset }),
    [push, pop, peek, clear, reset]
  );

  return [stack, actions];
}
