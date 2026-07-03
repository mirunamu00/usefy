import { useEffect, useState } from "react";
import type { UseMediaQueryOptions } from "./types";
import { getMatches, isMatchMediaSupported } from "./utils";

/**
 * Tracks whether a CSS media query currently matches, updating on change.
 *
 * Built on `window.matchMedia` with a modern `change` listener (and a legacy
 * `addListener` fallback). SSR-safe: returns `defaultValue` on the server and,
 * optionally, on the first client render to avoid hydration mismatches.
 *
 * @param query - A CSS media query, e.g. `"(min-width: 1024px)"` or
 * `"(prefers-color-scheme: dark)"`
 * @param options - Configuration (SSR default value, eager initialization)
 * @returns `true` when the query matches, else `false`
 *
 * @example
 * ```tsx
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 * return isDesktop ? <DesktopNav /> : <MobileNav />;
 * ```
 *
 * @example
 * ```tsx
 * // SSR: keep the first client render matching the server output
 * const isWide = useMediaQuery("(min-width: 1024px)", {
 *   defaultValue: false,
 *   initializeWithValue: false,
 * });
 * ```
 */
export function useMediaQuery(
  query: string,
  options: UseMediaQueryOptions = {}
): boolean {
  const { defaultValue = false, initializeWithValue = true } = options;

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query, defaultValue);
    }
    return defaultValue;
  });

  useEffect(() => {
    if (!isMatchMediaSupported()) {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    const handleChange = () => {
      setMatches(mediaQueryList.matches);
    };

    // Sync immediately in case the query changed since the last render.
    handleChange();

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleChange);
      return () => mediaQueryList.removeEventListener("change", handleChange);
    }

    // Legacy Safari (< 14) fallback.
    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, [query]);

  return matches;
}
