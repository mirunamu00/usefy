import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createConfettiEngine, MAX_FRAME_DT_MS } from "./createEngine";
import type { EmitOptions, FireOptions } from "../types";

/* ------------------------------------------------------------------ */
/* Test doubles                                                        */
/* ------------------------------------------------------------------ */

/** Manually-driven requestAnimationFrame harness with a controllable clock. */
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

  /** Number of rAF callbacks currently scheduled (0 ⇔ loop provably stopped). */
  get pending(): number {
    return this.callbacks.size;
  }

  /** Advance the clock by `dt` ms and run all scheduled callbacks once. */
  frame(dt: number = 1000 / 60): void {
    this.now += dt;
    const due = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const cb of due) cb(this.now);
  }

  /** Run consecutive frames of `step` ms until `ms` have elapsed. */
  advance(ms: number, step: number = 1000 / 60): void {
    for (let t = 0; t < ms; t += step) this.frame(step);
  }
}

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(private callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element): void {
    this.observed.push(el);
  }
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }
  trigger(): void {
    this.callback([], this as unknown as ResizeObserver);
  }
}

type MockCtx = CanvasRenderingContext2D & {
  clearRect: ReturnType<typeof vi.fn>;
  setTransform: ReturnType<typeof vi.fn>;
  ellipse: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
};

function createMockCanvas(clientWidth = 300, clientHeight = 150) {
  const ctx = {
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
  } as unknown as MockCtx;
  const canvas = {
    width: 0,
    height: 0,
    clientWidth,
    clientHeight,
    getContext: vi.fn(() => ctx),
  } as unknown as HTMLCanvasElement & { clientWidth: number; clientHeight: number };
  return { canvas, ctx };
}

function stubMatchMedia(reduce: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reduce : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/**
 * Deterministic burst: with Math.random mocked to 0.5, jitters are exactly
 * ×1.0 (speed and lifetime), so `lifetime` is exact. A single "circle"
 * shape means every drawn particle is exactly one `ellipse()` call.
 */
const TRACKABLE: FireOptions = {
  count: 1,
  shapes: ["circle"],
  origin: { x: 0.5, y: 0.5 },
  angle: 0, // rightward
  spread: 0,
  startVelocity: 1, // 60 px/s
  gravity: 0,
  drift: 0,
  decay: 1,
  flat: true,
  lifetime: 60_000,
};

let raf: RafHarness;

beforeEach(() => {
  raf = new RafHarness();
  raf.install();
  MockResizeObserver.instances = [];
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  stubMatchMedia(false);
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Count of particles drawn in the most recent frame. */
function drawnCircles(ctx: MockCtx): number {
  return ctx.ellipse.mock.calls.length;
}

/* ------------------------------------------------------------------ */
/* Construction & canvas sizing                                        */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — construction & DPR sizing", () => {
  it("throws a clear error when the canvas has no 2D context", () => {
    const canvas = {
      getContext: () => null,
      clientWidth: 100,
      clientHeight: 100,
    } as unknown as HTMLCanvasElement;
    expect(() => createConfettiEngine(canvas)).toThrow(/getContext\('2d'\)/);
  });

  it("sizes the backing store to CSS size × devicePixelRatio, capped at 2", () => {
    vi.stubGlobal("devicePixelRatio", 3);
    const { canvas, ctx } = createMockCanvas(300, 150);
    createConfettiEngine(canvas);
    expect(canvas.width).toBe(600); // 300 × min(3, 2)
    expect(canvas.height).toBe(300);
    expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  });

  it("honors an explicit options.dpr override", () => {
    vi.stubGlobal("devicePixelRatio", 3);
    const { canvas, ctx } = createMockCanvas(300, 150);
    createConfettiEngine(canvas, { dpr: 1 });
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(150);
    expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
  });

  it("falls back to dpr 1 when devicePixelRatio is unavailable", () => {
    vi.stubGlobal("devicePixelRatio", undefined);
    const { canvas } = createMockCanvas(200, 100);
    createConfettiEngine(canvas);
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
  });

  it("starts idle: no rAF scheduled, active false", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* rAF loop lifecycle                                                  */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — loop lifecycle & active edges", () => {
  it("fire() starts the loop; the loop provably stops when all particles die", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);

    void engine.fire({ ...TRACKABLE, lifetime: 100 });
    expect(engine.active).toBe(true);
    expect(raf.pending).toBe(1);

    raf.advance(250);
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0); // idle shutdown — no dangling rAF

    // The final frame wiped the canvas.
    const clearCalls = ctx.clearRect.mock.calls;
    expect(clearCalls[clearCalls.length - 1]).toEqual([0, 0, 300, 150]);
  });

  it("draws every spawned particle each frame (origin scaled to CSS pixels)", () => {
    const { canvas, ctx } = createMockCanvas(300, 150);
    const engine = createConfettiEngine(canvas);
    void engine.fire({ ...TRACKABLE, count: 5 });

    ctx.ellipse.mockClear();
    raf.frame(); // first frame: dt 0 — particles drawn at their origin
    expect(drawnCircles(ctx)).toBe(5);
    // origin {0.5, 0.5} of 300×150 → y exactly 75 (wobble offsets x only).
    expect(ctx.ellipse.mock.calls[0][1]).toBe(75);
    expect(engine.active).toBe(true);
  });

  it("restarts cleanly for a second burst after going idle", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);

    void engine.fire({ ...TRACKABLE, lifetime: 50 });
    raf.advance(150);
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);

    void engine.fire({ ...TRACKABLE, count: 3, lifetime: 50 });
    expect(engine.active).toBe(true);
    expect(raf.pending).toBe(1);
    ctx.ellipse.mockClear();
    raf.frame();
    expect(drawnCircles(ctx)).toBe(3);
    raf.advance(150);
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* fire() cohort promises                                              */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — fire() promise cohorts", () => {
  it("resolves when exactly that burst's particles have all died", async () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const promise = engine.fire({ ...TRACKABLE, count: 4, lifetime: 100 });
    raf.advance(250);
    await expect(promise).resolves.toBeUndefined();
  });

  it("overlapping cohorts resolve independently, in death order", async () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);

    let shortDone = false;
    let longDone = false;
    engine
      .fire({ ...TRACKABLE, count: 2, lifetime: 100 })
      .then(() => (shortDone = true));
    engine
      .fire({ ...TRACKABLE, count: 2, lifetime: 400 })
      .then(() => (longDone = true));
    expect(engine.active).toBe(true);

    raf.advance(200);
    await Promise.resolve();
    expect(shortDone).toBe(true); // 100ms cohort dead
    expect(longDone).toBe(false); // 400ms cohort still flying

    raf.advance(300);
    await Promise.resolve();
    expect(longDone).toBe(true);
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
  });

  it("count: 0 resolves immediately without starting the loop", async () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    await expect(engine.fire({ count: 0 })).resolves.toBeUndefined();
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* emit()                                                              */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — emit()", () => {
  const EMIT_BASE: EmitOptions = { ...TRACKABLE, lifetime: 60_000 };

  it("spawns at particlesPerSecond honoring the frame dt", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    engine.emit({ ...EMIT_BASE, particlesPerSecond: 120 });
    expect(engine.active).toBe(true);
    expect(raf.pending).toBe(1);

    ctx.ellipse.mockClear();
    raf.frame(25); // first frame: dt 0 → nothing spawned yet
    expect(drawnCircles(ctx)).toBe(0);

    ctx.ellipse.mockClear();
    raf.frame(25); // dt 25ms × 120/s = 3 particles
    expect(drawnCircles(ctx)).toBe(3);

    ctx.ellipse.mockClear();
    raf.frame(25);
    expect(drawnCircles(ctx)).toBe(6); // 3 more, previous 3 still alive
  });

  it("carries fractional spawn accrual across frames", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    engine.emit({ ...EMIT_BASE, particlesPerSecond: 20 }); // 0.5 per 25ms frame

    const perFrame: number[] = [];
    for (let i = 0; i < 5; i++) {
      ctx.ellipse.mockClear();
      raf.frame(25);
      perFrame.push(drawnCircles(ctx));
    }
    // dt0 frame, then accum 0.5 → 0, 1.0 → +1, 0.5 → 0, 1.0 → +1.
    expect(perFrame).toEqual([0, 0, 1, 1, 2]);
  });

  it("EmitHandle.stop() stops spawning; live particles finish naturally", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const handle = engine.emit({ ...EMIT_BASE, lifetime: 200, particlesPerSecond: 40 });
    raf.advance(100, 25); // spawn a few
    expect(handle.active).toBe(true);

    handle.stop();
    expect(handle.active).toBe(false);

    ctx.ellipse.mockClear();
    raf.frame(25);
    const aliveAfterStop = drawnCircles(ctx);
    expect(aliveAfterStop).toBeGreaterThan(0); // existing particles keep flying

    ctx.ellipse.mockClear();
    raf.frame(25);
    expect(drawnCircles(ctx)).toBeLessThanOrEqual(aliveAfterStop); // no new spawns

    raf.advance(400, 25); // they die out naturally
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
  });

  it("engine.stop() stops all emitters at once", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const a = engine.emit({ ...EMIT_BASE, lifetime: 100 });
    const b = engine.emit({ ...EMIT_BASE, lifetime: 100 });
    expect(engine.active).toBe(true);

    engine.stop();
    expect(a.active).toBe(false);
    expect(b.active).toBe(false);

    raf.advance(300, 25);
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
  });

  it("particlesPerSecond: 0 (or negative) returns an inert handle — no forever-spinning loop", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const zero = engine.emit({ ...EMIT_BASE, particlesPerSecond: 0 });
    expect(zero.active).toBe(false);
    zero.stop(); // safe no-op
    const negative = engine.emit({ ...EMIT_BASE, particlesPerSecond: -5 });
    expect(negative.active).toBe(false);
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0); // the loop never started
  });

  it("an emitter alone keeps the loop alive even before any particle exists", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const handle = engine.emit({ ...EMIT_BASE, particlesPerSecond: 1 }); // slow
    expect(engine.active).toBe(true);
    raf.frame(25);
    expect(raf.pending).toBe(1); // still looping, waiting to accrue
    handle.stop();
    raf.frame(25);
    expect(raf.pending).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* clear / pause / resume                                              */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — clear()", () => {
  it("kills everything and wipes the canvas immediately", async () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const promise = engine.fire({ ...TRACKABLE, count: 5 });
    engine.emit({ ...TRACKABLE, particlesPerSecond: 50 });
    raf.advance(100, 25);
    expect(engine.active).toBe(true);

    ctx.clearRect.mockClear();
    engine.clear();
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 300, 150);
    // Killed particles settle their cohort — the fire promise resolves.
    await expect(promise).resolves.toBeUndefined();
  });
});

describe("createConfettiEngine — pause()/resume()", () => {
  it("pause freezes the loop (rAF cancelled), resume restarts it", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    void engine.fire(TRACKABLE);
    raf.advance(50);
    expect(raf.pending).toBe(1);

    engine.pause();
    expect(raf.pending).toBe(0); // no rAF while paused
    expect(engine.active).toBe(true); // particles still alive, just frozen

    engine.resume();
    expect(raf.pending).toBe(1);
  });

  it("the first resumed frame has dt 0 — positions identical, no catch-up", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    void engine.fire(TRACKABLE);
    raf.advance(100);

    ctx.ellipse.mockClear();
    raf.frame();
    const [xBefore, yBefore] = ctx.ellipse.mock.calls[0];

    engine.pause();
    raf.now += 60_000; // a minute passes while paused
    engine.resume();

    ctx.ellipse.mockClear();
    raf.frame(0); // first resumed frame
    const [xAfter, yAfter] = ctx.ellipse.mock.calls[0];
    expect(xAfter).toBe(xBefore); // exactly unchanged — zero catch-up
    expect(yAfter).toBe(yBefore);
  });

  it("clamps huge frame gaps to MAX_FRAME_DT_MS (no teleport on tab return)", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    // 60 px/s rightward, no gravity/drift/decay.
    void engine.fire(TRACKABLE);
    raf.frame(); // dt 0

    ctx.ellipse.mockClear();
    raf.frame();
    const [x1] = ctx.ellipse.mock.calls[0];

    // Simulate a 5-second rAF gap (throttled background tab).
    ctx.ellipse.mockClear();
    raf.frame(5000);
    const [x2] = ctx.ellipse.mock.calls[0];

    const moved = x2 - x1;
    // Unclamped this would be ~300px; clamped it is ≤ 64ms of motion
    // (≈3.84px) plus a little wobble.
    expect(moved).toBeGreaterThan(0);
    expect(moved).toBeLessThan((MAX_FRAME_DT_MS / 1000) * 60 + 6);
  });

  it("fire() while paused defers the loop until resume()", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    engine.pause();
    void engine.fire(TRACKABLE);
    expect(engine.active).toBe(true); // particles exist…
    expect(raf.pending).toBe(0); // …but nothing runs while paused
    engine.resume();
    expect(raf.pending).toBe(1);
  });

  it("pause/resume are idempotent no-ops when repeated", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    engine.pause();
    engine.pause();
    engine.resume();
    engine.resume();
    expect(raf.pending).toBe(0); // idle engine — resume starts nothing
  });
});

/* ------------------------------------------------------------------ */
/* Reduced motion                                                      */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — reduced motion", () => {
  it('default "respect": fire() resolves immediately as a no-op', async () => {
    stubMatchMedia(true);
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    await expect(engine.fire({ count: 100 })).resolves.toBeUndefined();
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
  });

  it('default "respect": emit() returns an inert handle', () => {
    stubMatchMedia(true);
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const handle = engine.emit({ particlesPerSecond: 100 });
    expect(handle.active).toBe(false);
    handle.stop(); // safe no-op
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
  });

  it('"ignore" runs the animation despite the preference', () => {
    stubMatchMedia(true);
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas, { reducedMotion: "ignore" });
    void engine.fire(TRACKABLE);
    expect(engine.active).toBe(true);
    expect(raf.pending).toBe(1);
  });

  it("the preference is read live at fire() time, not cached at construction", () => {
    stubMatchMedia(false);
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    stubMatchMedia(true); // user toggles reduce-motion after engine creation
    void engine.fire(TRACKABLE);
    expect(engine.active).toBe(false);
  });

  it("runs normally when matchMedia is unsupported", () => {
    (window as { matchMedia?: unknown }).matchMedia = undefined;
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    void engine.fire(TRACKABLE);
    expect(engine.active).toBe(true);
  });

  it("treats a throwing matchMedia as no preference (hostile environments)", () => {
    window.matchMedia = (() => {
      throw new Error("nope");
    }) as unknown as typeof window.matchMedia;
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    void engine.fire(TRACKABLE);
    expect(engine.active).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Resize & ResizeObserver                                             */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — resize & ResizeObserver", () => {
  it("resize() re-syncs the backing store and re-applies the DPR transform", () => {
    vi.stubGlobal("devicePixelRatio", 2);
    const { canvas, ctx } = createMockCanvas(300, 150);
    const engine = createConfettiEngine(canvas);
    expect(canvas.width).toBe(600);

    canvas.clientWidth = 500;
    canvas.clientHeight = 250;
    ctx.setTransform.mockClear();
    engine.resize();
    expect(canvas.width).toBe(1000);
    expect(canvas.height).toBe(500);
    expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  });

  it("owns a ResizeObserver on its canvas and re-syncs when it fires", () => {
    const { canvas } = createMockCanvas(300, 150);
    createConfettiEngine(canvas);
    expect(MockResizeObserver.instances).toHaveLength(1);
    const ro = MockResizeObserver.instances[0];
    expect(ro.observed).toContain(canvas);

    canvas.clientWidth = 640;
    ro.trigger();
    expect(canvas.width).toBe(640); // dpr 1 in this test
  });

  it("constructs fine without ResizeObserver in the environment (older browsers)", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    void engine.fire(TRACKABLE);
    expect(engine.active).toBe(true);
    engine.destroy(); // must not throw on missing observer either
  });
});

/* ------------------------------------------------------------------ */
/* destroy()                                                           */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — destroy()", () => {
  it("full teardown: no dangling rAF, observer disconnected, canvas wiped", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    void engine.fire({ ...TRACKABLE, count: 10 });
    engine.emit({ ...TRACKABLE, particlesPerSecond: 50 });
    raf.advance(100, 25);
    expect(engine.active).toBe(true);

    ctx.clearRect.mockClear();
    engine.destroy();
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0); // no dangling rAF
    expect(MockResizeObserver.instances[0].disconnected).toBe(true);
    expect(ctx.clearRect).toHaveBeenCalled();
  });

  it("settles in-flight fire() promises on destroy", async () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const promise = engine.fire({ ...TRACKABLE, count: 3 });
    engine.destroy();
    await expect(promise).resolves.toBeUndefined();
  });

  it("after destroy: fire() no-ops resolved, emit() inert, methods safe, idempotent", async () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    engine.destroy();
    engine.destroy(); // idempotent

    await expect(engine.fire({ count: 50 })).resolves.toBeUndefined();
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);

    const handle = engine.emit();
    expect(handle.active).toBe(false);

    // None of these may throw or revive anything.
    engine.stop();
    engine.clear();
    engine.pause();
    engine.resume();
    engine.resize();
    expect(raf.pending).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* Pool integration                                                    */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — pool integration", () => {
  it("a burst larger than poolSize still renders fully (pool grows)", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas, { poolSize: 2 });
    void engine.fire({ ...TRACKABLE, count: 7 });
    ctx.ellipse.mockClear();
    raf.frame();
    expect(drawnCircles(ctx)).toBe(7);
  });

  it("SPEC §4.3: 500 simultaneous particles — one clearRect and 500 draws per frame, then clean idle", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    void engine.fire({ ...TRACKABLE, count: 500, lifetime: 200 });

    raf.frame(); // spawn frame (dt 0)
    ctx.clearRect.mockClear();
    ctx.ellipse.mockClear();
    raf.frame();
    expect(ctx.clearRect).toHaveBeenCalledTimes(1); // single wipe per frame
    expect(drawnCircles(ctx)).toBe(500); // all alive, one call each

    raf.advance(400);
    expect(engine.active).toBe(false); // full cohort dies on schedule
    expect(raf.pending).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* NaN / Infinity hardening (review fix #2)                            */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — NaN/Infinity never wedge the engine", () => {
  it("fire({count: NaN}) falls back to the default count and resolves", async () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const promise = engine.fire({ ...TRACKABLE, count: NaN, lifetime: 100 });
    ctx.ellipse.mockClear();
    raf.frame();
    expect(drawnCircles(ctx)).toBe(80); // default count, not zero, not stuck
    raf.advance(250);
    await expect(promise).resolves.toBeUndefined(); // no forever-pending cohort
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
  });

  it("fire({count: Infinity}) spawns the default count — no synchronous freeze", async () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const promise = engine.fire({ ...TRACKABLE, count: Infinity, lifetime: 100 });
    ctx.ellipse.mockClear();
    raf.frame();
    expect(drawnCircles(ctx)).toBe(80);
    raf.advance(250);
    await expect(promise).resolves.toBeUndefined();
  });

  it("lifetime: NaN falls back — particles are mortal, the loop idles", async () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const promise = engine.fire({ ...TRACKABLE, count: 2, lifetime: NaN });
    raf.advance(3200); // default 3000ms lifetime
    await expect(promise).resolves.toBeUndefined();
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0); // rAF provably idle — no immortal particles
  });

  it("emit({particlesPerSecond: NaN/Infinity}) falls back to the default rate", () => {
    const { canvas, ctx } = createMockCanvas();
    const engine = createConfettiEngine(canvas);

    const nanHandle = engine.emit({ ...TRACKABLE, particlesPerSecond: NaN });
    ctx.ellipse.mockClear();
    raf.frame(100); // dt 0
    ctx.ellipse.mockClear();
    raf.frame(100); // clamped to 64ms × 30/s (default) ≈ 1.92 → 1 spawn
    expect(drawnCircles(ctx)).toBeGreaterThan(0); // NaN accumulator would spawn 0 forever
    expect(drawnCircles(ctx)).toBeLessThan(10); // and Infinity would spawn unboundedly
    nanHandle.stop();
    engine.clear();

    const infHandle = engine.emit({ ...TRACKABLE, particlesPerSecond: Infinity });
    ctx.ellipse.mockClear();
    raf.frame(100);
    ctx.ellipse.mockClear();
    raf.frame(100);
    expect(drawnCircles(ctx)).toBeLessThan(10); // default rate, no runaway
    infHandle.stop();
  });

  it("poolSize/dpr NaN or Infinity never freeze construction or sizing", () => {
    const a = createMockCanvas(300, 150);
    const engineA = createConfettiEngine(a.canvas, {
      poolSize: Infinity,
      dpr: NaN,
    });
    expect(a.canvas.width).toBe(300); // dpr fell back to env (1)
    void engineA.fire(TRACKABLE);
    expect(engineA.active).toBe(true);

    const b = createMockCanvas(300, 150);
    createConfettiEngine(b.canvas, { poolSize: NaN, dpr: Infinity });
    expect(b.canvas.width).toBe(300); // Infinity dpr → fallback, then cap
  });
});

/* ------------------------------------------------------------------ */
/* Re-entrant user code (review fix #3)                                */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — re-entrant fire() from user draw code", () => {
  it("a rasterize callback that calls fire() never doubles the rAF loop", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);

    let reentered = false;
    const trap = {
      key: "reentrant",
      rasterize: () => {
        if (!reentered) {
          reentered = true;
          // Exactly what a Phase 3 textShape consumer could do: launch a
          // follow-up burst from inside the draw pass.
          void engine.fire({ ...TRACKABLE, lifetime: 100 });
        }
        return null; // stays "not ready" — keeps the shape harmless
      },
    };

    void engine.fire({ ...TRACKABLE, count: 1, lifetime: 100, shapes: [trap] });
    raf.frame(); // draw pass runs rasterize → re-entrant fire()
    expect(reentered).toBe(true);
    expect(raf.pending).toBe(1); // exactly one scheduled frame, never 2

    raf.advance(400);
    expect(raf.pending).toBe(0); // and it still idles correctly
    expect(engine.active).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* onActiveChange subscription seam                                    */
/* ------------------------------------------------------------------ */

describe("createConfettiEngine — onActiveChange()", () => {
  it("notifies exactly on idle↔active edges, never per frame", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const events: boolean[] = [];
    engine.onActiveChange((active) => events.push(active));

    void engine.fire({ ...TRACKABLE, lifetime: 100 });
    expect(events).toEqual([true]); // active edge, synchronously on fire

    raf.advance(50); // several frames while alive — no extra events
    expect(events).toEqual([true]);

    raf.advance(200); // burst dies → single idle edge
    expect(events).toEqual([true, false]);

    void engine.fire({ ...TRACKABLE, lifetime: 50 });
    raf.advance(150);
    expect(events).toEqual([true, false, true, false]);
  });

  it("fires the idle edge on clear(), stop() (emitter-only), and destroy()", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const events: boolean[] = [];
    engine.onActiveChange((active) => events.push(active));

    engine.emit({ ...TRACKABLE, particlesPerSecond: 1 }); // no particles yet
    expect(events).toEqual([true]);
    engine.stop(); // emitter pruned immediately, nothing alive → idle now
    expect(events).toEqual([true, false]);

    void engine.fire(TRACKABLE);
    expect(events).toEqual([true, false, true]);
    engine.clear();
    expect(events).toEqual([true, false, true, false]);

    void engine.fire(TRACKABLE);
    engine.destroy(); // final idle notification before listeners release
    expect(events).toEqual([true, false, true, false, true, false]);
  });

  it("EmitHandle.stop() alone flips to idle when nothing is alive", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const events: boolean[] = [];
    engine.onActiveChange((active) => events.push(active));
    const handle = engine.emit({ ...TRACKABLE, particlesPerSecond: 1 });
    expect(events).toEqual([true]);
    handle.stop();
    expect(events).toEqual([true, false]);
  });

  it("re-entrant fire() inside an idle edge: every listener still sees strictly alternating values", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const a: boolean[] = [];
    const b: boolean[] = [];
    let refired = false;
    engine.onActiveChange((active) => {
      a.push(active);
      if (!active && !refired) {
        refired = true;
        // Subscriber A immediately re-fires on the idle edge.
        void engine.fire({ ...TRACKABLE, lifetime: 50 });
      }
    });
    engine.onActiveChange((active) => b.push(active));

    void engine.fire({ ...TRACKABLE, lifetime: 50 });
    raf.advance(150); // first burst dies → A re-fires mid-notification
    raf.advance(150); // second burst dies

    // Both listeners: strictly alternating, no stale/duplicate deliveries.
    expect(a).toEqual([true, false, true, false]);
    expect(b).toEqual([true, false, true, false]);
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0);
  });

  it("fire() from destroy's final false notification gets an inert resolved promise (no cohort leak)", async () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    let zombiePromise: Promise<void> | null = null;
    engine.onActiveChange((active) => {
      if (!active) {
        zombiePromise = engine.fire({ ...TRACKABLE, lifetime: 60_000 });
      }
    });

    void engine.fire(TRACKABLE);
    engine.destroy(); // delivers the final false → listener tries to re-fire

    expect(zombiePromise).not.toBeNull();
    await expect(zombiePromise).resolves.toBeUndefined(); // inert, not pending forever
    expect(engine.active).toBe(false);
    expect(raf.pending).toBe(0); // nothing revived on the destroyed engine
  });

  it("a throwing listener never rejects fire()'s promise nor breaks other listeners", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const survivor: boolean[] = [];
    engine.onActiveChange(() => {
      throw new Error("consumer bug");
    });
    engine.onActiveChange((active) => survivor.push(active));

    const promise = engine.fire({ ...TRACKABLE, lifetime: 100 });
    expect(engine.active).toBe(true); // burst launched despite the throw
    raf.advance(250);
    await expect(promise).resolves.toBeUndefined(); // resolves on cohort death
    expect(survivor).toEqual([true, false]); // other listeners unaffected
    expect(consoleError).toHaveBeenCalled(); // the bug is reported, not swallowed silently
  });

  it("unsubscribe stops notifications; multiple listeners are independent", () => {
    const { canvas } = createMockCanvas();
    const engine = createConfettiEngine(canvas);
    const a: boolean[] = [];
    const b: boolean[] = [];
    const offA = engine.onActiveChange((v) => a.push(v));
    engine.onActiveChange((v) => b.push(v));

    void engine.fire({ ...TRACKABLE, lifetime: 50 });
    offA();
    raf.advance(150);
    expect(a).toEqual([true]); // unsubscribed before the idle edge
    expect(b).toEqual([true, false]);
  });
});
