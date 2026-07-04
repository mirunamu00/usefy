import { useEffect, useMemo, useRef } from "react";

/**
 * Returns a stable function that always invokes the *latest* `callback`.
 *
 * Lets the disclosure handlers keep a permanent identity (safe as props / effect
 * deps) while still calling the freshest `onOpen` / `onClose` the consumer
 * passed. The stored ref is updated in an effect (not during render), keeping it
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
