/**
 * Coarse lifecycle status for a permission query.
 *
 * - `idle` — no query has resolved yet (initial render, before the effect runs).
 * - `pending` — a `navigator.permissions.query()` call is in flight.
 * - `granted` / `denied` / `prompt` — the resolved {@link PermissionState}. These
 *   mirror the raw `state` field, so you can branch on either.
 * - `unsupported` — the Permissions API is unavailable in this environment
 *   (SSR, or a browser without `navigator.permissions`).
 * - `error` — the query rejected (e.g. an unknown permission name in a browser
 *   that throws instead of returning `denied`). See {@link UsePermissionReturn.error}.
 */
export type UsePermissionStatus =
  | "idle"
  | "pending"
  | "granted"
  | "denied"
  | "prompt"
  | "unsupported"
  | "error";

/**
 * Permission descriptor accepted by {@link usePermission}.
 *
 * A superset of the DOM `PermissionDescriptor` so that *all* permission names
 * typecheck — including the ones missing from the standard `PermissionName`
 * union in `lib.dom` (`'camera'`, `'microphone'`, `'clipboard-read'`, …) and the
 * extra fields required by specific permissions (`userVisibleOnly` for `'push'`,
 * `sysex` for `'midi'`, device fields for `'camera'`). The index signature keeps
 * it forward-compatible with descriptor fields not yet in the lib types.
 *
 * @example
 * ```ts
 * const camera: UsePermissionDescriptor = { name: "camera" };
 * const push: UsePermissionDescriptor = { name: "push", userVisibleOnly: true };
 * const midi: UsePermissionDescriptor = { name: "midi", sysex: true };
 * ```
 */
export interface UsePermissionDescriptor {
  /**
   * The permission name. Accepts the standard `PermissionName` values with
   * autocomplete, plus any other string (e.g. `'camera'`, `'microphone'`) that a
   * given browser supports.
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  name: PermissionName | (string & {});
  /** Required for the `'push'` permission — must be `true`, browsers reject `false`. */
  userVisibleOnly?: boolean;
  /** Requests SysEx access for the `'midi'` permission. */
  sysex?: boolean;
  /** Forward-compatible with descriptor fields not yet in the lib types. */
  [key: string]: unknown;
}

/**
 * Return value of {@link usePermission}.
 *
 * Destructure the field you need — the roadmap's `const { state } = usePermission(...)`
 * reads naturally, while `status`, `isSupported`, and `error` cover the async and
 * unsupported/error edges that a bare `PermissionState` cannot express.
 */
export interface UsePermissionReturn {
  /**
   * The raw permission state (`'granted' | 'denied' | 'prompt'`), or `null` until
   * the first query resolves and whenever the API is unsupported or the query
   * errored.
   */
  state: PermissionState | null;
  /** Coarse lifecycle status. See {@link UsePermissionStatus}. */
  status: UsePermissionStatus;
  /** Whether the Permissions API is available in the current environment. */
  isSupported: boolean;
  /** The error thrown by `navigator.permissions.query()`, if the query rejected. */
  error: Error | null;
}
