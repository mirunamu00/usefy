/**
 * The headless confetti engine — canvas management, the single rAF loop,
 * burst cohorts, continuous emitters, and lifecycle (pause/resume/clear/
 * destroy). Framework-free and SSR-safe: nothing in this module touches
 * `window`/`document`/canvas at import time; all environment access happens
 * inside {@link createConfettiEngine} or later.
 */
import {
  DEFAULT_PARTICLES_PER_SECOND,
  resolveFireOptions,
  toFinite,
  type ConfettiEngine,
  type ConfettiEngineOptions,
  type EmitHandle,
  type EmitOptions,
  type FireOptions,
  type Particle,
  type ResolvedFireOptions,
} from "../types";
import { spawnParticle, stepParticle } from "./physics";
import { createParticlePool, DEFAULT_POOL_SIZE } from "./pool";
import { createSpriteCache, drawFrame } from "./draw";

/**
 * Upper clamp applied to the per-frame delta time, in milliseconds.
 * Long gaps (background-tab rAF throttling, `resume()` after a pause,
 * debugger stops) advance the simulation by at most this much — motion
 * slows down instead of teleporting in a catch-up burst.
 */
export const MAX_FRAME_DT_MS = 64;

/** Maximum device-pixel-ratio used for backing-store sizing (SPEC §4.1). */
export const MAX_DPR = 2;

interface Emitter {
  particlesPerSecond: number;
  /** Fractional-spawn accumulator (spawns happen on whole units). */
  accumulator: number;
  opts: ResolvedFireOptions;
  active: boolean;
}

interface Cohort {
  remaining: number;
  resolve: () => void;
}

/** Does the current environment ask for reduced motion? (Live read.) */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const INERT_EMIT_HANDLE: EmitHandle = {
  stop() {
    /* no-op */
  },
  get active() {
    return false;
  },
};

/**
 * Create a {@link ConfettiEngine} bound to `canvas`.
 *
 * The engine owns everything about its canvas: DPR-aware backing-store
 * sizing (capped at ×2), its own `ResizeObserver` (SPEC resolved decision
 * #5 — the React layer never duplicates resize handling), a single
 * `requestAnimationFrame` loop that runs **only** while particles are
 * alive or emitters are active, and a particle pool so the steady-state
 * hot loop allocates nothing.
 *
 * Must be called in a browser-like environment (needs a canvas with a 2D
 * context); importing the module itself is SSR-safe.
 *
 * @throws If `canvas.getContext("2d")` returns `null`.
 *
 * @example
 * ```ts
 * import { createConfettiEngine } from "@usefy/confetti/headless";
 *
 * const engine = createConfettiEngine(canvas);
 * await engine.fire({ count: 100, origin: { x: 0.5, y: 0.7 } });
 * engine.active; // false — burst finished, rAF loop provably stopped
 * engine.destroy();
 * ```
 */
export function createConfettiEngine(
  canvas: HTMLCanvasElement,
  options: ConfettiEngineOptions = {},
): ConfettiEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(
      "@usefy/confetti: canvas.getContext('2d') returned null — the canvas is unusable (already using another context type?)",
    );
  }

  const reducedMotionMode = options.reducedMotion ?? "respect";
  // toFinite: a NaN/Infinity poolSize or dpr must never freeze construction
  // or produce an unusable backing store.
  const pool = createParticlePool(
    Math.max(0, Math.floor(toFinite(options.poolSize, DEFAULT_POOL_SIZE))),
  );
  const sprites = createSpriteCache();

  const envDpr =
    typeof window !== "undefined" ? toFinite(window.devicePixelRatio, 1) : 1;
  const rawDpr = toFinite(options.dpr, envDpr > 0 ? envDpr : 1);
  const dpr = Math.min(Math.max(rawDpr, 0.1), MAX_DPR);

  /** Canvas CSS-pixel viewport (world units for the simulation). */
  let viewWidth = 0;
  let viewHeight = 0;

  const alive: Particle[] = [];
  const emitters: Emitter[] = [];
  const cohorts = new Map<number, Cohort>();
  let nextCohortId = 0;

  let rafId: number | null = null;
  let lastTime: number | null = null;
  let paused = false;
  let destroyed = false;

  const activeListeners = new Set<(active: boolean) => void>();
  let lastNotifiedActive = false;
  let notifying = false;

  /**
   * Notify subscribers when (and only when) the idle↔active edge flips.
   *
   * Re-entrancy-safe: a listener may call `fire()`/`clear()`/etc., which
   * calls back into here. Nested calls return immediately (`notifying`
   * guard) and the outer loop re-reads the *fresh* state after each full
   * dispatch, so every listener sees strictly alternating values in edge
   * order — never a stale or duplicated value.
   *
   * A throwing listener is isolated (logged, other listeners and the
   * caller unaffected) — a consumer bug must never reject a `fire()`
   * promise or kill the rAF loop.
   */
  function notifyActive(): void {
    if (notifying) return;
    notifying = true;
    try {
      let current = alive.length > 0 || anyEmitterActive();
      while (current !== lastNotifiedActive) {
        lastNotifiedActive = current;
        // Copy — a listener may (un)subscribe re-entrantly.
        for (const listener of [...activeListeners]) {
          try {
            listener(current);
          } catch (error) {
            if (typeof console !== "undefined") {
              console.error("@usefy/confetti: onActiveChange listener threw", error);
            }
          }
        }
        // A listener may have flipped the state again — deliver that edge too.
        current = alive.length > 0 || anyEmitterActive();
      }
    } finally {
      notifying = false;
    }
  }

  function resize(): void {
    viewWidth = canvas.clientWidth;
    viewHeight = canvas.clientHeight;
    canvas.width = Math.max(0, Math.round(viewWidth * dpr));
    canvas.height = Math.max(0, Math.round(viewHeight * dpr));
    // Setting width/height resets the context state — re-apply the DPR
    // transform so all drawing happens in CSS pixels.
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (!destroyed) resize();
    });
    resizeObserver.observe(canvas);
  }

  function shouldNoOp(): boolean {
    return (
      destroyed || (reducedMotionMode === "respect" && prefersReducedMotion())
    );
  }

  function anyEmitterActive(): boolean {
    for (let i = 0; i < emitters.length; i++) {
      if (emitters[i].active) return true;
    }
    return false;
  }

  function scheduleFrame(): void {
    rafId = window.requestAnimationFrame(frame);
  }

  function ensureLoop(): void {
    if (paused || destroyed || rafId !== null) return;
    if (alive.length > 0 || anyEmitterActive()) scheduleFrame();
  }

  function stopLoop(): void {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTime = null;
  }

  function spawnOne(opts: ResolvedFireOptions, cohort: number): void {
    const p = pool.take();
    spawnParticle(p, opts, Math.random);
    // spawnParticle writes the normalized origin; scale to CSS pixels.
    p.x *= viewWidth;
    p.y *= viewHeight;
    p.cohort = cohort;
    alive.push(p);
  }

  /** Cohort bookkeeping for a dying/killed particle. */
  function settleCohort(p: Particle): void {
    if (p.cohort < 0) return;
    const cohort = cohorts.get(p.cohort);
    if (cohort && --cohort.remaining <= 0) {
      cohorts.delete(p.cohort);
      cohort.resolve();
    }
  }

  function frame(now: number): void {
    rafId = null;
    if (destroyed || paused) return;

    const dt =
      lastTime === null
        ? 0
        : Math.max(0, Math.min(now - lastTime, MAX_FRAME_DT_MS));
    lastTime = now;

    // 1. Emitters: fractional spawn accrual honoring dt.
    if (dt > 0) {
      for (let i = 0; i < emitters.length; i++) {
        const em = emitters[i];
        if (!em.active) continue;
        em.accumulator += (em.particlesPerSecond * dt) / 1000;
        let n = Math.floor(em.accumulator);
        em.accumulator -= n;
        while (n-- > 0) spawnOne(em.opts, -1);
      }
    }
    // Prune stopped emitters.
    for (let i = emitters.length - 1; i >= 0; i--) {
      if (!emitters[i].active) emitters.splice(i, 1);
    }

    // 2. Physics step; release the dead (swap-remove keeps this O(n)).
    for (let i = alive.length - 1; i >= 0; i--) {
      const p = alive[i];
      if (!stepParticle(p, dt)) {
        settleCohort(p);
        alive[i] = alive[alive.length - 1];
        alive.pop();
        pool.release(p);
      }
    }

    // 3. Draw (a zero-particle final frame still clears the canvas).
    drawFrame(ctx!, alive, viewWidth, viewHeight, sprites, dpr);

    // 4. Idle shutdown: loop not running ⇔ nothing alive and no emitter.
    // ensureLoop (NOT scheduleFrame): user code can run inside drawFrame
    // (a CustomShape.rasterize may call fire()/emit() re-entrantly, which
    // already re-scheduled) — an unconditional schedule here would orphan
    // that rAF handle and permanently double the loop.
    if (alive.length > 0 || emitters.length > 0) {
      ensureLoop();
    } else {
      lastTime = null;
    }
    notifyActive();
  }

  function clearAll(): void {
    for (let i = 0; i < alive.length; i++) {
      settleCohort(alive[i]);
      pool.release(alive[i]);
    }
    alive.length = 0;
    for (let i = 0; i < emitters.length; i++) emitters[i].active = false;
    emitters.length = 0;
    stopLoop();
    ctx!.clearRect(0, 0, viewWidth, viewHeight);
    notifyActive();
  }

  return {
    fire(opts?: FireOptions): Promise<void> {
      if (shouldNoOp()) return Promise.resolve();
      const resolved = resolveFireOptions(opts);
      if (resolved.count === 0) return Promise.resolve();
      const cohortId = nextCohortId++;
      // Spawn/schedule/notify OUTSIDE the executor: a throwing
      // onActiveChange listener must never convert an animating burst
      // into a rejected promise.
      let resolveCohort!: () => void;
      const promise = new Promise<void>((resolve) => {
        resolveCohort = resolve;
      });
      cohorts.set(cohortId, { remaining: resolved.count, resolve: resolveCohort });
      for (let i = 0; i < resolved.count; i++) spawnOne(resolved, cohortId);
      ensureLoop();
      notifyActive();
      return promise;
    },

    emit(opts?: EmitOptions): EmitHandle {
      if (shouldNoOp()) return INERT_EMIT_HANDLE;
      // toFinite: a NaN rate would accrue NaN forever (loop never idles);
      // Infinity would spawn unboundedly. Both fall back to the default.
      const particlesPerSecond = Math.max(
        0,
        toFinite(opts?.particlesPerSecond, DEFAULT_PARTICLES_PER_SECOND),
      );
      // A zero (or negative → clamped) rate can never spawn anything —
      // return an inert stopped handle instead of spinning the loop forever
      // drawing nothing.
      if (particlesPerSecond === 0) return INERT_EMIT_HANDLE;
      const emitter: Emitter = {
        particlesPerSecond,
        accumulator: 0,
        opts: resolveFireOptions(opts),
        active: true,
      };
      emitters.push(emitter);
      ensureLoop();
      notifyActive();
      return {
        stop() {
          emitter.active = false;
          notifyActive();
        },
        get active() {
          return emitter.active;
        },
      };
    },

    stop(): void {
      // Deactivate AND prune immediately — no need to wait for a future
      // frame (there may never be one if nothing is alive).
      for (let i = 0; i < emitters.length; i++) emitters[i].active = false;
      emitters.length = 0;
      notifyActive();
    },

    clear(): void {
      if (destroyed) return;
      clearAll();
    },

    pause(): void {
      if (paused || destroyed) return;
      paused = true;
      stopLoop();
    },

    resume(): void {
      if (!paused || destroyed) return;
      paused = false;
      // lastTime stays null → the first resumed frame has dt 0, so there
      // is no catch-up teleport no matter how long the pause lasted.
      ensureLoop();
    },

    destroy(): void {
      if (destroyed) return;
      // Flag FIRST: clearAll() delivers a final `false` to listeners, and a
      // listener reacting to it with fire()/emit() must get the inert
      // destroyed-engine behavior (resolved promise / inert handle), not a
      // forever-pending cohort on a dead engine.
      destroyed = true;
      clearAll();
      resizeObserver?.disconnect();
      resizeObserver = null;
      sprites.clear();
      activeListeners.clear();
    },

    resize(): void {
      if (destroyed) return;
      resize();
    },

    onActiveChange(listener: (active: boolean) => void): () => void {
      activeListeners.add(listener);
      return () => {
        activeListeners.delete(listener);
      };
    },

    get active(): boolean {
      return alive.length > 0 || anyEmitterActive();
    },
  };
}
