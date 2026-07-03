import { useEffect, useLayoutEffect } from "react";

/**
 * An SSR-safe version of `useLayoutEffect`.
 *
 * `useLayoutEffect` warns when it runs on the server (it can't do anything
 * useful there). This hook resolves to `useLayoutEffect` in the browser and to
 * `useEffect` on the server, silencing the warning while keeping synchronous
 * layout behavior on the client.
 *
 * The choice is made once at module load based on whether `window` exists, so
 * it is stable for the lifetime of the app.
 *
 * @example
 * ```tsx
 * useIsomorphicLayoutEffect(() => {
 *   const rect = ref.current?.getBoundingClientRect();
 *   setSize(rect);
 * }, []);
 * ```
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
