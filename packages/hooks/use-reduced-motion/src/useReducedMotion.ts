import { useEffect, useState } from "react";

/**
 * Options for the useReducedMotion hook.
 */
export interface UseReducedMotionOptions {
  /**
   * Value returned on the server / when `matchMedia` is unavailable.
   * @default false
   */
  defaultValue?: boolean;
}

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function isSupported(): boolean {
  return (
    typeof window !== "undefined" && typeof window.matchMedia === "function"
  );
}

/**
 * Tracks the user's `prefers-reduced-motion` accessibility setting, returning
 * `true` when the user has requested reduced motion. Updates live when the
 * system setting changes.
 *
 * Use it to disable or tone down animations for users who are sensitive to
 * motion — a baseline accessibility requirement.
 *
 * @param options - Configuration (SSR default value)
 * @returns `true` if the user prefers reduced motion
 *
 * @example
 * ```tsx
 * const reduced = useReducedMotion();
 * <div style={{ transition: reduced ? "none" : "transform 300ms" }} />;
 * ```
 */
export function useReducedMotion(
  options: UseReducedMotionOptions = {}
): boolean {
  const { defaultValue = false } = options;

  const [reduced, setReduced] = useState<boolean>(() => {
    if (!isSupported()) {
      return defaultValue;
    }
    return window.matchMedia(REDUCE_QUERY).matches;
  });

  useEffect(() => {
    if (!isSupported()) {
      return;
    }

    const mediaQueryList = window.matchMedia(REDUCE_QUERY);
    const handleChange = () => {
      setReduced(mediaQueryList.matches);
    };

    handleChange();

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleChange);
      return () => mediaQueryList.removeEventListener("change", handleChange);
    }

    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, []);

  return reduced;
}
