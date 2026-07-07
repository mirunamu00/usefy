import { renderHook, act } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInterval } from "./useInterval";

describe("useInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("basic behavior", () => {
    it("invokes the callback repeatedly at the given delay", () => {
      const cb = vi.fn();
      renderHook(() => useInterval(cb, 1000));
      expect(cb).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1000));
      expect(cb).toHaveBeenCalledTimes(1);
      act(() => vi.advanceTimersByTime(3000));
      expect(cb).toHaveBeenCalledTimes(4);
    });

    it("clears the interval on unmount", () => {
      const cb = vi.fn();
      const { unmount } = renderHook(() => useInterval(cb, 1000));
      act(() => vi.advanceTimersByTime(1000));
      expect(cb).toHaveBeenCalledTimes(1);
      unmount();
      act(() => vi.advanceTimersByTime(5000));
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("does not start when delay is null or undefined", () => {
      const cb = vi.fn();
      const { rerender } = renderHook(({ d }) => useInterval(cb, d), {
        initialProps: { d: null as number | null },
      });
      act(() => vi.advanceTimersByTime(5000));
      expect(cb).not.toHaveBeenCalled();
      // enabling by switching to a real delay starts ticking
      rerender({ d: 1000 });
      act(() => vi.advanceTimersByTime(1000));
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("restarts with the new delay when the delay changes", () => {
      const cb = vi.fn();
      const { rerender } = renderHook(({ d }) => useInterval(cb, d), {
        initialProps: { d: 1000 },
      });
      act(() => vi.advanceTimersByTime(500));
      rerender({ d: 200 });
      // old 1000ms timer is cleared; new 200ms timer applies
      act(() => vi.advanceTimersByTime(200));
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("clamps a negative delay to 0", () => {
      // Assert the clamp via the setInterval call rather than advancing a 0ms
      // fake interval (which would reschedule at +0 forever and OOM the worker;
      // in a real browser a 0ms interval is clamped to ~4ms, so this is safe).
      const spy = vi.spyOn(globalThis, "setInterval");
      renderHook(() => useInterval(vi.fn(), -100));
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 0);
      spy.mockRestore();
    });
  });

  describe("controls", () => {
    it("start() begins ticking when autoStart is false", () => {
      const cb = vi.fn();
      const { result } = renderHook(() =>
        useInterval(cb, 1000, { autoStart: false })
      );
      expect(result.current.isRunning).toBe(false);
      act(() => vi.advanceTimersByTime(2000));
      expect(cb).not.toHaveBeenCalled();
      act(() => result.current.start());
      expect(result.current.isRunning).toBe(true);
      act(() => vi.advanceTimersByTime(1000));
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("stop() halts ticking", () => {
      const cb = vi.fn();
      const { result } = renderHook(() => useInterval(cb, 1000));
      act(() => vi.advanceTimersByTime(1000));
      expect(cb).toHaveBeenCalledTimes(1);
      act(() => result.current.stop());
      expect(result.current.isRunning).toBe(false);
      act(() => vi.advanceTimersByTime(5000));
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("toggle() alternates running state", () => {
      const cb = vi.fn();
      const { result } = renderHook(() => useInterval(cb, 1000));
      expect(result.current.isRunning).toBe(true);
      act(() => result.current.toggle());
      expect(result.current.isRunning).toBe(false);
      act(() => result.current.toggle());
      expect(result.current.isRunning).toBe(true);
    });

    it("start() is idempotent — no duplicate intervals", () => {
      const cb = vi.fn();
      const { result } = renderHook(() =>
        useInterval(cb, 1000, { autoStart: false })
      );
      act(() => {
        result.current.start();
        result.current.start();
        result.current.start();
      });
      act(() => vi.advanceTimersByTime(1000));
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("stop() is idempotent when already stopped", () => {
      const cb = vi.fn();
      const { result } = renderHook(() =>
        useInterval(cb, 1000, { autoStart: false })
      );
      act(() => {
        result.current.stop();
        result.current.stop();
      });
      expect(result.current.isRunning).toBe(false);
    });

    it("keeps start/stop/toggle referentially stable across renders", () => {
      const { result, rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
        initialProps: { cb: vi.fn() },
      });
      const first = result.current;
      rerender({ cb: vi.fn() });
      expect(result.current.start).toBe(first.start);
      expect(result.current.stop).toBe(first.stop);
      expect(result.current.toggle).toBe(first.toggle);
    });
  });

  describe("isRunning", () => {
    it("is false when the delay is null even if started", () => {
      const { result } = renderHook(() => useInterval(vi.fn(), null));
      expect(result.current.isRunning).toBe(false);
    });

    it("reflects autoStart:false as not running initially", () => {
      const { result } = renderHook(() =>
        useInterval(vi.fn(), 1000, { autoStart: false })
      );
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe("latest callback", () => {
    it("invokes the latest callback without restarting the interval", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
        initialProps: { cb: first },
      });
      act(() => vi.advanceTimersByTime(1000));
      expect(first).toHaveBeenCalledTimes(1);
      rerender({ cb: second });
      act(() => vi.advanceTimersByTime(1000));
      // the interval was NOT restarted; the new callback simply took over
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe("immediate option", () => {
    it("fires the callback once immediately on auto-start, then at intervals", () => {
      const cb = vi.fn();
      renderHook(() => useInterval(cb, 1000, { immediate: true }));
      expect(cb).toHaveBeenCalledTimes(1);
      act(() => vi.advanceTimersByTime(1000));
      expect(cb).toHaveBeenCalledTimes(2);
    });

    it("fires immediately when start() is called with immediate:true", () => {
      const cb = vi.fn();
      const { result } = renderHook(() =>
        useInterval(cb, 1000, { immediate: true, autoStart: false })
      );
      expect(cb).not.toHaveBeenCalled();
      act(() => result.current.start());
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe("StrictMode", () => {
    it("does not run duplicate intervals under StrictMode", () => {
      const cb = vi.fn();
      renderHook(() => useInterval(cb, 1000), { wrapper: StrictMode });
      act(() => vi.advanceTimersByTime(1000));
      // a leaked second interval would call the callback twice per tick
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("fires the immediate auto-start callback exactly once under StrictMode", () => {
      const cb = vi.fn();
      renderHook(() => useInterval(cb, 1000, { immediate: true }), {
        wrapper: StrictMode,
      });
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });
});
