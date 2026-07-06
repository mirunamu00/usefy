import type { UsePermissionDescriptor } from "./types";

/**
 * Whether the Permissions API (`navigator.permissions.query`) is available in the
 * current environment. Returns `false` during SSR (no `navigator`) and in browsers
 * that do not implement the Permissions API.
 *
 * @example
 * ```ts
 * if (isPermissionsSupported()) {
 *   // safe to call navigator.permissions.query(...)
 * }
 * ```
 */
export function isPermissionsSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.permissions !== "undefined" &&
    typeof navigator.permissions.query === "function"
  );
}

/**
 * Produce a stable string key from a permission descriptor's meaningful fields.
 *
 * `usePermission` keys its effect on this string, not on the descriptor object's
 * reference — so an inline `usePermission({ name: 'camera' })` (a fresh object
 * literal every render) does **not** re-query on every render. It re-queries only
 * when the descriptor's actual contents change. Keys are sorted so field order in
 * the literal does not affect the result.
 *
 * @example
 * ```ts
 * serializeDescriptor({ name: "midi", sysex: true }); // '{"name":"midi","sysex":true}'
 * serializeDescriptor({ sysex: true, name: "midi" }); // same string
 * ```
 */
export function serializeDescriptor(descriptor: UsePermissionDescriptor): string {
  const keys = Object.keys(descriptor).sort();
  const normalized: Record<string, unknown> = {};
  for (const key of keys) {
    normalized[key] = descriptor[key];
  }
  return JSON.stringify(normalized);
}
