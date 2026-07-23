"use client";

import { ScrollProgress } from "@usefy/scroll-progress";

/**
 * The landing page's reading-progress bar — a real @usefy/scroll-progress
 * shipped to production. The site demos its own products.
 */
export function PageProgress() {
  return <ScrollProgress color="var(--brand)" height={2.5} zIndex={60} aria-label="Page scroll progress" />;
}
