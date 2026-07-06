/**
 * The effective connection type, as reported by the Network Information API's
 * `NetworkInformation.effectiveType`. Describes the measured round-trip time and
 * downlink to bucket the connection into a cellular-equivalent quality.
 *
 * `undefined` when the Network Information API is unsupported (Firefox, Safari).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType
 */
export type EffectiveConnectionType = "slow-2g" | "2g" | "3g" | "4g";

/**
 * The physical connection type, as reported by the Network Information API's
 * `NetworkInformation.type`.
 *
 * `undefined` when the Network Information API is unsupported, or when the
 * browser exposes `effectiveType`/`downlink` but not `type` (common on desktop
 * Chromium, which omits `type` for privacy reasons).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/type
 */
export type ConnectionType =
  | "bluetooth"
  | "cellular"
  | "ethernet"
  | "none"
  | "wifi"
  | "wimax"
  | "other"
  | "unknown";

/**
 * A snapshot of the device's network status, combining `navigator.onLine` with
 * the Network Information API (`navigator.connection`).
 *
 * Only `online` is guaranteed on every platform. Every Network Information
 * field is optional and is `undefined` wherever the API (or that specific
 * field) is unsupported — the hook never throws and always reports `online`.
 */
export interface NetworkState {
  /**
   * Whether the browser currently has network connectivity, from
   * `navigator.onLine`. Updated on the window `online`/`offline` events.
   *
   * Defaults to `true` on the server (SSR) and in environments without a
   * `navigator`, matching the optimistic assumption most apps want.
   */
  online: boolean;

  /**
   * Timestamp of the last `online`/`offline` transition observed by this hook.
   *
   * `undefined` on the initial render and until the first transition occurs —
   * it reflects *when connectivity changed*, not when the hook mounted.
   */
  since?: Date;

  /**
   * Effective downlink bandwidth estimate in megabits per second, rounded to
   * the nearest 25 kbps. `undefined` when unsupported.
   */
  downlink?: number;

  /**
   * Maximum downlink speed of the underlying connection technology, in
   * megabits per second. Rarely populated in practice; `undefined` when
   * unsupported.
   */
  downlinkMax?: number;

  /**
   * The effective connection type (`"slow-2g" | "2g" | "3g" | "4g"`).
   * `undefined` when unsupported.
   */
  effectiveType?: EffectiveConnectionType;

  /**
   * Estimated effective round-trip time in milliseconds, rounded to the nearest
   * 25 ms. `undefined` when unsupported.
   */
  rtt?: number;

  /**
   * Whether the user has requested a reduced-data mode ("Data Saver").
   * `undefined` when unsupported.
   */
  saveData?: boolean;

  /**
   * The physical connection type (`"wifi" | "cellular" | ...`).
   * `undefined` when unsupported.
   */
  type?: ConnectionType;
}

/**
 * The value returned by {@link useNetworkState}: the current {@link NetworkState}.
 */
export type UseNetworkStateReturn = NetworkState;

/**
 * The subset of the `NetworkInformation` interface this hook reads, plus the
 * `EventTarget` methods used to subscribe to its `change` event. Vendor-prefixed
 * (`mozConnection`, `webkitConnection`) implementations expose the same shape.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 */
export interface NetworkInformationLike extends Partial<EventTarget> {
  readonly downlink?: number;
  readonly downlinkMax?: number;
  readonly effectiveType?: EffectiveConnectionType;
  readonly rtt?: number;
  readonly saveData?: boolean;
  readonly type?: ConnectionType;
}
