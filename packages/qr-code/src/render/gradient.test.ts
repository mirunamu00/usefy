import { describe, expect, it } from "vitest";
import { linearEndpoints, radialGeometry } from "./gradient";

describe("linearEndpoints", () => {
  const bounds = { x: 0, y: 0, width: 10, height: 10 };

  it("runs left to right at 0°", () => {
    expect(linearEndpoints(bounds, 0)).toEqual({ x1: 0, y1: 5, x2: 10, y2: 5 });
  });

  it("runs top to bottom at 90°", () => {
    const { x1, y1, x2, y2 } = linearEndpoints(bounds, 90);
    expect(x1).toBeCloseTo(5, 10);
    expect(x2).toBeCloseTo(5, 10);
    expect(y1).toBeCloseTo(0, 10);
    expect(y2).toBeCloseTo(10, 10);
  });

  it("reverses at 180°", () => {
    const forward = linearEndpoints(bounds, 0);
    const reversed = linearEndpoints(bounds, 180);
    expect(reversed.x1).toBeCloseTo(forward.x2, 10);
    expect(reversed.x2).toBeCloseTo(forward.x1, 10);
  });

  it("spans the full diagonal projection at 45°", () => {
    const { x1, y1, x2, y2 } = linearEndpoints(bounds, 45);
    const length = Math.hypot(x2 - x1, y2 - y1);
    // The projection of a 10×10 box onto a 45° axis.
    expect(length).toBeCloseTo(Math.sqrt(2) * 10, 10);
  });

  it("stays centred on the bounds, wherever they sit", () => {
    const offset = { x: 4, y: 6, width: 10, height: 20 };
    const { x1, y1, x2, y2 } = linearEndpoints(offset, 30);
    expect((x1 + x2) / 2).toBeCloseTo(9, 10);
    expect((y1 + y2) / 2).toBeCloseTo(16, 10);
  });
});

describe("radialGeometry", () => {
  it("centres on the bounds with a radius covering the longer side", () => {
    expect(radialGeometry({ x: 0, y: 0, width: 10, height: 20 })).toEqual({ cx: 5, cy: 10, r: 10 });
  });
});
