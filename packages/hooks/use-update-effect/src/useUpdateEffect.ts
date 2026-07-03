import { useEffect, useRef, type DependencyList, type EffectCallback } from "react";

/**
 * A drop-in replacement for `useEffect` that skips running on the first render
 * and only fires on subsequent updates (when the dependencies change).
 *
 * Handy for reacting to changes without also running the effect on mount — e.g.
 * syncing a value to storage only after the user changes it, or firing an
 * `onChange` without an initial spurious call.
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
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
