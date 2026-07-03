import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDarkMode } from "./useDarkMode";
import { resolveIsDark } from "./utils";

type Listener = () => void;

function setupMatchMedia(systemDark = false) {
  const listeners = new Set<Listener>();
  let matches = systemDark;
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
    setSystemDark(next: boolean) {
      matches = next;
      act(() => listeners.forEach((cb) => cb()));
    },
  };
}

describe("useDarkMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("defaults to system mode and follows the system preference", () => {
    setupMatchMedia(true);
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.mode).toBe("system");
    expect(result.current.isDark).toBe(true);
  });

  it("respects an explicit defaultMode", () => {
    setupMatchMedia(true);
    const { result } = renderHook(() => useDarkMode({ defaultMode: "light" }));
    expect(result.current.mode).toBe("light");
    expect(result.current.isDark).toBe(false);
  });

  it("setMode persists and updates isDark", () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.setMode("dark"));
    expect(result.current.mode).toBe("dark");
    expect(result.current.isDark).toBe(true);
    expect(window.localStorage.getItem("usefy-dark-mode")).toBe("dark");
  });

  it("enable / disable set dark / light", () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.enable());
    expect(result.current.isDark).toBe(true);
    act(() => result.current.disable());
    expect(result.current.isDark).toBe(false);
  });

  it("toggle flips based on the current theme", () => {
    setupMatchMedia(false); // system = light
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.mode).toBe("dark");
    expect(result.current.isDark).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.mode).toBe("light");
    expect(result.current.isDark).toBe(false);
  });

  it("reads the persisted mode on init", () => {
    window.localStorage.setItem("usefy-dark-mode", "dark");
    setupMatchMedia(false);
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.mode).toBe("dark");
    expect(result.current.isDark).toBe(true);
  });

  it("follows live system changes while in system mode", () => {
    const mm = setupMatchMedia(false);
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(false);
    mm.setSystemDark(true);
    expect(result.current.isDark).toBe(true);
  });

  it("ignores system changes when an explicit mode is set", () => {
    const mm = setupMatchMedia(false);
    const { result } = renderHook(() => useDarkMode({ defaultMode: "light" }));
    mm.setSystemDark(true);
    expect(result.current.isDark).toBe(false);
  });

  describe("DOM application", () => {
    it("toggles the dark class on <html> by default", () => {
      setupMatchMedia(false);
      const { result } = renderHook(() => useDarkMode());
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      act(() => result.current.enable());
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      act(() => result.current.disable());
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("supports a custom class", () => {
      setupMatchMedia(false);
      const { result } = renderHook(() => useDarkMode({ darkClass: "theme-dark" }));
      act(() => result.current.enable());
      expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    });

    it("writes an attribute when configured", () => {
      setupMatchMedia(false);
      const { result } = renderHook(() =>
        useDarkMode({ attribute: "data-theme" })
      );
      act(() => result.current.enable());
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
      act(() => result.current.disable());
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    });
  });

  it("syncs mode across tabs via the storage event", () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => useDarkMode());
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "usefy-dark-mode",
          newValue: "dark",
        })
      );
    });
    expect(result.current.mode).toBe("dark");
    expect(result.current.isDark).toBe(true);
  });

  it("does not crash when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(false);
    act(() => result.current.enable());
    expect(result.current.isDark).toBe(true);
  });

  describe("resolveIsDark util", () => {
    it("system follows systemDark", () => {
      expect(resolveIsDark("system", true)).toBe(true);
      expect(resolveIsDark("system", false)).toBe(false);
    });
    it("explicit modes ignore systemDark", () => {
      expect(resolveIsDark("dark", false)).toBe(true);
      expect(resolveIsDark("light", true)).toBe(false);
    });
  });
});
