import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { StrictMode, useRef } from "react";
import { useRafState } from "./useRafState";

// ---------------------------------------------------------------------------
// Deterministic requestAnimationFrame mock
//
// jsdom's rAF is timer-driven and non-deterministic for assertions, so we stub
// the globals with a manual queue we can flush on demand. `cancelAnimationFrame`
// removes the callback, letting us assert coalescing / unmount cancellation by
// inspecting the pending count.
// ---------------------------------------------------------------------------

let rafCallbacks: Map<number, FrameRequestCallback>;
let nextRafId: number;

function installRaf(): void {
  rafCallbacks = new Map();
  nextRafId = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback): number => {
    nextRafId += 1;
    rafCallbacks.set(nextRafId, cb);
    return nextRafId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number): void => {
    rafCallbacks.delete(id);
  });
}

function flushRaf(): void {
  const callbacks = Array.from(rafCallbacks.values());
  rafCallbacks.clear();
  for (const cb of callbacks) cb(Date.now());
}

function pendingRafCount(): number {
  return rafCallbacks.size;
}

beforeEach(() => {
  installRaf();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// A wrapper that also counts renders, so we can assert that a burst of updates
// coalesces to a single commit (one re-render per frame).
function useTracked<T>(initial: T | (() => T)) {
  const renders = useRef(0);
  renders.current += 1;
  const [state, setState] = useRafState(initial);
  return { state, setState, renders };
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

describe("useRafState — initialization", () => {
  it("returns the direct initial value", () => {
    const { result } = renderHook(() => useRafState(5));
    expect(result.current[0]).toBe(5);
  });

  it("supports a lazy initializer and runs it exactly once", () => {
    const init = vi.fn(() => 42);
    const { result, rerender } = renderHook(() => useRafState(init));

    expect(result.current[0]).toBe(42);
    expect(init).toHaveBeenCalledTimes(1);

    rerender();
    rerender();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("defaults to undefined when called with no argument", () => {
    const { result } = renderHook(() => useRafState<number>());
    expect(result.current[0]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// rAF batching
// ---------------------------------------------------------------------------

describe("useRafState — rAF batching", () => {
  it("does not update synchronously; commits only after the frame flushes", () => {
    const { result } = renderHook(() => useRafState(0));

    act(() => {
      result.current[1](1);
    });

    // Scheduled, not applied yet.
    expect(result.current[0]).toBe(0);
    expect(pendingRafCount()).toBe(1);

    act(() => {
      flushRaf();
    });

    expect(result.current[0]).toBe(1);
    expect(pendingRafCount()).toBe(0);
  });

  it("coalesces multiple updates in one frame to the latest (last-write-wins), one commit", () => {
    const { result } = renderHook(() => useTracked(0));
    const rendersBefore = result.current.renders.current;

    act(() => {
      result.current.setState(1);
      result.current.setState(2);
      result.current.setState(3);
    });

    // Each call cancelled the previous frame — only one is pending.
    expect(pendingRafCount()).toBe(1);
    // No commit happened during scheduling.
    expect(result.current.renders.current).toBe(rendersBefore);

    act(() => {
      flushRaf();
    });

    expect(result.current.state).toBe(3);
    // Exactly one additional render for the whole burst.
    expect(result.current.renders.current).toBe(rendersBefore + 1);
  });

  it("supports a functional updater against the committed state", () => {
    const { result } = renderHook(() => useRafState(10));

    act(() => {
      result.current[1]((prev) => prev + 5);
    });
    act(() => {
      flushRaf();
    });

    expect(result.current[0]).toBe(15);
  });

  it("coalesces functional updaters last-write-wins (only the last updater runs)", () => {
    const { result } = renderHook(() => useRafState(0));

    act(() => {
      result.current[1]((n) => n + 1);
      result.current[1]((n) => n + 1);
      result.current[1]((n) => n + 1);
    });
    act(() => {
      flushRaf();
    });

    // Documented behaviour: the earlier updaters are dropped, so this is 1, not 3.
    expect(result.current[0]).toBe(1);
  });

  it("accumulates functional updaters across separate frames", () => {
    const { result } = renderHook(() => useRafState(0));

    act(() => {
      result.current[1]((n) => n + 1);
    });
    act(() => {
      flushRaf();
    });
    act(() => {
      result.current[1]((n) => n + 1);
    });
    act(() => {
      flushRaf();
    });

    expect(result.current[0]).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Setter stability
// ---------------------------------------------------------------------------

describe("useRafState — setter stability", () => {
  it("keeps a stable setter identity across re-renders", () => {
    const { result, rerender } = renderHook(() => useRafState(0));
    const setter = result.current[1];

    rerender();
    act(() => {
      result.current[1](1);
    });
    act(() => {
      flushRaf();
    });
    rerender();

    expect(result.current[1]).toBe(setter);
  });
});

// ---------------------------------------------------------------------------
// Cleanup on unmount
// ---------------------------------------------------------------------------

describe("useRafState — cleanup", () => {
  it("cancels a pending frame on unmount (no update after unmount)", () => {
    const { result, unmount } = renderHook(() => useRafState(0));

    act(() => {
      result.current[1](99);
    });
    expect(pendingRafCount()).toBe(1);

    unmount();

    // The pending frame was cancelled.
    expect(pendingRafCount()).toBe(0);

    // Flushing now is a no-op and must not throw.
    expect(() => {
      act(() => {
        flushRaf();
      });
    }).not.toThrow();

    // State never advanced past its last committed value.
    expect(result.current[0]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SSR / unsupported environment
// ---------------------------------------------------------------------------

describe("useRafState — SSR / unsupported environment", () => {
  it("does not crash rendering when requestAnimationFrame is unavailable", () => {
    vi.stubGlobal("requestAnimationFrame", undefined);
    vi.stubGlobal("cancelAnimationFrame", undefined);

    const { result } = renderHook(() => useRafState(7));
    expect(result.current[0]).toBe(7);
  });

  it("falls back to a synchronous update when rAF is unavailable", () => {
    vi.stubGlobal("requestAnimationFrame", undefined);
    vi.stubGlobal("cancelAnimationFrame", undefined);

    const { result } = renderHook(() => useRafState(0));

    act(() => {
      result.current[1](42);
    });

    // Applied synchronously — no frame to flush.
    expect(result.current[0]).toBe(42);
  });

  it("unmounts cleanly when rAF is unavailable", () => {
    vi.stubGlobal("requestAnimationFrame", undefined);
    vi.stubGlobal("cancelAnimationFrame", undefined);

    const { result, unmount } = renderHook(() => useRafState(0));
    act(() => {
      result.current[1](1);
    });

    expect(() => unmount()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// StrictMode
// ---------------------------------------------------------------------------

describe("useRafState — StrictMode", () => {
  it("does not leak or double-apply a scheduled frame under StrictMode", () => {
    const { result } = renderHook(() => useTracked(0), { wrapper: StrictMode });

    act(() => {
      result.current.setState(5);
    });

    // A single update schedules a single frame, even with double-invoked renders.
    expect(pendingRafCount()).toBe(1);

    act(() => {
      flushRaf();
    });

    expect(result.current.state).toBe(5);
    expect(pendingRafCount()).toBe(0);
  });
});
