/**
 * Fixed-size particle pool for `@usefy/confetti`.
 *
 * The engine recycles particle objects through this pool so that the
 * steady-state animation loop performs **zero allocations**: after warm-up,
 * every `fire()` cohort reuses the exact same objects released by earlier
 * cohorts. The pool pre-allocates `initialSize` particles up front and
 * grows on demand (never shrinks).
 */
import type { Particle } from "../types";

/** Default number of particles pre-allocated by {@link createParticlePool}. */
export const DEFAULT_POOL_SIZE = 500;

/**
 * A recycling pool of {@link Particle} objects.
 *
 * @example
 * ```ts
 * const pool = createParticlePool(100);
 * const p = pool.take();   // reused (or newly grown) particle
 * pool.release(p);         // back to the free list
 * pool.allocated;          // total objects ever created (≥ 100)
 * pool.available;          // currently free
 * ```
 */
export interface ParticlePool {
  /** Get a particle — reuses a free one, allocates only when empty. */
  take(): Particle;
  /** Return a particle to the free list for reuse. */
  release(p: Particle): void;
  /** Total particles allocated by this pool (grows on demand, never shrinks). */
  readonly allocated: number;
  /** Particles currently available for `take()`. */
  readonly available: number;
}

/**
 * Create a zeroed particle object with every field present (monomorphic
 * shape — helps the JIT keep the hot loop fast).
 *
 * @example
 * ```ts
 * const p = createParticle();
 * p.life; // 0 (dead until spawnParticle initializes it)
 * ```
 */
export function createParticle(): Particle {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    fallVelocity: 0,
    gravity: 0,
    drift: 0,
    decay: 1,
    rotation: 0,
    rotationSpeed: 0,
    tumblePhase: 0,
    tumbleSpeed: 0,
    wobblePhase: 0,
    wobbleSpeed: 0,
    wobbleAmp: 0,
    lifetime: 0,
    life: 0,
    opacity: 0,
    color: "#000000",
    shape: "square",
    scalar: 1,
    cohort: -1,
  };
}

/**
 * Create a {@link ParticlePool} pre-filled with `initialSize` particles.
 * Internal — each engine owns exactly one (sized by its `poolSize` option).
 *
 * @example
 * ```ts
 * // Inside createConfettiEngine:
 * const pool = createParticlePool(500);
 * const p = pool.take();
 * pool.release(p);
 * pool.take() === p; // true — object identity is reused
 * ```
 */
export function createParticlePool(
  initialSize: number = DEFAULT_POOL_SIZE,
): ParticlePool {
  // Defense in depth: a NaN/Infinity size must never hang preallocation.
  const size = Number.isFinite(initialSize)
    ? Math.max(0, Math.floor(initialSize))
    : DEFAULT_POOL_SIZE;
  const free: Particle[] = [];
  let allocated = 0;

  for (let i = 0; i < size; i++) {
    free.push(createParticle());
    allocated++;
  }

  return {
    take(): Particle {
      const recycled = free.pop();
      if (recycled) return recycled;
      allocated++;
      return createParticle();
    },
    release(p: Particle): void {
      p.life = 0;
      p.cohort = -1;
      free.push(p);
    },
    get allocated(): number {
      return allocated;
    },
    get available(): number {
      return free.length;
    },
  };
}
