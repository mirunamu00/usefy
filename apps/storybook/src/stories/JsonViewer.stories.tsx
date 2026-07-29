import { useCallback, useMemo, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { JsonViewer, type JsonViewerController } from "@usefy/json-viewer";
import { storyTheme } from "../styles/storyTheme";

// A JSON tree earns its width — deep paths plus a long value need more than the
// shared 600px `storyTheme.container` before rows start truncating for the
// wrong reason.
const jsonContainer = "p-8 max-w-[1000px] font-sans mx-auto";

// ============================================================================
// Sample payloads
// ============================================================================

const API_RESPONSE = {
  status: "ok",
  requestId: "req_8f2c1ab4",
  took_ms: 42,
  user: {
    id: 10248,
    name: "Ada Lovelace",
    email: "ada@example.com",
    roles: ["admin", "engineer"],
    preferences: {
      theme: "dark",
      locale: "en-GB",
      notifications: { email: true, push: false, digest: "weekly" },
    },
    lastSeen: "2026-07-28T09:14:00.000Z",
  },
  items: [
    { id: 1, title: "Analytical Engine", tags: ["hardware"], score: 9.8 },
    { id: 2, title: "Note G", tags: ["software", "first"], score: 10 },
    { id: 3, title: "Bernoulli numbers", tags: ["maths"], score: 8.4 },
  ],
  cursor: null,
};

/** What real app state looks like — not everything survives `JSON.parse`. */
const APP_STATE = {
  session: {
    startedAt: new Date("2026-07-29T08:00:00.000Z"),
    ticket: 9007199254740993n,
    scopes: new Set(["read", "write"]),
  },
  cache: new Map<string, unknown>([
    ["/api/users", { hit: true, age: 12 }],
    ["/api/items", { hit: false, age: 0 }],
  ]),
  draft: undefined,
  retry: () => true,
  logs: [
    { level: "info", message: "boot" },
    {
      level: "error",
      message:
        "Request failed after 3 attempts: upstream returned 503 Service Unavailable while reading the aggregate index; the circuit breaker is now open and will retry in 30s",
    },
  ],
};

/**
 * A payload with a self-reference, which `JSON.parse` can never produce and
 * app state produces constantly.
 */
const CYCLIC: Record<string, unknown> = { name: "root", depth: 0 };
CYCLIC.self = CYCLIC;
CYCLIC.child = { name: "child", parent: CYCLIC };

/** Distinct records — no shared references, so the size is honest. */
function generateRecords(count: number) {
  const records = new Array(count);
  for (let i = 0; i < count; i++) {
    records[i] = {
      id: i,
      name: `user-${i}`,
      email: `user${i}@example.com`,
      active: i % 3 !== 0,
      tags: [`tag-${i % 10}`, `tag-${i % 7}`],
      meta: { created: 1_700_000_000 + i, score: (i % 100) / 10 },
    };
  }
  return records;
}

// ============================================================================
// Demos
// ============================================================================

function BasicDemo() {
  return (
    <div className={jsonContainer}>
      <h3 className={storyTheme.title}>API response</h3>
      <p className={storyTheme.subtitle}>
        The root opens one level deep. Click a triangle, or focus the tree and use
        the arrow keys.
      </p>
      <JsonViewer data={API_RESPONSE} height={420} data-testid="basic-viewer" />
    </div>
  );
}

function LargePayloadDemo() {
  const [records, setRecords] = useState<unknown[] | null>(null);
  const [buildMs, setBuildMs] = useState<number | null>(null);
  const [bytes, setBytes] = useState<number | null>(null);

  const load = useCallback((count: number) => {
    const started = performance.now();
    const generated = generateRecords(count);
    setBytes(JSON.stringify(generated).length);
    setRecords(generated);
    setBuildMs(performance.now() - started);
  }, []);

  const data = useMemo(
    () => (records ? { generated: true, count: records.length, records } : { hint: "press a button" }),
    [records],
  );

  return (
    <div className={jsonContainer}>
      <h3 className={storyTheme.title}>A payload every other viewer chokes on</h3>
      <p className={storyTheme.subtitle}>
        Generate the data, expand <code>records</code>, and scroll. The row counter
        in the toolbar is the whole document; the DOM only ever holds what fits on
        screen.
      </p>

      <div className={storyTheme.buttonGroupFull}>
        <button
          type="button"
          className={storyTheme.buttonSecondary}
          onClick={() => load(20_000)}
          data-testid="load-small"
        >
          Load 20 000 records
        </button>
        <button
          type="button"
          className={storyTheme.buttonPrimary}
          onClick={() => load(375_000)}
          data-testid="load-huge"
        >
          Load 375 000 records (~50 MB)
        </button>
        <button
          type="button"
          className={storyTheme.buttonNeutral}
          onClick={() => {
            setRecords(null);
            setBuildMs(null);
            setBytes(null);
          }}
          data-testid="reset-large"
        >
          Reset
        </button>
      </div>

      {buildMs !== null && bytes !== null ? (
        <div className={storyTheme.cardInfo} data-testid="large-stats">
          <p className={storyTheme.statText}>
            {`${(bytes / 1024 / 1024).toFixed(1)} MB generated in ${buildMs.toFixed(0)} ms`}
          </p>
        </div>
      ) : null}

      <JsonViewer
        data={data}
        height={460}
        defaultExpandDepth={1}
        data-testid="large-viewer"
      />
    </div>
  );
}

function SearchDemo() {
  const controllerRef = useRef<JsonViewerController>(null);
  const data = useMemo(
    () => ({ generated: true, records: generateRecords(20_000) }),
    [],
  );

  return (
    <div className={jsonContainer}>
      <h3 className={storyTheme.title}>Search the whole document</h3>
      <p className={storyTheme.subtitle}>
        Type in the search box — <code>user-19999</code> is the very last record and
        lives inside a collapsed subtree. Press <kbd>Enter</kbd> or the arrows to
        jump; the viewer expands the ancestors for you.
      </p>

      <div className={storyTheme.buttonGroupFull}>
        <button
          type="button"
          className={storyTheme.buttonSecondary}
          onClick={() => controllerRef.current?.search("user-19999")}
          data-testid="search-last"
        >
          Search for the last record
        </button>
        <button
          type="button"
          className={storyTheme.buttonNeutral}
          onClick={() => controllerRef.current?.search("")}
          data-testid="search-clear"
        >
          Clear
        </button>
      </div>

      <JsonViewer
        data={data}
        height={440}
        controllerRef={controllerRef}
        data-testid="search-viewer"
      />
    </div>
  );
}

function AppStateDemo() {
  return (
    <div className={jsonContainer}>
      <h3 className={storyTheme.title}>Values JSON has no syntax for</h3>
      <p className={storyTheme.subtitle}>
        <code>Map</code>, <code>Set</code>, <code>Date</code>, <code>BigInt</code>,{" "}
        <code>undefined</code> and a function — rendered as what they are instead
        of as <code>{"{}"}</code>. The long log message truncates with a{" "}
        <code>…</code> chip that opens the full value in an overlay.
      </p>
      <JsonViewer
        data={APP_STATE}
        height={420}
        showDataTypes
        maxValueLength={60}
        data-testid="state-viewer"
      />
    </div>
  );
}

function CyclicDemo() {
  return (
    <div className={jsonContainer}>
      <h3 className={storyTheme.title}>Self-referential data</h3>
      <p className={storyTheme.subtitle}>
        <code>root.self</code> points back at the root and <code>child.parent</code>{" "}
        points up. Expand them — the viewer marks the cycle instead of following it
        forever.
      </p>
      <JsonViewer data={CYCLIC} height={300} data-testid="cyclic-viewer" />
    </div>
  );
}

function ThemeDemo() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div className={jsonContainer}>
      <h3 className={storyTheme.title}>Themes</h3>
      <p className={storyTheme.subtitle}>
        Every colour is a CSS custom property on the root element, so a consumer can
        restyle the tree without touching a generated class name.
      </p>

      <div className={storyTheme.buttonGroupFull}>
        <button
          type="button"
          className={theme === "light" ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
          onClick={() => setTheme("light")}
          data-testid="theme-light"
        >
          Light
        </button>
        <button
          type="button"
          className={theme === "dark" ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
          onClick={() => setTheme("dark")}
          data-testid="theme-dark"
        >
          Dark
        </button>
      </div>

      <JsonViewer
        data={API_RESPONSE}
        theme={theme}
        height={380}
        data-testid="theme-viewer"
      />
    </div>
  );
}

function HeadlessDemo() {
  const [expanded, setExpanded] = useState<string[]>(["", "/user"]);

  return (
    <div className={jsonContainer}>
      <h3 className={storyTheme.title}>Controlled expansion</h3>
      <p className={storyTheme.subtitle}>
        The open set is a list of RFC 6901 pointers, so it round-trips through a URL
        or `localStorage`. Toggle rows and watch it change; press a preset to drive
        the tree from outside.
      </p>

      <div className={storyTheme.buttonGroupFull}>
        <button
          type="button"
          className={storyTheme.buttonSecondary}
          onClick={() => setExpanded(["", "/user", "/user/preferences"])}
          data-testid="preset-preferences"
        >
          Open preferences
        </button>
        <button
          type="button"
          className={storyTheme.buttonNeutral}
          onClick={() => setExpanded([""])}
          data-testid="preset-root"
        >
          Root only
        </button>
      </div>

      <JsonViewer
        data={API_RESPONSE}
        height={340}
        expanded={expanded}
        onExpandedChange={setExpanded}
        data-testid="controlled-viewer"
      />

      <pre className={storyTheme.textareaMono} data-testid="expanded-state">
        {JSON.stringify(expanded, null, 2)}
      </pre>
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof JsonViewer> = {
  title: "json-viewer",
  component: JsonViewer,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `A collapsible JSON tree whose **DOM stays bounded no matter how big the payload is**. Rows are computed on demand from an order-statistic index built only over the *expanded* spine of the tree, so a 50 MB document with millions of nodes scrolls, expands and searches at full speed while the DOM holds only what fits on screen. Every other React JSON viewer renders the whole tree.

The engine ships separately as \`@usefy/json-viewer/headless\` — zero React, no \`"use client"\`, importable from a Server Component or a worker.

## Features
- **Bounded DOM at any size** — \`rowAt(i)\` resolves in \`O(depth · log e)\` against a sparse index that costs memory only for what you actually expanded
- **No jump on expand or collapse** — the row under the cursor stays under the cursor, by arithmetic rather than by measurement
- **Chunked search over the whole document** — collapsed subtrees included, yielding to the browser between slices, cancelable, with the result cap reported rather than hidden
- **Real app state, not just JSON** — \`Map\`, \`Set\`, \`Date\`, \`BigInt\`, \`undefined\`, functions, throwing getters and reference cycles all render as what they are
- **Copy path in three formats** — JS accessor, RFC 6901 pointer, RFC 9535 JSONPath — and copy any subtree as re-serialized JSON
- **Full keyboard tree** — the WAI-ARIA Tree View key map, with \`aria-setsize\`/\`aria-posinset\` so a screen reader is told the size of the *tree*, not of the window
- **Zero non-\`@usefy\` runtime dependencies**, light/dark theming through CSS custom properties, \`prefers-reduced-motion\` respected

## Basic Usage
\`\`\`tsx
import { JsonViewer } from "@usefy/json-viewer";

export function ResponseInspector({ payload }: { payload: unknown }) {
  return <JsonViewer data={payload} height={480} />;
}
\`\`\``,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  render: () => <BasicDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A typical API response. The root opens one level; everything else is a click or an arrow key away.",
      },
      source: {
        language: "tsx",
        code: `import { JsonViewer } from "@usefy/json-viewer";

function ResponseInspector({ payload }: { payload: unknown }) {
  return <JsonViewer data={payload} height={420} />;
}`,
      },
    },
  },
};

export const LargePayload: Story = {
  render: () => <LargePayloadDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "The reason this package exists: generate up to ~50 MB, expand `records`, and scroll a document with millions of nodes.",
      },
      source: {
        language: "tsx",
        code: `import { JsonViewer } from "@usefy/json-viewer";

function TraceInspector({ trace }: { trace: unknown }) {
  // No special mode and no configuration — windowing is how the component
  // always works, so a huge payload is simply the normal path.
  return <JsonViewer data={trace} height={460} />;
}`,
      },
    },
  },
};

export const Search: Story = {
  render: () => <SearchDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Search covers the whole document, including collapsed subtrees, and jumping to a match expands its ancestors.",
      },
      source: {
        language: "tsx",
        code: `import { useRef } from "react";
import { JsonViewer, type JsonViewerController } from "@usefy/json-viewer";

function Inspector({ data }: { data: unknown }) {
  const controller = useRef<JsonViewerController>(null);

  return (
    <>
      <button onClick={() => controller.current?.search("error")}>
        Find errors
      </button>
      <JsonViewer data={data} controllerRef={controller} height={440} />
    </>
  );
}`,
      },
    },
  },
};

export const AppState: Story = {
  render: () => <AppStateDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "`Map`, `Set`, `Date`, `BigInt`, `undefined` and functions render as themselves; a long value opens in an overlay rather than growing its row.",
      },
      source: {
        language: "tsx",
        code: `import { JsonViewer } from "@usefy/json-viewer";

function StateInspector({ state }: { state: unknown }) {
  // \`data\` takes any JS value, not just the output of JSON.parse.
  return <JsonViewer data={state} showDataTypes maxValueLength={60} height={420} />;
}`,
      },
    },
  },
};

export const CyclicData: Story = {
  render: () => <CyclicDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A self-referential object is marked `[Circular]` instead of being followed — expanding it can never hang the tab.",
      },
      source: {
        language: "tsx",
        code: `import { JsonViewer } from "@usefy/json-viewer";

const node: Record<string, unknown> = { name: "root" };
node.self = node;

function CycleSafe() {
  return <JsonViewer data={node} height={300} />;
}`,
      },
    },
  },
};

export const Theming: Story = {
  render: () => <ThemeDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Light and dark are the same markup with different custom properties; `theme=\"auto\"` follows the operating system.",
      },
      source: {
        language: "tsx",
        code: `import { JsonViewer } from "@usefy/json-viewer";

function Themed({ data }: { data: unknown }) {
  return (
    <div style={{ ["--usefy-json-string" as string]: "#0ea5e9" }}>
      {/* "auto" follows prefers-color-scheme; "light" / "dark" pin it. */}
      <JsonViewer data={data} theme="auto" height={380} />
    </div>
  );
}`,
      },
    },
  },
};

export const ControlledExpansion: Story = {
  render: () => <HeadlessDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "The open set is a list of RFC 6901 pointers, so expansion state can be lifted, persisted, or restored from a URL.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { JsonViewer } from "@usefy/json-viewer";

function Persisted({ data }: { data: unknown }) {
  const [expanded, setExpanded] = useState<string[]>(["", "/user"]);

  return (
    <JsonViewer
      data={data}
      expanded={expanded}
      onExpandedChange={setExpanded}
      height={340}
    />
  );
}`,
      },
    },
  },
};

// ============================================================================
// Interaction test — auto-runs, drives the UI, kept out of the docs page
// ============================================================================

export const InteractionTest: Story = {
  name: "Interaction test (auto-runs)",
  tags: ["!autodocs"],
  render: () => <BasicDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "**Auto-runs on open and drives the tree by itself.** Kept out of the docs page so the demos above stay idle until a visitor touches them.",
      },
      source: {
        language: "tsx",
        code: `import { JsonViewer } from "@usefy/json-viewer";

function Inspector({ data }: { data: unknown }) {
  return <JsonViewer data={data} height={420} />;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const tree = await canvas.findByRole("tree");
    const countBefore = (await canvas.findByTestId("json-row-count")).textContent;

    // Keyboard: focus the tree, walk to `user`, open it.
    tree.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    await userEvent.keyboard("{ArrowRight}");

    await waitFor(async () => {
      const countAfter = (await canvas.findByTestId("json-row-count")).textContent;
      expect(countAfter).not.toBe(countBefore);
    });

    // Every rendered row must carry the windowing-safe ARIA metadata.
    const items = canvasElement.querySelectorAll('[role="treeitem"]');
    expect(items.length).toBeGreaterThan(0);
    for (const item of Array.from(items)) {
      expect(item).toHaveAttribute("aria-level");
      expect(item).toHaveAttribute("aria-posinset");
      expect(item).toHaveAttribute("aria-setsize");
    }

    // Search reaches a value nested inside a collapsed subtree.
    const input = await canvas.findByTestId("json-search-input");
    await userEvent.type(input, "Bernoulli");
    await waitFor(
      async () =>
        expect(await canvas.findByTestId("json-search-count")).toHaveTextContent(
          "1 of 1",
        ),
      { timeout: 3000 },
    );

    // Leave the tree collapsed back to its opening state so a visitor who
    // lands here after the run still sees a usable demo.
    await userEvent.clear(input);
    await userEvent.click(canvas.getByTestId("json-collapse-all"));
    await waitFor(async () =>
      expect(await canvas.findByTestId("json-row-count")).toHaveTextContent("1 row"),
    );
  },
};
