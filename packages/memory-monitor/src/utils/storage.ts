/**
 * Check if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

/**
 * Safely get item from localStorage
 * Returns null if not in browser or if key doesn't exist
 *
 * @param key - Storage key
 * @returns Stored value or null
 */
export function safeGetItem(key: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    // Handle cases where localStorage is blocked (e.g., private browsing)
    return null;
  }
}

/**
 * Safely set item in localStorage
 * No-op if not in browser
 *
 * @param key - Storage key
 * @param value - Value to store
 * @returns Whether the operation succeeded
 */
export function safeSetItem(key: string, value: string): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    // Handle cases where localStorage is full or blocked
    return false;
  }
}

/**
 * Safely remove item from localStorage
 * No-op if not in browser
 *
 * @param key - Storage key
 * @returns Whether the operation succeeded
 */
export function safeRemoveItem(key: string): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely get and parse JSON from localStorage
 *
 * @param key - Storage key
 * @param defaultValue - Default value if not found or parse fails
 * @returns Parsed value or default
 */
export function safeGetJSON<T>(key: string, defaultValue: T): T {
  const item = safeGetItem(key);
  if (item === null) {
    return defaultValue;
  }

  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely stringify and set JSON to localStorage
 *
 * @param key - Storage key
 * @param value - Value to store
 * @returns Whether the operation succeeded
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
