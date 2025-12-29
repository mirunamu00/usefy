import { useEffect, useRef, useState } from "react";

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

  // Store options in refs to access latest values in timer callbacks
  const waitRef = useRef(wait);
  const leadingRef = useRef(leading);
  const trailingRef = useRef(trailing);
  const maxingRef = useRef(maxing);
  const maxWaitRef = useRef(maxWait);

  // Update refs when options change
  waitRef.current = wait;
  leadingRef.current = leading;
  trailingRef.current = trailing;
  maxingRef.current = maxing;
  maxWaitRef.current = maxWait;

  // Helper function to get current time
  const now = () => Date.now();

  // Define helper functions using refs for latest values
  const shouldInvokeRef = useRef<(time: number) => boolean>(() => false);
  const invokeRef = useRef<(time: number) => void>(() => {});
  const remainingWaitRef = useRef<(time: number) => number>(() => 0);
  const timerExpiredRef = useRef<() => void>(() => {});
  const trailingEdgeRef = useRef<(time: number) => void>(() => {});
  const leadingEdgeRef = useRef<(time: number) => void>(() => {});

  // Helper function: shouldInvoke
  shouldInvokeRef.current = (time: number): boolean => {
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
  };

  // Helper function: invokeFunc
  invokeRef.current = (time: number): void => {
    setDebouncedValue(lastValueRef.current);
    lastInvokeTimeRef.current = time;
  };

  // Helper function: remainingWait
  remainingWaitRef.current = (time: number): number => {
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
  };

  // Helper function: trailingEdge
  trailingEdgeRef.current = (time: number): void => {
    timerIdRef.current = undefined;

    // Only invoke if we have `lastValueRef.current` which means `value` has been
    // debounced at least once.
    if (trailingRef.current && lastCallTimeRef.current !== undefined) {
      invokeRef.current(time);
    }
  };

  // Helper function: timerExpired
  timerExpiredRef.current = (): void => {
    const time = now();
    if (shouldInvokeRef.current(time)) {
      trailingEdgeRef.current(time);
    } else {
      // Restart the timer.
      timerIdRef.current = setTimeout(
        () => timerExpiredRef.current(),
        remainingWaitRef.current(time)
      );
    }
  };

  // Helper function: leadingEdge
  leadingEdgeRef.current = (time: number): void => {
    // Reset any `maxWait` timer.
    lastInvokeTimeRef.current = time;
    // Start the timer for the trailing edge.
    timerIdRef.current = setTimeout(
      () => timerExpiredRef.current(),
      waitRef.current
    );
    // Invoke the leading edge.
    if (leadingRef.current) {
      invokeRef.current(time);
    }
  };

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
    // Skip if value hasn't actually changed (prevents initial render from consuming leading edge)
    if (Object.is(prevValueRef.current, value)) {
      return;
    }
    prevValueRef.current = value;

    const time = now();
    const isInvoking = shouldInvokeRef.current(time);

    // Update lastValueRef with current value
    lastValueRef.current = value;
    lastCallTimeRef.current = time;

    if (isInvoking) {
      if (timerIdRef.current === undefined) {
        leadingEdgeRef.current(time);
      } else if (maxingRef.current) {
        // Handle invocations in a tight loop.
        clearTimeout(timerIdRef.current);
        timerIdRef.current = setTimeout(
          () => timerExpiredRef.current(),
          waitRef.current
        );
        invokeRef.current(time);
      }
    } else {
      if (timerIdRef.current === undefined) {
        // Start timer with wait
        // remainingWait is only used inside timerExpired for restarting
        timerIdRef.current = setTimeout(
          () => timerExpiredRef.current(),
          waitRef.current
        );
      }
    }
    // No cleanup here - timer should persist across value changes
    // This is the key difference from the previous implementation
  }, [value]);

  return debouncedValue;
}
