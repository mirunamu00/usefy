import type { Binarizer, GrayImage } from "../types";
import { BitMatrix } from "./bitmatrix";

/**
 * Turning a luminance plane into black-and-white modules — the step that
 * decides whether a photograph is readable at all.
 *
 * A single global threshold fails the common case: a phone held over a page
 * casts a shadow across half the symbol, and any one cutoff makes the shadowed
 * half solid black. The default here is therefore a **local** threshold, with
 * a global Otsu pass for images too small for the block grid to mean anything.
 */

/** Side of the square blocks the local threshold is computed over. */
const BLOCK_SIZE = 8;
/** Radius, in blocks, of the neighbourhood each block's threshold averages. */
const BLOCK_RADIUS = 2;
/**
 * A block whose pixels are all within this range is treated as uniform — it is
 * either all paper or all ink, and its own min/max says nothing useful.
 */
const MIN_DYNAMIC_RANGE = 24;

/**
 * Otsu's method: the threshold that minimises intra-class variance.
 *
 * Exported because it is genuinely useful on its own for clean, evenly-lit
 * images (rendered codes, screenshots), where it is both faster and slightly
 * more accurate than the local method.
 */
export function otsuThreshold(gray: GrayImage): number {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < gray.data.length; i++) histogram[gray.data[i]!]!++;

  const total = gray.data.length;
  let sum = 0;
  for (let level = 0; level < 256; level++) sum += level * histogram[level]!;

  let backgroundSum = 0;
  let backgroundCount = 0;
  let best = 0;
  let bestVariance = -1;

  for (let level = 0; level < 256; level++) {
    backgroundCount += histogram[level]!;
    if (backgroundCount === 0) continue;
    const foregroundCount = total - backgroundCount;
    if (foregroundCount === 0) break;

    backgroundSum += level * histogram[level]!;
    const backgroundMean = backgroundSum / backgroundCount;
    const foregroundMean = (sum - backgroundSum) / foregroundCount;
    const variance =
      backgroundCount * foregroundCount * (backgroundMean - foregroundMean) ** 2;

    if (variance > bestVariance) {
      bestVariance = variance;
      best = level;
    }
  }

  return best;
}

/** Threshold the whole image at one cutoff. Dark pixels (≤ threshold) become 1. */
export function globalBinarize(gray: GrayImage, threshold = otsuThreshold(gray)): BitMatrix {
  const matrix = new BitMatrix(gray.width, gray.height);
  for (let i = 0; i < gray.data.length; i++) {
    matrix.data[i] = gray.data[i]! <= threshold ? 1 : 0;
  }
  return matrix;
}

/**
 * Local (adaptive) thresholding over an 8×8 block grid.
 *
 * Each block gets the midpoint of its own min and max, then every block's
 * threshold is replaced by the average over a 5×5 neighbourhood of blocks, so
 * the cutoff varies smoothly across an unevenly lit photo instead of jumping
 * at block boundaries.
 *
 * Uniform blocks — a run of pure paper, or the inside of a large dark area —
 * have no meaningful midpoint of their own, so they inherit a value derived
 * from the blocks above and to the left, which are the ones already known to
 * contain an edge.
 */
export function hybridBinarize(gray: GrayImage): BitMatrix {
  const { width, height, data } = gray;
  const blocksX = Math.max(1, Math.ceil(width / BLOCK_SIZE));
  const blocksY = Math.max(1, Math.ceil(height / BLOCK_SIZE));
  const thresholds = new Int32Array(blocksX * blocksY);

  for (let by = 0; by < blocksY; by++) {
    const yStart = by * BLOCK_SIZE;
    const yEnd = Math.min(yStart + BLOCK_SIZE, height);

    for (let bx = 0; bx < blocksX; bx++) {
      const xStart = bx * BLOCK_SIZE;
      const xEnd = Math.min(xStart + BLOCK_SIZE, width);

      let min = 255;
      let max = 0;

      for (let y = yStart; y < yEnd; y++) {
        let index = y * width + xStart;
        for (let x = xStart; x < xEnd; x++) {
          const value = data[index++]!;
          if (value < min) min = value;
          if (value > max) max = value;
        }
      }

      let threshold = (min + max) >> 1;
      if (max - min <= MIN_DYNAMIC_RANGE) {
        // A uniform block is all paper or all ink, and its own midpoint says
        // nothing. Half its darkest pixel is the estimate — *not* "just below
        // its own level".
        //
        // That difference is not cosmetic. `min - 1` puts a uniform block's
        // threshold right at its own brightness, and the 5 × 5 smoothing then
        // drags the thresholds of neighbouring blocks that *do* contain modules
        // up towards it, until a dim light module reads as ink. Measured on a
        // symbol under a 90 % illumination ramp: with `min - 1` the detector
        // found zero finder patterns; with `min / 2`, all three. Block size and
        // the dynamic-range cutoff made no difference either way.
        threshold = min / 2;

        if (by > 0 && bx > 0) {
          // Where neighbours exist, a smoothed estimate from them is better
          // than a guess from a featureless block. This is what keeps a large
          // dark logo or quiet zone from being sliced apart.
          const above = thresholds[(by - 1) * blocksX + bx]!;
          const left = thresholds[by * blocksX + bx - 1]!;
          const aboveLeft = thresholds[(by - 1) * blocksX + bx - 1]!;
          const estimate = (above + 2 * left + aboveLeft) >> 2;
          if (min < estimate) threshold = estimate;
        }
      }

      thresholds[by * blocksX + bx] = threshold;
    }
  }

  const matrix = new BitMatrix(width, height);
  for (let by = 0; by < blocksY; by++) {
    const yStart = by * BLOCK_SIZE;
    const yEnd = Math.min(yStart + BLOCK_SIZE, height);
    const top = Math.max(0, by - BLOCK_RADIUS);
    const bottom = Math.min(blocksY - 1, by + BLOCK_RADIUS);

    for (let bx = 0; bx < blocksX; bx++) {
      const xStart = bx * BLOCK_SIZE;
      const xEnd = Math.min(xStart + BLOCK_SIZE, width);
      const left = Math.max(0, bx - BLOCK_RADIUS);
      const right = Math.min(blocksX - 1, bx + BLOCK_RADIUS);

      let sum = 0;
      let count = 0;
      for (let ny = top; ny <= bottom; ny++) {
        for (let nx = left; nx <= right; nx++) {
          sum += thresholds[ny * blocksX + nx]!;
          count++;
        }
      }
      const threshold = sum / count;

      for (let y = yStart; y < yEnd; y++) {
        let index = y * width + xStart;
        for (let x = xStart; x < xEnd; x++) {
          matrix.data[index] = data[index]! <= threshold ? 1 : 0;
          index++;
        }
      }
    }
  }

  return matrix;
}

/**
 * Apply the requested binarizer.
 *
 * Images smaller than a few blocks per side fall back to Otsu regardless of
 * the setting: with two or three blocks across, "local" is just a noisier
 * global threshold.
 */
export function binarize(gray: GrayImage, binarizer: Binarizer = "hybrid"): BitMatrix {
  if (typeof binarizer === "function") return binarizer(gray);
  if (binarizer === "otsu") return globalBinarize(gray);

  const tooSmall = gray.width < BLOCK_SIZE * 5 || gray.height < BLOCK_SIZE * 5;
  return tooSmall ? globalBinarize(gray) : hybridBinarize(gray);
}
