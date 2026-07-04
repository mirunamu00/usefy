/**
 * The measured bounds of an element.
 *
 * Mirrors the shape of a {@link DOMRect} — `width`/`height` are the element's
 * rendered size, and `x`/`y`/`top`/`right`/`bottom`/`left` are its position
 * relative to the viewport (as reported by `getBoundingClientRect()`).
 */
export interface Bounds {
  /** Horizontal position of the element's left edge, relative to the viewport. */
  readonly x: number;
  /** Vertical position of the element's top edge, relative to the viewport. */
  readonly y: number;
  /** Rendered width of the element in pixels. */
  readonly width: number;
  /** Rendered height of the element in pixels. */
  readonly height: number;
  /** Distance from the top of the viewport to the element's top edge. */
  readonly top: number;
  /** Distance from the left of the viewport to the element's right edge. */
  readonly right: number;
  /** Distance from the top of the viewport to the element's bottom edge. */
  readonly bottom: number;
  /** Distance from the left of the viewport to the element's left edge. */
  readonly left: number;
}

/**
 * Callback ref returned by {@link useMeasure}. Attach it to the element you
 * want to measure (`<div ref={ref} />`). Passing `null` (on unmount) stops the
 * measurement.
 */
export type UseMeasureRef<T extends Element = Element> = (
  element: T | null
) => void;

/**
 * Tuple returned by {@link useMeasure}: a callback `ref` to attach to an
 * element, and the element's current {@link Bounds}.
 *
 * @example
 * ```tsx
 * const [ref, bounds] = useMeasure();
 * ```
 */
export type UseMeasureReturn<T extends Element = Element> = readonly [
  UseMeasureRef<T>,
  Bounds,
];
