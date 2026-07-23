import { describe, expect, it } from "vitest";
import { startWidthFor, widthForSegment, type WidthInput } from "./width";

const base: WidthInput = {
  prevVelocity: 0,
  distance: 10,
  dtMs: 10,
  minWidth: 0.5,
  maxWidth: 2.5,
  velocityFilterWeight: 0.7,
  pressure: null,
};

describe("widthForSegment", () => {
  it("matches the documented formula for a single segment (hand math)", () => {
    // v_raw = 10/10 = 1; v_ema = 0.7·1 + 0.3·0 = 0.7
    // width = 2.5 / (1 + 0.7) = 1.470588…
    const { width, velocity } = widthForSegment(base);
    expect(velocity).toBeCloseTo(0.7, 10);
    expect(width).toBeCloseTo(2.5 / 1.7, 10);
  });

  it("EMA-filters a scripted velocity profile across segments", () => {
    // Constant raw velocity 1 px/ms, then a stop:
    // v1 = 0.7·1 = 0.7
    // v2 = 0.7·1 + 0.3·0.7 = 0.91
    // v3 (raw 0: zero distance) = 0.3·0.91 = 0.273
    const s1 = widthForSegment(base);
    expect(s1.velocity).toBeCloseTo(0.7, 10);
    const s2 = widthForSegment({ ...base, prevVelocity: s1.velocity });
    expect(s2.velocity).toBeCloseTo(0.91, 10);
    const s3 = widthForSegment({ ...base, prevVelocity: s2.velocity, distance: 0 });
    expect(s3.velocity).toBeCloseTo(0.273, 10);
    expect(s3.width).toBeCloseTo(2.5 / 1.273, 10);
  });

  it("clamps to minWidth for very fast strokes", () => {
    // v_ema = 0.7·1000 = 700 → 2.5/701 ≈ 0.0036 → clamped to 0.5.
    const { width } = widthForSegment({ ...base, distance: 1000, dtMs: 1 });
    expect(width).toBe(0.5);
  });

  it("yields maxWidth for a stationary segment (velocity 0)", () => {
    const { width, velocity } = widthForSegment({ ...base, distance: 0 });
    expect(velocity).toBe(0);
    expect(width).toBe(2.5);
  });

  it("treats degenerate distance/dt inputs as stationary, never Infinity", () => {
    expect(widthForSegment({ ...base, dtMs: 0 }).velocity).toBe(0);
    expect(widthForSegment({ ...base, dtMs: -5 }).velocity).toBe(0);
    expect(widthForSegment({ ...base, dtMs: NaN }).velocity).toBe(0);
    expect(widthForSegment({ ...base, distance: NaN }).velocity).toBe(0);
    expect(widthForSegment({ ...base, distance: Infinity }).velocity).toBe(0);
    expect(widthForSegment({ ...base, distance: -3 }).velocity).toBe(0);
  });

  it("treats a non-finite prevVelocity as 0", () => {
    const { velocity } = widthForSegment({ ...base, prevVelocity: NaN });
    expect(velocity).toBeCloseTo(0.7, 10); // 0.7·1 + 0.3·0
  });

  it("clamps velocityFilterWeight to [0, 1]", () => {
    // weight 2 → clamped 1 → velocity = raw exactly.
    expect(widthForSegment({ ...base, velocityFilterWeight: 2 }).velocity).toBe(1);
    // weight -1 → clamped 0 → velocity = prev exactly.
    expect(
      widthForSegment({ ...base, velocityFilterWeight: -1, prevVelocity: 0.4 }).velocity,
    ).toBeCloseTo(0.4, 10);
  });

  describe("pressure blending", () => {
    it("blends equal-weight toward the pressure-mapped width", () => {
      // Stationary: w_vel = 2.5. pressure 0 (clamped floor) → pw = 0.5.
      // width = 0.5·2.5 + 0.5·0.5 = 1.5.
      const { width } = widthForSegment({ ...base, distance: 0, pressure: 0 });
      expect(width).toBeCloseTo(1.5, 10);
    });

    it("full pressure on a stationary segment stays at maxWidth", () => {
      const { width } = widthForSegment({ ...base, distance: 0, pressure: 1 });
      expect(width).toBe(2.5);
    });

    it("hand math for a moving segment with mid pressure", () => {
      // v_ema = 0.7 → w_vel = 2.5/1.7; pw = 0.5 + 2·0.5 = 1.5
      // width = 0.5·(2.5/1.7) + 0.5·1.5
      const { width } = widthForSegment({ ...base, pressure: 0.5 });
      expect(width).toBeCloseTo(0.5 * (2.5 / 1.7) + 0.75, 10);
    });

    it("clamps out-of-range pressure into [0, 1]", () => {
      const hi = widthForSegment({ ...base, distance: 0, pressure: 5 });
      expect(hi.width).toBe(2.5); // same as pressure 1
      const lo = widthForSegment({ ...base, distance: 0, pressure: -5 });
      expect(lo.width).toBeCloseTo(1.5, 10); // same as pressure 0
    });

    it("null pressure means velocity-only width", () => {
      const a = widthForSegment({ ...base, pressure: null });
      expect(a.width).toBeCloseTo(2.5 / 1.7, 10);
    });
  });
});

describe("startWidthFor", () => {
  it("is the midpoint of the width range (signature_pad dotSize convention)", () => {
    expect(startWidthFor(0.5, 2.5)).toBe(1.5);
    expect(startWidthFor(1, 1)).toBe(1);
  });
});
