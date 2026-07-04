import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMeasure } from "./useMeasure";
import { EMPTY_BOUNDS, rectToBounds, areBoundsEqual } from "./utils";
import type { Bounds } from "./types";

// ---------------------------------------------------------------------------
// Controllable ResizeObserver mock (jsdom has no ResizeObserver). The real
// @usefy/use-resize-observer we consume needs `window.ResizeObserver` to exist;
// this mock lets us drive resize callbacks deterministically.
// ---------------------------------------------------------------------------
const observerInstances: MockResizeObserver[] = [];

class MockResizeObserver {
  callback: ResizeObserverCallback;
  elements = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    observerInstances.push(this);
  }

  observe(element: Element): void {
    this.elements.add(element);
  }

  unobserve(element: Element): void {
    this.elements.delete(element);
  }

  disconnect(): void {
    this.elements.clear();
  }

  /** Fire the observer callback for all currently-observed elements. */
  trigger(): void {
    const entries = Array.from(this.elements).map(
      (target) =>
        ({
          target,
          contentRect: target.getBoundingClientRect(),
          borderBoxSize: [],
          contentBoxSize: [],
        }) as unknown as ResizeObserverEntry
    );
    this.callback(entries, this as unknown as ResizeObserver);
  }
}

/** The most recently created observer instance. */
function latestObserver(): MockResizeObserver {
  const instance = observerInstances[observerInstances.length - 1];
  if (!instance) throw new Error("no observer created");
  return instance;
}

type Rect = Omit<Bounds, never>;

/** Override an element's getBoundingClientRect with fixed values. */
function setRect(element: Element, rect: Partial<Rect>): void {
  const full: Rect = { ...EMPTY_BOUNDS, ...rect };
  element.getBoundingClientRect = vi.fn(
    () => ({ ...full, toJSON: () => full }) as DOMRect
  );
}

describe("useMeasure", () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    observerInstances.length = 0;
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    element = document.createElement("div");
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ============ Initialization ============
  describe("initialization", () => {
    it("returns a [ref, bounds] tuple", () => {
      const { result } = renderHook(() => useMeasure());
      const [ref, bounds] = result.current;
      expect(typeof ref).toBe("function");
      expect(bounds).toEqual(EMPTY_BOUNDS);
    });

    it("starts with all-zero bounds before an element is attached", () => {
      const { result } = renderHook(() => useMeasure());
      expect(result.current[1]).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      });
    });

    it("provides a stable ref callback across renders", () => {
      const { result, rerender } = renderHook(() => useMeasure());
      const first = result.current[0];
      rerender();
      expect(result.current[0]).toBe(first);
    });
  });

  // ============ Measuring ============
  describe("measuring", () => {
    it("measures the element synchronously on attach", () => {
      setRect(element, { x: 10, y: 20, width: 100, height: 50 });
      const { result } = renderHook(() => useMeasure<HTMLDivElement>());

      act(() => {
        result.current[0](element);
      });

      expect(result.current[1]).toMatchObject({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
    });

    it("reports the full bounds surface (x,y,width,height,top,right,bottom,left)", () => {
      setRect(element, {
        x: 5,
        y: 8,
        width: 200,
        height: 120,
        top: 8,
        right: 205,
        bottom: 128,
        left: 5,
      });
      const { result } = renderHook(() => useMeasure<HTMLDivElement>());

      act(() => {
        result.current[0](element);
      });

      expect(result.current[1]).toEqual({
        x: 5,
        y: 8,
        width: 200,
        height: 120,
        top: 8,
        right: 205,
        bottom: 128,
        left: 5,
      });
    });

    it("updates bounds when the observer reports a resize", () => {
      setRect(element, { width: 100, height: 50 });
      const { result } = renderHook(() => useMeasure<HTMLDivElement>());

      act(() => {
        result.current[0](element);
      });
      expect(result.current[1].width).toBe(100);

      // Element grows, observer fires.
      setRect(element, { width: 300, height: 150 });
      act(() => {
        latestObserver().trigger();
      });

      expect(result.current[1]).toMatchObject({ width: 300, height: 150 });
    });
  });

  // ============ Reference stability / no-op skipping ============
  describe("reference stability", () => {
    it("keeps the same bounds reference when a resize reports identical values", () => {
      setRect(element, { width: 100, height: 50 });
      const { result } = renderHook(() => useMeasure<HTMLDivElement>());

      act(() => {
        result.current[0](element);
      });
      const before = result.current[1];

      // Same rect → no-op, React should bail out and keep the reference.
      act(() => {
        latestObserver().trigger();
      });

      expect(result.current[1]).toBe(before);
    });

    it("produces a new bounds reference when values actually change", () => {
      setRect(element, { width: 100, height: 50 });
      const { result } = renderHook(() => useMeasure<HTMLDivElement>());

      act(() => {
        result.current[0](element);
      });
      const before = result.current[1];

      setRect(element, { width: 101, height: 50 });
      act(() => {
        latestObserver().trigger();
      });

      expect(result.current[1]).not.toBe(before);
      expect(result.current[1].width).toBe(101);
    });

    it("keeps bounds identity across re-renders when nothing changed", () => {
      const { result, rerender } = renderHook(() => useMeasure());
      const before = result.current[1];
      rerender();
      expect(result.current[1]).toBe(before);
    });
  });

  // ============ Lifecycle / cleanup ============
  describe("lifecycle", () => {
    it("observes the attached element", () => {
      const { result } = renderHook(() => useMeasure<HTMLDivElement>());
      act(() => {
        result.current[0](element);
      });
      expect(latestObserver().elements.has(element)).toBe(true);
    });

    it("stops observing when the ref is detached (null)", () => {
      const { result } = renderHook(() => useMeasure<HTMLDivElement>());
      act(() => {
        result.current[0](element);
      });
      const observer = latestObserver();
      expect(observer.elements.has(element)).toBe(true);

      act(() => {
        result.current[0](null);
      });
      expect(observer.elements.has(element)).toBe(false);
    });

    it("disconnects the observer on unmount", () => {
      const { result, unmount } = renderHook(() => useMeasure<HTMLDivElement>());
      act(() => {
        result.current[0](element);
      });
      const observer = latestObserver();

      unmount();
      expect(observer.elements.size).toBe(0);
    });

    it("does not throw when an element without getBoundingClientRect is attached", () => {
      const { result } = renderHook(() => useMeasure());
      expect(() => {
        act(() => {
          result.current[0]({} as unknown as Element);
        });
      }).not.toThrow();
      expect(result.current[1]).toEqual(EMPTY_BOUNDS);
    });
  });

  // ============ Graceful degradation (no ResizeObserver / SSR) ============
  describe("without ResizeObserver support", () => {
    beforeEach(() => {
      // Simulate an environment (older engine / server) where ResizeObserver
      // does not exist. The consumed useResizeObserver detects support via
      // `"ResizeObserver" in window`, so the KEY must be absent — deleting it
      // (rather than setting it to undefined) makes isSupported false and the
      // inner hook degrade to a no-op observer. useMeasure must not throw and
      // must still measure on attach. (Restored by the outer afterEach's
      // vi.unstubAllGlobals — the outer beforeEach re-stubs before each test.)
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    });

    it("does not throw when attaching an element", () => {
      const { result } = renderHook(() => useMeasure<HTMLDivElement>());
      expect(() => {
        act(() => {
          result.current[0](element);
        });
      }).not.toThrow();
    });

    it("still measures the element once on attach (independent of the observer)", () => {
      setRect(element, { x: 3, y: 4, width: 80, height: 40 });
      const { result } = renderHook(() => useMeasure<HTMLDivElement>());

      act(() => {
        result.current[0](element);
      });

      expect(result.current[1]).toMatchObject({
        x: 3,
        y: 4,
        width: 80,
        height: 40,
      });
    });

    it("returns EMPTY_BOUNDS when no element is ever attached (SSR-shaped)", () => {
      const { result } = renderHook(() => useMeasure());
      expect(result.current[1]).toEqual(EMPTY_BOUNDS);
    });
  });

  // ============ Pure helpers ============
  describe("utils", () => {
    it("EMPTY_BOUNDS is all zero and frozen", () => {
      expect(EMPTY_BOUNDS).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      });
      expect(Object.isFrozen(EMPTY_BOUNDS)).toBe(true);
    });

    it("rectToBounds maps every field", () => {
      const rect = {
        x: 1,
        y: 2,
        width: 3,
        height: 4,
        top: 2,
        right: 4,
        bottom: 6,
        left: 1,
      } as DOMRectReadOnly;
      expect(rectToBounds(rect)).toEqual({
        x: 1,
        y: 2,
        width: 3,
        height: 4,
        top: 2,
        right: 4,
        bottom: 6,
        left: 1,
      });
    });

    it("rectToBounds coerces a rect missing x/y (falls back to left/top then 0)", () => {
      const rect = {
        width: 10,
        height: 20,
        top: 5,
        right: 15,
        bottom: 25,
        left: 5,
      } as unknown as DOMRectReadOnly;
      const bounds = rectToBounds(rect);
      expect(bounds.x).toBe(5); // falls back to left
      expect(bounds.y).toBe(5); // falls back to top
      expect(Number.isFinite(bounds.x)).toBe(true);
    });

    it("rectToBounds falls back to 0 when x/y and left/top are all absent", () => {
      const rect = { width: 10, height: 20 } as unknown as DOMRectReadOnly;
      const bounds = rectToBounds(rect);
      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.top).toBe(0);
    });

    it("rectToBounds coerces every field to 0 for a fully empty rect", () => {
      const bounds = rectToBounds({} as unknown as DOMRectReadOnly);
      expect(bounds).toEqual(EMPTY_BOUNDS);
    });

    it("areBoundsEqual returns true for identical bounds", () => {
      expect(areBoundsEqual(EMPTY_BOUNDS, { ...EMPTY_BOUNDS })).toBe(true);
    });

    it("areBoundsEqual returns false when any field differs", () => {
      expect(areBoundsEqual(EMPTY_BOUNDS, { ...EMPTY_BOUNDS, width: 1 })).toBe(
        false
      );
      expect(areBoundsEqual(EMPTY_BOUNDS, { ...EMPTY_BOUNDS, right: 2 })).toBe(
        false
      );
    });
  });
});
