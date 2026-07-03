import { useRef } from "react";

/**
 * Comparator used to decide whether the tracked value changed between renders.
 * Return `true` when `previous` and `current` should be considered equal (in
 * which case the stored "previous" value is left untouched). Defaults to
 * `Object.is`.
 */
export type UsePreviousComparator<T> = (previous: T, current: T) => boolean;

/**
 * Returns the value from the previous render.
 *
 * On the first render there is no previous value, so it returns `undefined`.
 * By default values are compared with `Object.is`, so a value that never
 * changes keeps `undefined` as its "previous" — the hook tracks the previous
 * *distinct* value, which is what change-detection logic usually wants.
 *
 * Pass a custom `isEqual` to ignore changes that are referentially different
 * but semantically equal (e.g. new object literals with the same fields).
 *
 * @param value - The value to track
 * @param isEqual - Optional equality comparator (defaults to `Object.is`)
 * @returns The previous distinct value, or `undefined`
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const prev = usePrevious(count);
 * return <p>{prev} → {count}</p>;
 * ```
 *
 * @example
 * ```tsx
 * // Ignore new-but-equal objects
 * const prev = usePrevious(user, (a, b) => a.id === b.id);
 * ```
 */
export function usePrevious<T>(
  value: T,
  isEqual?: UsePreviousComparator<T>
): T | undefined {
  const currentRef = useRef<T>(value);
  const previousRef = useRef<T | undefined>(undefined);

  const equal = isEqual
    ? isEqual(currentRef.current, value)
    : Object.is(currentRef.current, value);

  if (!equal) {
    previousRef.current = currentRef.current;
    currentRef.current = value;
  }

  return previousRef.current;
}
