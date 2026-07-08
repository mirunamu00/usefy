/**
 * Delay configuration for hover events.
 * Can be a single number for both enter/leave, or an object for separate values.
 *
 * @example
 * ```tsx
 * // Same delay for enter and leave
 * const delay: HoverDelayConfig = 200;
 *
 * // Different delays
 * const delay: HoverDelayConfig = { enter: 100, leave: 500 };
 * ```
 */
export type HoverDelayConfig =
  | number
  | {
      /**
       * Delay in milliseconds before isHovered becomes true
       * @default 0
       */
      enter?: number;
      /**
       * Delay in milliseconds before isHovered becomes false
       * @default 0
       */
      leave?: number;
    };

/**
 * Callback function for hover state changes
 *
 * @param isHovered - The new hover state
 * @param event - The triggering mouse or touch event (undefined for initial state)
 */
export type OnHoverChangeCallback = (
  isHovered: boolean,
  event?: MouseEvent | TouchEvent
) => void;

/**
 * Options for configuring the useHover hook
 */
export interface UseHoverOptions {
  /**
   * Whether the hover detection is enabled.
   * When false, isHovered will always be false and no event listeners are attached.
   * @default true
   */
  enabled?: boolean;

  /**
   * Delay in milliseconds before hover state changes.
   * Can be a single number for both enter/leave, or an object for separate values.
   * @default 0
   *
   * @example
   * ```tsx
   * // Same delay for enter and leave
   * useHover({ delay: 200 })
   *
   * // Different delays - useful for tooltips
   * useHover({ delay: { enter: 500, leave: 100 } })
   * ```
   */
  delay?: HoverDelayConfig;

  /**
   * Callback fired when hover state changes.
   * Called with the new hover state and the triggering event.
   *
   * @example
   * ```tsx
   * useHover({
   *   onChange: (isHovered, event) => {
   *     if (isHovered) {
   *       analytics.track('element_hovered');
   *     }
   *   }
   * })
   * ```
   */
  onChange?: OnHoverChangeCallback;

  /**
   * Initial hover state.
   * Useful for SSR to prevent hydration mismatches.
   * @default false
   */
  initialHovered?: boolean;

  /**
   * Whether to detect touch events (for hybrid devices).
   * When true, touchstart/touchend events also trigger hover state.
   * @default false
   */
  detectTouch?: boolean;
}

/**
 * Return type for the useHover hook.
 *
 * It is both a labeled, positionally-typed **tuple** `[ref, isHovered]` and an
 * **object** `{ ref, isHovered }`, so either destructuring form infers precise
 * types (the tuple positions are `ref` then `boolean`, never a union). The
 * tuple half is natively iterable, which is what powers `const [ref, isHovered]`.
 *
 * @template T - The type of element the ref will be attached to (HTMLElement or SVGElement)
 *
 * @example
 * ```tsx
 * // Object destructuring
 * const { ref, isHovered } = useHover<HTMLDivElement>();
 *
 * // Tuple destructuring
 * const [ref, isHovered] = useHover<HTMLDivElement>();
 *
 * // SVG elements
 * const { ref, isHovered } = useHover<SVGSVGElement>();
 * ```
 */
export type UseHoverReturn<T extends Element = HTMLElement> = readonly [
  ref: (node: T | null) => void,
  isHovered: boolean,
] & {
  /**
   * Callback ref to attach to the target element.
   * Can be passed directly to the ref prop of any element.
   *
   * @example
   * ```tsx
   * const { ref, isHovered } = useHover();
   * return <div ref={ref}>{isHovered ? 'Hovering!' : 'Hover me'}</div>;
   * ```
   */
  ref: (node: T | null) => void;

  /**
   * Boolean indicating whether the element is currently being hovered.
   */
  isHovered: boolean;
};
