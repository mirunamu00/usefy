"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { TOUR_START_EVENT } from "@/lib/tour-event";

const SiteTourImpl = dynamic(() => import("./site-tour-impl").then((m) => m.SiteTourImpl), {
  ssr: false,
});

/**
 * Listener shell for the landing tour. Keeps @usefy/spotlight-tour out of the
 * first-load bundle: the chunk downloads on the first start request, mounts,
 * and auto-starts via startKey.
 */
export function SiteTour() {
  const [startKey, setStartKey] = useState(0);

  useEffect(() => {
    const start = () => setStartKey((k) => k + 1);
    window.addEventListener(TOUR_START_EVENT, start);
    return () => window.removeEventListener(TOUR_START_EVENT, start);
  }, []);

  return startKey > 0 ? <SiteTourImpl startKey={startKey} /> : null;
}
