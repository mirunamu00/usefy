/**
 * Barrel for the pure ink pipeline (`src/ink/` — SPEC §4.2).
 * Everything here is framework-free, SSR-safe, and deterministic.
 */
export {
  filterPoints,
  passesMinDistance,
  pointDistance,
} from "./filterPoints";
export {
  bezierFor,
  flattenSegment,
  type BezierSegment,
  type FlatStep,
  type Vec2,
} from "./bezier";
export { widthForSegment, startWidthFor, type WidthInput } from "./width";
export {
  createStrokeWalker,
  flattenStrokeSegment,
  strokeGeometry,
  strokeSteps,
  type StrokeGeometry,
  type StrokeSegment,
  type StrokeWalker,
  type StrokeWalkerParams,
} from "./strokeWalker";
export { inkBounds, type Rect } from "./bounds";
export { strokesToSVG } from "./svg";
