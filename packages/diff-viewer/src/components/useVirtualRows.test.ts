import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { computeWindow, observeSize, useVirtualRows } from "./useVirtualRows";

describe("observeSize — resize plumbing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses ResizeObserver when the environment has one", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let captured: (() => void) | undefined;
    class FakeResizeObserver {
      constructor(cb: () => void) {
        captured = cb;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
    }
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);

    const node = document.createElement("div");
    const onResize = vi.fn();
    const stop = observeSize(node, onResize);

    expect(observe).toHaveBeenCalledWith(node);
    captured?.();
    expect(onResize).toHaveBeenCalledTimes(1);

    stop();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("falls back to a window resize listener without ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const node = document.createElement("div");
    const onResize = vi.fn();
    const stop = observeSize(node, onResize);

    expect(add).toHaveBeenCalledWith("resize", onResize);
    window.dispatchEvent(new Event("resize"));
    expect(onResize).toHaveBeenCalled();

    stop();
    expect(remove).toHaveBeenCalledWith("resize", onResize);
    add.mockRestore();
    remove.mockRestore();
  });
});

describe("computeWindow — the windowing arithmetic", () => {
  const base = { total: 1000, rowHeight: 22, viewport: 440 };

  it("renders everything when the viewport is unknown (SSR / pre-measure)", () => {
    const w = computeWindow({ ...base, scrollTop: 0, viewport: 0 });
    expect(w).toEqual({
      start: 0,
      end: 1000,
      paddingTop: 0,
      paddingBottom: 0,
      virtualized: false,
    });
  });

  it("renders everything for a degenerate row height", () => {
    expect(computeWindow({ ...base, rowHeight: 0, scrollTop: 0 }).virtualized).toBe(false);
  });

  it("starts at row 0 when scrolled to the top", () => {
    const w = computeWindow({ ...base, scrollTop: 0, overscan: 8 });
    expect(w.start).toBe(0);
    expect(w.paddingTop).toBe(0);
    // 20 visible + 16 overscan.
    expect(w.end).toBe(36);
    expect(w.paddingBottom).toBe((1000 - 36) * 22);
    expect(w.virtualized).toBe(true);
  });

  it("maps a scroll offset to a row index by division", () => {
    // 100 rows down: 100 * 22 = 2200.
    const w = computeWindow({ ...base, scrollTop: 2200, overscan: 8 });
    expect(w.start).toBe(92); // 100 - overscan
    expect(w.paddingTop).toBe(92 * 22);
  });

  it("clamps the window to the end of the list", () => {
    const w = computeWindow({ ...base, scrollTop: 1000 * 22, overscan: 8 });
    expect(w.end).toBe(1000);
    expect(w.paddingBottom).toBe(0);
  });

  it("never renders a negative start", () => {
    const w = computeWindow({ ...base, scrollTop: 0, overscan: 100 });
    expect(w.start).toBe(0);
    expect(w.paddingTop).toBe(0);
  });

  it("keeps padding + rendered height equal to the full list height", () => {
    for (const scrollTop of [0, 500, 2200, 9000, 21_000, 22_000]) {
      const w = computeWindow({ ...base, scrollTop });
      const rendered = (w.end - w.start) * 22;
      expect(w.paddingTop + rendered + w.paddingBottom).toBe(1000 * 22);
    }
  });

  it("always covers the visible viewport", () => {
    for (const scrollTop of [0, 137, 2200, 9001, 21_800]) {
      const w = computeWindow({ ...base, scrollTop });
      const firstVisible = Math.floor(scrollTop / 22);
      const lastVisible = Math.min(999, Math.ceil((scrollTop + 440) / 22));
      expect(w.start).toBeLessThanOrEqual(firstVisible);
      expect(w.end).toBeGreaterThanOrEqual(lastVisible);
    }
  });

  it("renders far fewer rows than the list holds", () => {
    const w = computeWindow({ total: 20_000, rowHeight: 22, viewport: 600, scrollTop: 100_000 });
    expect(w.end - w.start).toBeLessThan(60);
    expect(w.virtualized).toBe(true);
  });

  it("is not virtualized when the whole list fits the viewport", () => {
    const w = computeWindow({ total: 10, rowHeight: 22, viewport: 1000, scrollTop: 0 });
    expect(w.start).toBe(0);
    expect(w.end).toBe(10);
    expect(w.virtualized).toBe(false);
  });
});

describe("useVirtualRows — the hook", () => {
  /** A scroll container with controllable layout metrics. */
  function makeScroller(clientHeight: number) {
    const node = document.createElement("div");
    Object.defineProperty(node, "clientHeight", { value: clientHeight, configurable: true });
    Object.defineProperty(node, "scrollTop", { value: 0, writable: true, configurable: true });
    document.body.appendChild(node);
    return node;
  }

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("renders the full range when disabled", () => {
    const node = makeScroller(400);
    const { result } = renderHook(() =>
      useVirtualRows({ enabled: false, total: 5000, rowHeight: 22, scrollRef: { current: node } }),
    );
    expect(result.current).toEqual({
      start: 0,
      end: 5000,
      paddingTop: 0,
      paddingBottom: 0,
      virtualized: false,
    });
  });

  it("windows from the estimate when enabled but not yet measured", () => {
    // The effect's `if (!node) return` guard means nothing gets measured, but
    // the memo still windows from the estimated viewport rather than
    // rendering the whole list — the fix that turned a ~1.1s first paint into
    // a normal frame.
    const { result } = renderHook(() =>
      useVirtualRows({
        enabled: true,
        total: 5000,
        rowHeight: 22,
        scrollRef: { current: null },
      }),
    );
    expect(result.current.virtualized).toBe(true);
    expect(result.current.start).toBe(0);
    expect(result.current.end).toBeLessThan(100);
    expect(result.current.paddingBottom).toBeGreaterThan(0);
  });

  it("skips the state update when a scroll produces identical metrics", () => {
    vi.useFakeTimers();
    // Force the setTimeout fallback so we can flush the batched read.
    const raf = globalThis.requestAnimationFrame;
    // @ts-expect-error — removing it selects the timer path.
    delete globalThis.requestAnimationFrame;

    try {
      const node = makeScroller(400);
      const { result } = renderHook(() =>
        useVirtualRows({
          enabled: true,
          total: 5000,
          rowHeight: 22,
          scrollRef: { current: node },
        }),
      );

      act(() => {
        vi.runOnlyPendingTimers();
      });
      const windowAfterMeasure = result.current;
      expect(windowAfterMeasure.virtualized).toBe(true);

      // A scroll event that does not move scrollTop or resize the box.
      act(() => {
        node.dispatchEvent(new Event("scroll"));
        vi.runOnlyPendingTimers();
      });

      // The flush ran, saw identical metrics, and the updater returned the
      // SAME metrics object — so the derived window is referentially
      // unchanged. That is the no-op branch (the `current === next` bail).
      expect(result.current).toBe(windowAfterMeasure);
    } finally {
      globalThis.requestAnimationFrame = raf;
      vi.useRealTimers();
    }
  });
});
