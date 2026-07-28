import { describe, expect, it } from "vitest";
import { PerspectiveTransform } from "./perspective";

const UNIT = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
] as const;

describe("PerspectiveTransform.fromUnitSquare", () => {
  it("maps the unit square's corners onto the given quad", () => {
    const quad = [
      { x: 10, y: 20 },
      { x: 110, y: 30 },
      { x: 120, y: 140 },
      { x: 5, y: 130 },
    ] as const;
    const transform = PerspectiveTransform.fromUnitSquare(...quad);

    UNIT.forEach((corner, index) => {
      const mapped = transform.map(corner.x, corner.y);
      expect(mapped.x).toBeCloseTo(quad[index]!.x, 6);
      expect(mapped.y).toBeCloseTo(quad[index]!.y, 6);
    });
  });

  it("handles a parallelogram, where the projective terms vanish", () => {
    // A pure affine quad would divide by zero in the general construction, so
    // it takes its own branch — and must still be exact.
    const quad = [
      { x: 0, y: 0 },
      { x: 40, y: 10 },
      { x: 50, y: 60 },
      { x: 10, y: 50 },
    ] as const;
    const transform = PerspectiveTransform.fromUnitSquare(...quad);

    UNIT.forEach((corner, index) => {
      const mapped = transform.map(corner.x, corner.y);
      expect(mapped.x).toBeCloseTo(quad[index]!.x, 6);
      expect(mapped.y).toBeCloseTo(quad[index]!.y, 6);
    });
  });
});

describe("PerspectiveTransform.quadToQuad", () => {
  const source = [
    { x: 3.5, y: 3.5 },
    { x: 25.5, y: 3.5 },
    { x: 22.5, y: 22.5 },
    { x: 3.5, y: 25.5 },
  ] as const;
  const destination = [
    { x: 120, y: 90 },
    { x: 300, y: 60 },
    { x: 280, y: 250 },
    { x: 100, y: 270 },
  ] as const;

  it("maps each source point exactly onto its destination", () => {
    const transform = PerspectiveTransform.quadToQuad(source, destination);

    source.forEach((point, index) => {
      const mapped = transform.map(point.x, point.y);
      expect(mapped.x).toBeCloseTo(destination[index]!.x, 4);
      expect(mapped.y).toBeCloseTo(destination[index]!.y, 4);
    });
  });

  it("round trips: mapping there and back is the identity", () => {
    const forward = PerspectiveTransform.quadToQuad(source, destination);
    const backward = PerspectiveTransform.quadToQuad(destination, source);

    for (const point of [
      { x: 10, y: 10 },
      { x: 20, y: 5 },
      { x: 14.5, y: 19.25 },
    ]) {
      const there = forward.map(point.x, point.y);
      const back = backward.map(there.x, there.y);
      expect(back.x).toBeCloseTo(point.x, 4);
      expect(back.y).toBeCloseTo(point.y, 4);
    }
  });

  it("preserves straight lines, as a projective map must", () => {
    const transform = PerspectiveTransform.quadToQuad(source, destination);
    // Three collinear source points must stay collinear after mapping.
    const a = transform.map(5, 5);
    const b = transform.map(10, 10);
    const c = transform.map(20, 20);

    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    expect(Math.abs(cross)).toBeLessThan(1e-6);
  });
});

describe("mapInto", () => {
  it("matches `map`, point for point", () => {
    const transform = PerspectiveTransform.fromUnitSquare(
      { x: 0, y: 0 },
      { x: 100, y: 5 },
      { x: 95, y: 90 },
      { x: 10, y: 100 },
    );

    const points = new Float64Array([0.1, 0.2, 0.5, 0.5, 0.9, 0.8]);
    const expected = [
      transform.map(0.1, 0.2),
      transform.map(0.5, 0.5),
      transform.map(0.9, 0.8),
    ];
    transform.mapInto(points);

    expected.forEach((point, index) => {
      expect(points[index * 2]).toBeCloseTo(point.x, 10);
      expect(points[index * 2 + 1]).toBeCloseTo(point.y, 10);
    });
  });
});
