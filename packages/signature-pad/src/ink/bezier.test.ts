import { describe, expect, it } from "vitest";
import type { SignaturePoint } from "../types";
import { bezierFor, flattenSegment } from "./bezier";

const P = (x: number, y: number, time = 0, pressure = 0): SignaturePoint => ({
  x,
  y,
  time,
  pressure,
});

describe("bezierFor", () => {
  it("keeps controls on the line for collinear, equally spaced neighbors", () => {
    // Hand math (segment (10,0)→(20,0), neighbors (0,0)/(30,0)):
    //  triple (0,0),(10,0),(20,0): m1=(5,0) m2=(15,0) l1=l2=10 k=0.5
    //    cm=(10,0) t=(0,0) → after-control c2 = m2 = (15,0)
    //  triple (10,0),(20,0),(30,0): m1=(15,0) ... → before-control c1 = (15,0)
    const seg = bezierFor(P(0, 0), P(10, 0), P(20, 0), P(30, 0));
    expect(seg.start).toEqual(P(10, 0));
    expect(seg.end).toEqual(P(20, 0));
    expect(seg.c1).toEqual({ x: 15, y: 0 });
    expect(seg.c2).toEqual({ x: 15, y: 0 });
  });

  it("matches hand-computed controls for a 90° corner", () => {
    // Segment (10,0)→(10,10) with p0=(0,0), p3=null.
    // c1 from triple (0,0),(10,0),(10,10):
    //   m1=(5,0) m2=(10,5) l1=10 l2=10 k=0.5
    //   cm = m2 + (m1-m2)*0.5 = (7.5, 2.5); t = (10,0)-(7.5,2.5) = (2.5,-2.5)
    //   c1 = m2 + t = (12.5, 2.5)
    // c2 from triple (10,0),(10,10),(10,10) (p3 → end substitute):
    //   m1=(10,5) m2=(10,10) l1=10 l2=0 k=0 cm=(10,10) t=(0,0)
    //   c2 = m1 = (10,5)
    const seg = bezierFor(P(0, 0), P(10, 0), P(10, 10), null);
    expect(seg.c1.x).toBeCloseTo(12.5, 10);
    expect(seg.c1.y).toBeCloseTo(2.5, 10);
    expect(seg.c2.x).toBeCloseTo(10, 10);
    expect(seg.c2.y).toBeCloseTo(5, 10);
  });

  it("degenerates missing neighbors to chord midpoints (stroke tips)", () => {
    // First segment of a stroke: p0 = null → c1 = midpoint of the chord.
    const first = bezierFor(null, P(0, 0), P(10, 0), P(20, 0));
    expect(first.c1).toEqual({ x: 5, y: 0 });
    // Two-point stroke: both neighbors null → both controls at the midpoint.
    const both = bezierFor(null, P(0, 0), P(10, 0), null);
    expect(both.c1).toEqual({ x: 5, y: 0 });
    expect(both.c2).toEqual({ x: 5, y: 0 });
  });

  it("handles a fully degenerate (zero-length) segment without NaN", () => {
    const seg = bezierFor(null, P(5, 5), P(5, 5), null);
    expect(seg.c1).toEqual({ x: 5, y: 5 });
    expect(seg.c2).toEqual({ x: 5, y: 5 });
  });
});

describe("flattenSegment", () => {
  it("flattens a straight 10px segment into 21 steps with exact endpoints", () => {
    // length = 10 → n = ceil(10·2) = 20 spans → 21 steps.
    const seg = bezierFor(null, P(0, 0), P(10, 0), null);
    const steps = flattenSegment(seg, 1, 2);
    expect(steps).toHaveLength(21);
    expect(steps[0]).toEqual({ x: 0, y: 0, width: 1 });
    expect(steps[20].x).toBeCloseTo(10, 10);
    expect(steps[20].y).toBeCloseTo(0, 10);
    expect(steps[20].width).toBeCloseTo(2, 10);
  });

  it("interpolates position and width linearly along a straight chord", () => {
    // Controls at the chord midpoint keep the cubic exactly on the line:
    // at t=0.5 → x=5. Width lerp: 1 + (2-1)·0.5 = 1.5.
    const seg = bezierFor(null, P(0, 0), P(10, 0), null);
    const steps = flattenSegment(seg, 1, 2);
    const mid = steps[10]; // t = 10/20 = 0.5
    expect(mid.x).toBeCloseTo(5, 10);
    expect(mid.y).toBeCloseTo(0, 10);
    expect(mid.width).toBeCloseTo(1.5, 10);
  });

  it("emits widths monotonically for monotone start/end widths", () => {
    const seg = bezierFor(null, P(0, 0), P(10, 0), null);
    const steps = flattenSegment(seg, 2, 1);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].width).toBeLessThanOrEqual(steps[i - 1].width);
    }
    expect(steps[0].width).toBe(2);
    expect(steps[steps.length - 1].width).toBeCloseTo(1, 10);
  });

  it("emits 2 steps for a zero-length segment (n clamps to 1)", () => {
    const seg = bezierFor(null, P(5, 5), P(5, 5), null);
    const steps = flattenSegment(seg, 1.5, 1.5);
    expect(steps).toEqual([
      { x: 5, y: 5, width: 1.5 },
      { x: 5, y: 5, width: 1.5 },
    ]);
  });

  it("keeps half-pixel dot density on long segments — no beading (gap-free)", () => {
    // A single 300px segment (realistic under main-thread jank) must NOT
    // be capped into spaced-out dots: 300px → 600 spans → 601 steps.
    const seg = bezierFor(null, P(0, 0), P(300, 0), null);
    const startWidth = 0.5; // thinnest realistic ink — the worst case for gaps
    const steps = flattenSegment(seg, startWidth, 2.5);
    expect(steps).toHaveLength(601);
    // Gap-free: consecutive dot spacing stays within one dot DIAMETER at
    // the segment's start width, so adjacent stamps always overlap. The
    // average spacing is 0.5px; uniform-t sampling of the cubic runs up
    // to ~1.5× that near the tips (nonuniform parametrization), still
    // comfortably under the 2·0.5 = 1.0 diameter bound.
    const maxSpacing = 2 * Math.max(0.5, startWidth);
    for (let i = 1; i < steps.length; i++) {
      const d = Math.hypot(steps[i].x - steps[i - 1].x, steps[i].y - steps[i - 1].y);
      expect(d).toBeLessThanOrEqual(maxSpacing + 1e-9);
    }
  });

  it("caps spans at 2048 only as a pathological-input backstop", () => {
    // 2000px in ONE segment is beyond anything the capture path can
    // produce; the cap bounds the work: 2·2000 = 4000 → 2048 → 2049 steps.
    const seg = bezierFor(null, P(0, 0), P(2000, 0), null);
    const steps = flattenSegment(seg, 1, 1);
    expect(steps).toHaveLength(2049);
    expect(steps[0].x).toBe(0);
    expect(steps[2048].x).toBeCloseTo(2000, 6);
  });
});
