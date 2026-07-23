"use client";

import { useRef } from "react";
import { ScrollProgress } from "@usefy/scroll-progress";
import { DemoShell } from "./demo-shell";

const PARAGRAPHS = [
  "Scroll this box — the bar above it is a real @usefy/scroll-progress measuring this container, not the page.",
  "By default the component pins a viewport-wide bar to the top of the screen (this site uses one on the landing page).",
  "Pass a target ref to measure any scrollable element instead, and a render prop to draw the bar wherever you want.",
  "It's accessible out of the box: role=\"progressbar\" with live aria-valuenow, and it respects prefers-reduced-motion.",
  "SSR-safe, zero dependencies, a few hundred bytes. That's the whole point.",
];

/** Live @usefy/scroll-progress in container mode with a custom render bar. */
export function ScrollProgressDemo() {
  const boxRef = useRef<HTMLDivElement>(null);

  return (
    <DemoShell hint="target={ref} measures the box; render={} draws the inline bar. The site's own top bar is the default mode.">
      <ScrollProgress
        target={boxRef}
        aria-label="Demo container scroll progress"
        render={(progress) => (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full"
              style={{
                background: "var(--accent, var(--brand))",
                transform: `scaleX(${progress})`,
                transformOrigin: "left",
              }}
            />
          </div>
        )}
      />
      <div
        ref={boxRef}
        className="mt-3 h-48 overflow-y-auto rounded-xl border border-border bg-bg p-4"
        tabIndex={0}
      >
        {PARAGRAPHS.map((p, i) => (
          <p key={i} className="mb-4 text-sm leading-relaxed text-fg-muted">
            {p}
          </p>
        ))}
      </div>
    </DemoShell>
  );
}
