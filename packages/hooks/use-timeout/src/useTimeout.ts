import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Delay type for useTimeout
 * - number: delay in milliseconds
 * - null | undefined: disable timer
 */
export type TimeoutDelay = number | null | undefined;

/**
 * Callback type for useTimeout
 */
export type UseTimeoutCallback = () => void;

/**
 * Return type for useTimeout hook
 */
export interface UseTimeoutReturn {
  /**
   * Reset timer (restart from beginning)
   */
  reset: () => void;
  /**
   * Cancel timer (callback won't execute)
   */
  clear: () => void;
  /**
   * Whether timer is pending
   */
  isPending: boolean;
}

/**
 * A hook for declarative setTimeout with automatic cleanup and controls.
 *
 * Provides a safe way to use setTimeout in React components with:
 * - Automatic cleanup on unmount (prevents memory leaks)
 * - Auto-reset when delay changes
 * - Disable timer when delay is null/undefined
 * - Always maintains latest callback reference (prevents stale closure)
 * - isPending state to check timer status
 *
 * @param callback - Function to execute after delay
 * @param delay - Delay in milliseconds, or null/undefined to disable
 * @returns Object containing reset, clear functions and isPending state
 *
 * @example
 * ```tsx
 * // Auto-dismissing toast
 * function Toast({ message }: { message: string }) {
 *   const [show, setShow] = useState(true);
 *
 *   useTimeout(() => {
 *     setShow(false);
 *   }, 3000);
 *
 *   return show ? <div>{message}</div> : null;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Debounced auto-save with reset
 * function Editor() {
 *   const [content, setContent] = useState("");
 *
 *   const { reset } = useTimeout(() => {
 *     saveToServer(content);
 *   }, 2000);
 *
 *   const handleChange = (value: string) => {
 *     setContent(value);
 *     reset(); // Reset timer on every keystroke
 *   };
 *
 *   return <textarea onChange={(e) => handleChange(e.target.value)} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Conditional execution
 * function SessionTimeout({ isLoggedIn }: { isLoggedIn: boolean }) {
 *   useTimeout(
 *     () => {
 *       logout();
 *       alert("Session expired");
 *     },
 *     isLoggedIn ? 30 * 60 * 1000 : null // Only when logged in
 *   );
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useTimeout(
  callback: UseTimeoutCallback,
  delay: TimeoutDelay
): UseTimeoutReturn {
  const [isPending, setIsPending] = useState<boolean>(false);

  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef<UseTimeoutCallback>(callback);

  // Always keep the latest callback reference
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clear timeout helper
  const clearTimeoutHelper = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // Clear function (exposed)
  const clear = useCallback(() => {
    clearTimeoutHelper();
    setIsPending(false);
  }, [clearTimeoutHelper]);

  // Set timeout helper
  const setTimeoutHelper = useCallback(
    (delayMs: number) => {
      // Clear existing timeout
      clearTimeoutHelper();

      // Normalize delay: treat negative as 0
      const normalizedDelay = Math.max(0, delayMs);

      setIsPending(true);

      timeoutIdRef.current = setTimeout(() => {
        timeoutIdRef.current = null;
        setIsPending(false);
        callbackRef.current();
      }, normalizedDelay);
    },
    [clearTimeoutHelper]
  );

  // Reset function (exposed)
  const reset = useCallback(() => {
    if (delay === null || delay === undefined) {
      return;
    }
    setTimeoutHelper(delay);
  }, [delay, setTimeoutHelper]);

  // Effect: setup/cleanup timeout when delay changes
  useEffect(() => {
    // If delay is null or undefined, clear and don't set new timer
    if (delay === null || delay === undefined) {
      clear();
      return;
    }

    // Set new timeout
    setTimeoutHelper(delay);

    // Cleanup on unmount or delay change
    return () => {
      clearTimeoutHelper();
    };
  }, [delay, setTimeoutHelper, clearTimeoutHelper, clear]);

  return {
    reset,
    clear,
    isPending,
  };
}
