import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePageVisibility } from "./usePageVisibility";
import {
  getPageVisibility,
  getVisibilityState,
  isDocumentAvailable,
  isPageVisibilitySupported,
  SERVER_PAGE_VISIBILITY,
} from "./utils";

// ---------------------------------------------------------------------------
// Test helpers: override the read-only `document.visibilityState` getter and
// fire the `visibilitychange` event the way a browser would.
// ---------------------------------------------------------------------------

function setVisibilityState(state: "visible" | "hidden"): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
}

function fireVisibilityChange(state: "visible" | "hidden"): void {
  setVisibilityState(state);
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

afterEach(() => {
  // Restore the real `document` first (SSR tests stub it to `undefined`), then
  // reset the optimistic default so tests stay isolated.
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setVisibilityState("visible");
});

// ---------------------------------------------------------------------------
// Pure helpers (utils.ts)
// ---------------------------------------------------------------------------

describe("utils", () => {
  describe("isDocumentAvailable", () => {
    it("returns true in a jsdom environment", () => {
      expect(isDocumentAvailable()).toBe(true);
    });

    it("returns false when document is undefined (SSR)", () => {
      vi.stubGlobal("document", undefined);
      expect(isDocumentAvailable()).toBe(false);
    });
  });

  describe("isPageVisibilitySupported", () => {
    it("returns true when visibilityState is present", () => {
      expect(isPageVisibilitySupported()).toBe(true);
    });

    it("returns false under SSR", () => {
      vi.stubGlobal("document", undefined);
      expect(isPageVisibilitySupported()).toBe(false);
    });
  });

  describe("getVisibilityState", () => {
    it("returns 'visible' when the tab is visible", () => {
      setVisibilityState("visible");
      expect(getVisibilityState()).toBe("visible");
    });

    it("returns 'hidden' when the tab is hidden", () => {
      setVisibilityState("hidden");
      expect(getVisibilityState()).toBe("hidden");
    });

    it("collapses unknown/legacy states to 'visible'", () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "prerender",
      });
      expect(getVisibilityState()).toBe("visible");
    });

    it("returns 'visible' under SSR", () => {
      vi.stubGlobal("document", undefined);
      expect(getVisibilityState()).toBe("visible");
    });
  });

  describe("getPageVisibility", () => {
    it("returns true when visible", () => {
      setVisibilityState("visible");
      expect(getPageVisibility()).toBe(true);
    });

    it("returns false when hidden", () => {
      setVisibilityState("hidden");
      expect(getPageVisibility()).toBe(false);
    });

    it("returns the server default (true) under SSR", () => {
      vi.stubGlobal("document", undefined);
      expect(getPageVisibility()).toBe(SERVER_PAGE_VISIBILITY);
      expect(getPageVisibility()).toBe(true);
    });
  });

  it("SERVER_PAGE_VISIBILITY is true", () => {
    expect(SERVER_PAGE_VISIBILITY).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// usePageVisibility hook
// ---------------------------------------------------------------------------

describe("usePageVisibility", () => {
  it("returns true when the tab is initially visible", () => {
    setVisibilityState("visible");
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);
  });

  it("returns false when the tab is initially hidden", () => {
    setVisibilityState("hidden");
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(false);
  });

  it("updates when the tab becomes hidden then visible again", () => {
    setVisibilityState("visible");
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);

    fireVisibilityChange("hidden");
    expect(result.current).toBe(false);

    fireVisibilityChange("visible");
    expect(result.current).toBe(true);
  });

  it("returns a stable primitive across no-op events (no needless churn)", () => {
    setVisibilityState("visible");
    const { result, rerender } = renderHook(() => usePageVisibility());
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });

  describe("onChange callback", () => {
    it("does not fire on mount", () => {
      setVisibilityState("visible");
      const onChange = vi.fn();
      renderHook(() => usePageVisibility(onChange));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("fires with false when the page becomes hidden", () => {
      setVisibilityState("visible");
      const onChange = vi.fn();
      renderHook(() => usePageVisibility(onChange));

      fireVisibilityChange("hidden");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it("fires with true when the page becomes visible", () => {
      setVisibilityState("hidden");
      const onChange = vi.fn();
      renderHook(() => usePageVisibility(onChange));

      fireVisibilityChange("visible");
      expect(onChange).toHaveBeenLastCalledWith(true);
    });

    it("uses the latest callback without re-subscribing the listener", () => {
      setVisibilityState("visible");
      const addSpy = vi.spyOn(document, "addEventListener");

      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = renderHook(
        ({ cb }) => usePageVisibility(cb),
        { initialProps: { cb: first } }
      );

      const visibilityListeners = addSpy.mock.calls.filter(
        ([type]) => type === "visibilitychange"
      ).length;

      rerender({ cb: second });

      // Swapping the callback must not add another listener.
      const afterListeners = addSpy.mock.calls.filter(
        ([type]) => type === "visibilitychange"
      ).length;
      expect(afterListeners).toBe(visibilityListeners);

      fireVisibilityChange("hidden");
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenLastCalledWith(false);
    });
  });

  it("removes the visibilitychange listener on unmount", () => {
    setVisibilityState("visible");
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => usePageVisibility());

    unmount();

    expect(
      removeSpy.mock.calls.some(([type]) => type === "visibilitychange")
    ).toBe(true);
  });

  it("does not call onChange after unmount", () => {
    setVisibilityState("visible");
    const onChange = vi.fn();
    const { unmount } = renderHook(() => usePageVisibility(onChange));

    unmount();
    fireVisibilityChange("hidden");

    expect(onChange).not.toHaveBeenCalled();
  });
});
