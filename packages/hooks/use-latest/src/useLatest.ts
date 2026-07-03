import { useRef } from "react";

/**
 * Returns a ref whose `.current` always holds the latest value passed in.
 *
 * Useful for reading fresh props/state inside stable callbacks, event
 * listeners, or async code without adding the value to a dependency array and
 * without the stale-closure problem.
 *
 * The returned ref identity is stable for the component's lifetime; only
 * `.current` changes (synchronously, on every render).
 *
 * @param value - The value to keep fresh
 * @returns A stable ref object whose `current` is always the latest `value`
 *
 * @example
 * ```tsx
 * const latestCount = useLatest(count);
 * useEffect(() => {
 *   const id = setInterval(() => {
 *     // always reads the newest count, no re-subscription
 *     console.log(latestCount.current);
 *   }, 1000);
 *   return () => clearInterval(id);
 * }, [latestCount]);
 * ```
 *
 * @remarks
 * The ref is updated during render. Under concurrent rendering a render React
 * discards can still write `.current`, so between an interrupted render and the
 * next commit `.current` may briefly hold an uncommitted value. For the common
 * synchronous case this is not observable; if you need the last *committed*
 * value only, mirror it in a `useEffect` instead.
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
