import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useSet } from "./useSet";

describe("useSet", () => {
  // ============ Initialization ============
  describe("initialization", () => {
    it("starts empty by default", () => {
      const { result } = renderHook(() => useSet<string>());
      expect(result.current[0].size).toBe(0);
    });

    it("initializes from a Set", () => {
      const { result } = renderHook(() => useSet(new Set(["a", "b"])));
      const [set] = result.current;
      expect(set.size).toBe(2);
      expect(set.has("a")).toBe(true);
      expect(set.has("b")).toBe(true);
    });

    it("initializes from an array", () => {
      const { result } = renderHook(() => useSet<string>(["a", "b", "a"]));
      // Duplicates collapse.
      expect(result.current[0].size).toBe(2);
    });

    it("initializes from a lazy factory (called once)", () => {
      let calls = 0;
      const { result, rerender } = renderHook(() =>
        useSet<number>(() => {
          calls++;
          return new Set([1, 2]);
        })
      );

      rerender();
      rerender();

      expect(calls).toBe(1);
      expect(result.current[0].has(1)).toBe(true);
    });

    it("does not mutate the source Set passed in", () => {
      const source = new Set(["a"]);
      const { result } = renderHook(() => useSet(source));

      act(() => {
        result.current[1].add("b");
      });

      expect(source.has("b")).toBe(false);
      expect(source.size).toBe(1);
    });
  });

  // ============ add ============
  describe("add", () => {
    it("adds a new value", () => {
      const { result } = renderHook(() => useSet<string>());

      act(() => {
        result.current[1].add("a");
      });

      expect(result.current[0].has("a")).toBe(true);
      expect(result.current[0].size).toBe(1);
    });

    it("produces a new Set reference and leaves the previous untouched", () => {
      const { result } = renderHook(() => useSet<string>());
      const before = result.current[0];

      act(() => {
        result.current[1].add("a");
      });

      expect(result.current[0]).not.toBe(before);
      expect(before.size).toBe(0);
    });

    it("is a no-op (stable reference) when the value already exists", () => {
      const { result } = renderHook(() => useSet(["a"]));
      const before = result.current[0];

      act(() => {
        result.current[1].add("a");
      });

      expect(result.current[0]).toBe(before);
    });
  });

  // ============ remove ============
  describe("remove", () => {
    it("removes a value", () => {
      const { result } = renderHook(() => useSet(["a", "b"]));

      act(() => {
        result.current[1].remove("a");
      });

      expect(result.current[0].has("a")).toBe(false);
      expect(result.current[0].size).toBe(1);
    });

    it("is a no-op (stable reference) when the value is absent", () => {
      const { result } = renderHook(() => useSet(["a"]));
      const before = result.current[0];

      act(() => {
        result.current[1].remove("missing");
      });

      expect(result.current[0]).toBe(before);
    });
  });

  // ============ toggle ============
  describe("toggle", () => {
    it("adds when absent and removes when present", () => {
      const { result } = renderHook(() => useSet<string>());

      act(() => {
        result.current[1].toggle("a");
      });
      expect(result.current[0].has("a")).toBe(true);

      act(() => {
        result.current[1].toggle("a");
      });
      expect(result.current[0].has("a")).toBe(false);
    });

    it("respects force: true (ensure present, idempotent)", () => {
      const { result } = renderHook(() => useSet(["a"]));

      act(() => {
        result.current[1].toggle("a", true);
      });
      expect(result.current[0].has("a")).toBe(true);

      // Already present with force:true -> no-op reference.
      const before = result.current[0];
      act(() => {
        result.current[1].toggle("a", true);
      });
      expect(result.current[0]).toBe(before);
    });

    it("respects force: false (ensure absent, idempotent)", () => {
      const { result } = renderHook(() => useSet(["a"]));

      act(() => {
        result.current[1].toggle("a", false);
      });
      expect(result.current[0].has("a")).toBe(false);

      // Already absent with force:false -> no-op reference.
      const before = result.current[0];
      act(() => {
        result.current[1].toggle("missing", false);
      });
      expect(result.current[0]).toBe(before);
    });
  });

  // ============ has ============
  describe("has", () => {
    it("returns membership and reflects the latest state", () => {
      const { result } = renderHook(() => useSet(["a"]));

      expect(result.current[1].has("a")).toBe(true);
      expect(result.current[1].has("b")).toBe(false);

      act(() => {
        result.current[1].add("b");
      });

      expect(result.current[1].has("b")).toBe(true);
    });
  });

  // ============ clear ============
  describe("clear", () => {
    it("empties the set", () => {
      const { result } = renderHook(() => useSet(["a", "b"]));

      act(() => {
        result.current[1].clear();
      });

      expect(result.current[0].size).toBe(0);
    });

    it("is a no-op (stable reference) when already empty", () => {
      const { result } = renderHook(() => useSet<string>());
      const before = result.current[0];

      act(() => {
        result.current[1].clear();
      });

      expect(result.current[0]).toBe(before);
    });
  });

  // ============ reset ============
  describe("reset", () => {
    it("restores the initial values", () => {
      const { result } = renderHook(() => useSet(["a"]));

      act(() => {
        result.current[1].add("b");
        result.current[1].remove("a");
      });
      expect(result.current[0].has("a")).toBe(false);

      act(() => {
        result.current[1].reset();
      });

      expect(result.current[0].size).toBe(1);
      expect(result.current[0].has("a")).toBe(true);
      expect(result.current[0].has("b")).toBe(false);
    });

    it("does not let post-reset mutations leak into the stored initial", () => {
      const { result } = renderHook(() => useSet(["a"]));

      act(() => {
        result.current[1].reset();
      });
      act(() => {
        result.current[1].add("b");
      });
      act(() => {
        result.current[1].reset();
      });

      expect(result.current[0].size).toBe(1);
      expect(result.current[0].has("b")).toBe(false);
    });
  });

  // ============ Reference stability ============
  describe("reference stability", () => {
    it("keeps the actions object and each action stable across renders", () => {
      const { result, rerender } = renderHook(() => useSet<string>());
      const before = result.current[1];

      rerender();

      const after = result.current[1];
      expect(after).toBe(before);
      expect(after.add).toBe(before.add);
      expect(after.remove).toBe(before.remove);
      expect(after.toggle).toBe(before.toggle);
      expect(after.has).toBe(before.has);
      expect(after.clear).toBe(before.clear);
      expect(after.reset).toBe(before.reset);
    });

    it("keeps actions stable even after state changes", () => {
      const { result } = renderHook(() => useSet<string>());
      const addBefore = result.current[1].add;

      act(() => {
        result.current[1].add("a");
      });

      expect(result.current[1].add).toBe(addBefore);
    });
  });

  // ============ Generics / object values ============
  describe("generics", () => {
    it("works with object references and numbers", () => {
      const objA = { id: 1 };
      const { result } = renderHook(() => useSet<{ id: number }>([objA]));

      act(() => {
        result.current[1].add({ id: 2 });
      });

      expect(result.current[0].has(objA)).toBe(true);
      expect(result.current[0].size).toBe(2);
    });
  });
});
