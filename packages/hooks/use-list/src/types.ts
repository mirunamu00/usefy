/**
 * Accepted initial value for {@link useList}.
 *
 * Mirrors `useState`'s lazy-initializer support: pass any iterable of items
 * (e.g. an array) or a function returning one (evaluated once on mount).
 *
 * @template T - Element type.
 */
export type ListInitializer<T> = Iterable<T> | (() => Iterable<T>);

/**
 * Stable action handlers returned by {@link useList}. Every function keeps a
 * stable identity across renders, so the actions object is safe to use as a
 * `useEffect`/`useMemo` dependency.
 *
 * @template T - Element type.
 */
export interface UseListActions<T> {
  /**
   * Replace the entire list. Accepts a new array or an updater function that
   * receives the current list and returns the next one. (Unlike element-level
   * setters, the updater is unambiguous here because the argument is the whole
   * array, never a single element.)
   */
  set: (next: T[] | ((prev: readonly T[]) => T[])) => void;

  /**
   * Append one or more items to the end of the list.
   */
  push: (...items: T[]) => void;

  /**
   * Keep only the items for which the predicate returns `true`. When nothing is
   * removed, the list reference is preserved (no re-render).
   */
  filter: (predicate: (item: T, index: number) => boolean) => void;

  /**
   * Return a sorted copy of the list (immutable — the current list is not
   * mutated). Uses the standard `Array.prototype.sort` comparator contract.
   */
  sort: (compareFn?: (a: T, b: T) => number) => void;

  /**
   * Remove all items. Clearing an already-empty list is a no-op.
   */
  clear: () => void;

  /**
   * Remove the item at `index`. An out-of-range index is a no-op.
   */
  removeAt: (index: number) => void;

  /**
   * Insert one or more items at `index`, shifting the rest right. `index` is
   * clamped to `[0, length]`.
   */
  insertAt: (index: number, ...items: T[]) => void;

  /**
   * Replace the item at `index`. An out-of-range index is a no-op, and setting
   * an index to the value it already holds (by `Object.is`) does not re-render.
   */
  updateAt: (index: number, item: T) => void;

  /**
   * Reset the list back to the initial value provided at mount (a fresh copy, so
   * later mutations never affect the stored initial).
   */
  reset: () => void;
}

/**
 * Return type of {@link useList}: a tuple of the current (read-only) list and
 * the stable action handlers.
 *
 * The list is typed as `readonly T[]` on purpose — mutating it directly (e.g.
 * `list.push(...)`) would bypass React state and break immutability, so the
 * type steers callers to the actions instead. Index access, iteration, `map`,
 * `length`, etc. all work as usual.
 *
 * @template T - Element type.
 */
export type UseListReturn<T> = [readonly T[], UseListActions<T>];
