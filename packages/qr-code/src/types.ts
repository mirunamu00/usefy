/**
 * Public type surface shared by the encoder, the renderers and the React
 * layer, plus the small numeric guards every option path runs through.
 *
 * The guards exist because a `NaN` that reaches the geometry layer produces an
 * invisible, un-debuggable blank code — a lesson inherited from
 * `@usefy/confetti`'s first review. Every numeric option is normalized here,
 * once, at the boundary.
 */

/** Error-correction level, lowest to highest redundancy. */
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

/** The encoding modes this package implements (kanji is out of scope — SPEC §2.2). */
export type QRSegmentMode = "numeric" | "alphanumeric" | "byte";

/** One run of characters encoded in a single mode. */
export interface QRSegment {
  readonly mode: QRSegmentMode;
  /** Character count as the mode counts it (digits, alphanumerics, or bytes). */
  readonly charCount: number;
  /** Raw bytes for `byte` mode; the ASCII bytes of the run for the others. */
  readonly data: Uint8Array;
}

/**
 * The encoder's output: a complete, masked module matrix.
 *
 * `modules` and `reserved` are plain row-major `Uint8Array`s so a matrix is
 * cheap to pass around, structurally comparable in tests, and trivially
 * serializable.
 */
export interface QRMatrix {
  /** Symbol version, 1–40. */
  readonly version: number;
  /** Modules per side, `4 * version + 17`, excluding the quiet zone. */
  readonly size: number;
  readonly level: ErrorCorrectionLevel;
  /** Applied mask pattern, 0–7. */
  readonly mask: number;
  /** `size * size`, row-major. 1 = dark. */
  readonly modules: Uint8Array;
  /** `size * size`, row-major. 1 = function pattern / reserved area. */
  readonly reserved: Uint8Array;
  /** Dark? Out-of-range coordinates read as light. */
  get(x: number, y: number): boolean;
  /** Part of a function pattern? Out-of-range coordinates read as false. */
  isReserved(x: number, y: number): boolean;
}

/** Options that affect the encoded symbol itself. */
export interface EncodeOptions {
  /** @default "M" */
  level?: ErrorCorrectionLevel;
  /** Force a symbol version 1–40. Throws `QRCapacityError` if the data doesn't fit. */
  version?: number;
  /** Floor for automatic version selection — keeps the code a stable size. @default 1 */
  minVersion?: number;
  /** Force a mask pattern 0–7 instead of choosing by penalty score. */
  mask?: number;
  /**
   * Emit an ECI header (assignment 26, UTF-8) when the text contains
   * characters outside ISO-8859-1, so scanners decode it correctly.
   * @default true
   */
  eci?: boolean;
}

/** A colour stop in a {@link QRGradient}. */
export interface QRGradientStop {
  /** Position along the gradient, 0–1. */
  offset: number;
  color: string;
}

/** A foreground gradient, rendered identically in SVG and canvas. */
export interface QRGradient {
  type: "linear" | "radial";
  /** Degrees clockwise from horizontal. Ignored for radial gradients. @default 0 */
  rotation?: number;
  stops: QRGradientStop[];
}

/** Shape used for each data module. */
export type QRModuleShape = "square" | "rounded" | "dot" | "classy";

/** Shape used for the three finder patterns ("eyes"). */
export type QREyeShape = "square" | "rounded" | "circle" | "leaf";

/** Logo / centre-image options. */
export interface QRLogoOptions {
  /** Image URL or (recommended) data URI. */
  src: string;
  /**
   * Width as a fraction of the **rendered side including the quiet zone**,
   * clamped to 0.35. Widening `margin` therefore makes the logo cover more
   * *modules* at the same `size` — check `logoSafety()` if you change both.
   * @default 0.2
   */
  size?: number;
  /** Clear the modules underneath instead of painting over them. @default true */
  excavate?: boolean;
  /** Quiet ring around the logo, as a fraction of the code. @default 0.02 */
  padding?: number;
  /** @default "square" */
  shape?: "square" | "circle";
  /** `crossOrigin` for the image element — required for PNG export of remote logos. */
  crossOrigin?: "anonymous" | "use-credentials";
}

/** Visual options shared by every renderer. */
export interface QRStyleOptions {
  /** Quiet zone in modules. The spec minimum is 4. @default 4 */
  margin?: number;
  /** Foreground colour, or a gradient. @default "#000000" */
  fg?: string | QRGradient;
  /** Background colour; `null` renders transparent. @default "#ffffff" */
  bg?: string | null;
  /** @default "square" */
  moduleShape?: QRModuleShape;
  /** @default "square" */
  eyeShape?: QREyeShape;
  /** Override the finder-pattern colours independently of `fg`. */
  eyeColor?: { outer?: string; inner?: string };
  /** Inset between modules, 0–0.3 of a module. @default 0 */
  moduleGap?: number;
  logo?: QRLogoOptions;
}

/** Everything that describes a QR code: what it encodes and how it looks. */
export interface QROptions extends EncodeOptions, QRStyleOptions {}

/** How much of the symbol a logo occludes, against what the EC level can absorb. */
export interface LogoSafety {
  /** Modules the logo (plus its padding) covers. */
  occludedModules: number;
  /** Those modules as a fraction of the symbol's total modules. */
  occludedRatio: number;
  /** Fraction of the symbol the current level can lose and still decode. */
  ecBudget: number;
  /** True when `occludedRatio` stays within the budget. */
  safe: boolean;
  /** Lowest level that would make this logo safe, or `null` if none does. */
  recommendedLevel: ErrorCorrectionLevel | null;
}

/** A single fill in the rendered output. */
export interface QRPath {
  /** SVG path data. */
  d: string;
  /** A CSS colour, or `url(#id)` referencing a gradient in {@link QRSVGProps.defs}. */
  fill: string;
}

/** Gradient definition emitted alongside {@link QRSVGProps.paths}. */
export interface QRGradientDef {
  id: string;
  gradient: QRGradient;
  /** Bounding box the gradient spans, in user units. */
  bounds: { x: number; y: number; width: number; height: number };
}

/**
 * Structured SVG output — everything a React Server Component needs to render
 * a `<svg>` as real JSX, with no `dangerouslySetInnerHTML` and no client JS.
 */
export interface QRSVGProps {
  viewBox: string;
  /** Total side length in user units (modules including the quiet zone). */
  side: number;
  /** Background rect fill, or `null` when transparent. */
  background: string | null;
  /**
   * The `shape-rendering` hint this style needs. Resolved here rather than at
   * each call site so the component and `toSVG()` cannot disagree.
   */
  shapeRendering: "crispEdges" | "geometricPrecision";
  paths: QRPath[];
  defs: QRGradientDef[];
  /** Present only when a logo is configured. */
  image: {
    href: string;
    x: number;
    y: number;
    width: number;
    height: number;
    clipCircle: boolean;
    /**
     * Content-derived id for the clip path. Identical logos may share it;
     * different ones never collide, which matters because SVG ids are
     * document-global.
     */
    clipId: string;
    crossOrigin?: "anonymous" | "use-credentials";
  } | null;
}

/**
 * Coerce to a finite number, falling back when the input is `NaN`, `Infinity`,
 * or not a number at all.
 */
export function toFinite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** {@link toFinite} plus a clamp to `[min, max]`. */
export function clampFinite(value: unknown, fallback: number, min: number, max: number): number {
  const n = toFinite(value, fallback);
  return n < min ? min : n > max ? max : n;
}

/** {@link clampFinite} rounded to an integer. */
export function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  return Math.round(clampFinite(value, fallback, min, max));
}
