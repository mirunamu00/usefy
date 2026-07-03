/**
 * Theme mode. `"system"` follows the OS `prefers-color-scheme`; `"light"` and
 * `"dark"` are explicit overrides.
 */
export type DarkModeMode = "system" | "light" | "dark";

/**
 * Options for the useDarkMode hook.
 */
export interface UseDarkModeOptions {
  /**
   * Initial mode when nothing is stored yet.
   * @default "system"
   */
  defaultMode?: DarkModeMode;

  /**
   * localStorage key used to persist the chosen mode (and sync across tabs).
   * @default "usefy-dark-mode"
   */
  storageKey?: string;

  /**
   * Element the theme is applied to. Defaults to `document.documentElement`
   * (the `<html>` element). `null` (or omitting it) resolves to `<html>`.
   */
  element?: HTMLElement | null;

  /**
   * When set, the theme is written as this attribute
   * (`element.setAttribute(attribute, "dark" | "light")`), e.g. `"data-theme"`.
   * When omitted, `darkClass` is toggled on the element's `classList`
   * (Tailwind-style: the class is present when dark).
   */
  attribute?: string;

  /**
   * Class toggled on the element when `attribute` is not provided.
   * @default "dark"
   */
  darkClass?: string;
}

/**
 * Return value of the useDarkMode hook.
 */
export interface UseDarkModeReturn {
  /**
   * The current mode (`"system" | "light" | "dark"`).
   */
  mode: DarkModeMode;
  /**
   * The resolved theme — `true` when the effective theme is dark (taking
   * `"system"` into account).
   */
  isDark: boolean;
  /**
   * Set the mode explicitly and persist it.
   */
  setMode: (mode: DarkModeMode) => void;
  /**
   * Flip between explicit `"light"` and `"dark"` based on the current theme.
   */
  toggle: () => void;
  /**
   * Shortcut for `setMode("dark")`.
   */
  enable: () => void;
  /**
   * Shortcut for `setMode("light")`.
   */
  disable: () => void;
}
