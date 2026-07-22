import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useScrollPosition } from "@usefy/use-scroll-position";
import { useWindowSize } from "@usefy/use-window-size";

/** Which viewport edge the fixed bar is pinned to. */
export type ScrollProgressPosition = "top" | "bottom";

/** Props for {@link ScrollProgress}. */
export interface ScrollProgressProps {
  /**
   * Which viewport edge the fixed bar is pinned to.
   * @default "top"
   */
  position?: ScrollProgressPosition;
  /**
   * Bar fill color (any CSS color).
   * @default "#3b82f6"
   */
  color?: string;
  /**
   * Bar thickness — a number is pixels, a string is any CSS length.
   * @default 3
   */
  height?: number | string;
  /**
   * Stacking order of the fixed bar.
   * @default 9999
   */
  zIndex?: number;
  /**
   * Ref to the scrollable container to measure. Omit to track the
   * window/document scroll. The bar itself is always fixed to the viewport
   * edge — `target` only selects which scroll is measured.
   */
  target?: RefObject<HTMLElement | null>;
  /**
   * Throttle interval (ms) for scroll updates, forwarded to
   * `useScrollPosition`. `0` updates on every scroll event, which keeps the
   * bar perfectly smooth (the fill is a GPU-composited transform, so this is
   * cheap). The trailing edge always fires, so the resting position is never
   * dropped.
   * @default 0
   */
  throttleMs?: number;
  /**
   * Accessible name of the progressbar.
   * @default "Scroll progress"
   */
  "aria-label"?: string;
  /**
   * Escape hatch: fully own the UI. When provided, the default bar is never
   * rendered and `render` is called on every render with the current progress
   * (`0`–`1`); return `null` to render nothing.
   */
  render?: (progress: number) => ReactNode;
  /** Class name applied to the default bar element. */
  className?: string;
  /** Inline styles merged over the default bar styles (yours win). */
  style?: CSSProperties;
}

/** Default bar fill color. */
export const DEFAULT_BAR_COLOR = "#3b82f6";

/** Default bar thickness, in pixels. */
export const DEFAULT_BAR_HEIGHT = 3;

/** Default stacking order of the fixed bar. */
export const DEFAULT_Z_INDEX = 9999;

/** Default accessible name of the progressbar. */
export const DEFAULT_ARIA_LABEL = "Scroll progress";

const BASE_STYLE: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  // The fill grows left → right via a transform: no layout or paint on scroll.
  transformOrigin: "left center",
  // Non-interactive: never steal clicks or focus from the app underneath.
  pointerEvents: "none",
};

/**
 * Read the current scroll progress of the target as a `0`–`1` fraction:
 * `scrollTop / (scrollHeight - clientHeight)`, clamped.
 *
 * When there is nothing to scroll (`scrollHeight - clientHeight <= 0`, i.e.
 * the content fits in the viewport) the progress is `0`. Returns `0` on the
 * server and while a `target` ref is not attached yet.
 */
function computeProgress(target?: RefObject<HTMLElement | null>): number {
  if (typeof window === "undefined") return 0;

  let scrollTop: number;
  let maxScroll: number;

  if (target != null) {
    const el = target.current;
    if (el === null) return 0;
    scrollTop = el.scrollTop;
    maxScroll = el.scrollHeight - el.clientHeight;
  } else {
    const doc = document.documentElement;
    scrollTop = window.scrollY;
    maxScroll = doc.scrollHeight - doc.clientHeight;
  }

  if (maxScroll <= 0) return 0;
  return Math.min(1, Math.max(0, scrollTop / maxScroll));
}

/**
 * A drop-in reading-progress bar.
 *
 * Renders a thin, fixed, non-interactive strip pinned to the top (or bottom)
 * of the viewport whose fill reflects how far the user has scrolled —
 * `scrollTop / (scrollHeight - clientHeight)`, clamped to `0`–`1`. By default
 * it tracks the window/document scroll; pass a `target` ref to measure a
 * scrollable container instead. When the content is shorter than the viewport
 * (nothing to scroll), progress is `0` and the bar stays empty.
 *
 * Built on `@usefy/use-scroll-position` (throttled, passive, SSR-safe scroll
 * tracking) with `@usefy/use-window-size` re-measuring on viewport resize.
 * Progress is recomputed on every (throttled) scroll and window resize; a
 * content-height change without either is picked up on the next one.
 *
 * Accessibility: the bar is a `role="progressbar"` with
 * `aria-valuenow`/`aria-valuemin`/`aria-valuemax` (as a `0`–`100` percentage)
 * and an overridable `aria-label`, and is non-interactive
 * (`pointer-events: none`).
 *
 * @example
 * ```tsx
 * import { ScrollProgress } from "@usefy/scroll-progress";
 *
 * function App() {
 *   return (
 *     <>
 *       <ScrollProgress color="#8b5cf6" height={4} />
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Track a scrollable container instead of the window
 * function Article() {
 *   const ref = useRef<HTMLDivElement>(null);
 *   return (
 *     <>
 *       <ScrollProgress target={ref} />
 *       <div ref={ref} style={{ overflowY: "auto", height: "100vh" }}>
 *         <LongContent />
 *       </div>
 *     </>
 *   );
 * }
 * ```
 */
export function ScrollProgress({
  position = "top",
  color = DEFAULT_BAR_COLOR,
  height = DEFAULT_BAR_HEIGHT,
  zIndex = DEFAULT_Z_INDEX,
  target,
  throttleMs = 0,
  "aria-label": ariaLabel = DEFAULT_ARIA_LABEL,
  render,
  className,
  style,
}: ScrollProgressProps): ReactNode {
  // Resolve the `target` ref into state before handing it to the scroll hook.
  // The documented usage renders the bar BEFORE the ref'd container, and React
  // attaches refs in tree order during commit — so when the hook's layout
  // effect runs, a later sibling's `ref.current` is still null and, since the
  // RefObject identity never changes, the hook would never re-subscribe. This
  // no-dependency passive effect runs after every commit (when all refs are
  // guaranteed attached), re-reads `current`, and bails out via Object.is when
  // unchanged — converging in one extra render and also handling late or
  // conditionally mounted containers.
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTargetEl(target?.current ?? null);
  });

  // Subscribe to the target's scroll (passive + throttled). `y` re-renders the
  // component as the user scrolls; the progress itself is re-read from the
  // live DOM below so the numerator and denominator are always consistent.
  // With a `target`, pass the resolved element once attached; until then pass
  // the ref itself so an unattached target attaches nothing (and never falls
  // back to the window). No `target` → track the window.
  const { y } = useScrollPosition({
    element: target ? targetEl ?? target : undefined,
    throttleMs,
  });

  // Re-render on viewport resize — resizing changes clientHeight (and usually
  // scrollHeight), which changes the progress without any scroll event.
  const { width: viewportWidth, height: viewportHeight } = useWindowSize();

  const [progress, setProgress] = useState(0);

  // Recompute pre-paint whenever the scroll offset or viewport changes.
  // `setState` bails out when the value is unchanged, so no-op scrolls
  // (e.g. horizontal-only) don't re-render. Runs only on the client — the
  // server renders progress 0 with no window access.
  useIsomorphicLayoutEffect(() => {
    setProgress(computeProgress(target));
    // `targetEl` re-runs the measurement the moment a late-attached container
    // resolves (its initial scroll state may not produce a `y` change).
  }, [y, viewportWidth, viewportHeight, target, targetEl]);

  if (render) {
    return <>{render(progress)}</>;
  }

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-label={ariaLabel}
      data-position={position}
      className={className}
      style={{
        ...BASE_STYLE,
        ...(position === "bottom" ? { bottom: 0 } : { top: 0 }),
        height,
        zIndex,
        backgroundColor: color,
        transform: `scaleX(${progress})`,
        ...style,
      }}
    />
  );
}
