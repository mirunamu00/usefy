import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useList } from "./useList";

describe("useList", () => {
  // ============ Initialization ============
  describe("initialization", () => {
    it("starts empty by default", () => {
      const { result } = renderHook(() => useList<number>());
      expect(result.current[0]).toEqual([]);
    });

    it("initializes from an array", () => {
      const { result } = renderHook(() => useList([1, 2, 3]));
      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    it("initializes from a lazy factory (called once)", () => {
      let calls = 0;
      const { result, rerender } = renderHook(() =>
        useList<number>(() => {
          calls++;
          return [9];
        })
      );

      rerender();
      rerender();

      expect(calls).toBe(1);
      expect(result.current[0]).toEqual([9]);
    });

    it("does not mutate the source array passed in", () => {
      const source = [1, 2];
      const { result } = renderHook(() => useList(source));

      act(() => {
        result.current[1].push(3);
      });

      expect(source).toEqual([1, 2]);
    });
  });

  // ============ set ============
  describe("set", () => {
    it("replaces the list with a new array", () => {
      const { result } = renderHook(() => useList([1, 2]));

      act(() => {
        result.current[1].set([9, 8, 7]);
      });

      expect(result.current[0]).toEqual([9, 8, 7]);
    });

    it("accepts an updater function", () => {
      const { result } = renderHook(() => useList([1, 2]));

      act(() => {
        result.current[1].set((prev) => [...prev, 3]);
      });

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    it("produces a new reference and leaves the previous untouched", () => {
      const { result } = renderHook(() => useList<number>([1]));
      const before = result.current[0];

      act(() => {
        result.current[1].set([2]);
      });

      expect(result.current[0]).not.toBe(before);
      expect(before).toEqual([1]);
    });
  });

  // ============ push ============
  describe("push", () => {
    it("appends one item", () => {
      const { result } = renderHook(() => useList<number>([1]));
      act(() => result.current[1].push(2));
      expect(result.current[0]).toEqual([1, 2]);
    });

    it("appends multiple items", () => {
      const { result } = renderHook(() => useList<number>([1]));
      act(() => result.current[1].push(2, 3, 4));
      expect(result.current[0]).toEqual([1, 2, 3, 4]);
    });

    it("is a no-op (stable reference) with no items", () => {
      const { result } = renderHook(() => useList([1]));
      const before = result.current[0];
      act(() => result.current[1].push());
      expect(result.current[0]).toBe(before);
    });
  });

  // ============ filter ============
  describe("filter", () => {
    it("keeps items matching the predicate", () => {
      const { result } = renderHook(() => useList([1, 2, 3, 4]));
      act(() => result.current[1].filter((n) => n % 2 === 0));
      expect(result.current[0]).toEqual([2, 4]);
    });

    it("passes the index to the predicate", () => {
      const { result } = renderHook(() => useList(["a", "b", "c"]));
      act(() => result.current[1].filter((_, i) => i !== 1));
      expect(result.current[0]).toEqual(["a", "c"]);
    });

    it("is a no-op (stable reference) when nothing is removed", () => {
      const { result } = renderHook(() => useList([2, 4]));
      const before = result.current[0];
      act(() => result.current[1].filter((n) => n % 2 === 0));
      expect(result.current[0]).toBe(before);
    });
  });

  // ============ sort ============
  describe("sort", () => {
    it("sorts with a comparator, immutably", () => {
      const { result } = renderHook(() => useList([3, 1, 2]));
      const before = result.current[0];

      act(() => result.current[1].sort((a, b) => a - b));

      expect(result.current[0]).toEqual([1, 2, 3]);
      expect(before).toEqual([3, 1, 2]); // original untouched
      expect(result.current[0]).not.toBe(before);
    });

    it("is a no-op (stable reference) for lists of length <= 1", () => {
      const { result } = renderHook(() => useList([1]));
      const before = result.current[0];
      act(() => result.current[1].sort());
      expect(result.current[0]).toBe(before);
    });
  });

  // ============ clear ============
  describe("clear", () => {
    it("empties the list", () => {
      const { result } = renderHook(() => useList([1, 2]));
      act(() => result.current[1].clear());
      expect(result.current[0]).toEqual([]);
    });

    it("is a no-op (stable reference) when already empty", () => {
      const { result } = renderHook(() => useList<number>());
      const before = result.current[0];
      act(() => result.current[1].clear());
      expect(result.current[0]).toBe(before);
    });
  });

  // ============ removeAt ============
  describe("removeAt", () => {
    it("removes the item at an index", () => {
      const { result } = renderHook(() => useList(["a", "b", "c"]));
      act(() => result.current[1].removeAt(1));
      expect(result.current[0]).toEqual(["a", "c"]);
    });

    it("is a no-op (stable reference) for an out-of-range index", () => {
      const { result } = renderHook(() => useList(["a"]));
      const before = result.current[0];
      act(() => result.current[1].removeAt(5));
      expect(result.current[0]).toBe(before);
      act(() => result.current[1].removeAt(-1));
      expect(result.current[0]).toBe(before);
    });
  });

  // ============ insertAt ============
  describe("insertAt", () => {
    it("inserts item(s) at an index", () => {
      const { result } = renderHook(() => useList(["a", "d"]));
      act(() => result.current[1].insertAt(1, "b", "c"));
      expect(result.current[0]).toEqual(["a", "b", "c", "d"]);
    });

    it("clamps the index into range", () => {
      const { result } = renderHook(() => useList(["a"]));
      act(() => result.current[1].insertAt(99, "z"));
      expect(result.current[0]).toEqual(["a", "z"]);
      act(() => result.current[1].insertAt(-5, "start"));
      expect(result.current[0]).toEqual(["start", "a", "z"]);
    });

    it("is a no-op (stable reference) with no items", () => {
      const { result } = renderHook(() => useList(["a"]));
      const before = result.current[0];
      act(() => result.current[1].insertAt(0));
      expect(result.current[0]).toBe(before);
    });
  });

  // ============ updateAt ============
  describe("updateAt", () => {
    it("replaces the item at an index", () => {
      const { result } = renderHook(() => useList([1, 2, 3]));
      act(() => result.current[1].updateAt(1, 20));
      expect(result.current[0]).toEqual([1, 20, 3]);
    });

    it("is a no-op (stable reference) for an out-of-range index", () => {
      const { result } = renderHook(() => useList([1]));
      const before = result.current[0];
      act(() => result.current[1].updateAt(5, 99));
      expect(result.current[0]).toBe(before);
    });

    it("is a no-op (stable reference) when setting the same value", () => {
      const obj = { id: 1 };
      const { result } = renderHook(() => useList([obj]));
      const before = result.current[0];
      act(() => result.current[1].updateAt(0, obj));
      expect(result.current[0]).toBe(before);
    });
  });

  // ============ reset ============
  describe("reset", () => {
    it("restores the initial items", () => {
      const { result } = renderHook(() => useList([1, 2]));

      act(() => {
        result.current[1].push(3);
        result.current[1].removeAt(0);
      });

      act(() => result.current[1].reset());

      expect(result.current[0]).toEqual([1, 2]);
    });

    it("does not let post-reset mutations leak into the stored initial", () => {
      const { result } = renderHook(() => useList([1]));

      act(() => result.current[1].reset());
      act(() => result.current[1].push(2));
      act(() => result.current[1].reset());

      expect(result.current[0]).toEqual([1]);
    });
  });

  // ============ Reference stability ============
  describe("reference stability", () => {
    it("keeps the actions object and each action stable across renders", () => {
      const { result, rerender } = renderHook(() => useList<number>());
      const before = result.current[1];

      rerender();

      const after = result.current[1];
      expect(after).toBe(before);
      expect(after.set).toBe(before.set);
      expect(after.push).toBe(before.push);
      expect(after.filter).toBe(before.filter);
      expect(after.sort).toBe(before.sort);
      expect(after.clear).toBe(before.clear);
      expect(after.removeAt).toBe(before.removeAt);
      expect(after.insertAt).toBe(before.insertAt);
      expect(after.updateAt).toBe(before.updateAt);
      expect(after.reset).toBe(before.reset);
    });

    it("keeps actions stable even after state changes", () => {
      const { result } = renderHook(() => useList<number>());
      const pushBefore = result.current[1].push;
      act(() => result.current[1].push(1));
      expect(result.current[1].push).toBe(pushBefore);
    });
  });

  // ============ Realistic todo flow ============
  describe("todo flow", () => {
    interface Todo {
      id: number;
      text: string;
      completed: boolean;
    }

    it("supports push + updateAt toggle + removeAt", () => {
      const { result } = renderHook(() => useList<Todo>([]));

      act(() =>
        result.current[1].push({ id: 1, text: "write tests", completed: false })
      );
      act(() => {
        const todo = result.current[0][0];
        result.current[1].updateAt(0, { ...todo, completed: !todo.completed });
      });

      expect(result.current[0][0].completed).toBe(true);

      act(() => result.current[1].removeAt(0));
      expect(result.current[0]).toEqual([]);
    });
  });
});
