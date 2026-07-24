"use client";

import { useState } from "react";
import { DiffViewer } from "@usefy/diff-viewer";
import { useSiteTheme } from "@/lib/use-site-theme";
import { DemoShell, DemoButton } from "./demo-shell";

const BEFORE = `function greet(name) {
  const msg = "Hi, " + name;
  return msg.trim();
}`;

const AFTER = `function greet(name, emoji) {
  const msg = \`Hello, \${name} \${emoji}\`;
  return msg.trimEnd();
}`;

/**
 * Live @usefy/diff-viewer — edit either side and the diff recomputes as you
 * type. Toggle between the split and unified views (both render the same
 * model), and watch the word-level highlighting land inside the changed
 * lines. It is the real component, not a screenshot.
 */
export function DiffViewerDemo() {
  const theme = useSiteTheme();
  const [before, setBefore] = useState(BEFORE);
  const [after, setAfter] = useState(AFTER);
  const [view, setView] = useState<"split" | "unified">("split");

  const textarea =
    "h-32 w-full resize-y rounded-xl border border-border bg-bg p-3 font-mono text-xs leading-5 text-fg outline-none focus:border-border-strong";

  return (
    <DemoShell hint="Edit either side — the diff recomputes on every keystroke; both views render the same model, so they never disagree.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[11px] text-fg-subtle">before</span>
          <textarea
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            spellCheck={false}
            className={textarea}
            aria-label="Original text"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[11px] text-fg-subtle">after</span>
          <textarea
            value={after}
            onChange={(e) => setAfter(e.target.value)}
            spellCheck={false}
            className={textarea}
            aria-label="Changed text"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DemoButton primary={view === "split"} onClick={() => setView("split")}>
          Split
        </DemoButton>
        <DemoButton primary={view === "unified"} onClick={() => setView("unified")}>
          Unified
        </DemoButton>
        <code className="ml-auto font-mono text-[11px] text-fg-subtle">view: {view}</code>
      </div>

      <div className="mt-4 text-sm">
        <DiffViewer
          oldText={before}
          newText={after}
          view={view}
          theme={theme}
          context={Infinity}
        />
      </div>
    </DemoShell>
  );
}
