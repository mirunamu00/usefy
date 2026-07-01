/**
 * Accepted initial value for {@link useMap}.
 *
 * Mirrors `useState`'s lazy-initializer support: pass a `Map`, any iterable of
 * key/value tuples (e.g. an array of pairs), or a function returning one of
 * those (evaluated once on mount).
 *
 * @template K - Key type.
 * @template V - Value type.
 *
 * @example
 * ```ts
 * useMap<string, number>();                                  // empty
 * useMap(new Map([["a", 1]]));                                 // from a Map
 * useMap<string, number>([["a", 1], ["b", 2]]);               // from tuples
 * useMap(() => new Map(expensiveInit()));                      // lazy
 * ```
 */
export type MapInitializer<K, V> =
  | Map<K, V>
  | Iterable<readonly [K, V]>
  | (() => Map<K, V> | Iterable<readonly [K, V]>);

/**
 * Stable action handlers returned by {@link useMap}. Every function keeps a
 * stable identity across renders, so the actions object is safe to use as a
 * `useEffect`/`useMemo` dependency.
 *
 * @template K - Key type.
 * @template V - Value type.
 */
export interface UseMapActions<K, V> {
  /**
   * Set (or overwrite) the value for a key. Setting a key to a value it already
   * holds (by `Object.is`) is a no-op and does not trigger a re-render.
   */
  set: (key: K, value: V) => void;

  /**
   * Replace the entire map contents with the given entries. Accepts a `Map` or
   * any iterable of key/value tuples.
   */
  setAll: (entries: Iterable<readonly [K, V]>) => void;

  /**
   * Remove a key. Removing a key that is not present is a no-op and does not
   * trigger a re-render.
   */
  remove: (key: K) => void;

  /**
   * Reset the map back to the initial value provided at mount (a fresh copy, so
   * later mutations never affect the stored initial).
   */
  reset: () => void;

  /**
   * Remove every entry. Clearing an already-empty map is a no-op.
   */
  clear: () => void;

  /**
   * Read the current value for a key. Stable across renders and always reflects
   * the latest state.
   */
  get: (key: K) => V | undefined;
}

/**
 * Return type of {@link useMap}: a tuple of the current (read-only) map and the
 * stable action handlers.
 *
 * The map is typed as `ReadonlyMap` on purpose — mutating it directly (e.g.
 * `map.set(...)`) would bypass React state and break immutability, so the type
 * steers callers to the actions instead. Read access (`get`, `has`, `size`,
 * iteration) works as usual.
 *
 * @template K - Key type.
 * @template V - Value type.
 */
export type UseMapReturn<K, V> = [ReadonlyMap<K, V>, UseMapActions<K, V>];
