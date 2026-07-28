import type { QRScanResult, ModuleGrid, Quad, QRScanSegment } from "../types";
import { QRDecodeError } from "../errors";
import { readCodewords } from "./codewords";
import { readFormatInfo, readVersion } from "./format";
import { parseSegments } from "./segments";

/**
 * A sampled module grid → a decoded payload.
 *
 * This is the whole bit-level decoder in one function, and it is deliberately
 * separate from anything that touches an image: a grid can come from a camera
 * frame, from a test fixture, or straight out of `@usefy/qr-code`'s encoder,
 * and all three take the identical path through here. That is what makes the
 * round-trip oracle (SPEC §7) a test of the real code rather than of a
 * test-only shortcut.
 */

export interface DecodeMatrixOptions {
  /**
   * Corners to attach to the result, in source-image pixels. Detection supplies
   * them; a grid decoded directly gets the grid's own module coordinates.
   */
  corners?: Quad;
  /** Marks the result as having come from an inverted (light-on-dark) pass. */
  inverted?: boolean;
  /** Skip text decoding — `text` comes back empty and only `bytes` is filled. */
  binary?: boolean;
  /** Overrides `performance.now()`; the frame pump passes the capture time. */
  timestamp?: number;
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const part of parts) total += part.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function gridCorners(size: number): Quad {
  return [
    { x: 0, y: 0 },
    { x: size, y: 0 },
    { x: size, y: size },
    { x: 0, y: size },
  ];
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Decode a module grid, trying the mirrored reading if the direct one fails.
 *
 * **This transpose is the only mirror detection in the package**, not a
 * fallback for one elsewhere. The three finder patterns are identical squares,
 * so a mirrored symbol is geometrically indistinguishable from a normal one and
 * the detector always emits the normally-handed corner labelling (SPEC decision
 * #6, and the module header of `detect/group.ts`). The first asymmetry in a QR
 * symbol is the format information, which is exactly where this lands.
 *
 * Do not "optimise away" the retry: without it, every mirrored symbol fails.
 * It costs nothing for normal symbols — the direct reading succeeds first.
 *
 * @throws {QRDecodeError} when neither reading produces a valid symbol.
 */
export function decodeMatrix(grid: ModuleGrid, options: DecodeMatrixOptions = {}): QRScanResult {
  try {
    return decodeOrientation(grid, false, options);
  } catch (error) {
    try {
      return decodeOrientation(grid.transposed(), true, options);
    } catch {
      // The mirrored attempt is a long shot; when it also fails, the direct
      // reading's error is the one that describes what actually went wrong.
      throw error;
    }
  }
}

function decodeOrientation(
  grid: ModuleGrid,
  mirrored: boolean,
  options: DecodeMatrixOptions,
): QRScanResult {
  const version = readVersion(grid);
  if (version === null) {
    throw new QRDecodeError(
      "format",
      `The sampled grid (${grid.width}×${grid.height}) is not a readable QR symbol size, ` +
        "or its version information is unrecoverable.",
    );
  }

  const format = readFormatInfo(grid);
  if (!format) {
    throw new QRDecodeError(
      "format",
      "The format information could not be recovered — the symbol's corners are too " +
        "damaged, or the image is not a QR code.",
    );
  }

  const { data, errorsCorrected } = readCodewords(grid, version, format.level, format.mask);
  const parsed = parseSegments(data, version);

  const bytes = concatBytes(parsed.segments.map((segment) => segment.bytes));
  const segments: QRScanSegment[] = options.binary
    ? parsed.segments.map(({ mode, bytes: segmentBytes, eci }) =>
        eci === undefined ? { mode, bytes: segmentBytes } : { mode, bytes: segmentBytes, eci },
      )
    : parsed.segments;

  const text = options.binary
    ? ""
    : segments.map((segment) => segment.text ?? "").join("");

  // `corners` is documented in the symbol's own reading order. Transposing the
  // grid to read a mirrored symbol reflects it across the main diagonal, which
  // swaps what the image calls "top-right" and "bottom-left" — so the quad is
  // reordered to match, and an overlay drawn from it still traces the symbol.
  const detected = options.corners ?? gridCorners(grid.size);
  const corners: Quad = mirrored
    ? [detected[0], detected[3], detected[2], detected[1]]
    : detected;

  return {
    text,
    bytes,
    segments,
    symbol: {
      version,
      size: grid.size,
      level: format.level,
      mask: format.mask,
      mirrored,
      inverted: options.inverted ?? false,
      errorsCorrected,
      ...(parsed.structuredAppend ? { structuredAppend: parsed.structuredAppend } : {}),
      ...(parsed.fnc1 ? { fnc1: parsed.fnc1 } : {}),
      ...(parsed.fnc1Application !== undefined ? { fnc1Application: parsed.fnc1Application } : {}),
    },
    corners,
    center: centerOf(corners),
    engine: "internal",
    timestamp: options.timestamp ?? now(),
  };
}

/** The centroid of a quad — good enough for a "where is it" marker. */
export function centerOf(corners: Quad): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const point of corners) {
    x += point.x;
    y += point.y;
  }
  return { x: x / 4, y: y / 4 };
}
