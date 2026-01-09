import { useCallback, useRef, useSyncExternalStore } from "react";
import { subscribe, notifyListeners } from "./store";

/**
 * Type for initial value that can be a value or a function returning a value (lazy initialization)
 */
export type InitialValue<T> = T | (() => T);

/**
 * Options for useSessionStorage hook
 */
export interface UseSessionStorageOptions<T> {
  /**
   * Custom serializer function for converting value to string
   * @default JSON.stringify
   */
  serializer?: (value: T) => string;
  /**
   * Custom deserializer function for parsing stored string to value
   * @default JSON.parse
   */
  deserializer?: (value: string) => T;
  /**
   * Callback function called when an error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for useSessionStorage hook - tuple similar to useState
 */
export type UseSessionStorageReturn<T> = readonly [
  /** Current stored value */
  T,
  /** Function to update the value (same signature as useState setter) */
  React.Dispatch<React.SetStateAction<T>>,
  /** Function to remove the value from sessionStorage */
  () => void
];

/**
 * Helper function to resolve initial value (supports lazy initialization)
 */
function resolveInitialValue<T>(initialValue: InitialValue<T>): T {
  return typeof initialValue === "function"
    ? (initialValue as () => T)()
    : initialValue;
}

/**
 * A hook for persisting state in sessionStorage with automatic synchronization.
 * Works like useState but persists the value in sessionStorage for the duration of the browser session.
 *
 * Features:
 * - Same-tab synchronization: Multiple components using the same key will stay in sync
 * - SSR compatible: Works with Next.js, Remix, and other SSR frameworks
 *
 * Unlike localStorage, sessionStorage data:
 * - Is cleared when the tab/window is closed
 * - Is not shared between tabs (each tab has its own session)
 *
 * @template T - The type of the stored value
 * @param key - The sessionStorage key to store the value under
 * @param initialValue - Initial value or function returning initial value (lazy initialization)
 * @param options - Configuration options for serialization and error handling
 * @returns A tuple of [storedValue, setValue, removeValue]
 *
 * @example
 * ```tsx
 * // Basic usage - form data that persists during session
 * function CheckoutForm() {
 *   const [formData, setFormData, clearForm] = useSessionStorage('checkout-form', {
 *     name: '',
 *     email: '',
 *   });
 *
 *   return (
 *     <form>
 *       <input
 *         value={formData.name}
 *         onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
 *       />
 *       <button type="button" onClick={clearForm}>Clear</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Same-tab synchronization - both components stay in sync
 * function ComponentA() {
 *   const [step, setStep] = useSessionStorage('wizard-step', 1);
 *   return <button onClick={() => setStep(s => s + 1)}>Next Step</button>;
 * }
 *
 * function ComponentB() {
 *   const [step] = useSessionStorage('wizard-step', 1);
 *   // Automatically updates when ComponentA calls setStep!
 *   return <p>Current Step: {step}</p>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Temporary state that resets on tab close
 * const [wizardStep, setWizardStep] = useSessionStorage('wizard-step', 1);
 * ```
 *
 * @example
 * ```tsx
 * // With lazy initialization
 * const [cache, setCache] = useSessionStorage('cache', () => computeInitialCache());
 * ```
 *
 * @example
 * ```tsx
 * // With custom serializer/deserializer
 * const [date, setDate] = useSessionStorage<Date>('lastAction', new Date(), {
 *   serializer: (d) => d.toISOString(),
 *   deserializer: (s) => new Date(s),
 * });
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: InitialValue<T>,
  options: UseSessionStorageOptions<T> = {}
): UseSessionStorageReturn<T> {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError,
  } = options;

  // Store options in refs for stable references and access to latest values
  const serializerRef = useRef(serializer);
  const deserializerRef = useRef(deserializer);
  const onErrorRef = useRef(onError);
  const initialValueRef = useRef(initialValue);

  serializerRef.current = serializer;
  deserializerRef.current = deserializer;
  onErrorRef.current = onError;
  initialValueRef.current = initialValue;

  // Cache for getSnapshot to ensure stable returns and prevent infinite loops
  // useSyncExternalStore requires getSnapshot to return the same reference
  // if the data hasn't changed
  const cacheRef = useRef<{ rawValue: string | null; parsedValue: T } | null>(
    null
  );

  // SSR check
  const isClient = typeof window !== "undefined";

  // Subscribe function for useSyncExternalStore
  // Handles same-tab synchronization (sessionStorage doesn't have cross-tab sync)
  const subscribeToStore = useCallback(
    (onStoreChange: () => void) => {
      // Subscribe to same-tab changes via internal store
      const unsubscribeStore = subscribe(key, onStoreChange);

      // Note: sessionStorage doesn't fire storage events for changes in the same tab,
      // and changes in other tabs don't affect this tab's sessionStorage.
      // So we only use the internal store for synchronization.

      return () => {
        unsubscribeStore();
      };
    },
    [key]
  );

  // getSnapshot: Read current value from sessionStorage with caching
  const getSnapshot = useCallback((): T => {
    if (!isClient) {
      return resolveInitialValue(initialValueRef.current);
    }

    try {
      const rawValue = window.sessionStorage.getItem(key);

      // Check cache: if rawValue is the same, return cached parsed value
      if (cacheRef.current && cacheRef.current.rawValue === rawValue) {
        return cacheRef.current.parsedValue;
      }

      // Parse new value
      let parsedValue: T;
      if (rawValue !== null) {
        parsedValue = deserializerRef.current(rawValue);
      } else {
        parsedValue = resolveInitialValue(initialValueRef.current);
      }

      // Update cache
      cacheRef.current = { rawValue, parsedValue };

      return parsedValue;
    } catch (error) {
      onErrorRef.current?.(error as Error);
      const fallbackValue = resolveInitialValue(initialValueRef.current);
      cacheRef.current = { rawValue: null, parsedValue: fallbackValue };
      return fallbackValue;
    }
  }, [key, isClient]);

  // getServerSnapshot: Return initial value for SSR
  const getServerSnapshot = useCallback((): T => {
    return resolveInitialValue(initialValueRef.current);
  }, []);

  // Use useSyncExternalStore for synchronized state
  const storedValue = useSyncExternalStore(
    subscribeToStore,
    getSnapshot,
    getServerSnapshot
  );

  // setValue - stable reference that updates sessionStorage and notifies listeners
  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (value) => {
      try {
        // Get current value for functional updates
        const currentValue = (() => {
          try {
            const item = window.sessionStorage.getItem(key);
            if (item !== null) {
              return deserializerRef.current(item);
            }
            return resolveInitialValue(initialValueRef.current);
          } catch {
            return resolveInitialValue(initialValueRef.current);
          }
        })();

        const valueToStore =
          value instanceof Function ? value(currentValue) : value;

        if (typeof window !== "undefined") {
          const serialized = serializerRef.current(valueToStore);
          window.sessionStorage.setItem(key, serialized);

          // Invalidate cache so next getSnapshot reads fresh value
          cacheRef.current = {
            rawValue: serialized,
            parsedValue: valueToStore,
          };

          // Notify all same-tab listeners
          notifyListeners(key);
        }
      } catch (error) {
        onErrorRef.current?.(error as Error);
      }
    },
    [key]
  );

  // removeValue - stable reference
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(key);

        // Invalidate cache
        const initialVal = resolveInitialValue(initialValueRef.current);
        cacheRef.current = { rawValue: null, parsedValue: initialVal };

        // Notify all same-tab listeners
        notifyListeners(key);
      }
    } catch (error) {
      onErrorRef.current?.(error as Error);
    }
  }, [key]);

  return [storedValue, setValue, removeValue] as const;
}
