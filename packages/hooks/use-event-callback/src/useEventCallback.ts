import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

// SSR-safe layout effect: keep the stored callback in sync before paint on the
// client, fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Returns a stable, memoized callback that always invokes the latest version of
 * `fn` — the community equivalent of React's experimental `useEffectEvent`.
 *
 * The returned function keeps the same identity for the component's lifetime,
 * so it is safe to pass to `useEffect` deps, event listeners, or memoized
 * children, while still "seeing" the newest props and state when called.
 *
 * @param fn - The callback whose latest version should be invoked
 * @returns A referentially-stable function that proxies to the latest `fn`
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const onClick = useEventCallback(() => console.log(count));
 * // `onClick` never changes identity, but always logs the current count
 * useEffect(() => {
 *   el.addEventListener("click", onClick);
 *   return () => el.removeEventListener("click", onClick);
 * }, [onClick]);
 * ```
 *
 * @remarks
 * Intended for callbacks fired **after** render/paint (events, timeouts,
 * subscriptions). The stored function is updated in a layout effect, so:
 * - Calling the returned function **during render throws** (guards against
 *   reading state that isn't committed yet).
 * - Do not call it from an effect that commits *before* this component's layout
 *   effect on the same pass (e.g. a child component's layout effect) — it may
 *   still hold the previous render's function.
 */
export function useEventCallback<Args extends unknown[], Return>(
  fn: (...args: Args) => Return
): (...args: Args) => Return {
  const ref = useRef<(...args: Args) => Return>(() => {
    throw new Error("useEventCallback: cannot call the callback while rendering.");
  });

  useIsomorphicLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);

  return useCallback((...args: Args) => ref.current(...args), []);
}
