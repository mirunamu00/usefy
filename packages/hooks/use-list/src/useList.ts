import { useCallback, useMemo, useRef, useState } from "react";
import type {
  ListInitializer,
  UseListActions,
  UseListReturn,
} from "./types";

/**
 * Resolve a {@link ListInitializer} to a concrete array. A function initializer
 * is invoked once; any iterable is copied into a fresh array so the caller's
 * original object is never mutated.
 */
function resolveInitial<T>(initial?: ListInitializer<T>): T[] {
  const value = typeof initial === "function" ? initial() : initial;
  return value ? [...value] : [];
}

/**
 * A React hook for managing array state with immutable, ergonomic updates.
 *
 * Returns a tuple of the current (read-only) list and a stable set of actions.
 * Every mutation produces a brand-new array so React re-renders correctly and
 * the previous state is never mutated in place. Updates that would not change
 * anything (removing an out-of-range index, clearing an empty list, updating an
 * index to the value it already holds, filtering out nothing) are skipped to
 * avoid needless re-renders.
 *
 * Features:
 * - Immutable updates (new array on every change) with a `readonly T[]` return type
 * - Rich action set: `set`, `push`, `filter`, `sort`, `clear`, `removeAt`, `insertAt`, `updateAt`, `reset`
 * - `set` accepts a value or an updater function
 * - Stable action identities — safe to use as effect dependencies
 * - `useState`-style lazy initialization
 * - Full TypeScript generics for the element type
 *
 * @template T - Element type.
 * @param initialState - Initial items, or a factory returning them. Defaults to empty.
 * @returns `[list, { set, push, filter, sort, clear, removeAt, insertAt, updateAt, reset }]`
 *
 * @example
 * ```tsx
 * interface Todo { id: number; text: string; completed: boolean }
 *
 * function TodoApp() {
 *   const [todos, { push, removeAt, updateAt }] = useList<Todo>([]);
 *
 *   const addTodo = (text: string) =>
 *     push({ id: Date.now(), text, completed: false });
 *
 *   const toggleTodo = (index: number) =>
 *     updateAt(index, { ...todos[index], completed: !todos[index].completed });
 *
 *   return (
 *     <ul>
 *       {todos.map((todo, i) => (
 *         <li key={todo.id}>
 *           <input
 *             type="checkbox"
 *             checked={todo.completed}
 *             onChange={() => toggleTodo(i)}
 *           />
 *           {todo.text}
 *           <button onClick={() => removeAt(i)}>×</button>
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Functional set + sort + filter
 * const [nums, { set, sort, filter }] = useList<number>([3, 1, 2]);
 * set((prev) => [...prev, 4]);          // append via updater
 * sort((a, b) => a - b);                 // immutable sort
 * filter((n) => n % 2 === 0);            // keep evens
 * ```
 */
export function useList<T>(initialState?: ListInitializer<T>): UseListReturn<T> {
  // Resolve the initial list exactly once and keep it for `reset`.
  const initialRef = useRef<T[] | null>(null);
  if (initialRef.current === null) {
    initialRef.current = resolveInitial(initialState);
  }

  const [list, setList] = useState<T[]>(
    () => [...(initialRef.current as T[])]
  );

  const set = useCallback(
    (next: T[] | ((prev: readonly T[]) => T[])) => {
      setList((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        return [...resolved];
      });
    },
    []
  );

  const push = useCallback((...items: T[]) => {
    setList((prev) => (items.length === 0 ? prev : [...prev, ...items]));
  }, []);

  const filter = useCallback(
    (predicate: (item: T, index: number) => boolean) => {
      setList((prev) => {
        const next = prev.filter(predicate);
        // `filter` only removes; equal length means nothing changed.
        return next.length === prev.length ? prev : next;
      });
    },
    []
  );

  const sort = useCallback((compareFn?: (a: T, b: T) => number) => {
    setList((prev) => (prev.length <= 1 ? prev : [...prev].sort(compareFn)));
  }, []);

  const clear = useCallback(() => {
    setList((prev) => (prev.length === 0 ? prev : []));
  }, []);

  const removeAt = useCallback((index: number) => {
    setList((prev) => {
      if (index < 0 || index >= prev.length) {
        return prev;
      }
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  const insertAt = useCallback((index: number, ...items: T[]) => {
    setList((prev) => {
      if (items.length === 0) {
        return prev;
      }
      const at = Math.max(0, Math.min(index, prev.length));
      const next = [...prev];
      next.splice(at, 0, ...items);
      return next;
    });
  }, []);

  const updateAt = useCallback((index: number, item: T) => {
    setList((prev) => {
      if (index < 0 || index >= prev.length) {
        return prev;
      }
      if (Object.is(prev[index], item)) {
        return prev;
      }
      const next = [...prev];
      next[index] = item;
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setList([...(initialRef.current as T[])]);
  }, []);

  const actions = useMemo<UseListActions<T>>(
    () => ({
      set,
      push,
      filter,
      sort,
      clear,
      removeAt,
      insertAt,
      updateAt,
      reset,
    }),
    [set, push, filter, sort, clear, removeAt, insertAt, updateAt, reset]
  );

  return [list, actions];
}
