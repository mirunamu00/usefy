import { useState, useCallback, useEffect, useRef } from "react";
import type { PanelSettings } from "../types";
import { DEFAULT_SETTINGS, DEFAULT_STORAGE_KEY } from "../constants";
import { safeGetJSON, safeSetJSON, isBrowser } from "../utils/storage";

/**
 * Options for useSettings hook
 */
export interface UseSettingsOptions {
  /** Storage key for persistence */
  storageKey?: string;
  /** Whether to persist settings */
  persist?: boolean;
  /** Initial settings override */
  initialSettings?: Partial<PanelSettings>;
}

/**
 * Return type for useSettings hook
 */
export interface UseSettingsReturn {
  /** Current settings */
  settings: PanelSettings;
  /** Update settings (partial update) */
  updateSettings: (updates: Partial<PanelSettings>) => void;
  /** Reset settings to defaults */
  resetSettings: () => void;
  /** Whether settings have been loaded */
  isLoaded: boolean;
}

/**
 * Debounce function for saving settings
 */
function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T;
}

/**
 * Hook to manage panel settings with optional persistence
 *
 * @param options - Configuration options
 * @returns Settings and update functions
 *
 * @example
 * ```tsx
 * const { settings, updateSettings } = useSettings({
 *   storageKey: 'my-panel-settings',
 *   persist: true,
 * });
 *
 * // Update a single setting
 * updateSettings({ warningThreshold: 80 });
 * ```
 */
export function useSettings(options: UseSettingsOptions = {}): UseSettingsReturn {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    persist = true,
    initialSettings = {},
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState<PanelSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  }));

  // Ref to track if we should save
  const shouldSaveRef = useRef(false);

  // Load settings from storage on mount
  useEffect(() => {
    if (!isBrowser() || !persist) {
      setIsLoaded(true);
      return;
    }

    const stored = safeGetJSON<Partial<PanelSettings>>(storageKey, {});
    setSettings((prev) => ({
      ...prev,
      ...stored,
    }));
    setIsLoaded(true);
  }, [storageKey, persist]);

  // Debounced save function
  const saveToStorage = useCallback(
    debounce((settingsToSave: PanelSettings) => {
      if (persist && isBrowser()) {
        safeSetJSON(storageKey, settingsToSave);
      }
    }, 500),
    [storageKey, persist]
  );

  // Save settings when they change
  useEffect(() => {
    if (shouldSaveRef.current && isLoaded) {
      saveToStorage(settings);
    }
    shouldSaveRef.current = true;
  }, [settings, saveToStorage, isLoaded]);

  const updateSettings = useCallback((updates: Partial<PanelSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS, ...initialSettings });
    if (persist && isBrowser()) {
      safeSetJSON(storageKey, { ...DEFAULT_SETTINGS, ...initialSettings });
    }
  }, [initialSettings, persist, storageKey]);

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoaded,
  };
}
