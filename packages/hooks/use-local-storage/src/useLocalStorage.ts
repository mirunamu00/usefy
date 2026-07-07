import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { subscribe, notifyListeners } from "./store";

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
 * Features:
 * - Same-tab synchronization: Multiple components using the same key will stay in sync
 * - Cross-tab synchronization: Changes in other tabs are automatically reflected
 * - SSR compatible: Works with Next.js, Remix, and other SSR frameworks
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
 * // Same-tab synchronization - both components stay in sync
 * function ComponentA() {
 *   const [user, setUser] = useLocalStorage('user', null);
 *   return <button onClick={() => setUser({ name: 'John' })}>Set User</button>;
 * }
 *
 * function ComponentB() {
 *   const [user] = useLocalStorage('user', null);
 *   // Automatically updates when ComponentA calls setUser!
 *   return <p>User: {user?.name}</p>;
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

  // Read errors are recorded here from the (pure) getSnapshot and flushed to
  // onError from a post-commit effect, so the user callback never fires during
  // render (which would double-fire under StrictMode).
  const readErrorRef = useRef<{ rawValue: string | null; error: Error } | null>(
    null
  );

  // Memoized server/initial snapshot so getServerSnapshot returns a stable
  // reference across calls (a fresh object each call triggers React's
  // "getServerSnapshot should be cached" infinite-loop warning).
  const serverSnapshotRef = useRef<{ value: T } | null>(null);
  const readServerSnapshot = useCallback((): T => {
    if (!serverSnapshotRef.current) {
      serverSnapshotRef.current = {
        value: resolveInitialValue(initialValueRef.current),
      };
    }
    return serverSnapshotRef.current.value;
  }, []);

  // SSR check
  const isClient = typeof window !== "undefined";

  // Subscribe function for useSyncExternalStore
  // Handles both same-tab and cross-tab synchronization
  const subscribeToStore = useCallback(
    (onStoreChange: () => void) => {
      // Subscribe to same-tab changes via internal store
      const unsubscribeStore = subscribe(key, onStoreChange);

      // Subscribe to cross-tab changes via storage event
      let handleStorageEvent: ((event: StorageEvent) => void) | null = null;

      if (isClient && syncTabs) {
        handleStorageEvent = (event: StorageEvent) => {
          // event.key === null is fired by localStorage.clear() and must also
          // reset this hook to its initial value.
          if (event.key === key || event.key === null) {
            onStoreChange();
          }
        };
        window.addEventListener("storage", handleStorageEvent);
      }

      // Cleanup function
      return () => {
        unsubscribeStore();
        if (handleStorageEvent) {
          window.removeEventListener("storage", handleStorageEvent);
        }
      };
    },
    [key, syncTabs, isClient]
  );

  // getSnapshot: Read current value from localStorage with caching.
  // MUST be pure and return a stable reference when the underlying raw string
  // is unchanged — otherwise useSyncExternalStore loops forever.
  const getSnapshot = useCallback((): T => {
    if (!isClient) {
      return readServerSnapshot();
    }

    // Read the raw string first; key the cache on the ACTUAL value so a corrupt
    // entry still produces a stable cache hit on the next read.
    let rawValue: string | null;
    try {
      rawValue = window.localStorage.getItem(key);
    } catch (error) {
      if (cacheRef.current && cacheRef.current.rawValue === null) {
        return cacheRef.current.parsedValue;
      }
      const fallbackValue = resolveInitialValue(initialValueRef.current);
      cacheRef.current = { rawValue: null, parsedValue: fallbackValue };
      readErrorRef.current = { rawValue: null, error: error as Error };
      return fallbackValue;
    }

    // Cache hit: same raw string as last read → return the same reference.
    if (cacheRef.current && cacheRef.current.rawValue === rawValue) {
      return cacheRef.current.parsedValue;
    }

    try {
      const parsedValue =
        rawValue !== null
          ? deserializerRef.current(rawValue)
          : resolveInitialValue(initialValueRef.current);
      cacheRef.current = { rawValue, parsedValue };
      return parsedValue;
    } catch (error) {
      // Corrupt value: cache the fallback keyed on the REAL rawValue so the next
      // getSnapshot is a cache hit (caching null here would loop forever). Record
      // the error for the post-commit flush instead of calling onError in render.
      const fallbackValue = resolveInitialValue(initialValueRef.current);
      cacheRef.current = { rawValue, parsedValue: fallbackValue };
      readErrorRef.current = { rawValue, error: error as Error };
      return fallbackValue;
    }
  }, [key, isClient, readServerSnapshot]);

  // getServerSnapshot: stable initial value for SSR.
  const getServerSnapshot = readServerSnapshot;

  // Use useSyncExternalStore for synchronized state
  const storedValue = useSyncExternalStore(
    subscribeToStore,
    getSnapshot,
    getServerSnapshot
  );

  // Flush read errors after commit (getSnapshot stays pure). Deduped by raw
  // value so onError fires once per distinct corrupt entry, not once per render.
  const reportedErrorRawRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const pending = readErrorRef.current;
    if (pending && reportedErrorRawRef.current !== pending.rawValue) {
      reportedErrorRawRef.current = pending.rawValue;
      onErrorRef.current?.(pending.error);
    }
  });

  // setValue - stable reference that updates localStorage and notifies listeners
  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (value) => {
      try {
        if (typeof window === "undefined") {
          return;
        }

        let valueToStore: T;
        if (value instanceof Function) {
          // Only read/deserialize the current value for functional updates.
          const currentValue = (() => {
            try {
              const item = window.localStorage.getItem(key);
              return item !== null
                ? deserializerRef.current(item)
                : resolveInitialValue(initialValueRef.current);
            } catch {
              return resolveInitialValue(initialValueRef.current);
            }
          })();
          valueToStore = (value as (prev: T) => T)(currentValue);
        } else {
          valueToStore = value;
        }

        const serialized = serializerRef.current(valueToStore);

        // No-op skip: unchanged serialized value → no write, no re-render churn.
        if (serialized === window.localStorage.getItem(key)) {
          return;
        }

        window.localStorage.setItem(key, serialized);

        // Prime the cache so the next getSnapshot returns this exact reference.
        cacheRef.current = { rawValue: serialized, parsedValue: valueToStore };

        // Notify all same-tab listeners
        notifyListeners(key);
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
        window.localStorage.removeItem(key);

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
