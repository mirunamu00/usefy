"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

function Loading() {
  return (
    <div className="h-48 animate-pulse rounded-2xl border border-border bg-surface/40" aria-hidden="true" />
  );
}

/* Each demo is its own lazy chunk — a product page only downloads its own
   product (plus React) on top of the static shell. */
const DEMOS: Record<string, ComponentType> = {
  confetti: dynamic(() => import("./confetti-demo").then((m) => m.ConfettiDemo), { ssr: false, loading: Loading }),
  "scroll-progress": dynamic(() => import("./scroll-progress-demo").then((m) => m.ScrollProgressDemo), { ssr: false, loading: Loading }),
  "spotlight-tour": dynamic(() => import("./spotlight-tour-demo").then((m) => m.SpotlightTourDemo), { ssr: false, loading: Loading }),
  "signature-pad": dynamic(() => import("./signature-pad-demo").then((m) => m.SignaturePadDemo), { ssr: false, loading: Loading }),
  "virtual-keyboard": dynamic(() => import("./virtual-keyboard-demo").then((m) => m.VirtualKeyboardDemo), { ssr: false, loading: Loading }),
  "memory-monitor": dynamic(() => import("./memory-monitor-demo").then((m) => m.MemoryMonitorDemo), { ssr: false, loading: Loading }),
  "network-indicator": dynamic(() => import("./network-indicator-demo").then((m) => m.NetworkIndicatorDemo), { ssr: false, loading: Loading }),
  "diff-viewer": dynamic(() => import("./diff-viewer-demo").then((m) => m.DiffViewerDemo), { ssr: false, loading: Loading }),
  "qr-code": dynamic(() => import("./qr-code-demo").then((m) => m.QRCodeDemo), { ssr: false, loading: Loading }),
};

/** The per-product live demo, or null when a package has none. Keep the slug
 * list in sync with hasLiveDemo() in data/products.ts (server-safe check). */
export function ProductLiveDemo({ slug }: { slug: string }) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo /> : null;
}
