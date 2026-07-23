"use client";

import { useEffect, useState } from "react";
import { NetworkIndicator } from "@usefy/network-indicator";
import { DemoShell, DemoButton } from "./demo-shell";

/**
 * @usefy/network-indicator demo. The real component is mounted on this page
 * (it reacts to actual connectivity — try DevTools offline mode or airplane
 * mode). Because we can't fake the browser offline for you, the panel also
 * shows a clearly-labeled preview of both banners.
 */
export function NetworkIndicatorDemo() {
  const [preview, setPreview] = useState<"offline" | "online" | null>(null);

  useEffect(() => {
    if (preview === null) return;
    const t = setTimeout(
      () => setPreview((p) => (p === "offline" ? "online" : null)),
      preview === "offline" ? 2200 : 1800,
    );
    return () => clearTimeout(t);
  }, [preview]);

  return (
    <DemoShell hint="Zero config: <NetworkIndicator /> renders nothing until connectivity actually drops.">
      {/* The real thing — page-level, silent while you're online. */}
      <NetworkIndicator position="bottom" />

      <div className="relative h-32 overflow-hidden rounded-xl border border-border bg-bg">
        <div
          className="absolute inset-x-0 top-0 px-4 py-2.5 text-center text-[13px] font-medium text-white transition-transform duration-300"
          style={{
            background: preview === "online" ? "#2f9e44" : "#e03131",
            transform: preview ? "translateY(0)" : "translateY(-110%)",
          }}
          aria-hidden={preview === null}
        >
          {preview === "online" ? "Back online" : "You're offline. Some features may not work."}
        </div>
        <div className="flex h-full items-center justify-center">
          <p className="px-6 text-center font-mono text-xs text-fg-subtle">
            banner preview — the real one is mounted on this page and waits for a real offline event
          </p>
        </div>
      </div>

      <div className="mt-4">
        <DemoButton primary onClick={() => setPreview("offline")}>
          Preview the sequence
        </DemoButton>
      </div>
    </DemoShell>
  );
}
