import { describe, it, expect } from "vitest";
import * as headless from "./headless";
import * as root from "./index";

describe("export surface", () => {
  it("./headless exposes the SPEC §4.1 surface", () => {
    expect(headless.createConfettiEngine).toBeTypeOf("function");
    expect(headless.stepParticle).toBeTypeOf("function");
    expect(headless.spawnParticle).toBeTypeOf("function");
    expect(headless.resolveFireOptions).toBeTypeOf("function");
    expect(headless.BUILTIN_SHAPES).toEqual(["square", "circle", "strip", "star"]);
    expect(headless.DEFAULT_COLORS).toHaveLength(7);
    expect(headless.DEFAULT_SHAPES).toEqual(["square", "circle", "strip"]);
    expect(headless.DEFAULT_PARTICLES_PER_SECOND).toBe(30);
    expect(headless.MAX_FRAME_DT_MS).toBe(64);
    expect(headless.MAX_DPR).toBe(2);
  });

  it("./headless exposes the SPEC §3.4 shapes and presets surface", () => {
    expect(headless.textShape).toBeTypeOf("function");
    expect(headless.imageShape).toBeTypeOf("function");
    expect(headless.pathShape).toBeTypeOf("function");
    expect(headless.runPreset).toBeTypeOf("function");
    expect(headless.DEFAULT_IMAGE_HEIGHT).toBe(12);
    expect(headless.DEFAULT_PATH_SHAPE_SIZE).toBe(10);
    for (const preset of [
      headless.celebration,
      headless.fireworks,
      headless.sideCannons,
      headless.pride,
      headless.stars,
      headless.snow,
      headless.rain,
    ]) {
      expect(["burst", "emit"]).toContain(preset.type);
    }
  });

  it("the root entry re-exports the full headless surface (until Phase 2 adds React)", () => {
    for (const key of Object.keys(headless)) {
      expect(root, `root entry is missing "${key}"`).toHaveProperty(key);
    }
  });

  it("importing either entry is side-effect free at module scope (SSR-safe)", () => {
    // If module evaluation had touched window/document/canvas, the imports
    // at the top of this file would already have thrown under a bare
    // environment; here we just assert the modules evaluated to plain
    // namespace objects with no surprises.
    expect(Object.keys(headless).length).toBeGreaterThan(0);
    expect(Object.keys(root).length).toBeGreaterThanOrEqual(Object.keys(headless).length);
  });
});
