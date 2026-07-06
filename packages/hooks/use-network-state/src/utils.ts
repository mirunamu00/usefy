import type { NetworkInformationLike, NetworkState } from "./types";

/**
 * The inert network state returned during server-side rendering and in any
 * environment without a `navigator`. `online` is optimistically `true`; every
 * Network Information field is `undefined`.
 *
 * Frozen and shared so the server snapshot keeps a stable identity across
 * renders (important for `useSyncExternalStore`).
 */
export const SERVER_NETWORK_STATE: NetworkState = Object.freeze({
  online: true,
});

/**
 * Whether a `navigator` object is available (i.e. running in a browser-like
 * environment rather than SSR).
 *
 * @returns `true` when `navigator` is defined.
 *
 * @example
 * ```ts
 * if (isNavigatorAvailable()) {
 *   // Safe to read navigator.onLine
 * }
 * ```
 */
export function isNavigatorAvailable(): boolean {
  return typeof navigator !== "undefined";
}

/**
 * Resolve the `NetworkInformation` object from `navigator`, checking the
 * standard `connection` property first and then the vendor-prefixed
 * `mozConnection` / `webkitConnection` fallbacks.
 *
 * @returns The connection object, or `undefined` when the Network Information
 * API is unsupported (Firefox, Safari) or running under SSR.
 *
 * @example
 * ```ts
 * const connection = getConnection();
 * const effectiveType = connection?.effectiveType; // "4g" | undefined
 * ```
 */
export function getConnection(): NetworkInformationLike | undefined {
  if (!isNavigatorAvailable()) {
    return undefined;
  }
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

/**
 * Whether the Network Information API is available in the current environment.
 *
 * @returns `true` when a `navigator.connection` (or a vendor-prefixed variant)
 * exists.
 *
 * @example
 * ```ts
 * const showsEffectiveType = isNetworkInformationSupported();
 * ```
 */
export function isNetworkInformationSupported(): boolean {
  return getConnection() !== undefined;
}

/**
 * Read the current {@link NetworkState} from `navigator`, merging
 * `navigator.onLine` with the Network Information API fields (when available).
 *
 * Degrades gracefully: returns {@link SERVER_NETWORK_STATE} under SSR, and
 * leaves every Network Information field `undefined` when the API is
 * unsupported.
 *
 * @param since - Timestamp of the last online/offline transition to carry into
 * the snapshot. Pass the value tracked by the caller; defaults to `undefined`.
 * @returns The current network state.
 *
 * @example
 * ```ts
 * const state = getNetworkState();
 * console.log(state.online, state.effectiveType);
 * ```
 */
export function getNetworkState(since?: Date): NetworkState {
  if (!isNavigatorAvailable()) {
    return SERVER_NETWORK_STATE;
  }

  const connection = getConnection();

  return {
    online: navigator.onLine,
    since,
    downlink: connection?.downlink,
    downlinkMax: connection?.downlinkMax,
    effectiveType: connection?.effectiveType,
    rtt: connection?.rtt,
    saveData: connection?.saveData,
    type: connection?.type,
  };
}

/**
 * Compare two {@link NetworkState} snapshots field-by-field.
 *
 * Used to keep the `useSyncExternalStore` snapshot identity stable: when a
 * `change` event fires but no observed value actually changed, returning the
 * previous object avoids a needless re-render.
 *
 * @param a - First snapshot.
 * @param b - Second snapshot.
 * @returns `true` when every field is equal (`since` is compared by reference).
 *
 * @example
 * ```ts
 * areNetworkStatesEqual(prev, next); // true -> reuse prev, skip re-render
 * ```
 */
export function areNetworkStatesEqual(
  a: NetworkState,
  b: NetworkState
): boolean {
  return (
    a.online === b.online &&
    a.since === b.since &&
    a.downlink === b.downlink &&
    a.downlinkMax === b.downlinkMax &&
    a.effectiveType === b.effectiveType &&
    a.rtt === b.rtt &&
    a.saveData === b.saveData &&
    a.type === b.type
  );
}
