import { useRef } from "react";

/**
 * Returns `true` on the component's first render and `false` on every render
 * thereafter.
 *
 * Useful for skipping logic during the initial render — e.g. avoiding an
 * `onChange` fired on mount, or gating an animation to updates only.
 *
 * The flag flips during render (via a ref), so the very first call in a
 * component's life returns `true` and all subsequent renders return `false`.
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
  const isFirst = useRef(true);

  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }

  return false;
}
