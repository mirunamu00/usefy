import type { Point } from "../types";

/** Four points in reading order: top-left, top-right, bottom-right, bottom-left. */
export type Quad4 = readonly [Point, Point, Point, Point];

/**
 * The projective map from module coordinates to image pixels.
 *
 * A QR code photographed at an angle is not a scaled square — parallel lines
 * converge. An affine transform (rotate + scale + shear) cannot represent that,
 * and using one is why some scanners want the code held perfectly flat. The
 * eight-parameter homography here handles any planar view, which is what makes
 * a code readable off a curved bottle label or a screen at 40°.
 *
 * Construction follows the standard two-step factorisation: build the map from
 * the unit square to the quadrilateral, and compose it with the (trivial)
 * scaling from module space to the unit square. Doing it that way needs no
 * matrix inversion and no linear solver.
 */
export class PerspectiveTransform {
  private constructor(
    private readonly a11: number,
    private readonly a21: number,
    private readonly a31: number,
    private readonly a12: number,
    private readonly a22: number,
    private readonly a32: number,
    private readonly a13: number,
    private readonly a23: number,
    private readonly a33: number,
  ) {}

  /**
   * The map taking the unit square's corners (0,0), (1,0), (1,1), (0,1) to the
   * four given points, in that order.
   */
  static fromUnitSquare(
    topLeft: Point,
    topRight: Point,
    bottomRight: Point,
    bottomLeft: Point,
  ): PerspectiveTransform {
    const dx3 = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;
    const dy3 = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;

    if (dx3 === 0 && dy3 === 0) {
      // The quad is a parallelogram: the projective terms vanish and this is a
      // plain affine map. Handling it separately avoids a 0/0.
      return new PerspectiveTransform(
        topRight.x - topLeft.x,
        bottomRight.x - topRight.x,
        topLeft.x,
        topRight.y - topLeft.y,
        bottomRight.y - topRight.y,
        topLeft.y,
        0,
        0,
        1,
      );
    }

    const dx1 = topRight.x - bottomRight.x;
    const dx2 = bottomLeft.x - bottomRight.x;
    const dy1 = topRight.y - bottomRight.y;
    const dy2 = bottomLeft.y - bottomRight.y;
    const denominator = dx1 * dy2 - dx2 * dy1;
    const a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
    const a23 = (dx1 * dy3 - dx3 * dy1) / denominator;

    return new PerspectiveTransform(
      topRight.x - topLeft.x + a13 * topRight.x,
      bottomLeft.x - topLeft.x + a23 * bottomLeft.x,
      topLeft.x,
      topRight.y - topLeft.y + a13 * topRight.y,
      bottomLeft.y - topLeft.y + a23 * bottomLeft.y,
      topLeft.y,
      a13,
      a23,
      1,
    );
  }

  /**
   * The map taking the four given points **to** the unit square — the inverse
   * of {@link fromUnitSquare}, obtained as the adjugate matrix (a projective
   * map is defined up to scale, so the adjugate serves as an inverse without
   * dividing by the determinant).
   */
  static toUnitSquare(
    topLeft: Point,
    topRight: Point,
    bottomRight: Point,
    bottomLeft: Point,
  ): PerspectiveTransform {
    return PerspectiveTransform.fromUnitSquare(
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
    ).adjugate();
  }

  /**
   * The map from one quadrilateral to another.
   *
   * This is what detection actually needs: the four points it can locate — the
   * three finder centres and the alignment-pattern centre — sit at *interior*
   * module coordinates (3.5 modules in from each edge, 6.5 for the alignment
   * pattern), not at the grid's corners. Composing "source quad → unit square →
   * destination quad" handles that in full generality, so no stage has to
   * pretend its correspondences are corners.
   */
  static quadToQuad(source: Quad4, destination: Quad4): PerspectiveTransform {
    const toSquare = PerspectiveTransform.toUnitSquare(...source);
    const fromSquare = PerspectiveTransform.fromUnitSquare(...destination);
    return fromSquare.times(toSquare);
  }

  /** The adjugate (classical adjoint) — the inverse up to a scale factor. */
  private adjugate(): PerspectiveTransform {
    return new PerspectiveTransform(
      this.a22 * this.a33 - this.a23 * this.a32,
      this.a23 * this.a31 - this.a21 * this.a33,
      this.a21 * this.a32 - this.a22 * this.a31,
      this.a13 * this.a32 - this.a12 * this.a33,
      this.a11 * this.a33 - this.a13 * this.a31,
      this.a12 * this.a31 - this.a11 * this.a32,
      this.a12 * this.a23 - this.a13 * this.a22,
      this.a13 * this.a21 - this.a11 * this.a23,
      this.a11 * this.a22 - this.a12 * this.a21,
    );
  }

  /** Matrix product — `this ∘ other`, applying `other` first. */
  private times(other: PerspectiveTransform): PerspectiveTransform {
    return new PerspectiveTransform(
      this.a11 * other.a11 + this.a21 * other.a12 + this.a31 * other.a13,
      this.a11 * other.a21 + this.a21 * other.a22 + this.a31 * other.a23,
      this.a11 * other.a31 + this.a21 * other.a32 + this.a31 * other.a33,
      this.a12 * other.a11 + this.a22 * other.a12 + this.a32 * other.a13,
      this.a12 * other.a21 + this.a22 * other.a22 + this.a32 * other.a23,
      this.a12 * other.a31 + this.a22 * other.a32 + this.a32 * other.a33,
      this.a13 * other.a11 + this.a23 * other.a12 + this.a33 * other.a13,
      this.a13 * other.a21 + this.a23 * other.a22 + this.a33 * other.a23,
      this.a13 * other.a31 + this.a23 * other.a32 + this.a33 * other.a33,
    );
  }

  /** Map a point from module coordinates to image pixels. */
  map(x: number, y: number): Point {
    const denominator = this.a13 * x + this.a23 * y + this.a33;
    return {
      x: (this.a11 * x + this.a21 * y + this.a31) / denominator,
      y: (this.a12 * x + this.a22 * y + this.a32) / denominator,
    };
  }

  /**
   * Map many points at once, in place, into a flat `[x0, y0, x1, y1, …]` array.
   * The sampler calls this once per row rather than allocating a point object
   * per module — a version 40 symbol has 31,329 of them.
   */
  mapInto(points: Float64Array): void {
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i]!;
      const y = points[i + 1]!;
      const denominator = this.a13 * x + this.a23 * y + this.a33;
      points[i] = (this.a11 * x + this.a21 * y + this.a31) / denominator;
      points[i + 1] = (this.a12 * x + this.a22 * y + this.a32) / denominator;
    }
  }
}
