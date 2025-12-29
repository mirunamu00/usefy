import { useDebounce, type UseDebounceOptions } from "@usefy/use-debounce";

/**
 * Options for useThrottle hook
 */
export interface UseThrottleOptions {
  /**
   * Whether to update the throttled value on the leading edge
   * @default true
   */
  leading?: boolean;
  /**
   * Whether to update the throttled value on the trailing edge
   * @default true
   */
  trailing?: boolean;
}

/**
 * Throttles a value by limiting updates to at most once per specified interval.
 * This is implemented using useDebounce with maxWait set to the interval.
 *
 * @template T - The type of the value to throttle
 * @param value - The value to throttle
 * @param delay - The interval in milliseconds (default: 500ms)
 * @param options - Additional options for controlling throttle behavior
 * @returns The throttled value
 *
 * @example
 * ```tsx
 * function ScrollComponent() {
 *   const [scrollY, setScrollY] = useState(0);
 *   const throttledScrollY = useThrottle(scrollY, 100);
 *
 *   useEffect(() => {
 *     const handleScroll = () => setScrollY(window.scrollY);
 *     window.addEventListener("scroll", handleScroll);
 *     return () => window.removeEventListener("scroll", handleScroll);
 *   }, []);
 *
 *   return <div>Scroll Y: {throttledScrollY}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With leading edge only
 * const throttledValue = useThrottle(value, 300, { leading: true, trailing: false });
 * ```
 *
 * @example
 * ```tsx
 * // With trailing edge only
 * const throttledValue = useThrottle(value, 300, { leading: false, trailing: true });
 * ```
 */
export function useThrottle<T>(
  value: T,
  delay: number = 500,
  options: UseThrottleOptions = {}
): T {
  const { leading = true, trailing = true } = options;

  // Throttle is implemented using debounce with maxWait set to delay
  return useDebounce(value, delay, {
    leading,
    maxWait: delay,
    trailing,
  });
}
