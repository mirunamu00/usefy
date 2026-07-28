import type { BitMatrix } from "../image/bitmatrix";
import type { ModuleGrid, Point, Quad, SamplingMode } from "../types";
import { findAlignmentPattern, predictAlignment } from "./alignment";
import { findFinderPatterns, type FinderCandidate } from "./finder";
import { groupFinders, type FinderTriple } from "./group";
import { PerspectiveTransform } from "./perspective";
import { sampleGrid } from "./sample";

/**
 * Detection: binarized image → sampled module grids, with the image-space
 * corners each came from.
 *
 * This is the stage that turns "there are some dark shapes here" into "this is
 * a version 7 symbol, and here is its grid" — everything downstream is pure
 * arithmetic on bits.
 */

/** One way of reading a located symbol: a sampled grid and where it came from. */
export interface SampleAttempt {
  readonly grid: ModuleGrid;
  /** Corners in the coordinates of the image that was searched. */
  readonly corners: Quad;
  /** Whether this sampling used a located alignment pattern. */
  readonly alignmentFound: boolean;
  /** The module count this attempt assumed. */
  readonly dimension: number;
}

export interface DetectedSymbol {
  /**
   * Ways to read this symbol, best first. `decodeImage` takes the first that
   * decodes, so the extras cost nothing for a symbol that reads cleanly.
   *
   * Two things generate alternatives, and both are cases where committing to a
   * single answer would silently lose real symbols:
   *
   * - **The fourth corner.** The alignment search scans for a 1 : 1 : 1 run,
   *   and a strongly rotated symbol stretches that chord enough that the data
   *   region can offer a better match than the real pattern. Rather than
   *   tightening the search until it misses genuine patterns, a bad fourth
   *   point costs one extra attempt.
   * - **The module count.** It is derived from a *measured* module size, which
   *   runs high on a blurred or downscaled image — by four whole modules at
   *   version 40 (see `dimensionCandidates`).
   */
  readonly attempts: readonly SampleAttempt[];
  /** The most likely module count. */
  readonly dimension: number;
  readonly moduleSize: number;
}

export interface DetectOptions {
  /** How many symbols to look for. @default 1 */
  maxSymbols?: number;
  sampling?: SamplingMode;
}

/**
 * The symbol's outer corners in image pixels.
 *
 * Mapped through the same transform the sampler uses, so perspective is
 * applied to the corners rather than added on top of an already-projected
 * point — which is what makes an overlay drawn from them sit on a tilted
 * symbol instead of near it.
 */
function cornersOf(transform: PerspectiveTransform, dimension: number): Quad {
  return [
    transform.map(0, 0),
    transform.map(dimension, 0),
    transform.map(dimension, dimension),
    transform.map(0, dimension),
  ];
}

/**
 * Build the module-space → image transform for one detected triple.
 *
 * The four correspondences are stated in module coordinates, where the finder
 * centres sit 3.5 modules in from their two outer edges and the bottom-right
 * alignment pattern sits 6.5 in — the general quad-to-quad construction takes
 * them as they are, with no pretending that a finder centre is a grid corner.
 *
 * With an alignment pattern this is a true four-point homography. Without one
 * — version 1, or a pattern too damaged to find — the fourth point is
 * extrapolated from the other three, which is exact for a flat view and
 * degrades gracefully for a mild angle.
 */
function transformsFor(
  bits: BitMatrix,
  triple: FinderTriple,
  dimension: number,
): Array<{ transform: PerspectiveTransform; alignmentFound: boolean }> {
  const { topLeft, topRight, bottomLeft, moduleSize } = triple;
  const inset = 3.5;
  const far = dimension - inset;

  // Without an alignment pattern: complete the parallelogram for the fourth
  // point. Exact for a flat view, and a good approximation for a mild angle.
  const bottomRight: Point = {
    x: topRight.x - topLeft.x + bottomLeft.x,
    y: topRight.y - topLeft.y + bottomLeft.y,
  };
  const withoutAlignment = {
    transform: PerspectiveTransform.quadToQuad(
      [
        { x: inset, y: inset },
        { x: far, y: inset },
        { x: far, y: far },
        { x: inset, y: far },
      ],
      [topLeft, topRight, bottomRight, bottomLeft],
    ),
    alignmentFound: false,
  };

  if (dimension <= 21) return [withoutAlignment];

  // The prediction's error grows with both the symbol's size and the viewing
  // angle, so a fixed window is either too tight for a large warped symbol or
  // too loose for a small one. Widening on failure gets both: a cheap, precise
  // search first, and a broader one only when it finds nothing.
  const predicted = predictAlignment(topLeft, topRight, bottomLeft, dimension);
  const found =
    findAlignmentPattern(bits, predicted, moduleSize) ??
    findAlignmentPattern(bits, predicted, moduleSize, moduleSize * 12);
  if (!found) return [withoutAlignment];

  const alignInset = dimension - 6.5;
  const withAlignment = {
    transform: PerspectiveTransform.quadToQuad(
      [
        { x: inset, y: inset },
        { x: far, y: inset },
        { x: alignInset, y: alignInset },
        { x: inset, y: far },
      ],
      [topLeft, topRight, found, bottomLeft],
    ),
    alignmentFound: true,
  };

  return [withAlignment, withoutAlignment];
}

/**
 * Detect and sample every symbol in a binarized image.
 *
 * Returns an empty array rather than throwing: "no code in this frame" is the
 * normal outcome for most camera frames, not an error.
 */
export function detectSymbols(bits: BitMatrix, options: DetectOptions = {}): DetectedSymbol[] {
  const maxSymbols = Math.max(1, options.maxSymbols ?? 1);
  const candidates: FinderCandidate[] = findFinderPatterns(bits);
  const triples = groupFinders(bits, candidates, maxSymbols);

  const symbols: DetectedSymbol[] = [];
  for (const triple of triples) {
    const attempts: SampleAttempt[] = [];

    // Ordered so the likeliest reading is tried first: the best dimension with
    // its alignment pattern, then without it, then the neighbouring dimensions.
    // `decodeImage` stops at the first attempt that decodes, so a symbol that
    // reads cleanly never pays for the rest.
    for (const dimension of triple.dimensions) {
      for (const { transform, alignmentFound } of transformsFor(bits, triple, dimension)) {
        const grid = sampleGrid(bits, transform, dimension, options.sampling);
        if (!grid) continue;
        attempts.push({
          grid,
          corners: cornersOf(transform, dimension),
          alignmentFound,
          dimension,
        });
      }
    }

    if (attempts.length === 0) continue;
    symbols.push({ attempts, dimension: triple.dimension, moduleSize: triple.moduleSize });
  }

  return symbols;
}
