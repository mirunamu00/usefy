/**
 * Shared types and option resolution for `@usefy/confetti`.
 *
 * Everything in this module is framework-free and SSR-safe — no
 * `window`/`document`/canvas access happens at module scope or inside
 * `resolveFireOptions`.
 */

/**
 * Identifiers of the shapes built into the engine.
 *
 * - `"square"` — a small tumbling square (classic confetti chad).
 * - `"circle"` — a dot; tumble squashes it into an ellipse.
 * - `"strip"`  — a long thin ribbon.
 * - `"star"`   — a five-point star.
 *
 * @example
 * ```ts
 * import { BUILTIN_SHAPES, type BuiltinShape } from "@usefy/confetti/headless";
 *
 * const gold: BuiltinShape[] = ["star"];
 * console.log(BUILTIN_SHAPES); // ["square", "circle", "strip", "star"]
 * ```
 */
export type BuiltinShape = "square" | "circle" | "strip" | "star";

/**
 * A rasterized sprite ready to be drawn with `drawImage`.
 *
 * `width`/`height` are the draw size in CSS pixels (the engine centers the
 * sprite on the particle position).
 *
 * @example
 * ```ts
 * import type { SpriteEntry } from "@usefy/confetti/headless";
 *
 * const entry: SpriteEntry = { source: myOffscreenCanvas, width: 24, height: 24 };
 * ```
 */
export interface SpriteEntry {
  /** Bitmap source accepted by `CanvasRenderingContext2D.drawImage`. */
  source: CanvasImageSource;
  /** Draw width in CSS pixels. */
  width: number;
  /** Draw height in CSS pixels. */
  height: number;
}

/**
 * A sprite-based custom confetti shape — rasterized once, then drawn with
 * `drawImage` every frame (with the particle's rotation, tumble, and
 * scalar applied).
 *
 * This is what `textShape()` and `imageShape()` produce. The engine calls
 * {@link SpriteShape.rasterize} once per `key` and caches the result;
 * returning `null` means "not ready yet" (e.g. an image still decoding) —
 * the engine skips drawing and retries on a later frame without caching
 * the miss.
 *
 * The sprite's `width`/`height` are its size at `scalar: 1`; the renderer
 * multiplies by each particle's `scalar`.
 *
 * @example
 * ```ts
 * import type { SpriteShape } from "@usefy/confetti/headless";
 *
 * const dot: SpriteShape = {
 *   key: "red-dot@1",
 *   rasterize() {
 *     const c = document.createElement("canvas");
 *     c.width = c.height = 16;
 *     const g = c.getContext("2d")!;
 *     g.fillStyle = "red";
 *     g.beginPath();
 *     g.arc(8, 8, 8, 0, Math.PI * 2);
 *     g.fill();
 *     return { source: c, width: 16, height: 16 };
 *   },
 * };
 * ```
 */
export interface SpriteShape {
  /** Stable cache key — one raster is produced and reused per key. */
  readonly key: string;
  /**
   * Produce the sprite. `scalar` is the size multiplier of the first
   * particle that needed this sprite — implementations may use it to pick
   * a raster resolution (the *drawn* size always follows each particle's
   * own `scalar`). Return `null` if not ready yet (retried next frame).
   */
  rasterize(scalar: number): SpriteEntry | null;
}

/**
 * A vector custom confetti shape: a `Path2D` whose coordinates live in the
 * unit box `[0,1]×[0,1]`. It is filled with each particle's own color and
 * drawn with full rotation/tumble — unlike sprites, path shapes stay
 * per-particle colorable.
 *
 * Produced by `pathShape()`. `path()` may return `null` when `Path2D` is
 * unavailable (SSR/old environments) — the particle is simply skipped.
 *
 * @example
 * ```ts
 * import type { PathShape } from "@usefy/confetti/headless";
 *
 * const triangle: PathShape = {
 *   key: "triangle@1",
 *   size: 12,
 *   path() {
 *     const p = new Path2D();
 *     p.moveTo(0.5, 0);
 *     p.lineTo(1, 1);
 *     p.lineTo(0, 1);
 *     p.closePath();
 *     return p;
 *   },
 * };
 * ```
 */
export interface PathShape {
  /** Stable identity key for this shape. */
  readonly key: string;
  /**
   * Return the unit-box `Path2D` (memoize it yourself — called per draw).
   * `null` = environment can't build paths; the particle is skipped.
   */
  path(): Path2D | null;
  /** Drawn size of the unit box at `scalar: 1`, in px. Default `10`. */
  readonly size?: number;
}

/**
 * Any custom (non-built-in) confetti shape: sprite-based
 * ({@link SpriteShape} — `textShape`, `imageShape`) or vector
 * ({@link PathShape} — `pathShape`).
 *
 * @example
 * ```ts
 * import { textShape, pathShape, type CustomShape } from "@usefy/confetti/headless";
 *
 * const shapes: CustomShape[] = [textShape("🎉"), pathShape(() => myPath())];
 * ```
 */
export type CustomShape = SpriteShape | PathShape;

/**
 * Any shape a particle can take: a built-in identifier or a custom sprite
 * shape (see {@link CustomShape}).
 *
 * @example
 * ```ts
 * import type { ConfettiShape } from "@usefy/confetti/headless";
 *
 * const mix: ConfettiShape[] = ["square", "circle", "strip"];
 * ```
 */
export type ConfettiShape = BuiltinShape | CustomShape;

/**
 * Options for a single confetti burst — shared by every layer of the
 * package (`fireConfetti()`, `<Confetti />`, `useConfetti()`, and the
 * headless engine's `fire()`/`emit()`).
 *
 * All fields are optional; see {@link resolveFireOptions} for the defaults.
 *
 * @example
 * ```ts
 * import { createConfettiEngine } from "@usefy/confetti/headless";
 *
 * const engine = createConfettiEngine(canvas);
 * await engine.fire({
 *   count: 120,
 *   origin: { x: 0.5, y: 0.7 },
 *   angle: 90,
 *   spread: 60,
 *   colors: ["#ff6b6b", "#fee440"],
 * });
 * ```
 */
export interface FireOptions {
  /** Number of particles in the burst. Default `80`. */
  count?: number;
  /**
   * Launch origin in normalized canvas coordinates (`0`–`1` on each axis;
   * values outside the range spawn off-canvas). Default `{ x: 0.5, y: 0.5 }`.
   */
  origin?: { x?: number; y?: number };
  /**
   * Random per-particle spawn-position jitter around `origin`, in
   * normalized canvas units (full width — a particle spawns uniformly
   * within `origin ± jitter/2`). `{ x: 1 }` spreads spawns across the
   * whole canvas width: exactly what `snow`/`rain` emitters need instead
   * of a single point source. Default `{ x: 0, y: 0 }`.
   */
  originJitter?: { x?: number; y?: number };
  /** Launch direction in degrees — `90` points straight up. Default `90`. */
  angle?: number;
  /** Cone width in degrees around `angle`. Default `45`. */
  spread?: number;
  /**
   * Initial speed in px-per-frame at 60fps equivalent (i.e. `1` ≈ 60 px/s).
   * Default `45`.
   */
  startVelocity?: number;
  /** Downward acceleration multiplier (`0` = weightless). Default `1`. */
  gravity?: number;
  /** Constant horizontal push (positive = right). Default `0`. */
  drift?: number;
  /**
   * Ballistic velocity retention **per frame at 60fps** — the scale
   * canvas-confetti users know: `0.9` keeps 90% each ~16.7ms (a lively
   * burst that settles into a gravity flutter within ~0.5s); closer to `1`
   * glides further. Internally converted to an exact per-second value, so
   * motion is identical at any real frame rate. Clamped to `(0, 1]`.
   * Default `0.9`.
   */
  decay?: number;
  /** Particle size multiplier. Default `1`. */
  scalar?: number;
  /**
   * Particle lifetime in milliseconds, randomized ±20% per particle.
   * Default `3000`.
   */
  lifetime?: number;
  /** Fill colors (any canvas color string). Default: 7-color vivid palette. */
  colors?: readonly string[];
  /** Shape mix particles are drawn from. Default `["square", "circle", "strip"]`. */
  shapes?: readonly ConfettiShape[];
  /** Disable the 3D tumble (scaleY oscillation). Default `false`. */
  flat?: boolean;
}

/**
 * {@link FireOptions} with every field required and sanitized — what the
 * physics layer actually consumes. Produced by {@link resolveFireOptions}.
 *
 * @example
 * ```ts
 * import { resolveFireOptions } from "@usefy/confetti/headless";
 *
 * const resolved = resolveFireOptions({ count: 10 });
 * resolved.angle; // 90 (default filled in)
 * ```
 */
export interface ResolvedFireOptions {
  count: number;
  origin: { x: number; y: number };
  originJitter: { x: number; y: number };
  angle: number;
  spread: number;
  startVelocity: number;
  gravity: number;
  drift: number;
  decay: number;
  scalar: number;
  lifetime: number;
  colors: readonly string[];
  shapes: readonly ConfettiShape[];
  flat: boolean;
}

/**
 * Options for a continuous emitter ({@link ConfettiEngine.emit}) — a burst
 * config plus a spawn rate.
 *
 * @example
 * ```ts
 * import { createConfettiEngine } from "@usefy/confetti/headless";
 *
 * const engine = createConfettiEngine(canvas);
 * const snow = engine.emit({
 *   particlesPerSecond: 12,
 *   origin: { x: 0.5, y: -0.05 },
 *   angle: -90,
 *   spread: 30,
 *   startVelocity: 4,
 *   gravity: 0.2,
 * });
 * // later
 * snow.stop();
 * ```
 */
export interface EmitOptions extends FireOptions {
  /** Spawn rate. Default `30`. */
  particlesPerSecond?: number;
}

/**
 * Options for {@link createConfettiEngine}.
 *
 * @example
 * ```ts
 * import { createConfettiEngine } from "@usefy/confetti/headless";
 *
 * const engine = createConfettiEngine(canvas, {
 *   reducedMotion: "ignore",
 *   poolSize: 1000,
 *   dpr: 1,
 * });
 * ```
 */
export interface ConfettiEngineOptions {
  /**
   * How to treat the user's `prefers-reduced-motion: reduce` setting:
   * `"respect"` (default) makes `fire()`/`emit()` resolve immediately as
   * no-ops; `"ignore"` runs the animation anyway.
   */
  reducedMotion?: "respect" | "ignore";
  /** Initial particle pool size (grows on demand). Default `500`. */
  poolSize?: number;
  /**
   * Device-pixel-ratio override for backing-store sizing. Default:
   * `window.devicePixelRatio`, capped at `2`.
   */
  dpr?: number;
}

/**
 * Handle returned by {@link ConfettiEngine.emit} controlling one continuous
 * emitter.
 *
 * @example
 * ```ts
 * const handle = engine.emit({ particlesPerSecond: 20 });
 * handle.active; // true
 * handle.stop(); // stop spawning; live particles finish naturally
 * handle.active; // false
 * ```
 */
export interface EmitHandle {
  /** Stop spawning. Particles already alive finish their lifetime naturally. */
  stop(): void;
  /** `true` while the emitter is still spawning. */
  readonly active: boolean;
}

/**
 * The headless confetti engine — one per canvas. Created with
 * {@link createConfettiEngine}; drives a single `requestAnimationFrame`
 * loop that runs only while particles are alive or emitters are active.
 *
 * @example
 * ```ts
 * import { createConfettiEngine } from "@usefy/confetti/headless";
 *
 * const canvas = document.querySelector("canvas")!;
 * const engine = createConfettiEngine(canvas);
 * await engine.fire({ count: 100 });  // resolves when the burst has died out
 * engine.destroy();                   // full teardown
 * ```
 */
export interface ConfettiEngine {
  /**
   * Fire one burst. Resolves when every particle of *this* burst has died
   * (overlapping bursts resolve independently). Resolves immediately under
   * reduced motion (`reducedMotion: "respect"`) or after `destroy()`.
   */
  fire(opts?: FireOptions): Promise<void>;
  /**
   * Start a continuous emitter spawning `particlesPerSecond` until the
   * returned handle's `stop()` is called. Returns an inert handle under
   * reduced motion, after `destroy()`, or for a rate of `0` (which could
   * never spawn anything).
   */
  emit(opts?: EmitOptions): EmitHandle;
  /** Stop all emitters. Bursts and live particles finish naturally. */
  stop(): void;
  /** Kill every particle and emitter and wipe the canvas immediately. */
  clear(): void;
  /**
   * Freeze the loop (e.g. page hidden). The last drawn frame stays on the
   * canvas — unless a resize happens while paused (resizing a canvas
   * resets its bitmap, leaving it blank until the next drawn frame after
   * `resume()`).
   */
  pause(): void;
  /** Unfreeze after {@link ConfettiEngine.pause} — no catch-up teleport. */
  resume(): void;
  /** `clear()` + release the ResizeObserver and rAF; the engine is dead after this. */
  destroy(): void;
  /** Re-sync the backing store to the canvas CSS size × device pixel ratio. */
  resize(): void;
  /**
   * Subscribe to idle↔active edges. The listener receives the new `active`
   * value, only when it actually flips (never per-frame, never on
   * subscribe). Returns an unsubscribe function. Listeners are released on
   * `destroy()` (after a final `false` notification if the engine was
   * active).
   *
   * This is the seam the React layer uses for `onComplete`/`isActive`
   * without any per-frame React work.
   *
   * @example
   * ```ts
   * const off = engine.onActiveChange((active) => {
   *   if (!active) console.log("all confetti has settled");
   * });
   * // later
   * off();
   * ```
   */
  onActiveChange(listener: (active: boolean) => void): () => void;
  /** `true` while particles are alive or an emitter is active. */
  readonly active: boolean;
}

/**
 * One pooled particle. Mutable by design — the engine recycles these
 * objects through a pool so the steady-state hot loop performs zero
 * allocations. Positions/velocities are in CSS pixels (px, px/s);
 * `spawnParticle` writes `x`/`y` as *normalized* origin coordinates which
 * the engine immediately scales to pixels.
 *
 * @example
 * ```ts
 * import { spawnParticle, stepParticle, resolveFireOptions } from "@usefy/confetti/headless";
 *
 * const p = {} as import("@usefy/confetti/headless").Particle;
 * spawnParticle(p, resolveFireOptions(), Math.random);
 * const stillAlive = stepParticle(p, 16.67);
 * ```
 */
export interface Particle {
  /** Position (CSS px; normalized 0–1 immediately after `spawnParticle`). */
  x: number;
  y: number;
  /** Decaying ballistic velocity, px/s. */
  vx: number;
  vy: number;
  /** Gravity-accumulated fall velocity, px/s (does not decay). */
  fallVelocity: number;
  /** Gravity acceleration, px/s². */
  gravity: number;
  /** Constant horizontal drift velocity, px/s. */
  drift: number;
  /** Per-second ballistic-velocity retention, `(0, 1]`. */
  decay: number;
  /** 2D rotation, radians. */
  rotation: number;
  /** 2D rotation speed, rad/s. */
  rotationSpeed: number;
  /** 3D tumble phase — drawn `scaleY = cos(tumblePhase)`. */
  tumblePhase: number;
  /** Tumble speed, rad/s (`0` when `flat`). */
  tumbleSpeed: number;
  /** Horizontal wobble phase (applied at draw time, not to `x`). */
  wobblePhase: number;
  /** Wobble speed, rad/s. */
  wobbleSpeed: number;
  /** Wobble amplitude, px. */
  wobbleAmp: number;
  /** Total lifetime, ms (after per-particle jitter). */
  lifetime: number;
  /** Remaining life, ms. Dead at `<= 0`. */
  life: number;
  /** Current opacity (fades out near end of life). */
  opacity: number;
  /** Fill color. */
  color: string;
  /** Shape drawn for this particle. */
  shape: ConfettiShape;
  /** Size multiplier. */
  scalar: number;
  /** Engine bookkeeping: id of the `fire()` cohort (`-1` = emitter/none). */
  cohort: number;
}

/**
 * Default fill palette — 7 vivid, brand-neutral colors.
 *
 * @example
 * ```ts
 * import { DEFAULT_COLORS } from "@usefy/confetti/headless";
 *
 * engine.fire({ colors: [...DEFAULT_COLORS, "#000000"] });
 * ```
 */
export const DEFAULT_COLORS: readonly string[] = [
  "#4f8ef7",
  "#9b5de5",
  "#f15bb5",
  "#fee440",
  "#00bbf9",
  "#00f5d4",
  "#ff6b6b",
];

/**
 * Default shape mix for bursts.
 *
 * @example
 * ```ts
 * import { DEFAULT_SHAPES } from "@usefy/confetti/headless";
 *
 * console.log(DEFAULT_SHAPES); // ["square", "circle", "strip"]
 * ```
 */
export const DEFAULT_SHAPES: readonly BuiltinShape[] = [
  "square",
  "circle",
  "strip",
];

/**
 * Default spawn rate for {@link ConfettiEngine.emit}.
 *
 * @example
 * ```ts
 * import { DEFAULT_PARTICLES_PER_SECOND } from "@usefy/confetti/headless";
 *
 * engine.emit(); // spawns DEFAULT_PARTICLES_PER_SECOND (30) particles/s
 * ```
 */
export const DEFAULT_PARTICLES_PER_SECOND = 30;

/** Smallest accepted `decay` (avoids `log(0)` in the exact integrator). */
const MIN_DECAY = 0.0001;

function clampNumber(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Coerce a possibly-absent/degenerate numeric option to a finite number.
 * `NaN`/`±Infinity`/`undefined` all fall back — a non-finite `count` or
 * `lifetime` must never produce a forever-pending promise, an immortal
 * particle, or a synchronous `while` freeze.
 *
 * Internal (shared with the engine for `particlesPerSecond`/`poolSize`/
 * `dpr`); not part of the public `./headless` surface.
 *
 * @example
 * ```ts
 * toFinite(NaN, 80);      // 80
 * toFinite(Infinity, 80); // 80
 * toFinite(12, 80);       // 12
 * ```
 */
export function toFinite(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Fill in defaults and sanitize a {@link FireOptions} object into a
 * {@link ResolvedFireOptions}. Pure — safe to call anywhere, including
 * during SSR. The returned object (including `origin`, `colors`, and
 * `shapes`) is freshly allocated, never a shared reference to the input or
 * to the default arrays.
 *
 * Sanitization: `count` is floored and clamped to `>= 0`; `spread` and
 * `startVelocity` clamp to `>= 0`; `decay` clamps to `(0, 1]`; `scalar`
 * clamps to `>= 0.05`; `lifetime` clamps to `>= 1`; empty `colors`/`shapes`
 * arrays fall back to the defaults. Every numeric field also rejects
 * `NaN`/`±Infinity` by falling back to its default — degenerate numbers
 * can never produce an unbounded spawn loop or an immortal particle.
 *
 * @example
 * ```ts
 * import { resolveFireOptions } from "@usefy/confetti/headless";
 *
 * resolveFireOptions();                    // all defaults (count 80, angle 90, …)
 * resolveFireOptions({ origin: { x: 0 } }); // origin { x: 0, y: 0.5 }
 * resolveFireOptions({ decay: 5 }).decay;   // 1 (clamped)
 * ```
 */
export function resolveFireOptions(
  options: FireOptions = {},
): ResolvedFireOptions {
  const colors =
    options.colors && options.colors.length > 0
      ? [...options.colors]
      : [...DEFAULT_COLORS];
  const shapes =
    options.shapes && options.shapes.length > 0
      ? [...options.shapes]
      : [...DEFAULT_SHAPES];
  return {
    count: Math.max(0, Math.floor(toFinite(options.count, 80))),
    origin: {
      x: toFinite(options.origin?.x, 0.5),
      y: toFinite(options.origin?.y, 0.5),
    },
    originJitter: {
      x: Math.max(0, toFinite(options.originJitter?.x, 0)),
      y: Math.max(0, toFinite(options.originJitter?.y, 0)),
    },
    angle: toFinite(options.angle, 90),
    spread: Math.max(0, toFinite(options.spread, 45)),
    startVelocity: Math.max(0, toFinite(options.startVelocity, 45)),
    gravity: toFinite(options.gravity, 1),
    drift: toFinite(options.drift, 0),
    decay: clampNumber(toFinite(options.decay, 0.9), MIN_DECAY, 1),
    scalar: Math.max(0.05, toFinite(options.scalar, 1)),
    lifetime: Math.max(1, toFinite(options.lifetime, 3000)),
    colors,
    shapes,
    flat: options.flat ?? false,
  };
}
