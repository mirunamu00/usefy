import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCopyToClipboard } from "./useCopyToClipboard";

describe("useCopyToClipboard", () => {
  const originalClipboard = navigator.clipboard;
  let mockWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
      writable: true,
    });
  });

  describe("initialization", () => {
    it("should initialize with copiedText as null", () => {
      const { result } = renderHook(() => useCopyToClipboard());
      const [copiedText] = result.current;
      expect(copiedText).toBeNull();
    });

    it("should return a tuple with copiedText and copy function", () => {
      const { result } = renderHook(() => useCopyToClipboard());
      const [copiedText, copy] = result.current;

      expect(copiedText).toBeNull();
      expect(typeof copy).toBe("function");
    });

    it("should accept options", () => {
      const { result } = renderHook(() =>
        useCopyToClipboard({ timeout: 5000 })
      );
      expect(result.current).toBeDefined();
    });
  });

  describe("copy functionality", () => {
    it("should copy text successfully using Clipboard API", async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current[1]("Hello World");
      });

      expect(success).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith("Hello World");
      expect(result.current[0]).toBe("Hello World");
    });

    it("should update copiedText after successful copy", async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current[1]("Test text");
      });

      expect(result.current[0]).toBe("Test text");
    });

    it("should return true on successful copy", async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      let returnValue: boolean | undefined;
      await act(async () => {
        returnValue = await result.current[1]("Test");
      });

      expect(returnValue).toBe(true);
    });

    it("should handle empty string", async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current[1]("");
      });

      expect(mockWriteText).toHaveBeenCalledWith("");
      expect(result.current[0]).toBe("");
    });

    it("should handle special characters", async () => {
      const { result } = renderHook(() => useCopyToClipboard());
      const specialText = "Hello 🌍! <script>alert('xss')</script>";

      await act(async () => {
        await result.current[1](specialText);
      });

      expect(mockWriteText).toHaveBeenCalledWith(specialText);
      expect(result.current[0]).toBe(specialText);
    });
  });

  describe("copy failure", () => {
    it("should return false when copy fails", async () => {
      mockWriteText.mockRejectedValue(new Error("Copy failed"));

      // Also mock execCommand to fail
      const mockExecCommand = vi.fn().mockReturnValue(false);
      document.execCommand = mockExecCommand;

      const { result } = renderHook(() => useCopyToClipboard());

      let returnValue: boolean | undefined;
      await act(async () => {
        returnValue = await result.current[1]("Test");
      });

      expect(returnValue).toBe(false);
    });

    it("should set copiedText to null on failure", async () => {
      mockWriteText.mockRejectedValue(new Error("Copy failed"));

      const mockExecCommand = vi.fn().mockReturnValue(false);
      document.execCommand = mockExecCommand;

      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current[1]("Test");
      });

      expect(result.current[0]).toBeNull();
    });

    it("should call onError callback when copy fails", async () => {
      mockWriteText.mockRejectedValue(new Error("Copy failed"));

      const mockExecCommand = vi.fn().mockReturnValue(false);
      document.execCommand = mockExecCommand;

      const onError = vi.fn();
      const { result } = renderHook(() => useCopyToClipboard({ onError }));

      await act(async () => {
        await result.current[1]("Test");
      });

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe("timeout/auto-reset", () => {
    it("should reset copiedText after default timeout (2000ms)", async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current[1]("Test");
      });

      expect(result.current[0]).toBe("Test");

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current[0]).toBeNull();
    });

    it("should reset copiedText after custom timeout", async () => {
      const { result } = renderHook(() =>
        useCopyToClipboard({ timeout: 5000 })
      );

      await act(async () => {
        await result.current[1]("Test");
      });

      expect(result.current[0]).toBe("Test");

      act(() => {
        vi.advanceTimersByTime(4999);
      });

      expect(result.current[0]).toBe("Test");

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current[0]).toBeNull();
    });

    it("should not reset when timeout is 0", async () => {
      const { result } = renderHook(() => useCopyToClipboard({ timeout: 0 }));

      await act(async () => {
        await result.current[1]("Test");
      });

      expect(result.current[0]).toBe("Test");

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current[0]).toBe("Test");
    });

    it("should reset timer on consecutive copies", async () => {
      const { result } = renderHook(() =>
        useCopyToClipboard({ timeout: 2000 })
      );

      await act(async () => {
        await result.current[1]("First");
      });

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current[0]).toBe("First");

      await act(async () => {
        await result.current[1]("Second");
      });

      expect(result.current[0]).toBe("Second");

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Should still be "Second" because timer was reset
      expect(result.current[0]).toBe("Second");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Now should be null (2000ms since "Second")
      expect(result.current[0]).toBeNull();
    });
  });

  describe("callbacks", () => {
    it("should call onSuccess callback with copied text", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useCopyToClipboard({ onSuccess }));

      await act(async () => {
        await result.current[1]("Hello");
      });

      expect(onSuccess).toHaveBeenCalledWith("Hello");
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("should not call onSuccess when copy fails", async () => {
      mockWriteText.mockRejectedValue(new Error("Failed"));

      const mockExecCommand = vi.fn().mockReturnValue(false);
      document.execCommand = mockExecCommand;

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useCopyToClipboard({ onSuccess }));

      await act(async () => {
        await result.current[1]("Test");
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("should call onError with Error object", async () => {
      const error = new Error("Clipboard error");
      mockWriteText.mockRejectedValue(error);

      const mockExecCommand = vi.fn().mockReturnValue(false);
      document.execCommand = mockExecCommand;

      const onError = vi.fn();
      const { result } = renderHook(() => useCopyToClipboard({ onError }));

      await act(async () => {
        await result.current[1]("Test");
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    // Regression: the latest-callback pattern (render-time refs) must invoke the
    // most recently rendered callback, not the one captured at mount.
    it("should call the latest onSuccess after the callback prop changes", async () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ onSuccess }) => useCopyToClipboard({ onSuccess }),
        { initialProps: { onSuccess: fn1 } }
      );

      rerender({ onSuccess: fn2 });

      await act(async () => {
        await result.current[1]("Latest");
      });

      expect(fn2).toHaveBeenCalledWith("Latest");
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn1).not.toHaveBeenCalled();
    });

    it("should call the latest onError after the callback prop changes", async () => {
      mockWriteText.mockRejectedValue(new Error("Copy failed"));
      const mockExecCommand = vi.fn().mockReturnValue(false);
      document.execCommand = mockExecCommand;

      const onError1 = vi.fn();
      const onError2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ onError }) => useCopyToClipboard({ onError }),
        { initialProps: { onError: onError1 } }
      );

      rerender({ onError: onError2 });

      await act(async () => {
        await result.current[1]("Test");
      });

      expect(onError2).toHaveBeenCalledTimes(1);
      expect(onError1).not.toHaveBeenCalled();
    });
  });

  describe("function reference stability", () => {
    it("should maintain stable copy function reference across renders", () => {
      const { result, rerender } = renderHook(() => useCopyToClipboard());

      const initialCopy = result.current[1];

      rerender();

      expect(result.current[1]).toBe(initialCopy);
    });

    it("should maintain stable copy reference after state changes", async () => {
      const { result, rerender } = renderHook(() => useCopyToClipboard());

      const initialCopy = result.current[1];

      await act(async () => {
        await result.current[1]("Test");
      });

      rerender();

      expect(result.current[1]).toBe(initialCopy);
    });

    it("should maintain stable copy reference with different options", () => {
      const { result, rerender } = renderHook(
        ({ timeout }) => useCopyToClipboard({ timeout }),
        { initialProps: { timeout: 1000 } }
      );

      const initialCopy = result.current[1];

      rerender({ timeout: 2000 });

      expect(result.current[1]).toBe(initialCopy);
    });
  });

  describe("cleanup", () => {
    it("should cleanup timeout on unmount", async () => {
      const { result, unmount } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current[1]("Test");
      });

      expect(result.current[0]).toBe("Test");

      unmount();

      // Should not throw or cause issues
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    });

    it("should not update state after unmount", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result, unmount } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current[1]("Test");
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // No "Can't perform a React state update on an unmounted component" warning
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("multiple instances", () => {
    it("should maintain independent state across instances", async () => {
      const { result: result1 } = renderHook(() => useCopyToClipboard());
      const { result: result2 } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result1.current[1]("Text 1");
      });

      expect(result1.current[0]).toBe("Text 1");
      expect(result2.current[0]).toBeNull();

      await act(async () => {
        await result2.current[1]("Text 2");
      });

      expect(result1.current[0]).toBe("Text 1");
      expect(result2.current[0]).toBe("Text 2");
    });

    it("should have independent timeouts", async () => {
      const { result: result1 } = renderHook(() =>
        useCopyToClipboard({ timeout: 1000 })
      );
      const { result: result2 } = renderHook(() =>
        useCopyToClipboard({ timeout: 3000 })
      );

      await act(async () => {
        await result1.current[1]("Text 1");
        await result2.current[1]("Text 2");
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result1.current[0]).toBeNull();
      expect(result2.current[0]).toBe("Text 2");

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result2.current[0]).toBeNull();
    });
  });

  describe("fallback behavior", () => {
    it("should use fallback when Clipboard API is not available", async () => {
      // Remove Clipboard API
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const mockExecCommand = vi.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const { result } = renderHook(() => useCopyToClipboard());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current[1]("Fallback test");
      });

      expect(success).toBe(true);
      expect(mockExecCommand).toHaveBeenCalledWith("copy");
      expect(result.current[0]).toBe("Fallback test");
    });

    it("should try fallback when Clipboard API throws", async () => {
      mockWriteText.mockRejectedValue(new Error("Permission denied"));

      const mockExecCommand = vi.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const { result } = renderHook(() => useCopyToClipboard());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current[1]("Fallback after error");
      });

      expect(success).toBe(true);
      expect(mockExecCommand).toHaveBeenCalledWith("copy");
      expect(result.current[0]).toBe("Fallback after error");
    });
  });

  describe("edge cases", () => {
    it("should handle rapid successive copies", async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await Promise.all([
          result.current[1]("First"),
          result.current[1]("Second"),
          result.current[1]("Third"),
        ]);
      });

      // Last copy should win
      expect(mockWriteText).toHaveBeenCalledTimes(3);
    });

    it("should handle very long text", async () => {
      const { result } = renderHook(() => useCopyToClipboard());
      const longText = "a".repeat(100000);

      await act(async () => {
        await result.current[1](longText);
      });

      expect(mockWriteText).toHaveBeenCalledWith(longText);
      expect(result.current[0]).toBe(longText);
    });

    it("should handle unicode text", async () => {
      const { result } = renderHook(() => useCopyToClipboard());
      const unicodeText = "한글 テスト 中文 العربية 🎉🚀💻";

      await act(async () => {
        await result.current[1](unicodeText);
      });

      expect(mockWriteText).toHaveBeenCalledWith(unicodeText);
      expect(result.current[0]).toBe(unicodeText);
    });

    it("should handle newlines and tabs", async () => {
      const { result } = renderHook(() => useCopyToClipboard());
      const multilineText = "Line 1\nLine 2\tTabbed";

      await act(async () => {
        await result.current[1](multilineText);
      });

      expect(result.current[0]).toBe(multilineText);
    });
  });

  describe("SSR / unsupported environment", () => {
    it("should return false and call onError when window is undefined", async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useCopyToClipboard({ onError }));

      // Simulate a server / no-window environment for the copy() call.
      vi.stubGlobal("window", undefined);

      // The SSR guard returns before any state update, so no act() is needed.
      const success = await result.current[1]("SSR text");

      vi.unstubAllGlobals();

      expect(success).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onError.mock.calls[0][0].message).toBe(
        "Clipboard is not available in this environment"
      );
    });
  });

  describe("async-after-unmount safety", () => {
    // Regression: a copy() resolving after unmount must not set state, fire
    // onSuccess, or schedule a reset timer the cleanup can no longer clear.
    it("should not touch state or leak a timer when unmounted while writeText is pending", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      let resolveWrite: () => void = () => {};
      mockWriteText.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveWrite = () => resolve(undefined);
        })
      );

      const onSuccess = vi.fn();
      const { result, unmount } = renderHook(() =>
        useCopyToClipboard({ onSuccess })
      );

      let copyPromise: Promise<boolean> = Promise.resolve(false);
      act(() => {
        copyPromise = result.current[1]("Pending");
      });

      // Unmount while the clipboard write is still pending.
      unmount();

      // Now resolve the write — the success path runs post-unmount.
      await act(async () => {
        resolveWrite();
        await copyPromise;
      });

      // onSuccess must not fire after unmount.
      expect(onSuccess).not.toHaveBeenCalled();

      // Any leaked reset timer would fire a setState on an unmounted component.
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    // Regression: overlapping un-awaited copy() calls must not leave a stray
    // reset timer from an earlier copy that prematurely clears fresh state.
    it("should not leak a stray reset timer across overlapping copies", async () => {
      let resolveA: () => void = () => {};
      let resolveB: () => void = () => {};
      mockWriteText
        .mockReturnValueOnce(
          new Promise<void>((resolve) => {
            resolveA = () => resolve(undefined);
          })
        )
        .mockReturnValueOnce(
          new Promise<void>((resolve) => {
            resolveB = () => resolve(undefined);
          })
        );

      const { result } = renderHook(() => useCopyToClipboard({ timeout: 2000 }));

      let pA: Promise<boolean> = Promise.resolve(false);
      let pB: Promise<boolean> = Promise.resolve(false);
      act(() => {
        pA = result.current[1]("A");
        pB = result.current[1]("B");
      });

      // Resolve A first: schedules A's reset timer (fires at t=2000).
      await act(async () => {
        resolveA();
        await pA;
      });
      expect(result.current[0]).toBe("A");

      // Advance to t=1000, then resolve B: schedules B's timer (fires at t=3000)
      // and must supersede A's still-pending timer.
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      await act(async () => {
        resolveB();
        await pB;
      });
      expect(result.current[0]).toBe("B");

      // At t=2000 A's timer WOULD fire and null the fresh "B" state if leaked.
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current[0]).toBe("B");

      // At t=3000 B's single reset timer fires.
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current[0]).toBeNull();
    });
  });
});
