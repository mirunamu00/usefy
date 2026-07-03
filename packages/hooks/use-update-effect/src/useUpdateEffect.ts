import { useEffect, useRef, type DependencyList, type EffectCallback } from "react";

/**
 * A drop-in replacement for `useEffect` that skips running on the first render
 * and only fires on subsequent updates (when the dependencies change).
 *
 * Handy for reacting to changes without also running the effect on mount — e.g.
 * syncing a value to storage only after the user changes it, or firing an
 * `onChange` without an initial spurious call.
 *
 * Remount-safe: a dedicated mount-tracking effect resets the flag on unmount,
 * so it correctly skips again after a React StrictMode dev remount
 * (mount → unmount → remount) or any real remount, instead of firing on mount.
 *
 * @param effect - Effect callback (may return a cleanup function)
 * @param deps - Dependency list, same semantics as `useEffect`
 *
 * @example
 * ```tsx
 * useUpdateEffect(() => {
 *   // does NOT run on mount, only when `query` later changes
 *   analytics.track("search", { query });
 * }, [query]);
 * ```
 */
export function useUpdateEffect(
  effect: EffectCallback,
  deps?: DependencyList
): void {
  const isMounted = useRef(false);

  // Reset on unmount so a remount (incl. StrictMode's dev remount) is treated
  // as a fresh mount and its first run is skipped again. React flushes all
  // cleanups before all setups, so `isMounted` is `false` when the deps effect
  // below re-runs on remount.
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
