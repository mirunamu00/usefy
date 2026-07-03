import { useEffect, useState } from "react";

/**
 * The user's preferred color scheme.
 */
export type ColorScheme = "light" | "dark";

/**
 * Options for the usePreferredColorScheme hook.
 */
export interface UsePreferredColorSchemeOptions {
  /**
   * Scheme returned on the server / when `matchMedia` is unavailable.
   * @default "light"
   */
  defaultScheme?: ColorScheme;
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

function isSupported(): boolean {
  return (
    typeof window !== "undefined" && typeof window.matchMedia === "function"
  );
}

/**
 * Tracks the user's OS/browser color-scheme preference
 * (`prefers-color-scheme`), returning `"light"` or `"dark"` and updating live
 * when the system setting changes.
 *
 * This is the primitive that reflects the *system* preference; for a full
 * theme with manual override and persistence use `useDarkMode`.
 *
 * @param options - Configuration (SSR default scheme)
 * @returns `"light"` or `"dark"`
 *
 * @example
 * ```tsx
 * const scheme = usePreferredColorScheme();
 * return <div className={scheme === "dark" ? "theme-dark" : "theme-light"} />;
 * ```
 */
export function usePreferredColorScheme(
  options: UsePreferredColorSchemeOptions = {}
): ColorScheme {
  const { defaultScheme = "light" } = options;

  const [scheme, setScheme] = useState<ColorScheme>(() => {
    if (!isSupported()) {
      return defaultScheme;
    }
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  });

  useEffect(() => {
    if (!isSupported()) {
      return;
    }

    const mediaQueryList = window.matchMedia(DARK_QUERY);
    const handleChange = () => {
      setScheme(mediaQueryList.matches ? "dark" : "light");
    };

    handleChange();

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleChange);
      return () => mediaQueryList.removeEventListener("change", handleChange);
    }

    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, []);

  return scheme;
}
