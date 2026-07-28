import { QRDecodeError } from "./errors";
import { binarize } from "./image/binarize";
import type { BitMatrix } from "./image/bitmatrix";
import { toGray } from "./image/luminance";
import { decodeMatrix } from "./decode/decodeMatrix";
import { detectSymbols, type DetectedSymbol } from "./detect/detect";
import type { GrayImage, QRScanOptions, QRScanResult, Quad } from "./types";

/**
 * The pure, DOM-free decode path: `ImageData` → results.
 *
 * Everything above this (camera frames, files, the native engine, the worker)
 * eventually calls `decodeImageData`. Keeping it free of DOM APIs is what lets
 * the same code run in a worker, in a test, and in a server-side script.
 */

/** Map a point from working-image pixels back to source-image pixels. */
function toSource(gray: GrayImage, point: { x: number; y: number }): { x: number; y: number } {
  return {
    x: gray.offsetX + point.x / gray.scale,
    y: gray.offsetY + point.y / gray.scale,
  };
}

function cornersToSource(gray: GrayImage, corners: Quad): Quad {
  return [
    toSource(gray, corners[0]),
    toSource(gray, corners[1]),
    toSource(gray, corners[2]),
    toSource(gray, corners[3]),
  ];
}

function decodeDetected(
  symbols: readonly DetectedSymbol[],
  gray: GrayImage,
  options: QRScanOptions,
  inverted: boolean,
  timestamp: number | undefined,
): QRScanResult[] {
  const results: QRScanResult[] = [];

  for (const symbol of symbols) {
    for (const attempt of symbol.attempts) {
      try {
        results.push(
          decodeMatrix(attempt.grid, {
            corners: cornersToSource(gray, attempt.corners),
            inverted,
            binary: options.binary,
            timestamp,
          }),
        );
        break; // this symbol is read; the remaining attempts are alternatives
      } catch (error) {
        // A failed attempt is ordinary — most frames contain no code at all,
        // and a symbol usually has several candidate readings of which only one
        // works. Anything that is *not* a decode failure is a bug and must
        // travel to the caller rather than be reported as "nothing found".
        if (!(error instanceof QRDecodeError)) throw error;
      }
    }
  }

  return results;
}

export interface DecodeImageDataOptions extends QRScanOptions {
  /** Overrides `performance.now()` — the frame pump passes the capture time. */
  timestamp?: number;
  /** A luminance buffer to reuse across frames. */
  buffer?: Uint8ClampedArray;
}

/**
 * Decode QR symbols from raw pixels.
 *
 * @returns Every symbol that decoded, up to `maxSymbols`. An empty array means
 *   nothing was found — the normal outcome for most camera frames, and not an
 *   error.
 */
export function decodeImageData(
  image: ImageData,
  options: DecodeImageDataOptions = {},
): QRScanResult[] {
  // An empty frame is nothing to find, not an error — and it must not be
  // rounded up into a 1 × 1 image by the downscaler on its way through.
  if (image.width < 1 || image.height < 1) return [];

  const gray = toGray(image, {
    maxDimension: options.maxDimension ?? 800,
    region: options.region,
    buffer: options.buffer,
  });

  const bits = binarize(gray, options.binarizer);
  const maxSymbols = Math.max(1, options.maxSymbols ?? 1);

  const direct = decodeDetected(
    detectSymbols(bits, { maxSymbols, sampling: options.sampling }),
    gray,
    options,
    false,
    options.timestamp,
  );
  if (direct.length > 0) return direct;

  // The inverted pass costs nothing on a frame that already decoded, so `auto`
  // simply means "try it when the normal reading found nothing". Pacing it
  // across frames is the camera loop's job (it owns the frame counter); a pure
  // function keeping hidden per-call state would be both surprising and wrong
  // the moment two decodes overlap.
  if ((options.invert ?? "auto") === "never") return [];

  // Inverting the *bitmap* rather than re-thresholding keeps the expensive half
  // of the pipeline — grayscale conversion and binarization — to one run.
  const flipped: BitMatrix = bits.inverted();
  return decodeDetected(
    detectSymbols(flipped, { maxSymbols, sampling: options.sampling }),
    gray,
    options,
    true,
    options.timestamp,
  );
}
