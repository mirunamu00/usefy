import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { DiffViewer } from "@usefy/diff-viewer";
import { storyTheme } from "../styles/storyTheme";

// ============================================================================
// Sample content
// ============================================================================

const CODE_BEFORE = `import { useState, useEffect } from "react";
import { fetchUser } from "./api";

export function UserCard({ id }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(id).then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Spinner />;

  return (
    <div className="card">
      <img src={user.avatar} alt="" />
      <h2>{user.name}</h2>
    </div>
  );
}`;

const CODE_AFTER = `import { useState, useEffect, useCallback } from "react";
import { fetchUser } from "./api";

export function UserCard({ id, compact = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchUser(id).then((data) => {
      if (cancelled) return;
      setUser(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Spinner size="sm" />;

  return (
    <div className="card">
      <img src={user.avatarUrl} alt="" />
      <h2>{user.displayName}</h2>
    </div>
  );
}`;

const PROSE_BEFORE = `The quick brown fox jumps over the lazy dog.
これは日本語の文です
这是一个中文的测试句子
안녕하세요 반갑습니다`;

const PROSE_AFTER = `The quick brown cat jumps over the lazy dog.
これは日本語の文章です
这是一个中文的示例句子
안녕하세요 만나서 반갑습니다`;

const WS_BEFORE = `function total(items) {
    return items.reduce((sum, x) => sum + x, 0);
}   `;

const WS_AFTER = `function total(items) {
	return items.reduce((sum, x) => sum + x.value, 0);
}`;

/** A big file whose changes are sparse — the virtualization showcase. */
function hugeDiff(lines: number) {
  const before =
    Array.from({ length: lines }, (_, i) => `  const value${i} = compute(${i}, options);`).join(
      "\n",
    ) + "\n";
  const after =
    before
      .replace(/\n$/, "")
      .split("\n")
      .map((line, i) => (i % 100 === 0 ? line.replace("compute", "calculate") : line))
      .join("\n") + "\n";
  return { before, after };
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof DiffViewer> = {
  title: "diff-viewer",
  component: DiffViewer,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `Renders the difference between two texts the way a code-review tool does: side-by-side or unified, with line numbers, added/removed highlighting, **word-level highlighting inside changed lines**, and unchanged regions collapsed behind expandable context. The engine is a hand-written linear-space Myers diff — pure, zero-dependency functions — also available headless via \`@usefy/diff-viewer/headless\`.

## Features
- **Real diff engine** — Myers O(ND) with a linear-space middle-snake refinement, plus word-level intra-line diffing gated by a similarity threshold (so unrelated lines never render as character soup)
- **Two views, one model** — \`view="split"\` (side-by-side) and \`"unified"\` render the *same* \`DiffLine\` objects, so they can never disagree
- **Collapsed context** — unchanged runs collapse behind "⋯ N unchanged lines" expanders (expand up / down / all); the hidden lines travel inside the model, so a pre-computed \`diff\` prop can expand too
- **Virtualized** — above \`virtualizeThreshold\` only the visible window is in the DOM; a 20 000-line diff keeps ~45 rows rendered and scrolls at 60 fps
- **Honest guards** — \`maxLines\`/\`maxBytes\` bound size, \`maxEditDistance\` bounds *cost*; past them the result is \`truncated\` with a "Diff anyway" escape hatch, and \`truncatedReason\` distinguishes "too large" from "too different"
- **Bring your own highlighter** — a \`renderContent\` seam hands you plain strings/segments; no bundled syntax library
- **Accessible** — real \`<table>\` semantics, one row header per row, visually-hidden "Added"/"Removed" labels (never colour alone), keyboard-operable expanders, truthful \`aria-rowcount\`/\`aria-rowindex\` under virtualization
- **SSR- & StrictMode-safe**, themeable via \`--usefy-diff-*\` CSS variables, \`theme="light|dark|system"\`

## Basic Usage
\`\`\`tsx
import { DiffViewer } from "@usefy/diff-viewer";

function Review({ before, after }) {
  return <DiffViewer oldText={before} newText={after} view="split" />;
}
\`\`\`

Styles inject themselves at runtime — no CSS import is required. (A
\`@usefy/diff-viewer/styles.css\` export is available if you prefer to bundle
them yourself.)`,
      },
    },
  },
  argTypes: {
    view: {
      control: "inline-radio",
      options: ["split", "unified"],
      description: "Side-by-side or single-column",
      table: { type: { summary: "'split' | 'unified'" }, defaultValue: { summary: "'split'" } },
    },
    theme: {
      control: "inline-radio",
      options: ["light", "dark", "system"],
      description: "Color theme; 'system' follows prefers-color-scheme",
      table: {
        type: { summary: "'light' | 'dark' | 'system'" },
        defaultValue: { summary: "'system'" },
      },
    },
    showLineNumbers: {
      control: "boolean",
      description: "Show the old/new line-number gutters",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    wrap: {
      control: "boolean",
      description: "Wrap long lines (disables virtualization)",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    ignoreWhitespace: {
      control: "inline-radio",
      options: ["none", "trailing", "all"],
      description: "Whitespace handling for matching (renders the original)",
      table: {
        type: { summary: "'none' | 'trailing' | 'all'" },
        defaultValue: { summary: "'none'" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DiffViewer>;

// ============================================================================
// Split vs unified
// ============================================================================

const SPLIT_UNIFIED_CODE = `import { DiffViewer } from "@usefy/diff-viewer";

function Review({ before, after }) {
  const [view, setView] = useState<"split" | "unified">("split");

  return (
    <>
      <button onClick={() => setView(view === "split" ? "unified" : "split")}>
        {view === "split" ? "Unified" : "Split"} view
      </button>
      <DiffViewer oldText={before} newText={after} view={view} />
    </>
  );
}`;

export const SplitVsUnified: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A realistic code diff with word-level highlighting inside the changed lines. Toggle between the side-by-side and unified views — both render the same model, so the content never disagrees.",
      },
      source: { language: "tsx", code: SPLIT_UNIFIED_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const [view, setView] = useState<"split" | "unified">("split");
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Split vs unified</h2>
          <p className={storyTheme.subtitle}>
            The same diff in both layouts — toggle and compare.
          </p>
          <div className={storyTheme.buttonGroupFull}>
            <button
              type="button"
              data-testid="toggle-view"
              className={view === "split" ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
              onClick={() => setView("split")}
            >
              Split
            </button>
            <button
              type="button"
              className={view === "unified" ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
              onClick={() => setView("unified")}
            >
              Unified
            </button>
          </div>
          <DiffViewer oldText={CODE_BEFORE} newText={CODE_AFTER} view={view} context={Infinity} />
        </div>
      );
    };
    return <Demo />;
  },
};

// ============================================================================
// Prose & CJK
// ============================================================================

const PROSE_CODE = `import { DiffViewer } from "@usefy/diff-viewer";

// The tokenizer treats Han and Kana as one token PER CHARACTER (those
// scripts have no spaces), and Hangul as space-delimited words — so
// intra-sentence edits highlight precisely in every language.
<DiffViewer
  oldText={"这是一个中文的测试句子"}
  newText={"这是一个中文的示例句子"}
  view="unified"
/>`;

export const ProseAndCJK: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Word-level highlighting is script-aware: English/Korean highlight per word, while Chinese (Han) and Japanese (Kana) — which are written without spaces — highlight per character, so a one-character edit does not repaint the whole sentence.",
      },
      source: { language: "tsx", code: PROSE_CODE },
    },
  },
  render: () => (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Prose &amp; CJK</h2>
      <p className={storyTheme.subtitle}>
        Latin and Hangul highlight per word; Han and Kana per character.
      </p>
      <DiffViewer oldText={PROSE_BEFORE} newText={PROSE_AFTER} view="unified" context={Infinity} />
    </div>
  ),
};

// ============================================================================
// Whitespace options
// ============================================================================

const WHITESPACE_CODE = `import { DiffViewer } from "@usefy/diff-viewer";

// ignoreWhitespace affects MATCHING only — the viewer always renders the
// original text. "trailing" ignores end-of-line whitespace; "all" ignores
// every whitespace character (so a tabs-vs-spaces reindent is not a diff).
<DiffViewer
  oldText={before}
  newText={after}
  ignoreWhitespace="all"
/>`;

export const WhitespaceOptions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The two versions differ in indentation (spaces → a tab), trailing whitespace, and one real change. Switch the whitespace mode to see which differences are treated as significant — the rendered text is always the original.",
      },
      source: { language: "tsx", code: WHITESPACE_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const [mode, setMode] = useState<"none" | "trailing" | "all">("none");
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Whitespace options</h2>
          <p className={storyTheme.subtitle}>
            <code>ignoreWhitespace</code> changes what counts as a difference, never what is
            rendered.
          </p>
          <div className={storyTheme.buttonGroupFull}>
            {(["none", "trailing", "all"] as const).map((m) => (
              <button
                key={m}
                type="button"
                data-testid={`ws-${m}`}
                className={mode === m ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <DiffViewer
            oldText={WS_BEFORE}
            newText={WS_AFTER}
            ignoreWhitespace={mode}
            context={Infinity}
          />
        </div>
      );
    };
    return <Demo />;
  },
};

// ============================================================================
// Huge diff — virtualization showcase
// ============================================================================

const HUGE_CODE = `import { DiffViewer } from "@usefy/diff-viewer";

// Above virtualizeThreshold (default 200 rows) only the visible window is
// in the DOM. A 20,000-line diff keeps ~45 rows rendered and scrolls at
// 60 fps; aria-rowcount still reports the true total to assistive tech.
<DiffViewer oldText={before} newText={after} />`;

export const HugeDiff: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The virtualization showcase: a 20,000-line file with sparse changes. Scroll it — only ~45 rows are ever in the DOM, yet the scrollbar and line numbers reflect the whole document. Expand a collapsed region and the numbers stay correct.",
      },
      source: { language: "tsx", code: HUGE_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const { before, after } = useMemo(() => hugeDiff(20_000), []);
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>20,000-line diff</h2>
          <p className={storyTheme.subtitle}>
            Windowed rendering — scroll the diff; the DOM stays tiny.
          </p>
          <DiffViewer oldText={before} newText={after} />
        </div>
      );
    };
    return <Demo />;
  },
};

// ============================================================================
// Custom renderContent — a tiny hand-rolled highlighter
// ============================================================================

/**
 * A deliberately tiny, dependency-free "highlighter": it just tints a few
 * JS keywords and string literals. It is illustrative of the seam, NOT a
 * real syntax library — the point is that consumers plug their own in.
 */
const KEYWORDS = new Set([
  "import",
  "from",
  "export",
  "function",
  "const",
  "let",
  "return",
  "if",
  "new",
]);

function tinyHighlight(text: string): React.ReactNode {
  // Split on words/strings while keeping the delimiters.
  const parts = text.split(/("(?:[^"\\]|\\.)*"|\b\w+\b)/g);
  return parts.map((part, i) => {
    if (KEYWORDS.has(part)) return <span key={i} style={{ color: "#c678dd" }}>{part}</span>;
    if (/^".*"$/.test(part)) return <span key={i} style={{ color: "#98c379" }}>{part}</span>;
    return <span key={i}>{part}</span>;
  });
}

const RENDER_CONTENT_CODE = `import { DiffViewer } from "@usefy/diff-viewer";

// renderContent is the syntax-highlighting seam: it hands you the plain
// text (and the word-level segments, if any) and you return React nodes.
// Plug in Shiki/Prism — or, as here, a tiny hand-rolled tinter. Content is
// always rendered as text nodes; if you return highlighted markup, that is
// your trust boundary.
<DiffViewer
  oldText={before}
  newText={after}
  renderContent={({ text }) => tinyHighlight(text)}
/>`;

export const CustomRenderContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The renderContent seam lets you paint the code with any highlighter. This demo wires a tiny hand-rolled tinter (keywords purple, strings green) — no syntax library — to show the seam receives plain strings and returns React nodes.",
      },
      source: { language: "tsx", code: RENDER_CONTENT_CODE },
    },
  },
  render: () => (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Custom renderContent</h2>
      <p className={storyTheme.subtitle}>
        A dependency-free highlighter plugged into the <code>renderContent</code> seam.
      </p>
      <DiffViewer
        oldText={CODE_BEFORE}
        newText={CODE_AFTER}
        context={Infinity}
        renderContent={({ text }) => tinyHighlight(text)}
      />
    </div>
  ),
};

// ============================================================================
// Dark theme
// ============================================================================

const DARK_CODE = `import { DiffViewer } from "@usefy/diff-viewer";

// theme="dark" forces the dark palette; "system" (default) follows
// prefers-color-scheme. Everything is themable via --usefy-diff-* variables.
<DiffViewer oldText={before} newText={after} theme="dark" />`;

export const DarkTheme: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The dark palette on a dark page. Added/removed row tints, inline highlights, and the gutter all switch to the dark theme; the +/− gutter glyphs remain the primary change signal, so the diff reads even without colour.",
      },
      source: { language: "tsx", code: DARK_CODE },
    },
  },
  render: () => (
    <div style={{ background: "#010409", padding: 24, borderRadius: 12, minHeight: 400 }}>
      <h2 className={storyTheme.title} style={{ color: "#e6edf3" }}>
        Dark theme
      </h2>
      <p className={storyTheme.subtitle} style={{ color: "#9198a1" }}>
        The same diff on the dark palette.
      </p>
      <DiffViewer oldText={CODE_BEFORE} newText={CODE_AFTER} theme="dark" context={Infinity} />
    </div>
  ),
};

// ============================================================================
// Interaction test (automated — NOT a demo)
// ============================================================================

/**
 * A dedicated regression story that AUTO-RUNS and drives the viewer by
 * itself: it expands a collapsed region and asserts the revealed rows,
 * toggles the view, and walks the refusal state's "Diff anyway" path. It is
 * a test, not a demo — the demo stories above never move on their own.
 * Excluded from the docs page (`!autodocs`).
 */
const UNRELATED_A = Array.from({ length: 400 }, (_, i) => `alpha line ${i}`).join("\n") + "\n";
const UNRELATED_B = Array.from({ length: 400 }, (_, i) => `beta text ${i}`).join("\n") + "\n";

export const InteractionTest: Story = {
  name: "Interaction test (automated)",
  tags: ["!autodocs"],
  parameters: {
    docs: {
      description: {
        story:
          "Automated end-to-end check — this story drives itself on open: it expands a collapsed gap and asserts the revealed lines, toggles split/unified, and clicks through the cost-guard refusal via 'Diff anyway'. It is a test, not a demo.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [view, setView] = useState<"split" | "unified">("split");
      const [pair, setPair] = useState<"code" | "refused">("code");
      const long = useMemo(() => {
        const before =
          Array.from({ length: 80 }, (_, i) => `line ${i}`).join("\n") + "\n";
        const after = before.replace("line 40\n", "line 40 CHANGED\n");
        return { before, after };
      }, []);

      return (
        <div className={storyTheme.container}>
          <div className={storyTheme.buttonGroupFull}>
            <button
              type="button"
              data-testid="it-toggle-view"
              className={storyTheme.buttonNeutral}
              onClick={() => setView((v) => (v === "split" ? "unified" : "split"))}
            >
              Toggle view
            </button>
            <button
              type="button"
              data-testid="it-toggle-pair"
              className={storyTheme.buttonNeutral}
              onClick={() => setPair((p) => (p === "code" ? "refused" : "code"))}
            >
              Toggle pair
            </button>
          </div>
          {pair === "code" ? (
            <DiffViewer oldText={long.before} newText={long.after} view={view} />
          ) : (
            <DiffViewer
              oldText={UNRELATED_A}
              newText={UNRELATED_B}
              view={view}
              maxEditDistance={50}
            />
          )}
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const table = () => canvasElement.querySelector("table");

    await step("Expand a collapsed gap and assert the revealed lines", async () => {
      // The 80-line diff has a leading and a trailing gap, so there are two
      // "Expand 20 lines above" buttons — take the first (the leading gap).
      await waitFor(() => expect(table()).not.toBeNull());
      await expect(table()!.textContent).not.toContain("line 0");

      const expanders = await canvas.findAllByRole("button", {
        name: "Expand 20 lines above",
      });
      await userEvent.click(expanders[0]);
      await waitFor(() => expect(table()!.textContent).toContain("line 0"));
    });

    await step("Toggle to the unified view — the change survives", async () => {
      await userEvent.click(canvas.getByTestId("it-toggle-view"));
      await waitFor(() =>
        expect(canvasElement.querySelector("[data-usefy-diff-view='unified']")).not.toBeNull(),
      );
      await expect(table()!.textContent).toContain("line 40 CHANGED");
    });

    await step("The cost guard refuses an unrelated pair, and 'Diff anyway' overrides it", async () => {
      await userEvent.click(canvas.getByTestId("it-toggle-pair"));

      const anyway = await canvas.findByRole("button", { name: "Diff anyway" });
      await expect(
        canvasElement.querySelector("[data-usefy-diff-state='truncated']"),
      ).not.toBeNull();
      await userEvent.click(anyway);

      await waitFor(() =>
        expect(canvasElement.querySelector("[data-usefy-diff-state='diff']")).not.toBeNull(),
      );
    });
  },
};
