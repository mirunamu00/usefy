import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInfiniteScroll } from "./useInfiniteScroll";
import type { UseInfiniteScrollOptions } from "./types";
import {
  simulateIntersection,
  getLatestObserver,
  mockObserverInstances,
} from "../vitest.setup";

type LoadMore = () => void | Promise<void>;

interface HookProps {
  loadMore: LoadMore;
  options?: UseInfiniteScrollOptions;
}

/**
 * Render the hook, attach its returned ref to a fresh sentinel node (which
 * causes the underlying observer to be created), and return handles for driving
 * intersections and re-rendering with new props.
 */
function setup(loadMore: LoadMore, options?: UseInfiniteScrollOptions) {
  const node = document.createElement("div");
  const view = renderHook(
    ({ loadMore: lm, options: opts }: HookProps) =>
      useInfiniteScroll(lm, opts),
    { initialProps: { loadMore, options } }
  );

  // Attaching the ref triggers a re-render + effect that creates the observer.
  act(() => {
    view.result.current(node);
  });

  return { node, ...view };
}

describe("useInfiniteScroll", () => {
  it("returns a callback ref (a function)", () => {
    const { result } = renderHook(() => useInfiniteScroll(vi.fn()));
    expect(typeof result.current).toBe("function");
  });

  it("observes the sentinel once attached", () => {
    setup(vi.fn());
    expect(mockObserverInstances).toHaveLength(1);
    expect(getLatestObserver()?.observedElements.size).toBe(1);
  });

  it("fires loadMore when the sentinel enters view (defaults)", () => {
    const loadMore = vi.fn();
    const { node } = setup(loadMore);

    act(() => {
      simulateIntersection(node, true);
    });

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("does not fire when the sentinel leaves view (inView=false)", () => {
    const loadMore = vi.fn();
    const { node } = setup(loadMore);

    act(() => {
      simulateIntersection(node, false);
    });

    expect(loadMore).not.toHaveBeenCalled();
  });

  it("does not fire while loading is true", () => {
    const loadMore = vi.fn();
    const { node } = setup(loadMore, { loading: true });

    act(() => {
      simulateIntersection(node, true);
    });

    expect(loadMore).not.toHaveBeenCalled();
  });

  it("does not observe (or fire) when hasMore is false", () => {
    const loadMore = vi.fn();
    setup(loadMore, { hasMore: false });

    // The observer is never created when there is nothing more to load.
    expect(mockObserverInstances).toHaveLength(0);
    expect(loadMore).not.toHaveBeenCalled();
  });

  it("does not observe (or fire) when enabled is false", () => {
    const loadMore = vi.fn();
    setup(loadMore, { enabled: false });

    expect(mockObserverInstances).toHaveLength(0);
    expect(loadMore).not.toHaveBeenCalled();
  });

  it("passes root, rootMargin and threshold through to the observer", () => {
    const root = document.createElement("div");
    setup(vi.fn(), { root, rootMargin: "200px", threshold: [0, 0.5] });

    const observer = getLatestObserver();
    expect(observer?.root).toBe(root);
    expect(observer?.rootMargin).toBe("200px");
    expect(observer?.thresholds).toEqual([0, 0.5]);
  });

  it("fires again for a subsequent intersection (sync loadMore is not permanently locked)", () => {
    const loadMore = vi.fn();
    const { node } = setup(loadMore);

    act(() => {
      simulateIntersection(node, true);
    });
    act(() => {
      simulateIntersection(node, false);
    });
    act(() => {
      simulateIntersection(node, true);
    });

    expect(loadMore).toHaveBeenCalledTimes(2);
  });

  it("fires once per entry even when a multi-threshold observer emits several inView callbacks", () => {
    const loadMore = vi.fn();
    const { node } = setup(loadMore, { threshold: [0, 0.5, 1] });

    // A multi-threshold observer reports `isIntersecting === true` at each
    // threshold crossing as the sentinel scrolls in. With a purely synchronous
    // loadMore (no `loading` flag), only the first should fire.
    act(() => {
      simulateIntersection(node, true);
      simulateIntersection(node, true);
      simulateIntersection(node, true);
    });

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("does not re-fire while an async load is in flight, then fires again after it settles", async () => {
    let resolve!: () => void;
    const loadMore = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        })
    );
    const { node } = setup(loadMore);

    // First intersection starts the async load.
    act(() => {
      simulateIntersection(node, true);
    });
    expect(loadMore).toHaveBeenCalledTimes(1);

    // The sentinel briefly leaves and re-enters while the promise is still
    // pending — the in-flight guard must ignore this fresh transition.
    act(() => {
      simulateIntersection(node, false);
      simulateIntersection(node, true);
    });
    expect(loadMore).toHaveBeenCalledTimes(1);

    // Once the promise settles, the in-flight guard releases.
    await act(async () => {
      resolve();
    });

    // A new entry (leave + re-enter) now fires again.
    act(() => {
      simulateIntersection(node, false);
      simulateIntersection(node, true);
    });
    expect(loadMore).toHaveBeenCalledTimes(2);
  });

  it("releases the in-flight guard even when the async load rejects", async () => {
    let reject!: (reason?: unknown) => void;
    const loadMore = vi.fn(
      () =>
        new Promise<void>((_res, rej) => {
          reject = rej;
        })
    );
    const { node } = setup(loadMore);

    act(() => {
      simulateIntersection(node, true);
    });

    await act(async () => {
      reject(new Error("network"));
    });

    // Guard released by the rejection: a new entry fires again.
    act(() => {
      simulateIntersection(node, false);
      simulateIntersection(node, true);
    });
    expect(loadMore).toHaveBeenCalledTimes(2);
  });

  it("rethrows a synchronous throw but releases the guard for a later retry", () => {
    const throwing = vi.fn(() => {
      throw new Error("boom");
    });
    const { node, rerender } = setup(throwing);

    expect(() =>
      act(() => {
        simulateIntersection(node, true);
      })
    ).toThrow("boom");
    expect(throwing).toHaveBeenCalledTimes(1);

    // Guard released: swapping in a good callback and re-intersecting fires it.
    const good = vi.fn();
    rerender({ loadMore: good, options: undefined });
    act(() => {
      simulateIntersection(node, true);
    });
    expect(good).toHaveBeenCalledTimes(1);
  });

  it("uses the latest loadMore without re-subscribing the observer", () => {
    const first = vi.fn();
    const { node, rerender } = setup(first);
    const observerCountAfterMount = mockObserverInstances.length;

    const second = vi.fn();
    rerender({ loadMore: second, options: undefined });

    // No new observer instance was created for the callback swap.
    expect(mockObserverInstances.length).toBe(observerCountAfterMount);

    act(() => {
      simulateIntersection(node, true);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("does not re-subscribe the observer when only loading toggles", () => {
    const loadMore = vi.fn();
    const { rerender } = setup(loadMore, { loading: false });
    expect(mockObserverInstances).toHaveLength(1);

    rerender({ loadMore, options: { loading: true } });
    expect(mockObserverInstances).toHaveLength(1);
  });

  it("keeps a stable ref identity across re-renders", () => {
    const { result, rerender } = setup(vi.fn());
    const refBefore = result.current;

    rerender({ loadMore: vi.fn(), options: { loading: true } });
    expect(result.current).toBe(refBefore);
  });

  it("stops firing once hasMore flips to false", () => {
    const loadMore = vi.fn();
    const { node, rerender } = setup(loadMore, { hasMore: true });

    act(() => {
      simulateIntersection(node, true);
    });
    expect(loadMore).toHaveBeenCalledTimes(1);

    rerender({ loadMore, options: { hasMore: false } });

    // The observer is disconnected; even a manual intersection must not fire.
    expect(getLatestObserver()?.observedElements.size).toBe(0);
    act(() => {
      simulateIntersection(node, true, { observerIndex: 0 });
    });
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = setup(vi.fn());
    const observer = getLatestObserver();
    expect(observer?.observedElements.size).toBe(1);

    unmount();
    expect(observer?.observedElements.size).toBe(0);
  });

  it("is inert (no observer, no fire, no throw) when IntersectionObserver is unsupported", () => {
    const original = (window as { IntersectionObserver?: unknown })
      .IntersectionObserver;
    // Remove the API entirely so the support check returns false (SSR / old env).
    delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;

    try {
      const loadMore = vi.fn();
      const node = document.createElement("div");
      const { result } = renderHook(() => useInfiniteScroll(loadMore));

      expect(typeof result.current).toBe("function");
      // Attaching the inert ref must not throw or create an observer.
      act(() => {
        result.current(node);
      });
      expect(mockObserverInstances).toHaveLength(0);
      expect(loadMore).not.toHaveBeenCalled();
    } finally {
      (window as { IntersectionObserver?: unknown }).IntersectionObserver =
        original;
    }
  });
});
