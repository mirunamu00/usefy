import { useCallback, useEffect, useRef, useState } from "react";

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
 * A hook for persisting state in sessionStorage.
 * Works like useState but persists the value in sessionStorage for the duration of the browser session.
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
  serializerRef.current = serializer;
  deserializerRef.current = deserializer;
  onErrorRef.current = onError;

  // Store initialValue in ref for use in removeValue
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  // SSR check
  const isClient = typeof window !== "undefined";

  // Lazy initialization with sessionStorage read
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return resolveInitialValue(initialValue);
    }

    try {
      const item = window.sessionStorage.getItem(key);
      if (item !== null) {
        return deserializerRef.current(item);
      }
      return resolveInitialValue(initialValue);
    } catch (error) {
      onErrorRef.current?.(error as Error);
      return resolveInitialValue(initialValue);
    }
  });

  // Store current value in ref for stable setValue reference
  const storedValueRef = useRef<T>(storedValue);
  storedValueRef.current = storedValue;

  // setValue - stable reference (only depends on key)
  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (value) => {
      try {
        const currentValue = storedValueRef.current;
        const valueToStore =
          value instanceof Function ? value(currentValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            key,
            serializerRef.current(valueToStore)
          );
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
      const initial = resolveInitialValue(initialValueRef.current);
      setStoredValue(initial);

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      onErrorRef.current?.(error as Error);
    }
  }, [key]);

  // Re-read value when key changes
  useEffect(() => {
    if (!isClient) {
      return;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      if (item !== null) {
        setStoredValue(deserializerRef.current(item));
      } else {
        setStoredValue(resolveInitialValue(initialValueRef.current));
      }
    } catch {
      setStoredValue(resolveInitialValue(initialValueRef.current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue, removeValue] as const;
}
