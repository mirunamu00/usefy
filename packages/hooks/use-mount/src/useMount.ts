import { useEffect } from "react";

/**
 * Runs a callback exactly once, when the component mounts.
 *
 * A readable alias for `useEffect(fn, [])` that makes mount-only intent
 * explicit. The callback may return a cleanup function, which runs on unmount.
 *
 * Note: under React StrictMode in development, effects run twice on mount to
 * surface missing cleanup — this is expected.
 *
 * @param effect - Callback to run on mount; may return a cleanup function
 *
 * @example
 * ```tsx
 * useMount(() => {
 *   analytics.page();
 *   return () => cleanup();
 * });
 * ```
 */
export function useMount(effect: () => void | (() => void)): void {
  useEffect(() => {
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
