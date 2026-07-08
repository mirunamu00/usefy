/**
 * Accepted initial value for {@link useSet}.
 *
 * Mirrors `useState`'s lazy-initializer support: pass a `Set`, any iterable of
 * values (e.g. an array), or a function returning one of those (evaluated once
 * on mount).
 *
 * @template T - Element type.
 *
 * @example
 * ```ts
 * useSet<string>();                       // empty
 * useSet(new Set(["a", "b"]));            // from a Set
 * useSet<string>(["a", "b"]);            // from an array
 * useSet(() => new Set(expensiveInit())); // lazy
 * ```
 */
export type SetInitializer<T> =
  | Set<T>
  | Iterable<T>
  | (() => Set<T> | Iterable<T>);

/**
 * Stable action handlers returned by {@link useSet}. Every function keeps a
 * stable identity across renders, so the actions object is safe to use as a
 * `useEffect`/`useMemo` dependency.
 *
 * @template T - Element type.
 */
export interface UseSetActions<T> {
  /**
   * Add a value. Adding a value already present is a no-op and does not trigger
   * a re-render.
   */
  add: (value: T) => void;

  /**
   * Remove a value. Removing a value that is not present is a no-op and does not
   * trigger a re-render.
   */
  remove: (value: T) => void;

  /**
   * Toggle a value's membership. Pass `force` to set membership explicitly:
   * `true` ensures the value is present, `false` ensures it is absent (like
   * `DOMTokenList.toggle`). Calls that would not change anything are no-ops.
   */
  toggle: (value: T, force?: boolean) => void;

  /**
   * Whether the set currently contains a value. A stable convenience over the
   * returned set's own `set.has(...)` — safe to use as an effect dependency,
   * and always reflects the latest state.
   */
  has: (value: T) => boolean;

  /**
   * Remove every value. Clearing an already-empty set is a no-op.
   */
  clear: () => void;

  /**
   * Reset the set back to the initial value provided at mount (a fresh copy, so
   * later mutations never affect the stored initial). Resetting a set that
   * already equals the initial is a no-op and does not trigger a re-render.
   */
  reset: () => void;
}

/**
 * Return type of {@link useSet}: a tuple of the current (read-only) set and the
 * stable action handlers.
 *
 * The set is typed as `ReadonlySet` on purpose — mutating it directly (e.g.
 * `set.add(...)`) would bypass React state and break immutability, so the type
 * steers callers to the actions instead. Read access (`has`, `size`, iteration)
 * works as usual.
 *
 * @template T - Element type.
 */
export type UseSetReturn<T> = [ReadonlySet<T>, UseSetActions<T>];
