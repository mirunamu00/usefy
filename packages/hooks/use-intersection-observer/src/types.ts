/**
 * Extended intersection entry with convenience properties
 * Wraps the native IntersectionObserverEntry with additional computed values
 */
export interface IntersectionEntry {
  /**
   * The original native IntersectionObserverEntry
   */
  readonly entry: IntersectionObserverEntry;

  /**
   * Whether the target element is currently intersecting with the root
   */
  readonly isIntersecting: boolean;

  /**
   * The ratio of the target element that is visible (0.0 to 1.0)
   */
  readonly intersectionRatio: number;

  /**
   * The target element being observed
   */
  readonly target: Element;

  /**
   * The bounding rectangle of the target element
   */
  readonly boundingClientRect: DOMRectReadOnly;

  /**
   * The visible portion of the target element (intersection area)
   */
  readonly intersectionRect: DOMRectReadOnly;

  /**
   * The bounding rectangle of the root element (viewport if null)
   */
  readonly rootBounds: DOMRectReadOnly | null;

  /**
   * Timestamp when the intersection was recorded
   */
  readonly time: number;
}

/**
 * Callback function called when intersection state changes
 * @param entry - The intersection entry data
 * @param inView - Whether the element is currently in view
 */
export type OnChangeCallback = (entry: IntersectionEntry, inView: boolean) => void;

/**
 * Options for configuring the useIntersectionObserver hook
 */
export interface UseIntersectionObserverOptions {
  /**
   * Threshold(s) at which the callback is triggered
   * A single number or array of numbers between 0.0 and 1.0
   * - 0: Triggers as soon as any pixel is visible
   * - 0.5: Triggers when 50% of the element is visible
   * - 1.0: Triggers when the entire element is visible
   * @default 0
   *
   * @example
   * ```tsx
   * // Single threshold
   * useIntersectionObserver({ threshold: 0.5 })
   *
   * // Multiple thresholds for granular tracking
   * useIntersectionObserver({ threshold: [0, 0.25, 0.5, 0.75, 1] })
   * ```
   */
  threshold?: number | number[];

  /**
   * The root element used as the viewport for checking visibility
   * If null (default), uses the browser viewport
   * @default null
   *
   * @example
   * ```tsx
   * // Use a custom scrollable container
   * const scrollContainerRef = useRef<HTMLDivElement>(null);
   * useIntersectionObserver({ root: scrollContainerRef.current })
   * ```
   */
  root?: Element | Document | null;

  /**
   * Margin around the root element (CSS margin syntax)
   * Can be used to grow or shrink the root's bounding box before computing intersections
   * Values can be pixels (px) or percentages (%)
   * @default "0px"
   *
   * @example
   * ```tsx
   * // Trigger 100px before element enters viewport
   * useIntersectionObserver({ rootMargin: "100px 0px" })
   *
   * // Trigger when element is 20% away from viewport
   * useIntersectionObserver({ rootMargin: "20%" })
   * ```
   */
  rootMargin?: string;

  /**
   * Stop observing after the element first becomes visible
   * Useful for lazy loading images or one-time animations
   * @default false
   *
   * @example
   * ```tsx
   * // Load image only once when it enters viewport
   * const { ref, inView } = useIntersectionObserver({ triggerOnce: true });
   * return <img ref={ref} src={inView ? imageSrc : placeholder} />;
   * ```
   */
  triggerOnce?: boolean;

  /**
   * Enable or disable the observer dynamically
   * When false, the observer is disconnected and no callbacks are fired
   * @default true
   *
   * @example
   * ```tsx
   * // Disable observation while loading
   * const { ref } = useIntersectionObserver({ enabled: !isLoading });
   * ```
   */
  enabled?: boolean;

  /**
   * Initial intersection state before the first observation
   * Useful for SSR/SSG scenarios where you want to assume a state
   * @default false
   *
   * @example
   * ```tsx
   * // Assume above-the-fold content is visible initially
   * useIntersectionObserver({ initialIsIntersecting: true })
   * ```
   */
  initialIsIntersecting?: boolean;

  /**
   * Callback fired when intersection state changes
   * Called with the intersection entry and a boolean indicating if in view
   *
   * @example
   * ```tsx
   * useIntersectionObserver({
   *   onChange: (entry, inView) => {
   *     if (inView) {
   *       analytics.track('element_viewed', { ratio: entry.intersectionRatio });
   *     }
   *   }
   * })
   * ```
   */
  onChange?: OnChangeCallback;

  /**
   * Delay in milliseconds before starting to observe
   * Useful for preventing flash of content on fast scrolling
   * @default 0
   *
   * @example
   * ```tsx
   * // Wait 100ms before starting observation
   * useIntersectionObserver({ delay: 100 })
   * ```
   */
  delay?: number;
}

/**
 * Return type for the useIntersectionObserver hook
 */
export interface UseIntersectionObserverReturn {
  /**
   * The current intersection entry data
   * null if element hasn't been observed yet or if SSR
   */
  entry: IntersectionEntry | null;

  /**
   * Boolean indicating whether the element is currently in view
   * Shorthand for entry?.isIntersecting ?? initialIsIntersecting
   */
  inView: boolean;

  /**
   * Callback ref to attach to the target element
   * Can be passed directly to the ref prop of any element
   *
   * @example
   * ```tsx
   * const { ref, inView } = useIntersectionObserver();
   * return <div ref={ref}>{inView ? 'Visible!' : 'Not visible'}</div>;
   * ```
   */
  ref: (node: Element | null) => void;
}
