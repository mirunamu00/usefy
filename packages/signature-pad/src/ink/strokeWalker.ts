/**
 * The stroke → geometry state machine — the ONE place segment order,
 * width carry-over, and pressure blending are decided. The engine's
 * incremental live rendering, every full replay (undo/resize/restore),
 * `inkBounds`, and the SVG/PNG exporters all walk strokes through this
 * exact machine, which is what makes live, replayed, and exported
 * geometry identical by construction (SPEC §5.2 "one pipeline, four
 * consumers").
 *
 * Strokes are **self-contained**: every width-determining input
 * (`minWidth`, `maxWidth`, `velocityFilterWeight`, `pressure` mode,
 * `pointerType`) is captured on the stroke at stroke start, so replaying
 * a serialized stroke needs no engine options — a restored document
 * renders identically on an engine configured differently.
 *
 * Pure and framework-free.
 */
import type { SignaturePoint, SignaturePointerType, SignatureStroke } from "../types";
import { bezierFor, flattenSegment, type BezierSegment, type FlatStep } from "./bezier";
import { pointDistance } from "./filterPoints";
import { startWidthFor, widthForSegment } from "./width";

/**
 * Per-stroke geometry parameters — captured at stroke start and stored on
 * the stroke record (the width-determining subset of the ink options).
 */
export interface StrokeWalkerParams {
  minWidth: number;
  maxWidth: number;
  /** EMA weight for velocity smoothing (0–1). */
  velocityFilterWeight: number;
  /** Whether meaningful pen pressure blends into the width. */
  pressure: "auto" | "ignore";
  pointerType: SignaturePointerType;
}

/**
 * One fully-determined Bézier segment of a stroke, with the widths
 * (radii) at its two ends. The flattened dot-stamp steps for canvas/PNG
 * and the stroked `<path>` for SVG both derive from this single record.
 */
export interface StrokeSegment {
  bezier: BezierSegment;
  /** Radius at the segment start (carried over from the previous segment). */
  startWidth: number;
  /** Radius at the segment end (this segment's velocity/pressure width). */
  endWidth: number;
}

/**
 * A whole stroke's derived geometry: its ordered segments, or — for a
 * single-point tap — the dot to stamp instead.
 */
export interface StrokeGeometry {
  segments: StrokeSegment[];
  /** The tap-dot for single-point strokes; `null` otherwise. */
  dot: FlatStep | null;
}

/**
 * Incremental stroke walker.
 *
 * Feed already-filtered points in capture order via {@link StrokeWalker.add};
 * each call returns the draw steps that became final with that point —
 * i.e. the Bézier segment ending at the *previous* point, which needed the
 * new point as its forward neighbor (`p3`) for control-point derivation.
 * {@link StrokeWalker.finish} flushes the tail segment (no forward
 * neighbor), or the tap-dot when the stroke has a single point.
 *
 * The rendered ink therefore trails the pointer by exactly one accepted
 * point while drawing — the signature_pad behavior — and a full replay
 * that feeds the same points produces the same steps in the same order.
 */
export interface StrokeWalker {
  /** Points accepted so far (the walker owns the array; do not mutate). */
  readonly points: readonly SignaturePoint[];
  /** Add the next filtered point; returns newly-final draw steps (often `[]`). */
  add(point: SignaturePoint): FlatStep[];
  /**
   * End the stroke; returns the tail segment's steps, the single tap-dot
   * step (radius `(minWidth + maxWidth) / 2`), or `[]` for an empty
   * stroke. Idempotent — subsequent calls return `[]`.
   */
  finish(): FlatStep[];
}

/**
 * Blended pressure for the segment `a → b`, or `null` when pressure is
 * not meaningful for this stroke (SPEC §3.1: pen pointer + `"auto"` mode
 * + reported pressure > 0). The blend value is the mean of the endpoint
 * pressures.
 */
function segmentPressure(
  params: StrokeWalkerParams,
  a: SignaturePoint,
  b: SignaturePoint,
): number | null {
  if (params.pressure !== "auto" || params.pointerType !== "pen") return null;
  const mean = (a.pressure + b.pressure) / 2;
  return mean > 0 ? mean : null;
}

/** The segment-level core shared by the incremental walker and batch walks. */
interface SegmentMachine {
  readonly points: readonly SignaturePoint[];
  add(point: SignaturePoint): StrokeSegment | null;
  finish(): { segment: StrokeSegment | null; dot: FlatStep | null };
}

function createSegmentMachine(params: StrokeWalkerParams): SegmentMachine {
  const points: SignaturePoint[] = [];
  let lastVelocity = 0;
  let lastWidth = startWidthFor(params.minWidth, params.maxWidth);
  let finished = false;

  /** The segment p1 → p2 with neighbors p0/p3 (null at stroke tips). */
  function emit(
    p0: SignaturePoint | null,
    p1: SignaturePoint,
    p2: SignaturePoint,
    p3: SignaturePoint | null,
  ): StrokeSegment {
    const { width, velocity } = widthForSegment({
      prevVelocity: lastVelocity,
      distance: pointDistance(p1, p2),
      dtMs: p2.time - p1.time,
      minWidth: params.minWidth,
      maxWidth: params.maxWidth,
      velocityFilterWeight: params.velocityFilterWeight,
      pressure: segmentPressure(params, p1, p2),
    });
    const segment: StrokeSegment = {
      bezier: bezierFor(p0, p1, p2, p3),
      startWidth: lastWidth,
      endWidth: width,
    };
    lastVelocity = velocity;
    lastWidth = width;
    return segment;
  }

  return {
    get points(): readonly SignaturePoint[] {
      return points;
    },

    add(point: SignaturePoint): StrokeSegment | null {
      if (finished) return null;
      points.push(point);
      const n = points.length;
      // The segment ending at the previous point is only now fully
      // determined (this point is its forward neighbor p3).
      if (n < 3) return null;
      return emit(n === 3 ? null : points[n - 4], points[n - 3], points[n - 2], point);
    },

    finish(): { segment: StrokeSegment | null; dot: FlatStep | null } {
      if (finished) return { segment: null, dot: null };
      finished = true;
      const n = points.length;
      if (n === 0) return { segment: null, dot: null };
      if (n === 1) {
        // Tap with no movement → a dot of start width (SPEC §3.1).
        return {
          segment: null,
          dot: { x: points[0].x, y: points[0].y, width: lastWidth },
        };
      }
      // Tail segment: last two points, no forward neighbor.
      return {
        segment: emit(n === 2 ? null : points[n - 3], points[n - 2], points[n - 1], null),
        dot: null,
      };
    },
  };
}

/**
 * Flatten one {@link StrokeSegment} into its dot-stamp draw steps —
 * `flattenSegment` with the segment's own end widths.
 *
 * @example
 * ```ts
 * import { strokeGeometry, flattenStrokeSegment } from "@usefy/signature-pad/headless";
 *
 * const { segments } = strokeGeometry(stroke);
 * const steps = segments.flatMap(flattenStrokeSegment);
 * ```
 */
export function flattenStrokeSegment(segment: StrokeSegment): FlatStep[] {
  return flattenSegment(segment.bezier, segment.startWidth, segment.endWidth);
}

/**
 * Create a {@link StrokeWalker}.
 *
 * @example
 * ```ts
 * import { createStrokeWalker } from "@usefy/signature-pad/headless";
 *
 * const walker = createStrokeWalker({
 *   minWidth: 0.5,
 *   maxWidth: 2.5,
 *   velocityFilterWeight: 0.7,
 *   pressure: "auto",
 *   pointerType: "mouse",
 * });
 * walker.add({ x: 0, y: 0, time: 0, pressure: 0 });   // []
 * walker.add({ x: 10, y: 0, time: 10, pressure: 0 }); // [] (segment awaits p3)
 * walker.add({ x: 20, y: 0, time: 20, pressure: 0 }); // steps for 0→10
 * walker.finish();                                    // steps for 10→20
 * ```
 */
export function createStrokeWalker(params: StrokeWalkerParams): StrokeWalker {
  const machine = createSegmentMachine(params);
  return {
    get points(): readonly SignaturePoint[] {
      return machine.points;
    },
    add(point: SignaturePoint): FlatStep[] {
      const segment = machine.add(point);
      return segment ? flattenStrokeSegment(segment) : [];
    },
    finish(): FlatStep[] {
      const { segment, dot } = machine.finish();
      if (dot) return [dot];
      return segment ? flattenStrokeSegment(segment) : [];
    },
  };
}

function paramsOf(stroke: SignatureStroke): StrokeWalkerParams {
  return {
    minWidth: stroke.minWidth,
    maxWidth: stroke.maxWidth,
    velocityFilterWeight: stroke.velocityFilterWeight,
    pressure: stroke.pressure,
    pointerType: stroke.pointerType,
  };
}

/**
 * Derive a whole (already-captured) stroke's segment geometry — exactly
 * the segments the incremental path would have produced, in order. This
 * is the shared source for canvas replay, `inkBounds`, PNG rendering,
 * and SVG path emission (geometry parity by construction).
 *
 * The stroke record itself carries every parameter the walk needs
 * (self-contained strokes) — no options argument.
 *
 * @example
 * ```ts
 * import { strokeGeometry } from "@usefy/signature-pad/headless";
 *
 * const { segments, dot } = strokeGeometry(stroke);
 * // dot != null ⇔ single-point tap stroke
 * ```
 */
export function strokeGeometry(stroke: SignatureStroke): StrokeGeometry {
  const machine = createSegmentMachine(paramsOf(stroke));
  const segments: StrokeSegment[] = [];
  for (const point of stroke.points) {
    const segment = machine.add(point);
    if (segment) segments.push(segment);
  }
  const { segment, dot } = machine.finish();
  if (segment) segments.push(segment);
  return { segments, dot };
}

/**
 * Flatten a whole stroke into its complete draw-step sequence — exactly
 * the steps the incremental path would have produced. Used by full
 * replay and `inkBounds`.
 *
 * @example
 * ```ts
 * import { strokeSteps } from "@usefy/signature-pad/headless";
 *
 * const steps = strokeSteps(stroke);
 * ```
 */
export function strokeSteps(stroke: SignatureStroke): FlatStep[] {
  const { segments, dot } = strokeGeometry(stroke);
  if (dot) return [dot];
  const steps: FlatStep[] = [];
  for (const segment of segments) steps.push(...flattenStrokeSegment(segment));
  return steps;
}
