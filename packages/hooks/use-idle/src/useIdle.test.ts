import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIdle } from "./useIdle";
import {
  DEFAULT_IDLE_EVENTS,
  ACTIVITY_THROTTLE_MS,
  isBrowser,
  isDocumentAvailable,
  resolveIdleTarget,
} from "./utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fire a DOM event on a target, wrapped in act so React flushes state. */
function fire(target: EventTarget, type: string): void {
  act(() => {
    target.dispatchEvent(new Event(type));
  });
}

/** Advance fake timers (and the mocked clock) inside act. */
function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Override the read-only `document.hidden` getter. */
function setHidden(hidden: boolean): void {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  setHidden(false);
});

afterEach(() => {
  // Switch back to real timers *after* React Testing Library's own afterEach has
  // unmounted the component (which clears the pending idle timer via the effect
  // cleanup). Any still-pending fake timer is discarded here rather than fired,
  // so no `setState` runs outside `act`.
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Pure helpers (utils.ts)
// ---------------------------------------------------------------------------

describe("utils", () => {
  describe("isBrowser", () => {
    it("returns true in jsdom", () => {
      expect(isBrowser()).toBe(true);
    });

    it("returns false when window is undefined (SSR)", () => {
      vi.stubGlobal("window", undefined);
      expect(isBrowser()).toBe(false);
    });
  });

  describe("isDocumentAvailable", () => {
    it("returns true in jsdom", () => {
      expect(isDocumentAvailable()).toBe(true);
    });

    it("returns false when document is undefined (SSR)", () => {
      vi.stubGlobal("document", undefined);
      expect(isDocumentAvailable()).toBe(false);
    });
  });

  describe("resolveIdleTarget", () => {
    it("defaults to window in the browser", () => {
      expect(resolveIdleTarget()).toBe(window);
    });

    it("returns the provided element", () => {
      const el = document.createElement("div");
      expect(resolveIdleTarget(el)).toBe(el);
    });

    it("returns undefined under SSR (no window, no element)", () => {
      vi.stubGlobal("window", undefined);
      expect(resolveIdleTarget()).toBeUndefined();
    });

    it("still returns the element under SSR when one is given", () => {
      const el = document.createElement("div");
      vi.stubGlobal("window", undefined);
      expect(resolveIdleTarget(el)).toBe(el);
    });
  });

  it("exposes the documented defaults", () => {
    expect(DEFAULT_IDLE_EVENTS).toEqual([
      "mousemove",
      "mousedown",
      "resize",
      "keydown",
      "touchstart",
      "wheel",
      "visibilitychange",
    ]);
    expect(ACTIVITY_THROTTLE_MS).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// useIdle hook
// ---------------------------------------------------------------------------

describe("useIdle", () => {
  it("starts active (false) by default", () => {
    const { result } = renderHook(() => useIdle(1000));
    expect(result.current).toBe(false);
  });

  it("respects initialState: true", () => {
    const { result } = renderHook(() =>
      useIdle(1000, { initialState: true })
    );
    expect(result.current).toBe(true);
  });

  it("becomes idle after the timeout elapses with no activity", () => {
    const { result } = renderHook(() => useIdle(1000));
    expect(result.current).toBe(false);

    advance(999);
    expect(result.current).toBe(false);

    advance(1);
    expect(result.current).toBe(true);
  });

  it("defaults the timeout to 60_000ms", () => {
    const { result } = renderHook(() => useIdle());
    advance(59_999);
    expect(result.current).toBe(false);
    advance(1);
    expect(result.current).toBe(true);
  });

  it("activity before the timeout resets the timer", () => {
    const { result } = renderHook(() => useIdle(1000));

    advance(600);
    fire(window, "keydown");
    // Timer restarted at t=600 → fires at t=1600.
    advance(600); // t=1200
    expect(result.current).toBe(false);

    advance(400); // t=1600
    expect(result.current).toBe(true);
  });

  it("wakes from an initial idle state on the first activity", () => {
    const { result } = renderHook(() =>
      useIdle(1000, { initialState: true })
    );
    expect(result.current).toBe(true);

    fire(window, "keydown");
    expect(result.current).toBe(false);

    // ...and can fall idle again once the timer elapses.
    advance(1000);
    expect(result.current).toBe(true);
  });

  it("flips back to active on activity after going idle", () => {
    const { result } = renderHook(() => useIdle(1000));

    advance(1000);
    expect(result.current).toBe(true);

    fire(window, "mousedown");
    expect(result.current).toBe(false);
  });

  it("handles a timeout smaller than the throttle window (clamped)", () => {
    // timeout (150) < ACTIVITY_THROTTLE_MS (200) → the throttle window is
    // clamped below the timeout so activity is never dropped for longer than it.
    const { result } = renderHook(() => useIdle(150));

    advance(150);
    expect(result.current).toBe(true);

    fire(window, "keydown");
    expect(result.current).toBe(false);
  });

  it("does not flicker idle under continuous activity with a sub-throttle timeout", () => {
    // timeout (200) <= ACTIVITY_THROTTLE_MS (200): the throttle must stay
    // *below* the timeout, otherwise the earliest allowed reset lands exactly
    // when the pending idle timer fires and a dropped event lets `idle` flip
    // true mid-activity. The user moves the mouse throughout the window.
    const { result } = renderHook(() => useIdle(200));

    advance(100); // t=100
    fire(window, "mousemove"); // passes → lastActivity=100, timer -> t=300
    advance(150); // t=250
    fire(window, "mousemove"); // 150 >= throttle(100) → reset, timer -> t=450
    advance(40); // t=290
    fire(window, "mousemove"); // throttled, but the timer already moved to t=450
    advance(10); // t=300 — the *original* t=300 timer must NOT fire

    expect(result.current).toBe(false);
  });

  it("does not churn when activity fires while already active", () => {
    const { result } = renderHook(() => useIdle(1000));
    const before = result.current;
    fire(window, "mousemove");
    expect(result.current).toBe(before);
    expect(result.current).toBe(false);
  });

  it("throttles high-frequency activity to a leading-edge reset", () => {
    const { result } = renderHook(() => useIdle(1000));

    advance(500); // t=500
    fire(window, "mousemove"); // reset → timer fires at t=1500, lastActivity=500

    advance(100); // t=600
    fire(window, "mousemove"); // within 200ms window → throttled, no reset

    // If the throttled event had reset the timer, we would NOT be idle at t=1500.
    advance(900); // t=1500
    expect(result.current).toBe(true);
  });

  it("resets again once the throttle window has passed", () => {
    const { result } = renderHook(() => useIdle(1000));

    advance(500); // t=500
    fire(window, "mousemove"); // reset, lastActivity=500 → fires at 1500

    advance(300); // t=800 (>200ms since last)
    fire(window, "mousemove"); // reset, lastActivity=800 → fires at 1800

    advance(900); // t=1700
    expect(result.current).toBe(false);

    advance(100); // t=1800
    expect(result.current).toBe(true);
  });

  describe("events option", () => {
    it("only listens to the provided events", () => {
      const { result } = renderHook(() => useIdle(1000, { events: ["keydown"] }));

      advance(1000);
      expect(result.current).toBe(true);

      // mousemove is not listened → does not wake the user.
      fire(window, "mousemove");
      expect(result.current).toBe(true);

      // keydown is listened → wakes the user.
      fire(window, "keydown");
      expect(result.current).toBe(false);
    });

    it("does not re-subscribe when a fresh array of the same events is passed", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const { rerender } = renderHook(
        ({ events }) => useIdle(1000, { events }),
        { initialProps: { events: ["mousemove", "keydown"] } }
      );
      const initial = addSpy.mock.calls.length;

      rerender({ events: ["mousemove", "keydown"] }); // new array, same contents
      expect(addSpy.mock.calls.length).toBe(initial);
    });
  });

  describe("element option", () => {
    it("attaches activity listeners to the provided element", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const { result } = renderHook(() =>
        useIdle(1000, { events: ["mousemove"], element: el })
      );

      advance(1000);
      expect(result.current).toBe(true);

      // Event on the window is ignored; event on the element wakes the user.
      fire(window, "mousemove");
      expect(result.current).toBe(true);

      fire(el, "mousemove");
      expect(result.current).toBe(false);

      document.body.removeChild(el);
    });
  });

  describe("visibilitychange", () => {
    it("counts returning to a visible tab as activity", () => {
      const { result } = renderHook(() => useIdle(1000));

      advance(1000);
      expect(result.current).toBe(true);

      setHidden(false);
      fire(document, "visibilitychange");
      expect(result.current).toBe(false);
    });

    it("does not treat backgrounding as activity (user can fall idle)", () => {
      const { result } = renderHook(() => useIdle(1000));

      advance(500); // t=500
      setHidden(true);
      fire(document, "visibilitychange"); // hidden → NOT activity, no reset

      advance(500); // t=1000 → original timer fires
      expect(result.current).toBe(true);
    });
  });

  describe("timeout changes", () => {
    it("restarts the timer when the timeout prop changes", () => {
      const { result, rerender } = renderHook(({ ms }) => useIdle(ms), {
        initialProps: { ms: 1000 },
      });

      advance(800); // t=800 under the 1000ms timer
      expect(result.current).toBe(false);

      rerender({ ms: 2000 }); // effect re-runs → fresh 2000ms timer

      advance(1500); // 1500ms into the new timer, not yet idle
      expect(result.current).toBe(false);

      advance(500); // 2000ms into the new timer
      expect(result.current).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("removes all listeners on unmount", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      const docRemoveSpy = vi.spyOn(document, "removeEventListener");
      const { unmount } = renderHook(() => useIdle(1000));

      unmount();

      expect(
        removeSpy.mock.calls.some(([type]) => type === "mousemove")
      ).toBe(true);
      expect(
        docRemoveSpy.mock.calls.some(([type]) => type === "visibilitychange")
      ).toBe(true);
    });

    it("does not fire the idle timer after unmount", () => {
      const { result, unmount } = renderHook(() => useIdle(1000));
      unmount();

      // No state update / act warning should occur; value is frozen.
      advance(2000);
      expect(result.current).toBe(false);
    });
  });
});
