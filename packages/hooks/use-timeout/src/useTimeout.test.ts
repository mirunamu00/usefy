import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimeout } from "./useTimeout";

describe("useTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout"],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ============ 1. Basic Behavior ============
  describe("basic behavior", () => {
    it("should execute callback after delay", () => {
      const callback = vi.fn();

      renderHook(() => useTimeout(callback, 1000));

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should not execute callback before delay", () => {
      const callback = vi.fn();

      renderHook(() => useTimeout(callback, 1000));

      act(() => {
        vi.advanceTimersByTime(999);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should return correct interface", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useTimeout(callback, 1000));

      expect(result.current).toHaveProperty("reset");
      expect(result.current).toHaveProperty("clear");
      expect(result.current).toHaveProperty("isPending");
      expect(typeof result.current.reset).toBe("function");
      expect(typeof result.current.clear).toBe("function");
      expect(typeof result.current.isPending).toBe("boolean");
    });
  });

  // ============ 2. Automatic Cleanup (Unmount) ============
  describe("automatic cleanup", () => {
    it("should not execute callback on unmount", () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() => useTimeout(callback, 1000));

      act(() => {
        vi.advanceTimersByTime(500);
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should clean up timeout on unmount", () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      const callback = vi.fn();

      const { unmount } = renderHook(() => useTimeout(callback, 1000));

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  // ============ 3. Delay Change ============
  describe("delay change", () => {
    it("should reset timer when delay changes", () => {
      const callback = vi.fn();

      const { rerender } = renderHook(
        ({ delay }) => useTimeout(callback, delay),
        { initialProps: { delay: 1000 } }
      );

      // Advance 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Change delay to 2000ms
      rerender({ delay: 2000 });

      // Advance another 1500ms (total 2000ms from first render)
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Should not have fired yet (need 2000ms from rerender)
      expect(callback).not.toHaveBeenCalled();

      // Advance remaining 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle delay change from number to null", () => {
      const callback = vi.fn();

      const { rerender, result } = renderHook(
        ({ delay }) => useTimeout(callback, delay),
        { initialProps: { delay: 1000 as number | null } }
      );

      expect(result.current.isPending).toBe(true);

      // Change to null
      rerender({ delay: null });

      expect(result.current.isPending).toBe(false);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ============ 4. Null Delay ============
  describe("null delay", () => {
    it("should not set timer when delay is null", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, null));

      expect(result.current.isPending).toBe(false);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should not set timer when delay is undefined", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, undefined));

      expect(result.current.isPending).toBe(false);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should start timer when delay changes from null to number", () => {
      const callback = vi.fn();

      const { rerender, result } = renderHook(
        ({ delay }) => useTimeout(callback, delay),
        { initialProps: { delay: null as number | null } }
      );

      expect(result.current.isPending).toBe(false);

      // Change to number
      rerender({ delay: 1000 });

      expect(result.current.isPending).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ============ 5. Reset Function ============
  describe("reset function", () => {
    it("should restart timer from beginning", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, 1000));

      // Advance 800ms
      act(() => {
        vi.advanceTimersByTime(800);
      });

      expect(callback).not.toHaveBeenCalled();

      // Reset
      act(() => {
        result.current.reset();
      });

      // Advance 800ms more (total 1600ms from start)
      act(() => {
        vi.advanceTimersByTime(800);
      });

      // Should not have fired (only 800ms from reset)
      expect(callback).not.toHaveBeenCalled();

      // Advance remaining 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when delay is null", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, null));

      act(() => {
        result.current.reset();
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should be stable across renders", () => {
      const callback = vi.fn();

      const { result, rerender } = renderHook(() =>
        useTimeout(callback, 1000)
      );

      const initialReset = result.current.reset;

      rerender();

      expect(result.current.reset).toBe(initialReset);
    });
  });

  // ============ 6. Clear Function ============
  describe("clear function", () => {
    it("should cancel timer", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, 1000));

      expect(result.current.isPending).toBe(true);

      act(() => {
        result.current.clear();
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should be safe to call multiple times", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, 1000));

      act(() => {
        result.current.clear();
        result.current.clear();
        result.current.clear();
      });

      expect(result.current.isPending).toBe(false);
    });

    it("should be stable across renders", () => {
      const callback = vi.fn();

      const { result, rerender } = renderHook(() =>
        useTimeout(callback, 1000)
      );

      const initialClear = result.current.clear;

      rerender();

      expect(result.current.clear).toBe(initialClear);
    });
  });

  // ============ 7. isPending State ============
  describe("isPending state", () => {
    it("should be true when timer is pending", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, 1000));

      expect(result.current.isPending).toBe(true);
    });

    it("should be false after timer executes", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, 1000));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isPending).toBe(false);
    });

    it("should be false after clear is called", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, 1000));

      act(() => {
        result.current.clear();
      });

      expect(result.current.isPending).toBe(false);
    });

    it("should be true after reset is called", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, 1000));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isPending).toBe(true);
    });

    it("should be false when delay is null", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, null));

      expect(result.current.isPending).toBe(false);
    });
  });

  // ============ 8. Callback Change ============
  describe("callback change", () => {
    it("should execute latest callback without resetting timer", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ callback }) => useTimeout(callback, 1000),
        { initialProps: { callback: callback1 } }
      );

      // Advance 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Change callback
      rerender({ callback: callback2 });

      // Advance remaining 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should execute callback2, not callback1
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should not reset timer when callback changes", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ callback }) => useTimeout(callback, 1000),
        { initialProps: { callback: callback1 } }
      );

      // Advance 800ms
      act(() => {
        vi.advanceTimersByTime(800);
      });

      // Change callback
      rerender({ callback: callback2 });

      // Only need 200ms more (not 1000ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  // ============ 9. Negative Delay ============
  describe("negative delay", () => {
    it("should treat negative delay as 0", () => {
      const callback = vi.fn();

      renderHook(() => useTimeout(callback, -1000));

      // Should execute on next tick (delay = 0)
      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should treat -1 as 0", () => {
      const callback = vi.fn();

      renderHook(() => useTimeout(callback, -1));

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ============ 10. SSR Environment ============
  describe("SSR environment", () => {
    it("should not throw error when setTimeout is available", () => {
      const callback = vi.fn();

      expect(() => {
        renderHook(() => useTimeout(callback, 1000));
      }).not.toThrow();
    });
  });

  // ============ Additional Edge Cases ============
  describe("edge cases", () => {
    it("should handle delay of 0", () => {
      const callback = vi.fn();

      renderHook(() => useTimeout(callback, 0));

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle very large delay", () => {
      const callback = vi.fn();
      // Use a large but safe value (1 hour)
      const largeDelay = 60 * 60 * 1000;

      const { result } = renderHook(() => useTimeout(callback, largeDelay));

      expect(result.current.isPending).toBe(true);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(callback).not.toHaveBeenCalled();
      expect(result.current.isPending).toBe(true);
    });

    it("should handle multiple resets in quick succession", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, 1000));

      act(() => {
        result.current.reset();
        result.current.reset();
        result.current.reset();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle reset after clear", () => {
      const callback = vi.fn();

      const { result } = renderHook(() => useTimeout(callback, 1000));

      act(() => {
        result.current.clear();
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isPending).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should maintain separate state across multiple instances", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { result: result1 } = renderHook(() =>
        useTimeout(callback1, 1000)
      );
      const { result: result2 } = renderHook(() =>
        useTimeout(callback2, 2000)
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
      expect(result1.current.isPending).toBe(false);
      expect(result2.current.isPending).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(callback2).toHaveBeenCalledTimes(1);
      expect(result2.current.isPending).toBe(false);
    });
  });
});
