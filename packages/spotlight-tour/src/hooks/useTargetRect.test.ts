import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { StrictMode, createElement, type ReactNode } from "react";
import { useTargetRect } from "./useTargetRect";

const strictWrapper = ({ children }: { children?: ReactNode }) =>
  createElement(StrictMode, null, children);

type RoCallback = (entries: unknown[], observer: unknown) => void;

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  callback: RoCallback;
  observed: Element[] = [];
  constructor(callback: RoCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve(el: Element) {
    this.observed = this.observed.filter((o) => o !== el);
  }
  disconnect() {
    this.observed = [];
  }
}

let rafCallbacks: FrameRequestCallback[] = [];

function flushRaf() {
  const cbs = rafCallbacks;
  rafCallbacks = [];
  for (const cb of cbs) cb(performance.now());
}

function makeElement(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { el: HTMLElement; setRect: (r: typeof rect) => void } {
  const el = document.createElement("div");
  let current = rect;
  el.getBoundingClientRect = () =>
    ({
      ...current,
      top: current.y,
      left: current.x,
      right: current.x + current.width,
      bottom: current.y + current.height,
      toJSON: () => current,
    }) as DOMRect;
  document.body.appendChild(el);
  return { el, setRect: (r) => (current = r) };
}

/** A minimal ResizeObserverEntry-shaped object for the mocked observer. */
function fakeEntry(el: Element, width: number, height: number): unknown {
  const contentRect = { x: 0, y: 0, width, height, top: 0, left: 0, right: width, bottom: height };
  return {
    target: el,
    contentRect,
    borderBoxSize: [{ inlineSize: width, blockSize: height }],
    contentBoxSize: [{ inlineSize: width, blockSize: height }],
    devicePixelContentBoxSize: [{ inlineSize: width, blockSize: height }],
  };
}

beforeEach(() => {
  MockResizeObserver.instances = [];
  rafCallbacks = [];
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("useTargetRect", () => {
  it("returns null for a null element", () => {
    const { result } = renderHook(() => useTargetRect(null));
    expect(result.current).toBeNull();
  });

  it("measures the element synchronously on mount", () => {
    const { el } = makeElement({ x: 10, y: 20, width: 100, height: 50 });
    const { result } = renderHook(() => useTargetRect(el));
    expect(result.current).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("observes the element with ResizeObserver", () => {
    const { el } = makeElement({ x: 0, y: 0, width: 100, height: 50 });
    renderHook(() => useTargetRect(el));
    const observing = MockResizeObserver.instances.some((ro) =>
      ro.observed.includes(el)
    );
    expect(observing).toBe(true);
  });

  it("re-measures on scroll, batched through rAF", () => {
    const { el, setRect } = makeElement({ x: 10, y: 100, width: 100, height: 50 });
    const { result } = renderHook(() => useTargetRect(el));

    setRect({ x: 10, y: 40, width: 100, height: 50 }); // page scrolled 60px
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("scroll")); // burst collapses to one frame
    });
    // not yet committed — waiting for the animation frame
    expect(result.current).toEqual({ x: 10, y: 100, width: 100, height: 50 });
    expect(rafCallbacks.length).toBe(1);

    act(() => flushRaf());
    expect(result.current).toEqual({ x: 10, y: 40, width: 100, height: 50 });
  });

  it("re-measures on window resize", () => {
    const { el, setRect } = makeElement({ x: 10, y: 20, width: 100, height: 50 });
    const { result } = renderHook(() => useTargetRect(el));

    setRect({ x: 10, y: 20, width: 80, height: 50 });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    act(() => flushRaf());
    expect(result.current).toEqual({ x: 10, y: 20, width: 80, height: 50 });
  });

  it("re-measures when the ResizeObserver fires", () => {
    const { el, setRect } = makeElement({ x: 10, y: 20, width: 100, height: 50 });
    const { result } = renderHook(() => useTargetRect(el));

    setRect({ x: 10, y: 20, width: 200, height: 80 });
    const ro = MockResizeObserver.instances.find((i) => i.observed.includes(el));
    act(() => {
      ro!.callback([fakeEntry(el, 200, 80)], ro);
    });
    act(() => flushRaf());
    expect(result.current).toEqual({ x: 10, y: 20, width: 200, height: 80 });
  });

  it("keeps the same rect reference when nothing changed", () => {
    const { el } = makeElement({ x: 10, y: 20, width: 100, height: 50 });
    const { result } = renderHook(() => useTargetRect(el));
    const first = result.current;

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    act(() => flushRaf());
    expect(result.current).toBe(first);
  });

  it("resets to null when the element goes away", () => {
    const { el } = makeElement({ x: 10, y: 20, width: 100, height: 50 });
    const { result, rerender } = renderHook(
      ({ element }: { element: Element | null }) => useTargetRect(element),
      { initialProps: { element: el as Element | null } }
    );
    expect(result.current).not.toBeNull();
    rerender({ element: null });
    expect(result.current).toBeNull();
  });

  it("tracks a replacement element after a swap", () => {
    const a = makeElement({ x: 0, y: 0, width: 10, height: 10 });
    const b = makeElement({ x: 5, y: 5, width: 20, height: 20 });
    const { result, rerender } = renderHook(
      ({ element }: { element: Element }) => useTargetRect(element),
      { initialProps: { element: a.el as Element } }
    );
    expect(result.current).toEqual({ x: 0, y: 0, width: 10, height: 10 });
    rerender({ element: b.el });
    expect(result.current).toEqual({ x: 5, y: 5, width: 20, height: 20 });
  });

  it("leaves no ResizeObserver instance observing the element after unmount", () => {
    const { el } = makeElement({ x: 10, y: 20, width: 100, height: 50 });
    const { unmount } = renderHook(() => useTargetRect(el));
    expect(
      MockResizeObserver.instances.some((ro) => ro.observed.includes(el))
    ).toBe(true);
    unmount();
    // Regression: the orphaned-observer bug left a pre-mount observer
    // instance still watching the element after unmount.
    expect(
      MockResizeObserver.instances.some((ro) => ro.observed.includes(el))
    ).toBe(false);
  });

  it("StrictMode: observes exactly once and tears down cleanly", () => {
    const { el } = makeElement({ x: 10, y: 20, width: 100, height: 50 });
    const { result, unmount } = renderHook(() => useTargetRect(el), {
      wrapper: strictWrapper,
    });
    expect(result.current).toEqual({ x: 10, y: 20, width: 100, height: 50 });
    // double-mount must not leave a duplicate (orphaned) observation behind
    const observing = MockResizeObserver.instances.filter((ro) =>
      ro.observed.includes(el)
    );
    expect(observing.length).toBe(1);
    unmount();
    expect(
      MockResizeObserver.instances.some((ro) => ro.observed.includes(el))
    ).toBe(false);
  });

  it("StrictMode: still tracks scroll updates after the double-mount", () => {
    const { el, setRect } = makeElement({ x: 10, y: 100, width: 100, height: 50 });
    const { result } = renderHook(() => useTargetRect(el), {
      wrapper: strictWrapper,
    });
    setRect({ x: 10, y: 40, width: 100, height: 50 });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    act(() => flushRaf());
    expect(result.current).toEqual({ x: 10, y: 40, width: 100, height: 50 });
  });

  it("commits null when a scheduled measure finds the element gone", () => {
    const { el } = makeElement({ x: 10, y: 20, width: 100, height: 50 });
    const { result, rerender } = renderHook(
      ({ element }: { element: Element | null }) => useTargetRect(element),
      { initialProps: { element: el as Element | null } }
    );
    act(() => {
      window.dispatchEvent(new Event("scroll")); // frame pending
    });
    rerender({ element: null }); // element vanishes before the frame fires
    act(() => flushRaf()); // cancel is mocked to a no-op, so the frame still runs
    expect(result.current).toBeNull();
  });

  it("removes listeners and cancels a pending frame on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { el } = makeElement({ x: 10, y: 20, width: 100, height: 50 });
    const { unmount } = renderHook(() => useTargetRect(el));

    act(() => {
      window.dispatchEvent(new Event("scroll")); // leave a frame pending
    });
    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    const removed = removeSpy.mock.calls.map((c) => c[0]);
    expect(removed).toContain("scroll");
    expect(removed).toContain("resize");
  });
});
