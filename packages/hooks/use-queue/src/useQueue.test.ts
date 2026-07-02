import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useQueue } from "./useQueue";

describe("useQueue", () => {
  // ============ Initialization ============
  describe("initialization", () => {
    it("starts empty by default", () => {
      const { result } = renderHook(() => useQueue<string>());
      expect(result.current[0]).toEqual([]);
      expect(result.current[0].length).toBe(0);
    });

    it("initializes from an array in FIFO order (index 0 is the front)", () => {
      const { result } = renderHook(() => useQueue<string>(["a", "b", "c"]));
      expect(result.current[0]).toEqual(["a", "b", "c"]);
      expect(result.current[0][0]).toBe("a");
      expect(result.current[0][result.current[0].length - 1]).toBe("c");
    });

    it("initializes from an arbitrary iterable", () => {
      const { result } = renderHook(() => useQueue(new Set(["a", "b"])));
      expect(result.current[0]).toEqual(["a", "b"]);
    });

    it("initializes from a lazy factory (called once)", () => {
      let calls = 0;
      const { result, rerender } = renderHook(() =>
        useQueue<number>(() => {
          calls++;
          return [1, 2];
        })
      );

      rerender();
      rerender();

      expect(calls).toBe(1);
      expect(result.current[0]).toEqual([1, 2]);
    });

    it("does not mutate the source array passed in", () => {
      const source = ["a"];
      const { result } = renderHook(() => useQueue(source));

      act(() => {
        result.current[1].add("b");
      });
      act(() => {
        result.current[1].remove();
      });

      expect(source).toEqual(["a"]);
    });
  });

  // ============ add (enqueue) ============
  describe("add", () => {
    it("appends a single item to the back", () => {
      const { result } = renderHook(() => useQueue<string>(["a"]));

      act(() => {
        result.current[1].add("b");
      });

      expect(result.current[0]).toEqual(["a", "b"]);
    });

    it("appends multiple items in order (variadic)", () => {
      const { result } = renderHook(() => useQueue<number>([1]));

      act(() => {
        result.current[1].add(2, 3, 4);
      });

      expect(result.current[0]).toEqual([1, 2, 3, 4]);
    });

    it("produces a new array reference and leaves the previous untouched", () => {
      const { result } = renderHook(() => useQueue<string>());
      const before = result.current[0];

      act(() => {
        result.current[1].add("a");
      });

      expect(result.current[0]).not.toBe(before);
      expect(before).toEqual([]);
    });

    it("is a no-op (stable reference) when called with no items", () => {
      const { result } = renderHook(() => useQueue<string>(["a"]));
      const before = result.current[0];

      act(() => {
        result.current[1].add();
      });

      expect(result.current[0]).toBe(before);
    });
  });

  // ============ remove (dequeue) ============
  describe("remove", () => {
    it("removes and returns the front item (FIFO)", () => {
      const { result } = renderHook(() => useQueue<string>(["a", "b", "c"]));

      let removed: string | undefined;
      act(() => {
        removed = result.current[1].remove();
      });

      expect(removed).toBe("a");
      expect(result.current[0]).toEqual(["b", "c"]);
    });

    it("returns undefined and is a no-op (stable reference) when empty", () => {
      const { result } = renderHook(() => useQueue<string>());
      const before = result.current[0];

      let removed: string | undefined;
      act(() => {
        removed = result.current[1].remove();
      });

      expect(removed).toBeUndefined();
      expect(result.current[0]).toBe(before);
    });

    it("produces a new array reference and leaves the previous untouched", () => {
      const { result } = renderHook(() => useQueue<string>(["a", "b"]));
      const before = result.current[0];

      act(() => {
        result.current[1].remove();
      });

      expect(result.current[0]).not.toBe(before);
      expect(before).toEqual(["a", "b"]);
    });

    it("drains the queue front-to-back across successive calls", () => {
      const { result } = renderHook(() => useQueue<number>([1, 2, 3]));

      const order: (number | undefined)[] = [];
      act(() => {
        order.push(result.current[1].remove());
      });
      act(() => {
        order.push(result.current[1].remove());
      });
      act(() => {
        order.push(result.current[1].remove());
      });

      expect(order).toEqual([1, 2, 3]);
      expect(result.current[0]).toEqual([]);
    });

    it("advances state correctly when called multiple times in one batch", () => {
      const { result } = renderHook(() => useQueue<number>([1, 2, 3]));

      // Two synchronous removes before a re-render: the returned snapshots are
      // both the pre-render front, but the settled state advances by two.
      let first: number | undefined;
      let second: number | undefined;
      act(() => {
        first = result.current[1].remove();
        second = result.current[1].remove();
      });

      expect(first).toBe(1);
      expect(second).toBe(1); // documented batching caveat: same front snapshot
      expect(result.current[0]).toEqual([3]); // but state removed both 1 and 2
    });
  });

  // ============ peek ============
  describe("peek", () => {
    it("returns the front item without mutating the queue", () => {
      const { result } = renderHook(() => useQueue<string>(["a", "b"]));
      const before = result.current[0];

      expect(result.current[1].peek()).toBe("a");
      expect(result.current[0]).toBe(before); // unchanged
    });

    it("returns undefined when the queue is empty", () => {
      const { result } = renderHook(() => useQueue<string>());
      expect(result.current[1].peek()).toBeUndefined();
    });

    it("reflects the latest state after mutations", () => {
      const { result } = renderHook(() => useQueue<string>(["a", "b"]));

      expect(result.current[1].peek()).toBe("a");

      act(() => {
        result.current[1].remove();
      });

      expect(result.current[1].peek()).toBe("b");
    });
  });

  // ============ clear ============
  describe("clear", () => {
    it("empties the queue", () => {
      const { result } = renderHook(() => useQueue<string>(["a", "b"]));

      act(() => {
        result.current[1].clear();
      });

      expect(result.current[0]).toEqual([]);
    });

    it("is a no-op (stable reference) when already empty", () => {
      const { result } = renderHook(() => useQueue<string>());
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
      const { result } = renderHook(() => useQueue<string>(["a", "b"]));

      act(() => {
        result.current[1].add("c");
        result.current[1].remove();
      });
      expect(result.current[0]).toEqual(["b", "c"]);

      act(() => {
        result.current[1].reset();
      });

      expect(result.current[0]).toEqual(["a", "b"]);
    });

    it("does not let post-reset mutations leak into the stored initial", () => {
      const { result } = renderHook(() => useQueue<string>(["a"]));

      act(() => {
        result.current[1].reset();
      });
      act(() => {
        result.current[1].add("b");
      });
      act(() => {
        result.current[1].reset();
      });

      expect(result.current[0]).toEqual(["a"]);
    });
  });

  // ============ Reference stability ============
  describe("reference stability", () => {
    it("keeps the actions object and each action stable across renders", () => {
      const { result, rerender } = renderHook(() => useQueue<string>());
      const before = result.current[1];

      rerender();

      const after = result.current[1];
      expect(after).toBe(before);
      expect(after.add).toBe(before.add);
      expect(after.remove).toBe(before.remove);
      expect(after.peek).toBe(before.peek);
      expect(after.clear).toBe(before.clear);
      expect(after.reset).toBe(before.reset);
    });

    it("keeps actions stable even after state changes", () => {
      const { result } = renderHook(() => useQueue<string>());
      const addBefore = result.current[1].add;

      act(() => {
        result.current[1].add("a");
      });

      expect(result.current[1].add).toBe(addBefore);
    });
  });

  // ============ Generics / object values ============
  describe("generics", () => {
    it("works with object references", () => {
      const taskA = { id: 1 };
      const taskB = { id: 2 };
      const { result } = renderHook(() => useQueue<{ id: number }>([taskA]));

      act(() => {
        result.current[1].add(taskB);
      });

      let removed: { id: number } | undefined;
      act(() => {
        removed = result.current[1].remove();
      });

      expect(removed).toBe(taskA);
      expect(result.current[0]).toEqual([taskB]);
    });
  });
});
