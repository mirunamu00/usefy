/**
 * Cubic Bézier smoothing — control-point derivation from neighboring
 * points (signature_pad-style) and adaptive flattening into width-
 * interpolated draw steps (SPEC §4.2). Pure and framework-free.
 */
import type { SignaturePoint } from "../types";

/** A 2D position (control points carry no time/pressure). */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * One cubic Bézier curve segment between two captured points.
 * `start`/`end` are the original samples; `c1`/`c2` are derived controls.
 */
export interface BezierSegment {
  start: SignaturePoint;
  c1: Vec2;
  c2: Vec2;
  end: SignaturePoint;
}

/**
 * One draw step: a filled dot of radius `width` centered at (`x`, `y`).
 * `width` is a **radius** (half the visual stroke thickness) — the same
 * unit as the `minWidth`/`maxWidth` options (SPEC §3.6 "half-width"),
 * matching signature_pad's dot-stamping render model.
 */
export interface FlatStep {
  x: number;
  y: number;
  /** Dot radius in CSS px. */
  width: number;
}

/**
 * Control points around the middle point `s2` of a consecutive triple,
 * per the signature_pad algorithm:
 *
 * ```
 * m1 = midpoint(s1, s2)          m2 = midpoint(s2, s3)
 * l1 = |s1 s2|                   l2 = |s2 s3|
 * k  = l2 / (l1 + l2)            (0 when both lengths are 0)
 * cm = m2 + (m1 − m2) · k        (point on m1–m2 at the length ratio)
 * t  = s2 − cm                   (translate so the chord passes through s2)
 * c1 = m1 + t                    (control before s2)
 * c2 = m2 + t                    (control after s2)
 * ```
 */
function controlPointsAround(
  s1: Pick<SignaturePoint, "x" | "y">,
  s2: Pick<SignaturePoint, "x" | "y">,
  s3: Pick<SignaturePoint, "x" | "y">,
): { c1: Vec2; c2: Vec2 } {
  const m1: Vec2 = { x: (s1.x + s2.x) / 2, y: (s1.y + s2.y) / 2 };
  const m2: Vec2 = { x: (s2.x + s3.x) / 2, y: (s2.y + s3.y) / 2 };
  const l1 = Math.hypot(s2.x - s1.x, s2.y - s1.y);
  const l2 = Math.hypot(s3.x - s2.x, s3.y - s2.y);
  const total = l1 + l2;
  const k = total === 0 ? 0 : l2 / total;
  const cm: Vec2 = { x: m2.x + (m1.x - m2.x) * k, y: m2.y + (m1.y - m2.y) * k };
  const tx = s2.x - cm.x;
  const ty = s2.y - cm.y;
  return {
    c1: { x: m1.x + tx, y: m1.y + ty },
    c2: { x: m2.x + tx, y: m2.y + ty },
  };
}

/**
 * Cubic Bézier control points for the segment `p1 → p2` given the
 * neighboring captured points `p0` (before `p1`) and `p3` (after `p2`).
 *
 * Derivation (signature_pad-style, see {@link controlPointsAround}):
 * - the segment's first control is the "after" control of the triple
 *   `(p0, p1, p2)` around `p1`;
 * - the segment's second control is the "before" control of the triple
 *   `(p1, p2, p3)` around `p2`.
 *
 * Missing neighbors (stroke start/end) substitute the segment's own
 * endpoint (`p0 → p1`, `p3 → p2`), which degenerates the corresponding
 * control to the chord midpoint — the curve eases straight into/out of
 * the stroke tip with no overshoot.
 *
 * @example
 * ```ts
 * import { bezierFor } from "@usefy/signature-pad/headless";
 *
 * const P = (x: number, y: number) => ({ x, y, time: 0, pressure: 0 });
 * const seg = bezierFor(P(0, 0), P(10, 0), P(20, 0), P(30, 0));
 * // collinear equal spacing → controls stay on the line:
 * // seg.c1 = { x: 15, y: 0 }, seg.c2 = { x: 15, y: 0 }
 * ```
 */
export function bezierFor(
  p0: SignaturePoint | null,
  p1: SignaturePoint,
  p2: SignaturePoint,
  p3: SignaturePoint | null,
): BezierSegment {
  const before = p0 ?? p1;
  const after = p3 ?? p2;
  const c1 = controlPointsAround(before, p1, p2).c2;
  const c2 = controlPointsAround(p1, p2, after).c1;
  return { start: p1, c1, c2, end: p2 };
}

/** Evaluate the cubic Bézier at parameter `t` (0–1) on one axis. */
function cubicAt(t: number, p0: number, c1: number, c2: number, p1: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * p1;
}

/**
 * Approximate curve length by sampling `LENGTH_SAMPLES` chords — matches
 * signature_pad's `Bezier.length()` approach. Deterministic.
 */
const LENGTH_SAMPLES = 10;

/**
 * Backstop on spans per segment — for PATHOLOGICAL input only (a single
 * segment longer than ~1024px, which the engine's NaN guards and
 * min-distance capture make unreachable in practice). It must never bind
 * for realistic input: at the standard half-pixel dot density, capping
 * would space dots apart and bead the ink into a dotted line (the
 * signature_pad reference has no cap at all).
 */
const MAX_STEPS = 2048;

function segmentLength(seg: BezierSegment): number {
  let length = 0;
  let px = seg.start.x;
  let py = seg.start.y;
  for (let i = 1; i <= LENGTH_SAMPLES; i++) {
    const t = i / LENGTH_SAMPLES;
    const x = cubicAt(t, seg.start.x, seg.c1.x, seg.c2.x, seg.end.x);
    const y = cubicAt(t, seg.start.y, seg.c1.y, seg.c2.y, seg.end.y);
    length += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return length;
}

/**
 * Flatten a Bézier segment into draw steps with linearly interpolated
 * width (radius).
 *
 * Step count is adaptive to the segment's length: with `L` the 10-sample
 * approximated curve length, the curve is subdivided into
 * `n = clamp(ceil(2·L), 1, 2048)` spans — a dot every half pixel of arc
 * length on average (signature_pad's density). Steps are uniform in `t`,
 * so local spacing can reach ~1.5× the average where the cubic's
 * parametrization runs fastest — still well under one dot diameter even
 * at the 0.5px minimum radius, so adjacent stamps always overlap
 * (gap-free ink), including long segments captured under main-thread
 * jank. The 2048 ceiling is purely a pathological-input backstop
 * (segments > ~1024px) and never binds for realistic strokes.
 * `n + 1` steps are emitted at `t = 0, 1/n, …, 1` (both endpoints
 * included; adjacent segments overlap by one dot, which is invisible in
 * the stamped-dot render model and keeps each segment self-contained for
 * incremental drawing).
 *
 * @example
 * ```ts
 * import { bezierFor, flattenSegment } from "@usefy/signature-pad/headless";
 *
 * const P = (x: number, y: number) => ({ x, y, time: 0, pressure: 0 });
 * const seg = bezierFor(null, P(0, 0), P(10, 0), null);
 * const steps = flattenSegment(seg, 1, 2);
 * // straight 10px segment → 21 steps; width runs 1 → 2 linearly
 * steps[0];                // { x: 0, y: 0, width: 1 }
 * steps[steps.length - 1]; // { x: 10, y: 0, width: 2 }
 * ```
 */
export function flattenSegment(
  seg: BezierSegment,
  startWidth: number,
  endWidth: number,
): FlatStep[] {
  const n = Math.min(MAX_STEPS, Math.max(1, Math.ceil(segmentLength(seg) * 2)));
  const steps: FlatStep[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    steps.push({
      x: cubicAt(t, seg.start.x, seg.c1.x, seg.c2.x, seg.end.x),
      y: cubicAt(t, seg.start.y, seg.c1.y, seg.c2.y, seg.end.y),
      width: startWidth + (endWidth - startWidth) * t,
    });
  }
  return steps;
}
