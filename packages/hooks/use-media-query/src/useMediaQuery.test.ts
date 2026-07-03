import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";
import { getMatches, isMatchMediaSupported } from "./utils";

type Listener = () => void;

function setupMatchMedia() {
  const store = new Map<string, { matches: boolean; listeners: Set<Listener> }>();
  const entry = (q: string) => {
    if (!store.has(q)) store.set(q, { matches: false, listeners: new Set() });
    return store.get(q)!;
  };

  window.matchMedia = vi.fn((query: string) => {
    const e = entry(query);
    return {
      get matches() {
        return e.matches;
      },
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: Listener) => e.listeners.add(cb),
      removeEventListener: (_: string, cb: Listener) => e.listeners.delete(cb),
      addListener: (cb: Listener) => e.listeners.add(cb),
      removeListener: (cb: Listener) => e.listeners.delete(cb),
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  }) as unknown as typeof window.matchMedia;

  return {
    set(query: string, matches: boolean) {
      const e = entry(query);
      e.matches = matches;
      act(() => {
        e.listeners.forEach((cb) => cb());
      });
    },
    listenerCount(query: string) {
      return entry(query).listeners.size;
    },
  };
}

describe("useMediaQuery", () => {
  let mm: ReturnType<typeof setupMatchMedia>;

  beforeEach(() => {
    mm = setupMatchMedia();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns the initial match state", () => {
    mm.set("(min-width: 768px)", true);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("returns false when the query does not match", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("updates when the media query changes", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
    mm.set("(min-width: 768px)", true);
    expect(result.current).toBe(true);
    mm.set("(min-width: 768px)", false);
    expect(result.current).toBe(false);
  });

  it("re-subscribes when the query string changes", () => {
    const { result, rerender } = renderHook(({ q }) => useMediaQuery(q), {
      initialProps: { q: "(min-width: 768px)" },
    });
    mm.set("(min-width: 1200px)", true);
    rerender({ q: "(min-width: 1200px)" });
    expect(result.current).toBe(true);
  });

  it("removes its listener on unmount", () => {
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(mm.listenerCount("(min-width: 768px)")).toBe(1);
    unmount();
    expect(mm.listenerCount("(min-width: 768px)")).toBe(0);
  });

  describe("SSR / unsupported", () => {
    it("returns defaultValue when matchMedia is unavailable", () => {
      vi.stubGlobal("matchMedia", undefined);
      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 768px)", { defaultValue: true })
      );
      expect(result.current).toBe(true);
    });

    it("uses defaultValue on first render when initializeWithValue is false", () => {
      // matchMedia says true, but eager init is disabled -> keep defaultValue,
      // then the effect syncs to the real value.
      mm.set("(min-width: 768px)", true);
      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 768px)", {
          defaultValue: false,
          initializeWithValue: false,
        })
      );
      // After effects flush, it reflects the real match.
      expect(result.current).toBe(true);
    });
  });

  describe("legacy addListener fallback", () => {
    it("uses addListener/removeListener when addEventListener is absent", () => {
      const listeners = new Set<Listener>();
      let matches = false;
      window.matchMedia = vi.fn(
        () =>
          ({
            get matches() {
              return matches;
            },
            media: "",
            onchange: null,
            addListener: (cb: Listener) => listeners.add(cb),
            removeListener: (cb: Listener) => listeners.delete(cb),
          }) as unknown as MediaQueryList
      ) as unknown as typeof window.matchMedia;

      const { result, unmount } = renderHook(() => useMediaQuery("(x)"));
      expect(listeners.size).toBe(1);
      matches = true;
      act(() => listeners.forEach((cb) => cb()));
      expect(result.current).toBe(true);
      unmount();
      expect(listeners.size).toBe(0);
    });
  });
});

describe("utils", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("isMatchMediaSupported is true when matchMedia exists", () => {
    window.matchMedia = vi.fn() as unknown as typeof window.matchMedia;
    expect(isMatchMediaSupported()).toBe(true);
  });

  it("isMatchMediaSupported is false without matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(isMatchMediaSupported()).toBe(false);
  });

  it("getMatches returns defaultValue when unsupported", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(getMatches("(min-width: 1px)", true)).toBe(true);
  });

  it("getMatches reads matchMedia when supported", () => {
    window.matchMedia = vi.fn(
      () => ({ matches: true }) as MediaQueryList
    ) as unknown as typeof window.matchMedia;
    expect(getMatches("(min-width: 1px)", false)).toBe(true);
  });
});
