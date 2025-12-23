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
 * since the last time the value changed.
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
  const { maxWait, leading = false, trailing = true } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const maxWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const firstCallTimeRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const timeSinceFirstCall = now - firstCallTimeRef.current;

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
    }

    const invokeFunction = () => {
      setDebouncedValue(value);
      lastInvokeTimeRef.current = Date.now();
      firstCallTimeRef.current = 0; // Reset first call time after invoke
    };

    // Handle leading edge: invoke immediately if enough time has passed since last call
    const shouldInvokeLeading = leading && timeSinceLastCall >= delay;

    if (shouldInvokeLeading) {
      invokeFunction();
    }

    // Track first call time for maxWait
    if (firstCallTimeRef.current === 0) {
      firstCallTimeRef.current = now;
    }

    // Update last call time
    lastCallTimeRef.current = now;

    // Set up trailing timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        invokeFunction();
      }, delay);
    }

    // Set up maxWait timeout
    if (maxWait !== undefined && maxWait > 0) {
      const timeUntilMaxWait = maxWait - timeSinceFirstCall;

      if (timeUntilMaxWait > 0) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          invokeFunction();
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        }, timeUntilMaxWait);
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
      }
    };
  }, [value, delay, maxWait, leading, trailing]);

  return debouncedValue;
}
