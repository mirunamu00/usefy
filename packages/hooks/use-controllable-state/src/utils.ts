import { useEffect, useMemo, useRef, type SetStateAction } from "react";

/**
 * Type guard for the functional-updater form of a `SetStateAction`.
 *
 * `setValue(prev => next)` vs `setValue(next)` — this narrows the union so the
 * updater can be called with the previous value.
 */
export function isUpdater<T>(
  value: SetStateAction<T>
): value is (prev: T) => T {
  return typeof value === "function";
}

/**
 * Returns a stable function that always invokes the *latest* `callback`.
 *
 * This lets a hook expose a setter/handler with a permanent identity (safe as an
 * effect dependency) while still calling the freshest `onChange` the consumer
 * passed — without re-subscribing listeners on every render. Mirrors the
 * "callback ref" pattern used by Radix UI and `useEventCallback`.
 *
 * The stored ref is updated in an effect (not during render) so it stays
 * concurrent-mode / StrictMode safe.
 */
export function useCallbackRef<Args extends unknown[], Return>(
  callback: ((...args: Args) => Return) | undefined
): (...args: Args) => Return | undefined {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useMemo(
    () =>
      (...args: Args) =>
        callbackRef.current?.(...args),
    []
  );
}
