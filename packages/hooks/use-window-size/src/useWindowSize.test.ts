import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWindowSize } from "./useWindowSize";
import { areSizesEqual, getWindowSize, isWindowAvailable } from "./utils";

function setWindowSize(width: number, height: number): void {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: height,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, "clientWidth", {
    value: width,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    value: height,
    writable: true,
    configurable: true,
  });
}

function fireResize(width: number, height: number): void {
  setWindowSize(width, height);
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
}

describe("useWindowSize", () => {
  beforeEach(() => {
    setWindowSize(1024, 768);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("returns the current window size on mount", () => {
      const { result } = renderHook(() => useWindowSize());
      expect(result.current).toEqual({ width: 1024, height: 768 });
    });

    it("reflects a size set before mount", () => {
      setWindowSize(640, 480);
      const { result } = renderHook(() => useWindowSize());
      expect(result.current).toEqual({ width: 640, height: 480 });
    });
  });

  describe("resize tracking", () => {
    it("updates when the window is resized", () => {
      const { result } = renderHook(() => useWindowSize());
      fireResize(800, 600);
      expect(result.current).toEqual({ width: 800, height: 600 });
    });

    it("tracks multiple consecutive resizes", () => {
      const { result } = renderHook(() => useWindowSize());
      fireResize(800, 600);
      fireResize(500, 400);
      expect(result.current).toEqual({ width: 500, height: 400 });
    });

    it("keeps the same object reference when the size does not change (no-op skip)", () => {
      const { result } = renderHook(() => useWindowSize());
      const before = result.current;
      // Same dimensions -> should not create a new object / re-render.
      fireResize(1024, 768);
      expect(result.current).toBe(before);
    });

    it("produces a new reference when the size changes", () => {
      const { result } = renderHook(() => useWindowSize());
      const before = result.current;
      fireResize(800, 600);
      expect(result.current).not.toBe(before);
    });
  });

  describe("onChange callback", () => {
    it("does not fire on mount", () => {
      const onChange = vi.fn();
      renderHook(() => useWindowSize({ onChange }));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("fires with the new size when it changes", () => {
      const onChange = vi.fn();
      renderHook(() => useWindowSize({ onChange }));
      fireResize(800, 600);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ width: 800, height: 600 });
    });

    it("does not fire when the size is unchanged", () => {
      const onChange = vi.fn();
      renderHook(() => useWindowSize({ onChange }));
      fireResize(1024, 768);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("uses the latest callback without re-registering listeners", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = renderHook(({ cb }) => useWindowSize({ onChange: cb }), {
        initialProps: { cb: first },
      });
      rerender({ cb: second });
      fireResize(800, 600);
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith({ width: 800, height: 600 });
    });
  });

  describe("includeScrollbar", () => {
    it("excludes the scrollbar by reading documentElement when false", () => {
      Object.defineProperty(window, "innerWidth", {
        value: 1024,
        configurable: true,
      });
      Object.defineProperty(document.documentElement, "clientWidth", {
        value: 1009,
        configurable: true,
      });
      Object.defineProperty(document.documentElement, "clientHeight", {
        value: 768,
        configurable: true,
      });
      const { result } = renderHook(() =>
        useWindowSize({ includeScrollbar: false })
      );
      expect(result.current.width).toBe(1009);
    });
  });

  describe("debounce", () => {
    it("coalesces rapid resizes into a single delayed update", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useWindowSize({ debounceMs: 200 }));

      fireResize(800, 600);
      fireResize(700, 500);
      fireResize(600, 400);

      // Nothing applied yet.
      expect(result.current).toEqual({ width: 1024, height: 768 });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current).toEqual({ width: 600, height: 400 });
    });
  });

  describe("throttle", () => {
    it("applies the leading resize immediately and trails the rest", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useWindowSize({ throttleMs: 100 }));

      fireResize(800, 600);
      // Leading edge applies right away.
      expect(result.current).toEqual({ width: 800, height: 600 });

      fireResize(500, 400);
      // Still throttled — trailing value not applied yet.
      expect(result.current).toEqual({ width: 800, height: 600 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current).toEqual({ width: 500, height: 400 });
    });
  });

  describe("enabled", () => {
    it("returns the initial size and ignores resizes when disabled", () => {
      const { result } = renderHook(() =>
        useWindowSize({
          enabled: false,
          initialWidth: 320,
          initialHeight: 240,
        })
      );
      expect(result.current).toEqual({ width: 320, height: 240 });

      fireResize(800, 600);
      expect(result.current).toEqual({ width: 320, height: 240 });
    });

    it("starts tracking when re-enabled", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useWindowSize({ enabled }),
        { initialProps: { enabled: false } }
      );
      setWindowSize(800, 600);
      rerender({ enabled: true });
      expect(result.current).toEqual({ width: 800, height: 600 });
    });
  });

  describe("cleanup", () => {
    it("removes the resize listener on unmount", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useWindowSize());
      unmount();
      expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    it("does not update state after unmount", () => {
      const onChange = vi.fn();
      const { unmount } = renderHook(() => useWindowSize({ onChange }));
      unmount();
      fireResize(800, 600);
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

describe("utils", () => {
  describe("isWindowAvailable", () => {
    it("returns true in a browser (jsdom) environment", () => {
      expect(isWindowAvailable()).toBe(true);
    });

    it("returns false when window is undefined (SSR)", () => {
      vi.stubGlobal("window", undefined);
      expect(isWindowAvailable()).toBe(false);
      vi.unstubAllGlobals();
    });
  });

  describe("getWindowSize", () => {
    beforeEach(() => {
      setWindowSize(1280, 720);
    });

    it("includes the scrollbar by default (innerWidth/innerHeight)", () => {
      expect(getWindowSize()).toEqual({ width: 1280, height: 720 });
    });

    it("excludes the scrollbar when includeScrollbar is false", () => {
      Object.defineProperty(document.documentElement, "clientWidth", {
        value: 1265,
        configurable: true,
      });
      expect(getWindowSize(false).width).toBe(1265);
    });

    it("returns zeros in SSR", () => {
      vi.stubGlobal("window", undefined);
      expect(getWindowSize()).toEqual({ width: 0, height: 0 });
      vi.unstubAllGlobals();
    });
  });

  describe("areSizesEqual", () => {
    it("returns true for equal sizes", () => {
      expect(
        areSizesEqual({ width: 100, height: 50 }, { width: 100, height: 50 })
      ).toBe(true);
    });

    it("returns false when width differs", () => {
      expect(
        areSizesEqual({ width: 100, height: 50 }, { width: 101, height: 50 })
      ).toBe(false);
    });

    it("returns false when height differs", () => {
      expect(
        areSizesEqual({ width: 100, height: 50 }, { width: 100, height: 51 })
      ).toBe(false);
    });
  });
});
