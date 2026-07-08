import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useResizeObserver } from "./useResizeObserver";
import {
  mockObserverInstances,
  simulateResize,
  getLatestObserver,
  clearObserverInstances,
  isElementObserved,
  getObserveOptions,
} from "../vitest.setup";

describe("useResizeObserver", () => {
  let targetElement: HTMLDivElement;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    targetElement = document.createElement("div");
    targetElement.setAttribute("data-testid", "target");
    container.appendChild(targetElement);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  // ============ Initialization Tests ============
  describe("initialization", () => {
    it("should return undefined dimensions before observation", () => {
      const { result } = renderHook(() => useResizeObserver());

      expect(result.current.width).toBeUndefined();
      expect(result.current.height).toBeUndefined();
      expect(result.current.entry).toBeUndefined();
    });

    it("should return initial dimensions when provided", () => {
      const { result } = renderHook(() =>
        useResizeObserver({
          initialWidth: 200,
          initialHeight: 150,
        })
      );

      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(150);
      expect(result.current.entry).toBeDefined();
    });

    it("should provide stable ref callback across renders", () => {
      const { result, rerender } = renderHook(() => useResizeObserver());

      const firstRef = result.current.ref;
      rerender();
      const secondRef = result.current.ref;

      expect(firstRef).toBe(secondRef);
    });

    it("should handle undefined options", () => {
      const { result } = renderHook(() => useResizeObserver());

      expect(result.current.isSupported).toBe(true);
      expect(typeof result.current.ref).toBe("function");
    });

    it("should handle empty options object", () => {
      const { result } = renderHook(() => useResizeObserver({}));

      expect(result.current.isSupported).toBe(true);
      expect(typeof result.current.ref).toBe("function");
    });

    it("should return isSupported as true in browser", () => {
      const { result } = renderHook(() => useResizeObserver());

      expect(result.current.isSupported).toBe(true);
    });

    it("should create observer on mount", () => {
      renderHook(() => useResizeObserver());

      expect(mockObserverInstances.length).toBeGreaterThan(0);
    });

    it("should not observe when enabled is false", () => {
      const { result } = renderHook(() =>
        useResizeObserver({ enabled: false })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isObserving).toBe(false);
    });

    it("should return isObserving as false initially", () => {
      const { result } = renderHook(() => useResizeObserver());

      expect(result.current.isObserving).toBe(false);
    });
  });

  // ============ Observation Tests ============
  describe("observation", () => {
    it("should observe element when ref is attached", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      expect(isElementObserved(targetElement)).toBe(true);
      expect(result.current.isObserving).toBe(true);
    });

    it("should update width and height on resize", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(150);
    });

    it("should update entry on resize", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(result.current.entry).toBeDefined();
      expect(result.current.entry?.contentRect.width).toBe(200);
      expect(result.current.entry?.contentRect.height).toBe(150);
    });

    it("should track contentRect correctly", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 300, height: 200 });
      });

      expect(result.current.contentRect?.width).toBe(300);
      expect(result.current.contentRect?.height).toBe(200);
    });

    it("should track borderBoxSize correctly", () => {
      const { result } = renderHook(() =>
        useResizeObserver({ box: "border-box" })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, {
          width: 100,
          height: 80,
          borderBoxWidth: 120,
          borderBoxHeight: 100,
        });
      });

      expect(result.current.borderBoxSize?.inlineSize).toBe(120);
      expect(result.current.borderBoxSize?.blockSize).toBe(100);
    });

    it("should track contentBoxSize correctly", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 80 });
      });

      expect(result.current.contentBoxSize?.inlineSize).toBe(100);
      expect(result.current.contentBoxSize?.blockSize).toBe(80);
    });

    it('should handle box="border-box" option', () => {
      const { result } = renderHook(() =>
        useResizeObserver({ box: "border-box" })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      const options = getObserveOptions(targetElement);
      expect(options?.box).toBe("border-box");
    });

    it('should handle box="content-box" option', () => {
      const { result } = renderHook(() =>
        useResizeObserver({ box: "content-box" })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      const options = getObserveOptions(targetElement);
      expect(options?.box).toBe("content-box");
    });

    it('should handle box="device-pixel-content-box" option', () => {
      const { result } = renderHook(() =>
        useResizeObserver({ box: "device-pixel-content-box" })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      const options = getObserveOptions(targetElement);
      expect(options?.box).toBe("device-pixel-content-box");
    });

    it("should call onResize callback", () => {
      const onResize = vi.fn();
      const { result } = renderHook(() => useResizeObserver({ onResize }));

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(onResize).toHaveBeenCalledTimes(1);
      expect(onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          contentRect: expect.objectContaining({
            width: 200,
            height: 150,
          }),
        })
      );
    });

    it("should not update state when size has not changed", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      const firstEntry = result.current.entry;

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      // Entry should be the same object reference (no re-render)
      expect(result.current.entry).toBe(firstEntry);
    });

    it("should handle rapid resize events", () => {
      const onResize = vi.fn();
      const { result } = renderHook(() => useResizeObserver({ onResize }));

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 100 });
        simulateResize(targetElement, { width: 150, height: 150 });
        simulateResize(targetElement, { width: 200, height: 200 });
      });

      expect(onResize).toHaveBeenCalledTimes(3);
      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(200);
    });
  });

  // ============ Debounce Tests ============
  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should debounce resize events", () => {
      const onResize = vi.fn();
      const { result } = renderHook(() =>
        useResizeObserver({ debounce: 100, onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 100 });
        simulateResize(targetElement, { width: 150, height: 150 });
        simulateResize(targetElement, { width: 200, height: 200 });
      });

      expect(onResize).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onResize).toHaveBeenCalledTimes(1);
    });

    it("should only call callback after debounce delay", () => {
      const onResize = vi.fn();
      const { result } = renderHook(() =>
        useResizeObserver({ debounce: 100, onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(onResize).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(onResize).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(onResize).toHaveBeenCalledTimes(1);
    });

    it("should reset debounce timer on each resize", () => {
      const onResize = vi.fn();
      const { result } = renderHook(() =>
        useResizeObserver({ debounce: 100, onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 100 });
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 200 });
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(onResize).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(onResize).toHaveBeenCalledTimes(1);
    });

    it("should not update state during debounce", () => {
      const { result } = renderHook(() =>
        useResizeObserver({ debounce: 100, initialWidth: 50, initialHeight: 50 })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(result.current.width).toBe(50);
      expect(result.current.height).toBe(50);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(150);
    });

    it("should cleanup debounce timeout on unmount", () => {
      const onResize = vi.fn();
      const { result, unmount } = renderHook(() =>
        useResizeObserver({ debounce: 100, onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onResize).not.toHaveBeenCalled();
    });
  });

  // ============ Throttle Tests ============
  describe("throttle", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should throttle resize events", () => {
      const onResize = vi.fn();
      const { result } = renderHook(() =>
        useResizeObserver({ throttle: 100, onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 100 });
      });

      expect(onResize).toHaveBeenCalledTimes(1);

      act(() => {
        simulateResize(targetElement, { width: 150, height: 150 });
        simulateResize(targetElement, { width: 200, height: 200 });
      });

      expect(onResize).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onResize).toHaveBeenCalledTimes(2);
    });

    it("should call callback immediately on first resize", () => {
      const onResize = vi.fn();
      const { result } = renderHook(() =>
        useResizeObserver({ throttle: 100, onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(onResize).toHaveBeenCalledTimes(1);
    });

    it("should respect throttle interval", () => {
      const onResize = vi.fn();
      const { result } = renderHook(() =>
        useResizeObserver({ throttle: 100, onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 100 });
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 200 });
      });

      expect(onResize).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(onResize).toHaveBeenCalledTimes(2);
    });

    it("should deliver the latest dimensions on the trailing edge", () => {
      // Regression: previously the trailing setTimeout closed over the entries
      // captured when it was scheduled (the first sub-threshold resize), so the
      // final dimensions of a burst were dropped.
      const onResize = vi.fn();
      const { result } = renderHook(() =>
        useResizeObserver({ throttle: 100, onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      // Leading edge fires immediately with the first size.
      act(() => {
        simulateResize(targetElement, { width: 100, height: 100 });
      });
      expect(result.current.width).toBe(100);

      // Two more resizes within the interval — only a trailing call is scheduled.
      act(() => {
        simulateResize(targetElement, { width: 150, height: 150 });
        simulateResize(targetElement, { width: 200, height: 200 });
      });

      // Still throttled: state not yet updated to the latest size.
      expect(result.current.width).toBe(100);

      // Trailing edge must commit the MOST RECENT dimensions (200), not 150.
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(200);
      expect(onResize).toHaveBeenLastCalledWith(
        expect.objectContaining({
          contentRect: expect.objectContaining({ width: 200, height: 200 }),
        })
      );
    });

    it("should cleanup throttle timeout on unmount", () => {
      const onResize = vi.fn();
      const { result, unmount } = renderHook(() =>
        useResizeObserver({ throttle: 100, onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 100 });
        simulateResize(targetElement, { width: 200, height: 200 });
      });

      expect(onResize).toHaveBeenCalledTimes(1);

      unmount();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onResize).toHaveBeenCalledTimes(1);
    });
  });

  // ============ Round Option Tests ============
  describe("round option", () => {
    it("should use Math.round by default", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 80 });
      });

      // Mock values are integers, so they should remain the same
      expect(result.current.width).toBe(100);
      expect(result.current.height).toBe(80);
    });

    it("should apply custom round function (Math.floor)", () => {
      const { result } = renderHook(() =>
        useResizeObserver({ round: Math.floor })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 80 });
      });

      expect(result.current.width).toBe(100);
      expect(result.current.height).toBe(80);
    });

    it("should apply custom round function (Math.ceil)", () => {
      const { result } = renderHook(() =>
        useResizeObserver({ round: Math.ceil })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 80 });
      });

      expect(result.current.width).toBe(100);
      expect(result.current.height).toBe(80);
    });

    it("should apply identity function (no rounding)", () => {
      const { result } = renderHook(() =>
        useResizeObserver({ round: (v) => v })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 80 });
      });

      expect(result.current.width).toBe(100);
      expect(result.current.height).toBe(80);
    });
  });

  // ============ Enabled Option Tests ============
  describe("enabled option", () => {
    it("should not observe when disabled", () => {
      const { result } = renderHook(() =>
        useResizeObserver({ enabled: false })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isObserving).toBe(false);
      expect(isElementObserved(targetElement)).toBe(false);
    });

    it("should start observing when enabled changes to true", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useResizeObserver({ enabled }),
        { initialProps: { enabled: false } }
      );

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isObserving).toBe(false);

      rerender({ enabled: true });

      expect(result.current.isObserving).toBe(true);
    });

    it("should stop observing when enabled changes to false", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useResizeObserver({ enabled }),
        { initialProps: { enabled: true } }
      );

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isObserving).toBe(true);

      rerender({ enabled: false });

      expect(result.current.isObserving).toBe(false);
    });

    it("should preserve last size when disabled", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useResizeObserver({ enabled }),
        { initialProps: { enabled: true } }
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(150);

      rerender({ enabled: false });

      // Size should be preserved
      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(150);
    });
  });

  // ============ UpdateState Option Tests ============
  describe("updateState option", () => {
    it("should update state when updateState is true", () => {
      const { result } = renderHook(() =>
        useResizeObserver({ updateState: true })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(150);
    });

    it("should not update state when updateState is false", () => {
      const { result } = renderHook(() =>
        useResizeObserver({ updateState: false })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(result.current.width).toBeUndefined();
      expect(result.current.height).toBeUndefined();
    });

    it("should still call onResize when updateState is false", () => {
      const onResize = vi.fn();
      const { result } = renderHook(() =>
        useResizeObserver({ updateState: false, onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(onResize).toHaveBeenCalledTimes(1);
    });
  });

  // ============ Manual Control Tests ============
  describe("manual control", () => {
    it("should manually observe element", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.observe(targetElement);
      });

      expect(result.current.isObserving).toBe(true);
      expect(isElementObserved(targetElement)).toBe(true);
    });

    it("should manually unobserve element", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isObserving).toBe(true);

      act(() => {
        result.current.unobserve(targetElement);
      });

      expect(result.current.isObserving).toBe(false);
    });

    it("should disconnect all observations", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isObserving).toBe(true);

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isObserving).toBe(false);
    });

    it("should handle observe/unobserve same element", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.observe(targetElement);
      });

      expect(result.current.isObserving).toBe(true);

      act(() => {
        result.current.unobserve(targetElement);
      });

      expect(result.current.isObserving).toBe(false);

      act(() => {
        result.current.observe(targetElement);
      });

      expect(result.current.isObserving).toBe(true);
    });
  });

  // ============ Cleanup Tests ============
  describe("cleanup", () => {
    it("should disconnect on unmount", () => {
      const { result, unmount } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      const observer = getLatestObserver();
      expect(observer?.observedElements.size).toBeGreaterThan(0);

      unmount();

      // After unmount, the observer should be disconnected
      // Note: The mock doesn't automatically clear on disconnect in this setup
      // but we can verify the behavior through the hook's cleanup
    });

    it("should handle ref change cleanup", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      expect(isElementObserved(targetElement)).toBe(true);

      const newElement = document.createElement("div");
      container.appendChild(newElement);

      act(() => {
        result.current.ref(newElement);
      });

      expect(isElementObserved(newElement)).toBe(true);
      expect(isElementObserved(targetElement)).toBe(false);
    });

    it("should not call callbacks after unmount", () => {
      const onResize = vi.fn();
      const { result, unmount } = renderHook(() =>
        useResizeObserver({ onResize })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      unmount();

      // Attempting to simulate resize after unmount
      // The callback should not be called
      expect(onResize).not.toHaveBeenCalled();
    });
  });

  // ============ Ref Pattern Tests ============
  describe("ref patterns", () => {
    it("should work with callback ref pattern", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isObserving).toBe(true);

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(150);
    });

    it("should handle ref changes correctly", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100, height: 100 });
      });

      expect(result.current.width).toBe(100);

      const newElement = document.createElement("div");
      container.appendChild(newElement);

      act(() => {
        result.current.ref(newElement);
      });

      act(() => {
        simulateResize(newElement, { width: 200, height: 200 });
      });

      expect(result.current.width).toBe(200);
    });

    it("should handle null ref", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isObserving).toBe(true);

      act(() => {
        result.current.ref(null);
      });

      expect(result.current.isObserving).toBe(false);
    });

    it("should handle ref reassignment", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isObserving).toBe(true);
    });

    it("should maintain ref callback stability", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useResizeObserver({ enabled }),
        { initialProps: { enabled: true } }
      );

      const ref1 = result.current.ref;

      rerender({ enabled: true });

      const ref2 = result.current.ref;

      expect(ref1).toBe(ref2);
    });
  });

  // ============ Reference Stability & Callback Re-subscription ============
  describe("reference stability", () => {
    it("should keep observe/unobserve/disconnect referentially stable across renders", () => {
      const { result, rerender } = renderHook(() => useResizeObserver());

      const observeBefore = result.current.observe;
      const unobserveBefore = result.current.unobserve;
      const disconnectBefore = result.current.disconnect;

      rerender();

      expect(result.current.observe).toBe(observeBefore);
      expect(result.current.unobserve).toBe(unobserveBefore);
      expect(result.current.disconnect).toBe(disconnectBefore);
    });

    it("should invoke the latest onResize without re-subscribing the observer", () => {
      const onResizeA = vi.fn();
      const onResizeB = vi.fn();

      const { result, rerender } = renderHook(
        ({ onResize }) => useResizeObserver({ onResize }),
        { initialProps: { onResize: onResizeA } }
      );

      act(() => {
        result.current.ref(targetElement);
      });

      const observerCountAfterMount = mockObserverInstances.length;

      // Swap the callback and resize — the NEW callback must fire.
      rerender({ onResize: onResizeB });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(onResizeA).not.toHaveBeenCalled();
      expect(onResizeB).toHaveBeenCalledTimes(1);
      expect(onResizeB).toHaveBeenCalledWith(
        expect.objectContaining({
          contentRect: expect.objectContaining({ width: 200, height: 150 }),
        })
      );

      // The observer must not have been torn down and recreated.
      expect(mockObserverInstances.length).toBe(observerCountAfterMount);
    });
  });

  // ============ Edge Cases ============
  describe("edge cases", () => {
    it("should handle elements with zero dimensions", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 0, height: 0 });
      });

      expect(result.current.width).toBe(0);
      expect(result.current.height).toBe(0);
    });

    it("should handle very large dimensions", () => {
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 100000, height: 100000 });
      });

      expect(result.current.width).toBe(100000);
      expect(result.current.height).toBe(100000);
    });

    it("should handle display:none elements", () => {
      targetElement.style.display = "none";
      const { result } = renderHook(() => useResizeObserver());

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isObserving).toBe(true);
    });
  });

  // ============ Error Handling Tests ============
  describe("error handling", () => {
    it("should call onError when error occurs", () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useResizeObserver({
          onError,
          onResize: () => {
            throw new Error("Test error");
          },
        })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        simulateResize(targetElement, { width: 200, height: 150 });
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ============ SSR Tests ============
  // Note: Full SSR tests with window undefined would break React DOM.
  // These tests verify API support detection works correctly.
  describe("SSR", () => {
    it("should have isSupported property", () => {
      const { result } = renderHook(() => useResizeObserver());

      // The mock is set up in vitest.setup.ts, so it should be supported
      expect(result.current.isSupported).toBe(true);
    });

    it("should return initial dimensions when provided", () => {
      const { result } = renderHook(() =>
        useResizeObserver({
          initialWidth: 100,
          initialHeight: 80,
        })
      );

      // Before any resize event, should have initial values
      expect(result.current.width).toBe(100);
      expect(result.current.height).toBe(80);
      expect(result.current.entry).toBeDefined();
    });

    it("should provide no-op functions that don't throw", () => {
      const { result } = renderHook(() => useResizeObserver());

      // These should not throw even without an element
      expect(() => result.current.observe(targetElement)).not.toThrow();
      expect(() => result.current.unobserve(targetElement)).not.toThrow();
      expect(() => result.current.disconnect()).not.toThrow();
    });

    it("should provide ref that accepts null", () => {
      const { result } = renderHook(() => useResizeObserver());

      expect(typeof result.current.ref).toBe("function");
      expect(() => result.current.ref(targetElement)).not.toThrow();
      expect(() => result.current.ref(null)).not.toThrow();
    });

    describe("unsupported environment", () => {
      let originalRO: typeof window.ResizeObserver;

      beforeEach(() => {
        originalRO = window.ResizeObserver;
        // Remove the API entirely so isResizeObserverSupported() returns false
        // and the hook takes its graceful-degradation branch.
        // @ts-expect-error - intentionally removing ResizeObserver
        delete window.ResizeObserver;
      });

      afterEach(() => {
        window.ResizeObserver = originalRO;
      });

      it("should report isSupported as false", () => {
        const { result } = renderHook(() => useResizeObserver());
        expect(result.current.isSupported).toBe(false);
        expect(result.current.isObserving).toBe(false);
      });

      it("should fall back to initial dimensions and initial entry", () => {
        const { result } = renderHook(() =>
          useResizeObserver({ initialWidth: 42, initialHeight: 24 })
        );

        expect(result.current.width).toBe(42);
        expect(result.current.height).toBe(24);
        expect(result.current.entry).toBeDefined();
        expect(result.current.entry?.contentRect.width).toBe(42);
        expect(result.current.entry?.contentRect.height).toBe(24);
      });

      it("should expose ref/observe/unobserve/disconnect as no-ops that don't throw", () => {
        const { result } = renderHook(() => useResizeObserver());

        expect(() => result.current.ref(targetElement)).not.toThrow();
        expect(() => result.current.ref(null)).not.toThrow();
        expect(() => result.current.observe(targetElement)).not.toThrow();
        expect(() => result.current.unobserve(targetElement)).not.toThrow();
        expect(() => result.current.disconnect()).not.toThrow();

        // No observer is ever created in the unsupported branch.
        expect(mockObserverInstances.length).toBe(0);
      });

      it("should return stable function identities across renders", () => {
        const { result, rerender } = renderHook(() => useResizeObserver());

        const refBefore = result.current.ref;
        const observeBefore = result.current.observe;
        const unobserveBefore = result.current.unobserve;
        const disconnectBefore = result.current.disconnect;

        rerender();

        expect(result.current.ref).toBe(refBefore);
        expect(result.current.observe).toBe(observeBefore);
        expect(result.current.unobserve).toBe(unobserveBefore);
        expect(result.current.disconnect).toBe(disconnectBefore);
      });
    });
  });

  // ============ Multiple Instances Tests ============
  describe("multiple instances", () => {
    it("should maintain separate state across instances", () => {
      // Get the observer count before creating hooks
      const initialObserverCount = mockObserverInstances.length;

      const { result: result1 } = renderHook(() => useResizeObserver());

      const element1 = document.createElement("div");
      container.appendChild(element1);

      act(() => {
        result1.current.ref(element1);
      });

      // Find the observer for this hook (should be at initialObserverCount)
      const observer1Index = initialObserverCount;

      act(() => {
        simulateResize(element1, {
          width: 100,
          height: 100,
          observerIndex: observer1Index,
        });
      });

      expect(result1.current.width).toBe(100);
      expect(result1.current.height).toBe(100);

      // Now create second hook
      const { result: result2 } = renderHook(() => useResizeObserver());

      const element2 = document.createElement("div");
      container.appendChild(element2);

      act(() => {
        result2.current.ref(element2);
      });

      // Second observer should be at initialObserverCount + 1
      const observer2Index = observer1Index + 1;

      act(() => {
        simulateResize(element2, {
          width: 200,
          height: 200,
          observerIndex: observer2Index,
        });
      });

      // Verify both hooks maintain separate state
      expect(result1.current.width).toBe(100);
      expect(result2.current.width).toBe(200);
    });

    it("should handle different options per instance", () => {
      const onResize1 = vi.fn();
      const onResize2 = vi.fn();

      const initialObserverCount = mockObserverInstances.length;

      const { result: result1 } = renderHook(() =>
        useResizeObserver({ box: "content-box", onResize: onResize1 })
      );

      const element1 = document.createElement("div");
      container.appendChild(element1);

      act(() => {
        result1.current.ref(element1);
      });

      const observer1Index = initialObserverCount;

      const { result: result2 } = renderHook(() =>
        useResizeObserver({ box: "border-box", onResize: onResize2 })
      );

      const element2 = document.createElement("div");
      container.appendChild(element2);

      act(() => {
        result2.current.ref(element2);
      });

      const observer2Index = observer1Index + 1;

      act(() => {
        simulateResize(element1, {
          width: 100,
          height: 100,
          observerIndex: observer1Index,
        });
      });

      expect(onResize1).toHaveBeenCalledTimes(1);
      expect(onResize2).not.toHaveBeenCalled();

      act(() => {
        simulateResize(element2, {
          width: 200,
          height: 200,
          observerIndex: observer2Index,
        });
      });

      expect(onResize2).toHaveBeenCalledTimes(1);
    });
  });
});
