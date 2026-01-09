import { useCallback, useEffect, useMemo, useRef } from "react";

/**
 * Options for useDebounceCallback hook
 */
export interface UseDebounceCallbackOptions {
  /**
   * Maximum time the debounced function can be delayed
   * @default undefined (no maximum)
   */
  maxWait?: number;
  /**
   * Whether to invoke on the leading edge
   * @default false
   */
  leading?: boolean;
  /**
   * Whether to invoke on the trailing edge
   * @default true
   */
  trailing?: boolean;
}

/**
 * Debounced function interface with control methods
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  /**
   * Call the debounced function
   */
  (...args: Parameters<T>): ReturnType<T> | undefined;
  /**
   * Cancel any pending invocation
   */
  cancel: () => void;
  /**
   * Immediately invoke any pending invocation
   */
  flush: () => ReturnType<T> | undefined;
  /**
   * Check if there is a pending invocation
   */
  pending: () => boolean;
}

/**
 * Creates a debounced version of the provided callback function.
 * The debounced function delays invoking the callback until after `delay` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @template T - The type of the callback function
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @param options - Additional options for controlling debounce behavior
 * @returns A debounced version of the callback with cancel, flush, and pending methods
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [results, setResults] = useState([]);
 *
 *   const debouncedSearch = useDebounceCallback(
 *     async (query: string) => {
 *       const data = await searchAPI(query);
 *       setResults(data);
 *     },
 *     500
 *   );
 *
 *   return (
 *     <input
 *       type="text"
 *       onChange={(e) => debouncedSearch(e.target.value)}
 *       placeholder="Search..."
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With leading edge invocation
 * const debouncedFn = useDebounceCallback(callback, 300, { leading: true });
 * ```
 *
 * @example
 * ```tsx
 * // With maximum wait time
 * const debouncedFn = useDebounceCallback(callback, 500, { maxWait: 2000 });
 *
 * // Cancel pending invocation
 * debouncedFn.cancel();
 *
 * // Immediately invoke pending invocation
 * debouncedFn.flush();
 *
 * // Check if there's a pending invocation
 * if (debouncedFn.pending()) {
 *   console.log('There is a pending call');
 * }
 * ```
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  options: UseDebounceCallbackOptions = {}
): DebouncedFunction<T> {
  // Parse options
  const wait = delay || 0;
  const leading = options.leading ?? false;
  const trailing = options.trailing !== undefined ? options.trailing : true;
  const maxing = "maxWait" in options;
  const maxWait = maxing ? Math.max(options.maxWait || 0, wait) : undefined;

  // Refs for mutable state
  const callbackRef = useRef<T>(callback);
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const lastCallTimeRef = useRef<number | undefined>(undefined);
  const lastInvokeTimeRef = useRef<number>(0);
  const lastArgsRef = useRef<Parameters<T> | undefined>(undefined);
  const resultRef = useRef<ReturnType<T> | undefined>(undefined);

  // Store options in refs
  const waitRef = useRef(wait);
  const leadingRef = useRef(leading);
  const trailingRef = useRef(trailing);
  const maxingRef = useRef(maxing);
  const maxWaitRef = useRef(maxWait);

  // Update callback ref on every render to always have the latest callback
  callbackRef.current = callback;

  // Update option refs when options change
  waitRef.current = wait;
  leadingRef.current = leading;
  trailingRef.current = trailing;
  maxingRef.current = maxing;
  maxWaitRef.current = maxWait;

  // Helper function to get current time
  const now = useCallback(() => Date.now(), []);

  // Helper function: shouldInvoke
  const shouldInvoke = useCallback((time: number): boolean => {
    const lastCallTime = lastCallTimeRef.current;
    if (lastCallTime === undefined) {
      return true; // First call
    }

    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

    return (
      timeSinceLastCall >= waitRef.current ||
      timeSinceLastCall < 0 || // System time went backwards
      (maxingRef.current &&
        timeSinceLastInvoke >= (maxWaitRef.current as number))
    );
  }, []);

  // Helper function: invokeFunc
  const invokeFunc = useCallback((time: number): ReturnType<T> | undefined => {
    const args = lastArgsRef.current;
    lastArgsRef.current = undefined;
    lastInvokeTimeRef.current = time;

    if (args !== undefined) {
      resultRef.current = callbackRef.current(...args);
    }
    return resultRef.current;
  }, []);

  // Helper function: remainingWait
  const remainingWait = useCallback((time: number): number => {
    const lastCallTime = lastCallTimeRef.current;
    if (lastCallTime === undefined) {
      return waitRef.current;
    }

    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTimeRef.current;
    const timeWaiting = waitRef.current - timeSinceLastCall;

    return maxingRef.current
      ? Math.min(
          timeWaiting,
          (maxWaitRef.current as number) - timeSinceLastInvoke
        )
      : timeWaiting;
  }, []);

  // Forward declare timerExpired for mutual recursion
  const timerExpiredRef = useRef<() => void>(() => {});

  // Helper function: trailingEdge
  const trailingEdge = useCallback(
    (time: number): ReturnType<T> | undefined => {
      timerIdRef.current = undefined;

      // Only invoke if trailing is true and we have args (meaning the function was called)
      if (trailingRef.current && lastArgsRef.current !== undefined) {
        return invokeFunc(time);
      }
      lastArgsRef.current = undefined;
      return resultRef.current;
    },
    [invokeFunc]
  );

  // Helper function: timerExpired
  const timerExpired = useCallback((): void => {
    const time = now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
    } else {
      // Restart the timer
      timerIdRef.current = setTimeout(
        timerExpiredRef.current,
        remainingWait(time)
      );
    }
  }, [now, shouldInvoke, trailingEdge, remainingWait]);

  // Update the ref after timerExpired is defined
  timerExpiredRef.current = timerExpired;

  // Helper function: leadingEdge
  const leadingEdge = useCallback(
    (time: number): ReturnType<T> | undefined => {
      // Reset any `maxWait` timer
      lastInvokeTimeRef.current = time;
      // Start the timer for the trailing edge
      timerIdRef.current = setTimeout(timerExpiredRef.current, waitRef.current);
      // Invoke the leading edge
      return leadingRef.current ? invokeFunc(time) : resultRef.current;
    },
    [invokeFunc]
  );

  // Cancel function
  const cancel = useCallback((): void => {
    if (timerIdRef.current !== undefined) {
      clearTimeout(timerIdRef.current);
    }
    lastInvokeTimeRef.current = 0;
    lastArgsRef.current = undefined;
    lastCallTimeRef.current = undefined;
    timerIdRef.current = undefined;
  }, []);

  // Flush function
  const flush = useCallback((): ReturnType<T> | undefined => {
    if (timerIdRef.current === undefined) {
      return resultRef.current;
    }
    return trailingEdge(now());
  }, [now, trailingEdge]);

  // Pending function
  const pending = useCallback((): boolean => {
    return timerIdRef.current !== undefined;
  }, []);

  // Main debounced function
  const debounced = useCallback(
    (...args: Parameters<T>): ReturnType<T> | undefined => {
      const time = now();
      const isInvoking = shouldInvoke(time);

      lastArgsRef.current = args;
      lastCallTimeRef.current = time;

      if (isInvoking) {
        if (timerIdRef.current === undefined) {
          return leadingEdge(time);
        }
        if (maxingRef.current) {
          // Handle invocations in a tight loop
          clearTimeout(timerIdRef.current);
          timerIdRef.current = setTimeout(
            timerExpiredRef.current,
            waitRef.current
          );
          // Only invoke if at least one edge is enabled (matches lodash behavior)
          if (leadingRef.current || trailingRef.current) {
            return invokeFunc(time);
          }
        }
      }
      if (timerIdRef.current === undefined) {
        timerIdRef.current = setTimeout(
          timerExpiredRef.current,
          waitRef.current
        );
      }
      return resultRef.current;
    },
    [now, shouldInvoke, leadingEdge, invokeFunc]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIdRef.current !== undefined) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, []);

  // Create the debounced function with attached methods
  const debouncedWithMethods = useMemo(() => {
    const fn = debounced as DebouncedFunction<T>;
    fn.cancel = cancel;
    fn.flush = flush;
    fn.pending = pending;
    return fn;
  }, [debounced, cancel, flush, pending]);

  return debouncedWithMethods;
}
