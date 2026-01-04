import { useEffect, useRef } from "react";

/**
 * Options for useUnmount hook
 */
export interface UseUnmountOptions {
  /**
   * Whether the unmount callback is enabled.
   * When false, the callback will not be executed on unmount.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Executes a callback function when the component unmounts.
 * The callback always has access to the latest values (closure freshness).
 *
 * Features:
 * - Closure freshness: callback always sees latest state/props
 * - Error handling: errors in callback don't break unmount
 * - Conditional execution via `enabled` option
 * - SSR compatible
 * - TypeScript support
 *
 * @param callback - The function to execute on unmount
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Basic usage
 * function MyComponent() {
 *   useUnmount(() => {
 *     console.log("Component unmounted");
 *   });
 *
 *   return <div>Hello</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With latest state access
 * function FormComponent() {
 *   const [formData, setFormData] = useState({});
 *
 *   useUnmount(() => {
 *     // formData will have the latest value at unmount time
 *     saveToLocalStorage(formData);
 *   });
 *
 *   return <form>...</form>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Conditional cleanup
 * function TrackingComponent({ trackingEnabled }) {
 *   useUnmount(
 *     () => {
 *       sendAnalyticsEvent("component_unmounted");
 *     },
 *     { enabled: trackingEnabled }
 *   );
 *
 *   return <div>Tracked content</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Resource cleanup
 * function WebSocketComponent() {
 *   const wsRef = useRef<WebSocket | null>(null);
 *
 *   useEffect(() => {
 *     wsRef.current = new WebSocket("wss://example.com");
 *   }, []);
 *
 *   useUnmount(() => {
 *     wsRef.current?.close();
 *   });
 *
 *   return <div>Connected</div>;
 * }
 * ```
 *
 * @remarks
 * **React StrictMode**: In development with StrictMode, React intentionally
 * mounts, unmounts, and remounts components to detect side effects. This means
 * the unmount callback may be called multiple times during development.
 * This is expected behavior and helps identify issues with cleanup logic.
 *
 * **Error Handling**: If the callback throws an error, it will be caught and
 * logged to the console. This prevents unmount errors from breaking
 * the entire component tree unmount process.
 */
export function useUnmount(
  callback: () => void,
  options: UseUnmountOptions = {}
): void {
  const { enabled = true } = options;

  // Store callback in ref to always have the latest version
  // This ensures closure freshness - the callback at unmount time
  // will have access to the most recent state/props values
  const callbackRef = useRef(callback);

  // Update the ref on every render to capture latest callback
  callbackRef.current = callback;

  useEffect(() => {
    // If disabled, don't set up cleanup
    if (!enabled) {
      return;
    }

    // Return cleanup function
    return () => {
      try {
        callbackRef.current();
      } catch (error) {
        // Log the error to help with debugging
        // Catch to prevent breaking other unmounts in the component tree
        console.error("useUnmount: Error in unmount callback:", error);
      }
    };
  }, [enabled]);
}
