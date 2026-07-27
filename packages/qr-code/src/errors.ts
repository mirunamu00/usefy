import type { ErrorCorrectionLevel } from "./types";

/**
 * Thrown when the requested data cannot fit in a QR symbol at the requested
 * error-correction level (SPEC §3.1). Never a silent truncation — a truncated
 * QR code decodes to the wrong value, which is worse than an error.
 *
 * @example
 * ```ts
 * try {
 *   encodeQR(hugeString, { level: "H" });
 * } catch (error) {
 *   if (error instanceof QRCapacityError) {
 *     console.log(`needs ${error.needed} bits, max is ${error.capacity}`);
 *   }
 * }
 * ```
 */
export class QRCapacityError extends Error {
  /** Bits the data requires at the version that was attempted. */
  readonly needed: number;
  /** Bits available at that version and error-correction level. */
  readonly capacity: number;
  readonly level: ErrorCorrectionLevel;
  /** Highest version considered (40, or an explicit `version` option). */
  readonly maxVersion: number;

  constructor(details: {
    needed: number;
    capacity: number;
    level: ErrorCorrectionLevel;
    maxVersion: number;
  }) {
    super(
      `Data does not fit in a QR code: needs ${details.needed} bits but version ` +
        `${details.maxVersion} at level ${details.level} holds ${details.capacity}. ` +
        `Shorten the data or lower the error-correction level.`,
    );
    this.name = "QRCapacityError";
    this.needed = details.needed;
    this.capacity = details.capacity;
    this.level = details.level;
    this.maxVersion = details.maxVersion;
  }
}

/**
 * Thrown when a raster export cannot complete — most often because a
 * cross-origin logo tainted the canvas (SPEC §3.4). The message names the
 * remedy rather than leaving a blank image behind.
 */
export class QRExportError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "QRExportError";
  }
}
