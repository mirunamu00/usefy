/**
 * Frame rendering for `@usefy/confetti`.
 *
 * Draw contract (SPEC §4.3): a single `clearRect` per frame, one pass over
 * the alive particles, manual transform math for the built-in shapes (no
 * `save()`/`restore()` per particle), and a sprite cache so sprite shapes
 * (`textShape`/`imageShape`) rasterize **once** and are `drawImage`d
 * thereafter.
 *
 * ## Custom-shape transforms (why sprites/paths use `setTransform`)
 *
 * `drawImage` and `Path2D` filling have no rotation parameters, so rotated
 * sprite/path particles need a context transform. Instead of a
 * `save()`/`restore()` stack we compose the full matrix (DPR × translate ×
 * rotate × tumble-scale) in plain arithmetic and issue exactly **two**
 * `setTransform` calls per custom particle: one to place it, one to restore
 * the base DPR transform — cheaper than a state stack and consistent with
 * the vector shapes' manual math.
 */
import type { Particle, PathShape, SpriteEntry, SpriteShape } from "../types";
import { drawBuiltin } from "../shapes/builtin";

/** Drawn size (px at `scalar: 1`) of a {@link PathShape} unit box when the shape omits `size`. */
export const DEFAULT_PATH_SHAPE_SIZE = 10;

/**
 * Cache of rasterized sprites for sprite shapes, keyed by
 * {@link SpriteShape.key}. One entry per key — rasterization happens once,
 * every subsequent frame is a plain `drawImage`.
 *
 * Internal to the engine (each engine owns one) — not part of the public
 * `./headless` surface.
 */
export type SpriteCache = Map<string, SpriteEntry>;

/**
 * Create an empty {@link SpriteCache}. Internal — the engine calls this
 * once at construction.
 *
 * @example
 * ```ts
 * // Inside createConfettiEngine:
 * const sprites = createSpriteCache(); // filled lazily on first draw per key
 * ```
 */
export function createSpriteCache(): SpriteCache {
  return new Map();
}

/**
 * Draw one particle with the current context state. Applies the wobble
 * offset, opacity, color, tumble (`scaleY = cos(tumblePhase)`), rotation,
 * and shape. `dpr` is the device-pixel-ratio of the base transform — the
 * custom-shape branches compose it into their `setTransform` calls and
 * restore it afterwards.
 *
 * Sprite shapes are looked up in `sprites` by key; a cache miss calls
 * `rasterize(scalar)` — `null` results ("not ready", e.g. an image still
 * decoding) are skipped without caching so they retry on a later frame.
 * Sprite draw size is `entry.width/height × particle.scalar`.
 *
 * Internal — called only from {@link drawFrame}.
 *
 * @example
 * ```ts
 * // Inside drawFrame's pass over the alive particles:
 * renderParticle(ctx, particles[i], sprites, dpr);
 * ```
 */
export function renderParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  sprites: SpriteCache,
  dpr: number = 1,
): void {
  const x = p.x + Math.cos(p.wobblePhase) * p.wobbleAmp;
  const y = p.y;
  ctx.globalAlpha = p.opacity;
  const scaleY = Math.cos(p.tumblePhase);

  if (typeof p.shape === "string") {
    ctx.fillStyle = p.color;
    drawBuiltin(ctx, p.shape, x, y, p.rotation, scaleY, p.scalar);
    return;
  }

  const cos = Math.cos(p.rotation);
  const sin = Math.sin(p.rotation);

  if ("rasterize" in p.shape) {
    // Sprite shape (textShape / imageShape).
    const shape: SpriteShape = p.shape;
    let entry = sprites.get(shape.key);
    if (!entry) {
      const rastered = shape.rasterize(p.scalar);
      if (!rastered) return; // not ready yet — retry next frame, don't cache
      sprites.set(shape.key, rastered);
      entry = rastered;
    }
    const w = entry.width * p.scalar;
    const h = entry.height * p.scalar;
    // M = dpr · translate(x, y) · rotate(θ) · scale(1, scaleY)
    ctx.setTransform(
      dpr * cos,
      dpr * sin,
      -dpr * sin * scaleY,
      dpr * cos * scaleY,
      dpr * x,
      dpr * y,
    );
    ctx.drawImage(entry.source, -w / 2, -h / 2, w, h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // restore base
    return;
  }

  // Path shape: unit-box Path2D, filled with the particle's own color.
  const shape: PathShape = p.shape;
  const path = shape.path();
  if (!path) return; // Path2D unavailable — skip silently
  const size = (shape.size ?? DEFAULT_PATH_SHAPE_SIZE) * p.scalar;
  const sy = size * scaleY;
  ctx.fillStyle = p.color;
  // M = dpr · translate(x, y) · rotate(θ) · scale(size, size·scaleY) · translate(-0.5, -0.5)
  ctx.setTransform(
    dpr * cos * size,
    dpr * sin * size,
    -dpr * sin * sy,
    dpr * cos * sy,
    dpr * (x - 0.5 * cos * size + 0.5 * sin * sy),
    dpr * (y - 0.5 * sin * size - 0.5 * cos * sy),
  );
  ctx.fill(path);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // restore base
}

/**
 * Render a full frame: one `clearRect` over the CSS-pixel viewport, then
 * one draw pass over `particles`. Resets `globalAlpha` to `1` afterwards.
 *
 * Internal — the engine calls this once per rAF frame.
 *
 * @example
 * ```ts
 * // Inside the engine's frame():
 * drawFrame(ctx, alive, viewWidth, viewHeight, sprites, dpr);
 * ```
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  particles: readonly Particle[],
  width: number,
  height: number,
  sprites: SpriteCache,
  dpr: number = 1,
): void {
  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < particles.length; i++) {
    renderParticle(ctx, particles[i], sprites, dpr);
  }
  ctx.globalAlpha = 1;
}
