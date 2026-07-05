/**
 * The primitive key a selection is tracked by. Items may be objects, so
 * {@link useSelection} never stores items directly — it stores a stable
 * key derived from each item (see {@link UseSelectionOptions.getKey}). Keys are
 * `string | number` so they compare by value inside the backing `Set`, which is
 * what makes a selection survive new object identities across renders.
 */
export type SelectionKey = string | number;

/**
 * Options for {@link useSelection}.
 *
 * @template T - The item type.
 */
export interface UseSelectionOptions<T> {
  /**
   * Derive the selection key for an item. The backing `Set` stores these keys,
   * not the items themselves, so selection is stable even when the `items`
   * array is rebuilt with new object references each render (as long as
   * `getKey` returns the same key for the same logical item).
   *
   * Defaults to identity (`(item) => item`), which is correct when `items` are
   * primitives (`string`/`number`). For object items you should provide a
   * `getKey` such as `(row) => row.id`.
   */
  getKey?: (item: T) => SelectionKey;

  /**
   * Whether more than one item can be selected at a time.
   *
   * - `true` (default) — multi-selection. `select`/`toggle` add to the set.
   * - `false` — single-selection. Selecting an item replaces the current
   *   selection; toggling the already-selected item deselects it. `selectAll`
   *   is a no-op in this mode (you cannot hold more than one selection).
   *
   * @defaultValue true
   */
  multiple?: boolean;
}

/**
 * Return value of {@link useSelection}.
 *
 * The backing `Set` of keys is the source of truth, but every item-facing value
 * (`selected`, `isAllSelected`, …) is **derived from the current `items`**. This
 * means keys for items no longer present in `items` simply stop appearing in
 * `selected` and stop counting toward `isAllSelected` — stale selections never
 * linger in the item-facing surface.
 *
 * @template T - The item type.
 */
export interface UseSelectionReturn<T> {
  /**
   * The currently selected items, in `items` order. Derived as
   * `items` ∩ `selectedKeys`, so items removed from `items` drop out
   * automatically. Ideal for rendering a "selected" summary.
   *
   * Read-only: it is a freshly derived array — use the actions to change the
   * selection rather than mutating this in place.
   */
  selected: readonly T[];

  /**
   * The raw set of selected keys — the source of truth. Read-only: use the
   * actions to mutate. May contain keys for items not currently in `items`
   * (those are simply invisible in the derived, item-facing values).
   */
  selectedKeys: ReadonlySet<SelectionKey>;

  /**
   * Whether a given item is currently selected (compared by key). Stable across
   * renders and always reflects the latest state.
   */
  isSelected: (item: T) => boolean;

  /**
   * Toggle a single item's selection. If it is selected it becomes deselected;
   * otherwise it becomes selected. In single-selection mode, selecting a new
   * item replaces the previous selection. Stable identity.
   */
  toggle: (item: T) => void;

  /**
   * Explicitly select an item (idempotent — selecting an already-selected item
   * is a no-op). In single-selection mode this replaces the current selection.
   * Stable identity.
   */
  select: (item: T) => void;

  /**
   * Explicitly deselect an item (idempotent — deselecting an item that is not
   * selected is a no-op). Stable identity.
   */
  deselect: (item: T) => void;

  /**
   * Select every item currently in `items`. No-op when everything is already
   * selected (no re-render). No-op in single-selection mode. Stable identity.
   */
  selectAll: () => void;

  /**
   * Clear the entire selection (a.k.a. deselect all). No-op when the selection
   * is already empty (no re-render). Stable identity.
   */
  clear: () => void;

  /**
   * `true` when every item in `items` is selected. Always `false` for an empty
   * `items` array (there is nothing to have "all" selected).
   */
  isAllSelected: boolean;

  /**
   * `true` when some — but not all — of the current `items` are selected. Useful
   * to drive a header checkbox's `indeterminate` state. `false` for an empty
   * `items` array.
   */
  isPartiallySelected: boolean;

  /**
   * `true` when none of the current `items` are selected (including when `items`
   * is empty).
   */
  isNoneSelected: boolean;
}
