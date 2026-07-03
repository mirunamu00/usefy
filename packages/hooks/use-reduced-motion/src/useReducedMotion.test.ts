import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./useReducedMotion";

type Listener = () => void;

function setupMatchMedia(reduceMatches = false) {
  const listeners = new Set<Listener>();
  let matches = reduceMatches;
  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        get matches() {
          return matches;
        },
        media: query,
        onchange: null,
        addEventListener: (_: string, cb: Listener) => listeners.add(cb),
        removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
        addListener: (cb: Listener) => listeners.add(cb),
        removeListener: (cb: Listener) => listeners.delete(cb),
        dispatchEvent: () => true,
      }) as unknown as MediaQueryList
  ) as unknown as typeof window.matchMedia;
  return {
    setReduce(next: boolean) {
      matches = next;
      act(() => listeners.forEach((cb) => cb()));
    },
    listenerCount: () => listeners.size,
  };
}

describe("useReducedMotion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns false when reduced motion is not requested", () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when the user prefers reduced motion", () => {
    setupMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when the setting changes", () => {
    const mm = setupMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    mm.setReduce(true);
    expect(result.current).toBe(true);
  });

  it("removes its listener on unmount", () => {
    const mm = setupMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());
    expect(mm.listenerCount()).toBe(1);
    unmount();
    expect(mm.listenerCount()).toBe(0);
  });

  it("returns defaultValue when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() =>
      useReducedMotion({ defaultValue: true })
    );
    expect(result.current).toBe(true);
  });

  it("uses addListener/removeListener when addEventListener is absent", () => {
    const listeners = new Set<Listener>();
    let matches = false;
    window.matchMedia = vi.fn(
      () =>
        ({
          get matches() {
            return matches;
          },
          addListener: (cb: Listener) => listeners.add(cb),
          removeListener: (cb: Listener) => listeners.delete(cb),
        }) as unknown as MediaQueryList
    ) as unknown as typeof window.matchMedia;

    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    matches = true;
    act(() => listeners.forEach((cb) => cb()));
    expect(result.current).toBe(true);
    unmount();
    expect(listeners.size).toBe(0);
  });
});
