import type { ErrorCorrectionLevel } from "@usefy/qr-code/headless";
import type { BitMatrix } from "./image/bitmatrix";

export type { ErrorCorrectionLevel };

/* ────────────────────────────── geometry ────────────────────────────── */

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Four corners in reading order: top-left, top-right, bottom-right, bottom-left. */
export type Quad = readonly [Point, Point, Point, Point];

/* ──────────────────────────── image sources ─────────────────────────── */

/**
 * Anything this package can read pixels from.
 *
 * `ImageData` is the only one the pure engine actually consumes; everything
 * else is normalized to it first (`src/image/source.ts`), which is what keeps
 * the decoder itself DOM-free and usable inside a worker.
 */
export type ImageSource =
  | ImageData
  | HTMLVideoElement
  | HTMLImageElement
  | HTMLCanvasElement
  | ImageBitmap
  | Blob;

/**
 * A luminance plane, plus how it maps back to the source image.
 *
 * Results are always reported in **source-image pixels**, so every stage that
 * downscales or crops records how to undo that here rather than leaking scaled
 * coordinates into the public API.
 */
export interface GrayImage {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  /** `grayPixels / sourcePixels` — 1 when no downscale was applied. */
  readonly scale: number;
  /** X of the crop origin in source pixels. */
  readonly offsetX: number;
  /** Y of the crop origin in source pixels. */
  readonly offsetY: number;
}

/** A sampled module grid: `size × size`, 1 = dark. */
export type ModuleGrid = BitMatrix;

export type BinarizerMode = "hybrid" | "otsu";
export type Binarizer = BinarizerMode | ((gray: GrayImage) => BitMatrix);

/* ───────────────────────────── scan results ─────────────────────────── */

export type QRScanEngine = "native" | "internal";

export type QRSegmentMode = "numeric" | "alphanumeric" | "byte" | "kanji";

/** One decoded segment, exactly as the symbol carried it. */
export interface QRScanSegment {
  readonly mode: QRSegmentMode;
  /**
   * The segment's text, when its charset could be applied. `undefined` only
   * when the runtime lacks the encoding the symbol declared — `bytes` is always
   * present, so no data is ever lost to a missing decoder.
   */
  readonly text?: string;
  readonly bytes: Uint8Array;
  /** The ECI assignment in effect for this segment, when one was declared. */
  readonly eci?: number;
}

/** Where a symbol sits in a multi-symbol (Structured Append) sequence. */
export interface StructuredAppendInfo {
  /** 0-based position in the sequence. */
  readonly index: number;
  /** How many symbols the sequence has (2–16). */
  readonly total: number;
  /** Parity byte — identical across every symbol of one sequence. */
  readonly parity: number;
}

/**
 * Symbol-level facts about a decode.
 *
 * Only the internal engine can report these: `BarcodeDetector` exposes the
 * value and a bounding box and nothing else (SPEC §3.4), so a native result
 * omits this object rather than inventing it.
 */
export interface QRSymbolInfo {
  /** Symbol version, 1–40. */
  readonly version: number;
  /** Modules per side (`4 * version + 17`). */
  readonly size: number;
  readonly level: ErrorCorrectionLevel;
  /** The mask pattern that was applied, 0–7. */
  readonly mask: number;
  /** The symbol was printed mirrored (read through glass, or a bad export). */
  readonly mirrored: boolean;
  /** The symbol is light-on-dark and was decoded from an inverted pass. */
  readonly inverted: boolean;
  /** Codeword errors Reed–Solomon repaired — a print/lighting quality signal. */
  readonly errorsCorrected: number;
  readonly structuredAppend?: StructuredAppendInfo;
  /** GS1 (FNC1 in the first position) or AIM (second position) data. */
  readonly fnc1?: "gs1" | "aim";
  /** The application indicator byte carried by an AIM FNC1 symbol. */
  readonly fnc1Application?: number;
}

export interface QRScanResult {
  /** The decoded text — the value a consumer usually wants. */
  readonly text: string;
  /** The raw payload bytes, before any charset was applied. */
  readonly bytes: Uint8Array;
  readonly segments: readonly QRScanSegment[];
  /** Absent for native results (see {@link QRSymbolInfo}). */
  readonly symbol?: QRSymbolInfo;
  /** Symbol corners in **source-image** pixels: TL, TR, BR, BL. */
  readonly corners: Quad;
  /** Centre of the symbol in source-image pixels. */
  readonly center: Point;
  readonly engine: QRScanEngine;
  /** `performance.now()` at the moment the decode completed. */
  readonly timestamp: number;
}

/* ───────────────────────────── scan options ─────────────────────────── */

export type EnginePreference = "auto" | "native" | "internal";

export type InvertMode = "auto" | "always" | "never";

export type SamplingMode = "center" | "majority5";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface QRScanOptions {
  /**
   * Which decoder to use.
   *
   * - `auto` (default) — the platform's `BarcodeDetector` when it supports QR,
   *   with the internal engine as a fallback (SPEC §3.4).
   * - `native` — native only; throws {@link QRUnsupportedError} where absent.
   * - `internal` — always the hand-written engine. Deterministic, and the only
   *   mode that reports {@link QRSymbolInfo}.
   *
   * @default "auto"
   */
  engine?: EnginePreference;
  /**
   * How many symbols to decode from one image.
   * @default 1
   */
  maxSymbols?: number;
  /**
   * Cap on the working image's longest side, in pixels. Bigger frames are box
   * filtered down before analysis; `0` disables the cap.
   *
   * This is a decode *budget*, not a quality cap — a 4K photo of a small code
   * still decodes, it just does not cost 8 MP of work per frame.
   *
   * @default 800
   */
  maxDimension?: number;
  /**
   * Thresholding strategy, or your own function.
   * @default "hybrid"
   */
  binarizer?: Binarizer;
  /**
   * Whether to also try the image inverted (light modules on a dark
   * background), which is common on dark-themed screens and etched labels.
   *
   * `auto` and `always` both run the inverted pass only when the normal
   * reading found nothing — a successful frame never pays for it. The live
   * scanner paces the attempt across frames itself, and passes `never` on the
   * frames it chooses to skip.
   *
   * @default "auto"
   */
  invert?: InvertMode;
  /** Restrict analysis to a rectangle of the source image, in source pixels. */
  region?: Rect;
  /**
   * How each module is read from the binarized image. `majority5` samples the
   * centre plus four neighbours and is more forgiving on low-resolution frames,
   * at roughly 2× the sampling cost.
   * @default "center"
   */
  sampling?: SamplingMode;
  /**
   * Skip text decoding and return bytes only. Forces the internal engine,
   * since `BarcodeDetector` never exposes raw bytes.
   * @default false
   */
  binary?: boolean;
}
