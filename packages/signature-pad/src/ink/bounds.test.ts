import { describe, expect, it } from "vitest";
import type { SignaturePoint, SignatureStroke } from "../types";
import { inkBounds } from "./bounds";

const P = (x: number, y: number, time = 0, pressure = 0): SignaturePoint => ({
  x,
  y,
  time,
  pressure,
});

const stroke = (points: SignaturePoint[], minWidth = 1, maxWidth = 3): SignatureStroke => ({
  points,
  color: "#000",
  minWidth,
  maxWidth,
  velocityFilterWeight: 0.7,
  pressure: "auto",
  pointerType: "mouse",
});

describe("inkBounds", () => {
  it("returns null for no strokes", () => {
    expect(inkBounds([])).toBeNull();
  });

  it("returns null when strokes contain no points", () => {
    expect(inkBounds([stroke([])])).toBeNull();
  });

  it("inflates a dot by its radius (start width = (min+max)/2)", () => {
    // dot radius = (1 + 3) / 2 = 2 → box [8,18]–[12,22]
    const rect = inkBounds([stroke([P(10, 20)])]);
    expect(rect).toEqual({ x: 8, y: 18, width: 4, height: 4 });
  });

  it("unions multiple strokes", () => {
    const rect = inkBounds([stroke([P(0, 0)]), stroke([P(100, 50)])]);
    // radii 2 each → [-2,-2] to [102, 52]
    expect(rect).toEqual({ x: -2, y: -2, width: 104, height: 54 });
  });

  it("accounts for variable width along a segment (hand math)", () => {
    // Two-point stroke (0,0)→(10,0), dt = 1000ms → v_raw = 0.01
    // v_ema = 0.7·0.01 = 0.007 → end width = 3 / 1.007
    // start width = (1+3)/2 = 2.
    // Along +x both x and width increase → extremes at the endpoints:
    //   minX = 0 − 2 = −2, maxX = 10 + 3/1.007
    //   |y| max = end width (t=1) = 3/1.007
    const endWidth = 3 / 1.007;
    const rect = inkBounds([stroke([P(0, 0, 0), P(10, 0, 1000)])])!;
    expect(rect.x).toBeCloseTo(-2, 10);
    expect(rect.y).toBeCloseTo(-endWidth, 6);
    expect(rect.x + rect.width).toBeCloseTo(10 + endWidth, 6);
    expect(rect.y + rect.height).toBeCloseTo(endWidth, 6);
  });

  it("uses each stroke's OWN stored width parameters (self-contained)", () => {
    // Same fast-moving points, different stored velocityFilterWeight.
    const points = [P(0, 0, 0), P(30, 0, 10), P(60, 0, 20)];
    const a = inkBounds([stroke(points)])!;
    const noFilter: SignatureStroke = { ...stroke(points), velocityFilterWeight: 0 };
    const b = inkBounds([noFilter])!;
    // vfw 0 → EMA never reacts → velocity stays 0 → widths stay at
    // maxWidth → strictly taller ink box than the filtered stroke.
    expect(b.height).toBeGreaterThan(a.height);
  });

  it("matches the box implied by the rendered ink for a multi-segment stroke", () => {
    // Sanity: bounds must contain every raw point inflated by min radius
    // and be finite.
    const pts = [P(0, 0, 0), P(15, 5, 20), P(30, -5, 40), P(45, 10, 55)];
    const rect = inkBounds([stroke(pts)])!;
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(rect.x);
      expect(p.x).toBeLessThanOrEqual(rect.x + rect.width);
      expect(p.y).toBeGreaterThanOrEqual(rect.y);
      expect(p.y).toBeLessThanOrEqual(rect.y + rect.height);
    }
    expect(Number.isFinite(rect.width)).toBe(true);
    expect(Number.isFinite(rect.height)).toBe(true);
  });
});
