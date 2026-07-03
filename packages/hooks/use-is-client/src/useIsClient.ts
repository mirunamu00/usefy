import { useEffect, useState } from "react";

/**
 * Returns `false` during server-side rendering and the first client render,
 * then `true` after hydration. The canonical guard for rendering client-only
 * UI without causing hydration mismatches.
 *
 * Because the initial value is always `false` on both server and client, the
 * first render matches the server output; the value flips to `true` in an
 * effect that only runs on the client.
 *
 * @returns `true` once the component has mounted on the client, else `false`
 *
 * @example
 * ```tsx
 * function Component() {
 *   const isClient = useIsClient();
 *   return isClient ? <ClientOnlyWidget /> : <ServerFallback />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Safely read browser-only APIs after hydration
 * function Width() {
 *   const isClient = useIsClient();
 *   return <span>{isClient ? window.innerWidth : "—"}</span>;
 * }
 * ```
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
