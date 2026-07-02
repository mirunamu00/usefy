import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useHistoryState } from "./useHistoryState";

describe("useHistoryState", () => {
  // ============ Initialization ============
  describe("initialization", () => {
    it("starts with the initial state as the sole history entry", () => {
      const { result } = renderHook(() => useHistoryState(0));
      expect(result.current.state).toBe(0);
      expect(result.current.history).toEqual([0]);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it("supports a lazy initializer (called once)", () => {
      let calls = 0;
      const { rerender, result } = renderHook(() =>
        useHistoryState(() => {
          calls++;
          return { count: 5 };
        })
      );

      rerender();
      rerender();

      expect(calls).toBe(1);
      expect(result.current.state).toEqual({ count: 5 });
    });

    it("handles falsy initial values (null / 0 / '')", () => {
      const { result } = renderHook(() => useHistoryState<null | number>(null));
      expect(result.current.state).toBeNull();
      expect(result.current.history).toEqual([null]);
    });
  });

  // ============ set ============
  describe("set", () => {
    it("records a new value and enables undo", () => {
      const { result } = renderHook(() => useHistoryState(0));

      act(() => result.current.set(1));

      expect(result.current.state).toBe(1);
      expect(result.current.history).toEqual([0, 1]);
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it("accepts an updater function (prev => next)", () => {
      const { result } = renderHook(() => useHistoryState({ count: 0 }));

      act(() => result.current.set((s) => ({ count: s.count + 1 })));
      act(() => result.current.set((s) => ({ count: s.count + 1 })));

      expect(result.current.state).toEqual({ count: 2 });
      expect(result.current.history).toHaveLength(3);
    });

    it("is a no-op (records nothing) when setting the current value", () => {
      const { result } = renderHook(() => useHistoryState(5));
      const before = result.current.history;

      act(() => result.current.set(5));

      expect(result.current.history).toBe(before);
      expect(result.current.history).toEqual([5]);
    });

    it("discards future entries when setting after an undo", () => {
      const { result } = renderHook(() => useHistoryState(0));

      act(() => result.current.set(1));
      act(() => result.current.set(2));
      act(() => result.current.undo()); // back to 1, future = [2]

      expect(result.current.canRedo).toBe(true);

      act(() => result.current.set(9)); // branches off, dropping 2

      expect(result.current.history).toEqual([0, 1, 9]);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.state).toBe(9);
    });
  });

  // ============ undo / redo ============
  describe("undo / redo", () => {
    it("steps backward and forward through history", () => {
      const { result } = renderHook(() => useHistoryState("a"));

      act(() => result.current.set("b"));
      act(() => result.current.set("c"));

      act(() => result.current.undo());
      expect(result.current.state).toBe("b");
      expect(result.current.canRedo).toBe(true);

      act(() => result.current.undo());
      expect(result.current.state).toBe("a");
      expect(result.current.canUndo).toBe(false);

      act(() => result.current.redo());
      expect(result.current.state).toBe("b");

      act(() => result.current.redo());
      expect(result.current.state).toBe("c");
      expect(result.current.canRedo).toBe(false);
    });

    it("undo is a no-op (stable reference) at the start of history", () => {
      const { result } = renderHook(() => useHistoryState(0));
      const before = result.current.history;

      act(() => result.current.undo());

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.history).toBe(before);
    });

    it("redo is a no-op (stable reference) at the end of history", () => {
      const { result } = renderHook(() => useHistoryState(0));
      act(() => result.current.set(1));

      const before = result.current.history;
      act(() => result.current.redo());

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.history).toBe(before);
    });

    it("keeps the same history array reference across undo/redo (no reallocation)", () => {
      const { result } = renderHook(() => useHistoryState(0));
      act(() => result.current.set(1));
      const hist = result.current.history;

      act(() => result.current.undo());
      expect(result.current.history).toBe(hist);
      act(() => result.current.redo());
      expect(result.current.history).toBe(hist);
    });
  });

  // ============ goTo ============
  describe("goTo", () => {
    it("jumps to a specific index", () => {
      const { result } = renderHook(() => useHistoryState(0));
      act(() => result.current.set(1));
      act(() => result.current.set(2));
      act(() => result.current.set(3));

      act(() => result.current.goTo(1));

      expect(result.current.state).toBe(1);
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });

    it("clamps out-of-range indices to the valid bounds", () => {
      const { result } = renderHook(() => useHistoryState(0));
      act(() => result.current.set(1));
      act(() => result.current.set(2));

      act(() => result.current.goTo(99));
      expect(result.current.currentIndex).toBe(2);

      act(() => result.current.goTo(-5));
      expect(result.current.currentIndex).toBe(0);
    });

    it("is a no-op (stable reference) when jumping to the current index", () => {
      const { result } = renderHook(() => useHistoryState(0));
      act(() => result.current.set(1));
      const before = result.current.history;

      act(() => result.current.goTo(1));

      expect(result.current.history).toBe(before);
    });
  });

  // ============ limit ============
  describe("limit", () => {
    it("drops the oldest entries when exceeding the limit", () => {
      const { result } = renderHook(() => useHistoryState(0, { limit: 3 }));

      act(() => result.current.set(1));
      act(() => result.current.set(2));
      act(() => result.current.set(3)); // would be [0,1,2,3] -> capped to [1,2,3]

      expect(result.current.history).toEqual([1, 2, 3]);
      expect(result.current.currentIndex).toBe(2);
      expect(result.current.state).toBe(3);
    });

    it("keeps canUndo correct after trimming (index stays in range)", () => {
      const { result } = renderHook(() => useHistoryState(0, { limit: 2 }));

      act(() => result.current.set(1));
      act(() => result.current.set(2)); // [1,2]

      expect(result.current.history).toEqual([1, 2]);
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.canUndo).toBe(true);

      act(() => result.current.undo());
      expect(result.current.state).toBe(1);
      expect(result.current.canUndo).toBe(false);
    });

    it("treats a limit below 1 as unlimited", () => {
      const { result } = renderHook(() => useHistoryState(0, { limit: 0 }));

      act(() => result.current.set(1));
      act(() => result.current.set(2));
      act(() => result.current.set(3));

      expect(result.current.history).toEqual([0, 1, 2, 3]);
    });
  });

  // ============ clear ============
  describe("clear", () => {
    it("collapses the timeline to just the current state", () => {
      const { result } = renderHook(() => useHistoryState(0));
      act(() => result.current.set(1));
      act(() => result.current.set(2));
      act(() => result.current.undo()); // present is 1

      act(() => result.current.clear());

      expect(result.current.history).toEqual([1]);
      expect(result.current.state).toBe(1);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it("is a no-op (stable reference) when only one entry exists", () => {
      const { result } = renderHook(() => useHistoryState(0));
      const before = result.current.history;

      act(() => result.current.clear());

      expect(result.current.history).toBe(before);
    });
  });

  // ============ reset ============
  describe("reset", () => {
    it("restores the initial state and wipes history", () => {
      const { result } = renderHook(() => useHistoryState(0));
      act(() => result.current.set(1));
      act(() => result.current.set(2));

      act(() => result.current.reset());

      expect(result.current.state).toBe(0);
      expect(result.current.history).toEqual([0]);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canUndo).toBe(false);
    });
  });

  // ============ Reference stability ============
  describe("reference stability", () => {
    it("keeps every control function stable across renders", () => {
      const { result, rerender } = renderHook(() => useHistoryState(0));
      const before = result.current;

      rerender();

      const after = result.current;
      expect(after.set).toBe(before.set);
      expect(after.undo).toBe(before.undo);
      expect(after.redo).toBe(before.redo);
      expect(after.goTo).toBe(before.goTo);
      expect(after.clear).toBe(before.clear);
      expect(after.reset).toBe(before.reset);
    });

    it("keeps controls stable even after state changes", () => {
      const { result } = renderHook(() => useHistoryState(0));
      const setBefore = result.current.set;

      act(() => result.current.set(1));

      expect(result.current.set).toBe(setBefore);
    });

    it("honors a changed limit option without breaking control stability", () => {
      const { result, rerender } = renderHook(
        ({ limit }) => useHistoryState(0, { limit }),
        { initialProps: { limit: 10 } }
      );
      const setBefore = result.current.set;

      // Shrink the limit, then push enough entries to trigger trimming.
      rerender({ limit: 2 });
      expect(result.current.set).toBe(setBefore); // still stable

      act(() => result.current.set(1));
      act(() => result.current.set(2));

      expect(result.current.history).toEqual([1, 2]);
    });
  });
});
