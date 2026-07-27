import { describe, expect, it } from "vitest";
import {
  circlePath,
  eyeInnerPath,
  eyeOuterPath,
  modulePath,
  rectPath,
  roundedRectPath,
} from "./shapes";
import type { Neighbours } from "./shapes";
import { bounds, subpaths, windingSign } from "../__testing__/path";

const ISOLATED: Neighbours = { up: false, down: false, left: false, right: false };
const SURROUNDED: Neighbours = { up: true, down: true, left: true, right: true };

describe("rectPath", () => {
  it("emits a closed rectangle", () => {
    expect(rectPath(0, 0, 1, 1)).toBe("M0 0H1V1H0Z");
    expect(rectPath(4, 5, 3, 1)).toBe("M4 5H7V6H4Z");
  });

  it("reverses direction when drawn counter-clockwise", () => {
    const cw = rectPath(0, 0, 2, 2, true);
    const ccw = rectPath(0, 0, 2, 2, false);
    expect(cw).not.toBe(ccw);
    expect(windingSign(subpaths(cw)[0]!)).toBe(1);
    expect(windingSign(subpaths(ccw)[0]!)).toBe(-1);
  });
});

describe("roundedRectPath", () => {
  it("degenerates to a plain rectangle when every radius is zero", () => {
    expect(roundedRectPath(0, 0, 1, 1, [0, 0, 0, 0])).toBe(rectPath(0, 0, 1, 1));
    expect(roundedRectPath(0, 0, 1, 1, [0, 0, 0, 0], false)).toBe(rectPath(0, 0, 1, 1, false));
  });

  it("clamps radii to half the shorter side", () => {
    // A radius larger than the box would invert the arcs.
    const clamped = roundedRectPath(0, 0, 2, 2, [99, 99, 99, 99]);
    const exact = roundedRectPath(0, 0, 2, 2, [1, 1, 1, 1]);
    expect(clamped).toBe(exact);
  });

  it("rounds only the corners it is given", () => {
    const topLeftOnly = roundedRectPath(0, 0, 4, 4, [1, 0, 0, 0]);
    expect(topLeftOnly.match(/A/g)).toHaveLength(1);
    expect(roundedRectPath(0, 0, 4, 4, [1, 1, 1, 1]).match(/A/g)).toHaveLength(4);
  });

  it("keeps clockwise and counter-clockwise as mirror windings", () => {
    const cw = roundedRectPath(0, 0, 4, 4, [1, 1, 1, 1], true);
    const ccw = roundedRectPath(0, 0, 4, 4, [1, 1, 1, 1], false);
    expect(cw).toContain("0 0 1 ");
    expect(ccw).toContain("0 0 0 ");
    expect(cw).not.toBe(ccw);
  });

  it("still closes the outline when only some corners are rounded, either way round", () => {
    for (const clockwise of [true, false]) {
      for (const corners of [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
        [1, 0, 1, 0],
      ] as const) {
        const d = roundedRectPath(0, 0, 4, 4, corners, clockwise);
        expect(d.startsWith("M")).toBe(true);
        expect(d.endsWith("Z")).toBe(true);
      }
    }
  });
});

describe("circlePath", () => {
  it("draws a full circle as two half arcs", () => {
    expect(circlePath(1, 1, 0.5)).toBe("M0.5 1A0.5 0.5 0 1 1 1.5 1A0.5 0.5 0 1 1 0.5 1Z");
  });

  it("reverses the sweep flag when counter-clockwise", () => {
    expect(circlePath(1, 1, 0.5, false)).toContain("0 1 0");
  });
});

describe("modulePath", () => {
  it("draws a unit square by default", () => {
    expect(modulePath("square", 2, 3, 0, ISOLATED)).toBe("M2 3H3V4H2Z");
  });

  it("insets by the module gap, keeping the module centred", () => {
    // gap 0.2 → 0.1 on each side, leaving a 0.8 span centred in the cell.
    expect(modulePath("square", 0, 0, 0.2, ISOLATED)).toBe("M0.1 0.1H0.9V0.9H0.1Z");
  });

  it("draws dots as circles that shrink with the gap", () => {
    expect(modulePath("dot", 0, 0, 0, ISOLATED)).toBe(circlePath(0.5, 0.5, 0.5));
    expect(modulePath("dot", 0, 0, 0.2, ISOLATED)).toBe(circlePath(0.5, 0.5, 0.4));
  });

  it("rounds a corner only when both of its edges are exposed", () => {
    const isolated = modulePath("rounded", 0, 0, 0, ISOLATED);
    const surrounded = modulePath("rounded", 0, 0, 0, SURROUNDED);
    expect(isolated.match(/A/g)).toHaveLength(4);
    // A module in the middle of a run must stay square, or the run pinches.
    expect(surrounded).toBe(rectPath(0, 0, 1, 1));
  });

  it("rounds each corner independently for rounded modules", () => {
    // Only the neighbour above is present → the two top corners stay square.
    const d = modulePath("rounded", 0, 0, 0, { ...ISOLATED, up: true });
    expect(d.match(/A/g)).toHaveLength(2);
  });

  it("rounds only the leading diagonal for classy modules", () => {
    const isolated = modulePath("classy", 0, 0, 0, ISOLATED);
    expect(isolated.match(/A/g)).toHaveLength(2);
    expect(modulePath("classy", 0, 0, 0, SURROUNDED)).toBe(rectPath(0, 0, 1, 1));
  });
});

describe("eye shapes", () => {
  const SHAPES = ["square", "rounded", "circle", "leaf"] as const;

  it("draws the ring as an outline plus an opposite-wound hole", () => {
    // Under the default `nonzero` fill rule the hole only punches through if
    // it runs against the outline; same winding would fill it solid.
    for (const shape of SHAPES) {
      const parts = subpaths(eyeOuterPath(shape, 0, 0));
      expect(parts).toHaveLength(2);
      expect(windingSign(parts[0]!)).toBe(1);
      expect(windingSign(parts[1]!)).toBe(-1);
    }
  });

  it("draws the centre as a single closed subpath", () => {
    for (const shape of SHAPES) {
      const d = eyeInnerPath(shape, 0, 0);
      expect(d.match(/M/g)).toHaveLength(1);
      expect(d.endsWith("Z")).toBe(true);
    }
  });

  it("keeps every shape inside its 7×7 box, wherever that box sits", () => {
    for (const shape of SHAPES) {
      for (const [ox, oy] of [
        [0, 0],
        [10, 4],
      ] as const) {
        for (const d of [eyeOuterPath(shape, ox, oy), eyeInnerPath(shape, ox, oy)]) {
          expect(bounds(d)).toEqual({
            minX: expect.any(Number),
            minY: expect.any(Number),
            maxX: expect.any(Number),
            maxY: expect.any(Number),
          });
          const box = bounds(d);
          expect(box.minX).toBeGreaterThanOrEqual(ox);
          expect(box.minY).toBeGreaterThanOrEqual(oy);
          expect(box.maxX).toBeLessThanOrEqual(ox + 7);
          expect(box.maxY).toBeLessThanOrEqual(oy + 7);
        }
      }
    }
  });

  it("centres the 3×3 finder centre inside the 7×7 ring", () => {
    for (const shape of SHAPES) {
      const inner = bounds(eyeInnerPath(shape, 0, 0));
      expect((inner.minX + inner.maxX) / 2).toBeCloseTo(3.5, 10);
      expect((inner.minY + inner.maxY) / 2).toBeCloseTo(3.5, 10);
    }
  });
});
