import { useCallback, useRef, useState } from "react";
import { useResizeObserver } from "@usefy/use-resize-observer";
import type { Bounds, UseMeasureRef, UseMeasureReturn } from "./types";
import { EMPTY_BOUNDS, areBoundsEqual, rectToBounds } from "./utils";

/**
 * Reactively measure an element's bounds — its size **and** viewport-relative
 * position — and get fresh values whenever the element resizes.
 *
 * `useMeasure` is the ergonomic, "just give me the bounds" convenience layer
 * built on top of {@link useResizeObserver}. Where `useResizeObserver` is the
 * low-level primitive (raw entries, box models, debounce/throttle, callbacks),
 * `useMeasure` reuses it internally purely to know *when* to re-measure, then
 * reads `getBoundingClientRect()` to return the full
 * `{ x, y, width, height, top, right, bottom, left }` bounds object. Reach for
 * `useResizeObserver` when you need the observer's knobs; reach for `useMeasure`
 * when you just want the current rect.
 *
 * Behaviour notes:
 * - **SSR-safe**: returns {@link EMPTY_BOUNDS} on the server and never touches
 *   the DOM until an element is attached on the client.
 * - **StrictMode / concurrent-safe**: the state update is an idempotent,
 *   equality-guarded `setState`; no user callback is fired from inside it.
 * - Bounds come from `getBoundingClientRect()`, so they update on resize (via
 *   `ResizeObserver`) but not on scroll — scroll does not change an element's
 *   size. Re-measure manually (e.g. re-attach the ref) if you need scroll
 *   tracking.
 *
 * @typeParam T - The element type being measured (defaults to `Element`).
 * @returns A `[ref, bounds]` tuple — attach `ref` to the target element and
 *   read the latest {@link Bounds} from `bounds`.
 *
 * @example
 * ```tsx
 * import { useMeasure } from "@usefy/use-measure";
 *
 * function Card() {
 *   const [ref, bounds] = useMeasure<HTMLDivElement>();
 *
 *   return (
 *     <div ref={ref} style={{ resize: "both", overflow: "auto" }}>
 *       {Math.round(bounds.width)} × {Math.round(bounds.height)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMeasure<T extends Element = Element>(): UseMeasureReturn<T> {
  const [bounds, setBounds] = useState<Bounds>(EMPTY_BOUNDS);
  const elementRef = useRef<T | null>(null);

  // Read the element's current rect and commit it, skipping the update when the
  // bounds are unchanged so React can bail out of the re-render.
  const measure = useCallback((element: T | null) => {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return;
    }
    const next = rectToBounds(element.getBoundingClientRect());
    setBounds((prev) => (areBoundsEqual(prev, next) ? prev : next));
  }, []);

  // Reuse useResizeObserver as the low-level observer. We only use it as a
  // "when to re-measure" trigger; the callback is stored in a ref inside the
  // hook, so re-creating this arrow each render never re-registers the observer.
  // `updateState: false` skips the inner hook's own size state machine (its
  // setState + computedValues memo) that useMeasure would otherwise discard —
  // onResize still fires regardless, so the trigger is unaffected.
  const { ref: observeRef } = useResizeObserver<T>({
    updateState: false,
    onResize: () => measure(elementRef.current),
  });

  const ref = useCallback<UseMeasureRef<T>>(
    (element) => {
      elementRef.current = element;
      // Forward to the observer so it (un)observes the node.
      observeRef(element);
      // Measure synchronously on attach so bounds are available before the
      // observer's first (asynchronous) callback fires.
      if (element) {
        measure(element);
      }
    },
    [observeRef, measure]
  );

  return [ref, bounds];
}
