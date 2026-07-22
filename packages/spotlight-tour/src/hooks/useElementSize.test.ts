import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEffect } from "react";
import { useElementSize } from "./useElementSize";

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

function makeElement(size: { width: number; height: number }): {
  el: HTMLElement;
  setSize: (s: { width: number; height: number }) => void;
} {
  const el = document.createElement("div");
  let current = size;
  el.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      ...current,
      top: 0,
      left: 0,
      right: current.width,
      bottom: current.height,
      toJSON: () => current,
    }) as DOMRect;
  document.body.appendChild(el);
  return { el, setSize: (s) => (current = s) };
}

/** A minimal ResizeObserverEntry-shaped object for the mocked observer. */
function fakeEntry(el: Element, width: number, height: number): unknown {
  const contentRect = {
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
  };
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

describe("useElementSize", () => {
  it("returns null for a null element", () => {
    const { result } = renderHook(() => useElementSize(null));
    expect(result.current).toBeNull();
  });

  it("measures the element synchronously on attach", () => {
    const { el } = makeElement({ width: 300, height: 120 });
    const { result } = renderHook(() => useElementSize(el));
    expect(result.current).toEqual({ width: 300, height: 120 });
  });

  it("re-measures when the ResizeObserver fires, batched through rAF", () => {
    const { el, setSize } = makeElement({ width: 300, height: 120 });
    const { result } = renderHook(() => useElementSize(el));

    setSize({ width: 340, height: 160 });
    const ro = MockResizeObserver.instances.find((i) =>
      i.observed.includes(el)
    );
    act(() => {
      ro!.callback([fakeEntry(el, 340, 160)], ro);
      ro!.callback([fakeEntry(el, 340, 160)], ro); // burst → one frame
    });
    expect(result.current).toEqual({ width: 300, height: 120 }); // pre-frame
    expect(rafCallbacks.length).toBe(1);
    act(() => flushRaf());
    expect(result.current).toEqual({ width: 340, height: 160 });
  });

  it("keeps the same reference when the size did not change", () => {
    const { el } = makeElement({ width: 300, height: 120 });
    const { result } = renderHook(() => useElementSize(el));
    const first = result.current;
    const ro = MockResizeObserver.instances.find((i) =>
      i.observed.includes(el)
    );
    act(() => {
      ro!.callback([fakeEntry(el, 300, 120)], ro);
    });
    act(() => flushRaf());
    expect(result.current).toBe(first);
  });

  it("drops the stale size in the same commit and re-measures when the remeasure key changes", () => {
    const { el, setSize } = makeElement({ width: 300, height: 120 });
    // Record per COMMIT (effect), not per render invocation — the render-phase
    // reset re-invokes the component and the abandoned pass would otherwise
    // pollute the log with values that never reach the DOM.
    const committed: ({ width: number; height: number } | null)[] = [];
    const { result, rerender } = renderHook(
      ({ key }: { key: number }) => {
        const size = useElementSize(el, key);
        useEffect(() => {
          committed.push(size);
        });
        return size;
      },
      { initialProps: { key: 0 } }
    );
    expect(result.current).toEqual({ width: 300, height: 120 });

    setSize({ width: 200, height: 80 });
    rerender({ key: 1 });

    // final size is the fresh measurement…
    expect(result.current).toEqual({ width: 200, height: 80 });
    // …and the committed sequence shows: unmeasured → measured(A) → key
    // change resets to unmeasured in its own commit → measured(B). The old
    // size is never committed under the new key.
    expect(committed).toEqual([
      null,
      { width: 300, height: 120 },
      null,
      { width: 200, height: 80 },
    ]);
  });

  it("resets to null when the element detaches", () => {
    const { el } = makeElement({ width: 300, height: 120 });
    const { result, rerender } = renderHook(
      ({ element }: { element: Element | null }) => useElementSize(element),
      { initialProps: { element: el as Element | null } }
    );
    expect(result.current).not.toBeNull();
    rerender({ element: null });
    expect(result.current).toBeNull();
  });

  it("commits null when a scheduled measure finds the element gone", () => {
    const { el } = makeElement({ width: 300, height: 120 });
    const { result, rerender } = renderHook(
      ({ element }: { element: Element | null }) => useElementSize(element),
      { initialProps: { element: el as Element | null } }
    );
    const ro = MockResizeObserver.instances.find((i) =>
      i.observed.includes(el)
    );
    act(() => {
      ro!.callback([fakeEntry(el, 340, 160)], ro); // frame pending
    });
    rerender({ element: null }); // detach before the frame fires
    act(() => flushRaf()); // cancel is a mocked no-op, so the frame still runs
    expect(result.current).toBeNull();
  });

  it("cancels a pending frame and stops observing on unmount", () => {
    const { el } = makeElement({ width: 300, height: 120 });
    const { unmount } = renderHook(() => useElementSize(el));
    const ro = MockResizeObserver.instances.find((i) =>
      i.observed.includes(el)
    );
    act(() => {
      ro!.callback([fakeEntry(el, 340, 160)], ro); // leave a frame pending
    });
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    expect(
      MockResizeObserver.instances.some((i) => i.observed.includes(el))
    ).toBe(false);
  });
});
