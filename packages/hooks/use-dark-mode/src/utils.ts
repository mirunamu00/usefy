import type { DarkModeMode } from "./types";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Whether we're running in a browser environment.
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Whether the OS currently prefers a dark color scheme. Returns `false` in SSR
 * or when `matchMedia` is unavailable.
 */
export function prefersDark(): boolean {
  if (!isBrowser() || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(DARK_QUERY).matches;
}

/**
 * Resolve the effective dark state from a mode and the system preference.
 *
 * @example
 * ```ts
 * resolveIsDark("system", true); // true
 * resolveIsDark("light", true);  // false
 * ```
 */
export function resolveIsDark(mode: DarkModeMode, systemDark: boolean): boolean {
  if (mode === "system") {
    return systemDark;
  }
  return mode === "dark";
}

/**
 * Read the persisted mode from storage, falling back to `fallback` when absent,
 * invalid, or inaccessible.
 */
export function readStoredMode(
  storageKey: string,
  fallback: DarkModeMode
): DarkModeMode {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === "system" || raw === "light" || raw === "dark") {
      return raw;
    }
  } catch {
    // Access can throw (privacy mode, disabled storage) — fall through.
  }
  return fallback;
}

/**
 * Persist the mode to storage, ignoring failures (quota, disabled storage).
 */
export function writeStoredMode(storageKey: string, mode: DarkModeMode): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, mode);
  } catch {
    // Ignore write failures.
  }
}

/**
 * Apply the theme to an element — either as an attribute or a toggled class.
 */
export function applyTheme(
  element: HTMLElement,
  isDark: boolean,
  attribute: string | undefined,
  darkClass: string
): void {
  if (attribute) {
    element.setAttribute(attribute, isDark ? "dark" : "light");
  } else {
    element.classList.toggle(darkClass, isDark);
  }
}
