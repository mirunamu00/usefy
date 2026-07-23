/**
 * Canvas rendering for the signature engine — dot-stamped draw steps
 * (SPEC §4.2 flatten model) for both the incremental live path and full
 * replay. All coordinates are CSS px; the engine's DPR transform maps
 * them onto the backing store.
 *
 * Framework-free; only touches the 2D context it is handed.
 */
import type { SignatureStroke } from "../types";
import type { FlatStep } from "../ink/bezier";
import { strokeSteps } from "../ink/strokeWalker";

/**
 * Stamp a batch of draw steps as filled dots of the step's radius —
 * one `beginPath` + `fill` per batch, `moveTo` + `arc` per dot (the
 * signature_pad render model; `moveTo` to the arc's start point prevents
 * connecting lines between dots inside the shared path).
 */
export function drawSteps(
  ctx: CanvasRenderingContext2D,
  color: string,
  steps: readonly FlatStep[],
): void {
  if (steps.length === 0) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const step of steps) {
    ctx.moveTo(step.x + step.width, step.y);
    ctx.arc(step.x, step.y, step.width, 0, Math.PI * 2);
  }
  ctx.fill();
}

/**
 * Wipe the canvas (CSS-px viewport) and repaint the optional opaque
 * background beneath where the ink will go.
 */
export function clearAndFill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: string | undefined,
): void {
  ctx.clearRect(0, 0, width, height);
  if (background !== undefined) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Draw every committed stroke from scratch by walking the exact same
 * pipeline as incremental input ({@link strokeSteps}) — deterministic
 * replay is identical geometry by construction (SPEC §3.1). Strokes are
 * self-contained, so no geometry options are needed.
 */
export function replayStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: readonly SignatureStroke[],
): void {
  for (const stroke of strokes) {
    drawSteps(ctx, stroke.color, strokeSteps(stroke));
  }
}
