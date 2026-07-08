import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import type {
  UseResizeObserverOptions,
  UseResizeObserverReturn,
  ResizeEntry,
  OnResizeCallback,
  OnErrorCallback,
  ResizeObserverBoxOptions,
} from "./types";
import {
  isResizeObserverSupported,
  toResizeEntry,
  extractSize,
  createInitialResizeEntry,
  validateOptions,
  hasSizeChanged,
} from "./utils";

/**
 * Shared no-op with a stable identity, returned from the unsupported/SSR branch
 * so that path never allocates fresh function references on re-render.
 */
const NOOP = (): void => {};

/**
 * React hook for observing element size changes using ResizeObserver API.
 *
 * Features:
 * - Real-time element size tracking (width, height)
 * - Support for border-box, content-box, device-pixel-content-box
 * - Debounce/Throttle options for performance optimization
 * - Custom rounding function for dimension values
 * - Callback and state-based modes
 * - SSR compatible with graceful degradation
 * - TypeScript support with full type inference
 *
 * @param options - Configuration options for the observer
 * @returns Object containing dimensions, ref callback, and control methods
 *
 * @example
 * ```tsx
 * // Basic usage - track element dimensions
 * function Component() {
 *   const { ref, width, height } = useResizeObserver();
 *   return (
 *     <div ref={ref}>
 *       Size: {width}px x {height}px
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With debounce for performance
 * function DebouncedComponent() {
 *   const { ref, width, height } = useResizeObserver({
 *     debounce: 100,
 *     onResize: (entry) => console.log('Resized:', entry),
 *   });
 *   return <div ref={ref}>{width} x {height}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Border-box sizing
 * function BorderBoxComponent() {
 *   const { ref, borderBoxSize } = useResizeObserver({
 *     box: 'border-box',
 *   });
 *   return (
 *     <div ref={ref} style={{ padding: 20 }}>
 *       Border: {borderBoxSize?.inlineSize} x {borderBoxSize?.blockSize}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Callback-only mode (no state updates)
 * function CallbackOnlyComponent() {
 *   const { ref } = useResizeObserver({
 *     updateState: false,
 *     onResize: (entry) => {
 *       // Direct DOM manipulation for animations
 *       entry.target.style.setProperty('--width', `${entry.contentRect.width}px`);
 *     },
 *   });
 *   return <div ref={ref}>Animation container</div>;
 * }
 * ```
 */
export function useResizeObserver<T extends Element = Element>(
  options: UseResizeObserverOptions<T> = {}
): UseResizeObserverReturn<T> {
  const {
    box = "content-box",
    debounce,
    throttle,
    round = Math.round,
    onResize,
    onError,
    updateState = true,
    enabled = true,
    initialWidth,
    initialHeight,
  } = options;

  // ============ Validation ============
  validateOptions(debounce, throttle);

  // ============ SSR Check ============
  const isSupported = isResizeObserverSupported();

  // ============ Refs ============
  const observerRef = useRef<ResizeObserver | null>(null);
  const targetRef = useRef<T | null>(null);
  const onResizeRef = useRef<OnResizeCallback | undefined>(onResize);
  const onErrorRef = useRef<OnErrorCallback | undefined>(onError);
  const debounceRef = useRef<number | undefined>(debounce);
  const throttleRef = useRef<number | undefined>(throttle);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastThrottleTimeRef = useRef<number>(0);
  const isObservingRef = useRef<boolean>(false);
  const prevSizeRef = useRef<{ width: number; height: number } | null>(null);
  // Latest entries seen by processResize; the trailing throttle timeout reads
  // from here so it always delivers the most recent dimensions of a burst
  // rather than the (stale) entries captured when the timeout was scheduled.
  const latestEntriesRef = useRef<ResizeObserverEntry[]>([]);

  // Update refs on each render to get latest values
  onResizeRef.current = onResize;
  onErrorRef.current = onError;
  debounceRef.current = debounce;
  throttleRef.current = throttle;

  // ============ State ============
  const [state, setState] = useState<{
    width: number | undefined;
    height: number | undefined;
    entry: ResizeEntry | undefined;
  }>(() => ({
    width: initialWidth,
    height: initialHeight,
    entry: createInitialResizeEntry(initialWidth, initialHeight),
  }));

  const [isObserving, setIsObserving] = useState<boolean>(false);

  // ============ Handle Resize (Core Logic) ============
  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      // Process all entries (for multiple element observation)
      for (const entry of entries) {
        try {
          const resizeEntry = toResizeEntry(entry);

          // Call onResize callback for each entry
          if (onResizeRef.current) {
            onResizeRef.current(resizeEntry);
          }
        } catch (error) {
          if (onErrorRef.current) {
            onErrorRef.current(error as Error);
          }
        }
      }

      // Update state with the last entry (for single element mode via ref)
      const lastEntry = entries[entries.length - 1];
      if (!lastEntry) return;

      try {
        const resizeEntry = toResizeEntry(lastEntry);
        const { width, height } = extractSize(lastEntry, box, round);

        // Update state if enabled and size changed
        if (updateState) {
          const prevSize = prevSizeRef.current;
          if (
            !prevSize ||
            hasSizeChanged(prevSize.width, prevSize.height, width, height)
          ) {
            prevSizeRef.current = { width, height };
            setState({ width, height, entry: resizeEntry });
          }
        }
      } catch (error) {
        if (onErrorRef.current) {
          onErrorRef.current(error as Error);
        }
      }
    },
    [box, round, updateState]
  );

  // ============ Process Resize (with Debounce/Throttle) ============
  const processResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      // Always record the most recent entries so a pending trailing throttle
      // call delivers the latest dimensions instead of a stale snapshot.
      latestEntriesRef.current = entries;

      // Clear existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      // Use refs to get latest debounce/throttle values
      const debounceDelay = debounceRef.current ?? 0;
      const throttleInterval = throttleRef.current ?? 0;

      if (debounceDelay > 0) {
        // Debounce mode
        debounceTimeoutRef.current = setTimeout(() => {
          handleResize(entries);
          debounceTimeoutRef.current = null;
        }, debounceDelay);
      } else if (throttleInterval > 0) {
        // Throttle mode
        const now = Date.now();
        const timeSinceLastCall = now - lastThrottleTimeRef.current;

        if (timeSinceLastCall >= throttleInterval) {
          lastThrottleTimeRef.current = now;
          handleResize(entries);
        } else if (!throttleTimeoutRef.current) {
          // Schedule trailing call — read the latest entries at fire time so the
          // final dimensions of the burst are delivered, not the ones captured
          // when this timeout was first scheduled.
          throttleTimeoutRef.current = setTimeout(() => {
            lastThrottleTimeRef.current = Date.now();
            handleResize(latestEntriesRef.current);
            throttleTimeoutRef.current = null;
          }, throttleInterval - timeSinceLastCall);
        }
      } else {
        // No debounce/throttle - immediate execution
        handleResize(entries);
      }
    },
    [handleResize]  // Remove debounce/throttle from deps - use refs instead
  );

  // ============ Observer Callback ============
  const observerCallbackRef = useRef<(entries: ResizeObserverEntry[]) => void>(
    (entries) => processResize(entries)
  );
  observerCallbackRef.current = (entries) => processResize(entries);

  // ============ Ref Callback ============
  const setRef = useCallback(
    (node: T | null) => {
      const prevTarget = targetRef.current;

      // Skip if same element (prevent redundant observe calls)
      if (node === prevTarget) {
        return;
      }

      // Unobserve previous target
      if (prevTarget && observerRef.current) {
        observerRef.current.unobserve(prevTarget);
      }

      targetRef.current = node;

      // Observe new target
      if (node && observerRef.current && enabled) {
        observerRef.current.observe(node, { box });
        isObservingRef.current = true;
        setIsObserving(true);
      } else {
        isObservingRef.current = false;
        setIsObserving(false);
      }
    },
    [box, enabled]
  );

  // ============ Manual Control Methods ============
  const observe = useCallback(
    (element: T) => {
      if (!isSupported) return;

      // Create observer if it doesn't exist yet
      if (!observerRef.current) {
        observerRef.current = new ResizeObserver((entries) => {
          observerCallbackRef.current(entries);
        });
      }

      observerRef.current.observe(element, { box });
      isObservingRef.current = true;
      setIsObserving(true);
    },
    [isSupported, box]
  );

  const unobserve = useCallback((element: T) => {
    if (!observerRef.current) return;
    observerRef.current.unobserve(element);
    // Check if still observing other elements
    // For simplicity, we set to false (single element mode)
    isObservingRef.current = false;
    setIsObserving(false);
  }, []);

  const disconnect = useCallback(() => {
    if (!observerRef.current) return;
    observerRef.current.disconnect();
    observerRef.current = null;
    isObservingRef.current = false;
    setIsObserving(false);
  }, []);

  // ============ Effect: Create Observer on Mount ============
  useEffect(() => {
    if (!isSupported) return;

    // Create observer with ref-based callback (only once on mount)
    observerRef.current = new ResizeObserver((entries) => {
      observerCallbackRef.current(entries);
    });

    // Observe current target if exists and enabled
    if (targetRef.current && enabled) {
      observerRef.current.observe(targetRef.current, { box });
      isObservingRef.current = true;
      setIsObserving(true);
    }

    return () => {
      // Cleanup timeouts
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
      // Disconnect observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      isObservingRef.current = false;
    };
    // Note: Only depend on isSupported to create observer once on mount
    // enabled and box changes are handled separately to avoid re-creating observer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  // ============ Effect: Handle enabled toggle ============
  useEffect(() => {
    if (!isSupported || !observerRef.current || !targetRef.current) return;

    if (enabled && !isObservingRef.current) {
      // Only observe if not already observing
      observerRef.current.observe(targetRef.current, { box });
      isObservingRef.current = true;
      setIsObserving(true);
    } else if (!enabled && isObservingRef.current) {
      // Only unobserve if currently observing
      observerRef.current.unobserve(targetRef.current);
      isObservingRef.current = false;
      setIsObserving(false);
    }
  }, [enabled, isSupported, box]);

  // ============ Computed Values ============
  const computedValues = useMemo(
    () => ({
      contentRect: state.entry?.contentRect,
      borderBoxSize: state.entry?.borderBoxSize?.[0],
      contentBoxSize: state.entry?.contentBoxSize?.[0],
      devicePixelContentBoxSize: state.entry?.devicePixelContentBoxSize?.[0],
    }),
    [state.entry]
  );

  // ============ SSR Return ============
  if (!isSupported) {
    return {
      ref: NOOP,
      width: initialWidth,
      height: initialHeight,
      entry: createInitialResizeEntry(initialWidth, initialHeight),
      contentRect: undefined,
      borderBoxSize: undefined,
      contentBoxSize: undefined,
      devicePixelContentBoxSize: undefined,
      isSupported: false,
      isObserving: false,
      observe: NOOP,
      unobserve: NOOP,
      disconnect: NOOP,
    };
  }

  // ============ Client Return ============
  return {
    ref: setRef,
    width: state.width,
    height: state.height,
    entry: state.entry,
    ...computedValues,
    isSupported,
    isObserving,
    observe,
    unobserve,
    disconnect,
  };
}
