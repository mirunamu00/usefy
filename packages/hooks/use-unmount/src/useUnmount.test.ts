import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useUnmount } from "./useUnmount";

describe("useUnmount", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("basic functionality", () => {
    it("should call callback on unmount", () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() => useUnmount(callback));

      expect(callback).not.toHaveBeenCalled();

      unmount();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should not call callback on mount", () => {
      const callback = vi.fn();

      renderHook(() => useUnmount(callback));

      expect(callback).not.toHaveBeenCalled();
    });

    it("should not call callback on rerender", () => {
      const callback = vi.fn();

      const { rerender } = renderHook(() => useUnmount(callback));

      rerender();
      rerender();
      rerender();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("closure freshness", () => {
    it("should call callback with latest values", () => {
      const values: number[] = [];
      let currentValue = 0;

      const { rerender, unmount } = renderHook(() =>
        useUnmount(() => {
          values.push(currentValue);
        })
      );

      currentValue = 1;
      rerender();

      currentValue = 2;
      rerender();

      currentValue = 3;
      unmount();

      // Should capture the latest value (3), not the initial value (0)
      expect(values).toEqual([3]);
    });

    it("should access updated callback on unmount", () => {
      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      const { rerender, unmount } = renderHook(
        ({ callback }) => useUnmount(callback),
        { initialProps: { callback: firstCallback } }
      );

      rerender({ callback: secondCallback });

      unmount();

      expect(firstCallback).not.toHaveBeenCalled();
      expect(secondCallback).toHaveBeenCalledTimes(1);
    });

    it("should use latest state values in callback", () => {
      let capturedState = "";
      let state = "initial";

      const { rerender, unmount } = renderHook(() =>
        useUnmount(() => {
          capturedState = state;
        })
      );

      state = "updated";
      rerender();

      state = "final";
      rerender();

      unmount();

      expect(capturedState).toBe("final");
    });
  });

  describe("enabled option", () => {
    it("should call callback when enabled is true (default)", () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() => useUnmount(callback));

      unmount();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should call callback when enabled is explicitly true", () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() =>
        useUnmount(callback, { enabled: true })
      );

      unmount();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should not call callback when enabled is false", () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() =>
        useUnmount(callback, { enabled: false })
      );

      unmount();

      expect(callback).not.toHaveBeenCalled();
    });

    it("should call callback when enabled changes from false to true", () => {
      const callback = vi.fn();

      const { rerender, unmount } = renderHook(
        ({ enabled }) => useUnmount(callback, { enabled }),
        { initialProps: { enabled: false } }
      );

      rerender({ enabled: true });

      unmount();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should not call callback when enabled changes from true to false before unmount", () => {
      const callback = vi.fn();

      const { rerender, unmount } = renderHook(
        ({ enabled }) => useUnmount(callback, { enabled }),
        { initialProps: { enabled: true } }
      );

      // When enabled changes to false, the previous effect cleans up
      rerender({ enabled: false });

      // Callback should have been called once (cleanup from disabling)
      expect(callback).toHaveBeenCalledTimes(1);

      // On final unmount, callback should not be called again
      unmount();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple enabled toggles", () => {
      const callback = vi.fn();

      const { rerender, unmount } = renderHook(
        ({ enabled }) => useUnmount(callback, { enabled }),
        { initialProps: { enabled: true } }
      );

      // Disable - triggers cleanup
      rerender({ enabled: false });
      expect(callback).toHaveBeenCalledTimes(1);

      // Enable again
      rerender({ enabled: true });
      expect(callback).toHaveBeenCalledTimes(1);

      // Disable again - triggers cleanup
      rerender({ enabled: false });
      expect(callback).toHaveBeenCalledTimes(2);

      // Final unmount - no additional call since disabled
      unmount();
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should catch errors in callback and log to console", () => {
      const error = new Error("Test error");
      const callback = vi.fn(() => {
        throw error;
      });

      const { unmount } = renderHook(() => useUnmount(callback));

      // Should not throw
      expect(() => unmount()).not.toThrow();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "useUnmount: Error in unmount callback:",
        error
      );
    });

    it("should not break unmount when callback throws", () => {
      const failingCallback = vi.fn(() => {
        throw new Error("Intentional error");
      });

      const { unmount } = renderHook(() => useUnmount(failingCallback));

      // This should complete without throwing
      unmount();

      expect(failingCallback).toHaveBeenCalled();
    });

    it("should handle callback throwing non-Error objects", () => {
      const callback = vi.fn(() => {
        throw "string error";
      });

      const { unmount } = renderHook(() => useUnmount(callback));

      expect(() => unmount()).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "useUnmount: Error in unmount callback:",
        "string error"
      );
    });
  });

  describe("multiple instances", () => {
    it("should support multiple independent instances", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { unmount: unmount1 } = renderHook(() => useUnmount(callback1));
      const { unmount: unmount2 } = renderHook(() => useUnmount(callback2));

      unmount1();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      unmount2();

      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should work correctly with multiple hooks in same component", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      const { unmount } = renderHook(() => {
        useUnmount(callback1);
        useUnmount(callback2);
        useUnmount(callback3);
      });

      unmount();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it("should maintain independent enabled states", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { unmount } = renderHook(() => {
        useUnmount(callback1, { enabled: true });
        useUnmount(callback2, { enabled: false });
      });

      unmount();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle rapid mount/unmount", () => {
      const callback = vi.fn();

      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useUnmount(callback));
        unmount();
      }

      expect(callback).toHaveBeenCalledTimes(10);
    });

    it("should handle undefined options gracefully", () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() =>
        useUnmount(callback, undefined as unknown as { enabled: boolean })
      );

      unmount();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle empty options object", () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() => useUnmount(callback, {}));

      unmount();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle null-ish enabled value as truthy", () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() =>
        useUnmount(callback, { enabled: undefined })
      );

      unmount();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("callback reference stability", () => {
    it("should not re-run effect when callback reference changes", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ cb }) => useUnmount(cb),
        { initialProps: { cb: callback1 } }
      );

      // Change callback reference
      rerender({ cb: callback2 });

      // Neither callback should be called yet (no unmount)
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe("async callback", () => {
    it("should call async callback on unmount", () => {
      let asyncExecuted = false;
      const asyncCallback = async () => {
        asyncExecuted = true;
      };

      const { unmount } = renderHook(() => useUnmount(asyncCallback));

      unmount();

      // Note: The hook doesn't wait for async completion
      // This is by design - unmount should be synchronous
      expect(asyncExecuted).toBe(true);
    });

    it("should handle async callbacks (errors are not caught)", () => {
      // Note: Async errors in useUnmount callbacks cannot be caught synchronously
      // This is by design - unmount cleanup should be synchronous
      // Users should handle async errors within their callback
      let executed = false;
      const asyncCallback = async () => {
        executed = true;
        // In real usage, wrap async operations in try/catch within the callback
      };

      const { unmount } = renderHook(() => useUnmount(asyncCallback));

      unmount();

      expect(executed).toBe(true);
    });
  });

  describe("return value", () => {
    it("should return void", () => {
      const { result } = renderHook(() => useUnmount(() => {}));

      expect(result.current).toBeUndefined();
    });
  });
});
