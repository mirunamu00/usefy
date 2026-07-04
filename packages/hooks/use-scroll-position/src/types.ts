import type { RefObject } from "react";

/**
 * A scroll offset — the current horizontal (`x`) and vertical (`y`) scroll
 * position of the tracked target, in pixels.
 *
 * For the window this is `window.scrollX` / `window.scrollY`; for an element it
 * is `element.scrollLeft` / `element.scrollTop`.
 *
 * @example
 * ```tsx
 * const { x, y } = useScrollPosition();
 * ```
 */
export interface ScrollPosition {
  /** Horizontal scroll offset in pixels. */
  readonly x: number;
  /** Vertical scroll offset in pixels. */
  readonly y: number;
}

/**
 * The thing to track the scroll position of.
 *
 * - An `HTMLElement` — tracks that element's own scroll (`scrollLeft`/`scrollTop`).
 * - A `RefObject<HTMLElement>` — the same, resolved from the ref's `current`.
 * - `null` / `undefined` (or omitted) — tracks the window/document scroll.
 */
export type ScrollPositionTarget =
  | HTMLElement
  | RefObject<HTMLElement | null>
  | null
  | undefined;

/**
 * Options for {@link useScrollPosition}.
 */
export interface UseScrollPositionOptions {
  /**
   * The element (or a ref to it) whose scroll to track. Omit, or pass
   * `null`/`undefined`, to track the window/document scroll instead.
   *
   * Both a raw `HTMLElement` and a `RefObject<HTMLElement>` are accepted — the
   * hook resolves a ref's `current` internally.
   * @default window
   */
  element?: ScrollPositionTarget;

  /**
   * Throttle interval in milliseconds. The scroll handler fires on the leading
   * edge and always fires once more on the trailing edge, so the final resting
   * position is never dropped. Set to `0` to update on every scroll event (no
   * throttle).
   * @default 100
   */
  throttleMs?: number;
}

/**
 * Return type for {@link useScrollPosition} — the current {@link ScrollPosition}.
 */
export type UseScrollPositionReturn = ScrollPosition;
