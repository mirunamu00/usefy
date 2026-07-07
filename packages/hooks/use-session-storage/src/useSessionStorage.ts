import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
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

  // getSnapshot: Read current value from sessionStorage with caching.
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
      rawValue = window.sessionStorage.getItem(key);
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

  // setValue - stable reference that updates sessionStorage and notifies listeners
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
              const item = window.sessionStorage.getItem(key);
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
        if (serialized === window.sessionStorage.getItem(key)) {
          return;
        }

        window.sessionStorage.setItem(key, serialized);

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
