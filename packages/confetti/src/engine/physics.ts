/**
 * Pure particle physics for `@usefy/confetti` — no DOM, no canvas, no
 * randomness of its own (the RNG is injected). Everything here is
 * deterministic given the same inputs, which is what the test-suite and
 * the dt-scaling guarantee rely on.
 *
 * ## Time-based integration (exact, not Euler)
 *
 * `stepParticle` integrates each step in closed form, so stepping 1000ms
 * in one call produces the same state as 60 calls of ~16.67ms (to floating
 * point precision):
 *
 * - Ballistic velocity decays exponentially: `v(t) = v0 · decay^t`
 *   (t in seconds). Position contribution over a step of `T`s is the exact
 *   integral `v0 · (decay^T − 1) / ln(decay)` (or `v0 · T` when decay = 1).
 * - Gravity is a constant acceleration on a separate, non-decaying fall
 *   velocity: `Δy = fallVelocity·T + ½·g·T²`, `fallVelocity += g·T`.
 * - Drift is a constant horizontal velocity: `Δx = drift·T`.
 * - Rotation/tumble/wobble phases advance linearly (`phase += speed·T`).
 * - Opacity is derived purely from remaining life (linear fade over the
 *   final {@link FADE_PORTION} of the lifetime).
 */
import type { Particle, ResolvedFireOptions } from "../types";

/** Conversion from `startVelocity` (px/frame @60fps equivalent) to px/s. */
export const VELOCITY_SCALE = 60;
/**
 * Gravity acceleration at `gravity: 1`, px/s². Tuned by eye in browser QA:
 * 800 made the fall phase read like a rock; 350 gives a confetti flutter
 * while still clearing the viewport within the default lifetime.
 */
export const GRAVITY_ACCEL = 350;
/**
 * `FireOptions.decay` is *per-frame retention at 60fps* (the scale
 * canvas-confetti users know: 0.9 ≈ lively burst that settles fast).
 * {@link spawnParticle} converts it once — `decay^60` — into the exact
 * per-second retention the closed-form integrator consumes.
 */
export const DECAY_FRAMES_PER_SECOND = 60;
/** Horizontal drift speed at `drift: 1`, px/s. */
export const DRIFT_SPEED = 60;
/** Max |2D rotation| speed, rad/s (spawned uniformly in ±this). */
export const MAX_ROTATION_SPEED = Math.PI * 2;
/** Tumble (scaleY oscillation) speed range, rad/s. */
export const TUMBLE_SPEED_MIN = Math.PI;
export const TUMBLE_SPEED_MAX = Math.PI * 3;
/** Wobble speed range, rad/s. */
export const WOBBLE_SPEED_MIN = Math.PI;
export const WOBBLE_SPEED_MAX = Math.PI * 2;
/** Wobble amplitude range, px (scaled by `scalar`). */
export const WOBBLE_AMP_MIN = 1;
export const WOBBLE_AMP_MAX = 4;
/** Portion of the lifetime over which opacity fades to 0 at the end. */
export const FADE_PORTION = 0.2;
/** Per-particle spread applied to `startVelocity` (× 0.75–1.25). */
export const SPEED_JITTER_MIN = 0.75;
export const SPEED_JITTER_SPAN = 0.5;
/** Per-particle lifetime jitter (× 0.8–1.2). */
export const LIFETIME_JITTER_MIN = 0.8;
export const LIFETIME_JITTER_SPAN = 0.4;

/**
 * Initialize a (pooled) particle for launch. Pure aside from mutating `p`;
 * all randomness comes from the injected `random` (a `Math.random`-like
 * `() => number` in `[0, 1)`), so a seeded RNG yields fully deterministic
 * particles.
 *
 * `p.x`/`p.y` are set to the **normalized** origin (0–1) — the engine
 * scales them to canvas pixels right after spawning.
 *
 * RNG call order (relied on by tests): 1 angle offset, 2 speed jitter,
 * 3 lifetime jitter, 4 rotation, 5 rotation speed, 6 tumble phase*,
 * 7 tumble speed* (*skipped when `flat`), 8 wobble phase, 9 wobble speed,
 * 10 wobble amplitude, 11 color index, 12 shape index, 13 origin jitter x,
 * 14 origin jitter y (13–14 always consumed, even when the jitter is 0,
 * so the stream layout never depends on option values).
 *
 * @example
 * ```ts
 * import { spawnParticle, resolveFireOptions } from "@usefy/confetti/headless";
 *
 * const p = {} as Particle;
 * spawnParticle(p, resolveFireOptions({ angle: 90, spread: 0 }), () => 0.5);
 * p.vx; // 0 (straight up)
 * p.vy; // -2700 (45 px/frame ≈ 2700 px/s, upward)
 * ```
 */
export function spawnParticle(
  p: Particle,
  opts: ResolvedFireOptions,
  random: () => number,
): void {
  p.x = opts.origin.x;
  p.y = opts.origin.y;

  const angleDeg = opts.angle + (random() - 0.5) * opts.spread;
  const angleRad = (angleDeg * Math.PI) / 180;
  const speed =
    opts.startVelocity *
    (SPEED_JITTER_MIN + random() * SPEED_JITTER_SPAN) *
    VELOCITY_SCALE;
  // Canvas y grows downward, so "up" (angle 90) is negative vy.
  p.vx = Math.cos(angleRad) * speed;
  p.vy = -Math.sin(angleRad) * speed;

  p.fallVelocity = 0;
  p.gravity = opts.gravity * GRAVITY_ACCEL;
  p.drift = opts.drift * DRIFT_SPEED;
  // Convert the user-facing per-frame@60fps retention to the per-second
  // retention the integrator uses (floored so extreme decays can't
  // underflow to an exact 0, which would break the ln() in stepParticle).
  p.decay = Math.max(Math.pow(opts.decay, DECAY_FRAMES_PER_SECOND), 1e-300);

  p.lifetime = opts.lifetime * (LIFETIME_JITTER_MIN + random() * LIFETIME_JITTER_SPAN);
  p.life = p.lifetime;
  p.opacity = 1;

  p.rotation = random() * Math.PI * 2;
  p.rotationSpeed = (random() - 0.5) * 2 * MAX_ROTATION_SPEED;
  if (opts.flat) {
    p.tumblePhase = 0;
    p.tumbleSpeed = 0;
  } else {
    p.tumblePhase = random() * Math.PI * 2;
    p.tumbleSpeed =
      TUMBLE_SPEED_MIN + random() * (TUMBLE_SPEED_MAX - TUMBLE_SPEED_MIN);
  }
  p.wobblePhase = random() * Math.PI * 2;
  p.wobbleSpeed =
    WOBBLE_SPEED_MIN + random() * (WOBBLE_SPEED_MAX - WOBBLE_SPEED_MIN);
  p.wobbleAmp = (WOBBLE_AMP_MIN + random() * (WOBBLE_AMP_MAX - WOBBLE_AMP_MIN)) * opts.scalar;

  p.color = pick(opts.colors, random);
  p.shape = pick(opts.shapes, random);
  p.scalar = opts.scalar;
  p.cohort = -1;

  // Origin jitter last (RNG calls 13–14, always consumed): uniform within
  // origin ± jitter/2, in the same normalized units as the origin itself.
  p.x += (random() - 0.5) * opts.originJitter.x;
  p.y += (random() - 0.5) * opts.originJitter.y;
}

function pick<T>(list: readonly T[], random: () => number): T {
  const index = Math.min(list.length - 1, Math.floor(random() * list.length));
  return list[index];
}

/**
 * Advance a particle by `dtMs` milliseconds. Returns `false` when the
 * particle's lifetime has expired (the caller releases it back to the
 * pool); `true` while it is still alive.
 *
 * Integration is exact per step (see the module doc), so any partitioning
 * of a time interval into steps yields the same final state — the engine's
 * frame rate never changes the motion.
 *
 * @example
 * ```ts
 * import { stepParticle } from "@usefy/confetti/headless";
 *
 * // One 1000ms step ≡ 60 steps of 1000/60 ms:
 * const alive = stepParticle(p, 1000);
 * ```
 */
export function stepParticle(p: Particle, dtMs: number): boolean {
  if (p.life <= 0) return false;
  if (dtMs <= 0) return true;

  p.life -= dtMs;
  if (p.life <= 0) {
    p.life = 0;
    p.opacity = 0;
    return false;
  }

  const dt = dtMs / 1000;

  // Ballistic velocity: exact exponential decay integral.
  let retained: number;
  let integral: number;
  if (p.decay === 1) {
    retained = 1;
    integral = dt;
  } else {
    retained = Math.pow(p.decay, dt);
    integral = (retained - 1) / Math.log(p.decay);
  }
  p.x += p.vx * integral + p.drift * dt;
  p.y += p.vy * integral + p.fallVelocity * dt + 0.5 * p.gravity * dt * dt;
  p.vx *= retained;
  p.vy *= retained;
  p.fallVelocity += p.gravity * dt;

  p.rotation += p.rotationSpeed * dt;
  p.tumblePhase += p.tumbleSpeed * dt;
  p.wobblePhase += p.wobbleSpeed * dt;

  const fadeWindow = p.lifetime * FADE_PORTION;
  p.opacity = p.life < fadeWindow ? Math.max(0, p.life / fadeWindow) : 1;

  return true;
}
