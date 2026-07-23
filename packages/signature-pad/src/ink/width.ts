/**
 * Velocity/pressure → stroke width — the exact formula shared by canvas
 * rendering, PNG export, and SVG export (SPEC §4.2). Pure and
 * framework-free; fixing the math here is what makes "what you see is
 * what you export" true by construction.
 */

/** Input to {@link widthForSegment}. */
export interface WidthInput {
  /** EMA velocity carried from the previous segment (px/ms); 0 at stroke start. */
  prevVelocity: number;
  /** Chord distance between the segment's endpoints (px). */
  distance: number;
  /** Time delta between the segment's endpoints (ms). */
  dtMs: number;
  /** Minimum radius (px). Assumed sanitized (see `resolveOptions`). */
  minWidth: number;
  /** Maximum radius (px). Assumed sanitized, ≥ `minWidth`. */
  maxWidth: number;
  /** EMA weight 0–1 (clamped defensively here too). */
  velocityFilterWeight: number;
  /**
   * Blended pressure for this segment when meaningful (pen with
   * pressure > 0 and `pressure: "auto"`), else `null`.
   */
  pressure: number | null;
}

/**
 * Gain applied to the EMA velocity in the width formula
 * (`maxWidth / (1 + GAIN · v)`). Fixed at 1 — the signature_pad value,
 * with velocity in px/ms: writing at 1 px/ms halves the width.
 */
const VELOCITY_GAIN = 1;

/**
 * EMA-filtered velocity → stroke width (radius) for one segment.
 *
 * The exact formula (SPEC §4.2 — shared verbatim by screen, PNG, and SVG):
 *
 * ```
 * v_raw  = dtMs > 0 ? distance / dtMs : 0        (px/ms; non-finite → 0)
 * v_ema  = w · v_raw + (1 − w) · prevVelocity    (w = velocityFilterWeight)
 * w_vel  = maxWidth / (1 + v_ema)                (monotone ↓ in velocity)
 * width  = pressure == null
 *        ? clamp(w_vel, minWidth, maxWidth)
 *        : clamp(0.5 · w_vel + 0.5 · (minWidth + (maxWidth − minWidth) · clamp01(pressure)),
 *                minWidth, maxWidth)
 * ```
 *
 * Fast movement thins the ink toward `minWidth`; slow movement fattens it
 * toward `maxWidth`. When stylus pressure is meaningful it contributes an
 * equal-weight blend: pressure 1 pulls toward `maxWidth`, pressure → 0
 * toward `minWidth`.
 *
 * Degenerate-input behavior (all deterministic):
 * - `dtMs <= 0`, non-finite `dtMs`/`distance`, or negative `distance` →
 *   raw velocity 0 (a zero-time segment is treated as stationary, never
 *   `Infinity`);
 * - non-finite `prevVelocity` → treated as 0;
 * - `velocityFilterWeight` is clamped to `[0, 1]`.
 *
 * Returns the clamped `width` and the unclamped `velocity` (v_ema) to
 * carry into the next segment's `prevVelocity`.
 *
 * @example
 * ```ts
 * import { widthForSegment } from "@usefy/signature-pad/headless";
 *
 * widthForSegment({
 *   prevVelocity: 0, distance: 10, dtMs: 10,
 *   minWidth: 0.5, maxWidth: 2.5, velocityFilterWeight: 0.7, pressure: null,
 * });
 * // v_raw = 1, v_ema = 0.7, width = 2.5 / 1.7 ≈ 1.4706
 * ```
 */
export function widthForSegment(input: WidthInput): { width: number; velocity: number } {
  const w = Math.min(1, Math.max(0, input.velocityFilterWeight));
  const prev = Number.isFinite(input.prevVelocity) ? input.prevVelocity : 0;
  const rawVelocity =
    Number.isFinite(input.distance) &&
    Number.isFinite(input.dtMs) &&
    input.dtMs > 0 &&
    input.distance > 0
      ? input.distance / input.dtMs
      : 0;
  const velocity = w * rawVelocity + (1 - w) * prev;

  let width = input.maxWidth / (1 + VELOCITY_GAIN * velocity);
  if (input.pressure !== null) {
    const p = Math.min(1, Math.max(0, input.pressure));
    const pressureWidth = input.minWidth + (input.maxWidth - input.minWidth) * p;
    width = 0.5 * width + 0.5 * pressureWidth;
  }
  width = Math.min(input.maxWidth, Math.max(input.minWidth, width));
  return { width, velocity };
}

/**
 * The width (radius) a stroke starts with, and the radius of a tap-dot:
 * the midpoint of the configured width range — signature_pad's
 * `dotSize`/initial `_lastWidth` convention.
 *
 * @example
 * ```ts
 * import { startWidthFor } from "@usefy/signature-pad/headless";
 *
 * startWidthFor(0.5, 2.5); // 1.5
 * ```
 */
export function startWidthFor(minWidth: number, maxWidth: number): number {
  return (minWidth + maxWidth) / 2;
}
