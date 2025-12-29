import {
  useDebounceCallback,
  type DebouncedFunction,
} from "@usefy/use-debounce-callback";

/**
 * Options for useThrottleCallback hook
 */
export interface UseThrottleCallbackOptions {
  /**
   * Whether to invoke on the leading edge
   * @default true
   */
  leading?: boolean;
  /**
   * Whether to invoke on the trailing edge
   * @default true
   */
  trailing?: boolean;
}

/**
 * Throttled function interface with control methods
 */
export type ThrottledFunction<T extends (...args: any[]) => any> =
  DebouncedFunction<T>;

/**
 * Creates a throttled version of the provided callback function.
 * The throttled function limits invocations to at most once per specified interval.
 * This is implemented using useDebounceCallback with maxWait set to the interval.
 *
 * @template T - The type of the callback function
 * @param callback - The function to throttle
 * @param delay - The interval in milliseconds (default: 500ms)
 * @param options - Additional options for controlling throttle behavior
 * @returns A throttled version of the callback with cancel, flush, and pending methods
 *
 * @example
 * ```tsx
 * function ScrollTracker() {
 *   const throttledScroll = useThrottleCallback(
 *     () => {
 *       console.log('Scroll position:', window.scrollY);
 *     },
 *     100
 *   );
 *
 *   useEffect(() => {
 *     window.addEventListener('scroll', throttledScroll);
 *     return () => {
 *       throttledScroll.cancel();
 *       window.removeEventListener('scroll', throttledScroll);
 *     };
 *   }, [throttledScroll]);
 *
 *   return <div>Scroll to see throttled logs</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With leading edge only
 * const throttledFn = useThrottleCallback(callback, 300, { leading: true, trailing: false });
 * ```
 *
 * @example
 * ```tsx
 * // With trailing edge only
 * const throttledFn = useThrottleCallback(callback, 300, { leading: false, trailing: true });
 *
 * // Cancel pending invocation
 * throttledFn.cancel();
 *
 * // Immediately invoke pending invocation
 * throttledFn.flush();
 *
 * // Check if there's a pending invocation
 * if (throttledFn.pending()) {
 *   console.log('There is a pending call');
 * }
 * ```
 */
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  options: UseThrottleCallbackOptions = {}
): ThrottledFunction<T> {
  const { leading = true, trailing = true } = options;

  // Throttle is implemented using debounce with maxWait set to delay
  return useDebounceCallback(callback, delay, {
    leading,
    maxWait: delay,
    trailing,
  });
}
