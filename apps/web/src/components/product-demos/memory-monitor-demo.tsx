"use client";

import { useEffect, useState } from "react";
import { useMemoryMonitorHeadless, formatBytes } from "@usefy/memory-monitor";
import { DemoShell } from "./demo-shell";

const HISTORY_LEN = 40;

/** Live @usefy/memory-monitor headless hook reading this very tab's heap. */
export function MemoryMonitorDemo() {
  const { memory, usagePercentage, severity, trend, isSupported } = useMemoryMonitorHeadless({
    interval: 1000,
  });
  const [history, setHistory] = useState<number[]>([]);

  // Depend on heapUsed ONLY. The headless hook rebuilds `memory` every render
  // AND stamps `timestamp: Date.now()` at render time, so both the object and
  // its timestamp change each render — either as a dep loops setState (max
  // update depth). heapUsed is stable between polls.
  const heapUsed = memory?.heapUsed;
  useEffect(() => {
    if (heapUsed === undefined) return;
    setHistory((h) => [...h.slice(-(HISTORY_LEN - 1)), heapUsed]);
  }, [heapUsed]);

  if (!isSupported) {
    return (
      <DemoShell>
        <p className="text-sm text-fg-muted">
          This tab&apos;s browser doesn&apos;t expose the <code className="font-mono">performance.memory</code> heap
          API (it&apos;s Chromium-only). Open this page in Chrome or Edge to watch your own heap live —
          the component detects support and stays silent everywhere else.
        </p>
      </DemoShell>
    );
  }

  const max = Math.max(...history, 1);
  const min = Math.min(...history, max - 1);
  const points = history
    .map((v, i) => {
      const x = (i / (HISTORY_LEN - 1)) * 120;
      const y = 34 - ((v - min) / Math.max(max - min, 1)) * 28;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <DemoShell hint="useMemoryMonitorHeadless() — the full slide-in panel ships in the same package.">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-fg-subtle">heap used — this very tab</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-fg">
            {memory ? formatBytes(memory.heapUsed) : "—"}
          </p>
        </div>
        <dl className="flex gap-6 font-mono text-xs">
          <div>
            <dt className="text-fg-subtle">usage</dt>
            <dd className="mt-0.5 tabular-nums text-fg">
              {usagePercentage === null ? "—" : `${usagePercentage.toFixed(1)}%`}
            </dd>
          </div>
          <div>
            <dt className="text-fg-subtle">trend</dt>
            <dd className="mt-0.5 text-fg">{trend}</dd>
          </div>
          <div>
            <dt className="text-fg-subtle">severity</dt>
            <dd
              className="mt-0.5"
              style={{ color: severity === "normal" ? "var(--accent, var(--brand))" : "#f03e3e" }}
            >
              {severity}
            </dd>
          </div>
        </dl>
      </div>

      <svg viewBox="0 0 120 36" preserveAspectRatio="none" className="mt-4 h-16 w-full" aria-hidden="true">
        <line x1="0" y1="35" x2="120" y2="35" stroke="var(--border)" strokeWidth="1" />
        {history.length > 1 ? (
          <polyline
            points={points}
            fill="none"
            stroke="var(--accent, var(--brand))"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
    </DemoShell>
  );
}
