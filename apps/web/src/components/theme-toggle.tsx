"use client";

import { useDarkMode } from "@usefy/use-dark-mode";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Avoid hydration mismatch: render a neutral icon until mounted on the client. */
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * Light/dark toggle. Dogfoods @usefy/use-dark-mode, writing `data-theme` on
 * <html> — the same attribute the pre-paint script and CSS read.
 */
export function ThemeToggle() {
  const mounted = useMounted();
  const { isDark, toggle } = useDarkMode({ attribute: "data-theme" });
  // `isDark` is server-false but client-true for dark visitors — gate anything
  // rendered (icon AND label) behind `mounted` to avoid a hydration mismatch.
  const dark = mounted && isDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="focusable inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
    >
      {dark ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
