import { useCallback, useEffect, useRef, useState } from "react";
import type {
  OnWindowSizeChange,
  UseWindowSizeOptions,
  UseWindowSizeReturn,
  WindowSize,
} from "./types";
import { areSizesEqual, getWindowSize, isWindowAvailable } from "./utils";

/**
 * A React hook for tracking the browser window size.
 *
 * Features:
 * - Real-time `width`/`height` updates on resize
 * - Optional debounce or throttle to limit update frequency
 * - SSR-safe with configurable initial size (no hydration mismatch)
 * - Skips re-renders when the size hasn't actually changed
 * - Optional `onChange` callback and dynamic enable/disable
 * - Choose whether the scrollbar is included in the measurement
 *
 * @param options - Configuration options for the hook
 * @returns The current window size as `{ width, height }`
 *
 * @example
 * ```tsx
 * // Basic usage
 * function Component() {
 *   const { width, height } = useWindowSize();
 *   return (
 *     <div>
 *       {width} × {height}
 *       {width < 768 ? <MobileView /> : <DesktopView />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Debounced updates (great for expensive layout work)
 * const { width } = useWindowSize({ debounceMs: 200 });
 * ```
 *
 * @example
 * ```tsx
 * // Throttled updates with a change callback
 * const size = useWindowSize({
 *   throttleMs: 100,
 *   onChange: ({ width }) => {
 *     if (width < 768) closeSidebar();
 *   },
 * });
 * ```
 *
 * @example
 * ```tsx
 * // SSR-safe with initial values to avoid hydration mismatches
 * const { width, height } = useWindowSize({
 *   initialWidth: 1024,
 *   initialHeight: 768,
 * });
 * ```
 */
export function useWindowSize(
  options: UseWindowSizeOptions = {}
): UseWindowSizeReturn {
  const {
    initialWidth = 0,
    initialHeight = 0,
    debounceMs = 0,
    throttleMs = 0,
    includeScrollbar = true,
    enabled = true,
    onChange,
  } = options;

  const isSupported = isWindowAvailable();

  // Read the real size synchronously on the client so the very first render
  // returns the correct value; fall back to the provided initial size in SSR.
  const [size, setSize] = useState<WindowSize>(() => {
    if (isSupported && enabled) {
      return getWindowSize(includeScrollbar);
    }
    return { width: initialWidth, height: initialHeight };
  });

  // Keep the latest callback in a ref so it never re-creates the effect.
  const onChangeRef = useRef<OnWindowSizeChange | undefined>(onChange);
  onChangeRef.current = onChange;

  // Mirror the latest size so updateSize can compare without being a dependency.
  const sizeRef = useRef<WindowSize>(size);
  sizeRef.current = size;

  const updateSize = useCallback(() => {
    const next = getWindowSize(includeScrollbar);
    // No-op skip: bail out when the size is unchanged to avoid re-renders.
    if (areSizesEqual(sizeRef.current, next)) {
      return;
    }
    sizeRef.current = next;
    setSize(next);
    onChangeRef.current?.(next);
  }, [includeScrollbar]);

  useEffect(() => {
    if (!isSupported || !enabled) {
      return;
    }

    // Sync immediately in case the window changed between render and effect.
    updateSize();

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastRun = 0;

    const clearPending = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const handleResize = () => {
      if (debounceMs > 0) {
        clearPending();
        timeoutId = setTimeout(() => {
          timeoutId = null;
          updateSize();
        }, debounceMs);
        return;
      }

      if (throttleMs > 0) {
        const now = Date.now();
        const remaining = throttleMs - (now - lastRun);
        if (remaining <= 0) {
          lastRun = now;
          updateSize();
        } else {
          clearPending();
          timeoutId = setTimeout(() => {
            timeoutId = null;
            lastRun = Date.now();
            updateSize();
          }, remaining);
        }
        return;
      }

      updateSize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearPending();
    };
  }, [isSupported, enabled, debounceMs, throttleMs, updateSize]);

  return size;
}
