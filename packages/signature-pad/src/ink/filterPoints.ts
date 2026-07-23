/**
 * Min-distance point filtering — the first stage of the ink pipeline
 * (SPEC §4.2). Pure and framework-free.
 */
import type { SignaturePoint } from "../types";

/**
 * Euclidean distance between two points, in CSS px.
 *
 * @example
 * ```ts
 * import { pointDistance } from "@usefy/signature-pad/headless";
 *
 * pointDistance({ x: 0, y: 0 }, { x: 3, y: 4 }); // 5
 * ```
 */
export function pointDistance(
  a: Pick<SignaturePoint, "x" | "y">,
  b: Pick<SignaturePoint, "x" | "y">,
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * The single accept/drop predicate shared by the batch {@link filterPoints}
 * and the engine's incremental capture path — both MUST agree or replay
 * would diverge from live drawing.
 *
 * A point passes when it is at least `minDistance` px from the previously
 * kept point. `minDistance <= 0` accepts everything (including exact
 * duplicates).
 *
 * @example
 * ```ts
 * import { passesMinDistance } from "@usefy/signature-pad/headless";
 *
 * passesMinDistance({ x: 0, y: 0 }, { x: 2, y: 0 }, 2);   // true (exactly at threshold)
 * passesMinDistance({ x: 0, y: 0 }, { x: 1.9, y: 0 }, 2); // false
 * ```
 */
export function passesMinDistance(
  prev: Pick<SignaturePoint, "x" | "y">,
  next: Pick<SignaturePoint, "x" | "y">,
  minDistance: number,
): boolean {
  return pointDistance(prev, next) >= minDistance;
}

/**
 * Drop points closer than `minDistance` to the last **kept** point.
 * The first point is always kept. Pure — the input array is not mutated;
 * kept points are the original references.
 *
 * @example
 * ```ts
 * import { filterPoints } from "@usefy/signature-pad/headless";
 *
 * const pts = [
 *   { x: 0, y: 0, time: 0, pressure: 0 },
 *   { x: 1, y: 0, time: 5, pressure: 0 },  // 1px from (0,0) — dropped
 *   { x: 3, y: 0, time: 10, pressure: 0 }, // 3px from (0,0) — kept
 * ];
 * filterPoints(pts, 2).map((p) => p.x); // [0, 3]
 * ```
 */
export function filterPoints(
  points: readonly SignaturePoint[],
  minDistance: number,
): SignaturePoint[] {
  if (points.length === 0) return [];
  const kept: SignaturePoint[] = [points[0]];
  let last = points[0];
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (passesMinDistance(last, p, minDistance)) {
      kept.push(p);
      last = p;
    }
  }
  return kept;
}
