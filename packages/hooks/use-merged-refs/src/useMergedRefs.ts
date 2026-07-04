import { useCallback } from "react";
import type { PossibleRef, RefCleanup } from "./types";
import { mergeRefs } from "./utils";

/**
 * Merge multiple refs into a single stable callback ref — the missing piece for
 * `forwardRef` components that also need their **own** ref to a node.
 *
 * Pass any mix of callback refs, ref objects, and `null` / `undefined`; the
 * returned callback assigns the node to all of them. It supports React 19
 * callback-ref cleanup functions and falls back to the classic
 * "set `null` on unmount" behavior for refs that don't return one, so it works
 * unchanged on React 18 and 19.
 *
 * The returned callback is memoized on the given refs, so it only changes
 * identity when one of the refs does — React then re-runs the ref exactly when
 * it should.
 *
 * @typeParam T - The element (or value) type the refs point to.
 * @param refs - The refs to merge.
 * @returns A stable callback ref that fans out to every provided ref.
 *
 * @example
 * ```tsx
 * import { forwardRef, useRef } from "react";
 * import { useMergedRefs } from "@usefy/use-merged-refs";
 *
 * const Input = forwardRef<HTMLInputElement, InputProps>((props, forwardedRef) => {
 *   // The component needs its own ref (to measure, focus, observe…) *and* must
 *   // honor the forwarded ref. Merge them into one.
 *   const localRef = useRef<HTMLInputElement>(null);
 *   const ref = useMergedRefs(localRef, forwardedRef);
 *
 *   return <input {...props} ref={ref} />;
 * });
 * ```
 */
export function useMergedRefs<T>(
  ...refs: PossibleRef<T>[]
): (node: T | null) => RefCleanup | void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(mergeRefs(...refs), refs);
}
