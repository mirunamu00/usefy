import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode, useRef } from "react";
import { act, render, renderHook } from "@testing-library/react";
import { useConfetti, type UseConfettiReturn } from "./useConfetti";
import type { FireOptions } from "./types";

/* ---------------- shared jsdom doubles ---------------- */

class RafHarness {
  now = 1000;
  private callbacks = new Map<number, FrameRequestCallback>();
  private nextId = 1;
  install(): void {
    window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
      const id = this.nextId++;
      this.callbacks.set(id, cb);
      return id;
    };
    window.cancelAnimationFrame = (id: number): void => {
      this.callbacks.delete(id);
    };
  }
  get pending(): number {
    return this.callbacks.size;
  }
  frame(dt: number = 1000 / 60): void {
    this.now += dt;
    const due = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const cb of due) cb(this.now);
  }
  advance(ms: number, step: number = 1000 / 60): void {
    for (let t = 0; t < ms; t += step) this.frame(step);
  }
}

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  disconnected = false;
  constructor(_cb: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }
}

function createMockCtx(): CanvasRenderingContext2D {
  return {
    globalAlpha: 1,
    fillStyle: "",
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    ellipse: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function setPageVisibility(state: "visible" | "hidden"): void {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

/** Deterministic quick burst (Math.random mocked to 0.5 → exact lifetime). */
const BURST: FireOptions = {
  count: 1,
  shapes: ["circle"],
  lifetime: 100,
  flat: true,
};

let raf: RafHarness;

beforeEach(() => {
  raf = new RafHarness();
  raf.install();
  MockResizeObserver.instances = [];
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => createMockCtx(),
  );
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  act(() => setPageVisibility("visible"));
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* ---------------- tests ---------------- */

describe("useConfetti — before a canvas attaches", () => {
  it("fire() resolves immediately, emit() is inert, isActive is false", async () => {
    const { result } = renderHook(() => useConfetti());
    await expect(result.current.fire()).resolves.toBeUndefined();
    const handle = result.current.emit();
    expect(handle.active).toBe(false);
    handle.stop(); // safe no-op
    result.current.stop();
    result.current.clear();
    expect(result.current.isActive).toBe(false);
    expect(raf.pending).toBe(0);
  });
});

describe("useConfetti — function stability", () => {
  it("returns referentially stable functions across re-renders", () => {
    const { result, rerender } = renderHook(() => useConfetti());
    const first = result.current;
    rerender();
    expect(result.current.canvasRef).toBe(first.canvasRef);
    expect(result.current.fire).toBe(first.fire);
    expect(result.current.emit).toBe(first.emit);
    expect(result.current.stop).toBe(first.stop);
    expect(result.current.clear).toBe(first.clear);
  });
});

describe("useConfetti — engine lifecycle on canvas attach/detach", () => {
  it("creates the engine lazily on attach; fire animates; detach destroys", async () => {
    const { result } = renderHook(() => useConfetti());
    const canvas = document.createElement("canvas");

    act(() => result.current.canvasRef(canvas));
    expect(raf.pending).toBe(0); // engine exists but idle

    let promise!: Promise<void>;
    act(() => {
      promise = result.current.fire(BURST);
    });
    expect(result.current.isActive).toBe(true);
    expect(raf.pending).toBe(1);

    act(() => raf.advance(250));
    await expect(promise).resolves.toBeUndefined();
    expect(result.current.isActive).toBe(false);
    expect(raf.pending).toBe(0);

    act(() => result.current.canvasRef(null)); // detach
    expect(raf.pending).toBe(0);
    expect(
      MockResizeObserver.instances.filter((i) => !i.disconnected),
    ).toHaveLength(0); // engine fully destroyed
  });

  it("detaching mid-animation tears down cleanly (no dangling rAF)", () => {
    const { result } = renderHook(() => useConfetti());
    const canvas = document.createElement("canvas");
    act(() => result.current.canvasRef(canvas));
    act(() => {
      void result.current.fire({ ...BURST, lifetime: 60_000 });
    });
    expect(raf.pending).toBe(1);

    act(() => result.current.canvasRef(null));
    expect(raf.pending).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("re-attaching directly from canvas A to canvas B swaps engines cleanly", () => {
    const { result } = renderHook(() => useConfetti());
    const canvasA = document.createElement("canvas");
    const canvasB = document.createElement("canvas");

    act(() => result.current.canvasRef(canvasA));
    act(() => {
      void result.current.fire({ ...BURST, lifetime: 60_000 });
    });
    expect(result.current.isActive).toBe(true);
    expect(MockResizeObserver.instances).toHaveLength(1);

    // Direct A → B (no null in between — exactly what a conditional
    // re-render of a different canvas does).
    act(() => result.current.canvasRef(canvasB));
    expect(MockResizeObserver.instances).toHaveLength(2);
    expect(MockResizeObserver.instances[0].disconnected).toBe(true); // A's engine destroyed
    expect(MockResizeObserver.instances[1].disconnected).toBe(false); // B's engine live
    expect(result.current.isActive).toBe(false); // A's burst died with it
    expect(raf.pending).toBe(0);

    // fire() now routes to B's engine.
    act(() => {
      void result.current.fire(BURST);
    });
    expect(result.current.isActive).toBe(true);
    expect(raf.pending).toBe(1);
    act(() => raf.advance(250));
    expect(result.current.isActive).toBe(false);
  });

  it("unmounting the owning component destroys the engine via the ref callback", () => {
    let api!: UseConfettiReturn;
    function Host() {
      api = useConfetti();
      return <canvas ref={api.canvasRef} />;
    }
    const { unmount } = render(<Host />);
    act(() => {
      void api.fire({ ...BURST, lifetime: 60_000 });
    });
    expect(raf.pending).toBe(1);

    unmount();
    expect(raf.pending).toBe(0);
    expect(
      MockResizeObserver.instances.filter((i) => !i.disconnected),
    ).toHaveLength(0);
  });

  it("StrictMode double-mount leaves exactly one live engine, zero leaks after unmount", () => {
    let api!: UseConfettiReturn;
    function Host() {
      api = useConfetti();
      return <canvas ref={api.canvasRef} />;
    }
    const { unmount } = render(
      <StrictMode>
        <Host />
      </StrictMode>,
    );
    expect(
      MockResizeObserver.instances.filter((i) => !i.disconnected),
    ).toHaveLength(1); // exactly one live engine, however many strict cycles ran

    act(() => {
      void api.fire({ ...BURST, lifetime: 60_000 });
    });
    expect(raf.pending).toBe(1);

    unmount();
    expect(raf.pending).toBe(0);
    expect(
      MockResizeObserver.instances.filter((i) => !i.disconnected),
    ).toHaveLength(0);
  });
});

describe("useConfetti — isActive edge-only re-renders", () => {
  it("re-renders exactly on idle↔active edges, never per frame", () => {
    let renders = 0;
    let api!: UseConfettiReturn;
    function Host() {
      renders++;
      api = useConfetti();
      return <canvas ref={api.canvasRef} />;
    }
    render(<Host />);
    const baseline = renders;

    act(() => {
      void api.fire(BURST);
    });
    expect(renders).toBe(baseline + 1); // active edge

    act(() => raf.advance(50)); // several live frames — no edge
    expect(renders).toBe(baseline + 1);

    act(() => raf.advance(200)); // burst dies — idle edge
    expect(renders).toBe(baseline + 2);
    expect(api.isActive).toBe(false);
  });
});

describe("useConfetti — page visibility", () => {
  it("pauses the engine while hidden and resumes on return", () => {
    const { result } = renderHook(() => useConfetti());
    const canvas = document.createElement("canvas");
    act(() => result.current.canvasRef(canvas));
    act(() => {
      void result.current.fire({ ...BURST, lifetime: 60_000 });
    });
    expect(raf.pending).toBe(1);

    act(() => setPageVisibility("hidden"));
    expect(raf.pending).toBe(0); // frozen — no rAF while hidden
    expect(result.current.isActive).toBe(true); // particles still alive

    act(() => setPageVisibility("visible"));
    expect(raf.pending).toBe(1); // resumed
  });
});
