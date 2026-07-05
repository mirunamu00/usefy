import { useCallback, useMemo, useRef, useState } from "react";
import type {
  SelectionKey,
  UseSelectionOptions,
  UseSelectionReturn,
} from "./types";

/**
 * Manage multi- or single-selection state for a list or table, backed by a
 * `Set` of keys.
 *
 * The `Set` stores **keys** (see the `getKey` option), never the items
 * themselves, so a selection survives new object identities across renders —
 * rebuilding the `items` array every render will not lose the selection as long
 * as `getKey` maps the same logical item to the same key. Every item-facing
 * value (`selected`, `isAllSelected`, `isPartiallySelected`, …) is **derived
 * from the current `items`**, so removing a selected row from `items` makes it
 * disappear from `selected` and recomputes the aggregate flags automatically —
 * no manual reconciliation needed.
 *
 * Features:
 * - `Set`-backed, immutable updates (a fresh `Set` on every change)
 * - No-op skipping — `selectAll` when all are already selected, and `clear`
 *   when already empty, bail out without a re-render
 * - Single-selection mode (`multiple: false`) that replaces the selection
 * - Stable action identities (`toggle`/`select`/`deselect`/`selectAll`/`clear`
 *   and `isSelected`) — safe as effect dependencies
 * - `isPartiallySelected` for a header checkbox's indeterminate state
 * - SSR-safe (pure state) and StrictMode/concurrent-safe (no mutation of prior
 *   state, callbacks never fire from inside a `setState` updater)
 *
 * @template T - The item type.
 * @param items - The current list of items the selection is scoped to.
 * @param options - {@link UseSelectionOptions} (`getKey`, `multiple`).
 * @returns {@link UseSelectionReturn}
 *
 * @example
 * ```tsx
 * type User = { id: number; name: string };
 *
 * function UserTable({ users }: { users: User[] }) {
 *   const {
 *     selected,
 *     isSelected,
 *     toggle,
 *     selectAll,
 *     clear,
 *     isAllSelected,
 *     isPartiallySelected,
 *   } = useSelection(users, { getKey: (u) => u.id });
 *
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           <th>
 *             <input
 *               type="checkbox"
 *               checked={isAllSelected}
 *               ref={(el) => {
 *                 if (el) el.indeterminate = isPartiallySelected;
 *               }}
 *               onChange={() => (isAllSelected ? clear() : selectAll())}
 *             />
 *           </th>
 *           <th>Name ({selected.length} selected)</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {users.map((user) => (
 *           <tr key={user.id}>
 *             <td>
 *               <input
 *                 type="checkbox"
 *                 checked={isSelected(user)}
 *                 onChange={() => toggle(user)}
 *               />
 *             </td>
 *             <td>{user.name}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Single-selection mode (radio-like): selecting replaces the previous choice.
 * const { selected, isSelected, select } = useSelection(options, {
 *   multiple: false,
 * });
 * ```
 */
export function useSelection<T>(
  items: T[],
  options: UseSelectionOptions<T> = {}
): UseSelectionReturn<T> {
  const { multiple = true } = options;

  const [selectedKeys, setSelectedKeys] = useState<Set<SelectionKey>>(
    () => new Set()
  );

  // Mirror the latest inputs so the stable actions can read fresh values
  // without being recreated each render.
  const getKeyOptionRef = useRef(options.getKey);
  getKeyOptionRef.current = options.getKey;

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const multipleRef = useRef(multiple);
  multipleRef.current = multiple;

  const selectedKeysRef = useRef(selectedKeys);
  selectedKeysRef.current = selectedKeys;

  // A stable key resolver that always uses the latest `getKey`. Falls back to
  // identity (works for primitive items) when no `getKey` is provided.
  const getKey = useCallback((item: T): SelectionKey => {
    const fn = getKeyOptionRef.current;
    return fn ? fn(item) : (item as unknown as SelectionKey);
  }, []);

  const select = useCallback(
    (item: T) => {
      const key = getKey(item);
      setSelectedKeys((prev) => {
        if (multipleRef.current) {
          if (prev.has(key)) {
            return prev; // already selected — no-op
          }
          const next = new Set(prev);
          next.add(key);
          return next;
        }
        // single-selection: replace with just this key
        if (prev.size === 1 && prev.has(key)) {
          return prev; // already the sole selection — no-op
        }
        return new Set<SelectionKey>([key]);
      });
    },
    [getKey]
  );

  const deselect = useCallback(
    (item: T) => {
      const key = getKey(item);
      setSelectedKeys((prev) => {
        if (!prev.has(key)) {
          return prev; // not selected — no-op
        }
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
    [getKey]
  );

  const toggle = useCallback(
    (item: T) => {
      const key = getKey(item);
      setSelectedKeys((prev) => {
        if (prev.has(key)) {
          const next = new Set(prev);
          next.delete(key);
          return next;
        }
        if (multipleRef.current) {
          const next = new Set(prev);
          next.add(key);
          return next;
        }
        // single-selection: replace with just this key
        return new Set<SelectionKey>([key]);
      });
    },
    [getKey]
  );

  const selectAll = useCallback(() => {
    // Selecting "all" is a multi-selection concept.
    if (!multipleRef.current) {
      return;
    }
    setSelectedKeys((prev) => {
      const currentItems = itemsRef.current;
      if (currentItems.length === 0) {
        return prev; // nothing to select — no-op
      }
      let changed = false;
      const next = new Set(prev);
      for (const item of currentItems) {
        const key = getKey(item);
        if (!next.has(key)) {
          next.add(key);
          changed = true;
        }
      }
      return changed ? next : prev; // no-op when all already selected
    });
  }, [getKey]);

  const clear = useCallback(() => {
    setSelectedKeys((prev) =>
      prev.size === 0 ? prev : new Set<SelectionKey>()
    );
  }, []);

  const isSelected = useCallback(
    (item: T) => selectedKeysRef.current.has(getKey(item)),
    [getKey]
  );

  // Derive item-facing values from the current items ∩ selected keys. This is
  // what drops stale keys and keeps the aggregate flags in sync when `items`
  // changes. `getKey` is stable, so this recomputes only when `items` or the
  // selection changes.
  const { selected, isAllSelected, isPartiallySelected, isNoneSelected } =
    useMemo(() => {
      const sel: T[] = [];
      for (const item of items) {
        if (selectedKeys.has(getKey(item))) {
          sel.push(item);
        }
      }
      const count = sel.length;
      const total = items.length;
      return {
        selected: sel,
        isAllSelected: total > 0 && count === total,
        isPartiallySelected: count > 0 && count < total,
        isNoneSelected: count === 0,
      };
    }, [items, selectedKeys, getKey]);

  return {
    selected,
    selectedKeys,
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    clear,
    isAllSelected,
    isPartiallySelected,
    isNoneSelected,
  };
}
