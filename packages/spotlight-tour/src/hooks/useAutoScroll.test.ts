import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoScroll, SCROLL_SETTLE_QUIET_MS } from "./useAutoScroll";

function makeElement(rect: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}): HTMLElement {
  const el = document.createElement("div");
  const r = { x: 100, y: 100, width: 200, height: 50, ...rect };
  el.getBoundingClientRect = () =>
    ({
      ...r,
      top: r.y,
      left: r.x,
      right: r.x + r.width,
      bottom: r.y + r.height,
      toJSON: () => r,
    }) as DOMRect;
  // jsdom has no scrollIntoView — install a spy.
  el.scrollIntoView = vi.fn();
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("useAutoScroll", () => {
  it("does nothing when the element is fully inside the viewport", () => {
    const el = makeElement({ y: 100 }); // viewport 1024x768
    const { result } = renderHook(() =>
      useAutoScroll({ element: el, enabled: true, instant: false })
    );
    expect(result.current).toBe(false);
    act(() => void vi.runAllTimers());
    expect(el.scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls an off-viewport element to center and reports scrolling until the quiet period settles", () => {
    const el = makeElement({ y: 2000 }); // below the fold
    const { result } = renderHook(() =>
      useAutoScroll({ element: el, enabled: true, instant: false })
    );
    expect(result.current).toBe(true); // decision is pre-paint

    // the actual scroll starts on the deferred 0-ms timer (lock sequencing)
    expect(el.scrollIntoView).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(0));
    expect(el.scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
    expect(result.current).toBe(true);

    // still scrolling: scroll events keep pushing the quiet deadline out
    act(() => {
      vi.advanceTimersByTime(SCROLL_SETTLE_QUIET_MS - 50);
      window.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(SCROLL_SETTLE_QUIET_MS - 50);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    // quiet period elapses with no further scroll events → settled
    act(() => void vi.advanceTimersByTime(SCROLL_SETTLE_QUIET_MS));
    expect(result.current).toBe(false);
  });

  it("settles early on scrollend when the browser supports it", () => {
    Object.defineProperty(window, "onscrollend", {
      value: null,
      writable: true,
      configurable: true,
    });
    try {
      const el = makeElement({ y: 2000 });
      const { result } = renderHook(() =>
        useAutoScroll({ element: el, enabled: true, instant: false })
      );
      act(() => void vi.advanceTimersByTime(0)); // start the scroll
      expect(result.current).toBe(true);
      act(() => {
        window.dispatchEvent(new Event("scrollend"));
      });
      expect(result.current).toBe(false);
    } finally {
      delete (window as { onscrollend?: unknown }).onscrollend;
    }
  });

  it("uses instant behavior under reduced motion", () => {
    const el = makeElement({ y: 2000 });
    renderHook(() =>
      useAutoScroll({ element: el, enabled: true, instant: true })
    );
    act(() => void vi.advanceTimersByTime(0));
    expect(el.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "auto" })
    );
  });

  it("stays idle when disabled or without an element", () => {
    const el = makeElement({ y: 2000 });
    const { result, rerender } = renderHook(
      ({ element, enabled }: { element: Element | null; enabled: boolean }) =>
        useAutoScroll({ element, enabled, instant: false }),
      { initialProps: { element: el as Element | null, enabled: false } }
    );
    expect(result.current).toBe(false);
    rerender({ element: null, enabled: true });
    expect(result.current).toBe(false);
    act(() => void vi.runAllTimers());
    expect(el.scrollIntoView).not.toHaveBeenCalled();
  });

  it("cancels an in-flight scroll cycle on unmount (no stray timers or listeners)", () => {
    const el = makeElement({ y: 2000 });
    const { result, unmount } = renderHook(() =>
      useAutoScroll({ element: el, enabled: true, instant: false })
    );
    expect(result.current).toBe(true);
    unmount(); // before the 0-ms start timer fires
    act(() => void vi.runAllTimers());
    expect(el.scrollIntoView).not.toHaveBeenCalled();
    // and no listener left behind that would throw on dispatch
    window.dispatchEvent(new Event("scroll"));
  });

  it("re-evaluates when the element changes (new step)", () => {
    const inside = makeElement({ y: 100 });
    const outside = makeElement({ y: 3000 });
    const { result, rerender } = renderHook(
      ({ element }: { element: Element | null }) =>
        useAutoScroll({ element, enabled: true, instant: false }),
      { initialProps: { element: inside as Element | null } }
    );
    expect(result.current).toBe(false);
    rerender({ element: outside });
    expect(result.current).toBe(true);
    act(() => void vi.advanceTimersByTime(0));
    expect(outside.scrollIntoView).toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(SCROLL_SETTLE_QUIET_MS));
    expect(result.current).toBe(false);
  });
});
