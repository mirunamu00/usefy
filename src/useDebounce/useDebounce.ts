import { useEffect, useState } from "react";

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
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    // Handle leading edge on first change
    if (leading && isFirstRender) {
      setDebouncedValue(value);
      setIsFirstRender(false);
      return;
    }

    setIsFirstRender(false);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let maxWaitTimeoutId: ReturnType<typeof setTimeout> | undefined;

    // Set up the debounce timeout
    if (trailing) {
      timeoutId = setTimeout(() => {
        setDebouncedValue(value);
        if (maxWaitTimeoutId) {
          clearTimeout(maxWaitTimeoutId);
        }
      }, delay);
    }

    // Set up the max wait timeout if specified
    if (maxWait !== undefined && maxWait > 0) {
      maxWaitTimeoutId = setTimeout(() => {
        setDebouncedValue(value);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }, maxWait);
    }

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (maxWaitTimeoutId) {
        clearTimeout(maxWaitTimeoutId);
      }
    };
  }, [value, delay, maxWait, leading, trailing]);

  return debouncedValue;
}
