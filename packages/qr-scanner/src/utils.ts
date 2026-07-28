import type { Point, QRScanResult, Quad } from "./types";

/**
 * Small helpers that belong to a consumer's code more than to the decoder, but
 * are fiddly enough that everyone would write them slightly wrong.
 */

/* ─────────────────────── Structured Append ─────────────────────── */

export interface JoinedSequence {
  /** The concatenated text, in symbol order. */
  readonly text: string;
  readonly bytes: Uint8Array;
  /** How many symbols the sequence expects. */
  readonly total: number;
  /** Sequence positions still missing, in order. */
  readonly missing: number[];
  /** Every symbol present, ordered by position. */
  readonly parts: readonly QRScanResult[];
}

/**
 * Assemble a Structured Append sequence from the symbols scanned so far.
 *
 * The QR standard lets one payload span up to 16 symbols; a scanner meets them
 * one at a time, in whatever order the user happens to point the camera. This
 * sorts, de-duplicates and reports what is still missing, so a UI can say
 * "3 of 5 — keep scanning" instead of silently concatenating a partial result.
 *
 * @throws {RangeError} when the results do not belong to one sequence — a
 *   mismatched parity byte or total means two different multi-part payloads
 *   were mixed, and joining them would produce convincing nonsense.
 *
 * @example
 * ```ts
 * const sequence = joinStructuredAppend(scanned);
 * if (sequence.missing.length === 0) save(sequence.text);
 * ```
 */
export function joinStructuredAppend(results: readonly QRScanResult[]): JoinedSequence {
  const parts = results.filter((result) => result.symbol?.structuredAppend);
  if (parts.length === 0) {
    throw new RangeError("None of these results is part of a Structured Append sequence.");
  }

  const first = parts[0]!.symbol!.structuredAppend!;
  const byIndex = new Map<number, QRScanResult>();

  for (const part of parts) {
    const info = part.symbol!.structuredAppend!;
    if (info.parity !== first.parity || info.total !== first.total) {
      throw new RangeError(
        "These symbols belong to different Structured Append sequences " +
          `(parity ${info.parity} vs ${first.parity}, total ${info.total} vs ${first.total}).`,
      );
    }
    // A symbol scanned twice is normal — the camera sees it in many frames.
    byIndex.set(info.index, part);
  }

  const ordered = Array.from(byIndex.keys())
    .sort((a, b) => a - b)
    .map((index) => byIndex.get(index)!);

  const missing: number[] = [];
  for (let index = 0; index < first.total; index++) {
    if (!byIndex.has(index)) missing.push(index);
  }

  let length = 0;
  for (const part of ordered) length += part.bytes.length;
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of ordered) {
    bytes.set(part.bytes, offset);
    offset += part.bytes.length;
  }

  return {
    text: ordered.map((part) => part.text).join(""),
    bytes,
    total: first.total,
    missing,
    parts: ordered,
  };
}

/* ─────────────────────────── Geometry ─────────────────────────── */

/** The rendered box of a media element, and how its pixels map into it. */
export interface ElementGeometry {
  /** Intrinsic pixel width of the source (`videoWidth`, `naturalWidth`). */
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  /** Size the element occupies on the page, in CSS pixels. */
  readonly elementWidth: number;
  readonly elementHeight: number;
  /** The element's `object-fit`. @default "cover" */
  readonly objectFit?: "cover" | "contain" | "fill";
  /** The element is displayed mirrored — the usual treatment of a front camera. */
  readonly mirrored?: boolean;
}

/**
 * Map a point from source-image pixels to the element's own CSS pixels.
 *
 * This is the step that decides whether an overlay box sits *on* the code or
 * merely near it. A `<video>` showing a 1280 × 720 stream inside a 360 × 640
 * portrait viewport under `object-fit: cover` is scaled **and** cropped on one
 * axis, and a front camera is usually mirrored on top of that. Ignoring any of
 * those puts the highlight in the wrong place, which reads as a broken scanner
 * even though the decode was perfect.
 */
export function mapPointToElement(point: Point, geometry: ElementGeometry): Point {
  const {
    sourceWidth,
    sourceHeight,
    elementWidth,
    elementHeight,
    objectFit = "cover",
    mirrored = false,
  } = geometry;

  if (sourceWidth <= 0 || sourceHeight <= 0) return { x: 0, y: 0 };

  let scaleX: number;
  let scaleY: number;

  if (objectFit === "fill") {
    scaleX = elementWidth / sourceWidth;
    scaleY = elementHeight / sourceHeight;
  } else {
    const scale =
      objectFit === "contain"
        ? Math.min(elementWidth / sourceWidth, elementHeight / sourceHeight)
        : Math.max(elementWidth / sourceWidth, elementHeight / sourceHeight);
    scaleX = scale;
    scaleY = scale;
  }

  // Whatever the fit leaves over is split evenly on both sides — cropped for
  // `cover` (negative offset), letterboxed for `contain` (positive).
  const offsetX = (elementWidth - sourceWidth * scaleX) / 2;
  const offsetY = (elementHeight - sourceHeight * scaleY) / 2;

  const x = point.x * scaleX + offsetX;
  const y = point.y * scaleY + offsetY;

  return { x: mirrored ? elementWidth - x : x, y };
}

/** Map all four corners of a result into element space (see {@link mapPointToElement}). */
export function mapCorners(result: QRScanResult, geometry: ElementGeometry): Quad {
  return [
    mapPointToElement(result.corners[0], geometry),
    mapPointToElement(result.corners[1], geometry),
    mapPointToElement(result.corners[2], geometry),
    mapPointToElement(result.corners[3], geometry),
  ];
}

/** An SVG `points` attribute for a quad — the shortest path to an overlay. */
export function cornersToPolygon(corners: Quad): string {
  return corners.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
}
