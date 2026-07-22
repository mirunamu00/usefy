import { useState } from "react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";

/** A viewport size in CSS px. */
export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * Track the window's inner size while `active` — used to feed the live
 * viewport box into `computeTooltipPosition`. Commits state only when the
 * size actually changes; returns `null` while inactive or on the server.
 *
 * `resize` is the only listener (scroll never changes the viewport size), so
 * no rAF batching is needed — resize events are low-frequency and the commit
 * is change-gated anyway.
 *
 * @param active - Track while true (typically "the tour is open").
 * @returns The current viewport size, or `null` when inactive/SSR.
 *
 * @internal
 */
export function useViewportSize(active: boolean): ViewportSize | null {
  const [size, setSize] = useState<ViewportSize | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!active || typeof window === "undefined") {
      setSize(null);
      return;
    }
    const update = () => {
      const next = { width: window.innerWidth, height: window.innerHeight };
      setSize((prev) =>
        prev && prev.width === next.width && prev.height === next.height
          ? prev
          : next
      );
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, [active]);

  return size;
}
