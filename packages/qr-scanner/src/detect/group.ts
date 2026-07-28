import type { BitMatrix } from "../image/bitmatrix";
import type { Point } from "../types";
import { distance, type FinderCandidate } from "./finder";
import { moduleSizeBetween } from "./moduleSize";

/**
 * Turning loose finder candidates into oriented symbols.
 *
 * Three finder patterns sit at the corners of an isoceles right triangle whose
 * legs are the symbol's sides. Grouping is therefore a geometry test — which
 * three candidates form that triangle, at a scale consistent with their own
 * module sizes — followed by working out which corner is which.
 *
 * ── Why mirroring is *not* decided here ──
 * The right-angle corner is unambiguous, but which of the other two is the
 * top-right is not: the three finder patterns are identical 7 × 7 squares, and
 * so are the timing and alignment patterns, so a mirrored symbol is
 * geometrically indistinguishable from a normal one. Both labellings exist and
 * one of them always has "normal" handedness — computing a cross product here
 * would only be re-deriving the label this code just chose.
 *
 * So this stage always emits the normally-handed labelling, and mirroring is
 * settled where the first real asymmetry lives: the format information.
 * `decodeMatrix` reads the grid, and on failure reads its transpose, which
 * costs one extra format read for mirrored symbols and nothing at all for
 * everyone else.
 */

export interface FinderTriple {
  /** The corner shared by both legs — the finder with the alignment pattern opposite it. */
  readonly topLeft: FinderCandidate;
  readonly topRight: FinderCandidate;
  readonly bottomLeft: FinderCandidate;
  /** Average module size across the three patterns, in image pixels. */
  readonly moduleSize: number;
  /** The most likely module count — `dimensions[0]`. */
  readonly dimension: number;
  /** Module counts worth trying, most likely first (see {@link dimensionCandidates}). */
  readonly dimensions: readonly number[];
}

/** Legs may differ by this fraction and still be called a square symbol. */
const SIDE_RATIO_TOLERANCE = 0.35;
/** Module sizes across the three patterns must agree within this fraction. */
const MODULE_SIZE_TOLERANCE = 0.6;
/** The hypotenuse of a right isoceles triangle is √2 legs, within this slack. */
const DIAGONAL_TOLERANCE = 0.35;

function moduleSizesAgree(a: FinderCandidate, b: FinderCandidate, c: FinderCandidate): boolean {
  const average = (a.moduleSize + b.moduleSize + c.moduleSize) / 3;
  const spread = Math.max(
    Math.abs(a.moduleSize - average),
    Math.abs(b.moduleSize - average),
    Math.abs(c.moduleSize - average),
  );
  return spread / average <= MODULE_SIZE_TOLERANCE;
}

/**
 * Assign the three candidates to corners.
 *
 * The two patterns furthest apart are the ends of the hypotenuse; the third is
 * the top-left. The remaining choice — which of the two is the top-right — is
 * settled by handedness, always in favour of the normally-oriented reading
 * (see the module header for why that is a labelling convention and not a
 * mirror test).
 */
function orient(
  a: FinderCandidate,
  b: FinderCandidate,
  c: FinderCandidate,
): { topLeft: FinderCandidate; topRight: FinderCandidate; bottomLeft: FinderCandidate } | null {
  const ab = distance(a, b);
  const bc = distance(b, c);
  const ca = distance(c, a);

  let topLeft: FinderCandidate;
  let first: FinderCandidate;
  let second: FinderCandidate;
  let hypotenuse: number;
  let legs: [number, number];

  if (bc >= ab && bc >= ca) {
    topLeft = a;
    first = b;
    second = c;
    hypotenuse = bc;
    legs = [ab, ca];
  } else if (ca >= ab && ca >= bc) {
    topLeft = b;
    first = c;
    second = a;
    hypotenuse = ca;
    legs = [bc, ab];
  } else {
    topLeft = c;
    first = a;
    second = b;
    hypotenuse = ab;
    legs = [ca, bc];
  }

  const [legA, legB] = legs;
  if (legA === 0 || legB === 0) return null;
  // The two sides of a QR symbol are the same length.
  if (Math.abs(legA - legB) / Math.max(legA, legB) > SIDE_RATIO_TOLERANCE) return null;
  // And the diagonal is √2 times a side. Without this, three finder patterns
  // in a straight line (three symbols in a row on a page) look like a symbol.
  const expectedDiagonal = Math.SQRT2 * ((legA + legB) / 2);
  if (Math.abs(hypotenuse - expectedDiagonal) / expectedDiagonal > DIAGONAL_TOLERANCE) return null;

  // Cross product of (first − topLeft) × (second − topLeft). Image coordinates
  // put y downwards, so the normally-oriented reading is the one where
  // top-right → bottom-left turns clockwise, i.e. a positive z.
  const cross =
    (first.x - topLeft.x) * (second.y - topLeft.y) -
    (first.y - topLeft.y) * (second.x - topLeft.x);
  // Exactly collinear centres are not a symbol — and would leave the labelling
  // undecided, which is worse than declining.
  if (cross === 0) return null;

  return cross > 0
    ? { topLeft, topRight: first, bottomLeft: second }
    : { topLeft, topRight: second, bottomLeft: first };
}

/** Legal symbol sizes are `4v + 17`, so every one is ≡ 1 (mod 4). */
function isLegalDimension(dimension: number): boolean {
  return dimension >= 21 && dimension <= 177 && (dimension & 0x03) === 1;
}

/**
 * Candidate module counts for a symbol, most likely first.
 *
 * The count comes from the distance between finder centres divided by the
 * module size — and the module size is *measured*, from a binarized image that
 * has usually been blurred by a lens and resampled by the downscaler. Both
 * widen dark runs slightly, so the estimate runs a percent or two high.
 *
 * On a small symbol that rounds away. On a large one it does not: at version 40
 * a 2.5 % bias across 170 modules is four whole modules, and the symbol is
 * confidently measured as 173 rather than 177. Measured on a real version 40
 * render at 4.2 px per module, which is what a 925 px symbol becomes under the
 * default 800 px cap — a completely ordinary photograph.
 *
 * So this returns a short ordered list rather than one answer, and the caller
 * proves which is right by decoding it: a grid sampled at the wrong dimension
 * fails its format word, its Reed–Solomon parity and its bit-stream parse, in
 * that order. Guessing is cheap; a wrong single answer is a lost symbol.
 */
export function dimensionCandidates(
  topLeft: Point,
  topRight: Point,
  bottomLeft: Point,
  moduleSize: number,
): number[] {
  if (!(moduleSize > 0)) return [];

  const across = Math.round(distance(topLeft, topRight) / moduleSize);
  const down = Math.round(distance(topLeft, bottomLeft) / moduleSize);
  const raw = Math.floor((across + down) / 2) + 7;

  // `raw ≡ 3 (mod 4)` sits exactly between two legal sizes, so both lead — that
  // ambiguity is pure rounding and exists at every size.
  const ambiguous = (raw & 0x03) === 3;

  // A neighbouring size is only worth trying when the bias could plausibly
  // reach it: shifting by one version takes a module-size error of
  // `4 / (dimension - 7)`, which is 2.4 % at version 40 and 29 % at version 1.
  // Below version 7 a miss that large means the geometry is wrong, not the
  // measurement, and sampling a second grid would be pure waste.
  const worthWidening = raw >= 45;
  const offsets = ambiguous
    ? worthWidening
      ? [-2, 2, -6, 6]
      : [-2, 2]
    : worthWidening
      ? [0, 1, -1, 4, -4, 5, -5]
      : [0, 1, -1];

  const legal = offsets.map((offset) => raw + offset).filter(isLegalDimension);

  const seen = new Set<number>();
  const candidates: number[] = [];
  for (const candidate of legal) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    candidates.push(candidate);
    // Three is the useful limit: beyond that the geometry, not the bias, is
    // wrong, and every extra candidate is a full resample of a large grid.
    if (candidates.length === 3) break;
  }

  return candidates;
}

/**
 * The single most likely module count, or `null`.
 *
 * Kept as the simple form of {@link dimensionCandidates} for callers that want
 * one answer — the detector uses the list.
 */
export function estimateDimension(
  topLeft: Point,
  topRight: Point,
  bottomLeft: Point,
  moduleSize: number,
): number | null {
  return dimensionCandidates(topLeft, topRight, bottomLeft, moduleSize)[0] ?? null;
}

/**
 * Module size measured along the symbol's own two axes.
 *
 * The scan-derived estimate each candidate carries is inflated for a rotated
 * symbol (see `moduleSize.ts`), so it is used only as a fallback for the case
 * where neither axis could be measured — a symbol running off the edge of the
 * frame, usually.
 */
function axisModuleSize(
  bits: BitMatrix,
  oriented: { topLeft: FinderCandidate; topRight: FinderCandidate; bottomLeft: FinderCandidate },
): number {
  const across = moduleSizeBetween(bits, oriented.topLeft, oriented.topRight);
  const down = moduleSizeBetween(bits, oriented.topLeft, oriented.bottomLeft);

  const measured = [across, down].filter((value) => value > 0 && Number.isFinite(value));
  if (measured.length === 0) {
    return (
      (oriented.topLeft.moduleSize + oriented.topRight.moduleSize + oriented.bottomLeft.moduleSize) /
      3
    );
  }
  return measured.reduce((sum, value) => sum + value, 0) / measured.length;
}

/**
 * Group candidates into oriented symbols, best first.
 *
 * Candidates arrive sorted by confidence, so the nested loop naturally tries
 * the most-confirmed triples first. Each candidate may only belong to one
 * returned symbol: two symbols cannot share a finder pattern, and allowing it
 * produces phantom third symbols made of two real ones' corners.
 */
export function groupFinders(
  bits: BitMatrix,
  candidates: readonly FinderCandidate[],
  limit = 1,
): FinderTriple[] {
  const results: FinderTriple[] = [];
  if (candidates.length < 3 || limit < 1) return results;

  const used = new Set<FinderCandidate>();

  for (let i = 0; i < candidates.length - 2 && results.length < limit; i++) {
    const a = candidates[i]!;
    if (used.has(a)) continue;

    for (let j = i + 1; j < candidates.length - 1 && results.length < limit; j++) {
      const b = candidates[j]!;
      // `a` is re-checked here, not only at the top of its own loop: once a
      // triple is accepted the inner `break` returns here with `a` already
      // consumed, and continuing would build a second "symbol" from one real
      // symbol's corner plus another's — the phantom this pass exists to stop.
      if (used.has(a)) break;
      if (used.has(b)) continue;

      for (let k = j + 1; k < candidates.length && results.length < limit; k++) {
        const c = candidates[k]!;
        if (used.has(c) || !moduleSizesAgree(a, b, c)) continue;

        const oriented = orient(a, b, c);
        if (!oriented) continue;

        const moduleSize = axisModuleSize(bits, oriented);
        const dimensions = dimensionCandidates(
          oriented.topLeft,
          oriented.topRight,
          oriented.bottomLeft,
          moduleSize,
        );
        if (dimensions.length === 0) continue;

        results.push({ ...oriented, moduleSize, dimension: dimensions[0]!, dimensions });
        used.add(a);
        used.add(b);
        used.add(c);
        break;
      }
    }
  }

  return results;
}
