import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode, createElement } from "react";
import { renderHook, act } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { usePolling } from "./usePolling";
import { computePollingDelay, DEFAULT_POLLING_INTERVAL } from "./utils";

/** A promise you can resolve/reject from the outside, for ordering control. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Run all pending timers/microtasks (used to settle an immediate poll). */
async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

/** Advance fake time by `ms`, flushing microtasks in between. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("computePollingDelay", () => {
  it("returns the base interval for the first poll / after a success", () => {
    expect(computePollingDelay(0, 1000, true)).toBe(1000);
    expect(computePollingDelay(0, 1000, { factor: 3 })).toBe(1000);
  });

  it("returns the base interval when backoff is disabled, regardless of failures", () => {
    expect(computePollingDelay(5, 1000, false)).toBe(1000);
    expect(computePollingDelay(5, 1000, undefined)).toBe(1000);
  });

  it("grows exponentially with factor 2 when backoff is true", () => {
    expect(computePollingDelay(1, 100, true)).toBe(200);
    expect(computePollingDelay(2, 100, true)).toBe(400);
    expect(computePollingDelay(3, 100, true)).toBe(800);
  });

  it("uses a custom factor (default 2) and clamps to maxInterval", () => {
    expect(computePollingDelay(1, 100, { factor: 3 })).toBe(300);
    expect(computePollingDelay(2, 100, { factor: 3 })).toBe(900);
    expect(computePollingDelay(3, 100, { factor: 3, maxInterval: 1000 })).toBe(
      1000,
    );
    // factor omitted -> default 2
    expect(computePollingDelay(2, 100, { maxInterval: 10_000 })).toBe(400);
  });

  it("delegates to a custom backoff function", () => {
    const linear = (failures: number, base: number) => base * failures;
    expect(computePollingDelay(3, 100, linear)).toBe(300);
  });

  it("falls back to the base interval for a non-finite / negative custom result", () => {
    expect(computePollingDelay(1, 100, () => Infinity)).toBe(100);
    expect(computePollingDelay(1, 100, () => -5)).toBe(100);
    expect(computePollingDelay(1, 100, () => NaN)).toBe(100);
  });

  it("exposes the default interval constant", () => {
    expect(DEFAULT_POLLING_INTERVAL).toBe(1000);
  });
});

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("starts idle with no data or error when enabled is false", () => {
      const fn = vi.fn(async () => "v");
      const { result } = renderHook(() =>
        usePolling(fn, { interval: 100, enabled: false }),
      );
      expect(result.current.status).toBe("idle");
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isPolling).toBe(false);
      expect(fn).not.toHaveBeenCalled();
    });

    it("seeds data from initialData but keeps status idle", () => {
      const { result } = renderHook(() =>
        usePolling(async () => 2, {
          interval: 100,
          enabled: false,
          initialData: 1,
        }),
      );
      expect(result.current.data).toBe(1);
      expect(result.current.status).toBe("idle");
    });

    it("exposes all controls as functions", () => {
      const { result } = renderHook(() =>
        usePolling(async () => "v", { enabled: false }),
      );
      expect(typeof result.current.pause).toBe("function");
      expect(typeof result.current.resume).toBe("function");
      expect(typeof result.current.start).toBe("function");
      expect(typeof result.current.stop).toBe("function");
    });
  });

  describe("polling loop", () => {
    it("polls immediately on mount, then every interval", async () => {
      const fn = vi.fn(async () => "v");
      const { result } = renderHook(() => usePolling(fn, { interval: 1000 }));

      // immediate -> the first poll fires synchronously on mount.
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe("pending");
      expect(result.current.isPolling).toBe(true);

      await flush();
      expect(result.current.status).toBe("success");
      expect(result.current.data).toBe("v");

      await advance(1000);
      expect(fn).toHaveBeenCalledTimes(2);

      await advance(1000);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("defaults to a 1000ms interval when interval is omitted", async () => {
      const fn = vi.fn(async () => "v");
      renderHook(() => usePolling(fn)); // no interval -> DEFAULT_POLLING_INTERVAL
      await flush();
      expect(fn).toHaveBeenCalledTimes(1);
      await advance(999);
      expect(fn).toHaveBeenCalledTimes(1);
      await advance(1);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("uses the default interval for the deferred first poll (immediate: false, no interval)", async () => {
      const fn = vi.fn(async () => "v");
      renderHook(() => usePolling(fn, { immediate: false }));
      expect(fn).not.toHaveBeenCalled();
      await advance(999);
      expect(fn).not.toHaveBeenCalled();
      await advance(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("waits one interval before the first poll when immediate is false", async () => {
      const fn = vi.fn(async () => "v");
      renderHook(() => usePolling(fn, { interval: 100, immediate: false }));

      expect(fn).not.toHaveBeenCalled();
      await advance(99);
      expect(fn).not.toHaveBeenCalled();
      await advance(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("does NOT stack polls when fn is slower than the interval (self-scheduling)", async () => {
      let inFlight = 0;
      let maxInFlight = 0;
      const gates: Array<() => void> = [];
      const fn = vi.fn(() => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        return new Promise<string>((resolve) => {
          gates.push(() => {
            inFlight--;
            resolve("v");
          });
        });
      });

      renderHook(() => usePolling(fn, { interval: 100 }));

      // One poll is in flight; advancing well past several intervals must not
      // start another (a naive setInterval would have stacked ~10 calls).
      expect(fn).toHaveBeenCalledTimes(1);
      await advance(1000);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(maxInFlight).toBe(1);

      // Settle the in-flight poll -> the next tick is scheduled.
      await act(async () => {
        gates[0]();
        await vi.advanceTimersByTimeAsync(0);
      });
      await advance(100);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(maxInFlight).toBe(1);
    });

    it("forwards args to fn after the signal", async () => {
      const fn = vi.fn(async (_s: AbortSignal, a: number, b: string) => `${a}${b}`);
      renderHook(() => usePolling(fn, { interval: 100, args: [1, "x"] }));
      await flush();
      expect(fn).toHaveBeenCalledWith(expect.any(AbortSignal), 1, "x");
    });

    it("retains the last successful data when a later poll errors", async () => {
      let n = 0;
      const fn = vi.fn(async () => {
        n++;
        if (n === 2) throw new Error("boom");
        return n;
      });
      const { result } = renderHook(() => usePolling(fn, { interval: 100 }));

      await flush();
      expect(result.current.data).toBe(1);
      expect(result.current.status).toBe("success");

      await advance(100);
      expect(result.current.status).toBe("error");
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.data).toBe(1); // retained
    });
  });

  describe("pause / resume", () => {
    it("pause halts the loop, resume restarts it", async () => {
      const fn = vi.fn(async () => "v");
      const { result } = renderHook(() => usePolling(fn, { interval: 100 }));
      await flush();
      expect(fn).toHaveBeenCalledTimes(1);

      act(() => result.current.pause());
      expect(result.current.isPolling).toBe(false);
      await advance(1000);
      expect(fn).toHaveBeenCalledTimes(1); // no polls while paused

      act(() => result.current.resume());
      expect(result.current.isPolling).toBe(true);
      await flush();
      expect(fn).toHaveBeenCalledTimes(2); // resume polls immediately
    });

    it("start/stop are aliases of resume/pause", async () => {
      const fn = vi.fn(async () => "v");
      const { result } = renderHook(() => usePolling(fn, { interval: 100 }));
      await flush();

      act(() => result.current.stop());
      expect(result.current.isPolling).toBe(false);
      await advance(1000);
      expect(fn).toHaveBeenCalledTimes(1);

      act(() => result.current.start());
      expect(result.current.isPolling).toBe(true);
      await flush();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("settles a stuck pending back to idle when paused mid-flight (no prior data)", async () => {
      const d = deferred<string>();
      const { result } = renderHook(() =>
        usePolling(() => d.promise, { interval: 100 }),
      );
      expect(result.current.status).toBe("pending");
      expect(result.current.isLoading).toBe(true);

      act(() => result.current.pause());
      expect(result.current.status).toBe("idle");
      expect(result.current.isLoading).toBe(false);
      d.resolve("ignored"); // must not update state
      await flush();
      expect(result.current.status).toBe("idle");
    });

    it("settles a stuck pending back to success (retaining data) when paused mid-flight", async () => {
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      let n = 0;
      const fn = () => (++n === 1 ? d1.promise : d2.promise);
      const { result } = renderHook(() => usePolling(fn, { interval: 100 }));

      await act(async () => {
        d1.resolve("A");
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.status).toBe("success");
      expect(result.current.data).toBe("A");

      await advance(100); // second poll starts, pending
      expect(result.current.status).toBe("pending");

      act(() => result.current.pause());
      expect(result.current.status).toBe("success"); // settled, not stuck
      expect(result.current.data).toBe("A"); // retained
      expect(result.current.isLoading).toBe(false);
      d2.resolve("late");
      await flush();
      expect(result.current.data).toBe("A");
    });
  });

  describe("enabled gate", () => {
    it("does not poll while enabled is false, starts when flipped true", async () => {
      const fn = vi.fn(async () => "v");
      const { result, rerender } = renderHook(
        ({ enabled }) => usePolling(fn, { interval: 100, enabled }),
        { initialProps: { enabled: false } },
      );
      expect(fn).not.toHaveBeenCalled();
      expect(result.current.isPolling).toBe(false);

      rerender({ enabled: true });
      expect(result.current.isPolling).toBe(true);
      await flush();
      expect(fn).toHaveBeenCalledTimes(1);

      rerender({ enabled: false });
      expect(result.current.isPolling).toBe(false);
      await advance(1000);
      expect(fn).toHaveBeenCalledTimes(1); // stopped
    });

    it("enabled is the master gate: resume cannot start polling while disabled", async () => {
      const fn = vi.fn(async () => "v");
      const { result } = renderHook(() =>
        usePolling(fn, { interval: 100, enabled: false }),
      );
      act(() => result.current.resume());
      expect(result.current.isPolling).toBe(false);
      await advance(1000);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("backoff", () => {
    it("grows the delay on consecutive failures and resets on success", async () => {
      let calls = 0;
      const fn = vi.fn(async () => {
        calls++;
        if (calls <= 3) throw new Error(`fail ${calls}`);
        return "ok";
      });
      renderHook(() =>
        usePolling(fn, { interval: 100, immediate: true, backoff: true }),
      );

      // Poll #1 fails -> failureCount 1 -> next delay = 100 * 2^1 = 200
      await flush();
      expect(fn).toHaveBeenCalledTimes(1);
      await advance(199);
      expect(fn).toHaveBeenCalledTimes(1);
      await advance(1);
      expect(fn).toHaveBeenCalledTimes(2);

      // Poll #2 fails -> failureCount 2 -> next delay = 400
      await advance(399);
      expect(fn).toHaveBeenCalledTimes(2);
      await advance(1);
      expect(fn).toHaveBeenCalledTimes(3);

      // Poll #3 fails -> failureCount 3 -> next delay = 800
      await advance(799);
      expect(fn).toHaveBeenCalledTimes(3);
      await advance(1);
      expect(fn).toHaveBeenCalledTimes(4);

      // Poll #4 succeeds -> delay resets to the base 100
      await advance(99);
      expect(fn).toHaveBeenCalledTimes(4);
      await advance(1);
      expect(fn).toHaveBeenCalledTimes(5);
    });

    it("keeps a constant interval when backoff is disabled despite failures", async () => {
      const fn = vi.fn(async () => {
        throw new Error("always");
      });
      renderHook(() => usePolling(fn, { interval: 100 }));
      await flush();
      expect(fn).toHaveBeenCalledTimes(1);
      await advance(100);
      expect(fn).toHaveBeenCalledTimes(2);
      await advance(100);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe("AbortController cancellation", () => {
    it("passes a fresh, un-aborted AbortSignal to each poll", async () => {
      let signal: AbortSignal | undefined;
      renderHook(() =>
        usePolling(
          async (s: AbortSignal) => {
            signal = s;
            return "v";
          },
          { interval: 100 },
        ),
      );
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal!.aborted).toBe(false);
      await flush();
    });

    it("aborts the in-flight poll on pause", () => {
      let signal: AbortSignal | undefined;
      const { result } = renderHook(() =>
        usePolling((s: AbortSignal) => {
          signal = s;
          return new Promise<string>(() => {});
        }, { interval: 100 }),
      );
      expect(signal!.aborted).toBe(false);
      act(() => result.current.pause());
      expect(signal!.aborted).toBe(true);
    });

    it("aborts the in-flight poll on unmount", () => {
      let signal: AbortSignal | undefined;
      const { unmount } = renderHook(() =>
        usePolling((s: AbortSignal) => {
          signal = s;
          return new Promise<string>(() => {});
        }, { interval: 100 }),
      );
      expect(signal!.aborted).toBe(false);
      unmount();
      expect(signal!.aborted).toBe(true);
    });

    it("aborts the in-flight poll when enabled flips to false", () => {
      let signal: AbortSignal | undefined;
      const { rerender } = renderHook(
        ({ enabled }) =>
          usePolling(
            (s: AbortSignal) => {
              signal = s;
              return new Promise<string>(() => {});
            },
            { interval: 100, enabled },
          ),
        { initialProps: { enabled: true } },
      );
      expect(signal!.aborted).toBe(false);
      rerender({ enabled: false });
      expect(signal!.aborted).toBe(true);
    });

    it("stale-guards: a poll that settles after being torn down does not update state", async () => {
      const d = deferred<string>();
      const { result } = renderHook(() =>
        usePolling(() => d.promise, { interval: 100 }),
      );
      act(() => result.current.pause());
      await act(async () => {
        d.resolve("late"); // ignores the abort, resolves anyway
        await vi.advanceTimersByTimeAsync(0);
      });
      // The torn-down poll must not have produced a "success" with "late".
      expect(result.current.data).toBeUndefined();
      expect(result.current.status).toBe("idle");
    });
  });

  describe("StrictMode safety", () => {
    it("runs exactly one loop under StrictMode (immediate: false)", async () => {
      const fn = vi.fn(async () => "v");
      renderHook(() => usePolling(fn, { interval: 100, immediate: false }), {
        wrapper: StrictMode,
      });

      // A single loop schedules one timer; a duplicate loop would fire twice.
      await advance(100);
      expect(fn).toHaveBeenCalledTimes(1);
      await advance(100);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("tears down the first mount's loop under StrictMode (immediate: true)", async () => {
      const signals: AbortSignal[] = [];
      const fn = vi.fn(async (s: AbortSignal) => {
        signals.push(s);
        return "v";
      });
      renderHook(() => usePolling(fn, { interval: 100 }), {
        wrapper: StrictMode,
      });

      await flush();
      // Two immediate ticks (double-invoke); the first is aborted by cleanup.
      expect(signals[0].aborted).toBe(true);
      expect(signals[1].aborted).toBe(false);
      const afterMount = fn.mock.calls.length;

      // Only the surviving loop advances -> exactly one more call per interval.
      await advance(100);
      expect(fn).toHaveBeenCalledTimes(afterMount + 1);
    });
  });

  describe("unmount safety", () => {
    it("does not poll or update state after unmount", async () => {
      const fn = vi.fn(async () => "v");
      const { unmount } = renderHook(() => usePolling(fn, { interval: 100 }));
      await flush();
      expect(fn).toHaveBeenCalledTimes(1);

      unmount();
      await advance(1000);
      expect(fn).toHaveBeenCalledTimes(1); // no polls after unmount
    });
  });

  describe("SSR safety", () => {
    it("does not schedule or poll during server render", () => {
      const fn = vi.fn(async () => "s");
      function Probe() {
        usePolling(fn, { interval: 100 });
        return createElement("div");
      }
      renderToStaticMarkup(createElement(Probe));
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("callbacks", () => {
    it("calls onSuccess with the resolved data", async () => {
      const onSuccess = vi.fn();
      renderHook(() =>
        usePolling(async () => "hi", { interval: 100, onSuccess }),
      );
      await flush();
      expect(onSuccess).toHaveBeenCalledWith("hi");
    });

    it("calls onError with the thrown error", async () => {
      const err = new Error("x");
      const onError = vi.fn();
      renderHook(() =>
        usePolling(
          async () => {
            throw err;
          },
          { interval: 100, onError },
        ),
      );
      await flush();
      expect(onError).toHaveBeenCalledWith(err);
    });
  });

  describe("stability & latest refs", () => {
    it("keeps controls referentially stable, with start===resume and stop===pause", () => {
      const { result, rerender } = renderHook(() =>
        usePolling(async () => "v", { enabled: false }),
      );
      const { pause, resume, start, stop } = result.current;
      rerender();
      expect(result.current.pause).toBe(pause);
      expect(result.current.resume).toBe(resume);
      expect(result.current.start).toBe(start);
      expect(result.current.stop).toBe(stop);
      expect(result.current.start).toBe(result.current.resume);
      expect(result.current.stop).toBe(result.current.pause);
    });

    it("picks up a changed inline fn on the next tick without restarting", async () => {
      const fn1 = vi.fn(async () => "a");
      const fn2 = vi.fn(async () => "b");
      const { rerender } = renderHook(({ fn }) => usePolling(fn, { interval: 100 }), {
        initialProps: { fn: fn1 },
      });

      await flush();
      expect(fn1).toHaveBeenCalledTimes(1);

      rerender({ fn: fn2 });
      // A changed fn must NOT restart the loop (no immediate extra poll).
      expect(fn2).not.toHaveBeenCalled();

      await advance(100);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn1).toHaveBeenCalledTimes(1);
    });

    it("applies a changed interval on the next tick without restarting", async () => {
      const fn = vi.fn(async () => "v");
      const { rerender } = renderHook(
        ({ interval }) => usePolling(fn, { interval }),
        { initialProps: { interval: 100 } },
      );

      await flush(); // poll #1, schedules next at 100
      expect(fn).toHaveBeenCalledTimes(1);

      rerender({ interval: 500 }); // no restart; already-scheduled 100 tick stands

      await advance(100);
      expect(fn).toHaveBeenCalledTimes(2); // poll #2, now schedules next at 500

      await advance(499);
      expect(fn).toHaveBeenCalledTimes(2);
      await advance(1);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});
