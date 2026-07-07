import { useCallback, useMemo, useRef, useState } from "react";
import type {
  MapInitializer,
  UseMapActions,
  UseMapReturn,
} from "./types";

/**
 * Resolve a {@link MapInitializer} to a concrete `Map`. A function initializer
 * is invoked once; any iterable/Map is copied into a fresh `Map` so the caller's
 * original object is never mutated.
 */
function resolveInitial<K, V>(initial?: MapInitializer<K, V>): Map<K, V> {
  const value = typeof initial === "function" ? initial() : initial;
  return new Map(value ?? []);
}

/**
 * Shallow structural equality for two maps: same size and every key present in
 * `a` maps to the same value (by `Object.is`) in `b`. Used to skip a needless
 * re-render when a `reset` would produce an identical map.
 */
function mapsEqual<K, V>(a: ReadonlyMap<K, V>, b: ReadonlyMap<K, V>): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (const [key, value] of a) {
    if (!b.has(key) || !Object.is(b.get(key), value)) {
      return false;
    }
  }
  return true;
}

/**
 * A React hook for managing `Map` state with immutable, ergonomic updates.
 *
 * Returns a tuple of the current (read-only) map and a stable set of actions.
 * Every mutation produces a brand-new `Map` so React re-renders correctly and
 * the previous state is never mutated in place. Updates that would not change
 * anything (removing an absent key, clearing an empty map, setting a key to the
 * value it already holds, resetting a map that already equals its initial
 * entries) are skipped to avoid needless re-renders.
 *
 * Features:
 * - Immutable updates (`new Map` on every change) with a `ReadonlyMap` return type
 * - Stable action identities — safe to use as effect dependencies
 * - `useState`-style lazy initialization; accepts `Map`, tuples, or a factory
 * - Full TypeScript generics for keys and values
 *
 * @template K - Key type.
 * @template V - Value type.
 * @param initialState - Initial entries, or a factory returning them. Defaults to empty.
 * @returns `[map, { set, setAll, remove, reset, clear, get }]`
 *
 * @example
 * ```tsx
 * function UserDirectory() {
 *   const [users, { set, remove }] = useMap<string, User>([
 *     ["1", { id: "1", name: "Alice" }],
 *     ["2", { id: "2", name: "Bob" }],
 *   ]);
 *
 *   return (
 *     <ul>
 *       {[...users.values()].map((u) => (
 *         <li key={u.id}>
 *           {u.name}
 *           <button onClick={() => remove(u.id)}>Remove</button>
 *         </li>
 *       ))}
 *       <button onClick={() => set("3", { id: "3", name: "Carol" })}>Add</button>
 *     </ul>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Feature flags with reset-to-initial
 * const [flags, { set, reset }] = useMap<string, boolean>([
 *   ["darkMode", false],
 *   ["beta", true],
 * ]);
 * set("darkMode", true);
 * reset(); // back to the initial flags
 * ```
 */
export function useMap<K, V>(
  initialState?: MapInitializer<K, V>
): UseMapReturn<K, V> {
  // Resolve the initial map exactly once and keep it for `reset`.
  const initialRef = useRef<Map<K, V> | null>(null);
  if (initialRef.current === null) {
    initialRef.current = resolveInitial(initialState);
  }

  const [map, setMap] = useState<Map<K, V>>(
    () => new Map(initialRef.current as Map<K, V>)
  );

  // Mirror the latest map so `get` can be a stable callback that still reads
  // fresh state.
  const mapRef = useRef(map);
  mapRef.current = map;

  const set = useCallback((key: K, value: V) => {
    setMap((prev) => {
      // Skip re-render when the value is unchanged.
      if (prev.has(key) && Object.is(prev.get(key), value)) {
        return prev;
      }
      const next = new Map(prev);
      next.set(key, value);
      return next;
    });
  }, []);

  const setAll = useCallback((entries: Iterable<readonly [K, V]>) => {
    setMap(new Map(entries));
  }, []);

  const remove = useCallback((key: K) => {
    setMap((prev) => {
      if (!prev.has(key)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setMap((prev) => {
      const initial = initialRef.current as Map<K, V>;
      // Skip re-render when the current map already matches the initial.
      return mapsEqual(prev, initial) ? prev : new Map(initial);
    });
  }, []);

  const clear = useCallback(() => {
    setMap((prev) => (prev.size === 0 ? prev : new Map<K, V>()));
  }, []);

  const get = useCallback((key: K) => mapRef.current.get(key), []);

  const actions = useMemo<UseMapActions<K, V>>(
    () => ({ set, setAll, remove, reset, clear, get }),
    [set, setAll, remove, reset, clear, get]
  );

  return [map, actions];
}
