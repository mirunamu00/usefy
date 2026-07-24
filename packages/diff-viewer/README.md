<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/diff-viewer</h1>

<p align="center">
  <strong>Text diff viewer for React — hand-written linear-space Myers engine, word-level highlighting, collapsible context, row virtualization, and a zero-dependency headless core</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/diff-viewer">
    <img src="https://img.shields.io/npm/v/@usefy/diff-viewer.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/diff-viewer">
    <img src="https://img.shields.io/npm/dm/@usefy/diff-viewer.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/diff-viewer">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/diff-viewer?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/diff-viewer.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#views">Views</a> ·
  <a href="#options">Options</a> ·
  <a href="#headless-usage">Headless</a> ·
  <a href="#syntax-highlighting">Highlighting</a> ·
  <a href="#size--cost-guards">Guards</a> ·
  <a href="#virtualization">Virtualization</a> ·
  <a href="#accessibility">Accessibility</a> ·
  <a href="#performance">Performance</a> ·
  <a href="#limitations">Limitations</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/diff-viewer--split-vs-unified" target="_blank" rel="noopener noreferrer">
    <strong>🔍 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/diff-viewer` renders the difference between two texts the way a code-review tool does: **side-by-side or unified**, with line numbers, added/removed highlighting, **word-level highlighting inside changed lines**, and unchanged regions collapsed behind expandable context. The core is a **hand-written Myers diff engine** — pure functions over token arrays, hand-testable, zero dependencies.

One diff model works across **two layers**:

1. **Component** — `<DiffViewer />`: real `<table>` semantics, split/unified views, collapsible context, row virtualization, theming, and a syntax-highlighting seam.
2. **Headless** — `computeDiff(oldText, newText)` from `@usefy/diff-viewer/headless`: pure TypeScript, zero React, usable from any framework, a Node script, or a Web Worker.

### Why @usefy/diff-viewer?

- **Real diff engine, zero deps** — Myers O(ND) with a **linear-space middle-snake** refinement (O(N+M) memory), plus word-level intra-line diffing gated by a similarity threshold so unrelated lines never render as character soup. Output is provably optimal (asserted against an independent DP-LCS oracle).
- **Two views, one model** — `split` and `unified` render the *same* `DiffLine` objects, so they can never disagree about content.
- **Collapsible context that travels with the model** — unchanged runs collapse behind "⋯ N unchanged lines" expanders; the hidden lines live *inside* the result, so a pre-computed `diff` prop can expand with no source texts and no recompute.
- **Big inputs stay usable** — above `virtualizeThreshold` only the visible window is in the DOM: a 20,000-line diff keeps ~45 rows rendered and scrolls at 60 fps.
- **Honest guards** — `maxLines`/`maxBytes` bound size; `maxEditDistance` bounds *cost* (Myers is O(N·D), and two unrelated 20k-line files pass every size limit while freezing the tab). Past a guard the result is `truncated` with a "diff anyway" escape hatch, and `truncatedReason` distinguishes "too large" from "too different".
- **Bring your own highlighter** — a `renderContent` seam hands you plain strings and segments; no bundled syntax library bloating your bundle.
- **Actually accessible** — real table semantics, one row header per row, visually-hidden "Added"/"Removed" labels (change type is never colour alone), keyboard-operable expanders, and truthful `aria-rowcount`/`aria-rowindex` even under virtualization.
- **House-standard robustness** — SSR- and StrictMode-safe, React 18 + 19, themeable via `--usefy-diff-*` CSS variables, CJK-aware tokenizer.

---

## Installation

```bash
# npm
npm install @usefy/diff-viewer

# yarn
yarn add @usefy/diff-viewer

# pnpm
pnpm add @usefy/diff-viewer
```

**Styles inject themselves at runtime** — no CSS import is required for the component to look right (the same pattern as `@usefy/spotlight-tour`). If you prefer to bundle the styles yourself (e.g. to control ordering or for a strict CSP), import the stylesheet instead:

```ts
import "@usefy/diff-viewer/styles.css";
```

---

## Quick Start

```tsx
import { DiffViewer } from "@usefy/diff-viewer";

function Review({ before, after }: { before: string; after: string }) {
  return <DiffViewer oldText={before} newText={after} view="split" />;
}
```

That is the whole thing. The viewer computes the diff, collapses unchanged
context, highlights the changed words inside each modified line, and — for a
large diff — virtualizes the rows.

---

## Views

```tsx
<DiffViewer oldText={before} newText={after} view="split" />    // side-by-side
<DiffViewer oldText={before} newText={after} view="unified" />  // single column
```

Both views are a rendering of the same model, so they always agree about what
changed. `view` defaults to `"split"`. The pure view models are exported too,
if you want to build a bespoke renderer:

```ts
import { computeDiff, toSplitRows, toUnifiedRows } from "@usefy/diff-viewer";

const { hunks } = computeDiff(before, after);
const splitRows = toSplitRows(hunks[0]);   // [{ left, right }, …] with fillers
const unifiedRows = toUnifiedRows(hunks[0]); // the hunk's DiffLine[] in order
```

### States

The component renders three distinct states — never a blank box:

- **Changes** — the normal diff table.
- **No changes** — an explicit "No changes" message when the two texts are identical (after the whitespace/case options are applied).
- **Refused** — when a guard trips, an honest message plus a **"Diff anyway"** button that retries with the guards off. The copy distinguishes *too large* from *too different* (see [guards](#size--cost-guards)).

---

## API Reference

### `<DiffViewer />`

```tsx
<DiffViewer
  oldText={before}                 // the "before" document
  newText={after}                  // the "after" document
  view="split"                     // "split" | "unified"
  showLineNumbers                  // default true
  wrap={false}                     // wrap long lines (disables virtualization)
  theme="system"                   // "light" | "dark" | "system"
  context={3}                      // unchanged lines around each change (Infinity = whole file)
  ignoreWhitespace="none"          // "none" | "trailing" | "all" — matching only
  ignoreCase={false}               // matching only; renders the original
  inlineThreshold={0.5}            // min similarity to word-diff a changed pair
  maxEditDistance={6000}           // cost guard — refuse "too different" pairs
  virtualizeThreshold={200}        // window the DOM above this row count
  diff={precomputed}               // optional: a DiffResult, skips computeDiff
  renderContent={({ text }) => ...} // the syntax-highlighting seam
  labels={{ noChanges: "…" }}      // every string overridable for i18n
  classNames={{ root: "…" }}       // per-slot class names
  onExpand={(hunkIndex, lines) => {}}
/>
```

See the full [options table](#options). All numeric options are
NaN/Infinity-guarded.

### `computeDiff(oldText, newText, options?)`

The headless engine — two strings in, a `DiffResult` out:

```ts
interface DiffResult {
  hunks: DiffHunk[];                          // the renderable regions
  stats: { added: number; removed: number; unchanged: number };
  truncated: boolean;                         // a guard refused the diff
  truncatedReason?: "size" | "complexity";    // too big vs. too different
  inlineBudgetExhausted?: true;               // some word-highlighting was skipped
}
```

Each `DiffHunk` carries its collapsed lines (`hiddenBefore` / `hiddenAfter`
as real `DiffLine[]`), so a pre-computed `diff` prop can expand with no
source texts. See [headless usage](#headless-usage).

---

## Options

Passed as props to `<DiffViewer />`, and (the diff-relevant ones) accepted by
`computeDiff`. Every numeric option is NaN/Infinity-guarded.

| Option | Default | Description |
|---|---|---|
| `view` | `"split"` | `"split"` (side-by-side) or `"unified"` |
| `showLineNumbers` | `true` | Show the old/new line-number gutters |
| `wrap` | `false` | Wrap long lines instead of scrolling (**disables virtualization** — see below) |
| `theme` | `"system"` | `"light"` \| `"dark"` \| `"system"` (follows `prefers-color-scheme`) |
| `context` | `3` | Unchanged lines kept around each change (`Infinity` = whole file, no collapsing) |
| `collapseThreshold` | `4` | Extra unchanged lines beyond context before a run collapses into a gap |
| `expandStep` | `20` | Lines revealed per expand click |
| `defaultExpandAll` | `false` | Reveal every collapsed region on first render |
| `ignoreWhitespace` | `"none"` | `"none"` \| `"trailing"` \| `"all"` — affects **matching only**; the original text is always rendered |
| `ignoreCase` | `false` | Case-insensitive matching (renders the original) |
| `inlineDiff` | `true` | Word-level diffing inside paired changed lines |
| `inlineThreshold` | `0.5` | Minimum similarity (0–1) before a changed pair is word-diffed |
| `maxInlineChars` | `1000` | Longest line still word-diffed, per side (`Infinity` = no limit) |
| `maxLines` | `20000` | **Size** guard, per side (`Infinity` disables) |
| `maxBytes` | `2_000_000` | **Size** guard, per side, UTF-8 bytes (`Infinity` disables) |
| `maxEditDistance` | `6000` | **Cost** guard — give up past this edit distance (`Infinity` disables) |
| `virtualizeThreshold` | `200` | Row count above which only the visible window is rendered (`Infinity` disables) |
| `rowHeight` | `22` | Row height in px — the unit virtualization counts in |
| `renderContent` | — | The syntax-highlighting seam (see below) |
| `diff` | — | A pre-computed `DiffResult` — skips `computeDiff` entirely |
| `labels` | — | Every user-facing string, overridable for i18n |
| `classNames` | — | Per-slot class names (`root`, `header`, `row`, `gutter`, `lineNumber`, `content`, `gap`, `marker`) |
| `onExpand` | — | `(hunkIndex, lines) => void`, fired after a gap is expanded |

> **Compare vs. render.** `ignoreWhitespace` and `ignoreCase` change what
> counts as a *difference* — the viewer always renders the **original** text.
> A tabs-vs-spaces reindent under `ignoreWhitespace: "all"` shows the real
> indentation while not being flagged as a change.

---

## Headless Usage

```ts
import { computeDiff } from "@usefy/diff-viewer/headless";

const result = computeDiff(before, after, { context: 3 });

if (result.truncated) {
  console.log(
    result.truncatedReason === "size"
      ? "These files are too large to diff."
      : "These files have too little in common to diff quickly.",
  );
} else {
  console.log(`+${result.stats.added} -${result.stats.removed}`);
  for (const hunk of result.hunks) {
    if (hunk.hiddenBefore.length) console.log(`⋯ ${hunk.hiddenBefore.length} unchanged`);
    for (const line of hunk.lines) {
      const marker = line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
      console.log(marker + line.content);
    }
  }
}
```

Zero React, zero runtime dependencies, zero DOM access — safe to import in a
Node script, a Web Worker, or during SSR. The lower-level pieces are exported
too, for building or testing a bespoke model:

```ts
import {
  myersDiff,        // the raw edit script over any T[]
  myersDiffBounded, // …with an edit-distance budget (returns null if exceeded)
  splitLines,       // CRLF-normalizing, trailing-newline-safe line splitter
  tokenizeWords,    // the CJK-aware word tokenizer
  normalizeLine,    // the whitespace/case compare-form
  similarity,       // 0–1 line similarity (the inline-diff gate)
  inlineSegments,   // word-level segments for one paired line
  buildHunks,       // context grouping + collapse
  resolveOptions,   // options → sanitized, defaulted shape
} from "@usefy/diff-viewer/headless";
```

### `truncatedReason` and `inlineBudgetExhausted`

The `DiffResult` is honest about degradation:

- **`truncated: true`** with **`truncatedReason: "size"`** — the inputs exceeded `maxLines`/`maxBytes`; the diff was never attempted.
- **`truncated: true`** with **`truncatedReason: "complexity"`** — the inputs were small enough but too *different*; producing the diff would have exceeded `maxEditDistance`.
- **`inlineBudgetExhausted: true`** — the diff is complete and correct, but a per-call ceiling on total word-diffing was reached, so some paired lines render as whole-line changes instead of gaining inline highlighting. (Absent on an ordinary diff.)

---

## Syntax Highlighting

`@usefy/diff-viewer` deliberately bundles **no** syntax highlighter — that is
how diff libraries get fat and force a highlighter version on you. Instead, the
`renderContent` seam hands you the plain text (and the word-level segments, if
any) and you return React nodes. Plug in Shiki, Prism, `highlight.js`, or a
tiny hand-rolled tinter:

```tsx
import { DiffViewer, type DiffSegment } from "@usefy/diff-viewer";

<DiffViewer
  oldText={before}
  newText={after}
  renderContent={({ text, segments, side, line }) => {
    // `text` is the plain line; `segments` (if present) marks the changed words.
    // Return anything — highlighted spans, a Shiki-rendered fragment, etc.
    return highlight(text, detectLanguage(text));
  }}
/>
```

> **Security.** Diff content is always rendered as **text nodes** — the
> component never uses `dangerouslySetInnerHTML`. If your `renderContent`
> returns highlighted *markup* built from the untrusted diff text, that is your
> trust boundary: sanitize as you would anywhere else.

---

## Size & Cost Guards

Bounding the *size* of the inputs is not the same as bounding the *work*: Myers
is O((N+M)·D) in the edit distance `D`, so two unrelated 20,000-line files sit
comfortably inside every size limit and still block the main thread for
seconds. `@usefy/diff-viewer` therefore ships **two** kinds of guard:

- **Size** — `maxLines` (20,000/side) and `maxBytes` (2 MB/side), checked *before* the algorithm runs, without even materializing the lines.
- **Cost** — `maxEditDistance` (6,000): the line diff gives up past this edit distance rather than grind. Common prefixes/suffixes and pure insertions/deletions are handled without searching, so they never count against it.

A tripped guard returns `{ hunks: [], stats: {0,0,0}, truncated: true, truncatedReason }`; the component shows an honest message plus a **"Diff anyway"** button that retries with the guards off. Pass `Infinity` to disable any guard.

Inline (word-level) diffing has its own O(1) pre-gate: a `maxInlineChars`
(1,000) length limit and a provable-similarity-ceiling check run *before* the
word diff, so a 110 KB single-line pair costs a millisecond instead of seconds.

---

## Virtualization

Above `virtualizeThreshold` rows (default 200) the component renders only the
visible window — a 20,000-line diff keeps ~45 rows in the DOM and scrolls at 60
fps, while `aria-rowcount` still reports the true total to assistive tech.
Windowing counts in a fixed `rowHeight` (default 22px).

- **Bounded height.** Above the threshold the component owns its vertical scroll (`--usefy-diff-max-height`, default `70vh`); below it, the diff grows with its content.
- **First paint is bounded too.** The very first render (and the server render for a large diff) windows from an estimated viewport rather than materializing every row, so a huge whole-file diff paints in one normal frame instead of a ~1 s commit.
- **`wrap` disables virtualization.** Wrapped lines have variable heights, which fixed-height windowing cannot model; with `wrap` on, every row is in the DOM (a console warning fires above the threshold). Use `wrap` for narrow, human-scale diffs — not for 20k-line files.

---

## Accessibility

- The diff is a real `<table>`: rows are `<tr>`, the first line-number cell of each row is `<th scope="row">` (exactly one per row), content cells are `<td>` — screen readers navigate it as tabular data. A visually-hidden `<caption>` gives the table an accessible name and speaks the stats.
- Every changed row carries a visually-hidden **"Added"/"Removed"** label **and** a `+`/`−` gutter glyph, so the change type is announced and never conveyed by colour alone.
- Expanders are real `<button>`s with **descriptive accessible names** ("Expand 20 lines above") even though the visible label is a compact glyph, in natural focus order, operable by keyboard with a visible focus ring.
- Under virtualization, `aria-rowcount`/`aria-rowindex` describe the *true* document, not the rendered window; the scroll region is keyboard-reachable, and focus is retained when a focused expander scrolls out of the window.
- All UI strings are overridable via `labels` for i18n.

The add/remove palette meets WCAG AA text contrast in both themes (measured
5.25–14.95:1). Note the row **tints alone** do not survive colour-blind
simulation — that is true of any pale red/green diff palette — which is exactly
why the `+`/`−` glyph and the visually-hidden label are the primary channels.

---

## Performance

Measured on the built bundle (engine timings in Node; rendering in headless
Chromium).

**Engine** (`computeDiff`, default options)

| Input | Result | Time |
|---|---|---|
| 5,000 lines, 4% changed | diffed | ~8 ms |
| 20,000 lines, 500 changed | diffed | ~31 ms |
| 20,000 lines, nothing in common | refused (`"complexity"`) | ~83 ms |
| 99 KB single-line pair, disjoint | no inline segments | ~1 ms |

**Rendering** (20,000-line diff, split, virtualized)

| Metric | Measured |
|---|---|
| Rows in the DOM | ~45 of 20,000 |
| Steady-state scroll | median 16.4 ms, p95 23.5 ms |

**Bundle** (minified + gzip, `scripts/measure-size.mjs`):

| Entry | Size |
|---|---|
| `@usefy/diff-viewer/headless` (full engine) | **~3.0 KB** |
| `@usefy/diff-viewer` (component + headless, CSS inlined) | **~9.2 KB** |

Zero runtime dependencies in the headless engine.

---

## Limitations

- **`wrap` and virtualization are mutually exclusive** — wrapped rows have variable heights; fixed-height windowing needs a known row height. Wrapping renders every row (documented, with a console warning on large diffs).
- **Whole-file mode on huge inputs** — `context: Infinity` keeps every line in the model. Virtualization still windows the DOM, but the model itself is large; the default `context: 3` collapses unchanged runs and is the better choice for very large files.
- **Line-level algorithm** — the diff is computed over lines (with word-level highlighting *inside* changed lines). It is not a character-level diff of the whole document, and it is not a 3-way merge.
- **No bundled syntax highlighter** — by design (the `renderContent` seam is the extension point).
- **Not a patch parser** — it diffs two strings; it does not parse or emit unified-patch (`git diff`) format.

---

## Prior Art

Verified 2026-07-22. `react-diff-viewer` (the long-standing React choice) last
published **v3.1.1 in May 2020** and is effectively unmaintained; the community
maintains `react-diff-viewer-continued` as an actively-updated fork. Both are
widely used. `@usefy/diff-viewer` is a fresh, React-18/19-native,
headless-first implementation with a linear-space Myers engine, built-in row
virtualization, an explicit cost guard, and the accessibility work above.

---

## License

MIT © [usefy](https://github.com/mirunamu00/usefy)
