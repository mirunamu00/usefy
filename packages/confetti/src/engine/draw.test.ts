import { describe, it, expect, vi } from "vitest";
import {
  createSpriteCache,
  drawFrame,
  renderParticle,
  DEFAULT_PATH_SHAPE_SIZE,
} from "./draw";
import {
  CIRCLE_RADIUS,
  SQUARE_HALF,
  STAR_POINTS,
  STRIP_HALF_LENGTH,
  STRIP_HALF_WIDTH,
} from "../shapes/builtin";
import { createParticle } from "./pool";
import type { Particle, PathShape, SpriteEntry, SpriteShape } from "../types";

function mockCtx() {
  return {
    globalAlpha: 1,
    fillStyle: "",
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    ellipse: vi.fn(),
    drawImage: vi.fn(),
    setTransform: vi.fn(),
  } as unknown as CanvasRenderingContext2D & {
    clearRect: ReturnType<typeof vi.fn>;
    beginPath: ReturnType<typeof vi.fn>;
    moveTo: ReturnType<typeof vi.fn>;
    lineTo: ReturnType<typeof vi.fn>;
    closePath: ReturnType<typeof vi.fn>;
    fill: ReturnType<typeof vi.fn>;
    ellipse: ReturnType<typeof vi.fn>;
    drawImage: ReturnType<typeof vi.fn>;
    setTransform: ReturnType<typeof vi.fn>;
  };
}

function particle(overrides: Partial<Particle> = {}): Particle {
  const p = createParticle();
  p.opacity = 1;
  p.color = "#123456";
  p.scalar = 1;
  Object.assign(p, overrides);
  return p;
}

describe("renderParticle — built-in shapes", () => {
  it("square: 4 rotated corners, one fill, color and opacity applied", () => {
    const ctx = mockCtx();
    const p = particle({ shape: "square", x: 100, y: 50, opacity: 0.5 });
    renderParticle(ctx, p, createSpriteCache());

    expect(ctx.fillStyle).toBe("#123456");
    expect(ctx.globalAlpha).toBe(0.5);
    expect(ctx.beginPath).toHaveBeenCalledTimes(1);
    expect(ctx.moveTo).toHaveBeenCalledTimes(1);
    expect(ctx.lineTo).toHaveBeenCalledTimes(3);
    expect(ctx.closePath).toHaveBeenCalledTimes(1);
    expect(ctx.fill).toHaveBeenCalledTimes(1);
    // rotation 0, tumblePhase 0 (scaleY 1), wobbleAmp 0 → axis-aligned corners.
    expect(ctx.moveTo).toHaveBeenCalledWith(100 - SQUARE_HALF, 50 - SQUARE_HALF);
    expect(ctx.lineTo.mock.calls[0][0]).toBeCloseTo(100 + SQUARE_HALF, 10);
    expect(ctx.lineTo.mock.calls[0][1]).toBeCloseTo(50 - SQUARE_HALF, 10);
    expect(ctx.lineTo.mock.calls[1][0]).toBeCloseTo(100 + SQUARE_HALF, 10);
    expect(ctx.lineTo.mock.calls[1][1]).toBeCloseTo(50 + SQUARE_HALF, 10);
    expect(ctx.lineTo.mock.calls[2][0]).toBeCloseTo(100 - SQUARE_HALF, 10);
    expect(ctx.lineTo.mock.calls[2][1]).toBeCloseTo(50 + SQUARE_HALF, 10);
  });

  it("square: rotation by 90° swaps the corner axes (manual transform math)", () => {
    const ctx = mockCtx();
    const p = particle({ shape: "square", x: 0, y: 0, rotation: Math.PI / 2 });
    renderParticle(ctx, p, createSpriteCache());
    // Local (-h, -h) rotated 90° → (h, -h).
    const [mx, my] = ctx.moveTo.mock.calls[0];
    expect(mx).toBeCloseTo(SQUARE_HALF, 10);
    expect(my).toBeCloseTo(-SQUARE_HALF, 10);
  });

  it("square: tumble scaleY compresses the local y extent", () => {
    const ctx = mockCtx();
    // tumblePhase π/3 → scaleY = cos(π/3) = 0.5.
    const p = particle({ shape: "square", x: 0, y: 0, tumblePhase: Math.PI / 3 });
    renderParticle(ctx, p, createSpriteCache());
    const [, my] = ctx.moveTo.mock.calls[0];
    expect(my).toBeCloseTo(-SQUARE_HALF * 0.5, 10);
  });

  it("strip: elongated quad using the strip extents", () => {
    const ctx = mockCtx();
    const p = particle({ shape: "strip", x: 10, y: 20, scalar: 2 });
    renderParticle(ctx, p, createSpriteCache());
    expect(ctx.moveTo).toHaveBeenCalledWith(
      10 - STRIP_HALF_WIDTH * 2,
      20 - STRIP_HALF_LENGTH * 2,
    );
    expect(ctx.fill).toHaveBeenCalledTimes(1);
  });

  it("circle: one ellipse — tumble squashes radiusY via |scaleY|", () => {
    const ctx = mockCtx();
    // tumblePhase π → scaleY = -1 → |scaleY| = 1; use 2π/3 → -0.5.
    const p = particle({
      shape: "circle",
      x: 30,
      y: 40,
      rotation: 0.7,
      scalar: 2,
      tumblePhase: (2 * Math.PI) / 3,
    });
    renderParticle(ctx, p, createSpriteCache());
    expect(ctx.ellipse).toHaveBeenCalledTimes(1);
    const [x, y, rx, ry, rot, a0, a1] = ctx.ellipse.mock.calls[0];
    expect(x).toBe(30);
    expect(y).toBe(40);
    expect(rx).toBeCloseTo(CIRCLE_RADIUS * 2, 10);
    expect(ry).toBeCloseTo(CIRCLE_RADIUS * 2 * 0.5, 10); // |cos(2π/3)| = 0.5
    expect(rot).toBe(0.7);
    expect(a0).toBe(0);
    expect(a1).toBeCloseTo(Math.PI * 2, 12);
    expect(ctx.fill).toHaveBeenCalledTimes(1);
  });

  it("star: 10 vertices (5 points alternating outer/inner), closed and filled", () => {
    const ctx = mockCtx();
    const p = particle({ shape: "star", x: 0, y: 0 });
    renderParticle(ctx, p, createSpriteCache());
    expect(ctx.moveTo).toHaveBeenCalledTimes(1);
    expect(ctx.lineTo).toHaveBeenCalledTimes(STAR_POINTS * 2 - 1);
    expect(ctx.closePath).toHaveBeenCalledTimes(1);
    expect(ctx.fill).toHaveBeenCalledTimes(1);
    // First vertex points straight up (outer radius 5.5 at scalar 1).
    const [mx, my] = ctx.moveTo.mock.calls[0];
    expect(mx).toBeCloseTo(0, 10);
    expect(my).toBeCloseTo(-5.5, 10);
  });

  it("applies the horizontal wobble offset at draw time (x only)", () => {
    const ctx = mockCtx();
    const p = particle({ shape: "circle", x: 100, y: 100, wobbleAmp: 10, wobblePhase: 0 });
    renderParticle(ctx, p, createSpriteCache());
    // cos(0) * 10 = +10 on x; y untouched.
    expect(ctx.ellipse.mock.calls[0][0]).toBeCloseTo(110, 10);
    expect(ctx.ellipse.mock.calls[0][1]).toBe(100);
  });
});

describe("renderParticle — sprite shapes & sprite cache", () => {
  function makeCustomShape(entry: SpriteEntry | null): SpriteShape & {
    rasterize: ReturnType<typeof vi.fn>;
  } {
    return { key: "test-shape", rasterize: vi.fn(() => entry) };
  }

  const fakeBitmap = {} as CanvasImageSource;

  it("rasterizes once, caches by key, and draws centered scaled by the particle scalar", () => {
    const ctx = mockCtx();
    const cache = createSpriteCache();
    const shape = makeCustomShape({ source: fakeBitmap, width: 20, height: 10 });
    const p = particle({ shape, x: 100, y: 50, scalar: 1.5 });

    renderParticle(ctx, p, cache);
    renderParticle(ctx, p, cache);
    renderParticle(ctx, p, cache);

    expect(shape.rasterize).toHaveBeenCalledTimes(1); // cached after first draw
    expect(shape.rasterize).toHaveBeenCalledWith(1.5);
    expect(cache.get("test-shape")).toEqual({ source: fakeBitmap, width: 20, height: 10 });
    expect(ctx.drawImage).toHaveBeenCalledTimes(3);
    // 20×10 sprite × scalar 1.5 → 30×15, centered on the origin of the
    // particle transform.
    expect(ctx.drawImage).toHaveBeenCalledWith(fakeBitmap, -15, -7.5, 30, 15);
    // rotation 0, tumble 1, dpr 1: place at (100, 50), then restore base.
    const [a, b, c, d, e, f] = ctx.setTransform.mock.calls[0];
    expect(a).toBeCloseTo(1, 10);
    expect(b).toBeCloseTo(0, 10);
    expect(c).toBeCloseTo(0, 10); // -0 from -sin(0)·scaleY is fine
    expect(d).toBeCloseTo(1, 10);
    expect(e).toBe(100);
    expect(f).toBe(50);
    expect(ctx.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, 0, 0);
  });

  it("applies rotation, tumble, and dpr through a composed setTransform", () => {
    const ctx = mockCtx();
    const cache = createSpriteCache();
    const shape = makeCustomShape({ source: fakeBitmap, width: 10, height: 10 });
    // rotation 90°, tumblePhase π/3 → scaleY 0.5, dpr 2.
    const p = particle({
      shape,
      x: 40,
      y: 30,
      rotation: Math.PI / 2,
      tumblePhase: Math.PI / 3,
    });
    renderParticle(ctx, p, cache, 2);

    const [a, b, c, d, e, f] = ctx.setTransform.mock.calls[0];
    expect(a).toBeCloseTo(2 * Math.cos(Math.PI / 2), 10); // ~0
    expect(b).toBeCloseTo(2 * Math.sin(Math.PI / 2), 10); // 2
    expect(c).toBeCloseTo(-2 * Math.sin(Math.PI / 2) * 0.5, 10); // -1
    expect(d).toBeCloseTo(2 * Math.cos(Math.PI / 2) * 0.5, 10); // ~0
    expect(e).toBe(80); // dpr·x
    expect(f).toBe(60); // dpr·y
    // Base DPR transform restored afterwards (exactly two calls, no stack).
    expect(ctx.setTransform).toHaveBeenCalledTimes(2);
    expect(ctx.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
  });

  it("a null raster (not ready) skips drawing and is NOT cached — retried next frame", () => {
    const ctx = mockCtx();
    const cache = createSpriteCache();
    const shape = makeCustomShape(null);
    const p = particle({ shape });

    renderParticle(ctx, p, cache);
    expect(ctx.drawImage).not.toHaveBeenCalled();
    expect(cache.size).toBe(0);

    renderParticle(ctx, p, cache);
    expect(shape.rasterize).toHaveBeenCalledTimes(2); // retried

    // Becomes ready → cached and drawn from then on.
    shape.rasterize.mockReturnValue({ source: fakeBitmap, width: 8, height: 8 });
    renderParticle(ctx, p, cache);
    renderParticle(ctx, p, cache);
    expect(shape.rasterize).toHaveBeenCalledTimes(3);
    expect(ctx.drawImage).toHaveBeenCalledTimes(2);
  });

  it("two particles sharing a key share one raster", () => {
    const ctx = mockCtx();
    const cache = createSpriteCache();
    const entry = { source: fakeBitmap, width: 6, height: 6 };
    const a = makeCustomShape(entry);
    const b: SpriteShape & { rasterize: ReturnType<typeof vi.fn> } = {
      key: "test-shape",
      rasterize: vi.fn(() => entry),
    };
    renderParticle(ctx, particle({ shape: a }), cache);
    renderParticle(ctx, particle({ shape: b }), cache);
    expect(a.rasterize).toHaveBeenCalledTimes(1);
    expect(b.rasterize).not.toHaveBeenCalled(); // hit a's cache entry
  });
});

describe("renderParticle — path shapes", () => {
  const fakePath = { __path: true } as unknown as Path2D;

  function makePathShape(size?: number): PathShape & { path: ReturnType<typeof vi.fn> } {
    return { key: "path-shape", size, path: vi.fn(() => fakePath) };
  }

  it("fills the unit-box path with the particle color, centered and scaled", () => {
    const ctx = mockCtx();
    const shape = makePathShape(10);
    const p = particle({ shape, x: 100, y: 50, scalar: 2, color: "#ff0000" });
    renderParticle(ctx, p, createSpriteCache());

    expect(ctx.fillStyle).toBe("#ff0000"); // per-particle color, unlike sprites
    expect(ctx.fill).toHaveBeenCalledWith(fakePath);
    // rotation 0, scaleY 1, dpr 1, size 10×scalar 2 = 20:
    // M = T(x,y)·S(20,20)·T(-0.5,-0.5) → a=20, d=20, e=x-10, f=y-10.
    const [a, b, c, d, e, f] = ctx.setTransform.mock.calls[0];
    expect(a).toBeCloseTo(20, 10);
    expect(b).toBeCloseTo(0, 10);
    expect(c).toBeCloseTo(0, 10);
    expect(d).toBeCloseTo(20, 10);
    expect(e).toBeCloseTo(90, 10);
    expect(f).toBeCloseTo(40, 10);
    expect(ctx.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, 0, 0);
  });

  it("defaults the unit-box size to DEFAULT_PATH_SHAPE_SIZE", () => {
    const ctx = mockCtx();
    const shape = makePathShape(undefined);
    renderParticle(ctx, particle({ shape, x: 0, y: 0 }), createSpriteCache());
    const [a] = ctx.setTransform.mock.calls[0];
    expect(a).toBeCloseTo(DEFAULT_PATH_SHAPE_SIZE, 10);
  });

  it("skips silently when path() returns null (no Path2D in env)", () => {
    const ctx = mockCtx();
    const shape: PathShape = { key: "no-path", path: () => null };
    renderParticle(ctx, particle({ shape }), createSpriteCache());
    expect(ctx.fill).not.toHaveBeenCalled();
    expect(ctx.setTransform).not.toHaveBeenCalled();
  });

  it("applies rotation and tumble to the path transform", () => {
    const ctx = mockCtx();
    const shape = makePathShape(10);
    // rotation π/2, tumble scaleY 0.5, dpr 2.
    const p = particle({ shape, x: 0, y: 0, rotation: Math.PI / 2, tumblePhase: Math.PI / 3 });
    renderParticle(ctx, p, createSpriteCache(), 2);
    const [a, b, c, d] = ctx.setTransform.mock.calls[0];
    const sy = 10 * 0.5; // size × scaleY
    expect(a).toBeCloseTo(2 * Math.cos(Math.PI / 2) * 10, 10); // ~0
    expect(b).toBeCloseTo(2 * Math.sin(Math.PI / 2) * 10, 10); // 20
    expect(c).toBeCloseTo(-2 * Math.sin(Math.PI / 2) * sy, 10); // -10
    expect(d).toBeCloseTo(2 * Math.cos(Math.PI / 2) * sy, 10); // ~0
    expect(ctx.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
  });
});

describe("drawFrame", () => {
  it("clears once over the CSS viewport, draws every particle, resets alpha", () => {
    const ctx = mockCtx();
    const particles = [
      particle({ shape: "circle", opacity: 0.3 }),
      particle({ shape: "circle", opacity: 0.6 }),
    ];
    drawFrame(ctx, particles, 800, 600, createSpriteCache());
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    expect(ctx.ellipse).toHaveBeenCalledTimes(2);
    expect(ctx.globalAlpha).toBe(1); // reset after the pass
  });

  it("an empty frame still clears (final wipe when the last particle dies)", () => {
    const ctx = mockCtx();
    drawFrame(ctx, [], 100, 100, createSpriteCache());
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);
    expect(ctx.fill).not.toHaveBeenCalled();
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it("passes dpr through to every particle draw", () => {
    const ctx = mockCtx();
    const shape: SpriteShape = {
      key: "dpr-check",
      rasterize: () => ({ source: {} as CanvasImageSource, width: 4, height: 4 }),
    };
    drawFrame(ctx, [particle({ shape })], 100, 100, createSpriteCache(), 2);
    expect(ctx.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
  });

  it("500 particles: still exactly one clearRect and one draw call each (SPEC §4.3)", () => {
    const ctx = mockCtx();
    const particles = Array.from({ length: 500 }, (_, i) =>
      particle({ shape: "circle", x: i, y: i }),
    );
    drawFrame(ctx, particles, 1920, 1080, createSpriteCache());
    expect(ctx.clearRect).toHaveBeenCalledTimes(1); // single wipe per frame
    expect(ctx.ellipse).toHaveBeenCalledTimes(500); // one pass, one call each
  });
});
