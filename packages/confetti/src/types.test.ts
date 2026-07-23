import { describe, it, expect } from "vitest";
import {
  DEFAULT_COLORS,
  DEFAULT_SHAPES,
  resolveFireOptions,
} from "./types";

describe("resolveFireOptions", () => {
  it("applies every default from the SPEC §3.2 table", () => {
    const r = resolveFireOptions();
    expect(r.count).toBe(80);
    expect(r.origin).toEqual({ x: 0.5, y: 0.5 });
    expect(r.angle).toBe(90);
    expect(r.spread).toBe(45);
    expect(r.startVelocity).toBe(45);
    expect(r.gravity).toBe(1);
    expect(r.drift).toBe(0);
    expect(r.decay).toBe(0.9);
    expect(r.scalar).toBe(1);
    expect(r.lifetime).toBe(3000);
    expect(r.colors).toEqual(DEFAULT_COLORS);
    expect(r.colors).toHaveLength(7);
    expect(r.shapes).toEqual(["square", "circle", "strip"]);
    expect(r.flat).toBe(false);
  });

  it("resolves an omitted argument and an empty object identically", () => {
    expect(resolveFireOptions()).toEqual(resolveFireOptions({}));
  });

  it("merges partial overrides over the defaults", () => {
    const r = resolveFireOptions({ count: 10, angle: 45, flat: true });
    expect(r.count).toBe(10);
    expect(r.angle).toBe(45);
    expect(r.flat).toBe(true);
    expect(r.spread).toBe(45); // untouched default
    expect(r.decay).toBe(0.9);
  });

  it("resolves originJitter (default 0, per-axis merge, clamped non-negative, NaN-safe)", () => {
    expect(resolveFireOptions().originJitter).toEqual({ x: 0, y: 0 });
    expect(resolveFireOptions({ originJitter: { x: 1 } }).originJitter).toEqual({
      x: 1,
      y: 0,
    });
    expect(
      resolveFireOptions({ originJitter: { x: -0.5, y: NaN } }).originJitter,
    ).toEqual({ x: 0, y: 0 });
    expect(
      resolveFireOptions({ originJitter: { x: Infinity } }).originJitter.x,
    ).toBe(0);
  });

  it("merges a partial origin per-axis", () => {
    expect(resolveFireOptions({ origin: { x: 0.1 } }).origin).toEqual({
      x: 0.1,
      y: 0.5,
    });
    expect(resolveFireOptions({ origin: { y: 0.9 } }).origin).toEqual({
      x: 0.5,
      y: 0.9,
    });
    expect(resolveFireOptions({ origin: {} }).origin).toEqual({ x: 0.5, y: 0.5 });
  });

  it("allows origins outside 0–1 (off-canvas spawns)", () => {
    const r = resolveFireOptions({ origin: { x: -0.1, y: 1.2 } });
    expect(r.origin).toEqual({ x: -0.1, y: 1.2 });
  });

  it("floors and clamps count to a non-negative integer", () => {
    expect(resolveFireOptions({ count: 10.9 }).count).toBe(10);
    expect(resolveFireOptions({ count: -5 }).count).toBe(0);
    expect(resolveFireOptions({ count: 0 }).count).toBe(0);
  });

  it("clamps decay into (0, 1]", () => {
    expect(resolveFireOptions({ decay: 2 }).decay).toBe(1);
    expect(resolveFireOptions({ decay: 1 }).decay).toBe(1);
    expect(resolveFireOptions({ decay: 0 }).decay).toBeGreaterThan(0);
    expect(resolveFireOptions({ decay: -1 }).decay).toBeGreaterThan(0);
    expect(resolveFireOptions({ decay: 0.5 }).decay).toBe(0.5);
  });

  it("clamps spread, startVelocity, scalar, and lifetime", () => {
    expect(resolveFireOptions({ spread: -10 }).spread).toBe(0);
    expect(resolveFireOptions({ startVelocity: -3 }).startVelocity).toBe(0);
    expect(resolveFireOptions({ scalar: 0 }).scalar).toBe(0.05);
    expect(resolveFireOptions({ lifetime: 0 }).lifetime).toBe(1);
    expect(resolveFireOptions({ lifetime: -100 }).lifetime).toBe(1);
  });

  it("allows negative gravity (floaty) and negative drift (leftward)", () => {
    const r = resolveFireOptions({ gravity: -0.5, drift: -2 });
    expect(r.gravity).toBe(-0.5);
    expect(r.drift).toBe(-2);
  });

  it("falls back to defaults for empty colors/shapes arrays", () => {
    const r = resolveFireOptions({ colors: [], shapes: [] });
    expect(r.colors).toEqual(DEFAULT_COLORS);
    expect(r.shapes).toEqual(DEFAULT_SHAPES);
  });

  it("copies colors/shapes/origin — never shares references with the input", () => {
    const colors = ["#111111"];
    const shapes: ("square" | "star")[] = ["star"];
    const origin = { x: 0.2, y: 0.3 };
    const r = resolveFireOptions({ colors, shapes, origin });
    expect(r.colors).not.toBe(colors);
    expect(r.shapes).not.toBe(shapes);
    expect(r.origin).not.toBe(origin);
    expect(r.colors).toEqual(colors);
    expect(r.shapes).toEqual(shapes);
  });

  it("falls back to the default for every NaN numeric field", () => {
    const r = resolveFireOptions({
      count: NaN,
      origin: { x: NaN, y: NaN },
      angle: NaN,
      spread: NaN,
      startVelocity: NaN,
      gravity: NaN,
      drift: NaN,
      decay: NaN,
      scalar: NaN,
      lifetime: NaN,
    });
    expect(r).toEqual(resolveFireOptions()); // fully identical to pure defaults
  });

  it("falls back to the default for every ±Infinity numeric field", () => {
    const r = resolveFireOptions({
      count: Infinity,
      origin: { x: -Infinity, y: Infinity },
      angle: Infinity,
      spread: -Infinity,
      startVelocity: Infinity,
      gravity: -Infinity,
      drift: Infinity,
      decay: Infinity,
      scalar: Infinity,
      lifetime: Infinity,
    });
    expect(r).toEqual(resolveFireOptions());
    // The critical ones for loop safety, spelled out:
    expect(r.count).toBe(80); // never a synchronous spawn freeze
    expect(r.lifetime).toBe(3000); // never an immortal particle
  });

  it("never hands out the shared default arrays (mutation-safe)", () => {
    const a = resolveFireOptions();
    const b = resolveFireOptions();
    expect(a.colors).not.toBe(DEFAULT_COLORS);
    expect(a.shapes).not.toBe(DEFAULT_SHAPES);
    expect(a.colors).not.toBe(b.colors);
    (a.colors as string[]).push("#mutated");
    expect(resolveFireOptions().colors).toEqual(DEFAULT_COLORS);
  });
});
