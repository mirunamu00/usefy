"use client";

import { useEffect, useRef } from "react";
import { SpotlightTour, type TourController, type TourStep } from "@usefy/spotlight-tour";
import { useSiteTheme } from "@/lib/use-site-theme";

const STEPS: TourStep[] = [
  {
    title: "This tour is a usefy product",
    content:
      "You're inside @usefy/spotlight-tour right now — the same component you can install. Arrow keys work, too.",
  },
  {
    target: "#hero-demo",
    title: "Live, not screenshots",
    content: "Every pane here runs the real package. Switch tabs and the code you see is the code that's running.",
    placement: "left",
  },
  {
    target: "#install",
    title: "One line to start",
    content: "Copy the install command. (Copying it celebrates with @usefy/confetti — try it after the tour.)",
    placement: "bottom",
  },
  {
    target: "#toolbox",
    title: "The toolbox",
    content: "One hooks umbrella, plus standalone components that ship on their own. Hover a card — each one demos itself.",
    placement: "top",
  },
  {
    target: "#standards",
    title: "The same bar everywhere",
    content: "Every package passes the same tests, SSR checks, and docs bar before it ships. That's the whole pitch.",
    placement: "top",
  },
];

/**
 * The actual @usefy/spotlight-tour instance. Loaded lazily by <SiteTour> on
 * the first start request; `startKey` increments to (re)start the tour.
 * Theme tracks the site's data-theme live (useSiteTheme), so toggling the
 * theme mid-tour restyles the tooltip.
 */
export function SiteTourImpl({ startKey }: { startKey: number }) {
  const controller = useRef<TourController>(null);
  const theme = useSiteTheme();

  useEffect(() => {
    if (startKey > 0) controller.current?.start(0);
  }, [startKey]);

  return <SpotlightTour steps={STEPS} controllerRef={controller} theme={theme} overlayClick="close" />;
}
