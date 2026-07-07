import { useCallback, useState } from "react";

/**
 * useCounter return type
 */
export interface UseCounterReturn {
  /**
   * Current counter value
   */
  count: number;
  /**
   * Increment the counter by 1
   */
  increment: () => void;
  /**
   * Decrement the counter by 1
   */
  decrement: () => void;
  /**
   * Reset the counter back to its initial value
   */
  reset: () => void;
}

/**
 * A hook for managing counter state with increment, decrement, and reset.
 * Ideal for quantity selectors, pagination, and scoreboards.
 *
 * @param initialValue - Initial counter value (default: 0)
 * @returns Object containing the current count and control functions
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const { count, increment, decrement, reset } = useCounter(0);
 *
 *   return (
 *     <div>
 *       <h2>Counter: {count}</h2>
 *       <button onClick={increment}>+ Increment</button>
 *       <button onClick={decrement}>- Decrement</button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCounter(initialValue: number = 0): UseCounterReturn {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount((prev) => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}
