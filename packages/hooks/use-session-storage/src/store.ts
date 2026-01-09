/**
 * Internal Store Manager for sessionStorage synchronization
 * This module manages listeners for same-tab synchronization across components
 * using the same sessionStorage key.
 *
 * @internal This module is not exported publicly
 */

/** Map of key -> Set of listener callbacks */
const listeners = new Map<string, Set<() => void>>();

/**
 * Subscribe a listener to changes for a specific key
 * @param key - The sessionStorage key to subscribe to
 * @param listener - Callback to invoke when the key's value changes
 * @returns Unsubscribe function
 */
export function subscribe(key: string, listener: () => void): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }

  const keyListeners = listeners.get(key)!;
  keyListeners.add(listener);

  return () => {
    keyListeners.delete(listener);

    // Cleanup: remove the key entry if no more listeners
    if (keyListeners.size === 0) {
      listeners.delete(key);
    }
  };
}

/**
 * Notify all listeners subscribed to a specific key
 * This is called when setValue or removeValue is invoked
 * to synchronize all components using the same key in the same tab
 *
 * @param key - The sessionStorage key that was updated
 */
export function notifyListeners(key: string): void {
  const keyListeners = listeners.get(key);
  if (keyListeners) {
    keyListeners.forEach((listener) => listener());
  }
}

/**
 * Get the count of listeners for a key (for testing purposes)
 * @internal
 */
export function getListenerCount(key: string): number {
  return listeners.get(key)?.size ?? 0;
}

/**
 * Clear all listeners (for testing purposes)
 * @internal
 */
export function clearAllListeners(): void {
  listeners.clear();
}

