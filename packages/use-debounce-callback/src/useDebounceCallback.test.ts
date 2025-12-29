import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounceCallback } from "./useDebounceCallback";

describe("useDebounceCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should return a debounced function", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      expect(typeof result.current).toBe("function");
    });

    it("should have cancel method", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      expect(typeof result.current.cancel).toBe("function");
    });

    it("should have flush method", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      expect(typeof result.current.flush).toBe("function");
    });

    it("should have pending method", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      expect(typeof result.current.pending).toBe("function");
    });

    it("should use default delay of 500ms when not provided", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback));

      act(() => {
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("basic debouncing behavior", () => {
    it("should debounce callback invocations", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current();
        result.current();
        result.current();
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should delay callback execution by the specified delay", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 1000));

      act(() => {
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should reset delay on each call", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(400);
      });

      act(() => {
        result.current(); // Reset the timer
      });

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should pass arguments to the callback", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current("arg1", "arg2", 123);
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledWith("arg1", "arg2", 123);
    });

    it("should use the latest arguments when debouncing", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current("first");
        result.current("second");
        result.current("third");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("third");
    });
  });

  describe("leading edge option", () => {
    it("should invoke callback immediately with leading: true", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: true })
      );

      act(() => {
        result.current("immediate");
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("immediate");
    });

    it("should not invoke on trailing edge when leading: true and trailing: false", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: true, trailing: false })
      );

      act(() => {
        result.current();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1); // Still 1, no trailing call
    });

    it("should invoke both on leading and trailing edge when both are true", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: true, trailing: true })
      );

      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("first");

      act(() => {
        vi.advanceTimersByTime(100);
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

    it("should only invoke on leading edge if delay has not passed since last call", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: true })
      );

      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(300); // Not enough time passed
      });

      act(() => {
        result.current("second");
      });

      expect(callback).toHaveBeenCalledTimes(1); // Still 1, leading edge not triggered
    });
  });

  describe("trailing edge option", () => {
    it("should not invoke callback on trailing edge when trailing: false", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { trailing: false })
      );

      act(() => {
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should invoke callback on trailing edge by default", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("maxWait option", () => {
    it("should invoke callback after maxWait time even if still being called", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { maxWait: 1000 })
      );

      act(() => {
        result.current("first");
      });

      act(() => {
        vi.advanceTimersByTime(400);
      });

      act(() => {
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(400);
      });

      act(() => {
        result.current("third");
      });

      // At this point, 800ms have passed since first call
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(200); // Total 1000ms since first call
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("third");
    });

    it("should reset maxWait timer after invocation", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { maxWait: 1000 })
      );

      // First invocation
      act(() => {
        result.current("first");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Second invocation - keep calling to prevent trailing from executing
      act(() => {
        result.current("second");
      });

      // Keep calling every 400ms to reset trailing timer (< 500ms delay)
      act(() => {
        vi.advanceTimersByTime(400);
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(400);
        result.current("second");
      });

      // Now at 800ms since "second" was first called
      // Trailing hasn't fired because we keep resetting it
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance to 999ms - still no maxWait (needs 1000ms)
      act(() => {
        vi.advanceTimersByTime(199);
      });

      expect(callback).toHaveBeenCalledTimes(1); // maxWait timer was reset

      // Advance 1ms more to hit maxWait (total 1000ms)
      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(callback).toHaveBeenCalledTimes(2); // maxWait fires
    });
  });

  describe("cancel method", () => {
    it("should cancel pending invocations", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current("test");
      });

      act(() => {
        result.current.cancel();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should cancel maxWait timeout", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { maxWait: 1000 })
      );

      // Call and keep calling to prevent trailing from executing
      act(() => {
        result.current("test");
      });

      act(() => {
        vi.advanceTimersByTime(400);
        result.current("test");
      });

      act(() => {
        vi.advanceTimersByTime(400);
        result.current("test");
      });

      // Now at 800ms, trailing hasn't fired, maxWait will fire at 1000ms
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // At 900ms, cancel everything
      act(() => {
        result.current.cancel();
      });

      // Advance past where maxWait would have fired (1000ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should allow new invocations after cancel", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current("first");
      });

      act(() => {
        result.current.cancel();
      });

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

  describe("flush method", () => {
    it("should immediately invoke pending callback", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current("test");
      });

      act(() => {
        result.current.flush();
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("test");
    });

    it("should prevent later invocation after flush", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current("test");
      });

      act(() => {
        result.current.flush();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1); // Only the flush call
    });

    it("should do nothing if there's no pending invocation", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current.flush();
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should flush maxWait pending invocation", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { maxWait: 1000 })
      );

      act(() => {
        result.current("test");
      });

      act(() => {
        vi.advanceTimersByTime(900);
      });

      act(() => {
        result.current.flush();
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("test");

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(callback).toHaveBeenCalledTimes(1); // No additional calls
    });
  });

  describe("pending method", () => {
    it("should return false when there is no pending invocation", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      expect(result.current.pending()).toBe(false);
    });

    it("should return true when there is a pending invocation", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current("test");
      });

      expect(result.current.pending()).toBe(true);
    });

    it("should return false after the pending invocation is executed", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current("test");
      });

      expect(result.current.pending()).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.pending()).toBe(false);
    });

    it("should return false after cancel", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current("test");
      });

      expect(result.current.pending()).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.pending()).toBe(false);
    });

    it("should return false after flush", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current("test");
      });

      expect(result.current.pending()).toBe(true);

      act(() => {
        result.current.flush();
      });

      expect(result.current.pending()).toBe(false);
    });
  });

  describe("return value", () => {
    it("should return undefined before first invocation", () => {
      const callback = vi.fn(() => "result");
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      let returnValue: string | undefined;
      act(() => {
        returnValue = result.current();
      });

      expect(returnValue).toBeUndefined();
    });

    it("should return callback result on leading edge invocation", () => {
      const callback = vi.fn(() => "result");
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: true })
      );

      let returnValue: string | undefined;
      act(() => {
        returnValue = result.current();
      });

      expect(returnValue).toBe("result");
    });

    it("should return last result from flush", () => {
      const callback = vi.fn(() => "flushed-result");
      const { result } = renderHook(() => useDebounceCallback(callback, 500));

      act(() => {
        result.current();
      });

      let flushResult: string | undefined;
      act(() => {
        flushResult = result.current.flush();
      });

      expect(flushResult).toBe("flushed-result");
    });

    it("should return last result when no pending invocation on flush", () => {
      const callback = vi.fn(() => "result");
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: true })
      );

      act(() => {
        result.current();
      });

      // Wait for trailing edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Flush with no pending invocation should return last result
      let flushResult: string | undefined;
      act(() => {
        flushResult = result.current.flush();
      });

      expect(flushResult).toBe("result");
    });
  });

  describe("callback reference updates", () => {
    it("should use the latest callback function", () => {
      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      const { result, rerender } = renderHook(
        ({ cb }) => useDebounceCallback(cb, 500),
        { initialProps: { cb: firstCallback } }
      );

      act(() => {
        result.current("test");
      });

      rerender({ cb: secondCallback });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(firstCallback).not.toHaveBeenCalled();
      expect(secondCallback).toHaveBeenCalledTimes(1);
      expect(secondCallback).toHaveBeenCalledWith("test");
    });
  });

  describe("function reference stability", () => {
    it("should maintain stable function reference across rerenders", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: true })
      );

      const firstReference = result.current;

      rerender();

      expect(result.current).toBe(firstReference);
    });

    it("should maintain stable function reference when delay changes", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ delay }) => useDebounceCallback(callback, delay),
        { initialProps: { delay: 500 } }
      );

      const firstReference = result.current;

      rerender({ delay: 1000 });

      // Function reference stays stable, but uses updated delay via ref
      expect(result.current).toBe(firstReference);
    });

    it("should use updated delay after delay changes", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ delay }) => useDebounceCallback(callback, delay),
        { initialProps: { delay: 500 } }
      );

      rerender({ delay: 1000 });

      act(() => {
        result.current("test");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should maintain stable function reference when options change", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ leading }) => useDebounceCallback(callback, 500, { leading }),
        { initialProps: { leading: false } }
      );

      const firstReference = result.current;

      rerender({ leading: true });

      // Function reference stays stable, but uses updated options via ref
      expect(result.current).toBe(firstReference);
    });

    it("should use updated options after options change", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ leading }) => useDebounceCallback(callback, 500, { leading }),
        { initialProps: { leading: false } }
      );

      rerender({ leading: true });

      act(() => {
        result.current("test");
      });

      // With leading: true, should invoke immediately
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should maintain stable cancel method reference", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() =>
        useDebounceCallback(callback, 500)
      );

      const firstCancel = result.current.cancel;

      rerender();

      expect(result.current.cancel).toBe(firstCancel);
    });

    it("should maintain stable flush method reference", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() =>
        useDebounceCallback(callback, 500)
      );

      const firstFlush = result.current.flush;

      rerender();

      expect(result.current.flush).toBe(firstFlush);
    });

    it("should maintain stable pending method reference", () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() =>
        useDebounceCallback(callback, 500)
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
        useDebounceCallback(callback1, 500)
      );
      const { result: result2 } = renderHook(() =>
        useDebounceCallback(callback2, 300)
      );

      act(() => {
        result1.current("first");
        result2.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledWith("second");

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback1).toHaveBeenCalledWith("first");
    });
  });

  describe("cleanup on unmount", () => {
    it("should cancel pending invocations on unmount", () => {
      const callback = vi.fn();
      const { result, unmount } = renderHook(() =>
        useDebounceCallback(callback, 500)
      );

      act(() => {
        result.current("test");
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle delay of 0", () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebounceCallback(callback, 0));

      act(() => {
        result.current("test");
      });

      // Even with delay of 0, callback should be called asynchronously
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("test");
    });

    it("should allow new leading edge call after delay has passed", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: true, trailing: false })
      );

      // First leading call
      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("first");

      // Wait for delay to pass
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // New leading call should be allowed
      act(() => {
        result.current("second");
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith("second");
    });

    it("should handle rapid calls with leading: true and trailing: true", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: true, trailing: true })
      );

      // First call - triggers leading
      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("first");

      // Rapid calls during debounce period
      act(() => {
        vi.advanceTimersByTime(100);
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(100);
        result.current("third");
      });

      // Still only leading call
      expect(callback).toHaveBeenCalledTimes(1);

      // Wait for trailing edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Trailing call with last argument
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith("third");
    });

    it("should handle maxWait with leading: true", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { maxWait: 1000, leading: true })
      );

      // First call - triggers leading
      act(() => {
        result.current("first");
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("first");

      // Keep calling before delay elapses
      act(() => {
        vi.advanceTimersByTime(400);
        result.current("second");
      });

      act(() => {
        vi.advanceTimersByTime(400);
        result.current("third");
      });

      // At 800ms, only leading call so far
      expect(callback).toHaveBeenCalledTimes(1);

      // At 1000ms, maxWait triggers
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith("third");
    });

    it("should not invoke callback when both leading and trailing are false", () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: false, trailing: false })
      );

      act(() => {
        result.current("test");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle callback that returns undefined", () => {
      const callback = vi.fn(() => undefined);
      const { result } = renderHook(() =>
        useDebounceCallback(callback, 500, { leading: true })
      );

      let returnValue: undefined;
      act(() => {
        returnValue = result.current();
      });

      expect(returnValue).toBeUndefined();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
