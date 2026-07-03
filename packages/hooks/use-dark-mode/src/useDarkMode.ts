import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DarkModeMode,
  UseDarkModeOptions,
  UseDarkModeReturn,
} from "./types";
import {
  applyTheme,
  isBrowser,
  prefersDark,
  readStoredMode,
  resolveIsDark,
  writeStoredMode,
} from "./utils";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Dark mode with three modes (`system` / `light` / `dark`), system detection,
 * `localStorage` persistence, cross-tab sync, and automatic DOM application.
 *
 * - `mode` is what the user chose; `isDark` is the resolved theme (with
 *   `"system"` following `prefers-color-scheme`).
 * - The theme is applied to `<html>` by default — a `dark` class (Tailwind
 *   style), or a custom `attribute` like `data-theme`.
 * - The chosen mode is persisted and kept in sync across tabs.
 *
 * @param options - Configuration (default mode, storage key, DOM target/style)
 * @returns `{ mode, isDark, setMode, toggle, enable, disable }`
 *
 * @example
 * ```tsx
 * const { isDark, toggle } = useDarkMode();
 * <button onClick={toggle}>{isDark ? "🌙" : "☀️"}</button>;
 * ```
 *
 * @example
 * ```tsx
 * // Three-way control + a custom attribute
 * const { mode, setMode } = useDarkMode({ attribute: "data-theme" });
 * <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
 *   <option value="system">System</option>
 *   <option value="light">Light</option>
 *   <option value="dark">Dark</option>
 * </select>;
 * ```
 *
 * @remarks
 * **SSR / hydration:** the initial `mode` is read from `localStorage` and the
 * system preference is read eagerly on the client, so the first client render
 * can differ from the server HTML (which has no access to either). If you
 * server-render, avoid a hydration mismatch by either (a) gating theme-dependent
 * markup behind an `useIsClient()`/mounted check, or (b) applying the stored
 * theme with a small blocking `<script>` in `<head>` before hydration.
 *
 * The `attribute`/`darkClass`/`element` options should have a **stable
 * identity** across renders; changing them is supported (the previous DOM write
 * is reverted) but is not a hot path.
 */
export function useDarkMode(
  options: UseDarkModeOptions = {}
): UseDarkModeReturn {
  const {
    defaultMode = "system",
    storageKey = "usefy-dark-mode",
    element,
    attribute,
    darkClass = "dark",
  } = options;

  const [mode, setModeState] = useState<DarkModeMode>(() =>
    readStoredMode(storageKey, defaultMode)
  );
  const [systemDark, setSystemDark] = useState<boolean>(() => prefersDark());

  // Track the system preference (only affects isDark while mode === "system").
  useEffect(() => {
    if (!isBrowser() || typeof window.matchMedia !== "function") {
      return;
    }
    const mediaQueryList = window.matchMedia(DARK_QUERY);
    const handleChange = () => setSystemDark(mediaQueryList.matches);
    handleChange();

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleChange);
      return () => mediaQueryList.removeEventListener("change", handleChange);
    }
    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, []);

  const isDark = resolveIsDark(mode, systemDark);

  // Apply the resolved theme to the DOM. If the target element or the
  // write-style (attribute vs class name) changes between renders, the previous
  // write is reverted first so no stale class/attribute is left behind. The
  // applied theme intentionally persists on unmount (theme hooks are usually
  // mounted once at the root).
  const appliedRef = useRef<{
    element: HTMLElement;
    attribute?: string;
    darkClass: string;
  } | null>(null);

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    const target = element ?? document.documentElement;

    const prev = appliedRef.current;
    if (
      prev &&
      (prev.element !== target ||
        prev.attribute !== attribute ||
        prev.darkClass !== darkClass)
    ) {
      if (prev.attribute) {
        prev.element.removeAttribute(prev.attribute);
      } else {
        prev.element.classList.remove(prev.darkClass);
      }
    }

    applyTheme(target, isDark, attribute, darkClass);
    appliedRef.current = { element: target, attribute, darkClass };
  }, [isDark, element, attribute, darkClass]);

  const setMode = useCallback(
    (next: DarkModeMode) => {
      setModeState(next);
      writeStoredMode(storageKey, next);
    },
    [storageKey]
  );

  // Sync mode across tabs.
  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) {
        return;
      }
      const next = event.newValue;
      if (next === "system" || next === "light" || next === "dark") {
        setModeState(next);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  const toggle = useCallback(() => {
    setMode(isDark ? "light" : "dark");
  }, [isDark, setMode]);

  const enable = useCallback(() => setMode("dark"), [setMode]);
  const disable = useCallback(() => setMode("light"), [setMode]);

  return { mode, isDark, setMode, toggle, enable, disable };
}
