import { useCallback, useRef, useSyncExternalStore } from "react";
import type { NetworkState, UseNetworkStateReturn } from "./types";
import {
  SERVER_NETWORK_STATE,
  areNetworkStatesEqual,
  getConnection,
  getNetworkState,
} from "./utils";

/**
 * Track the device's network status: online/offline connectivity plus the
 * Network Information API (`effectiveType`, `downlink`, `rtt`, `saveData`, …).
 *
 * Combines `navigator.onLine` (updated on the window `online`/`offline` events)
 * with `navigator.connection` (updated on its `change` event, with
 * `mozConnection`/`webkitConnection` fallbacks). Built on
 * `useSyncExternalStore`, so it is tear-free under concurrent rendering and
 * SSR-safe out of the box.
 *
 * Degrades gracefully: on browsers without the Network Information API
 * (Firefox, Safari) every Network Information field is `undefined` while
 * `online` still works. On the server it returns a deterministic inert value
 * with `online: true` and no Network Information fields, so it never throws and
 * never causes a hydration mismatch.
 *
 * `since` is the timestamp of the *last online/offline transition* — it is
 * `undefined` on the initial render and until the first transition occurs.
 *
 * @returns The current {@link NetworkState}.
 *
 * @example
 * ```tsx
 * // Basic online/offline banner
 * function ConnectivityBanner() {
 *   const { online } = useNetworkState();
 *   if (online) return null;
 *   return <div role="alert">You are offline.</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Adapt behaviour to connection quality
 * function Media() {
 *   const { effectiveType, saveData } = useNetworkState();
 *   const lowData = saveData || effectiveType === "slow-2g" || effectiveType === "2g";
 *   return lowData ? <LowResImage /> : <HighResImage />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Full snapshot
 * function NetworkInfo() {
 *   const { online, since, downlink, effectiveType, rtt, type } = useNetworkState();
 *   return (
 *     <ul>
 *       <li>online: {String(online)}</li>
 *       <li>since: {since?.toLocaleTimeString() ?? "—"}</li>
 *       <li>effectiveType: {effectiveType ?? "unsupported"}</li>
 *       <li>downlink: {downlink ?? "—"} Mb/s</li>
 *       <li>rtt: {rtt ?? "—"} ms</li>
 *       <li>type: {type ?? "unsupported"}</li>
 *     </ul>
 *   );
 * }
 * ```
 */
export function useNetworkState(): UseNetworkStateReturn {
  // Timestamp of the last online/offline transition. Mutated by the event
  // handlers in `subscribe` and read by `getSnapshot`. Starts undefined so the
  // first render reports no transition yet.
  const sinceRef = useRef<Date | undefined>(undefined);

  // Cache the last snapshot so `getSnapshot` can return a stable reference when
  // nothing observable changed. `useSyncExternalStore` compares snapshots with
  // Object.is and would loop forever if we returned a fresh object every call.
  const cacheRef = useRef<NetworkState | undefined>(undefined);

  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const handleOnlineStatusChange = () => {
      sinceRef.current = new Date();
      onStoreChange();
    };

    const handleConnectionChange = () => {
      onStoreChange();
    };

    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    const connection = getConnection();
    connection?.addEventListener?.("change", handleConnectionChange);

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
      connection?.removeEventListener?.("change", handleConnectionChange);
    };
  }, []);

  const getSnapshot = useCallback((): NetworkState => {
    const next = getNetworkState(sinceRef.current);
    const prev = cacheRef.current;
    if (prev && areNetworkStatesEqual(prev, next)) {
      return prev;
    }
    cacheRef.current = next;
    return next;
  }, []);

  const getServerSnapshot = useCallback(
    (): NetworkState => SERVER_NETWORK_STATE,
    []
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
