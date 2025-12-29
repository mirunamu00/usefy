import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useThrottleCallback } from "./useThrottleCallback";

describe("useThrottleCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should return a throttled function", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      expect(typeof result.current).toBe("function");
    });

    it("should have cancel method", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      expect(typeof result.current.cancel).toBe("function");
    });

    it("should have flush method", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      expect(typeof result.current.flush).toBe("function");
    });

    it("should have pending method", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      expect(typeof result.current.pending).toBe("function");
    });

    it("should use default delay of 500ms when not provided", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback));

      act(() => {
        result.current();
      });

      // Leading edge: should execute immediately by default
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("basic throttling behavior", () => {
    it("should execute immediately on first call (leading edge by default)", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current();
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should throttle subsequent calls within the interval", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current("second");
        result.current("third");
      });

      // Still 1, subsequent calls are throttled
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should execute trailing edge after interval completes", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("first");

      act(() => {
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith("second");
    });

    it("should limit execution to at most once per interval", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 1000));

      // First call - leading edge
      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Calls within the interval - should be throttled
      act(() => {
        vi.advanceTimersByTime(300);
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(300);
        result.current("third");
      });

      act(() => {
        vi.advanceTimersByTime(300);
        result.current("fourth");
      });

      // At 900ms, only the leading call has executed
      expect(callback).toHaveBeenCalledTimes(1);

      // At 1000ms, trailing edge fires with the latest arguments
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith("fourth");
    });

    it("should pass arguments to the callback", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("arg1", "arg2", 123);
      });

      expect(callback).toHaveBeenCalledWith("arg1", "arg2", 123);
    });

    it("should use the latest arguments for trailing edge", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current("second");
        result.current("third");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith("third");
    });

    it("should allow new leading edge call after interval has passed", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      // First leading call
      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Wait for interval to pass
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // New leading call should execute immediately
      act(() => {
        result.current("second");
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith("second");
    });
  });

  describe("leading edge option", () => {
    it("should invoke callback immediately with leading: true (default)", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useThrottleCallback(callback, 500, { leading: true })
      );

      act(() => {
        result.current("immediate");
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("immediate");
    });

    it("should not invoke immediately with leading: false", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useThrottleCallback(callback, 500, { leading: false })
      );

      act(() => {
        result.current("delayed");
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("delayed");
    });

    it("should not invoke on trailing edge when leading: true and trailing: false", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useThrottleCallback(callback, 500, { leading: true, trailing: false })
      );

      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Still 1, no trailing call
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("trailing edge option", () => {
    it("should invoke on trailing edge by default", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith("second");
    });

    it("should not invoke on trailing edge when trailing: false", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useThrottleCallback(callback, 500, { trailing: false })
      );

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Only leading call
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("first");
    });

    it("should invoke only on trailing edge when leading: false and trailing: true", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useThrottleCallback(callback, 500, { leading: false, trailing: true })
      );

      act(() => {
        result.current("first");
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("second");
    });
  });

  describe("cancel method", () => {
    it("should cancel pending invocations", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current("second");
      });

      act(() => {
        result.current.cancel();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Trailing call was cancelled
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should allow new invocations after cancel", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current.cancel();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      act(() => {
        result.current("second");
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith("second");
    });
  });

  describe("flush method", () => {
    it("should immediately invoke pending callback", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current("second");
      });

      act(() => {
        result.current.flush();
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith("second");
    });

    it("should prevent later invocation after flush", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current("second");
      });

      act(() => {
        result.current.flush();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Only 2 calls: leading + flushed
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("should do nothing if there's no pending invocation", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useThrottleCallback(callback, 500, { leading: false })
      );

      act(() => {
        result.current.flush();
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("pending method", () => {
    it("should return false when there is no pending invocation", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      expect(result.current.pending()).toBe(false);
    });

    it("should return true when there is a pending invocation", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current("second");
      });

      expect(result.current.pending()).toBe(true);
    });

    it("should return false after the pending invocation is executed", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current("second");
      });

      expect(result.current.pending()).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.pending()).toBe(false);
    });

    it("should return false after cancel", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current("second");
      });

      expect(result.current.pending()).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.pending()).toBe(false);
    });

    it("should return false after flush", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current("second");
      });

      expect(result.current.pending()).toBe(true);

      act(() => {
        result.current.flush();
      });

      expect(result.current.pending()).toBe(false);
    });
  });

  describe("return value", () => {
    it("should return callback result on leading edge invocation", () => {
      const callback = vi.fn(() => "result");
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      let returnValue: string | undefined;
      act(() => {
        returnValue = result.current();
      });

      expect(returnValue).toBe("result");
    });

    it("should return last cached result for throttled calls", () => {
      const callback = vi.fn(() => "result");
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current();
      });

      let returnValue: string | undefined;
      act(() => {
        returnValue = result.current();
      });

      // Throttled calls return the last cached result (lodash behavior)
      expect(returnValue).toBe("result");
    });

    it("should return last result from flush", () => {
      const callback = vi.fn(() => "flushed-result");
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      act(() => {
        result.current();
      });

      act(() => {
        result.current();
      });

      let flushResult: string | undefined;
      act(() => {
        flushResult = result.current.flush();
      });

      expect(flushResult).toBe("flushed-result");
    });
  });

  describe("callback reference updates", () => {
    it("should use the latest callback function", () => {
      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      const { result, rerender } = renderHook(
        ({ cb }) => useThrottleCallback(cb, 500),
        { initialProps: { cb: firstCallback } }
      );

      act(() => {
        result.current("test");
      });

      // First callback called on leading edge
      expect(firstCallback).toHaveBeenCalledTimes(1);

      rerender({ cb: secondCallback });

      act(() => {
        result.current("test2");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Trailing edge uses the new callback
      expect(secondCallback).toHaveBeenCalledTimes(1);
      expect(secondCallback).toHaveBeenCalledWith("test2");
    });
  });

  describe("function reference stability", () => {
    it("should maintain stable function reference across rerenders", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() =>
        useThrottleCallback(callback, 500)
      );

      const firstReference = result.current;

      rerender();

      expect(result.current).toBe(firstReference);
    });

    it("should maintain stable function reference when delay changes", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ delay }) => useThrottleCallback(callback, delay),
        { initialProps: { delay: 500 } }
      );

      const firstReference = result.current;

      rerender({ delay: 1000 });

      expect(result.current).toBe(firstReference);
    });

    it("should maintain stable function reference when options change", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ leading }) => useThrottleCallback(callback, 500, { leading }),
        { initialProps: { leading: true } }
      );

      const firstReference = result.current;

      rerender({ leading: false });

      expect(result.current).toBe(firstReference);
    });

    it("should maintain stable cancel method reference", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() =>
        useThrottleCallback(callback, 500)
      );

      const firstCancel = result.current.cancel;

      rerender();

      expect(result.current.cancel).toBe(firstCancel);
    });

    it("should maintain stable flush method reference", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() =>
        useThrottleCallback(callback, 500)
      );

      const firstFlush = result.current.flush;

      rerender();

      expect(result.current.flush).toBe(firstFlush);
    });

    it("should maintain stable pending method reference", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() =>
        useThrottleCallback(callback, 500)
      );

      const firstPending = result.current.pending;

      rerender();

      expect(result.current.pending).toBe(firstPending);
    });
  });

  describe("multiple instances", () => {
    it("should maintain independent state for multiple hook instances", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { result: result1 } = renderHook(() =>
        useThrottleCallback(callback1, 500)
      );
      const { result: result2 } = renderHook(() =>
        useThrottleCallback(callback2, 300)
      );

      act(() => {
        result1.current("first");
        result2.current("second");
      });

      // Both should have executed immediately (leading edge)
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      act(() => {
        result1.current("first-2");
        result2.current("second-2");
      });

      // Both have pending calls now
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Only callback2 should have trailing call
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenLastCalledWith("second-2");

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Now callback1 should also have trailing call
      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback1).toHaveBeenLastCalledWith("first-2");
    });
  });

  describe("cleanup on unmount", () => {
    it("should cancel pending invocations on unmount", () => {
      const callback = vi.fn();
      const { result, unmount } = renderHook(() =>
        useThrottleCallback(callback, 500)
      );

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current("second");
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Only leading call, trailing was cancelled
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("should handle delay of 0", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 0));

      act(() => {
        result.current("first");
      });

      // Leading edge should execute immediately
      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("should not invoke callback when both leading and trailing are false", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useThrottleCallback(callback, 500, { leading: false, trailing: false })
      );

      act(() => {
        result.current("test");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle continuous rapid calls", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 100));

      // Simulate rapid calls over 500ms
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current(i);
          vi.advanceTimersByTime(10);
        });
      }

      // Wait for any trailing edge
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should have executed approximately 5-6 times (every 100ms over 500ms)
      expect(callback.mock.calls.length).toBeGreaterThanOrEqual(5);
      expect(callback.mock.calls.length).toBeLessThanOrEqual(7);
    });

    it("should handle callback that throws an error", () => {
      const error = new Error("Test error");
      const callback = vi.fn(() => {
        throw error;
      });
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      expect(() => {
        act(() => {
          result.current();
        });
      }).toThrow("Test error");

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle callback that returns undefined", () => {
      const callback = vi.fn(() => undefined);
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      let returnValue: undefined;
      act(() => {
        returnValue = result.current();
      });

      expect(returnValue).toBeUndefined();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttle vs debounce behavior", () => {
    it("should execute during continuous calls (unlike debounce)", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      // First call - leading edge
      act(() => {
        result.current("call-1");
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Continuous calls every 100ms
      for (let i = 2; i <= 10; i++) {
        act(() => {
          vi.advanceTimersByTime(100);
          result.current(`call-${i}`);
        });
      }

      // At 900ms, should have had at least one more execution (at 500ms)
      expect(callback).toHaveBeenCalledTimes(2);

      // Wait for final trailing edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should have at least 2 calls (leading + trailing within interval)
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it("should guarantee execution within maxWait time (implemented via maxWait = delay)", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useThrottleCallback(callback, 500));

      // This test verifies throttle behavior: calls are guaranteed to execute
      // at most every 500ms, unlike debounce which can be delayed indefinitely

      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Keep calling every 100ms
      for (let i = 0; i < 4; i++) {
        act(() => {
          vi.advanceTimersByTime(100);
          result.current("continuous");
        });
      }

      // At 400ms, still only leading call
      expect(callback).toHaveBeenCalledTimes(1);

      // At 500ms, maxWait triggers
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });
});
