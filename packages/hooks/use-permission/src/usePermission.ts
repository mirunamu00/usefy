import { useEffect, useMemo, useRef, useState } from "react";
import type {
  UsePermissionDescriptor,
  UsePermissionReturn,
  UsePermissionStatus,
} from "./types";
import { isPermissionsSupported, serializeDescriptor } from "./utils";

/**
 * Track the status of a Permissions API permission, with live updates.
 *
 * Calls `navigator.permissions.query(descriptor)` and subscribes to the returned
 * `PermissionStatus`'s `change` event, so the returned `state` reflects the user
 * granting or revoking the permission without a re-mount. The hook is SSR-safe
 * (reports `unsupported` on the server) and StrictMode/concurrent-safe (the async
 * query is race-guarded and the listener is cleaned up on unmount).
 *
 * **Descriptor identity:** the effect is keyed on a *serialized* copy of the
 * descriptor's fields (`name`, `userVisibleOnly`, `sysex`, …), not on the object
 * reference. So passing an inline literal — `usePermission({ name: 'camera' })` —
 * does not re-query on every render; it re-queries only when the descriptor's
 * contents actually change. No `useMemo` on the caller's side is required.
 *
 * @param descriptor - The permission to query, e.g. `{ name: 'camera' }`,
 *   `{ name: 'geolocation' }`, `{ name: 'push', userVisibleOnly: true }`,
 *   `{ name: 'midi', sysex: true }`. Accepts any permission name (the standard
 *   ones plus browser-specific ones like `'camera'`/`'microphone'`).
 * @returns `{ state, status, isSupported, error }` — see {@link UsePermissionReturn}.
 *
 * @example
 * ```tsx
 * function CameraBadge() {
 *   const { state, status } = usePermission({ name: "camera" });
 *
 *   // Branch on `status` (deterministic "idle" on the first render, both on the
 *   // server and client) so the UI is hydration-safe.
 *   if (status === "idle" || status === "pending") return <span>Checking…</span>;
 *   if (status === "unsupported") return <span>Permissions API unavailable</span>;
 *   if (status === "error") return <span>Could not read camera permission</span>;
 *
 *   return <span>Camera: {state}</span>; // 'granted' | 'denied' | 'prompt'
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Live updates: the badge re-renders when the user changes the permission in
 * // the browser UI — no polling, no re-mount.
 * function MicIndicator() {
 *   const { state } = usePermission({ name: "microphone" });
 *   return <div data-granted={state === "granted"}>Mic: {state ?? "unknown"}</div>;
 * }
 * ```
 */
export function usePermission(
  descriptor: UsePermissionDescriptor
): UsePermissionReturn {
  // Every returned field starts deterministic (identical on server and the
  // first client render) so the hook never causes a hydration mismatch; the
  // effect corrects them after mount. In particular `isSupported` is NOT
  // computed in render — that would be `false` on the server and `true` on the
  // client's first paint, mismatching any UI that branches on it.
  const [state, setState] = useState<PermissionState | null>(null);
  const [status, setStatus] = useState<UsePermissionStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Read the latest descriptor from a ref inside the effect. The effect is keyed
  // on the serialized descriptor (a primitive), so it re-runs on content changes
  // while `descriptorRef` guarantees the query uses the current fields.
  const descriptorRef = useRef(descriptor);
  descriptorRef.current = descriptor;

  const serialized = serializeDescriptor(descriptor);

  useEffect(() => {
    const supported = isPermissionsSupported();
    setIsSupported(supported);
    if (!supported) {
      setState(null);
      setStatus("unsupported");
      setError(null);
      return;
    }

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;
    let changeHandler: (() => void) | null = null;

    // Clear any prior permission's value so consumers don't read stale `state`
    // while the new query for a changed descriptor is in flight.
    setState(null);
    setStatus("pending");
    setError(null);

    navigator.permissions
      .query(descriptorRef.current as PermissionDescriptor)
      .then((result) => {
        if (cancelled) return;
        permissionStatus = result;
        setState(result.state);
        setStatus(result.state);

        changeHandler = () => {
          // Read the fresh value off the live PermissionStatus object.
          setState(result.state);
          setStatus(result.state);
        };
        result.addEventListener("change", changeHandler);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState(null);
        setStatus("error");
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
      if (permissionStatus && changeHandler) {
        permissionStatus.removeEventListener("change", changeHandler);
      }
    };
    // `serialized` is the stable primitive key; `descriptorRef`/setters are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  return useMemo<UsePermissionReturn>(
    () => ({ state, status, isSupported, error }),
    [state, status, isSupported, error]
  );
}
