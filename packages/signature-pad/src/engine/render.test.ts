import { describe, expect, it } from "vitest";
import type { SignatureStroke } from "../types";
import { strokeSteps } from "../ink/strokeWalker";
import { clearAndFill, drawSteps, replayStrokes } from "./render";

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
    arc: record("arc"),
    fill: record("fill"),
    clearRect: record("clearRect"),
    fillRect: record("fillRect"),
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

describe("drawSteps", () => {
  it("does nothing for an empty batch", () => {
    const { ctx, calls } = createMockCtx();
    drawSteps(ctx, "#000", []);
    expect(calls).toHaveLength(0);
  });

  it("stamps each step as a dot inside one beginPath/fill batch", () => {
    const { ctx, calls } = createMockCtx();
    drawSteps(ctx, "#123456", [
      { x: 1, y: 2, width: 3 },
      { x: 4, y: 5, width: 6 },
    ]);
    expect(calls[0]).toEqual({ method: "fillStyle", args: ["#123456"] });
    expect(calls[1].method).toBe("beginPath");
    // moveTo to the arc's start point (x + r, y), then the arc.
    expect(calls[2]).toEqual({ method: "moveTo", args: [4, 2] });
    expect((calls[3].args as number[]).slice(0, 3)).toEqual([1, 2, 3]);
    expect(calls[4]).toEqual({ method: "moveTo", args: [10, 5] });
    expect((calls[5].args as number[]).slice(0, 3)).toEqual([4, 5, 6]);
    expect(calls[6].method).toBe("fill");
    expect(calls).toHaveLength(7);
  });
});

describe("clearAndFill", () => {
  it("clears without painting when background is undefined", () => {
    const { ctx, calls } = createMockCtx();
    clearAndFill(ctx, 300, 150, undefined);
    expect(calls).toEqual([{ method: "clearRect", args: [0, 0, 300, 150] }]);
  });

  it("paints the background after clearing when provided", () => {
    const { ctx, calls } = createMockCtx();
    clearAndFill(ctx, 300, 150, "#fafafa");
    expect(calls.map((c) => c.method)).toEqual(["clearRect", "fillStyle", "fillRect"]);
    expect(calls[2].args).toEqual([0, 0, 300, 150]);
  });
});

describe("replayStrokes", () => {
  const stroke = (x: number, color: string): SignatureStroke => ({
    points: [
      { x, y: 0, time: 0, pressure: 0 },
      { x: x + 10, y: 0, time: 20, pressure: 0 },
    ],
    color,
    minWidth: 0.5,
    maxWidth: 2.5,
    velocityFilterWeight: 0.7,
    pressure: "auto",
    pointerType: "mouse",
  });

  it("draws every stroke in order with its own color and exact pipeline geometry", () => {
    const { ctx, calls } = createMockCtx();
    const s1 = stroke(0, "#111");
    const s2 = stroke(50, "#222");
    replayStrokes(ctx, [s1, s2]);

    const colors = calls.filter((c) => c.method === "fillStyle").map((c) => c.args[0]);
    expect(colors).toEqual(["#111", "#222"]);

    const arcs = calls.filter((c) => c.method === "arc").map((c) => (c.args as number[])[0]);
    const expected = [
      ...strokeSteps(s1).map((s) => s.x),
      ...strokeSteps(s2).map((s) => s.x),
    ];
    expect(arcs).toEqual(expected);
  });

  it("skips empty strokes without emitting draw calls", () => {
    const { ctx, calls } = createMockCtx();
    replayStrokes(ctx, [
      {
        points: [],
        color: "#000",
        minWidth: 0.5,
        maxWidth: 2.5,
        velocityFilterWeight: 0.7,
        pressure: "auto",
        pointerType: "mouse",
      },
    ]);
    expect(calls).toHaveLength(0);
  });
});
