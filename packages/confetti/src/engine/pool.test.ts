import { describe, it, expect } from "vitest";
import {
  createParticle,
  createParticlePool,
  DEFAULT_POOL_SIZE,
} from "./pool";
import type { Particle } from "../types";

describe("createParticle", () => {
  it("creates a dead, fully-initialized particle (monomorphic shape)", () => {
    const p = createParticle();
    expect(p.life).toBe(0);
    expect(p.cohort).toBe(-1);
    expect(p.shape).toBe("square");
    // Every Particle field is present from birth (hidden-class stability).
    const keys = Object.keys(p).sort();
    expect(keys).toEqual(
      [
        "x", "y", "vx", "vy", "fallVelocity", "gravity", "drift", "decay",
        "rotation", "rotationSpeed", "tumblePhase", "tumbleSpeed",
        "wobblePhase", "wobbleSpeed", "wobbleAmp", "lifetime", "life",
        "opacity", "color", "shape", "scalar", "cohort",
      ].sort(),
    );
  });
});

describe("createParticlePool", () => {
  it("pre-allocates the default size (500)", () => {
    const pool = createParticlePool();
    expect(DEFAULT_POOL_SIZE).toBe(500);
    expect(pool.allocated).toBe(500);
    expect(pool.available).toBe(500);
  });

  it("take() hands out distinct pre-allocated particles", () => {
    const pool = createParticlePool(3);
    const a = pool.take();
    const b = pool.take();
    const c = pool.take();
    expect(a).not.toBe(b);
    expect(b).not.toBe(c);
    expect(pool.allocated).toBe(3);
    expect(pool.available).toBe(0);
  });

  it("grows on demand when the free list is exhausted", () => {
    const pool = createParticlePool(2);
    pool.take();
    pool.take();
    const extra = pool.take();
    expect(extra).toBeDefined();
    expect(pool.allocated).toBe(3);
    expect(pool.available).toBe(0);
  });

  it("release() resets bookkeeping and makes the object reusable", () => {
    const pool = createParticlePool(1);
    const p = pool.take();
    p.life = 1234;
    p.cohort = 7;
    pool.release(p);
    expect(p.life).toBe(0);
    expect(p.cohort).toBe(-1);
    expect(pool.available).toBe(1);
    expect(pool.take()).toBe(p); // same object identity
  });

  it("reuses the exact same objects across repeated fire-sized cohorts (zero-alloc steady state)", () => {
    const pool = createParticlePool(10);
    // Warm-up: one full cohort cycle.
    const warmup: Particle[] = [];
    for (let i = 0; i < 10; i++) warmup.push(pool.take());
    for (const p of warmup) pool.release(p);
    const warmupSet = new Set(warmup);
    expect(pool.allocated).toBe(10);

    // 50 further cohorts: identical identity set, zero new allocations.
    for (let cycle = 0; cycle < 50; cycle++) {
      const taken: Particle[] = [];
      for (let i = 0; i < 10; i++) taken.push(pool.take());
      for (const p of taken) {
        expect(warmupSet.has(p)).toBe(true); // object identity reuse
        pool.release(p);
      }
    }
    expect(pool.allocated).toBe(10); // grew by exactly nothing
    expect(pool.available).toBe(10);
  });

  it("a NaN/Infinity/negative initialSize never hangs preallocation", () => {
    expect(createParticlePool(NaN).allocated).toBe(DEFAULT_POOL_SIZE);
    expect(createParticlePool(Infinity).allocated).toBe(DEFAULT_POOL_SIZE);
    const negative = createParticlePool(-5);
    expect(negative.allocated).toBe(0);
    expect(negative.take()).toBeDefined(); // still grows on demand
  });

  it("SPEC 500-particle bar: steady-state cohorts of 500 allocate nothing", () => {
    const pool = createParticlePool(500);
    // Warm-up cohort.
    const warmup: Particle[] = [];
    for (let i = 0; i < 500; i++) warmup.push(pool.take());
    for (const p of warmup) pool.release(p);
    const identity = new Set(warmup);
    expect(pool.allocated).toBe(500);

    // Ten further full-size cohorts: pure reuse, zero growth.
    for (let cycle = 0; cycle < 10; cycle++) {
      const taken: Particle[] = [];
      for (let i = 0; i < 500; i++) taken.push(pool.take());
      for (const p of taken) {
        expect(identity.has(p)).toBe(true);
        pool.release(p);
      }
    }
    expect(pool.allocated).toBe(500);
    expect(pool.available).toBe(500);
  });

  it("growth is permanent — released overflow particles join the pool", () => {
    const pool = createParticlePool(1);
    const a = pool.take();
    const b = pool.take(); // grown
    expect(pool.allocated).toBe(2);
    pool.release(a);
    pool.release(b);
    expect(pool.available).toBe(2);
    const again = new Set([pool.take(), pool.take()]);
    expect(again.has(a)).toBe(true);
    expect(again.has(b)).toBe(true);
    expect(pool.allocated).toBe(2);
  });
});
