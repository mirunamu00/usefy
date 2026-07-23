/**
 * `@usefy/signature-pad/headless` — the framework-free ink engine.
 *
 * Pure TypeScript, zero dependencies, zero React imports, SSR-safe to
 * import (no `window`/`document`/canvas access at module scope). Usable
 * from any framework or vanilla JS:
 *
 * @example
 * ```ts
 * import { createSignatureEngine } from "@usefy/signature-pad/headless";
 *
 * const engine = createSignatureEngine(document.querySelector("canvas")!);
 * engine.onChange((e) => console.log("signed:", !e.isEmpty));
 * // ...user signs...
 * const draft = engine.toJSON();
 * engine.destroy();
 * ```
 */

// Engine
export { createSignatureEngine, MAX_DPR } from "./engine/createEngine";
export type {
  IngestSample,
  SignatureEngine,
  SignatureEngineOptions,
} from "./engine/createEngine";

// Pure ink pipeline (exported for tests, replay tooling, and advanced use
// — SPEC §4.2; confetti "pure physics" precedent)
export {
  filterPoints,
  passesMinDistance,
  pointDistance,
  bezierFor,
  flattenSegment,
  widthForSegment,
  startWidthFor,
  createStrokeWalker,
  flattenStrokeSegment,
  strokeGeometry,
  strokeSteps,
  inkBounds,
  strokesToSVG,
} from "./ink";
export type {
  BezierSegment,
  FlatStep,
  Rect,
  StrokeGeometry,
  StrokeSegment,
  StrokeWalker,
  StrokeWalkerParams,
  Vec2,
  WidthInput,
} from "./ink";

// Option resolution + defaults
export {
  resolveOptions,
  DEFAULT_PEN_COLOR,
  DEFAULT_MIN_WIDTH,
  DEFAULT_MAX_WIDTH,
  DEFAULT_VELOCITY_FILTER_WEIGHT,
  DEFAULT_MIN_DISTANCE,
  DEFAULT_ACCEPT_POINTER_TYPES,
  DEFAULT_EXPORT_PADDING,
} from "./types";

// Types
export type {
  PNGExportOptions,
  ResolvedSignatureOptions,
  SignatureData,
  SignatureOptions,
  SignaturePoint,
  SignaturePointerType,
  SignatureStroke,
  SVGExportOptions,
} from "./types";
