/**
 * Gradient geometry shared by the SVG and canvas renderers. The id derivation
 * lives in `ids.ts` alongside the logo clip id, so both follow one rule.
 */

export interface GradientBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LinearEndpoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * The gradient line for a rotation, in user units.
 *
 * The line runs through the centre of `bounds` at `rotation` degrees clockwise
 * from horizontal, extended so the first and last stops land exactly on the
 * box's edge — the projection of the box onto the gradient direction.
 */
export function linearEndpoints(bounds: GradientBounds, rotation: number): LinearEndpoints {
  const radians = (rotation * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const half = (Math.abs(bounds.width * dx) + Math.abs(bounds.height * dy)) / 2;
  return {
    x1: cx - dx * half,
    y1: cy - dy * half,
    x2: cx + dx * half,
    y2: cy + dy * half,
  };
}

/** Centre and radius of a radial gradient covering `bounds`. */
export function radialGeometry(bounds: GradientBounds): { cx: number; cy: number; r: number } {
  return {
    cx: bounds.x + bounds.width / 2,
    cy: bounds.y + bounds.height / 2,
    r: Math.max(bounds.width, bounds.height) / 2,
  };
}
