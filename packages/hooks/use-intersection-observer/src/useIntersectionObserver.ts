import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  UseIntersectionObserverOptions,
  UseIntersectionObserverReturn,
  IntersectionEntry,
  OnChangeCallback,
} from "./types";
import {
  isIntersectionObserverSupported,
  toIntersectionEntry,
  createInitialEntry,
  createNoopRef,
  normalizeThreshold,
} from "./utils";

/**
 * useLayoutEffect logs a warning when invoked during server rendering.
 * Fall back to useEffect on the server so the latest-callback ref can still
 * be kept up to date without noise in SSR environments.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * A React hook for observing element visibility using the Intersection Observer API.
 *
 * Features:
 * - Efficient viewport/container visibility detection
 * - Threshold-based intersection callbacks
 * - TriggerOnce support for lazy loading patterns
 * - Dynamic enable/disable support
 * - SSR compatible with graceful degradation
 * - TypeScript support with full type inference
 *
 * @param options - Configuration options for the observer
 * @returns Object containing entry data, inView boolean, and ref callback
 *
 * @example
 * ```tsx
 * // Basic usage - check if element is visible
 * function Component() {
 *   const { ref, inView } = useIntersectionObserver();
 *   return (
 *     <div ref={ref}>
 *       {inView ? 'Visible!' : 'Not visible'}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Lazy load image when it enters viewport
 * function LazyImage({ src, alt }: { src: string; alt: string }) {
 *   const { ref, inView } = useIntersectionObserver({
 *     triggerOnce: true,
 *     threshold: 0.1,
 *   });
 *
 *   return (
 *     <div ref={ref}>
 *       {inView ? (
 *         <img src={src} alt={alt} />
 *       ) : (
 *         <div className="placeholder" />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Infinite scroll with sentinel element
 * function InfiniteList() {
 *   const { ref, inView } = useIntersectionObserver({
 *     threshold: 1.0,
 *     rootMargin: '100px',
 *   });
 *
 *   useEffect(() => {
 *     if (inView) {
 *       loadMoreItems();
 *     }
 *   }, [inView]);
 *
 *   return (
 *     <div>
 *       {items.map(item => <Item key={item.id} {...item} />)}
 *       <div ref={ref} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Track scroll progress with multiple thresholds
 * function ProgressTracker() {
 *   const { ref, entry } = useIntersectionObserver({
 *     threshold: [0, 0.25, 0.5, 0.75, 1.0],
 *     onChange: (entry, inView) => {
 *       console.log('Progress:', Math.round(entry.intersectionRatio * 100), '%');
 *     },
 *   });
 *
 *   return <div ref={ref}>Long content...</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Custom scroll container as root
 * function ScrollContainer() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { ref, inView } = useIntersectionObserver({
 *     root: containerRef.current,
 *     rootMargin: '0px',
 *   });
 *
 *   return (
 *     <div ref={containerRef} style={{ overflow: 'auto', height: 400 }}>
 *       <div style={{ height: 1000 }}>
 *         <div ref={ref}>{inView ? 'In container view' : 'Outside'}</div>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    root = null,
    rootMargin = "0px",
    triggerOnce = false,
    enabled = true,
    initialIsIntersecting = false,
    onChange,
    delay = 0,
  } = options;

  // ============ SSR Check ============
  const isSupported = isIntersectionObserverSupported();

  // ============ Refs for internal state (no re-renders) ============
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store previous entry values for comparison (to avoid unnecessary re-renders)
  const prevEntryRef = useRef<{
    isIntersecting: boolean;
    intersectionRatio: number;
  } | null>(null);

  // Store the latest onChange callback in a ref so identity changes don't
  // recreate the observer. Assigned post-commit (never during render) to stay
  // concurrent/StrictMode safe.
  const onChangeRef = useRef<OnChangeCallback | undefined>(onChange);
  useIsomorphicLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  // Track the observed node as state so the observer effect re-runs when the
  // ref callback receives a new element — no manual forceUpdate required.
  const [node, setNode] = useState<Element | null>(null);

  // ============ State (triggers re-renders) ============
  const [entry, setEntry] = useState<IntersectionEntry | null>(() =>
    initialIsIntersecting ? createInitialEntry(true, null) : null
  );

  // Compute inView from entry state, coercing at the boundary to a strict boolean.
  const inView = entry ? entry.isIntersecting === true : initialIsIntersecting;

  // Stabilize the threshold so an inline array (e.g. threshold={[0, 0.5, 1]})
  // does not tear down and recreate the native observer on every render.
  const thresholdKey = useMemo(
    () => JSON.stringify(normalizeThreshold(threshold)),
    [threshold]
  );

  // ============ Observer Callback ============
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((nativeEntry) => {
        const intersectionEntry = toIntersectionEntry(nativeEntry);

        // Check if meaningful values have changed (ignore time which always changes)
        const prevEntry = prevEntryRef.current;
        const hasChanged =
          !prevEntry ||
          prevEntry.isIntersecting !== nativeEntry.isIntersecting ||
          prevEntry.intersectionRatio !== nativeEntry.intersectionRatio;

        // Update previous entry ref
        prevEntryRef.current = {
          isIntersecting: nativeEntry.isIntersecting,
          intersectionRatio: nativeEntry.intersectionRatio,
        };

        // Only update state if meaningful values changed
        if (hasChanged) {
          setEntry(intersectionEntry);
        }

        // Call onChange callback if provided (always call, even if state didn't change)
        if (onChangeRef.current) {
          onChangeRef.current(intersectionEntry, nativeEntry.isIntersecting);
        }

        // Handle triggerOnce - unobserve after first intersection
        if (triggerOnce && nativeEntry.isIntersecting === true) {
          hasTriggeredRef.current = true;

          // Unobserve the target
          if (observerRef.current && nativeEntry.target) {
            observerRef.current.unobserve(nativeEntry.target);
          }
        }
      });
    },
    [triggerOnce]
  );

  // ============ Ref Callback ============
  const ref = useCallback((element: Element | null) => {
    setNode(element);
  }, []);

  // ============ Effect: Manage Observer Lifecycle ============
  useEffect(() => {
    // SSR guard
    if (!isSupported) {
      return;
    }

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Don't create observer if disabled
    if (!enabled) {
      return;
    }

    // Don't create if triggerOnce already triggered
    if (triggerOnce && hasTriggeredRef.current) {
      return;
    }

    // Don't create if no target
    if (!node) {
      return;
    }

    const thresholds = JSON.parse(thresholdKey) as number[];

    // Create and observe function
    const createAndObserve = () => {
      observerRef.current = new IntersectionObserver(handleIntersection, {
        threshold: thresholds,
        root,
        rootMargin,
      });

      observerRef.current.observe(node);
    };

    // Handle delay
    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        createAndObserve();
        delayTimeoutRef.current = null;
      }, delay);

      return () => {
        if (delayTimeoutRef.current) {
          clearTimeout(delayTimeoutRef.current);
          delayTimeoutRef.current = null;
        }
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      };
    }

    // Create observer immediately
    createAndObserve();

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [
    enabled,
    triggerOnce,
    delay,
    thresholdKey,
    root,
    rootMargin,
    handleIntersection,
    isSupported,
    node,
  ]);

  // ============ Effect: Reset hasTriggered when triggerOnce is disabled ============
  useEffect(() => {
    if (!triggerOnce) {
      hasTriggeredRef.current = false;
    }
  }, [triggerOnce]);

  // ============ SSR Return ============
  if (!isSupported) {
    return {
      entry: initialIsIntersecting ? createInitialEntry(true, null) : null,
      inView: initialIsIntersecting,
      ref: createNoopRef(),
    };
  }

  return {
    entry,
    inView,
    ref,
  };
}
