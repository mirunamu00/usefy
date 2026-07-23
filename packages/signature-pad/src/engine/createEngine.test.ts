import { afterEach, describe, expect, it, vi } from "vitest";
import { createSignatureEngine, type IngestSample, type SignatureEngine } from "./createEngine";
import { inkBounds } from "../ink/bounds";
import type { SignatureData } from "../types";

// ── Test doubles ─────────────────────────────────────────────────────

interface RecordedCall {
  method: string;
  args: unknown[];
}

function createMockCtx(): { ctx: CanvasRenderingContext2D; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const record =
    (method: string) =>
    (...args: unknown[]) =>
      calls.push({ method, args });
  const target = {
    beginPath: record("beginPath"),
    moveTo: record("moveTo"),
    lineTo: record("lineTo"),
    arc: record("arc"),
    fill: record("fill"),
    stroke: record("stroke"),
    clearRect: record("clearRect"),
    fillRect: record("fillRect"),
    setTransform: record("setTransform"),
    save: record("save"),
    restore: record("restore"),
    _fillStyle: "",
  };
  Object.defineProperty(target, "fillStyle", {
    get() {
      return target._fillStyle;
    },
    set(value: string) {
      target._fillStyle = value;
      calls.push({ method: "fillStyle", args: [value] });
    },
  });
  return { ctx: target as unknown as CanvasRenderingContext2D, calls };
}

function makeCanvas({ width = 300, height = 150 } = {}) {
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "clientWidth", { value: width, configurable: true });
  Object.defineProperty(canvas, "clientHeight", { value: height, configurable: true });
  const { ctx, calls } = createMockCtx();
  vi.spyOn(canvas, "getContext").mockReturnValue(ctx as never);
  (canvas as unknown as { setPointerCapture: unknown }).setPointerCapture = vi.fn();
  (canvas as unknown as { releasePointerCapture: unknown }).releasePointerCapture = vi.fn();
  return { canvas, ctx, calls };
}

/** [x, y, r] triples of every recorded `arc` call. */
function arcsOf(calls: RecordedCall[], from = 0): number[][] {
  return calls
    .slice(from)
    .filter((c) => c.method === "arc")
    .map((c) => (c.args as number[]).slice(0, 3));
}

function countOf(calls: RecordedCall[], method: string, from = 0): number {
  return calls.slice(from).filter((c) => c.method === method).length;
}

/** Drive a whole stroke through the synthetic-input seam. */
function strokeVia(
  engine: SignatureEngine,
  points: [number, number, number][],
  extras: Partial<IngestSample> = {},
): void {
  points.forEach(([x, y, time], i) => {
    engine.ingest({
      type: i === 0 ? "down" : "move",
      x,
      y,
      time,
      ...extras,
    });
  });
  const [x, y, time] = points[points.length - 1];
  engine.ingest({ type: "up", x, y, time, ...extras });
}

const LINE: [number, number, number][] = [
  [0, 0, 0],
  [10, 0, 10],
  [20, 5, 22],
  [32, 9, 35],
  [40, 20, 50],
];

function firePointer(
  target: EventTarget,
  type: string,
  init: {
    pointerId?: number;
    pointerType?: string;
    pressure?: number;
    clientX?: number;
    clientY?: number;
    button?: number;
    timeStamp?: number;
  } = {},
): MouseEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    button: init.button ?? 0,
  });
  Object.defineProperties(event, {
    pointerId: { value: init.pointerId ?? 1 },
    pointerType: { value: init.pointerType ?? "mouse" },
    pressure: { value: init.pressure ?? 0 },
  });
  if (init.timeStamp !== undefined) {
    Object.defineProperty(event, "timeStamp", { value: init.timeStamp });
  }
  target.dispatchEvent(event);
  return event;
}

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(public callback: () => void) {
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element): void {
    this.observed.push(el);
  }
  disconnect(): void {
    this.disconnected = true;
  }
}

afterEach(() => {
  MockResizeObserver.instances = [];
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── Construction & canvas management ─────────────────────────────────

describe("construction", () => {
  it("throws loudly when the canvas has no 2D context", () => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(null);
    expect(() => createSignatureEngine(canvas)).toThrow(/getContext\('2d'\) returned null/);
  });

  it("sets touch-action: none and sizes the DPR backing store", () => {
    const { canvas } = makeCanvas();
    createSignatureEngine(canvas);
    expect(canvas.style.touchAction).toBe("none");
    expect(canvas.width).toBe(300); // jsdom devicePixelRatio = 1
    expect(canvas.height).toBe(150);
  });

  it("caps environment devicePixelRatio at 2 and applies the transform", () => {
    vi.stubGlobal("devicePixelRatio", 3);
    const { canvas, calls } = makeCanvas();
    createSignatureEngine(canvas);
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(300);
    const transform = calls.find((c) => c.method === "setTransform");
    expect(transform?.args).toEqual([2, 0, 0, 2, 0, 0]);
  });

  it("honors a dpr override, clamped to [0.1, 2]", () => {
    const a = makeCanvas();
    createSignatureEngine(a.canvas, { dpr: 1.5 });
    expect(a.canvas.width).toBe(450);

    const b = makeCanvas();
    createSignatureEngine(b.canvas, { dpr: 9 });
    expect(b.canvas.width).toBe(600);

    const c = makeCanvas();
    createSignatureEngine(c.canvas, { dpr: 0.01 });
    expect(c.canvas.width).toBe(30);
  });

  it("falls back to dpr 1 when devicePixelRatio is NaN or 0 (guarded)", () => {
    vi.stubGlobal("devicePixelRatio", NaN);
    const a = makeCanvas();
    createSignatureEngine(a.canvas);
    expect(a.canvas.width).toBe(300);

    vi.unstubAllGlobals();
    vi.stubGlobal("devicePixelRatio", 0);
    const b = makeCanvas();
    createSignatureEngine(b.canvas);
    expect(b.canvas.width).toBe(300);
  });

  it("paints the background at construction when configured", () => {
    const { canvas, calls } = makeCanvas();
    createSignatureEngine(canvas, { background: "#fff" });
    const fillRect = calls.find((c) => c.method === "fillRect");
    expect(fillRect?.args).toEqual([0, 0, 300, 150]);
    const styleBefore = calls.findIndex((c) => c.method === "fillStyle" && c.args[0] === "#fff");
    expect(styleBefore).toBeGreaterThanOrEqual(0);
  });
});

// ── Stroke lifecycle via ingest ──────────────────────────────────────

describe("stroke lifecycle (ingest seam)", () => {
  it("captures a filtered stroke and commits it on up", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    expect(engine.isEmpty).toBe(true);

    strokeVia(engine, LINE);
    expect(engine.isEmpty).toBe(false);
    expect(engine.strokeCount).toBe(1);
    expect(engine.canUndo).toBe(true);
    expect(engine.canRedo).toBe(false);

    const data = engine.toJSON();
    expect(data.strokes[0].points).toHaveLength(LINE.length);
    expect(data.strokes[0].pointerType).toBe("mouse");
  });

  it("drops move samples closer than minDistance to the last kept point", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas, { minDistance: 5 });
    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    engine.ingest({ type: "move", x: 2, y: 0, time: 5 }); // 2px < 5 → dropped
    engine.ingest({ type: "move", x: 6, y: 0, time: 10 }); // 6px → kept
    engine.ingest({ type: "up", x: 7, y: 0, time: 15 }); // 1px from 6 → not added
    expect(engine.toJSON().strokes[0].points.map((p) => p.x)).toEqual([0, 6]);
  });

  it("renders incrementally — draws while stroking, never a full redraw", () => {
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const base = calls.length;
    const clearsBefore = countOf(calls, "clearRect");

    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    expect(arcsOf(calls, base)).toHaveLength(0); // nothing final yet
    engine.ingest({ type: "move", x: 10, y: 0, time: 10 });
    expect(arcsOf(calls, base)).toHaveLength(0); // segment awaits its p3
    engine.ingest({ type: "move", x: 20, y: 0, time: 20 });
    const afterThird = arcsOf(calls, base).length;
    expect(afterThird).toBeGreaterThan(0); // segment 0→10 drawn now
    engine.ingest({ type: "up", x: 30, y: 0, time: 30 });
    expect(arcsOf(calls, base).length).toBeGreaterThan(afterThird); // tail flushed

    // O(new points): no clearRect during the whole stroke.
    expect(countOf(calls, "clearRect")).toBe(clearsBefore);
  });

  it("renders a tap with no movement as a dot of start width", () => {
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas); // min 0.5 / max 2.5 → dot 1.5
    const base = calls.length;
    engine.ingest({ type: "down", x: 40, y: 25, time: 0 });
    engine.ingest({ type: "up", x: 40, y: 25, time: 80 });
    expect(arcsOf(calls, base)).toEqual([[40, 25, 1.5]]);
    expect(engine.strokeCount).toBe(1);
  });

  it("keeps the stroke on pointercancel (graceful end)", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    engine.ingest({ type: "move", x: 10, y: 0, time: 10 });
    engine.ingest({ type: "cancel", x: NaN, y: NaN, time: NaN });
    expect(engine.strokeCount).toBe(1);
    expect(engine.toJSON().strokes[0].points).toHaveLength(2);
  });

  it("ignores move/up/cancel without an active stroke", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    engine.ingest({ type: "move", x: 1, y: 1, time: 1 });
    engine.ingest({ type: "up", x: 1, y: 1, time: 1 });
    engine.ingest({ type: "cancel", x: 1, y: 1, time: 1 });
    expect(engine.isEmpty).toBe(true);
    expect(engine.canUndo).toBe(false);
  });

  it("enforces the single-active-pointer policy through ingest", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const begins = vi.fn();
    engine.onBegin(begins);
    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    engine.ingest({ type: "down", x: 50, y: 50, time: 5 }); // second down ignored
    expect(begins).toHaveBeenCalledTimes(1);
    engine.ingest({ type: "up", x: 0, y: 0, time: 10 });
    expect(engine.strokeCount).toBe(1);
  });

  it("filters pointer types via acceptPointerTypes", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas, { acceptPointerTypes: ["pen"] });
    engine.ingest({ type: "down", x: 0, y: 0, time: 0, pointerType: "mouse" });
    expect(engine.canUndo).toBe(false);
    engine.ingest({ type: "down", x: 0, y: 0, time: 0, pointerType: "pen" });
    engine.ingest({ type: "up", x: 0, y: 0, time: 10, pointerType: "pen" });
    expect(engine.strokeCount).toBe(1);
    expect(engine.toJSON().strokes[0].pointerType).toBe("pen");
  });

  it("treats unknown pointer types as mouse", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas, { acceptPointerTypes: ["mouse"] });
    engine.ingest({ type: "down", x: 0, y: 0, time: 0, pointerType: "gamepad" });
    engine.ingest({ type: "up", x: 0, y: 0, time: 10 });
    expect(engine.strokeCount).toBe(1);
    expect(engine.toJSON().strokes[0].pointerType).toBe("mouse");
  });

  it("guards NaN/Infinity input samples (never poisons geometry)", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    engine.ingest({ type: "down", x: NaN, y: 0, time: 0 }); // rejected → no stroke
    expect(engine.canUndo).toBe(false);

    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    engine.ingest({ type: "move", x: Infinity, y: 0, time: 5 }); // dropped
    engine.ingest({ type: "move", x: 10, y: 0, time: 10, pressure: NaN }); // pressure → 0
    engine.ingest({ type: "up", x: 20, y: NaN, time: 20 }); // point not added, still commits
    expect(engine.strokeCount).toBe(1);
    const pts = engine.toJSON().strokes[0].points;
    expect(pts.map((p) => p.x)).toEqual([0, 10]);
    expect(pts[1].pressure).toBe(0);
    for (const p of pts) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(Number.isFinite(p.time)).toBe(true);
    }
  });

  it("ignores unknown sample types (defensive for untyped consumers)", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    engine.ingest({ type: "hover" as never, x: 0, y: 0, time: 0 });
    expect(engine.isEmpty).toBe(true);
  });

  it("clamps ingest pressure into [0, 1]", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    engine.ingest({ type: "down", x: 0, y: 0, time: 0, pressure: 7 });
    engine.ingest({ type: "up", x: 0, y: 0, time: 10 });
    expect(engine.toJSON().strokes[0].points[0].pressure).toBe(1);
  });

  it("falls back to defaults for NaN numeric options (dot radius check)", () => {
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas, {
      minWidth: NaN,
      maxWidth: NaN,
      minDistance: NaN,
      velocityFilterWeight: NaN,
    });
    const base = calls.length;
    engine.ingest({ type: "down", x: 5, y: 5, time: 0 });
    engine.ingest({ type: "up", x: 5, y: 5, time: 10 });
    expect(arcsOf(calls, base)).toEqual([[5, 5, 1.5]]); // (0.5+2.5)/2 defaults
  });
});

// ── Notifications ────────────────────────────────────────────────────

describe("edge-only notifications", () => {
  it("fires onBegin once per stroke, onChange exactly once at commit, never per point", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const order: string[] = [];
    engine.onBegin(() => order.push("begin"));
    engine.onEnd(() => order.push("end"));
    engine.onChange(() => order.push("change"));

    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    expect(order).toEqual(["begin"]);
    for (let i = 1; i <= 8; i++) {
      engine.ingest({ type: "move", x: i * 10, y: 0, time: i * 10 });
    }
    expect(order).toEqual(["begin"]); // zero change notifications mid-stroke
    engine.ingest({ type: "up", x: 90, y: 0, time: 90 });
    expect(order).toEqual(["begin", "end", "change"]); // end before change
  });

  it("fires onChange once per undo/redo/clear and not for no-ops", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const change = vi.fn();
    engine.onChange(change);

    engine.undo(); // nothing to undo
    engine.redo(); // nothing to redo
    engine.clear(); // already empty
    expect(change).not.toHaveBeenCalled();

    strokeVia(engine, LINE);
    expect(change).toHaveBeenCalledTimes(1);
    engine.undo();
    expect(change).toHaveBeenCalledTimes(2);
    engine.redo();
    expect(change).toHaveBeenCalledTimes(3);
    engine.clear();
    expect(change).toHaveBeenCalledTimes(4);
  });

  it("passes the engine to onChange listeners", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    let seen: SignatureEngine | null = null;
    engine.onChange((e) => {
      seen = e;
    });
    strokeVia(engine, LINE);
    expect(seen).toBe(engine);
  });

  it("supports unsubscribe on all three subscriptions", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const change = vi.fn();
    const begin = vi.fn();
    const end = vi.fn();
    engine.onChange(change)();
    engine.onBegin(begin)();
    engine.onEnd(end)();
    strokeVia(engine, LINE);
    expect(change).not.toHaveBeenCalled();
    expect(begin).not.toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });

  it("isolates a throwing listener (logged; co-listeners unaffected)", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const second = vi.fn();
    engine.onChange(() => {
      throw new Error("consumer bug");
    });
    engine.onChange(second);
    engine.onBegin(() => {
      throw new Error("consumer bug in begin");
    });
    strokeVia(engine, LINE);
    expect(second).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    expect(engine.strokeCount).toBe(1); // pipeline unaffected
  });

  it("tolerates re-entrant unsubscription during dispatch", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const calls: string[] = [];
    const offA = engine.onChange(() => {
      calls.push("a");
      offA();
    });
    engine.onChange(() => calls.push("b"));
    strokeVia(engine, LINE);
    strokeVia(engine, LINE.map(([x, y, t]) => [x, y + 40, t + 200]) as typeof LINE);
    expect(calls).toEqual(["a", "b", "b"]);
  });
});

// ── History ──────────────────────────────────────────────────────────

describe("history", () => {
  function twoStrokes(engine: SignatureEngine): void {
    strokeVia(engine, LINE);
    strokeVia(engine, LINE.map(([x, y, t]) => [x + 50, y + 30, t + 100]) as typeof LINE);
  }

  it("undoes and redoes stroke-by-stroke", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    twoStrokes(engine);
    expect(engine.strokeCount).toBe(2);

    engine.undo();
    expect(engine.strokeCount).toBe(1);
    expect(engine.canRedo).toBe(true);
    engine.undo();
    expect(engine.isEmpty).toBe(true);
    expect(engine.canUndo).toBe(false);

    engine.redo();
    engine.redo();
    expect(engine.strokeCount).toBe(2);
    expect(engine.canRedo).toBe(false);
  });

  it("restores the same stroke data after undo → redo", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    strokeVia(engine, LINE);
    const before = engine.toJSON();
    engine.undo();
    engine.redo();
    expect(engine.toJSON()).toEqual(before);
  });

  it("clears as a single undoable action restoring all strokes", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    twoStrokes(engine);
    const before = engine.toJSON();

    engine.clear();
    expect(engine.isEmpty).toBe(true);
    expect(engine.canUndo).toBe(true);

    engine.undo(); // ONE undo restores both strokes
    expect(engine.strokeCount).toBe(2);
    expect(engine.toJSON()).toEqual(before);

    engine.redo(); // redo the clear
    expect(engine.isEmpty).toBe(true);
    engine.undo();
    expect(engine.strokeCount).toBe(2);
  });

  it("interleaves clear and add entries correctly on the undo stack", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    strokeVia(engine, LINE); // s1
    engine.clear();
    strokeVia(engine, LINE); // s2
    expect(engine.strokeCount).toBe(1);

    engine.undo(); // undo add s2
    expect(engine.isEmpty).toBe(true);
    engine.undo(); // undo clear → s1 back
    expect(engine.strokeCount).toBe(1);
    engine.undo(); // undo add s1
    expect(engine.isEmpty).toBe(true);
    expect(engine.canUndo).toBe(false);
  });

  it("invalidates redo on a new stroke and on clear", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    twoStrokes(engine);
    engine.undo();
    expect(engine.canRedo).toBe(true);
    strokeVia(engine, LINE.map(([x, y, t]) => [x, y + 60, t + 300]) as typeof LINE);
    expect(engine.canRedo).toBe(false);

    engine.undo();
    expect(engine.canRedo).toBe(true);
    engine.clear();
    expect(engine.canRedo).toBe(false);
  });

  it("clear on an empty pad is a silent no-op (no phantom history entry)", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    engine.clear();
    expect(engine.canUndo).toBe(false);
  });

  it("undo during an active stroke keeps the live ink and commits it after", () => {
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    strokeVia(engine, LINE); // committed stroke A

    // Start stroke B and get some of it drawn.
    const markB = calls.length;
    engine.ingest({ type: "down", x: 100, y: 100, time: 500 });
    engine.ingest({ type: "move", x: 110, y: 100, time: 510 });
    engine.ingest({ type: "move", x: 120, y: 100, time: 520 });
    const liveB = arcsOf(calls, markB);
    expect(liveB.length).toBeGreaterThan(0);

    const mark = calls.length;
    engine.undo(); // removes A mid-stroke
    expect(engine.strokeCount).toBe(0);
    // The replay must still include B's live ink (no visual vanishing).
    expect(arcsOf(calls, mark)).toEqual(liveB);

    engine.ingest({ type: "up", x: 130, y: 100, time: 530 });
    expect(engine.strokeCount).toBe(1); // B committed normally
  });

  it("clear during an active stroke clears committed ink only; the stroke still commits", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    strokeVia(engine, LINE); // committed stroke A

    engine.ingest({ type: "down", x: 100, y: 100, time: 500 });
    engine.ingest({ type: "move", x: 110, y: 100, time: 510 });
    engine.clear();
    expect(engine.isEmpty).toBe(true); // A cleared
    engine.ingest({ type: "up", x: 120, y: 100, time: 520 });
    expect(engine.strokeCount).toBe(1); // live stroke committed after
    engine.undo(); // undo the add
    engine.undo(); // undo the clear → A restored
    expect(engine.strokeCount).toBe(1);
    expect(engine.toJSON().strokes[0].points[0].x).toBe(LINE[0][0]);
  });

  it("full replay redraws exactly the remaining strokes after undo", () => {
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const base = calls.length;
    strokeVia(engine, LINE);
    const oneStrokeArcs = arcsOf(calls, base);

    strokeVia(engine, LINE.map(([x, y, t]) => [x + 50, y + 30, t + 100]) as typeof LINE);
    const mark = calls.length;
    engine.undo(); // removes stroke 2 → replay draws stroke 1 only
    expect(countOf(calls, "clearRect", mark)).toBe(1);
    expect(arcsOf(calls, mark)).toEqual(oneStrokeArcs);
  });
});

// ── Determinism & replay parity ──────────────────────────────────────

describe("determinism", () => {
  it("identical ingest sequences produce identical toJSON and identical draw geometry", () => {
    const a = makeCanvas();
    const b = makeCanvas();
    const engineA = createSignatureEngine(a.canvas);
    const engineB = createSignatureEngine(b.canvas);
    const baseA = a.calls.length;
    const baseB = b.calls.length;

    for (const engine of [engineA, engineB]) {
      strokeVia(engine, LINE, { pointerType: "pen", pressure: 0.6 });
      engine.ingest({ type: "down", x: 80, y: 40, time: 200 });
      engine.ingest({ type: "up", x: 80, y: 40, time: 260 }); // dot stroke
    }

    expect(engineA.toJSON()).toEqual(engineB.toJSON());
    expect(arcsOf(a.calls, baseA)).toEqual(arcsOf(b.calls, baseB));
  });

  it("incremental drawing and full replay produce identical geometry", () => {
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const base = calls.length;

    strokeVia(engine, LINE); // varying speeds
    engine.ingest({ type: "down", x: 100, y: 60, time: 300 });
    engine.ingest({ type: "up", x: 100, y: 60, time: 340 }); // dot
    const live = arcsOf(calls, base);

    const mark = calls.length;
    engine.resize(); // full deterministic replay
    expect(arcsOf(calls, mark)).toEqual(live);
  });

  it("JSON round-trip replays to identical geometry and data", () => {
    const a = makeCanvas();
    const engineA = createSignatureEngine(a.canvas);
    strokeVia(engineA, LINE, { pointerType: "pen", pressure: 0.4 });
    const data = engineA.toJSON();
    const liveArcs = arcsOf(a.calls, 0).slice(); // includes construction (none)

    const b = makeCanvas();
    const engineB = createSignatureEngine(b.canvas);
    const baseB = b.calls.length;
    engineB.fromJSON(data);
    expect(engineB.toJSON()).toEqual(data);
    expect(arcsOf(b.calls, baseB)).toEqual(liveArcs);
  });

  it("round-trips identically onto an engine with DIFFERENT options (self-contained strokes)", () => {
    const a = makeCanvas();
    const engineA = createSignatureEngine(a.canvas, {
      minWidth: 1,
      maxWidth: 4,
      velocityFilterWeight: 0.3,
      pressure: "auto",
      penColor: "#123456",
    });
    strokeVia(engineA, LINE, { pointerType: "pen", pressure: 0.6 });
    const data = engineA.toJSON();
    const liveArcs = arcsOf(a.calls, 0).slice();

    // Radically different restoring engine — stored per-stroke params
    // must fully determine the replayed geometry.
    const b = makeCanvas();
    const engineB = createSignatureEngine(b.canvas, {
      minWidth: 0.1,
      maxWidth: 9,
      velocityFilterWeight: 1,
      pressure: "ignore",
      penColor: "#abcdef",
    });
    const baseB = b.calls.length;
    engineB.fromJSON(data);
    expect(engineB.toJSON()).toEqual(data);
    expect(arcsOf(b.calls, baseB)).toEqual(liveArcs);
    // And the SVG twin agrees too.
    expect(engineB.toSVG()).toBe(engineA.toSVG());
  });
});

// ── JSON ─────────────────────────────────────────────────────────────

describe("toJSON / fromJSON", () => {
  it("snapshots a versioned document with the CSS-px canvas size", () => {
    const { canvas } = makeCanvas({ width: 400, height: 200 });
    const engine = createSignatureEngine(canvas);
    const data = engine.toJSON();
    expect(data).toEqual({ v: 1, width: 400, height: 200, strokes: [] });
  });

  it("returns deep copies — mutating the snapshot never affects the engine", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    strokeVia(engine, LINE);
    const data = engine.toJSON();
    data.strokes[0].points[0].x = 9999;
    data.strokes.pop();
    expect(engine.toJSON().strokes).toHaveLength(1);
    expect(engine.toJSON().strokes[0].points[0].x).toBe(0);
  });

  it("fromJSON replaces state, resets history, and notifies once", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    strokeVia(engine, LINE);
    const data = engine.toJSON();

    const target = makeCanvas();
    const engineB = createSignatureEngine(target.canvas);
    strokeVia(engineB, LINE.map(([x, y, t]) => [x + 5, y, t] as [number, number, number]));
    const change = vi.fn();
    engineB.onChange(change);
    engineB.fromJSON(data);
    expect(change).toHaveBeenCalledTimes(1);
    expect(engineB.toJSON()).toEqual({ ...data, width: 300, height: 150 });
    expect(engineB.canUndo).toBe(false); // history reset
    expect(engineB.canRedo).toBe(false);
  });

  it("fromJSON drops an in-progress stroke (document replaced wholesale)", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    engine.ingest({ type: "move", x: 10, y: 0, time: 10 });
    engine.fromJSON({ v: 1, width: 300, height: 150, strokes: [] });
    engine.ingest({ type: "up", x: 20, y: 0, time: 20 }); // no active stroke anymore
    expect(engine.isEmpty).toBe(true);
  });

  it("fromJSON releases the physical pointer of a dropped real-event stroke", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    firePointer(canvas, "pointerdown", { pointerId: 6 });
    engine.fromJSON({ v: 1, width: 300, height: 150, strokes: [] });
    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(6);
    firePointer(canvas, "pointerup", { pointerId: 6 }); // straggler up is inert
    expect(engine.isEmpty).toBe(true);
  });

  it("fromJSON throws on unsupported versions and malformed shapes", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    expect(() => engine.fromJSON(null as never)).toThrow(TypeError);
    expect(() => engine.fromJSON({} as never)).toThrow(TypeError);
    expect(() =>
      engine.fromJSON({ v: 2, width: 0, height: 0, strokes: [] } as never),
    ).toThrow(/unsupported version 2/);
  });

  it("fromJSON tolerates unknown fields and sanitizes degenerate strokes/points", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const data = {
      v: 1,
      width: 300,
      height: 150,
      future: "field",
      strokes: [
        null, // dropped
        { points: "nope" }, // dropped
        {
          points: [
            { x: 1, y: 2, time: 3, pressure: 0.5, extra: true },
            { x: NaN, y: 2, time: 3, pressure: 0 }, // dropped point
            { x: 4, y: 5, time: 6, pressure: NaN }, // pressure → 0
          ],
          color: 7, // → default color
          minWidth: NaN, // → engine default
          maxWidth: -1, // → raised to minWidth
          pointerType: "gamepad", // → mouse
        },
        { points: [{ x: NaN, y: NaN, time: NaN, pressure: 0 }] }, // all points dropped → stroke dropped
      ],
    };
    engine.fromJSON(data as never);
    expect(engine.strokeCount).toBe(1);
    const stroke = engine.toJSON().strokes[0];
    expect(stroke.points.map((p) => p.x)).toEqual([1, 4]);
    expect(stroke.points[1].pressure).toBe(0);
    expect(stroke.color).toBe("#1e293b");
    expect(stroke.minWidth).toBe(0.5);
    expect(stroke.maxWidth).toBe(0.5);
    expect(stroke.pointerType).toBe("mouse");
    // Missing self-contained params fall back to the restoring engine's
    // options (defaults here).
    expect(stroke.velocityFilterWeight).toBe(0.7);
    expect(stroke.pressure).toBe("auto");
  });

  it("preserves stored per-stroke width params over the restoring engine's options", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas, {
      velocityFilterWeight: 0.9,
      pressure: "ignore",
    });
    const data = {
      v: 1,
      width: 300,
      height: 150,
      strokes: [
        {
          points: [{ x: 1, y: 2, time: 3, pressure: 0.5 }],
          color: "#000",
          minWidth: 1,
          maxWidth: 3,
          velocityFilterWeight: 0.25,
          pressure: "auto",
          pointerType: "pen",
        },
        {
          // degenerate stored values → engine options as fallback
          points: [{ x: 9, y: 9, time: 9, pressure: 0 }],
          color: "#000",
          minWidth: 1,
          maxWidth: 3,
          velocityFilterWeight: NaN,
          pressure: "weird",
          pointerType: "pen",
        },
      ],
    };
    engine.fromJSON(data as never);
    const [kept, fallback] = engine.toJSON().strokes;
    expect(kept.velocityFilterWeight).toBe(0.25);
    expect(kept.pressure).toBe("auto");
    expect(fallback.velocityFilterWeight).toBe(0.9);
    expect(fallback.pressure).toBe("ignore");
  });
});

// ── Resize & ResizeObserver ──────────────────────────────────────────

describe("resize", () => {
  it("preserves strokes at their CSS-px coordinates (no scaling)", () => {
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const base = calls.length;
    strokeVia(engine, LINE);
    const live = arcsOf(calls, base);

    Object.defineProperty(canvas, "clientWidth", { value: 500, configurable: true });
    Object.defineProperty(canvas, "clientHeight", { value: 250, configurable: true });
    const mark = calls.length;
    engine.resize();
    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(250);
    expect(arcsOf(calls, mark)).toEqual(live); // identical geometry, new store
  });

  it("redraws the in-progress stroke's ink too", () => {
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const base = calls.length;
    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    engine.ingest({ type: "move", x: 10, y: 0, time: 10 });
    engine.ingest({ type: "move", x: 20, y: 0, time: 20 }); // first segment drawn
    const live = arcsOf(calls, base);
    expect(live.length).toBeGreaterThan(0);

    const mark = calls.length;
    engine.resize();
    expect(arcsOf(calls, mark)).toEqual(live);
    engine.ingest({ type: "up", x: 30, y: 0, time: 30 });
    expect(engine.strokeCount).toBe(1);
  });

  it("owns a ResizeObserver: observes the canvas, redraws on resize, disconnects on destroy", () => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const ro = MockResizeObserver.instances[0];
    expect(ro.observed).toEqual([canvas]);

    const mark = calls.length;
    ro.callback();
    expect(countOf(calls, "setTransform", mark)).toBe(1); // resized + redrawn

    engine.destroy();
    expect(ro.disconnected).toBe(true);
    const afterDestroy = calls.length;
    ro.callback(); // straggler notification after destroy
    expect(calls.length).toBe(afterDestroy); // no redraw
  });
});

// ── Read-only ────────────────────────────────────────────────────────

describe("readOnly", () => {
  it("starts with input detached when readOnly: true (ingest ignored, no listeners)", () => {
    const { canvas } = makeCanvas();
    const addSpy = vi.spyOn(canvas, "addEventListener");
    const engine = createSignatureEngine(canvas, { readOnly: true });
    expect(addSpy.mock.calls.filter(([type]) => String(type).startsWith("pointer"))).toHaveLength(
      0,
    );
    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    engine.ingest({ type: "up", x: 0, y: 0, time: 10 });
    expect(engine.isEmpty).toBe(true);
  });

  it("everything except input keeps working while read-only", () => {
    const source = makeCanvas();
    const engineA = createSignatureEngine(source.canvas);
    strokeVia(engineA, LINE);
    const data = engineA.toJSON();

    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas, { readOnly: true });
    engine.fromJSON(data); // restore works
    expect(engine.strokeCount).toBe(1);
    engine.clear(); // history works
    expect(engine.isEmpty).toBe(true);
    engine.undo();
    expect(engine.strokeCount).toBe(1);
    engine.resize(); // canvas mgmt works
  });

  it("setReadOnly(true) mid-stroke commits the stroke gracefully", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const change = vi.fn();
    engine.onChange(change);
    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    engine.ingest({ type: "move", x: 10, y: 0, time: 10 });
    engine.setReadOnly(true);
    expect(engine.strokeCount).toBe(1); // stroke kept
    expect(change).toHaveBeenCalledTimes(1);
    engine.ingest({ type: "down", x: 50, y: 50, time: 100 });
    expect(engine.strokeCount).toBe(1); // input now detached
  });

  it("setReadOnly(false) re-attaches input; same-value calls are no-ops", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas, { readOnly: true });
    engine.setReadOnly(true); // no-op
    engine.setReadOnly(false);
    strokeVia(engine, LINE);
    expect(engine.strokeCount).toBe(1);
    engine.setReadOnly(false); // no-op
    strokeVia(engine, LINE.map(([x, y, t]) => [x, y + 40, t + 100]) as typeof LINE);
    expect(engine.strokeCount).toBe(2);
  });
});

// ── Real pointer events ──────────────────────────────────────────────

describe("real pointer pipeline", () => {
  it("normalizes pointer events into the same ingest path (rect offset applied)", () => {
    const { canvas } = makeCanvas();
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 20,
      right: 310,
      bottom: 170,
      width: 300,
      height: 150,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    } as DOMRect);
    const engine = createSignatureEngine(canvas);

    firePointer(canvas, "pointerdown", { clientX: 10, clientY: 20 });
    firePointer(canvas, "pointermove", { clientX: 30, clientY: 20 });
    firePointer(canvas, "pointerup", { clientX: 30, clientY: 20 });

    expect(engine.strokeCount).toBe(1);
    const pts = engine.toJSON().strokes[0].points;
    expect(pts[0].x).toBe(0); // 10 − rect.left
    expect(pts[0].y).toBe(0);
    expect(pts[1].x).toBe(20);
  });

  it("captures the pointer on down and prevents default", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const down = firePointer(canvas, "pointerdown", { pointerId: 7 });
    expect(canvas.setPointerCapture).toHaveBeenCalledWith(7);
    expect(down.defaultPrevented).toBe(true);
    firePointer(canvas, "pointerup", { pointerId: 7 });
    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(7);
    expect(engine.strokeCount).toBe(1);
  });

  it("ignores concurrent pointers while one is drawing (palm rejection)", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    firePointer(canvas, "pointerdown", { pointerId: 1, clientX: 0 });
    firePointer(canvas, "pointerdown", { pointerId: 2, clientX: 90 }); // palm — ignored
    firePointer(canvas, "pointermove", { pointerId: 2, clientX: 95 }); // ignored
    firePointer(canvas, "pointercancel", { pointerId: 2 }); // ignored
    firePointer(canvas, "pointerup", { pointerId: 2, clientX: 95 }); // ignored
    firePointer(canvas, "pointermove", { pointerId: 1, clientX: 40 });
    firePointer(canvas, "pointerup", { pointerId: 1, clientX: 40 });
    expect(engine.strokeCount).toBe(1);
    expect(engine.toJSON().strokes[0].points.map((p) => p.x)).toEqual([0, 40]);
  });

  it("requires the primary button for mouse strokes (right/middle click never inks)", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const begins = vi.fn();
    engine.onBegin(begins);

    const rightClick = firePointer(canvas, "pointerdown", { button: 2 });
    firePointer(canvas, "pointerup", { button: 2 });
    expect(begins).not.toHaveBeenCalled();
    expect(engine.isEmpty).toBe(true);
    // The context menu must not be swallowed over the pad.
    expect(rightClick.defaultPrevented).toBe(false);
    expect(canvas.setPointerCapture).not.toHaveBeenCalled();

    const middleClick = firePointer(canvas, "pointerdown", { button: 1 });
    expect(middleClick.defaultPrevented).toBe(false);
    expect(engine.isEmpty).toBe(true);

    // Primary button still draws; pen/touch are unaffected by their
    // (always-0) button value.
    firePointer(canvas, "pointerdown", { button: 0 });
    firePointer(canvas, "pointerup", { button: 0 });
    expect(engine.strokeCount).toBe(1);
  });

  it("captures point times from the EVENT timeStamp, not handler-run time", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    // Burst-dispatch (same tick) with distinct event timestamps — the
    // stored times must be the stamps, keeping velocity (and width)
    // correct under main-thread jank.
    firePointer(canvas, "pointerdown", { clientX: 0, timeStamp: 1000 });
    firePointer(canvas, "pointermove", { clientX: 20, timeStamp: 1016 });
    firePointer(canvas, "pointerup", { clientX: 40, timeStamp: 1032 });
    const pts = engine.toJSON().strokes[0].points;
    expect(pts.map((p) => p.time)).toEqual([1000, 1016, 1032]);
  });

  it("falls back to a live clock for degenerate event timeStamps", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    firePointer(canvas, "pointerdown", { clientX: 0, timeStamp: NaN });
    firePointer(canvas, "pointerup", { clientX: 0, timeStamp: NaN });
    const pts = engine.toJSON().strokes[0].points;
    expect(Number.isFinite(pts[0].time)).toBe(true);
  });

  it("releases pointer capture when input detaches mid-stroke (setReadOnly/destroy)", () => {
    const a = makeCanvas();
    const engineA = createSignatureEngine(a.canvas);
    firePointer(a.canvas, "pointerdown", { pointerId: 9 });
    engineA.setReadOnly(true);
    expect(a.canvas.releasePointerCapture).toHaveBeenCalledWith(9);
    expect(engineA.strokeCount).toBe(1); // committed gracefully

    const b = makeCanvas();
    const engineB = createSignatureEngine(b.canvas);
    firePointer(b.canvas, "pointerdown", { pointerId: 4 });
    engineB.destroy();
    expect(b.canvas.releasePointerCapture).toHaveBeenCalledWith(4);
  });

  it("does not capture the pointer when the down is rejected (type filter)", () => {
    const { canvas } = makeCanvas();
    createSignatureEngine(canvas, { acceptPointerTypes: ["pen"] });
    firePointer(canvas, "pointerdown", { pointerType: "mouse" });
    expect(canvas.setPointerCapture).not.toHaveBeenCalled();
  });

  it("survives a throwing setPointerCapture (jsdom/detached canvas)", () => {
    const { canvas } = makeCanvas();
    (canvas as unknown as { setPointerCapture: unknown }).setPointerCapture = () => {
      throw new Error("no capture");
    };
    (canvas as unknown as { releasePointerCapture: unknown }).releasePointerCapture = () => {
      throw new Error("no capture");
    };
    const engine = createSignatureEngine(canvas);
    firePointer(canvas, "pointerdown", {});
    firePointer(canvas, "pointerup", {});
    expect(engine.strokeCount).toBe(1);
  });

  it("ends the stroke gracefully on pointercancel, keeping the ink", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    firePointer(canvas, "pointerdown", { clientX: 0 });
    firePointer(canvas, "pointermove", { clientX: 30 });
    firePointer(canvas, "pointercancel", {});
    expect(engine.strokeCount).toBe(1);
  });
});

// ── Destroy ──────────────────────────────────────────────────────────

describe("destroy", () => {
  it("is idempotent and detaches all pointer listeners", () => {
    const { canvas } = makeCanvas();
    const removeSpy = vi.spyOn(canvas, "removeEventListener");
    const engine = createSignatureEngine(canvas);
    engine.destroy();
    engine.destroy(); // second call no-ops
    const pointerRemovals = removeSpy.mock.calls.filter(([type]) =>
      String(type).startsWith("pointer"),
    );
    expect(pointerRemovals).toHaveLength(4);
  });

  it("restores the canvas's previous touch-action", () => {
    const { canvas } = makeCanvas();
    canvas.style.touchAction = "pan-y";
    const engine = createSignatureEngine(canvas);
    expect(canvas.style.touchAction).toBe("none");
    engine.destroy();
    expect(canvas.style.touchAction).toBe("pan-y");
  });

  it("makes every further call a no-op and releases subscriptions", () => {
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    strokeVia(engine, LINE);
    const change = vi.fn();
    engine.onChange(change);
    engine.destroy();

    const mark = calls.length;
    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    engine.ingest({ type: "up", x: 0, y: 0, time: 10 });
    engine.clear();
    engine.undo();
    engine.redo();
    engine.resize();
    engine.setReadOnly(true);
    engine.fromJSON({ v: 1, width: 300, height: 150, strokes: [] });
    expect(calls.length).toBe(mark); // zero canvas work after destroy
    expect(change).not.toHaveBeenCalled();
    expect(engine.strokeCount).toBe(1); // state frozen, introspection still safe
  });

  it("drops an in-progress stroke silently (nothing fires after destroy)", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    const end = vi.fn();
    engine.onEnd(end);
    engine.ingest({ type: "down", x: 0, y: 0, time: 0 });
    engine.destroy();
    expect(end).not.toHaveBeenCalled();
    expect(engine.strokeCount).toBe(0);
  });
});

// ── renderUnderlay seam ──────────────────────────────────────────────

describe("renderUnderlay", () => {
  it("draws on every full redraw, beneath the strokes, save/restore-wrapped", () => {
    const { canvas, calls } = makeCanvas();
    const underlay = vi.fn((ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    });
    const engine = createSignatureEngine(canvas, { renderUnderlay: underlay });
    expect(underlay).toHaveBeenCalledTimes(1); // construction redraw
    expect(underlay).toHaveBeenCalledWith(expect.anything(), 300, 150);

    strokeVia(engine, LINE);
    expect(underlay).toHaveBeenCalledTimes(1); // never during incremental input

    const mark = calls.length;
    engine.undo(); // full replay
    expect(underlay).toHaveBeenCalledTimes(2);
    engine.resize();
    expect(underlay).toHaveBeenCalledTimes(3);

    // Beneath the ink: in a replay the underlay's stroke() precedes any arc.
    engine.redo();
    const replay = calls.slice(mark);
    const strokeIdx = replay.findIndex((c) => c.method === "stroke");
    const arcIdx = replay.findIndex((c) => c.method === "arc");
    expect(strokeIdx).toBeGreaterThanOrEqual(0);
    expect(arcIdx).toBeGreaterThan(strokeIdx);
    // Context isolated around the hook.
    expect(countOf(replay, "save")).toBeGreaterThan(0);
    expect(countOf(replay, "restore")).toBe(countOf(replay, "save"));
  });

  it("is excluded from PNG export replays by construction", async () => {
    const { canvas } = makeCanvas();
    const underlay = vi.fn((ctx: CanvasRenderingContext2D) => {
      ctx.lineTo(1, 1);
      ctx.stroke();
    });
    const engine = createSignatureEngine(canvas, { renderUnderlay: underlay });
    strokeVia(engine, LINE);
    underlay.mockClear();

    const { calls } = interceptOffscreen();
    await engine.toPNG();
    expect(underlay).not.toHaveBeenCalled();
    expect(countOf(calls, "lineTo")).toBe(0);
    expect(countOf(calls, "stroke")).toBe(0);
    // ...and the SVG twin has no underlay artifacts either (ink only).
    expect(engine.toSVG()).not.toContain("<line");
  });

  it("isolates a throwing underlay (logged; replay continues)", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { canvas, calls } = makeCanvas();
    const engine = createSignatureEngine(canvas, {
      renderUnderlay: () => {
        throw new Error("consumer bug");
      },
    });
    strokeVia(engine, LINE);
    const mark = calls.length;
    engine.undo();
    engine.redo(); // replay still draws the ink
    expect(arcsOf(calls, mark).length).toBeGreaterThan(0);
    expect(consoleError).toHaveBeenCalled();
    // restore still ran (finally) — no leaked context state.
    expect(countOf(calls, "restore")).toBe(countOf(calls, "save"));
  });
});

// ── Exports (Phase 2) ────────────────────────────────────────────────

/**
 * Intercept the offscreen canvas `toPNG` creates. Must be installed
 * AFTER the engine's own canvas is made (makeCanvas also creates one).
 */
function interceptOffscreen() {
  const { ctx, calls } = createMockCtx();
  const off = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toDataURL: () => "data:image/png;base64,QUJD",
  };
  const original = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((tag: string) =>
    tag === "canvas" ? (off as unknown as HTMLElement) : original(tag)) as never);
  return { off, calls };
}

describe("exports (engine wiring)", () => {
  it("sanitizes the engine background ONCE — screen and exports always agree", async () => {
    // A safe background paints everywhere.
    const b = makeCanvas();
    const engineB = createSignatureEngine(b.canvas, { background: "#fff" });
    expect(countOf(b.calls, "fillRect")).toBe(1);
    expect(engineB.toSVG()).toContain("<rect");

    // Unsafe background → transparent on the live canvas AND in exports.
    const a = makeCanvas();
    const engineA = createSignatureEngine(a.canvas, { background: "url(//evil.example/x)" });
    expect(countOf(a.calls, "fillRect")).toBe(0); // nothing painted on screen
    engineA.ingest({ type: "down", x: 10, y: 20, time: 0 });
    engineA.ingest({ type: "up", x: 10, y: 20, time: 50 });
    expect(engineA.toSVG()).not.toContain("<rect");
    // (interceptOffscreen must come last — it hijacks createElement.)
    const { calls: offCalls } = interceptOffscreen();
    await engineA.toPNG();
    expect(countOf(offCalls, "fillRect")).toBe(0);
  });

  it("toSVG serializes the committed strokes with the engine's background default", () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas, { background: "#eee" });
    engine.ingest({ type: "down", x: 10, y: 20, time: 0 });
    engine.ingest({ type: "up", x: 10, y: 20, time: 50 }); // dot
    const svg = engine.toSVG();
    expect(svg).toContain("<circle");
    expect(svg).toContain('fill="#eee"'); // engine background as default
    expect(engine.toSVG({ background: "#fff" })).toContain('fill="#fff"'); // override
  });

  it("exports exclude an in-progress stroke (committed strokes only)", async () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    engine.ingest({ type: "down", x: 10, y: 20, time: 0 });
    engine.ingest({ type: "move", x: 30, y: 20, time: 10 });
    engine.ingest({ type: "move", x: 50, y: 20, time: 20 }); // live ink drawn

    expect(engine.toSVG()).not.toContain("<path"); // nothing committed
    const { off } = interceptOffscreen();
    await engine.toPNG();
    expect(off.width).toBe(1); // empty-artifact path
    expect(off.height).toBe(1);
  });

  it("toPNG renders the committed strokes offscreen and resolves dataURL + blob", async () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    strokeVia(engine, LINE);
    const { off, calls } = interceptOffscreen();
    const { dataURL, blob } = await engine.toPNG();
    expect(dataURL).toMatch(/^data:image\/png/);
    expect(blob.type).toBe("image/png");
    expect(countOf(calls, "arc")).toBeGreaterThan(0); // ink replayed offscreen
    expect(off.width).toBeGreaterThan(1);
  });

  it("exports still work after destroy (pure reads on the frozen state)", async () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    engine.ingest({ type: "down", x: 10, y: 20, time: 0 });
    engine.ingest({ type: "up", x: 10, y: 20, time: 50 });
    engine.destroy();
    expect(engine.toSVG()).toContain("<circle");
    const { off } = interceptOffscreen();
    await expect(engine.toPNG()).resolves.toBeTruthy();
    expect(off.width).toBeGreaterThan(1);
  });

  it("PNG trim box ≈ SVG viewBox ≈ inkBounds (cross-parity)", async () => {
    const { canvas } = makeCanvas();
    const engine = createSignatureEngine(canvas);
    strokeVia(engine, LINE);
    strokeVia(engine, [
      [60, 40, 100],
      [80, 55, 120],
      [95, 45, 140],
    ]);
    const bounds = inkBounds(engine.toJSON().strokes)!;

    // SVG viewBox = bounds inflated by the default padding (8).
    const svg = engine.toSVG();
    const vb = /viewBox="([^"]+)"/.exec(svg)![1].split(" ").map(Number);
    expect(vb[0]).toBeCloseTo(bounds.x - 8, 2);
    expect(vb[1]).toBeCloseTo(bounds.y - 8, 2);
    expect(vb[2]).toBeCloseTo(bounds.width + 16, 2);
    expect(vb[3]).toBeCloseTo(bounds.height + 16, 2);

    // PNG backing store = the same box × scale (1), rounded.
    const { off, calls } = interceptOffscreen();
    await engine.toPNG();
    expect(off.width).toBe(Math.max(1, Math.round(bounds.width + 16)));
    expect(off.height).toBe(Math.max(1, Math.round(bounds.height + 16)));
    const transform = calls.find((c) => c.method === "setTransform")!.args as number[];
    expect(transform[4]).toBeCloseTo(-(bounds.x - 8), 6);
    expect(transform[5]).toBeCloseTo(-(bounds.y - 8), 6);
  });
});
