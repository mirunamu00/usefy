import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useStack } from "./useStack";

describe("useStack", () => {
  // ============ Initialization ============
  describe("initialization", () => {
    it("starts empty by default", () => {
      const { result } = renderHook(() => useStack<string>());
      expect(result.current[0]).toEqual([]);
      expect(result.current[0].length).toBe(0);
    });

    it("initializes from an array (the last element is the top)", () => {
      const { result } = renderHook(() => useStack<string>(["a", "b", "c"]));
      expect(result.current[0]).toEqual(["a", "b", "c"]);
      expect(result.current[0][result.current[0].length - 1]).toBe("c");
      expect(result.current[0][0]).toBe("a");
    });

    it("initializes from an arbitrary iterable", () => {
      const { result } = renderHook(() => useStack(new Set(["a", "b"])));
      expect(result.current[0]).toEqual(["a", "b"]);
    });

    it("initializes from a lazy factory (called once)", () => {
      let calls = 0;
      const { result, rerender } = renderHook(() =>
        useStack<number>(() => {
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
      const { result } = renderHook(() => useStack(source));

      act(() => {
        result.current[1].push("b");
      });
      act(() => {
        result.current[1].pop();
      });

      expect(source).toEqual(["a"]);
    });
  });

  // ============ push ============
  describe("push", () => {
    it("appends a single item to the top", () => {
      const { result } = renderHook(() => useStack<string>(["a"]));

      act(() => {
        result.current[1].push("b");
      });

      expect(result.current[0]).toEqual(["a", "b"]);
    });

    it("appends multiple items in order (variadic; last is top)", () => {
      const { result } = renderHook(() => useStack<number>([1]));

      act(() => {
        result.current[1].push(2, 3, 4);
      });

      expect(result.current[0]).toEqual([1, 2, 3, 4]);
      expect(result.current[0][result.current[0].length - 1]).toBe(4);
    });

    it("produces a new array reference and leaves the previous untouched", () => {
      const { result } = renderHook(() => useStack<string>());
      const before = result.current[0];

      act(() => {
        result.current[1].push("a");
      });

      expect(result.current[0]).not.toBe(before);
      expect(before).toEqual([]);
    });

    it("is a no-op (stable reference) when called with no items", () => {
      const { result } = renderHook(() => useStack<string>(["a"]));
      const before = result.current[0];

      act(() => {
        result.current[1].push();
      });

      expect(result.current[0]).toBe(before);
    });
  });

  // ============ pop ============
  describe("pop", () => {
    it("removes and returns the top item (LIFO)", () => {
      const { result } = renderHook(() => useStack<string>(["a", "b", "c"]));

      let popped: string | undefined;
      act(() => {
        popped = result.current[1].pop();
      });

      expect(popped).toBe("c");
      expect(result.current[0]).toEqual(["a", "b"]);
    });

    it("returns undefined and is a no-op (stable reference) when empty", () => {
      const { result } = renderHook(() => useStack<string>());
      const before = result.current[0];

      let popped: string | undefined;
      act(() => {
        popped = result.current[1].pop();
      });

      expect(popped).toBeUndefined();
      expect(result.current[0]).toBe(before);
    });

    it("produces a new array reference and leaves the previous untouched", () => {
      const { result } = renderHook(() => useStack<string>(["a", "b"]));
      const before = result.current[0];

      act(() => {
        result.current[1].pop();
      });

      expect(result.current[0]).not.toBe(before);
      expect(before).toEqual(["a", "b"]);
    });

    it("drains the stack top-to-bottom across successive calls (LIFO)", () => {
      const { result } = renderHook(() => useStack<number>([1, 2, 3]));

      const order: (number | undefined)[] = [];
      act(() => {
        order.push(result.current[1].pop());
      });
      act(() => {
        order.push(result.current[1].pop());
      });
      act(() => {
        order.push(result.current[1].pop());
      });

      expect(order).toEqual([3, 2, 1]);
      expect(result.current[0]).toEqual([]);
    });

    it("yields LIFO order end-to-end: push 1,2,3 then pop 3,2,1", () => {
      const { result } = renderHook(() => useStack<number>());

      act(() => {
        result.current[1].push(1);
      });
      act(() => {
        result.current[1].push(2);
      });
      act(() => {
        result.current[1].push(3);
      });

      const order: (number | undefined)[] = [];
      act(() => {
        order.push(result.current[1].pop());
      });
      act(() => {
        order.push(result.current[1].pop());
      });
      act(() => {
        order.push(result.current[1].pop());
      });

      expect(order).toEqual([3, 2, 1]);
    });

    it("shrinks state correctly when called multiple times in one batch", () => {
      const { result } = renderHook(() => useStack<number>([1, 2, 3]));

      // Two synchronous pops before a re-render: the returned snapshots are
      // both the pre-render top, but the settled state shrinks by two.
      let first: number | undefined;
      let second: number | undefined;
      act(() => {
        first = result.current[1].pop();
        second = result.current[1].pop();
      });

      expect(first).toBe(3);
      expect(second).toBe(3); // documented batching caveat: same top snapshot
      expect(result.current[0]).toEqual([1]); // but state removed both 3 and 2
    });
  });

  // ============ peek ============
  describe("peek", () => {
    it("returns the top item without mutating the stack", () => {
      const { result } = renderHook(() => useStack<string>(["a", "b"]));
      const before = result.current[0];

      expect(result.current[1].peek()).toBe("b");
      expect(result.current[0]).toBe(before); // unchanged
    });

    it("returns undefined when the stack is empty", () => {
      const { result } = renderHook(() => useStack<string>());
      expect(result.current[1].peek()).toBeUndefined();
    });

    it("reflects the latest state after mutations", () => {
      const { result } = renderHook(() => useStack<string>(["a", "b"]));

      expect(result.current[1].peek()).toBe("b");

      act(() => {
        result.current[1].pop();
      });

      expect(result.current[1].peek()).toBe("a");
    });
  });

  // ============ clear ============
  describe("clear", () => {
    it("empties the stack", () => {
      const { result } = renderHook(() => useStack<string>(["a", "b"]));

      act(() => {
        result.current[1].clear();
      });

      expect(result.current[0]).toEqual([]);
    });

    it("is a no-op (stable reference) when already empty", () => {
      const { result } = renderHook(() => useStack<string>());
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
      const { result } = renderHook(() => useStack<string>(["a", "b"]));

      act(() => {
        result.current[1].push("c");
        result.current[1].pop();
        result.current[1].pop();
      });
      expect(result.current[0]).toEqual(["a"]);

      act(() => {
        result.current[1].reset();
      });

      expect(result.current[0]).toEqual(["a", "b"]);
    });

    it("does not let post-reset mutations leak into the stored initial", () => {
      const { result } = renderHook(() => useStack<string>(["a"]));

      act(() => {
        result.current[1].reset();
      });
      act(() => {
        result.current[1].push("b");
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
      const { result, rerender } = renderHook(() => useStack<string>());
      const before = result.current[1];

      rerender();

      const after = result.current[1];
      expect(after).toBe(before);
      expect(after.push).toBe(before.push);
      expect(after.pop).toBe(before.pop);
      expect(after.peek).toBe(before.peek);
      expect(after.clear).toBe(before.clear);
      expect(after.reset).toBe(before.reset);
    });

    it("keeps actions stable even after state changes", () => {
      const { result } = renderHook(() => useStack<string>());
      const pushBefore = result.current[1].push;

      act(() => {
        result.current[1].push("a");
      });

      expect(result.current[1].push).toBe(pushBefore);
    });
  });

  // ============ Generics / object values ============
  describe("generics", () => {
    it("works with object references", () => {
      const snapshotA = { id: 1 };
      const snapshotB = { id: 2 };
      const { result } = renderHook(() =>
        useStack<{ id: number }>([snapshotA])
      );

      act(() => {
        result.current[1].push(snapshotB);
      });

      let popped: { id: number } | undefined;
      act(() => {
        popped = result.current[1].pop();
      });

      expect(popped).toBe(snapshotB);
      expect(result.current[0]).toEqual([snapshotA]);
    });
  });
});
