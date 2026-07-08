import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Options for useDebounce hook
 */
export interface UseDebounceOptions {
  /**
   * Maximum time the debounced value can be delayed
   * @default undefined (no maximum)
   */
  maxWait?: number;
  /**
   * Whether to update the debounced value on the leading edge
   * @default false
   */
  leading?: boolean;
  /**
   * Whether to update the debounced value on the trailing edge
   * @default true
   */
  trailing?: boolean;
}

/**
 * Debounces a value by delaying updates until after a specified delay period has elapsed
 * since the last time the value changed. Useful for search inputs and API calls.
 *
 * @template T - The type of the value to debounce
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @param options - Additional options for controlling debounce behavior
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 *   useEffect(() => {
 *     if (debouncedSearchTerm) {
 *       // API call with debounced value
 *       searchAPI(debouncedSearchTerm);
 *     }
 *   }, [debouncedSearchTerm]);
 *
 *   return (
 *     <input
 *       type="text"
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *       placeholder="Search..."
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With leading edge update
 * const debouncedValue = useDebounce(value, 300, { leading: true });
 * ```
 *
 * @example
 * ```tsx
 * // With maximum wait time
 * const debouncedValue = useDebounce(value, 500, { maxWait: 2000 });
 * ```
 */
export function useDebounce<T>(
  value: T,
  delay: number = 500,
  options: UseDebounceOptions = {}
): T {
  // Parse options
  const wait = delay || 0;
  const leading = options.leading ?? false;
  const trailing = options.trailing !== undefined ? options.trailing : true;
  const maxing = "maxWait" in options;
  const maxWait = maxing ? Math.max(options.maxWait || 0, wait) : undefined;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const lastCallTimeRef = useRef<number | undefined>(undefined);
  const lastInvokeTimeRef = useRef<number>(0);
  const lastValueRef = useRef<T>(value);
  const prevValueRef = useRef<T>(value); // Track previous value to detect actual changes

  // Store options in refs so the timer callbacks always read the latest values.
  // Initialised from the first render's options; kept in sync via the effect
  // below (never mutated during render, to preserve render purity).
  const waitRef = useRef(wait);
  const leadingRef = useRef(leading);
  const trailingRef = useRef(trailing);
  const maxingRef = useRef(maxing);
  const maxWaitRef = useRef(maxWait);

  // Self-reference indirection for the recursively-restarting trailing timer.
  const timerExpiredRef = useRef<() => void>(() => {});

  // Helper: shouldInvoke — reads all mutable state through refs, so it can be a
  // stable closure created once (no per-render reassignment).
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

  // Helper: invokeFunc
  const invoke = useCallback((time: number): void => {
    setDebouncedValue(lastValueRef.current);
    lastInvokeTimeRef.current = time;
  }, []);

  // Helper: remainingWait
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

  // Helper: trailingEdge
  const trailingEdge = useCallback(
    (time: number): void => {
      timerIdRef.current = undefined;

      // Only invoke if we have `lastCallTimeRef.current`, which means `value`
      // has been debounced at least once.
      if (trailingRef.current && lastCallTimeRef.current !== undefined) {
        invoke(time);
      }
    },
    [invoke]
  );

  // Helper: timerExpired — self-restarts through timerExpiredRef.
  const timerExpired = useCallback((): void => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
    } else {
      // Restart the timer.
      timerIdRef.current = setTimeout(
        () => timerExpiredRef.current(),
        remainingWait(time)
      );
    }
  }, [shouldInvoke, trailingEdge, remainingWait]);

  // Helper: leadingEdge
  const leadingEdge = useCallback(
    (time: number): void => {
      // Reset any `maxWait` timer.
      lastInvokeTimeRef.current = time;
      // Start the timer for the trailing edge.
      timerIdRef.current = setTimeout(() => timerExpiredRef.current(), waitRef.current);
      // Invoke the leading edge.
      if (leadingRef.current) {
        invoke(time);
      }
    },
    [invoke]
  );

  // Sync option refs and the self-reference after commit — never during render.
  // Declared before the main effect so the option refs are current by the time
  // the value effect reads them within the same commit.
  useEffect(() => {
    waitRef.current = wait;
    leadingRef.current = leading;
    trailingRef.current = trailing;
    maxingRef.current = maxing;
    maxWaitRef.current = maxWait;
    timerExpiredRef.current = timerExpired;
  });

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (timerIdRef.current !== undefined) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, []);

  // Main debounce effect - runs when value changes
  useEffect(() => {
    // Skip if value hasn't actually changed (prevents initial render — and
    // StrictMode's double-invoked mount effect — from consuming the leading edge)
    if (Object.is(prevValueRef.current, value)) {
      return;
    }
    prevValueRef.current = value;

    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    // Update lastValueRef with current value
    lastValueRef.current = value;
    lastCallTimeRef.current = time;

    if (isInvoking) {
      if (timerIdRef.current === undefined) {
        leadingEdge(time);
      } else if (maxingRef.current) {
        // Handle invocations in a tight loop.
        clearTimeout(timerIdRef.current);
        timerIdRef.current = setTimeout(() => timerExpiredRef.current(), waitRef.current);
        // Only invoke if at least one edge is enabled (matches lodash behavior)
        if (leadingRef.current || trailingRef.current) {
          invoke(time);
        }
      }
    } else {
      if (timerIdRef.current === undefined) {
        // Start timer with wait
        // remainingWait is only used inside timerExpired for restarting
        timerIdRef.current = setTimeout(() => timerExpiredRef.current(), waitRef.current);
      }
    }
    // No cleanup here - timer should persist across value changes
    // This is the key difference from the previous implementation
  }, [value, shouldInvoke, leadingEdge, invoke]);

  return debouncedValue;
}
