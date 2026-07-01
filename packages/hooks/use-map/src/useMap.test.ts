import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useMap } from "./useMap";

describe("useMap", () => {
  // ============ Initialization ============
  describe("initialization", () => {
    it("starts empty by default", () => {
      const { result } = renderHook(() => useMap<string, number>());
      const [map] = result.current;
      expect(map.size).toBe(0);
    });

    it("initializes from a Map", () => {
      const { result } = renderHook(() =>
        useMap(new Map([["a", 1], ["b", 2]]))
      );
      const [map] = result.current;
      expect(map.size).toBe(2);
      expect(map.get("a")).toBe(1);
      expect(map.get("b")).toBe(2);
    });

    it("initializes from an array of tuples", () => {
      const { result } = renderHook(() =>
        useMap<string, number>([["a", 1], ["b", 2]])
      );
      expect(result.current[0].get("b")).toBe(2);
    });

    it("initializes from a lazy factory (called once)", () => {
      let calls = 0;
      const { result, rerender } = renderHook(() =>
        useMap<string, number>(() => {
          calls++;
          return new Map([["x", 10]]);
        })
      );

      rerender();
      rerender();

      expect(calls).toBe(1);
      expect(result.current[0].get("x")).toBe(10);
    });

    it("does not mutate the source Map passed in", () => {
      const source = new Map([["a", 1]]);
      const { result } = renderHook(() => useMap(source));

      act(() => {
        result.current[1].set("b", 2);
      });

      expect(source.has("b")).toBe(false);
      expect(source.size).toBe(1);
    });
  });

  // ============ set ============
  describe("set", () => {
    it("adds a new entry", () => {
      const { result } = renderHook(() => useMap<string, number>());

      act(() => {
        result.current[1].set("a", 1);
      });

      expect(result.current[0].get("a")).toBe(1);
      expect(result.current[0].size).toBe(1);
    });

    it("overwrites an existing entry", () => {
      const { result } = renderHook(() => useMap([["a", 1]]));

      act(() => {
        result.current[1].set("a", 99);
      });

      expect(result.current[0].get("a")).toBe(99);
      expect(result.current[0].size).toBe(1);
    });

    it("produces a new Map reference and leaves the previous untouched", () => {
      const { result } = renderHook(() => useMap<string, number>());
      const before = result.current[0];

      act(() => {
        result.current[1].set("a", 1);
      });

      const after = result.current[0];
      expect(after).not.toBe(before);
      expect(before.size).toBe(0); // previous snapshot unchanged
    });

    it("skips re-render when setting a key to the same value", () => {
      const { result } = renderHook(() => useMap([["a", 1]]));
      const before = result.current[0];

      act(() => {
        result.current[1].set("a", 1);
      });

      // No change -> same reference (no re-render / no new Map).
      expect(result.current[0]).toBe(before);
    });
  });

  // ============ setAll ============
  describe("setAll", () => {
    it("replaces the entire map", () => {
      const { result } = renderHook(() => useMap([["a", 1], ["b", 2]]));

      act(() => {
        result.current[1].setAll([["c", 3]]);
      });

      const [map] = result.current;
      expect(map.size).toBe(1);
      expect(map.has("a")).toBe(false);
      expect(map.get("c")).toBe(3);
    });

    it("accepts a Map as input", () => {
      const { result } = renderHook(() => useMap<string, number>());

      act(() => {
        result.current[1].setAll(new Map([["z", 26]]));
      });

      expect(result.current[0].get("z")).toBe(26);
    });
  });

  // ============ remove ============
  describe("remove", () => {
    it("removes an entry", () => {
      const { result } = renderHook(() => useMap([["a", 1], ["b", 2]]));

      act(() => {
        result.current[1].remove("a");
      });

      expect(result.current[0].has("a")).toBe(false);
      expect(result.current[0].size).toBe(1);
    });

    it("is a no-op (stable reference) when the key is absent", () => {
      const { result } = renderHook(() => useMap([["a", 1]]));
      const before = result.current[0];

      act(() => {
        result.current[1].remove("missing");
      });

      expect(result.current[0]).toBe(before);
    });
  });

  // ============ reset ============
  describe("reset", () => {
    it("restores the initial entries", () => {
      const { result } = renderHook(() => useMap([["a", 1]]));

      act(() => {
        result.current[1].set("b", 2);
        result.current[1].remove("a");
      });
      expect(result.current[0].has("a")).toBe(false);

      act(() => {
        result.current[1].reset();
      });

      const [map] = result.current;
      expect(map.size).toBe(1);
      expect(map.get("a")).toBe(1);
      expect(map.has("b")).toBe(false);
    });

    it("does not let post-reset mutations leak into the stored initial", () => {
      const { result } = renderHook(() => useMap([["a", 1]]));

      act(() => {
        result.current[1].reset();
      });
      act(() => {
        result.current[1].set("b", 2);
      });
      act(() => {
        result.current[1].reset();
      });

      // Second reset must still yield only the original entry.
      expect(result.current[0].size).toBe(1);
      expect(result.current[0].has("b")).toBe(false);
    });
  });

  // ============ clear ============
  describe("clear", () => {
    it("empties the map", () => {
      const { result } = renderHook(() => useMap([["a", 1], ["b", 2]]));

      act(() => {
        result.current[1].clear();
      });

      expect(result.current[0].size).toBe(0);
    });

    it("is a no-op (stable reference) when already empty", () => {
      const { result } = renderHook(() => useMap<string, number>());
      const before = result.current[0];

      act(() => {
        result.current[1].clear();
      });

      expect(result.current[0]).toBe(before);
    });
  });

  // ============ get ============
  describe("get", () => {
    it("returns the value for a key, or undefined", () => {
      const { result } = renderHook(() => useMap([["a", 1]]));

      expect(result.current[1].get("a")).toBe(1);
      expect(result.current[1].get("missing")).toBeUndefined();
    });

    it("reflects the latest state", () => {
      const { result } = renderHook(() => useMap<string, number>());

      act(() => {
        result.current[1].set("a", 5);
      });

      expect(result.current[1].get("a")).toBe(5);
    });
  });

  // ============ Reference stability ============
  describe("reference stability", () => {
    it("keeps the actions object and each action stable across renders", () => {
      const { result, rerender } = renderHook(() => useMap<string, number>());
      const actionsBefore = result.current[1];

      rerender();

      const actionsAfter = result.current[1];
      expect(actionsAfter).toBe(actionsBefore);
      expect(actionsAfter.set).toBe(actionsBefore.set);
      expect(actionsAfter.setAll).toBe(actionsBefore.setAll);
      expect(actionsAfter.remove).toBe(actionsBefore.remove);
      expect(actionsAfter.reset).toBe(actionsBefore.reset);
      expect(actionsAfter.clear).toBe(actionsBefore.clear);
      expect(actionsAfter.get).toBe(actionsBefore.get);
    });

    it("keeps actions stable even after state changes", () => {
      const { result } = renderHook(() => useMap<string, number>());
      const setBefore = result.current[1].set;

      act(() => {
        result.current[1].set("a", 1);
      });

      expect(result.current[1].set).toBe(setBefore);
    });
  });

  // ============ Generics / object values ============
  describe("generics", () => {
    it("works with object values and non-string keys", () => {
      const { result } = renderHook(() =>
        useMap<number, { name: string }>([[1, { name: "Alice" }]])
      );

      act(() => {
        result.current[1].set(2, { name: "Bob" });
      });

      expect(result.current[0].get(2)).toEqual({ name: "Bob" });
      expect(result.current[0].size).toBe(2);
    });
  });
});
