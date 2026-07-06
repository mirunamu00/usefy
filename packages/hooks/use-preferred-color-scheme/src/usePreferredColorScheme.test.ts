import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePreferredColorScheme } from "./usePreferredColorScheme";

type Listener = () => void;

function setupMatchMedia(darkMatches = false) {
  const listeners = new Set<Listener>();
  let matches = darkMatches;
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
    setDark(next: boolean) {
      matches = next;
      act(() => listeners.forEach((cb) => cb()));
    },
    listenerCount: () => listeners.size,
  };
}

describe("usePreferredColorScheme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns 'light' when the system prefers light", () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => usePreferredColorScheme());
    expect(result.current).toBe("light");
  });

  it("returns 'dark' when the system prefers dark", () => {
    setupMatchMedia(true);
    const { result } = renderHook(() => usePreferredColorScheme());
    expect(result.current).toBe("dark");
  });

  it("updates when the system preference changes", () => {
    const mm = setupMatchMedia(false);
    const { result } = renderHook(() => usePreferredColorScheme());
    expect(result.current).toBe("light");
    mm.setDark(true);
    expect(result.current).toBe("dark");
    mm.setDark(false);
    expect(result.current).toBe("light");
  });

  it("removes its listener on unmount", () => {
    const mm = setupMatchMedia(false);
    const { unmount } = renderHook(() => usePreferredColorScheme());
    expect(mm.listenerCount()).toBe(1);
    unmount();
    expect(mm.listenerCount()).toBe(0);
  });

  it("returns the default scheme when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() =>
      usePreferredColorScheme({ defaultScheme: "dark" })
    );
    expect(result.current).toBe("dark");
  });

  it("defaults to 'light' when matchMedia is unavailable and no default is given", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() => usePreferredColorScheme());
    expect(result.current).toBe("light");
  });

  it("defers the real read to a post-commit effect when initializeWithValue is false", () => {
    const renders: string[] = [];
    setupMatchMedia(true); // system prefers dark
    renderHook(() => {
      const value = usePreferredColorScheme({ initializeWithValue: false });
      renders.push(value);
      return value;
    });
    // First client render uses the default ("light") to match SSR, the effect
    // then flips it to the real value ("dark").
    expect(renders[0]).toBe("light");
    expect(renders[renders.length - 1]).toBe("dark");
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

    const { result, unmount } = renderHook(() => usePreferredColorScheme());
    expect(result.current).toBe("light");
    matches = true;
    act(() => listeners.forEach((cb) => cb()));
    expect(result.current).toBe("dark");
    unmount();
    expect(listeners.size).toBe(0);
  });
});
