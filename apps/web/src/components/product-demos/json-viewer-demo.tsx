"use client";

import { useCallback, useMemo, useState } from "react";
import { JsonViewer } from "@usefy/json-viewer";
import { useSiteTheme } from "@/lib/use-site-theme";
import { DemoShell, DemoButton } from "./demo-shell";

/** A hand-written payload — small, readable, and the default the page opens on. */
const SAMPLE = {
  status: "ok",
  requestId: "req_8f2c1ab4",
  took_ms: 42,
  user: {
    id: 10248,
    name: "Ada Lovelace",
    roles: ["admin", "engineer"],
    preferences: { theme: "dark", notifications: { email: true, push: false } },
  },
  items: [
    { id: 1, title: "Analytical Engine", tags: ["hardware"], score: 9.8 },
    { id: 2, title: "Note G", tags: ["software", "first"], score: 10 },
  ],
  cursor: null,
};

/** Distinct records, so the byte count and the node count are both honest. */
function generateRecords(count: number) {
  const records = new Array(count);
  for (let index = 0; index < count; index++) {
    records[index] = {
      id: index,
      name: `user-${index}`,
      email: `user${index}@example.com`,
      active: index % 3 !== 0,
      tags: [`tag-${index % 10}`, `tag-${index % 7}`],
      meta: { created: 1_700_000_000 + index, score: (index % 100) / 10 },
    };
  }
  return records;
}

/**
 * Live @usefy/json-viewer.
 *
 * Nothing runs until the visitor presses something. The interesting button is
 * the big one: generating ~50 MB of records puts a document with roughly 4.5
 * million nodes on the page, and the row counter versus what is actually in the
 * DOM is the entire pitch. It is the real component, not a screenshot.
 */
export function JsonViewerDemo() {
  const theme = useSiteTheme();
  const [records, setRecords] = useState<unknown[] | null>(null);
  const [megabytes, setMegabytes] = useState<number | null>(null);
  const [buildMs, setBuildMs] = useState<number | null>(null);

  const load = useCallback((count: number) => {
    const started = performance.now();
    const generated = generateRecords(count);
    setMegabytes(JSON.stringify(generated).length / 1024 / 1024);
    setRecords(generated);
    setBuildMs(performance.now() - started);
  }, []);

  const reset = useCallback(() => {
    setRecords(null);
    setMegabytes(null);
    setBuildMs(null);
  }, []);

  const data = useMemo(
    () => (records ? { generated: true, count: records.length, records } : SAMPLE),
    [records],
  );

  return (
    <DemoShell hint="Generate the big payload, open the records row, and scroll. The toolbar counts the whole document; the DOM only ever holds what fits on screen.">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DemoButton primary onClick={() => load(375_000)}>
          Load ~50 MB
        </DemoButton>
        <DemoButton onClick={() => load(20_000)}>Load 20 000 records</DemoButton>
        <DemoButton onClick={reset}>Reset</DemoButton>
        {megabytes !== null && buildMs !== null ? (
          <span className="font-mono text-[11px] text-fg-subtle">
            {`${megabytes.toFixed(1)} MB generated in ${buildMs.toFixed(0)} ms`}
          </span>
        ) : null}
      </div>

      <JsonViewer
        // Remounting on theme change is not needed — the component reads the
        // theme as a prop — but the key keeps the expansion state honest when
        // the payload is swapped for a different one.
        key={records ? records.length : "sample"}
        data={data}
        theme={theme === "dark" ? "dark" : "light"}
        height={420}
      />
    </DemoShell>
  );
}
