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
  /**
   * When `true` (default), the real `matchMedia` value is read synchronously on
   * the first client render. Set to `false` to render `defaultValue` on the
   * first client render too and defer the real read to a post-commit effect —
   * this avoids a React hydration mismatch when the server rendered
   * `defaultValue` but the user actually prefers reduced motion.
   * @default true
   */
  initializeWithValue?: boolean;
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
 * @param options - Configuration (`defaultValue`, `initializeWithValue`)
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
  const { defaultValue = false, initializeWithValue = true } = options;

  const [reduced, setReduced] = useState<boolean>(() => {
    if (!initializeWithValue || !isSupported()) {
      return defaultValue;
    }
    return window.matchMedia(REDUCE_QUERY).matches === true;
  });

  useEffect(() => {
    if (!isSupported()) {
      return;
    }

    const mediaQueryList = window.matchMedia(REDUCE_QUERY);
    const handleChange = () => {
      setReduced(mediaQueryList.matches === true);
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
