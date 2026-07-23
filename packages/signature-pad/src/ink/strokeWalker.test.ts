import { describe, expect, it } from "vitest";
import type { SignaturePoint, SignatureStroke } from "../types";
import { bezierFor, flattenSegment } from "./bezier";
import { pointDistance } from "./filterPoints";
import { startWidthFor, widthForSegment } from "./width";
import {
  createStrokeWalker,
  flattenStrokeSegment,
  strokeGeometry,
  strokeSteps,
  type StrokeWalkerParams,
} from "./strokeWalker";

const P = (x: number, y: number, time = 0, pressure = 0): SignaturePoint => ({
  x,
  y,
  time,
  pressure,
});

const PARAMS: StrokeWalkerParams = {
  minWidth: 0.5,
  maxWidth: 2.5,
  velocityFilterWeight: 0.7,
  pressure: "auto",
  pointerType: "mouse",
};

const stroke = (
  points: SignaturePoint[],
  overrides: Partial<SignatureStroke> = {},
): SignatureStroke => ({
  points,
  color: "#000",
  minWidth: PARAMS.minWidth,
  maxWidth: PARAMS.maxWidth,
  velocityFilterWeight: PARAMS.velocityFilterWeight,
  pressure: PARAMS.pressure,
  pointerType: PARAMS.pointerType,
  ...overrides,
});

describe("createStrokeWalker", () => {
  it("emits nothing for the first two points, then the trailing segment", () => {
    const w = createStrokeWalker(PARAMS);
    expect(w.add(P(0, 0, 0))).toEqual([]);
    expect(w.add(P(10, 0, 10))).toEqual([]);
    const steps = w.add(P(20, 0, 20));
    // The segment 0→10 became final (the third point is its p3 neighbor).
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].x).toBeCloseTo(0, 10);
    expect(steps[steps.length - 1].x).toBeCloseTo(10, 10);
  });

  it("reproduces the exact per-segment pipeline (hand-wired reference)", () => {
    const p1 = P(0, 0, 0);
    const p2 = P(10, 0, 10);
    const p3 = P(20, 0, 20);
    const w = createStrokeWalker(PARAMS);
    w.add(p1);
    w.add(p2);
    const emitted = w.add(p3);

    // Reference: same functions, hand-composed.
    const start = startWidthFor(PARAMS.minWidth, PARAMS.maxWidth); // 1.5
    const { width } = widthForSegment({
      prevVelocity: 0,
      distance: pointDistance(p1, p2),
      dtMs: p2.time - p1.time,
      minWidth: PARAMS.minWidth,
      maxWidth: PARAMS.maxWidth,
      velocityFilterWeight: PARAMS.velocityFilterWeight,
      pressure: null, // mouse → never meaningful
    });
    const expected = flattenSegment(bezierFor(null, p1, p2, p3), start, width);
    expect(emitted).toEqual(expected);
  });

  it("starts at the stroke start width and carries width across segments", () => {
    const w = createStrokeWalker(PARAMS);
    w.add(P(0, 0, 0));
    w.add(P(10, 0, 10));
    const seg1 = w.add(P(20, 0, 20));
    const seg2 = w.add(P(30, 0, 30));
    expect(seg1[0].width).toBe(startWidthFor(PARAMS.minWidth, PARAMS.maxWidth));
    // continuity: segment 2 starts at exactly the width segment 1 ended with
    expect(seg2[0].width).toBeCloseTo(seg1[seg1.length - 1].width, 10);
  });

  it("finish() flushes the tail segment ending at the last point", () => {
    const w = createStrokeWalker(PARAMS);
    w.add(P(0, 0, 0));
    w.add(P(10, 0, 10));
    w.add(P(20, 0, 20));
    const tail = w.finish();
    expect(tail.length).toBeGreaterThan(0);
    expect(tail[0].x).toBeCloseTo(10, 10);
    expect(tail[tail.length - 1].x).toBeCloseTo(20, 10);
  });

  it("renders a two-point stroke as a single tip-to-tip segment on finish", () => {
    const w = createStrokeWalker(PARAMS);
    w.add(P(0, 0, 0));
    expect(w.add(P(10, 0, 10))).toEqual([]);
    const tail = w.finish();
    expect(tail[0].x).toBeCloseTo(0, 10);
    expect(tail[tail.length - 1].x).toBeCloseTo(10, 10);
  });

  it("renders a tap (single point) as one dot of start width", () => {
    const w = createStrokeWalker(PARAMS);
    w.add(P(7, 9, 0));
    expect(w.finish()).toEqual([{ x: 7, y: 9, width: 1.5 }]);
  });

  it("returns [] for an empty stroke and is idempotent after finish", () => {
    const empty = createStrokeWalker(PARAMS);
    expect(empty.finish()).toEqual([]);

    const w = createStrokeWalker(PARAMS);
    w.add(P(0, 0, 0));
    w.finish();
    expect(w.finish()).toEqual([]); // idempotent
    expect(w.add(P(10, 0, 10))).toEqual([]); // add after finish is inert
    expect(w.points).toHaveLength(1);
  });

  it("exposes the accepted points", () => {
    const w = createStrokeWalker(PARAMS);
    const p = P(1, 2, 3);
    w.add(p);
    expect(w.points).toEqual([p]);
  });

  describe("pressure meaningfulness (SPEC §3.1)", () => {
    const feed = (params: StrokeWalkerParams, pressure: number): number => {
      const w = createStrokeWalker(params);
      w.add(P(0, 0, 0, pressure));
      w.add(P(10, 0, 10, pressure));
      w.add(P(20, 0, 20, pressure));
      const tail = w.finish();
      return tail[tail.length - 1].width;
    };

    it("blends pen pressure under 'auto'", () => {
      const withPressure = feed({ ...PARAMS, pointerType: "pen" }, 1);
      const withoutPressure = feed({ ...PARAMS, pointerType: "pen" }, 0); // mean 0 → not meaningful
      expect(withPressure).toBeGreaterThan(withoutPressure);
    });

    it("ignores pressure for non-pen pointers", () => {
      const touch = feed({ ...PARAMS, pointerType: "touch" }, 1);
      const mouseNoPressure = feed(PARAMS, 0);
      expect(touch).toBeCloseTo(mouseNoPressure, 10);
    });

    it("ignores pen pressure under pressure: 'ignore'", () => {
      const ignored = feed({ ...PARAMS, pointerType: "pen", pressure: "ignore" }, 1);
      const noPressure = feed({ ...PARAMS, pointerType: "pen" }, 0);
      expect(ignored).toBeCloseTo(noPressure, 10);
    });
  });
});

describe("strokeGeometry", () => {
  it("yields one segment per interior point plus the tail, in order", () => {
    const points = [P(0, 0, 0), P(10, 2, 12), P(18, 9, 25), P(30, 9, 40)];
    const { segments, dot } = strokeGeometry(stroke(points));
    expect(dot).toBeNull();
    expect(segments).toHaveLength(3); // 0→10, 10→18, 18→30
    expect(segments[0].bezier.start.x).toBe(0);
    expect(segments[2].bezier.end.x).toBe(30);
    // width chain: each segment starts where the previous ended
    expect(segments[1].startWidth).toBe(segments[0].endWidth);
    expect(segments[2].startWidth).toBe(segments[1].endWidth);
  });

  it("yields the dot (and no segments) for a single-point stroke", () => {
    const { segments, dot } = strokeGeometry(stroke([P(3, 4, 0)]));
    expect(segments).toEqual([]);
    expect(dot).toEqual({ x: 3, y: 4, width: 1.5 });
  });

  it("yields nothing for an empty stroke", () => {
    expect(strokeGeometry(stroke([]))).toEqual({ segments: [], dot: null });
  });

  it("is driven by the stroke's OWN stored parameters (self-contained)", () => {
    const points = [P(0, 0, 0), P(10, 0, 10), P(20, 0, 20)];
    const a = strokeGeometry(stroke(points));
    const b = strokeGeometry(stroke(points, { velocityFilterWeight: 0.1 }));
    // Different stored EMA weight → different widths, same curve geometry.
    expect(b.segments[0].endWidth).not.toBeCloseTo(a.segments[0].endWidth, 6);
    expect(b.segments[0].bezier).toEqual(a.segments[0].bezier);
  });
});

describe("strokeSteps", () => {
  it("produces exactly the incremental walker's concatenated output (determinism)", () => {
    const points = [P(0, 0, 0), P(10, 2, 12), P(18, 9, 25), P(30, 9, 40), P(35, 20, 60)];
    const w = createStrokeWalker(PARAMS);
    const incremental = points.flatMap((p) => w.add(p));
    incremental.push(...w.finish());

    expect(strokeSteps(stroke(points))).toEqual(incremental);
  });

  it("equals the flattened strokeGeometry (single shared source)", () => {
    const points = [P(0, 0, 0), P(9, 4, 15), P(21, 8, 28)];
    const { segments } = strokeGeometry(stroke(points));
    expect(strokeSteps(stroke(points))).toEqual(segments.flatMap(flattenStrokeSegment));
  });

  it("is deterministic — identical input twice gives identical output", () => {
    const points = [P(0, 0, 0), P(9, 4, 15), P(21, 8, 28)];
    expect(strokeSteps(stroke(points))).toEqual(strokeSteps(stroke(points)));
  });

  it("handles the dot and empty strokes", () => {
    expect(strokeSteps(stroke([P(3, 4, 0)]))).toEqual([{ x: 3, y: 4, width: 1.5 }]);
    expect(strokeSteps(stroke([]))).toEqual([]);
  });
});
