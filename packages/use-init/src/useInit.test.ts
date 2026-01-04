import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInit } from "./useInit";

describe("useInit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should return correct result shape", async () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Verify result shape
      expect(typeof result.current.isInitialized).toBe("boolean");
      expect(typeof result.current.isInitializing).toBe("boolean");
      expect(typeof result.current.reinitialize).toBe("function");
      expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
    });

    it("should run callback on mount (sync)", async () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useInit(callback));

      // Run all pending effects and timers
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isInitializing).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should run callback on mount (async)", async () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isInitializing).toBe(false);
    });

    it("should run only once even with re-renders", async () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isInitialized).toBe(true);

      rerender();
      rerender();
      rerender();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanup", () => {
    it("should call cleanup function on unmount (sync)", async () => {
      const cleanup = vi.fn();
      const callback = vi.fn().mockReturnValue(cleanup);

      const { result, unmount } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isInitialized).toBe(true);

      unmount();

      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it("should call cleanup function on unmount (async)", async () => {
      const cleanup = vi.fn();
      const callback = vi.fn().mockResolvedValue(cleanup);

      const { result, unmount } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isInitialized).toBe(true);

      unmount();

      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it("should call previous cleanup before reinitialize", async () => {
      const cleanup1 = vi.fn();
      let callCount = 0;
      const callback = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? cleanup1 : undefined;
      });

      const { result } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(cleanup1).not.toHaveBeenCalled();

      await act(async () => {
        result.current.reinitialize();
        await vi.runAllTimersAsync();
      });

      expect(cleanup1).toHaveBeenCalledTimes(1);
    });
  });

  describe("conditional execution (when)", () => {
    it("should not run when when=false", async () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useInit(callback, { when: false }));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(callback).not.toHaveBeenCalled();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isInitializing).toBe(false);
    });

    it("should run when when=true", async () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useInit(callback, { when: true }));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(result.current.isInitialized).toBe(true);
    });

    it("should run when when changes from false to true", async () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ when }) => useInit(callback, { when }),
        { initialProps: { when: false } }
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(callback).not.toHaveBeenCalled();
      expect(result.current.isInitialized).toBe(false);

      rerender({ when: true });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(result.current.isInitialized).toBe(true);
    });

    it("should not run again when when changes from true to false to true after initialization", async () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ when }) => useInit(callback, { when }),
        { initialProps: { when: true } }
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);

      rerender({ when: false });
      rerender({ when: true });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("retry", () => {
    it("should retry on failure", async () => {
      let attempts = 0;
      const callback = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
      });

      const { result } = renderHook(() =>
        useInit(callback, { retry: 2, retryDelay: 100 })
      );

      // First attempt
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Wait for retry delay and second attempt
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(callback).toHaveBeenCalledTimes(2);

      // Wait for retry delay and third attempt
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(callback).toHaveBeenCalledTimes(3);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should fail after exhausting retries", async () => {
      const callback = vi.fn().mockImplementation(() => {
        throw new Error("Always fails");
      });

      const { result } = renderHook(() =>
        useInit(callback, { retry: 2, retryDelay: 100 })
      );

      // First attempt
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Second attempt
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(callback).toHaveBeenCalledTimes(2);

      // Third attempt
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(callback).toHaveBeenCalledTimes(3);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error?.message).toBe("Always fails");
    });

    it("should respect retryDelay", async () => {
      const callback = vi.fn().mockImplementation(() => {
        throw new Error("Failed");
      });

      renderHook(() => useInit(callback, { retry: 1, retryDelay: 500 }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Not enough time passed
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(callback).toHaveBeenCalledTimes(1);

      // Now enough time passed
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe("timeout", () => {
    it("should timeout if callback takes too long", async () => {
      const callback = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
      });

      const { result } = renderHook(() =>
        useInit(callback, { timeout: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error?.message).toContain("timed out");
    });

    it("should succeed if callback completes before timeout", async () => {
      const callback = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const { result } = renderHook(() =>
        useInit(callback, { timeout: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should work with sync callback even with timeout option", async () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useInit(callback, { timeout: 1000 })
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(result.current.isInitialized).toBe(true);
    });
  });

  describe("reinitialize", () => {
    it("should allow manual reinitialize", async () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.current.reinitialize();
        await vi.runAllTimersAsync();
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("should respect when condition on reinitialize", async () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ when }) => useInit(callback, { when }),
        { initialProps: { when: true } }
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);

      rerender({ when: false });

      await act(async () => {
        result.current.reinitialize();
        await vi.runAllTimersAsync();
      });

      // Should not have called again because when=false
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should have stable reinitialize reference", async () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const initialReinitialize = result.current.reinitialize;

      rerender();

      expect(result.current.reinitialize).toBe(initialReinitialize);
    });
  });

  describe("edge cases", () => {
    it("should handle error in sync callback", async () => {
      const callback = vi.fn().mockImplementation(() => {
        throw new Error("Sync error");
      });

      const { result } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.error?.message).toBe("Sync error");
      expect(result.current.isInitialized).toBe(false);
    });

    it("should handle rejection in async callback", async () => {
      const callback = vi.fn().mockRejectedValue(new Error("Async error"));

      const { result } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.error?.message).toBe("Async error");
    });

    it("should convert non-Error throws to Error", async () => {
      const callback = vi.fn().mockImplementation(() => {
        throw "String error";
      });

      const { result } = renderHook(() => useInit(callback));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("String error");
    });

    it("should maintain separate state across multiple instances", async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn().mockImplementation(() => {
        throw new Error("Error in second");
      });

      const { result: result1 } = renderHook(() => useInit(callback1));
      const { result: result2 } = renderHook(() => useInit(callback2));

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result1.current.isInitialized).toBe(true);
      expect(result1.current.error).toBeNull();
      expect(result2.current.isInitialized).toBe(false);
      expect(result2.current.error).not.toBeNull();
    });

    it("should not update state after unmount", async () => {
      const callback = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });

      const { result, unmount } = renderHook(() => useInit(callback));

      expect(result.current.isInitializing).toBe(true);

      unmount();

      // Advance timers to complete the async operation
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Should not throw or cause issues
      expect(result.current.isInitializing).toBe(true); // State frozen at unmount
    });
  });

  describe("combined options", () => {
    it("should work with retry and timeout together", async () => {
      let attempts = 0;
      const callback = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Will timeout
        }
        // Second attempt succeeds immediately
      });

      const { result } = renderHook(() =>
        useInit(callback, { retry: 1, retryDelay: 100, timeout: 500 })
      );

      // First attempt starts
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Timeout first attempt
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      // Wait for retry delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Second attempt should succeed
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(result.current.isInitialized).toBe(true);
    });

    it("should work with when and retry together", async () => {
      let attempts = 0;
      const callback = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error("First attempt failed");
        }
      });

      const { result, rerender } = renderHook(
        ({ when }) => useInit(callback, { when, retry: 1, retryDelay: 100 }),
        { initialProps: { when: false } }
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(callback).not.toHaveBeenCalled();

      rerender({ when: true });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(result.current.isInitialized).toBe(true);
    });
  });
});
