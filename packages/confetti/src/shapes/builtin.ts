/**
 * Built-in confetti shapes — square, circle, strip, star — drawn with
 * manual transform math (rotated/tumbled vertices computed in JS, no
 * `save()`/`restore()` or per-particle `setTransform`, keeping the hot
 * draw loop allocation- and state-churn-free).
 *
 * The 3D tumble is a `scaleY` factor (`cos(tumblePhase)`) applied to each
 * shape's **local** y axis before the 2D rotation — a thin card flipping
 * over while spinning.
 */
import type { BuiltinShape } from "../types";

/**
 * The identifiers of every built-in shape.
 *
 * @example
 * ```ts
 * import { BUILTIN_SHAPES } from "@usefy/confetti/headless";
 *
 * engine.fire({ shapes: [...BUILTIN_SHAPES] }); // use all four
 * ```
 */
export const BUILTIN_SHAPES = ["square", "circle", "strip", "star"] as const;

/** Half-extent of the square shape at `scalar: 1`, px. */
export const SQUARE_HALF = 5;
/** Strip (ribbon) half-width at `scalar: 1`, px. */
export const STRIP_HALF_WIDTH = 1.5;
/** Strip (ribbon) half-length at `scalar: 1`, px. */
export const STRIP_HALF_LENGTH = 6;
/** Circle radius at `scalar: 1`, px. */
export const CIRCLE_RADIUS = 4;
/** Star outer vertex radius at `scalar: 1`, px. */
export const STAR_OUTER_RADIUS = 5.5;
/** Star inner vertex radius at `scalar: 1`, px. */
export const STAR_INNER_RADIUS = 2.75;
/** Number of star points. */
export const STAR_POINTS = 5;

/**
 * Fill an axis-extent quad (square/strip) centered on `(x, y)`, with the
 * local y extent scaled by `scaleY` (tumble) and the whole quad rotated.
 */
function fillQuad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  rotation: number,
  scaleY: number,
): void {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const hy = halfH * scaleY;
  ctx.beginPath();
  ctx.moveTo(x + -halfW * cos - -hy * sin, y + -halfW * sin + -hy * cos);
  ctx.lineTo(x + halfW * cos - -hy * sin, y + halfW * sin + -hy * cos);
  ctx.lineTo(x + halfW * cos - hy * sin, y + halfW * sin + hy * cos);
  ctx.lineTo(x + -halfW * cos - hy * sin, y + -halfW * sin + hy * cos);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw one built-in shape with the current `fillStyle`/`globalAlpha`.
 *
 * @param ctx - Target 2D context (fill state already set by the caller).
 * @param shape - Which built-in to draw.
 * @param x - Center x, CSS px (wobble already applied by the caller).
 * @param y - Center y, CSS px.
 * @param rotation - 2D rotation, radians.
 * @param scaleY - Tumble factor (`cos(tumblePhase)`; may be negative — a
 *   mirrored polygon, or `|scaleY|` for the circle's ellipse radius).
 * @param scalar - Size multiplier.
 *
 * Internal — called only from the renderer's built-in-shape branch.
 *
 * @example
 * ```ts
 * // Inside renderParticle, fill state already set:
 * ctx.fillStyle = p.color;
 * drawBuiltin(ctx, "star", x, y, p.rotation, Math.cos(p.tumblePhase), p.scalar);
 * ```
 */
export function drawBuiltin(
  ctx: CanvasRenderingContext2D,
  shape: BuiltinShape,
  x: number,
  y: number,
  rotation: number,
  scaleY: number,
  scalar: number,
): void {
  switch (shape) {
    case "square":
      fillQuad(ctx, x, y, SQUARE_HALF * scalar, SQUARE_HALF * scalar, rotation, scaleY);
      break;
    case "strip":
      fillQuad(
        ctx,
        x,
        y,
        STRIP_HALF_WIDTH * scalar,
        STRIP_HALF_LENGTH * scalar,
        rotation,
        scaleY,
      );
      break;
    case "circle": {
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        CIRCLE_RADIUS * scalar,
        CIRCLE_RADIUS * scalar * Math.abs(scaleY),
        rotation,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    }
    case "star": {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      ctx.beginPath();
      for (let i = 0; i < STAR_POINTS * 2; i++) {
        const r = (i % 2 === 0 ? STAR_OUTER_RADIUS : STAR_INNER_RADIUS) * scalar;
        // Start pointing up (-90°) in canvas coordinates.
        const a = (i * Math.PI) / STAR_POINTS - Math.PI / 2;
        const lx = Math.cos(a) * r;
        const ly = Math.sin(a) * r * scaleY;
        const wx = x + lx * cos - ly * sin;
        const wy = y + lx * sin + ly * cos;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}
