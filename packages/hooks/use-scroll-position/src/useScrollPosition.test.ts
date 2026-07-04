import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createRef } from "react";
import { useScrollPosition } from "./useScrollPosition";
import {
  ZERO_SCROLL_POSITION,
  isBrowser,
  isWindow,
  resolveScrollTarget,
  getScrollPosition,
  arePositionsEqual,
} from "./utils";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function setWindowScroll(x: number, y: number): void {
  Object.defineProperty(window, "scrollX", { configurable: true, value: x });
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
}

function setElementScroll(el: HTMLElement, left: number, top: number): void {
  Object.defineProperty(el, "scrollLeft", { configurable: true, value: left });
  Object.defineProperty(el, "scrollTop", { configurable: true, value: top });
}

function makeScrollableDiv(): HTMLDivElement {
  const el = document.createElement("div");
  setElementScroll(el, 0, 0);
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  setWindowScroll(0, 0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------

describe("utils", () => {
  it("ZERO_SCROLL_POSITION is a frozen zero offset", () => {
    expect(ZERO_SCROLL_POSITION).toEqual({ x: 0, y: 0 });
    expect(Object.isFrozen(ZERO_SCROLL_POSITION)).toBe(true);
  });

  it("isBrowser is true in jsdom", () => {
    expect(isBrowser()).toBe(true);
  });

  it("isWindow distinguishes the window from elements and null", () => {
    expect(isWindow(window)).toBe(true);
    expect(isWindow(document.createElement("div"))).toBe(false);
    expect(isWindow(null)).toBe(false);
  });

  it("resolveScrollTarget maps null/undefined to the window", () => {
    expect(resolveScrollTarget(null)).toBe(window);
    expect(resolveScrollTarget(undefined)).toBe(window);
  });

  it("resolveScrollTarget returns a raw element as-is", () => {
    const el = document.createElement("div");
    expect(resolveScrollTarget(el)).toBe(el);
  });

  it("resolveScrollTarget resolves a ref's current element", () => {
    const el = document.createElement("div");
    const ref = createRef<HTMLDivElement>();
    (ref as { current: HTMLDivElement | null }).current = el;
    expect(resolveScrollTarget(ref)).toBe(el);

    const empty = createRef<HTMLDivElement>();
    expect(resolveScrollTarget(empty)).toBeNull();
  });

  it("resolveScrollTarget returns null on the server (no window)", () => {
    vi.stubGlobal("window", undefined);
    try {
      expect(isBrowser()).toBe(false);
      expect(resolveScrollTarget(null)).toBeNull();
      expect(resolveScrollTarget(document.createElement("div"))).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("getScrollPosition reads window offsets", () => {
    setWindowScroll(12, 34);
    expect(getScrollPosition(window)).toEqual({ x: 12, y: 34 });
  });

  it("getScrollPosition reads element offsets", () => {
    const el = document.createElement("div");
    setElementScroll(el, 5, 9);
    expect(getScrollPosition(el)).toEqual({ x: 5, y: 9 });
  });

  it("getScrollPosition returns zero for a null target", () => {
    expect(getScrollPosition(null)).toBe(ZERO_SCROLL_POSITION);
  });

  it("arePositionsEqual compares by value", () => {
    expect(arePositionsEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
    expect(arePositionsEqual({ x: 1, y: 2 }, { x: 1, y: 3 })).toBe(false);
    expect(arePositionsEqual({ x: 1, y: 2 }, { x: 0, y: 2 })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useScrollPosition — window
// ---------------------------------------------------------------------------

describe("useScrollPosition (window)", () => {
  it("reads the initial window position synchronously on mount", () => {
    setWindowScroll(40, 80);
    const { result } = renderHook(() => useScrollPosition());
    expect(result.current).toEqual({ x: 40, y: 80 });
  });

  it("tracks the window scroll by default", () => {
    const { result } = renderHook(() => useScrollPosition({ throttleMs: 0 }));
    expect(result.current).toEqual({ x: 0, y: 0 });

    act(() => {
      setWindowScroll(0, 150);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 0, y: 150 });
  });

  it("updates on every scroll when throttleMs is 0", () => {
    const { result } = renderHook(() => useScrollPosition({ throttleMs: 0 }));

    act(() => {
      setWindowScroll(10, 0);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 10, y: 0 });

    act(() => {
      setWindowScroll(25, 0);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 25, y: 0 });
  });

  it("does not re-render when the offset is unchanged (stable reference)", () => {
    const { result } = renderHook(() => useScrollPosition({ throttleMs: 0 }));

    act(() => {
      setWindowScroll(30, 30);
      window.dispatchEvent(new Event("scroll"));
    });
    const first = result.current;
    expect(first).toEqual({ x: 30, y: 30 });

    act(() => {
      // Same position dispatched again — should keep the identical reference.
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(first);
  });
});

// ---------------------------------------------------------------------------
// useScrollPosition — throttling
// ---------------------------------------------------------------------------

describe("useScrollPosition (throttle)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  it("fires on the leading edge immediately", () => {
    const { result } = renderHook(() => useScrollPosition({ throttleMs: 100 }));

    act(() => {
      setWindowScroll(0, 20);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 0, y: 20 });
  });

  it("defers intermediate events but always commits the trailing position", () => {
    const { result } = renderHook(() => useScrollPosition({ throttleMs: 100 }));

    // Leading edge fires immediately.
    act(() => {
      setWindowScroll(0, 20);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 0, y: 20 });

    // A second event inside the window is deferred (trailing scheduled).
    act(() => {
      setWindowScroll(0, 60);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 0, y: 20 });

    // After the interval elapses, the trailing commit lands the final position.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toEqual({ x: 0, y: 60 });
  });

  it("coalesces multiple deferred events into a single trailing commit", () => {
    const { result } = renderHook(() => useScrollPosition({ throttleMs: 100 }));

    act(() => {
      setWindowScroll(0, 10);
      window.dispatchEvent(new Event("scroll"));
    });

    act(() => {
      setWindowScroll(0, 40);
      window.dispatchEvent(new Event("scroll"));
      setWindowScroll(0, 90);
      window.dispatchEvent(new Event("scroll"));
    });
    // Still on the leading value until the trailing timer fires.
    expect(result.current).toEqual({ x: 0, y: 10 });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toEqual({ x: 0, y: 90 });
  });

  it("cancels a pending trailing timer when a later leading edge fires", () => {
    const { result } = renderHook(() => useScrollPosition({ throttleMs: 100 }));

    // Leading edge at t=0.
    act(() => {
      setWindowScroll(0, 10);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 0, y: 10 });

    // Deferred event schedules a trailing timer.
    act(() => {
      setWindowScroll(0, 20);
      window.dispatchEvent(new Event("scroll"));
    });

    // Jump the clock past the interval WITHOUT running the timer, then dispatch
    // again — this takes the leading branch and must clear the pending timer.
    act(() => {
      vi.setSystemTime(300);
      setWindowScroll(0, 30);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 0, y: 30 });

    // The previously-scheduled trailing timer was cancelled, so advancing time
    // does not overwrite the position with the stale (y: 20) value.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toEqual({ x: 0, y: 30 });
  });

  it("clears a pending trailing timer on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = renderHook(() => useScrollPosition({ throttleMs: 100 }));

    act(() => {
      setWindowScroll(0, 10);
      window.dispatchEvent(new Event("scroll"));
      setWindowScroll(0, 40);
      window.dispatchEvent(new Event("scroll"));
    });

    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useScrollPosition — element / ref targets
// ---------------------------------------------------------------------------

describe("useScrollPosition (element)", () => {
  it("tracks a raw element's scroll", () => {
    const el = makeScrollableDiv();
    setElementScroll(el, 7, 11);

    const { result } = renderHook(() =>
      useScrollPosition({ element: el, throttleMs: 0 })
    );
    expect(result.current).toEqual({ x: 7, y: 11 });

    act(() => {
      setElementScroll(el, 15, 25);
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 15, y: 25 });
  });

  it("tracks an element passed via a ref object", () => {
    const el = makeScrollableDiv();
    const ref = createRef<HTMLDivElement>();
    (ref as { current: HTMLDivElement | null }).current = el;

    const { result } = renderHook(() =>
      useScrollPosition({ element: ref, throttleMs: 0 })
    );

    act(() => {
      setElementScroll(el, 3, 4);
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 3, y: 4 });
  });

  it("stays at zero when the ref is not yet attached", () => {
    const ref = createRef<HTMLDivElement>();
    const { result } = renderHook(() =>
      useScrollPosition({ element: ref, throttleMs: 0 })
    );
    expect(result.current).toEqual({ x: 0, y: 0 });
  });

  it("removes the listener and re-subscribes when the target element changes", () => {
    const first = makeScrollableDiv();
    const second = makeScrollableDiv();
    const removeSpy = vi.spyOn(first, "removeEventListener");
    const addSpy = vi.spyOn(second, "addEventListener");

    const { result, rerender } = renderHook(
      ({ el }) => useScrollPosition({ element: el, throttleMs: 0 }),
      { initialProps: { el: first } }
    );

    rerender({ el: second });
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      expect.objectContaining({ passive: true })
    );

    act(() => {
      setElementScroll(second, 8, 16);
      second.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toEqual({ x: 8, y: 16 });
  });

  it("attaches the scroll listener passively", () => {
    const el = makeScrollableDiv();
    const addSpy = vi.spyOn(el, "addEventListener");
    renderHook(() => useScrollPosition({ element: el }));

    expect(addSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      expect.objectContaining({ passive: true })
    );
  });

  it("removes the window listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrollPosition());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});

// ---------------------------------------------------------------------------
// useScrollPosition — throttleMs changes without re-subscribing
// ---------------------------------------------------------------------------

describe("useScrollPosition (dynamic throttle)", () => {
  it("does not re-subscribe the listener when throttleMs changes", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const { rerender } = renderHook(
      ({ ms }) => useScrollPosition({ throttleMs: ms }),
      { initialProps: { ms: 100 } }
    );

    const callsAfterMount = addSpy.mock.calls.filter(
      ([type]) => type === "scroll"
    ).length;

    rerender({ ms: 250 });

    const callsAfterRerender = addSpy.mock.calls.filter(
      ([type]) => type === "scroll"
    ).length;

    expect(callsAfterRerender).toBe(callsAfterMount);
  });
});
