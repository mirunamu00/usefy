/**
 * `@usefy/confetti/headless` — the framework-free confetti engine.
 *
 * Pure TypeScript, zero dependencies, zero React imports, SSR-safe to
 * import (no `window`/`document`/canvas access at module scope). Usable
 * from any framework or vanilla JS:
 *
 * @example
 * ```ts
 * import { createConfettiEngine } from "@usefy/confetti/headless";
 *
 * const engine = createConfettiEngine(document.querySelector("canvas")!);
 * await engine.fire({ count: 120, spread: 70 });
 * engine.destroy();
 * ```
 */

// Engine
export { createConfettiEngine, MAX_FRAME_DT_MS, MAX_DPR } from "./engine/createEngine";

// Pure physics (exported for tests and advanced use — SPEC §4.1)
export { spawnParticle, stepParticle } from "./engine/physics";

// Option resolution + defaults
export {
  resolveFireOptions,
  DEFAULT_COLORS,
  DEFAULT_SHAPES,
  DEFAULT_PARTICLES_PER_SECOND,
} from "./types";

// Built-in shape identifiers
export { BUILTIN_SHAPES } from "./shapes/builtin";

// Custom shape helpers
export { textShape } from "./shapes/textShape";
export type { TextShapeOptions } from "./shapes/textShape";
export { imageShape, DEFAULT_IMAGE_HEIGHT } from "./shapes/imageShape";
export type { ImageShapeOptions } from "./shapes/imageShape";
export { pathShape } from "./shapes/pathShape";
export type { PathShapeOptions } from "./shapes/pathShape";
export { DEFAULT_PATH_SHAPE_SIZE } from "./engine/draw";

// Presets + runner
export {
  runPreset,
  celebration,
  fireworks,
  sideCannons,
  pride,
  stars,
  snow,
  rain,
} from "./presets";
export type {
  Preset,
  PresetBurst,
  PresetEmitter,
  PresetRun,
  PresetTarget,
} from "./presets";

// Types
export type {
  BuiltinShape,
  ConfettiEngine,
  ConfettiEngineOptions,
  ConfettiShape,
  CustomShape,
  EmitHandle,
  EmitOptions,
  FireOptions,
  Particle,
  PathShape,
  ResolvedFireOptions,
  SpriteEntry,
  SpriteShape,
} from "./types";
