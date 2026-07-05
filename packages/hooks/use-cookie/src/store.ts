/**
 * Internal Store Manager for cookie synchronization.
 * This module manages listeners for same-document synchronization across
 * components using the same cookie key.
 *
 * Unlike `localStorage`, cookies have no native `storage` event, so there is no
 * way to observe cross-tab writes without polling. This store therefore keeps
 * every `useCookie(key)` instance **within the same document** in sync: when one
 * instance writes or removes a cookie it notifies the others. Cross-tab
 * synchronization is intentionally not attempted (see the README).
 *
 * @internal This module is not exported publicly
 */

/** Map of key -> Set of listener callbacks */
const listeners = new Map<string, Set<() => void>>();

/**
 * Subscribe a listener to changes for a specific key
 * @param key - The cookie key to subscribe to
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
 * Notify all listeners subscribed to a specific key.
 * This is called when setValue or removeValue is invoked to synchronize all
 * components using the same key in the same document.
 *
 * @param key - The cookie key that was updated
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
