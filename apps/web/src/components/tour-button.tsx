"use client";

import { startSiteTour } from "@/lib/tour-event";

/**
 * Starts the landing tour from anywhere on the page. Kept separate from
 * <SiteTour> so triggers don't pull the SpotlightTour chunk.
 */
export function TourButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={startSiteTour}>
      {children}
    </button>
  );
}
