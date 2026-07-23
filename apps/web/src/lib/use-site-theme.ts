"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/**
 * The site's resolved theme. The site theme is a data attribute written by
 * use-dark-mode (manual toggle + system fallback), so themed embeds
 * (SpotlightTour, VirtualKeyboard) can't rely on their own "system" mode —
 * this tracks the attribute instead.
 */
export function useSiteTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribe, getSnapshot, () => "light");
}
