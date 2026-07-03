import { useEffect, useRef } from "react";

/**
 * Returns `true` on the component's first render and `false` on every render
 * thereafter.
 *
 * Useful for skipping logic during the initial render — an `onChange` you don't
 * want firing on mount, or gating an animation to updates only.
 *
 * The flag is flipped in an effect (after commit), never during render, so it
 * stays correct under React StrictMode's double-invoked render (which commits
 * the second pass) and under concurrent rendering.
 *
 * @returns `true` on the first render, otherwise `false`
 *
 * @example
 * ```tsx
 * const isFirst = useIsFirstRender();
 * useEffect(() => {
 *   if (isFirst) return; // skip initial run
 *   onValueChange(value);
 * }, [value]);
 * ```
 */
export function useIsFirstRender(): boolean {
  const isFirstRef = useRef(true);

  useEffect(() => {
    isFirstRef.current = false;
  }, []);

  return isFirstRef.current;
}
