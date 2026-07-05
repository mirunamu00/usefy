import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSelection } from "./useSelection";

type User = { id: number; name: string };

const users: User[] = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Linus" },
  { id: 3, name: "Grace" },
];

describe("useSelection", () => {
  describe("initial state", () => {
    it("starts empty", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));
      expect(result.current.selected).toEqual([]);
      expect(result.current.selectedKeys.size).toBe(0);
      expect(result.current.isAllSelected).toBe(false);
      expect(result.current.isPartiallySelected).toBe(false);
      expect(result.current.isNoneSelected).toBe(true);
    });
  });

  describe("toggle / select / deselect (primitives)", () => {
    it("toggle selects then deselects", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));

      act(() => result.current.toggle("a"));
      expect(result.current.isSelected("a")).toBe(true);
      expect(result.current.selected).toEqual(["a"]);

      act(() => result.current.toggle("a"));
      expect(result.current.isSelected("a")).toBe(false);
      expect(result.current.selected).toEqual([]);
    });

    it("select is idempotent and deselect removes", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));

      act(() => result.current.select("b"));
      const afterFirst = result.current.selectedKeys;
      act(() => result.current.select("b")); // no-op
      expect(result.current.selectedKeys).toBe(afterFirst);

      act(() => result.current.deselect("b"));
      expect(result.current.isSelected("b")).toBe(false);

      const empty = result.current.selectedKeys;
      act(() => result.current.deselect("b")); // no-op
      expect(result.current.selectedKeys).toBe(empty);
    });

    it("selected preserves items order, not selection order", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));
      act(() => result.current.toggle("c"));
      act(() => result.current.toggle("a"));
      expect(result.current.selected).toEqual(["a", "c"]);
    });
  });

  describe("selectAll / clear + aggregate flags", () => {
    it("selectAll selects everything and sets isAllSelected", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));

      act(() => result.current.selectAll());
      expect(result.current.selected).toEqual(["a", "b", "c"]);
      expect(result.current.isAllSelected).toBe(true);
      expect(result.current.isPartiallySelected).toBe(false);
      expect(result.current.isNoneSelected).toBe(false);
    });

    it("clear empties the selection and resets flags", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));
      act(() => result.current.selectAll());
      act(() => result.current.clear());
      expect(result.current.selected).toEqual([]);
      expect(result.current.isAllSelected).toBe(false);
      expect(result.current.isNoneSelected).toBe(true);
    });

    it("isPartiallySelected is true for some-but-not-all", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));
      act(() => result.current.toggle("a"));
      expect(result.current.isPartiallySelected).toBe(true);
      expect(result.current.isAllSelected).toBe(false);
      expect(result.current.isNoneSelected).toBe(false);
    });
  });

  describe("no-op skipping (reference stability)", () => {
    it("selectAll is a no-op when everything is already selected", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));
      act(() => result.current.selectAll());
      const before = result.current.selectedKeys;
      act(() => result.current.selectAll());
      expect(result.current.selectedKeys).toBe(before);
    });

    it("clear is a no-op when already empty", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));
      const before = result.current.selectedKeys;
      act(() => result.current.clear());
      expect(result.current.selectedKeys).toBe(before);
    });

    it("selectAll is a no-op for an empty items array", () => {
      const { result } = renderHook(() => useSelection<string>([]));
      const before = result.current.selectedKeys;
      act(() => result.current.selectAll());
      expect(result.current.selectedKeys).toBe(before);
      expect(result.current.isAllSelected).toBe(false);
    });

    it("mutating actions produce a new Set reference", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));
      const before = result.current.selectedKeys;
      act(() => result.current.toggle("a"));
      expect(result.current.selectedKeys).not.toBe(before);
    });
  });

  describe("immutability", () => {
    it("never mutates the previous Set", () => {
      const { result } = renderHook(() => useSelection(["a", "b", "c"]));
      act(() => result.current.toggle("a"));
      const first = result.current.selectedKeys;
      const snapshot = [...first];
      act(() => result.current.toggle("b"));
      // The previously returned set is unchanged.
      expect([...first]).toEqual(snapshot);
      expect(first.has("b")).toBe(false);
    });
  });

  describe("object items with getKey", () => {
    it("tracks selection by key", () => {
      const { result } = renderHook(() =>
        useSelection(users, { getKey: (u) => u.id })
      );
      act(() => result.current.toggle(users[0]));
      expect(result.current.isSelected(users[0])).toBe(true);
      expect(result.current.selected).toEqual([users[0]]);
    });

    it("selection survives new object identities across renders", () => {
      const { result, rerender } = renderHook(
        ({ data }: { data: User[] }) =>
          useSelection(data, { getKey: (u) => u.id }),
        { initialProps: { data: users } }
      );

      act(() => result.current.toggle(users[1]));
      expect(result.current.isSelected(users[1])).toBe(true);

      // Rebuild the array with brand-new object references but the same ids.
      const rebuilt = users.map((u) => ({ ...u }));
      rerender({ data: rebuilt });

      // Same key ⇒ still selected, and derived `selected` points at the new obj.
      expect(result.current.isSelected(rebuilt[1])).toBe(true);
      expect(result.current.selected).toEqual([rebuilt[1]]);
      expect(result.current.selected[0]).toBe(rebuilt[1]);
    });
  });

  describe("items-change reconciliation", () => {
    it("drops a removed selected item from derived values and recomputes flags", () => {
      const { result, rerender } = renderHook(
        ({ data }: { data: User[] }) =>
          useSelection(data, { getKey: (u) => u.id }),
        { initialProps: { data: users } }
      );

      act(() => result.current.selectAll());
      expect(result.current.isAllSelected).toBe(true);

      // Remove one selected row.
      const fewer = users.slice(0, 2);
      rerender({ data: fewer });

      // Derived selected only contains still-present items...
      expect(result.current.selected).toEqual(fewer);
      // ...and because 2 of 2 present items are selected, still "all".
      expect(result.current.isAllSelected).toBe(true);

      // Add a brand-new, unselected row → now partial.
      const withNew = [...fewer, { id: 99, name: "New" }];
      rerender({ data: withNew });
      expect(result.current.isAllSelected).toBe(false);
      expect(result.current.isPartiallySelected).toBe(true);
    });

    it("keeps stale keys in selectedKeys but hides them from selected", () => {
      const { result, rerender } = renderHook(
        ({ data }: { data: User[] }) =>
          useSelection(data, { getKey: (u) => u.id }),
        { initialProps: { data: users } }
      );
      act(() => result.current.toggle(users[2])); // select id 3
      const fewer = users.slice(0, 2); // remove id 3
      rerender({ data: fewer });
      expect(result.current.selected).toEqual([]);
      // Source-of-truth set still holds the stale key.
      expect(result.current.selectedKeys.has(3)).toBe(true);
    });
  });

  describe("single-selection mode", () => {
    it("select replaces the previous selection", () => {
      const { result } = renderHook(() =>
        useSelection(["a", "b", "c"], { multiple: false })
      );
      act(() => result.current.select("a"));
      expect(result.current.selected).toEqual(["a"]);
      act(() => result.current.select("b"));
      expect(result.current.selected).toEqual(["b"]);
      expect(result.current.selectedKeys.size).toBe(1);
    });

    it("toggle replaces a different item but deselects the same one", () => {
      const { result } = renderHook(() =>
        useSelection(["a", "b", "c"], { multiple: false })
      );
      act(() => result.current.toggle("a"));
      expect(result.current.selected).toEqual(["a"]);
      act(() => result.current.toggle("b"));
      expect(result.current.selected).toEqual(["b"]);
      act(() => result.current.toggle("b"));
      expect(result.current.selected).toEqual([]);
    });

    it("re-selecting the sole selection is a no-op", () => {
      const { result } = renderHook(() =>
        useSelection(["a", "b", "c"], { multiple: false })
      );
      act(() => result.current.select("a"));
      const before = result.current.selectedKeys;
      act(() => result.current.select("a"));
      expect(result.current.selectedKeys).toBe(before);
    });

    it("selectAll is a no-op in single-selection mode", () => {
      const { result } = renderHook(() =>
        useSelection(["a", "b", "c"], { multiple: false })
      );
      const before = result.current.selectedKeys;
      act(() => result.current.selectAll());
      expect(result.current.selectedKeys).toBe(before);
      expect(result.current.isAllSelected).toBe(false);
    });
  });

  describe("empty items edge case", () => {
    it("isAllSelected is false and isNoneSelected is true for empty items", () => {
      const { result } = renderHook(() => useSelection<string>([]));
      expect(result.current.isAllSelected).toBe(false);
      expect(result.current.isPartiallySelected).toBe(false);
      expect(result.current.isNoneSelected).toBe(true);
    });
  });

  describe("referential stability of actions", () => {
    it("keeps every action stable across re-renders", () => {
      const { result, rerender } = renderHook(() =>
        useSelection(["a", "b", "c"])
      );
      const first = {
        toggle: result.current.toggle,
        select: result.current.select,
        deselect: result.current.deselect,
        selectAll: result.current.selectAll,
        clear: result.current.clear,
        isSelected: result.current.isSelected,
      };
      rerender();
      expect(result.current.toggle).toBe(first.toggle);
      expect(result.current.select).toBe(first.select);
      expect(result.current.deselect).toBe(first.deselect);
      expect(result.current.selectAll).toBe(first.selectAll);
      expect(result.current.clear).toBe(first.clear);
      expect(result.current.isSelected).toBe(first.isSelected);
    });

    it("actions stay stable even when getKey is a new inline function each render", () => {
      const { result, rerender } = renderHook(
        ({ items }: { items: User[] }) =>
          useSelection(items, { getKey: (u) => u.id }),
        { initialProps: { items: users } }
      );
      const toggle = result.current.toggle;
      rerender({ items: users.map((u) => ({ ...u })) });
      expect(result.current.toggle).toBe(toggle);
    });
  });

  describe("default identity getKey", () => {
    it("uses the item itself as the key for primitives", () => {
      const { result } = renderHook(() => useSelection([1, 2, 3]));
      act(() => result.current.toggle(2));
      expect(result.current.isSelected(2)).toBe(true);
      expect(result.current.selectedKeys.has(2)).toBe(true);
    });
  });
});
