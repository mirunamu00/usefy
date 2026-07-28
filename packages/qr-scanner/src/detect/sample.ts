import { BitMatrix } from "../image/bitmatrix";
import type { SamplingMode } from "../types";
import type { PerspectiveTransform } from "./perspective";

/**
 * Reading the module grid out of a binarized image through the perspective
 * transform.
 *
 * Each module is sampled at its centre — `(column + 0.5, row + 0.5)` in module
 * coordinates — which is the point furthest from every neighbour and therefore
 * the most forgiving of a slightly wrong transform.
 */

/**
 * Sample a `dimension × dimension` module grid.
 *
 * @param bits - The binarized image.
 * @param transform - Module coordinates → image pixels.
 * @param dimension - Modules per side.
 * @param mode - `center` reads one pixel per module. `majority5` reads the
 *   centre plus four neighbours a third of a module out and takes the majority,
 *   which rescues frames where a module is barely two pixels wide and a single
 *   sample can land on a compression artefact.
 * @returns The grid, or `null` when the transform maps any module outside the
 *   image — a symbol running off the edge of the frame cannot be read, and
 *   silently sampling the border would produce a plausible wrong grid.
 */
export function sampleGrid(
  bits: BitMatrix,
  transform: PerspectiveTransform,
  dimension: number,
  mode: SamplingMode = "center",
): BitMatrix | null {
  const grid = BitMatrix.square(dimension);
  const row = new Float64Array(dimension * 2);
  const offsets = mode === "majority5" ? [0, -1 / 3, 1 / 3] : null;

  for (let y = 0; y < dimension; y++) {
    for (let x = 0; x < dimension; x++) {
      row[x * 2] = x + 0.5;
      row[x * 2 + 1] = y + 0.5;
    }
    transform.mapInto(row);

    for (let x = 0; x < dimension; x++) {
      const px = row[x * 2]!;
      const py = row[x * 2 + 1]!;
      const ix = Math.floor(px);
      const iy = Math.floor(py);
      if (ix < 0 || iy < 0 || ix >= bits.width || iy >= bits.height) return null;

      if (!offsets) {
        grid.data[y * dimension + x] = bits.data[iy * bits.width + ix]!;
        continue;
      }

      // Five taps: the centre and one a third of a module out along each axis.
      // The module-space offset is converted to pixels from the transform's own
      // step to the neighbouring module — measured as a **distance**, not as an
      // x-difference: for a symbol rotated near 90° the x-step collapses to
      // zero and all five taps would land inside a single pixel, quietly
      // turning majority sampling back into centre sampling exactly when the
      // frame needed it most.
      const neighbour = x + 1 < dimension ? (x + 1) * 2 : (x - 1) * 2;
      const step = Math.hypot(row[neighbour]! - px, row[neighbour + 1]! - py);
      const delta = Math.max(1, Math.round(step / 3));
      let dark = bits.getSafe(ix, iy) ? 1 : 0;
      dark += bits.getSafe(ix - delta, iy) ? 1 : 0;
      dark += bits.getSafe(ix + delta, iy) ? 1 : 0;
      dark += bits.getSafe(ix, iy - delta) ? 1 : 0;
      dark += bits.getSafe(ix, iy + delta) ? 1 : 0;
      grid.data[y * dimension + x] = dark >= 3 ? 1 : 0;
    }
  }

  return grid;
}
