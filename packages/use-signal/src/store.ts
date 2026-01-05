/**
 * Internal Signal Store for cross-component communication
 * This module manages signal versions and subscribers for the useSignal hook.
 *
 * @internal This module is not exported publicly
 */

/** Signal data structure for each named signal */
interface SignalData {
  version: number;
  subscribers: Set<() => void>;
  emitCount: number;
  timestamp: number;
  data: unknown;
}

/** Map of signal name -> SignalData */
const signalStore = new Map<string, SignalData>();

/**
 * Get or create signal data for a given name
 * @param name - The signal name
 * @returns SignalData object
 */
function getOrCreateSignal(name: string): SignalData {
  if (!signalStore.has(name)) {
    signalStore.set(name, {
      version: 0,
      subscribers: new Set(),
      emitCount: 0,
      timestamp: 0,
      data: undefined,
    });
  }
  return signalStore.get(name)!;
}

/**
 * Subscribe a listener to changes for a specific signal name
 * @param name - The signal name to subscribe to
 * @param listener - Callback to invoke when the signal is emitted
 * @returns Unsubscribe function
 */
export function subscribe(name: string, listener: () => void): () => void {
  const signal = getOrCreateSignal(name);
  signal.subscribers.add(listener);

  return () => {
    signal.subscribers.delete(listener);

    // Cleanup: remove the signal entry if no more subscribers and never emitted
    if (signal.subscribers.size === 0 && signal.emitCount === 0) {
      signalStore.delete(name);
    }
  };
}

/**
 * Get the current version number for a signal
 * @param name - The signal name
 * @returns Current version number (0 if signal doesn't exist)
 */
export function getSnapshot(name: string): number {
  const signal = signalStore.get(name);
  return signal?.version ?? 0;
}

/**
 * Emit a signal - update data, increment version, update metadata, and notify all subscribers
 * Data is set BEFORE version increment to ensure useEffect callbacks see the latest data.
 * @param name - The signal name to emit
 * @param data - Optional data to pass with the signal
 */
export function emit(name: string, data?: unknown): void {
  const signal = getOrCreateSignal(name);

  // Set data FIRST before incrementing version
  // This ensures that when useEffect runs due to signal change,
  // info.data already contains the latest value
  signal.data = data;

  signal.version += 1;
  signal.emitCount += 1;
  signal.timestamp = Date.now();

  // Notify all subscribers
  signal.subscribers.forEach((listener) => listener());
}

/**
 * Get the current subscriber count for a signal
 * @param name - The signal name
 * @returns Number of active subscribers
 */
export function getSubscriberCount(name: string): number {
  return signalStore.get(name)?.subscribers.size ?? 0;
}

/**
 * Get the total emit count for a signal
 * @param name - The signal name
 * @returns Total number of times the signal has been emitted
 */
export function getEmitCount(name: string): number {
  return signalStore.get(name)?.emitCount ?? 0;
}

/**
 * Get the last emit timestamp for a signal
 * @param name - The signal name
 * @returns Timestamp of last emit (0 if never emitted)
 */
export function getTimestamp(name: string): number {
  return signalStore.get(name)?.timestamp ?? 0;
}

/**
 * Get the data passed with the last emit for a signal
 * @param name - The signal name
 * @returns Data from last emit (undefined if never emitted or no data)
 */
export function getData(name: string): unknown {
  return signalStore.get(name)?.data;
}

/**
 * Clear all signals (for testing purposes)
 * @internal
 */
export function clearAllSignals(): void {
  signalStore.clear();
}
