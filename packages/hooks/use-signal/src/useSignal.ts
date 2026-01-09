import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  subscribe,
  getSnapshot as getStoreSnapshot,
  emit as storeEmit,
  getSubscriberCount,
  getEmitCount,
  getTimestamp,
  getData,
} from "./store";

/**
 * Signal metadata object for debugging and monitoring
 */
export interface SignalInfo<T = unknown> {
  /** Signal subscription name */
  name: string;
  /** Current number of active subscribers */
  subscriberCount: number;
  /** Timestamp of last emit (Date.now()) */
  timestamp: number;
  /** Total number of times this signal has been emitted */
  emitCount: number;
  /** Data passed with the last emit */
  data: T | undefined;
}

/**
 * Options for useSignal hook
 */
export interface SignalOptions {
  /** Automatically emit when component mounts */
  emitOnMount?: boolean;
  /** Callback executed when emit is called */
  onEmit?: () => void;
  /** Conditionally enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Debounce emit calls in milliseconds */
  debounce?: number;
}

/**
 * Return type for useSignal hook
 */
export interface UseSignalReturn<T = unknown> {
  /** Current signal version number - use in dependency arrays */
  signal: number;
  /** Function to emit the signal and notify all subscribers, optionally with data */
  emit: (data?: T) => void;
  /** Stable metadata object for debugging and monitoring */
  info: SignalInfo<T>;
}

/**
 * A hook for event-driven communication between components without prop drilling.
 * Components subscribe to a shared signal by name. When any component emits,
 * all subscribers receive a new version number.
 *
 * @param name - Unique identifier string for the signal channel
 * @param options - Configuration options
 * @returns Object containing signal value, emit function, and info metadata
 *
 * @example
 * ```tsx
 * // Parent Component - emits signal
 * function ParentComponent() {
 *   const { emit } = useSignal("Dashboard Refresh");
 *
 *   return <button onClick={emit}>Refresh All</button>;
 * }
 *
 * // Child Component - subscribes to signal
 * function DataTable() {
 *   const { signal } = useSignal("Dashboard Refresh");
 *
 *   useEffect(() => {
 *     fetchTableData();
 *   }, [signal]);
 *
 *   return <table>...</table>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With debugging info
 * function MonitoredComponent() {
 *   const { signal, emit, info } = useSignal("API Sync", {
 *     onEmit: () => console.log("Syncing...")
 *   });
 *
 *   useEffect(() => {
 *     syncData();
 *     console.log(`Sync #${info.emitCount} with ${info.subscriberCount} listeners`);
 *   }, [signal]);
 *
 *   return <button onClick={emit}>Sync</button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With data payload
 * function DataEmitter() {
 *   const { emit } = useSignal<{ userId: string }>("user-action");
 *
 *   const handleClick = (userId: string) => {
 *     emit({ userId });
 *   };
 *
 *   return <button onClick={() => handleClick("123")}>Action</button>;
 * }
 *
 * function DataReceiver() {
 *   const { signal, info } = useSignal<{ userId: string }>("user-action");
 *
 *   useEffect(() => {
 *     if (info.data) {
 *       console.log("User action for:", info.data.userId);
 *     }
 *   }, [signal]);
 *
 *   return <div>Listening...</div>;
 * }
 * ```
 */
export function useSignal<T = unknown>(
  name: string,
  options: SignalOptions = {}
): UseSignalReturn<T> {
  const {
    emitOnMount = false,
    onEmit,
    enabled = true,
    debounce,
  } = options;

  // Store options in refs for stable references
  const onEmitRef = useRef(onEmit);
  onEmitRef.current = onEmit;

  // Stable name ref for info object
  const nameRef = useRef(name);
  nameRef.current = name;

  // Info object with stable reference using getters for live data
  const infoRef = useRef<SignalInfo<T> | null>(null);
  if (!infoRef.current) {
    infoRef.current = {
      get name() {
        return nameRef.current;
      },
      get subscriberCount() {
        return getSubscriberCount(nameRef.current);
      },
      get timestamp() {
        return getTimestamp(nameRef.current);
      },
      get emitCount() {
        return getEmitCount(nameRef.current);
      },
      get data() {
        return getData(nameRef.current) as T | undefined;
      },
    } as SignalInfo<T>;
  }

  // Subscribe function for useSyncExternalStore
  const subscribeToStore = useCallback(
    (onStoreChange: () => void) => {
      if (!enabled) {
        return () => {};
      }
      return subscribe(name, onStoreChange);
    },
    [name, enabled]
  );

  // Get snapshot function
  const getSnapshot = useCallback((): number => {
    if (!enabled) {
      return 0;
    }
    return getStoreSnapshot(name);
  }, [name, enabled]);

  // Server snapshot (always 0 for SSR)
  const getServerSnapshot = useCallback((): number => {
    return 0;
  }, []);

  // Use useSyncExternalStore for synchronized state
  const signal = useSyncExternalStore(
    subscribeToStore,
    getSnapshot,
    getServerSnapshot
  );

  // Base emit function
  const baseEmit = useCallback(
    (data?: T) => {
      storeEmit(name, data);
      onEmitRef.current?.();
    },
    [name]
  );

  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store the latest data for debounced emit
  const pendingDataRef = useRef<T | undefined>(undefined);

  // Debounced or regular emit
  const emit = useMemo(() => {
    if (!debounce || debounce <= 0) {
      return baseEmit;
    }

    return (data?: T) => {
      // Store the latest data
      pendingDataRef.current = data;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        baseEmit(pendingDataRef.current);
        pendingDataRef.current = undefined;
        debounceTimerRef.current = null;
      }, debounce);
    };
  }, [baseEmit, debounce]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Emit on mount if option is set
  useEffect(() => {
    if (emitOnMount) {
      baseEmit();
    }
  }, [emitOnMount, baseEmit]);

  return {
    signal,
    emit,
    info: infoRef.current!,
  };
}
