import { useCallback, useMemo, useRef, useState } from "react";
import type { SetInitializer, UseSetActions, UseSetReturn } from "./types";

/**
 * Resolve a {@link SetInitializer} to a concrete `Set`. A function initializer
 * is invoked once; any iterable/Set is copied into a fresh `Set` so the caller's
 * original object is never mutated.
 */
function resolveInitial<T>(initial?: SetInitializer<T>): Set<T> {
  const value = typeof initial === "function" ? initial() : initial;
  return new Set(value ?? []);
}

/**
 * A React hook for managing `Set` state with immutable, ergonomic updates.
 *
 * Returns a tuple of the current (read-only) set and a stable set of actions.
 * Every mutation produces a brand-new `Set` so React re-renders correctly and
 * the previous state is never mutated in place. Updates that would not change
 * anything (adding an existing value, removing an absent value, clearing an
 * empty set) are skipped to avoid needless re-renders.
 *
 * Features:
 * - Immutable updates (`new Set` on every change) with a `ReadonlySet` return type
 * - Stable action identities — safe to use as effect dependencies
 * - `useState`-style lazy initialization; accepts `Set`, iterables, or a factory
 * - `toggle` with an optional `force` argument (like `DOMTokenList.toggle`)
 * - Full TypeScript generics for the element type
 *
 * @template T - Element type.
 * @param initialState - Initial values, or a factory returning them. Defaults to empty.
 * @returns `[set, { add, remove, toggle, has, clear, reset }]`
 *
 * @example
 * ```tsx
 * function ItemList({ items }: { items: Item[] }) {
 *   const [selected, { toggle, has, clear }] = useSet<string>();
 *
 *   return (
 *     <>
 *       {items.map((item) => (
 *         <label key={item.id}>
 *           <input
 *             type="checkbox"
 *             checked={has(item.id)}
 *             onChange={() => toggle(item.id)}
 *           />
 *           {item.name}
 *         </label>
 *       ))}
 *       <button onClick={clear}>Clear selection ({selected.size})</button>
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Tag filter with reset
 * const [tags, { add, remove, reset }] = useSet<string>(["react", "hooks"]);
 * add("typescript");
 * remove("hooks");
 * reset(); // back to the initial tags
 * ```
 */
export function useSet<T>(initialState?: SetInitializer<T>): UseSetReturn<T> {
  // Resolve the initial set exactly once and keep it for `reset`.
  const initialRef = useRef<Set<T> | null>(null);
  if (initialRef.current === null) {
    initialRef.current = resolveInitial(initialState);
  }

  const [set, setSet] = useState<Set<T>>(
    () => new Set(initialRef.current as Set<T>)
  );

  // Mirror the latest set so `has` can be a stable callback that still reads
  // fresh state.
  const setStateRef = useRef(set);
  setStateRef.current = set;

  const add = useCallback((value: T) => {
    setSet((prev) => {
      if (prev.has(value)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(value);
      return next;
    });
  }, []);

  const remove = useCallback((value: T) => {
    setSet((prev) => {
      if (!prev.has(value)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(value);
      return next;
    });
  }, []);

  const toggle = useCallback((value: T, force?: boolean) => {
    setSet((prev) => {
      const present = prev.has(value);
      // Decide the desired membership: honor `force` when provided, else flip.
      const shouldHave = force === undefined ? !present : force;

      if (shouldHave === present) {
        return prev; // already in the desired state — no-op
      }

      const next = new Set(prev);
      if (shouldHave) {
        next.add(value);
      } else {
        next.delete(value);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSet((prev) => (prev.size === 0 ? prev : new Set<T>()));
  }, []);

  const reset = useCallback(() => {
    setSet(new Set(initialRef.current as Set<T>));
  }, []);

  const has = useCallback((value: T) => setStateRef.current.has(value), []);

  const actions = useMemo<UseSetActions<T>>(
    () => ({ add, remove, toggle, has, clear, reset }),
    [add, remove, toggle, has, clear, reset]
  );

  return [set, actions];
}
