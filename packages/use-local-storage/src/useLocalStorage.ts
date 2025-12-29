import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Type for initial value that can be a value or a function returning a value (lazy initialization)
 */
export type InitialValue<T> = T | (() => T);

/**
 * Options for useLocalStorage hook
 */
export interface UseLocalStorageOptions<T> {
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
   * Whether to sync value across browser tabs via storage event
   * @default true
   */
  syncTabs?: boolean;
  /**
   * Callback function called when an error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for useLocalStorage hook - tuple similar to useState
 */
export type UseLocalStorageReturn<T> = readonly [
  /** Current stored value */
  T,
  /** Function to update the value (same signature as useState setter) */
  React.Dispatch<React.SetStateAction<T>>,
  /** Function to remove the value from localStorage */
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
 * A hook for persisting state in localStorage with automatic synchronization.
 * Works like useState but persists the value in localStorage.
 *
 * @template T - The type of the stored value
 * @param key - The localStorage key to store the value under
 * @param initialValue - Initial value or function returning initial value (lazy initialization)
 * @param options - Configuration options for serialization, sync, and error handling
 * @returns A tuple of [storedValue, setValue, removeValue]
 *
 * @example
 * ```tsx
 * // Basic usage with string
 * function ThemeToggle() {
 *   const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
 *
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={() => setTheme('dark')}>Dark</button>
 *       <button onClick={() => setTheme('light')}>Light</button>
 *       <button onClick={removeTheme}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With object type
 * interface UserSettings {
 *   notifications: boolean;
 *   language: string;
 * }
 *
 * const [settings, setSettings] = useLocalStorage<UserSettings>('settings', {
 *   notifications: true,
 *   language: 'en',
 * });
 *
 * // Functional update
 * setSettings(prev => ({ ...prev, notifications: false }));
 * ```
 *
 * @example
 * ```tsx
 * // With lazy initialization
 * const [config, setConfig] = useLocalStorage('config', () => computeExpensiveDefault());
 * ```
 *
 * @example
 * ```tsx
 * // With custom serializer/deserializer
 * const [date, setDate] = useLocalStorage<Date>('lastVisit', new Date(), {
 *   serializer: (d) => d.toISOString(),
 *   deserializer: (s) => new Date(s),
 * });
 * ```
 *
 * @example
 * ```tsx
 * // With error handling
 * const [value, setValue] = useLocalStorage('key', 'default', {
 *   onError: (error) => console.error('Storage error:', error),
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: InitialValue<T>,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    syncTabs = true,
    onError,
  } = options;

  // Store options in refs for stable references and access to latest values
  const serializerRef = useRef(serializer);
  const deserializerRef = useRef(deserializer);
  const onErrorRef = useRef(onError);
  serializerRef.current = serializer;
  deserializerRef.current = deserializer;
  onErrorRef.current = onError;

  // Store initialValue in ref for use in removeValue and storage event handler
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  // SSR check - check once at module level for consistency
  const isClient = typeof window !== "undefined";

  // Lazy initialization with localStorage read
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return resolveInitialValue(initialValue);
    }

    try {
      const item = window.localStorage.getItem(key);
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
          window.localStorage.setItem(
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
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      onErrorRef.current?.(error as Error);
    }
  }, [key]);

  // Cross-tab synchronization via storage event
  useEffect(() => {
    if (!isClient || !syncTabs) {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key) {
        return;
      }

      if (event.newValue !== null) {
        try {
          setStoredValue(deserializerRef.current(event.newValue));
        } catch {
          // If parsing fails, reset to initial value
          setStoredValue(resolveInitialValue(initialValueRef.current));
        }
      } else {
        // Key was removed in another tab
        setStoredValue(resolveInitialValue(initialValueRef.current));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, syncTabs, isClient]);

  // Re-read value when key changes
  useEffect(() => {
    if (!isClient) {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
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
