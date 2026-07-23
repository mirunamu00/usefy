/**
 * `pathShape` — fully custom vector confetti from a `Path2D` factory.
 *
 * Unlike sprite shapes, path shapes are filled with each particle's own
 * color (from the burst's `colors` palette) and drawn with full
 * rotation/tumble — the go-to for brand marks that should inherit the
 * confetti palette.
 *
 * SSR-safe: the factory runs lazily on first draw, and environments
 * without `Path2D` simply skip drawing.
 */
import { toFinite, type PathShape } from "../types";
import { DEFAULT_PATH_SHAPE_SIZE } from "../engine/draw";

/**
 * Options for {@link pathShape}.
 *
 * @example
 * ```ts
 * pathShape(makeHeart, { size: 14, key: "heart@1" });
 * ```
 */
export interface PathShapeOptions {
  /** Drawn size of the unit box in CSS px at `scalar: 1`. Default `10`. */
  size?: number;
  /**
   * Explicit identity key. Defaults to an auto-generated unique key — pass
   * one only if you want two `pathShape(...)` calls to be treated as the
   * same shape.
   */
  key?: string;
}

let pathShapeCounter = 0;

/**
 * Create a custom vector confetti shape from a `Path2D` factory. Draw your
 * path in the **unit box** `[0,1]×[0,1]` — the renderer centers it on the
 * particle and scales it to `size × scalar` px. The factory runs once
 * (memoized); the same `Path2D` object is reused for every particle and
 * frame.
 *
 * @param factory - Builds the unit-box `Path2D`. Called lazily, once.
 * @param options - Size/key, see {@link PathShapeOptions}.
 * @returns A {@link PathShape} usable anywhere a `ConfettiShape` goes.
 *
 * @example
 * ```ts
 * import { fireConfetti, pathShape } from "@usefy/confetti";
 *
 * const triangle = pathShape(() => {
 *   const p = new Path2D();
 *   p.moveTo(0.5, 0);
 *   p.lineTo(1, 1);
 *   p.lineTo(0, 1);
 *   p.closePath();
 *   return p;
 * }, { size: 12 });
 *
 * fireConfetti({ shapes: [triangle] });
 * ```
 */
export function pathShape(
  factory: () => Path2D,
  options: PathShapeOptions = {},
): PathShape {
  let cached: Path2D | null = null;
  return {
    key: options.key ?? `usefy-path:${++pathShapeCounter}`,
    size: Math.max(0.1, toFinite(options.size, DEFAULT_PATH_SHAPE_SIZE)),
    path(): Path2D | null {
      if (cached) return cached;
      if (typeof Path2D === "undefined") return null; // SSR/old env — skip
      cached = factory();
      return cached;
    },
  };
}
