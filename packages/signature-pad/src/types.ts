/**
 * Shared types and option resolution for `@usefy/signature-pad`.
 *
 * Everything in this module is framework-free and SSR-safe — no
 * `window`/`document`/canvas access happens at module scope or inside
 * {@link resolveOptions}.
 */

/**
 * One captured input sample (raw — Bézier smoothing happens at render
 * time; min-distance filtering happens at capture time).
 *
 * @example
 * ```ts
 * import type { SignaturePoint } from "@usefy/signature-pad/headless";
 *
 * const p: SignaturePoint = { x: 12, y: 34, time: 1200, pressure: 0.5 };
 * ```
 */
export interface SignaturePoint {
  /** CSS-pixel coords relative to the canvas box. */
  x: number;
  y: number;
  /** ms timestamp (`performance.now()` domain) — velocity + audit. */
  time: number;
  /** Normalized pressure 0–1; 0 when the device reports none. */
  pressure: number;
}

/** Pointer types that can draw a stroke. */
export type SignaturePointerType = "pen" | "touch" | "mouse";

/**
 * One stroke: pen-down → pen-up (or pointercancel).
 *
 * A stroke is **self-contained**: every width-determining input
 * (`minWidth`, `maxWidth`, `velocityFilterWeight`, `pressure` mode,
 * `pointerType`) is captured at stroke start and stored alongside the
 * points, so a serialized stroke replays identically on any engine —
 * regardless of that engine's own options.
 *
 * @example
 * ```ts
 * import type { SignatureStroke } from "@usefy/signature-pad/headless";
 *
 * const stroke: SignatureStroke = {
 *   points: [{ x: 0, y: 0, time: 0, pressure: 0 }],
 *   color: "#1e293b",
 *   minWidth: 0.5,
 *   maxWidth: 2.5,
 *   velocityFilterWeight: 0.7,
 *   pressure: "auto",
 *   pointerType: "mouse",
 * };
 * ```
 */
export interface SignatureStroke {
  points: SignaturePoint[];
  color: string;
  /** Width bounds captured at stroke start (options may change between strokes). */
  minWidth: number;
  maxWidth: number;
  /** EMA velocity weight captured at stroke start — replay needs no engine options. */
  velocityFilterWeight: number;
  /** Effective pressure mode captured at stroke start. */
  pressure: "auto" | "ignore";
  pointerType: SignaturePointerType;
}

/**
 * Versioned, JSON-serializable signature document — the shape produced by
 * `engine.toJSON()` and accepted by `engine.fromJSON()`.
 *
 * @example
 * ```ts
 * import type { SignatureData } from "@usefy/signature-pad/headless";
 *
 * const empty: SignatureData = { v: 1, width: 400, height: 200, strokes: [] };
 * ```
 */
export interface SignatureData {
  v: 1;
  /** CSS-pixel canvas size at capture time. */
  width: number;
  height: number;
  strokes: SignatureStroke[];
}

/**
 * Ink and input options shared by the engine, the hook, and the component
 * (SPEC §3.6).
 *
 * @example
 * ```ts
 * import { createSignatureEngine } from "@usefy/signature-pad/headless";
 *
 * const engine = createSignatureEngine(canvas, {
 *   penColor: "#0f172a",
 *   minWidth: 0.75,
 *   maxWidth: 3,
 *   pressure: "ignore",
 * });
 * ```
 */
export interface SignatureOptions {
  /**
   * Ink color. Captured per stroke at stroke start.
   * @default "#1e293b"
   */
  penColor?: string;
  /**
   * Minimum stroke half-width (dot radius) in px.
   * @default 0.5
   */
  minWidth?: number;
  /**
   * Maximum stroke half-width (dot radius) in px.
   * @default 2.5
   */
  maxWidth?: number;
  /**
   * EMA weight for velocity smoothing, 0–1. Higher = reacts faster to
   * velocity changes; lower = smoother width transitions.
   * @default 0.7
   */
  velocityFilterWeight?: number;
  /**
   * Point-filter threshold in px — samples closer than this to the last
   * kept point are dropped.
   * @default 2
   */
  minDistance?: number;
  /**
   * `"auto"`: when a pen reports meaningful pressure (> 0), blend it into
   * the stroke width. `"ignore"`: velocity-only width.
   * @default "auto"
   */
  pressure?: "auto" | "ignore";
  /**
   * Which pointer types draw. Events from other types are ignored.
   * @default ["pen", "touch", "mouse"]
   */
  acceptPointerTypes?: readonly SignaturePointerType[];
  /**
   * Backing-store resolution override. Defaults to
   * `min(devicePixelRatio, 2)` read at engine creation; overrides are
   * clamped to `[0.1, 2]`.
   * @default undefined
   */
  dpr?: number;
  /**
   * Canvas fill painted beneath the ink (also the default export
   * background in Phase 2). `undefined` = transparent.
   * @default undefined
   */
  background?: string;
}

/**
 * {@link SignatureOptions} with every field resolved to a concrete,
 * finite, in-range value (except `dpr`/`background`, which stay optional —
 * `dpr: null` means "use the environment's devicePixelRatio").
 */
export interface ResolvedSignatureOptions {
  penColor: string;
  minWidth: number;
  maxWidth: number;
  velocityFilterWeight: number;
  minDistance: number;
  pressure: "auto" | "ignore";
  acceptPointerTypes: readonly SignaturePointerType[];
  /** `null` = use `min(devicePixelRatio, 2)` at engine creation. */
  dpr: number | null;
  background: string | undefined;
}

/** Options for `engine.toPNG()` (SPEC §3.3). */
export interface PNGExportOptions {
  /**
   * Crop the output to the ink bounding box (plus `padding`).
   * @default true
   */
  trim?: boolean;
  /**
   * Extra px kept around the ink when trimming. The effective inflation
   * is floored by the strokes' round-cap slack (`(maxWidth − minWidth) / 2`)
   * so caps are never clipped, even at `padding: 0`.
   * @default 8
   */
  padding?: number;
  /**
   * Fill color behind the ink. Defaults to the engine's `background`
   * option (transparent when unset). Unsafe color strings are omitted
   * (transparent), never substituted; the PNG exporter additionally
   * probes the canvas and skips values it rejects (e.g. typos like
   * `"#ffg"`).
   */
  background?: string;
  /**
   * Output resolution multiplier.
   * @default the engine's effective devicePixelRatio
   */
  scale?: number;
}

/** Options for `engine.toSVG()` (SPEC §3.3). */
export interface SVGExportOptions {
  /**
   * Crop the viewBox to the ink bounding box (plus `padding`).
   * @default true
   */
  trim?: boolean;
  /**
   * Extra px kept around the ink when trimming. The effective inflation
   * is floored by the strokes' round-cap slack (`(maxWidth − minWidth) / 2`)
   * so caps are never clipped, even at `padding: 0`.
   * @default 8
   */
  padding?: number;
  /**
   * Fill color behind the ink. Defaults to the engine's `background`
   * option (transparent when unset). Unsafe color strings are omitted
   * (transparent), never substituted.
   */
  background?: string;
}

/**
 * Default padding (px) kept around the ink when `trim` crops an export
 * (SPEC §3.3) — shared by `toPNG` and `toSVG`.
 */
export const DEFAULT_EXPORT_PADDING = 8;

/** Default ink option values (SPEC §3.6). */
export const DEFAULT_PEN_COLOR = "#1e293b";
export const DEFAULT_MIN_WIDTH = 0.5;
export const DEFAULT_MAX_WIDTH = 2.5;
export const DEFAULT_VELOCITY_FILTER_WEIGHT = 0.7;
export const DEFAULT_MIN_DISTANCE = 2;
export const DEFAULT_ACCEPT_POINTER_TYPES: readonly SignaturePointerType[] = [
  "pen",
  "touch",
  "mouse",
];

/**
 * Coerce a possibly-absent/degenerate numeric option to a finite number.
 * `NaN`/`±Infinity`/`undefined` all fall back — a non-finite `minDistance`
 * must never eat every point, and a non-finite width must never poison the
 * whole geometry pipeline (SPEC resolved decision #8, confetti lesson).
 *
 * Internal (shared with the engine for `dpr` and input sanitizing); not
 * part of the public `./headless` surface.
 *
 * @example
 * ```ts
 * toFinite(NaN, 2);      // 2
 * toFinite(Infinity, 2); // 2
 * toFinite(0.5, 2);      // 0.5
 * ```
 */
export function toFinite(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

const VALID_POINTER_TYPES: readonly SignaturePointerType[] = ["pen", "touch", "mouse"];

/**
 * Fill in defaults and sanitize a {@link SignatureOptions} object into a
 * {@link ResolvedSignatureOptions}. Pure — safe to call anywhere,
 * including during SSR. The returned object (including
 * `acceptPointerTypes`) is freshly allocated, never a shared reference to
 * the input or to the default array.
 *
 * Sanitization rules:
 * - every numeric field runs through {@link toFinite} (NaN/±Infinity →
 *   default);
 * - `minWidth` is clamped to ≥ 0; `maxWidth` to ≥ `minWidth`;
 * - `velocityFilterWeight` is clamped to `[0, 1]`; `minDistance` to ≥ 0;
 * - `pressure` falls back to `"auto"` for unknown values;
 * - `acceptPointerTypes` keeps only `"pen" | "touch" | "mouse"` entries
 *   (an explicitly-empty list is honored: nothing draws);
 * - `dpr` resolves to `null` ("use environment") when absent or
 *   non-finite; range clamping happens at engine creation.
 *
 * @example
 * ```ts
 * import { resolveOptions } from "@usefy/signature-pad/headless";
 *
 * resolveOptions({ maxWidth: NaN, velocityFilterWeight: 9 });
 * // → { ..., maxWidth: 2.5, velocityFilterWeight: 1, ... }
 * ```
 */
export function resolveOptions(options: SignatureOptions = {}): ResolvedSignatureOptions {
  const minWidth = Math.max(0, toFinite(options.minWidth, DEFAULT_MIN_WIDTH));
  const maxWidth = Math.max(minWidth, toFinite(options.maxWidth, DEFAULT_MAX_WIDTH));
  const velocityFilterWeight = Math.min(
    1,
    Math.max(0, toFinite(options.velocityFilterWeight, DEFAULT_VELOCITY_FILTER_WEIGHT)),
  );
  const minDistance = Math.max(0, toFinite(options.minDistance, DEFAULT_MIN_DISTANCE));
  const pressure = options.pressure === "ignore" ? "ignore" : "auto";
  const acceptPointerTypes = Array.isArray(options.acceptPointerTypes)
    ? options.acceptPointerTypes.filter((t): t is SignaturePointerType =>
        VALID_POINTER_TYPES.includes(t),
      )
    : [...DEFAULT_ACCEPT_POINTER_TYPES];
  const rawDpr = options.dpr;
  const dpr = typeof rawDpr === "number" && Number.isFinite(rawDpr) ? rawDpr : null;
  const penColor = typeof options.penColor === "string" ? options.penColor : DEFAULT_PEN_COLOR;
  const background = typeof options.background === "string" ? options.background : undefined;

  return {
    penColor,
    minWidth,
    maxWidth,
    velocityFilterWeight,
    minDistance,
    pressure,
    acceptPointerTypes,
    dpr,
    background,
  };
}
