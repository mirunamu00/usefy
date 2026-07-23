"use client";

import { useRef, useState } from "react";
import { SignaturePad, type SignaturePadController } from "@usefy/signature-pad";
import { useSiteTheme } from "@/lib/use-site-theme";
import { DemoShell, DemoButton } from "./demo-shell";

/**
 * Live @usefy/signature-pad — a real ink engine, right here. Sign with
 * mouse/touch/pen, walk the undo/redo history, then export: the PNG is
 * trimmed to the ink bounding box and the on-canvas guideline never
 * leaks into the file.
 */
export function SignaturePadDemo() {
  const pad = useRef<SignaturePadController>(null);
  const theme = useSiteTheme();
  const [state, setState] = useState({ isEmpty: true, strokeCount: 0 });
  const [exported, setExported] = useState<{ dataURL: string } | null>(null);

  const handleExport = async () => {
    const result = await pad.current?.toPNG();
    if (result) setExported({ dataURL: result.dataURL });
  };

  return (
    <DemoShell hint="onChange fires on edges only (stroke end / undo / redo / clear) — zero React renders while ink is flowing.">
      <div className="relative h-44 overflow-hidden rounded-xl border border-border bg-bg">
        <SignaturePad
          controllerRef={pad}
          guideline
          penColor={theme === "dark" ? "#e7ecf3" : "#1e293b"}
          onChange={(next) => {
            setState(next);
            // The preview is a snapshot; any ink edit (stroke/undo/redo/clear)
            // makes it stale — drop it rather than showing outdated ink.
            setExported(null);
          }}
          aria-label="Demo signature pad"
        />
        {state.isEmpty ? (
          <p className="pointer-events-none absolute inset-x-0 top-6 text-center font-mono text-xs text-fg-subtle">
            sign here — mouse, touch, or pen
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DemoButton onClick={() => pad.current?.undo()}>Undo</DemoButton>
        <DemoButton onClick={() => pad.current?.redo()}>Redo</DemoButton>
        <DemoButton
          onClick={() => {
            pad.current?.clear();
            setExported(null);
          }}
        >
          Clear
        </DemoButton>
        <DemoButton primary disabled={state.isEmpty} onClick={handleExport}>
          Export PNG
        </DemoButton>
        <code className="ml-auto font-mono text-[11px] text-fg-subtle">
          isEmpty: {String(state.isEmpty)} · strokes: {state.strokeCount}
        </code>
      </div>

      {exported ? (
        <figure className="mt-4 rounded-xl border border-border p-4">
          <div
            className="flex items-center justify-center rounded-lg p-3"
            style={{
              background:
                "repeating-conic-gradient(var(--surface-2) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px",
            }}
          >
            {/* Data-URL snapshot from toPNG() — next/image has nothing to optimize here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={exported.dataURL}
              alt="Exported signature — trimmed PNG"
              className="max-h-28 w-auto max-w-full"
            />
          </div>
          <figcaption className="mt-2 font-mono text-[11px] text-fg-subtle">
            toPNG() — trimmed to the ink, transparent background, guideline excluded
          </figcaption>
        </figure>
      ) : null}
    </DemoShell>
  );
}
