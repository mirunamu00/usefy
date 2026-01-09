import { useState, useEffect, useCallback } from "react";
import type { ThemeSetting } from "../types";
import { isSSR } from "../utils/environment";

/**
 * Resolved theme (actual theme being applied)
 */
export type ResolvedTheme = "light" | "dark";

/**
 * Options for useTheme hook
 */
export interface UseThemeOptions {
  /** Theme setting (light, dark, or system) */
  theme?: ThemeSetting;
  /** Callback when resolved theme changes */
  onThemeChange?: (theme: ResolvedTheme) => void;
}

/**
 * Return type for useTheme hook
 */
export interface UseThemeReturn {
  /** Current theme setting */
  themeSetting: ThemeSetting;
  /** Resolved theme (light or dark) */
  resolvedTheme: ResolvedTheme;
  /** Whether system prefers dark mode */
  systemPrefersDark: boolean;
  /** Set the theme */
  setTheme: (theme: ThemeSetting) => void;
  /** Toggle between light and dark */
  toggleTheme: () => void;
}

/**
 * Get system color scheme preference
 */
function getSystemPreference(): boolean {
  if (isSSR()) {
    return false;
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

/**
 * Resolve theme setting to actual theme
 */
function resolveTheme(
  setting: ThemeSetting,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (setting === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return setting;
}

/**
 * Hook to manage theme with system preference detection
 *
 * @param options - Configuration options
 * @returns Theme state and control functions
 *
 * @example
 * ```tsx
 * const { resolvedTheme, toggleTheme } = useTheme({
 *   theme: 'system',
 * });
 *
 * return (
 *   <div className={resolvedTheme === 'dark' ? 'dark' : ''}>
 *     <button onClick={toggleTheme}>Toggle Theme</button>
 *   </div>
 * );
 * ```
 */
export function useTheme(options: UseThemeOptions = {}): UseThemeReturn {
  const { theme: themeProp = "system", onThemeChange } = options;

  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(themeProp);
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPreference);

  // Sync with external theme prop changes
  useEffect(() => {
    setThemeSetting(themeProp);
  }, [themeProp]);

  // Listen for system preference changes
  useEffect(() => {
    if (isSSR()) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    // Legacy browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Resolve current theme
  const resolvedTheme = resolveTheme(themeSetting, systemPrefersDark);

  // Notify on theme change
  useEffect(() => {
    onThemeChange?.(resolvedTheme);
  }, [resolvedTheme, onThemeChange]);

  const setTheme = useCallback((theme: ThemeSetting) => {
    setThemeSetting(theme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeSetting((prev) => {
      if (prev === "system") {
        // If system, toggle to opposite of current resolved
        return systemPrefersDark ? "light" : "dark";
      }
      return prev === "light" ? "dark" : "light";
    });
  }, [systemPrefersDark]);

  return {
    themeSetting,
    resolvedTheme,
    systemPrefersDark,
    setTheme,
    toggleTheme,
  };
}
