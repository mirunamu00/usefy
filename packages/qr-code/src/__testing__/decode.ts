import jsQR from "jsqr";
import type { QRMatrix } from "../types";

/**
 * Test-only helpers that rasterize a matrix and read it back with a real QR
 * decoder (`jsQR`).
 *
 * This is the strongest check available to the encoder: a round trip through
 * an independent decoder validates the bit stream, the Reed–Solomon parity,
 * the interleaving, the module placement, the chosen mask *and* the format
 * information all at once. Comparing matrices against another encoder can only
 * prove we agree with that encoder; decoding proves the symbol is actually a
 * QR code.
 */

export interface RasterOptions {
  /** Device pixels per module. */
  scale?: number;
  /** Quiet zone in modules. */
  margin?: number;
}

export interface Raster {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Render a matrix to an RGBA buffer: black modules on white, with a quiet zone. */
export function rasterize(matrix: QRMatrix, options: RasterOptions = {}): Raster {
  const scale = options.scale ?? 5;
  const margin = options.margin ?? 4;
  const side = (matrix.size + margin * 2) * scale;
  const data = new Uint8ClampedArray(side * side * 4).fill(255);

  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.get(x, y)) continue;
      const px = (x + margin) * scale;
      const py = (y + margin) * scale;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const offset = ((py + dy) * side + px + dx) * 4;
          data[offset] = 0;
          data[offset + 1] = 0;
          data[offset + 2] = 0;
        }
      }
    }
  }

  return { data, width: side, height: side };
}

/** Decode a matrix back to text, or `null` when no scanner could read it. */
export function decodeMatrix(matrix: QRMatrix, options?: RasterOptions): string | null {
  const raster = rasterize(matrix, options);
  const result = jsQR(raster.data, raster.width, raster.height);
  return result ? result.data : null;
}

/** Decode a matrix back to raw bytes, or `null` when unreadable. */
export function decodeMatrixBytes(matrix: QRMatrix, options?: RasterOptions): number[] | null {
  const raster = rasterize(matrix, options);
  const result = jsQR(raster.data, raster.width, raster.height);
  return result ? result.binaryData : null;
}

/**
 * Decode what the renderer would actually paint for a **square-module** style.
 *
 * A `ModuleField` already has the logo's excavation and the eye/data split
 * applied, so re-adding the finder patterns reconstructs exactly the pixels a
 * default-styled render produces. That makes "does a logo at this size still
 * scan?" answerable in a unit test instead of only in browser QA.
 */
export function decodeField(
  matrix: QRMatrix,
  field: { size: number; isDark(x: number, y: number): boolean },
  options: RasterOptions = {},
): string | null {
  const painted: QRMatrix = {
    ...matrix,
    get(x: number, y: number): boolean {
      if (x < 0 || y < 0 || x >= field.size || y >= field.size) return false;
      // Finder patterns are drawn as eyes, never excavated.
      return field.isDark(x, y) || (isFinderModule(x, y, field.size) && matrix.get(x, y));
    },
  };
  return decodeMatrix(painted, options);
}

function isFinderModule(x: number, y: number, size: number): boolean {
  const corners = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ] as const;
  return corners.some(([ox, oy]) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7);
}
