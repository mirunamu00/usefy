import { describe, it, expect } from "vitest";
import {
  spawnParticle,
  stepParticle,
  VELOCITY_SCALE,
  GRAVITY_ACCEL,
  DRIFT_SPEED,
  MAX_ROTATION_SPEED,
  TUMBLE_SPEED_MIN,
  TUMBLE_SPEED_MAX,
  WOBBLE_SPEED_MIN,
  WOBBLE_SPEED_MAX,
  WOBBLE_AMP_MIN,
  WOBBLE_AMP_MAX,
  FADE_PORTION,
  LIFETIME_JITTER_MIN,
  LIFETIME_JITTER_SPAN,
  SPEED_JITTER_MIN,
  SPEED_JITTER_SPAN,
} from "./physics";
import { createParticle } from "./pool";
import { resolveFireOptions } from "../types";
import type { Particle } from "../types";

/** Deterministic LCG for injected-random tests (mulberry32). */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** random() double that returns queued values, then 0.5 forever. */
function queuedRandom(...values: number[]): () => number {
  return () => (values.length > 0 ? values.shift()! : 0.5);
}

function freshParticle(overrides: Partial<Particle> = {}): Particle {
  const p = createParticle();
  p.life = 1_000_000;
  p.lifetime = 1_000_000;
  p.opacity = 1;
  Object.assign(p, overrides);
  return p;
}

describe("spawnParticle", () => {
  it("writes the normalized origin into x/y", () => {
    const p = createParticle();
    spawnParticle(p, resolveFireOptions({ origin: { x: 0.25, y: 0.75 } }), () => 0.5);
    expect(p.x).toBe(0.25);
    expect(p.y).toBe(0.75);
  });

  it("originJitter spreads spawns uniformly within origin ± jitter/2", () => {
    const opts = resolveFireOptions({
      origin: { x: 0.5, y: 0.2 },
      originJitter: { x: 0.4, y: 0.1 },
    });
    const random = seededRandom(77);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < 300; i++) {
      const p = createParticle();
      spawnParticle(p, opts, random);
      expect(p.x).toBeGreaterThanOrEqual(0.3); // 0.5 - 0.4/2
      expect(p.x).toBeLessThanOrEqual(0.7);
      expect(p.y).toBeGreaterThanOrEqual(0.15);
      expect(p.y).toBeLessThanOrEqual(0.25);
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
    }
    // Actually spreads (not stuck at the origin).
    expect(maxX - minX).toBeGreaterThan(0.2);
  });

  it("zero originJitter (default) leaves the origin exact for any RNG", () => {
    const p = createParticle();
    spawnParticle(p, resolveFireOptions({ origin: { x: 0.3, y: 0.6 } }), seededRandom(5));
    expect(p.x).toBe(0.3);
    expect(p.y).toBe(0.6);
  });

  it("launches straight along `angle` when spread is 0 (canvas y is down)", () => {
    const p = createParticle();
    // angle 90 = straight up, startVelocity 1 → 60 px/s upward.
    spawnParticle(
      p,
      resolveFireOptions({ angle: 90, spread: 0, startVelocity: 1 }),
      () => 0.5, // speed jitter: 0.75 + 0.5*0.5 = 1.0 exactly
    );
    expect(p.vx).toBeCloseTo(0, 10);
    expect(p.vy).toBeCloseTo(-1 * VELOCITY_SCALE, 10);

    const right = createParticle();
    spawnParticle(
      right,
      resolveFireOptions({ angle: 0, spread: 0, startVelocity: 2 }),
      () => 0.5,
    );
    expect(right.vx).toBeCloseTo(2 * VELOCITY_SCALE, 10);
    expect(right.vy).toBeCloseTo(0, 10);
  });

  it("randomizes the launch angle within angle ± spread/2", () => {
    const opts = resolveFireOptions({ angle: 90, spread: 60, startVelocity: 10 });
    // random() = 0 → angle + (0 - 0.5)*60 = 60°; random() = ~1 → ~120°.
    const low = createParticle();
    spawnParticle(low, opts, queuedRandom(0));
    const lowAngle = (Math.atan2(-low.vy, low.vx) * 180) / Math.PI;
    expect(lowAngle).toBeCloseTo(60, 6);

    const high = createParticle();
    spawnParticle(high, opts, queuedRandom(0.9999999));
    const highAngle = (Math.atan2(-high.vy, high.vx) * 180) / Math.PI;
    expect(highAngle).toBeGreaterThan(119.9);
    expect(highAngle).toBeLessThanOrEqual(120);

    // Fuzz: every sample stays inside the cone.
    const random = seededRandom(42);
    for (let i = 0; i < 200; i++) {
      const p = createParticle();
      spawnParticle(p, opts, random);
      const a = (Math.atan2(-p.vy, p.vx) * 180) / Math.PI;
      expect(a).toBeGreaterThanOrEqual(60);
      expect(a).toBeLessThanOrEqual(120);
    }
  });

  it("jitters speed within ×[0.75, 1.25) of startVelocity", () => {
    const opts = resolveFireOptions({ angle: 0, spread: 0, startVelocity: 10 });
    const random = seededRandom(7);
    for (let i = 0; i < 200; i++) {
      const p = createParticle();
      spawnParticle(p, opts, random);
      const speed = Math.hypot(p.vx, p.vy) / VELOCITY_SCALE;
      expect(speed).toBeGreaterThanOrEqual(10 * SPEED_JITTER_MIN);
      expect(speed).toBeLessThan(10 * (SPEED_JITTER_MIN + SPEED_JITTER_SPAN));
    }
  });

  it("jitters lifetime within ×[0.8, 1.2) and starts life full", () => {
    const opts = resolveFireOptions({ lifetime: 3000 });
    const random = seededRandom(99);
    for (let i = 0; i < 200; i++) {
      const p = createParticle();
      spawnParticle(p, opts, random);
      expect(p.lifetime).toBeGreaterThanOrEqual(3000 * LIFETIME_JITTER_MIN);
      expect(p.lifetime).toBeLessThan(
        3000 * (LIFETIME_JITTER_MIN + LIFETIME_JITTER_SPAN),
      );
      expect(p.life).toBe(p.lifetime);
      expect(p.opacity).toBe(1);
    }
  });

  it("scales gravity/drift/decay into physical units", () => {
    const p = createParticle();
    spawnParticle(
      p,
      resolveFireOptions({ gravity: 2, drift: -1.5, decay: 0.7 }),
      () => 0.5,
    );
    expect(p.gravity).toBe(2 * GRAVITY_ACCEL);
    expect(p.drift).toBe(-1.5 * DRIFT_SPEED);
    // decay is per-frame@60fps in the options, per-second on the particle.
    expect(p.decay).toBeCloseTo(Math.pow(0.7, 60), 15);
    expect(p.fallVelocity).toBe(0);
  });

  it("decay conversion: 0.9/frame keeps exactly 0.9 of velocity per 60fps frame", () => {
    const p = createParticle();
    spawnParticle(
      p,
      resolveFireOptions({ angle: 0, spread: 0, startVelocity: 10, decay: 0.9, gravity: 0 }),
      () => 0.5,
    );
    const vx0 = p.vx;
    stepParticle(p, 1000 / 60); // one 60fps frame
    expect(p.vx / vx0).toBeCloseTo(0.9, 6); // canvas-confetti-compatible feel
    // decay: 1 still means no decay at all.
    const glide = createParticle();
    spawnParticle(
      glide,
      resolveFireOptions({ angle: 0, spread: 0, startVelocity: 10, decay: 1, gravity: 0 }),
      () => 0.5,
    );
    const gx0 = glide.vx;
    stepParticle(glide, 1000);
    expect(glide.vx).toBeCloseTo(gx0, 8);
  });

  it("picks color and shape from the option lists via the injected random", () => {
    const opts = resolveFireOptions({
      colors: ["#a", "#b", "#c"],
      shapes: ["square", "star"],
    });
    const random = seededRandom(1234);
    const colors = new Set<string>();
    const shapes = new Set<unknown>();
    for (let i = 0; i < 300; i++) {
      const p = createParticle();
      spawnParticle(p, opts, random);
      colors.add(p.color);
      shapes.add(p.shape);
      expect(["#a", "#b", "#c"]).toContain(p.color);
      expect(["square", "star"]).toContain(p.shape);
    }
    expect(colors.size).toBe(3); // all options reachable
    expect(shapes.size).toBe(2);
  });

  it("clamps the pick index so random() ≈ 1 selects the last entry", () => {
    const p = createParticle();
    const opts = resolveFireOptions({ colors: ["#a", "#b"], shapes: ["star"] });
    spawnParticle(p, opts, () => 0.9999999999999999);
    expect(p.color).toBe("#b");
    expect(p.shape).toBe("star");
  });

  it("spawns rotation/tumble/wobble within their documented ranges", () => {
    const opts = resolveFireOptions({ scalar: 2 });
    const random = seededRandom(5);
    for (let i = 0; i < 200; i++) {
      const p = createParticle();
      spawnParticle(p, opts, random);
      expect(Math.abs(p.rotationSpeed)).toBeLessThanOrEqual(MAX_ROTATION_SPEED);
      expect(p.tumbleSpeed).toBeGreaterThanOrEqual(TUMBLE_SPEED_MIN);
      expect(p.tumbleSpeed).toBeLessThanOrEqual(TUMBLE_SPEED_MAX);
      expect(p.wobbleSpeed).toBeGreaterThanOrEqual(WOBBLE_SPEED_MIN);
      expect(p.wobbleSpeed).toBeLessThanOrEqual(WOBBLE_SPEED_MAX);
      // wobbleAmp scales with scalar (2×).
      expect(p.wobbleAmp).toBeGreaterThanOrEqual(WOBBLE_AMP_MIN * 2);
      expect(p.wobbleAmp).toBeLessThanOrEqual(WOBBLE_AMP_MAX * 2);
    }
  });

  it("flat disables the tumble (speed 0, phase 0 → scaleY stays 1)", () => {
    const p = createParticle();
    spawnParticle(p, resolveFireOptions({ flat: true }), seededRandom(3));
    expect(p.tumbleSpeed).toBe(0);
    expect(p.tumblePhase).toBe(0);
    expect(Math.cos(p.tumblePhase)).toBe(1);
  });

  it("is fully deterministic for the same random sequence (injected-random determinism)", () => {
    const opts = resolveFireOptions({ colors: ["#a", "#b"], lifetime: 2500 });
    const a = createParticle();
    const b = createParticle();
    spawnParticle(a, opts, seededRandom(2026));
    spawnParticle(b, opts, seededRandom(2026));
    expect({ ...a }).toEqual({ ...b });

    // And stays identical after identical stepping.
    stepParticle(a, 500);
    stepParticle(b, 500);
    expect({ ...a }).toEqual({ ...b });

    // A different seed produces a different particle.
    const c = createParticle();
    spawnParticle(c, opts, seededRandom(2027));
    expect({ ...c }).not.toEqual({ ...a });
  });

  it("resets recycled-particle state (cohort back to -1, fallVelocity 0)", () => {
    const p = createParticle();
    p.cohort = 42;
    p.fallVelocity = 999;
    p.opacity = 0.1;
    spawnParticle(p, resolveFireOptions(), seededRandom(1));
    expect(p.cohort).toBe(-1);
    expect(p.fallVelocity).toBe(0);
    expect(p.opacity).toBe(1);
  });
});

describe("stepParticle — hand-computed math", () => {
  it("decay: exact exponential integral (vx=100, decay=0.5, 1000ms)", () => {
    const p = freshParticle({ vx: 100, decay: 0.5 });
    expect(stepParticle(p, 1000)).toBe(true);
    // Δx = 100 · (0.5 − 1)/ln(0.5) = 100 · 0.72134752…
    expect(p.x).toBeCloseTo(72.13475204444817, 10);
    expect(p.vx).toBeCloseTo(50, 10);
    expect(p.y).toBe(0);
  });

  it("decay = 1: no decay, Δx = v·t exactly", () => {
    const p = freshParticle({ vx: 100, decay: 1 });
    stepParticle(p, 1000);
    expect(p.x).toBeCloseTo(100, 12);
    expect(p.vx).toBe(100);
  });

  it("gravity: Δy = ½·g·t², fallVelocity = g·t (g = 800 px/s²)", () => {
    const p = freshParticle({ gravity: 800, decay: 1 });
    stepParticle(p, 1000);
    expect(p.y).toBeCloseTo(400, 10); // ½·800·1²
    expect(p.fallVelocity).toBeCloseTo(800, 10);
    stepParticle(p, 1000);
    // total after 2s: ½·800·4 = 1600
    expect(p.y).toBeCloseTo(1600, 9);
    expect(p.fallVelocity).toBeCloseTo(1600, 10);
  });

  it("drift: constant horizontal velocity (Δx = drift·t)", () => {
    const p = freshParticle({ drift: 120, decay: 1 });
    stepParticle(p, 500);
    expect(p.x).toBeCloseTo(60, 10);
    stepParticle(p, 500);
    expect(p.x).toBeCloseTo(120, 10);
  });

  it("combined decay + gravity + drift matches the closed-form sum", () => {
    const p = freshParticle({ vx: 100, vy: -200, decay: 0.25, gravity: 800, drift: 60 });
    stepParticle(p, 2000);
    const k = Math.pow(0.25, 2); // retention over 2s
    const integral = (k - 1) / Math.log(0.25);
    expect(p.x).toBeCloseTo(100 * integral + 60 * 2, 9);
    expect(p.y).toBeCloseTo(-200 * integral + 0.5 * 800 * 4, 9);
    expect(p.vx).toBeCloseTo(100 * k, 10);
    expect(p.vy).toBeCloseTo(-200 * k, 10);
  });

  it("advances rotation, tumble and wobble phases linearly", () => {
    const p = freshParticle({
      rotationSpeed: Math.PI, // rad/s
      tumbleSpeed: 2,
      wobbleSpeed: 3,
      rotation: 1,
      tumblePhase: 0.5,
      wobblePhase: 0.25,
    });
    stepParticle(p, 500);
    expect(p.rotation).toBeCloseTo(1 + Math.PI * 0.5, 10);
    expect(p.tumblePhase).toBeCloseTo(0.5 + 2 * 0.5, 10);
    expect(p.wobblePhase).toBeCloseTo(0.25 + 3 * 0.5, 10);
  });

  it("dtMs = 0 is a no-op that keeps the particle alive", () => {
    const p = freshParticle({ vx: 100, life: 500, lifetime: 500 });
    expect(stepParticle(p, 0)).toBe(true);
    expect(p.x).toBe(0);
    expect(p.life).toBe(500);
  });
});

describe("stepParticle — lifetime & fade", () => {
  it("counts life down and dies exactly when the lifetime is spent", () => {
    const p = freshParticle({ life: 100, lifetime: 100 });
    expect(stepParticle(p, 60)).toBe(true);
    expect(p.life).toBeCloseTo(40, 10);
    expect(stepParticle(p, 60)).toBe(false); // 120ms total > 100ms
    expect(p.life).toBe(0);
    expect(p.opacity).toBe(0);
  });

  it("reports dead (and stays dead) for an already-expired particle", () => {
    const p = freshParticle({ life: 0 });
    expect(stepParticle(p, 16)).toBe(false);
    expect(stepParticle(p, 16)).toBe(false);
  });

  it("fades opacity linearly over the final FADE_PORTION of the lifetime", () => {
    expect(FADE_PORTION).toBe(0.2);
    const p = freshParticle({ life: 1000, lifetime: 1000 });
    stepParticle(p, 500);
    expect(p.opacity).toBe(1); // life 500 > fade window 200
    stepParticle(p, 350);
    expect(p.opacity).toBeCloseTo(150 / 200, 10); // life 150 → 0.75
    stepParticle(p, 100);
    expect(p.opacity).toBeCloseTo(50 / 200, 10); // life 50 → 0.25
    expect(stepParticle(p, 100)).toBe(false); // expired
    expect(p.opacity).toBe(0);
  });
});

describe("stepParticle — time-based, not frame-based", () => {
  it("stepping 1000ms in one call ≡ 60 calls of ~16.67ms (within tolerance)", () => {
    const opts = resolveFireOptions({
      angle: 70,
      spread: 50,
      startVelocity: 20,
      gravity: 1.2,
      drift: 0.8,
      decay: 0.6,
      lifetime: 5000,
    });
    const one = createParticle();
    const many = createParticle();
    spawnParticle(one, opts, seededRandom(11));
    spawnParticle(many, opts, seededRandom(11)); // identical spawn state

    expect(stepParticle(one, 1000)).toBe(true);
    const step = 1000 / 60;
    for (let i = 0; i < 60; i++) {
      expect(stepParticle(many, step)).toBe(true);
    }

    expect(many.x).toBeCloseTo(one.x, 6);
    expect(many.y).toBeCloseTo(one.y, 6);
    expect(many.vx).toBeCloseTo(one.vx, 6);
    expect(many.vy).toBeCloseTo(one.vy, 6);
    expect(many.fallVelocity).toBeCloseTo(one.fallVelocity, 6);
    expect(many.rotation).toBeCloseTo(one.rotation, 6);
    expect(many.tumblePhase).toBeCloseTo(one.tumblePhase, 6);
    expect(many.wobblePhase).toBeCloseTo(one.wobblePhase, 6);
    expect(many.life).toBeCloseTo(one.life, 6);
    expect(many.opacity).toBeCloseTo(one.opacity, 6);
  });

  it("arbitrary partitions agree too (7ms/23ms/…) — integration is exact", () => {
    const base = freshParticle({ vx: 300, vy: -150, decay: 0.35, gravity: 500, drift: 40 });
    const parts = freshParticle({ vx: 300, vy: -150, decay: 0.35, gravity: 500, drift: 40 });

    stepParticle(base, 777);
    // 777 = 7 + 23 + 100 + 647
    for (const dt of [7, 23, 100, 647]) stepParticle(parts, dt);

    expect(parts.x).toBeCloseTo(base.x, 8);
    expect(parts.y).toBeCloseTo(base.y, 8);
    expect(parts.vx).toBeCloseTo(base.vx, 8);
    expect(parts.vy).toBeCloseTo(base.vy, 8);
    expect(parts.fallVelocity).toBeCloseTo(base.fallVelocity, 8);
  });
});
