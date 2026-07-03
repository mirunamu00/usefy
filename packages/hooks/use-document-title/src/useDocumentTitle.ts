import { useEffect, useRef } from "react";

/**
 * Options for the useDocumentTitle hook.
 */
export interface UseDocumentTitleOptions {
  /**
   * Restore the title that was present when the component mounted when it
   * unmounts.
   * @default false
   */
  restoreOnUnmount?: boolean;
}

/**
 * Sets `document.title` to the given value, keeping it in sync as `title`
 * changes. Optionally restores the original title on unmount.
 *
 * SSR-safe: does nothing when `document` is unavailable.
 *
 * @param title - The title to set
 * @param options - Configuration (`restoreOnUnmount`)
 *
 * @example
 * ```tsx
 * useDocumentTitle(`Inbox (${unread})`);
 * ```
 *
 * @example
 * ```tsx
 * // Restore the previous title when this screen unmounts
 * useDocumentTitle("Checkout", { restoreOnUnmount: true });
 * ```
 */
export function useDocumentTitle(
  title: string,
  options: UseDocumentTitleOptions = {}
): void {
  const { restoreOnUnmount = false } = options;

  // Capture the title present at mount, once, so it can be restored later.
  const originalTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (originalTitleRef.current === null) {
      originalTitleRef.current = document.title;
    }
    document.title = title;
  }, [title]);

  useEffect(() => {
    return () => {
      if (
        restoreOnUnmount &&
        typeof document !== "undefined" &&
        originalTitleRef.current !== null
      ) {
        document.title = originalTitleRef.current;
      }
    };
    // Restore behavior is fixed at mount; intentionally not reacting to changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
