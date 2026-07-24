# DiffViewer Component Specification

## Overview

**Package Name:** `@usefy/diff-viewer` — single package with a `./headless` subpath (house pattern: virtual-keyboard, spotlight-tour, confetti, signature-pad)
**Version:** `0.1.0`
**Status:** Shipped (Phases 1–4 complete; browser-QA'd; `apps/web` presented)
**Created:** 2026-07-24
**Author:** usefy team

---

## 1. Executive Summary

### 1.1 Purpose

`@usefy/diff-viewer` renders the difference between two texts the way a code
review tool does: side-by-side or unified, with line numbers, added/removed
highlighting, **word-level highlighting inside changed lines**, and unchanged
regions collapsed behind expandable context. The core is a **hand-written
Myers diff engine** — pure functions over token arrays, hand-testable, zero
dependencies.

This is the first usefy standalone that is a **data/text** component rather
than a visual widget, broadening the library beyond overlays and canvases.

The competitive gap: `react-diff-viewer` — the long-standing React choice —
last published **v3.1.1 in May 2020** and is effectively unmaintained; the
community maintains `react-diff-viewer-continued` as an **actively-updated**
fork (v4.4.0, 2026-07-14). A React-18/19-native, headless-first, virtualized,
accessible implementation with a linear-space Myers engine and a
bring-your-own-highlighter seam is a fresh take, not a claim that the
incumbents are abandoned.

> **Competitive claim — verified 2026-07-22** (npm registry + downloads API):
> `react-diff-viewer` latest v3.1.1 published 2020-05-22, ~276K weekly
> downloads; `react-diff-viewer-continued` v4.4.0 published 2026-07-14, ~770K
> weekly downloads (the fork is the more-used one and is actively maintained).
> The README's "Prior Art" section states only these verified facts — no
> "abandoned" framing, since the fork disproves it.

### 1.2 Target Users

- **Code review / CI dashboards** — show a patch inline in your own UI.
- **CMS & admin revision history** — "what changed in this document?".
- **Config / infra tools** — diff YAML, JSON, `.env`, IaC plans before apply.
- **Audit & compliance trails** — human-readable record of edits.
- **Design systems** wanting the diff *model* (`./headless`) with a bespoke UI.

### 1.3 Key Value Propositions

1. **Real diff engine, zero deps**: Myers O(ND) with a linear-space middle-snake
   refinement, plus word-level intra-line diffing — pure, unit-tested functions.
2. **One model, two layers**: `computeDiff()` (framework-free, `./headless`) →
   `<DiffViewer />`. The view is a rendering of the model, nothing more.
3. **Big inputs stay usable**: row virtualization and an explicit size guard —
   a 20k-line diff renders instantly instead of freezing the tab.
4. **Bring your own highlighter**: no bundled syntax highlighter (that's how
   diff libraries get fat). A `renderContent` seam lets consumers plug Shiki,
   Prism, or nothing at all.
5. **Actually accessible**: real table semantics, per-row change announcements,
   keyboard-navigable expand controls — the thing every diff viewer skips.
6. **SSR/StrictMode-safe**, themeable via `--usefy-diff-*` CSS variables.

---

## 2. Scope & Non-Goals

### 2.1 In scope (v0.1.0 — full spec, single release)

- Line-level diff of two strings: Myers algorithm, `\r\n`/`\n` normalization,
  trailing-newline handling, `ignoreWhitespace` (`none` | `trailing` | `all`)
  and `ignoreCase` options.
- Word-level intra-line diff for paired changed lines, with a similarity gate
  so unrelated lines aren't rendered as character soup.
- Hunk model: changes grouped with N lines of context; unchanged gaps collapsed
  into expandable regions (expand-by-N and expand-all).
- Two views from one model: **split** (side-by-side) and **unified** (inline).
- Line numbers (old/new), change gutter markers, per-file stats
  (`+added / −removed`).
- Virtualized row rendering for large diffs; explicit `maxLines`/`maxBytes`
  guard with a "diff anyway" escape hatch.
- `renderContent` seam for syntax highlighting; `renderRow`-level escape hatch
  for full custom rows.
- Theming via `--usefy-diff-*` CSS variables, light/dark; `classNames` slots.
- A11y: table semantics with line-number row headers, visually-hidden
  added/removed labels, keyboard-operable expanders, no color-only signaling.
- SSR-safe (no DOM at import; renders real markup on the server for small
  diffs), StrictMode-safe.

### 2.2 Out of scope for v0.1.0 (possible later)

- **3-way merge / conflict resolution** and any editing of the diff.
- **Built-in syntax highlighting** (seam only — deliberate, see §11 decision 4).
- Unified-patch (`git diff` output) parsing/generation — the data model is
  designed to accept it later.
- Multi-file diffs / file trees / commit navigation.
- Image, binary, or PDF diffing.
- Word-wrap **plus** virtualization simultaneously (see §11 decision 6).
- Web Worker offloading (the size guard covers the pathological case).

### 2.3 Explicit non-goals

- Not a code editor and not a git client.
- No network calls, no telemetry.

---

## 3. Functional Requirements

### 3.1 Diff engine

| Feature | Description | Priority |
|---|---|---|
| Line diff | Myers O(ND) over line tokens; linear-space middle-snake divide & conquer so memory stays O(N+M) | P0 |
| Normalization | `\r\n` → `\n`; a trailing newline never produces a phantom final empty line | P0 |
| Whitespace options | `ignoreWhitespace: "none" \| "trailing" \| "all"` — compares normalized tokens, **renders original text** | P0 |
| Case option | `ignoreCase` — same compare-normalized/render-original rule | P1 |
| Word diff | Same engine over word tokens for paired changed lines; token boundaries handle latin words, punctuation, and CJK runs | P0 |
| Similarity gate | Word diff only when the pair's similarity ≥ `inlineThreshold` (default 0.5); below that the lines render as whole-line change | P0 |
| Pairing | Within a change block, removed[i] pairs with added[i]; surplus lines on either side stand alone | P0 |
| Stats | `{ added, removed, unchanged }` line counts | P1 |
| Determinism | Identical inputs + options → identical model (no time/random) | P0 |
| Size guard | Beyond `maxLines`/`maxBytes` return `{ truncated: true }` without running the algorithm | P0 |

### 3.2 Hunks & context

| Feature | Description | Priority |
|---|---|---|
| Context grouping | Changes grouped with `context` (default 3) unchanged lines each side | P0 |
| Collapsed gaps | Unchanged runs longer than `2 × context + collapseThreshold` become a gap marker ("⋯ 42 unchanged lines") | P0 |
| Expansion | Expand a gap by `expandStep` (default 20) lines up/down, or fully; state lives in the component (uncontrolled) with `defaultExpandAll` | P1 |
| Whole-file mode | `context: Infinity` renders everything with no gaps | P1 |

### 3.3 Views

| Feature | Description | Priority |
|---|---|---|
| Split view | Old left / new right, aligned rows; empty filler cells for unpaired lines | P0 |
| Unified view | One column, removed rows then added rows within each change block | P0 |
| Line numbers | Old and new numbering, correct across expansions; togglable | P0 |
| Change markers | `+`/`−` gutter glyphs **and** color — never color alone | P0 |
| Word highlight | Inline segments highlighted within the row's line highlight | P0 |
| Virtualization | Windowed rendering above `virtualizeThreshold` rows (default 200) using a fixed row height | P0 |
| Wrap | `wrap` renders long lines wrapped; **disables virtualization** (documented) | P1 |
| Empty/identical | Identical inputs render an explicit "No changes" state, not a blank box | P1 |

### 3.4 Customization & environment

| Feature | Description | Priority |
|---|---|---|
| `renderContent` | `(args: { text, segments, side, line }) => ReactNode` — the syntax-highlighting seam | P0 |
| `classNames` slots | root, header, row, gutter, lineNumber, content, gap, marker | P1 |
| Theming | `--usefy-diff-*` variables; light/dark/system | P0 |
| Labels | All UI strings overridable (i18n) | P1 |
| SSR | Renders real rows on the server (small diffs); virtualization activates after mount | P0 |

---

## 4. Technical Specifications

### 4.1 Data model

```typescript
/** One line in the diff model. */
export interface DiffLine {
  type: "add" | "remove" | "context";
  /** 1-based line number in the old text (undefined for adds). */
  oldNumber?: number;
  /** 1-based line number in the new text (undefined for removes). */
  newNumber?: number;
  /** The ORIGINAL line text (never the normalized compare form). */
  content: string;
  /** Word-level segments when this line was paired; undefined otherwise. */
  segments?: DiffSegment[];
}

export interface DiffSegment {
  /** "same" renders plain; "change" renders the inline highlight. */
  type: "same" | "change";
  text: string;
}

/** A contiguous region of the diff, with its context and its collapsed regions. */
export interface DiffHunk {
  oldStart: number;
  newStart: number;
  lines: DiffLine[];
  /** Unchanged lines hidden BEFORE this hunk (0 = nothing collapsed). */
  gapBefore: number;
  /** Those lines, in order — always `gapBefore` long (decision 11). */
  hiddenBefore: DiffLine[];
  /** Unchanged lines hidden AFTER this hunk — only the LAST hunk can have any. */
  gapAfter: number;
  /** Those lines, in order — always `gapAfter` long. */
  hiddenAfter: DiffLine[];
}

/** Why a guard refused to produce a model. */
export type DiffTruncationReason = "size" | "complexity";

export interface DiffResult {
  hunks: DiffHunk[];
  stats: { added: number; removed: number; unchanged: number };
  /** True when a guard refused the diff — hunks is empty, stats zeroed. */
  truncated: boolean;
  /** "size" = too big; "complexity" = too different. Undefined when not truncated. */
  truncatedReason?: DiffTruncationReason;
}
```

Walking `hiddenBefore` + `lines` + `hiddenAfter` across all hunks reproduces
the document exactly, once, in order — so a consumer holding only a
`DiffResult` (e.g. via the `diff` prop) can drive expansion with no
`oldText`/`newText` and no recompute. The hidden arrays hold the **same**
`DiffLine` objects, so this costs no extra memory.

### 4.2 Pure core (`src/diff/` — the hand-testable heart)

```typescript
/** Myers O(ND) with linear-space middle-snake recursion. Pure. */
export function myersDiff<T>(
  a: readonly T[],
  b: readonly T[],
  eq?: (x: T, y: T) => boolean,
): DiffOp[]; // [{ type: "equal"|"delete"|"insert", aIndex, bIndex, length }]

/**
 * As above, but returns null rather than spending more than `maxEditDistance`
 * edits' worth of search (decision 10). The bound is exact. Prefix/suffix
 * trimming and pure insert/delete need no search and are never charged.
 */
export function myersDiffBounded<T>(
  a: readonly T[],
  b: readonly T[],
  maxEditDistance: number,
  eq?: (x: T, y: T) => boolean,
): DiffOp[] | null;

/** Split text into lines, normalizing CRLF and the trailing newline. */
export function splitLines(text: string): string[];

/** Split a line into word/punctuation/CJK/whitespace tokens for inline diff. */
export function tokenizeWords(line: string): string[];

/** Compare-form of a line under the whitespace/case options. */
export function normalizeLine(line: string, opts: NormalizeOptions): string;

/** Word-level segments for one paired line change (both sides). */
export function inlineSegments(
  oldLine: string,
  newLine: string,
): { left: DiffSegment[]; right: DiffSegment[] };

/** 0–1 similarity used by the inline threshold gate. */
export function similarity(a: string, b: string): number;

/** Ops → lines → hunks with context/collapse applied. */
export function buildHunks(lines: DiffLine[], options: HunkOptions): DiffHunk[];

/** The one public entry point that composes all of the above. */
export function computeDiff(
  oldText: string,
  newText: string,
  options?: DiffOptions,
): DiffResult;
```

### 4.3 View model (`src/view/` — pure, shared by both views)

```typescript
export interface SplitRow {
  left: DiffLine | null;   // filler when null
  right: DiffLine | null;
}
export function toSplitRows(hunk: DiffHunk): SplitRow[];
export function toUnifiedRows(hunk: DiffHunk): DiffLine[];
```

Both views therefore render the *same* `DiffLine` objects — a rendering bug can
never make split and unified disagree about the content.

### 4.4 Options

| Option | Default | Description |
|---|---|---|
| `context` | `3` | Unchanged lines kept around each change (`Infinity` = whole file) |
| `collapseThreshold` | `4` | Extra unchanged lines beyond context before a gap collapses |
| `expandStep` | `20` | Lines revealed per expand click |
| `ignoreWhitespace` | `"none"` | `"none" \| "trailing" \| "all"` |
| `ignoreCase` | `false` | Case-insensitive comparison |
| `inlineDiff` | `true` | Word-level diffing inside paired changed lines |
| `inlineThreshold` | `0.5` | Minimum similarity to attempt inline diff |
| `maxInlineChars` | `1000` | Longest line still word-diffed, per side (`Infinity` = no limit) |
| `maxLines` | `20000` | Size guard (per side) |
| `maxBytes` | `2_000_000` | Size guard (per side) |
| `maxEditDistance` | `6000` | **Cost** guard: give up past this edit distance (`Infinity` = no guard) |

Collapse economics apply at all three positions. An interior run spends
context on both sides, an edge run on one, so a run collapses only when it
would hide **more than `collapseThreshold`** lines:

| Run | Collapses when | Then hides |
|---|---|---|
| Leading | `R > context + collapseThreshold` | `R − context` |
| Interior | `R > 2 × context + collapseThreshold` | `R − 2 × context` |
| Trailing | `R > context + collapseThreshold` | `R − context` |

#### Why `maxEditDistance` exists, and why 6000

`maxLines`/`maxBytes` bound the inputs' **size**. They do not bound the
**work**: Myers costs O((N + M) · D), so two unrelated 20 000-line files sit
inside every size limit and still block the main thread for seconds. Measured
on the built bundle, default options, `truncated === false` before this guard
existed:

| Case (20 000 lines/side) | Unbounded | With `maxEditDistance: 6000` |
|---|---|---|
| Nothing in common | 3 442–5 711 ms | **73 ms** (bails, `"complexity"`) |
| Every other line changed | 2 325 ms | **116 ms** (bails) |
| 25 % of lines changed | 865 ms | **146 ms** (bails) |
| 12.5 % changed (2 500 lines) | — | 268 ms (succeeds) |
| 5 % changed (1 000 lines) | — | 58 ms (succeeds) |
| 2.5 % changed (500 lines) | — | 33 ms (succeeds) |

Worst-case *bail* cost against the budget, on the hardest possible input:

| `maxEditDistance` | 1000 | 2000 | 3000 | 4000 | **6000** | 8000 | 10000 | 12000 |
|---|---|---|---|---|---|---|---|---|
| Bail cost | 10 ms | 13 ms | 21 ms | 36 ms | **82 ms** | 153 ms | 209 ms | 285 ms |

6000 keeps the worst case at ~82 ms here — roughly 140 ms on a machine 1.7×
slower, comfortably inside the 250 ms target — while admitting ~3 000
modified lines (a modification costs 2: one delete plus one insert), i.e.
15 % of a `maxLines`-sized file. That covers codemods and formatter runs and
refuses only pairs with essentially nothing in common.

#### Why the inline gate is pre-filtered

Word-level diffing is O(L²) for a pair of disjoint lines. Running it *before*
the `similarity ≥ inlineThreshold` check meant paying that cost only to throw
the result away — measured 82 ms at 12 KB, 853 ms at 54 KB, 3 626 ms at
110 KB, all producing `segments: undefined`. The trigger shapes are exactly
the target users: minified bundles, one-line JSON, lockfile lines, base64,
YAML flow values.

Two O(1) tests now run first: the `maxInlineChars` length limit, and a
**provable ceiling** — at most `min(A, B)` characters can ever match, so
`similarity ≤ 2·min(A,B)/(A+B)`; when that is already below the threshold the
gate is mathematically unreachable and no diff is attempted. A companion
internal aggregate (`MAX_INLINE_TOTAL_CHARS = 200 000`) bounds the *total*
characters word-diffed per call, so a document made entirely of
just-under-the-limit changed lines cannot add up either.

| Case | Before | After |
|---|---|---|
| 99 KB single-line pair, disjoint | 2 810–3 717 ms | **1 ms** |
| 1 char vs 110 KB line | seconds | **1 ms** (ceiling gate) |
| 2 000 pairs of ~700-char lines | 659 ms | **114 ms** (aggregate) |
| 789-char legitimately similar pair | segments | **segments** (unchanged) |

### 4.5 React API

```typescript
export interface DiffViewerProps extends DiffOptions {
  oldText: string;
  newText: string;
  /** Pre-computed model — skips computeDiff (e.g. computed in a worker). */
  diff?: DiffResult;
  view?: "split" | "unified";            // default "split"
  showLineNumbers?: boolean;             // default true
  wrap?: boolean;                        // default false (see §11 #6)
  virtualizeThreshold?: number;          // default 200 rows
  rowHeight?: number;                    // default 22 (px, fixed-height rows)
  defaultExpandAll?: boolean;
  /** Syntax-highlighting seam. */
  renderContent?: (args: {
    text: string;
    segments?: DiffSegment[];
    side: "old" | "new";
    line: DiffLine;
  }) => React.ReactNode;
  labels?: Partial<Record<
    "expandUp" | "expandDown" | "expandAll" | "hiddenLines" | "noChanges" |
    "tooLarge" | "diffAnyway" | "added" | "removed", string>>;
  theme?: "light" | "dark" | "system";
  classNames?: Partial<Record<
    "root" | "header" | "row" | "gutter" | "lineNumber" | "content" |
    "gap" | "marker", string>>;
  className?: string;
  onExpand?: (hunkIndex: number, lines: number) => void;
}

export function DiffViewer(props: DiffViewerProps): React.ReactNode;
```

`computeDiff` runs in a `useMemo` keyed on inputs+options; passing `diff`
bypasses it entirely for consumers who compute elsewhere.

### 4.6 Dependencies

| Package | Purpose |
|---|---|
| — (headless) | **Zero runtime deps** |
| `@usefy/use-isomorphic-layout-effect` | React: SSR-safe measurement |
| `@usefy/use-resize-observer` | React: viewport height for virtualization |
| `react` / `react-dom` (peer) | ^18 \|\| ^19 |

No CSS pipeline decision: the viewer **does** need real styling (table layout,
colors, sticky gutter), so unlike confetti it ships SCSS modules with runtime
injection + a `./styles.css` export — virtual-keyboard/spotlight-tour precedent,
`sideEffects: ["*.css"]`.

### 4.7 Performance contract — **measured**

All numbers below are measured on the built bundle, not estimated. Engine
timings are Node on the dev machine; rendering timings are headless Chromium
at 1280×900 via the Phase 3 browser pass.

**Engine** (`computeDiff`, default options)

| Input | Result | Time |
|---|---|---|
| 5 000 lines, 4 % changed | 200 +/200 − | **8 ms** (contract: < 150 ms) |
| 20 000 lines, 500 changed | diffed | **31 ms** |
| 20 000 lines, 1 000 changed | diffed | **67 ms** |
| 20 000 lines, nothing in common | refused, `"complexity"` | **83 ms** (was 4 461 ms unbounded) |
| 99 KB single-line pair, disjoint | no inline segments | **1 ms** (was 4 180 ms ungated) |
| 1 char vs 110 KB line | no inline segments | **1 ms** (provable ceiling) |

**Rendering** (20 000-line diff, split view, virtualized)

| Metric | Measured |
|---|---|
| Rows in the DOM | **45** of 20 000 (271 cells total) |
| Steady-state scroll, 118-frame sweep | median **16.4 ms**, p95 **23.5 ms**, worst **29.4 ms** |
| First-paint transition (whole-file 20 000-line diff, mount → windowed) | worst single frame **~25 ms** (3 frames total) |

The steady-state scroll median sits on the 60 fps budget (16.7 ms) and the
p95 stays inside two frames — no dropped-frame pileup. `aria-rowcount` stays
20 000 throughout, so assistive technology sees the document, not the window.

The first-paint row (its own honest measurement) is the transition an earlier
draft glossed over. It **was** a ~1.1 s freeze: the pre-measurement render
materialised the whole list before the window narrowed, i.e. ~120 000 DOM
nodes built and immediately torn down. The window now starts from an
estimated viewport (resolved decision #15), so the first client paint — and
the server render for a large diff — is already bounded; the effect refines
the exact height a frame later. That turned the freeze into a normal ~25 ms
frame, which is why the "worst" scroll figure above is now genuinely
steady-state rather than steady-state-with-an-asterisk.

**Bundle** (`scripts/measure-size.mjs`)

| Entry | Measured | Target |
|---|---|---|
| `./headless` | 3.03 KB gz | < 5 KB gz |
| `.` (React, CSS inlined) | 9.13 KB gz | < 11 KB gz |

The React entry inlines the stylesheet for runtime injection, so the SCSS
sources use `//` line comments rather than `/* */` blocks: sass strips the
former and ships the latter. The rationale stays in the source; 7.3 KB of
prose stopped riding along in every consumer's bundle (18.2 KB → 10.8 KB of
CSS, and 12.01 → 9.13 KB gz for the entry).

---

## 5. Architecture

```
packages/diff-viewer/
├── src/
│   ├── index.ts               # "." surface (React + headless re-export)
│   ├── headless.ts            # "./headless" surface (zero React)
│   ├── types.ts               # model + options + resolveOptions (toFinite guards)
│   ├── diff/                  # PURE — 100% coverage target
│   │   ├── myers.ts           # myersDiff (linear-space middle snake)
│   │   ├── tokenize.ts        # splitLines, tokenizeWords, normalizeLine
│   │   ├── inline.ts          # inlineSegments, similarity
│   │   ├── hunks.ts           # buildHunks (context + collapse)
│   │   └── computeDiff.ts     # the composed entry point
│   ├── view/rows.ts           # toSplitRows / toUnifiedRows (pure)
│   ├── DiffViewer.tsx         # component shell (header, stats, table)
│   ├── components/
│   │   ├── Row/               # split + unified row renderers
│   │   ├── Gap/               # collapsed-region expander
│   │   └── Virtualizer/       # windowed row rendering
│   ├── styles/_variables.scss # --usefy-diff-*
│   └── *.test.ts(x)
├── scripts/measure-size.mjs
├── package.json               # ".", "./headless", "./styles.css"
├── tsup.config.ts             # single config, two entries + SCSS pipeline
└── SPEC.md / README.md
```

**Data flow:** `oldText/newText + options → computeDiff (pure) → DiffResult →
toSplitRows/toUnifiedRows (pure) → virtualizer window → row components`.
Everything above the components is pure and testable without a DOM.

---

## 6. Development Milestones

> House loop: each phase ends green and passes a `usefy-reviewer` checkpoint (★).
> Phase 4 carries the mandatory browser QA **and the `apps/web` presentation**
> (CLAUDE.md "A new standalone component must also land on apps/web").

### Phase 1 — Diff core ★ ✅

- [x] Scaffold (signature-pad/confetti parity + SCSS pipeline from
      spotlight-tour; `rimraf dist && tsup`, single config, measure-size script).
- [x] Types + `resolveOptions` with `toFinite` guards on every numeric option.
- [x] `myersDiff` (linear-space), `splitLines`, `tokenizeWords`,
      `normalizeLine`, `similarity`, `inlineSegments`, `buildHunks`,
      `computeDiff` — hand-computed tests, **100% coverage on `src/diff/`**.
- [x] Correctness suite: classic diff cases (insert/delete/replace at head,
      middle, tail), CRLF + trailing-newline, whitespace/case options,
      inline-threshold gate, identical inputs, one-side-empty, size guard,
      determinism, and a randomized property test (apply the ops to `a` and
      assert you reconstruct `b` exactly).
- [x] **Optimality oracle**: an independent DP-LCS implementation asserts the
      script is not merely valid but *shortest*, over an exhaustive
      binary-alphabet sweep (3 969 pairs), a 3-symbol sweep, a long
      prefix/suffix matrix, and every randomized case.
- [x] **Cost guard** (`maxEditDistance`, decision 10) and the **inline
      pre-gate** (`maxInlineChars` + the provable ceiling + an aggregate
      ceiling) — the two defects a size-only guard could not catch.
- [x] **Expansion data in the model** (decision 11) and edge-symmetric
      collapse economics at head, interior and tail.

### Phase 2 — Views & React shell ★ ✅

- [x] `toSplitRows`/`toUnifiedRows` (pure, tested for alignment and pairing);
      both views project the *same* `DiffLine` objects, asserted by identity.
- [x] `<DiffViewer />`: table semantics, split + unified, line numbers, gutter
      markers, inline segment highlighting, stats header, "No changes" and
      "too large / too different + diff anyway" states.
- [x] Gap component: expand up/down/all, line numbers stay correct after
      expansion (tested), `onExpand` callback, `defaultExpandAll`. Driven
      entirely from the model, so a consumer passing `diff` can expand too.
- [x] SCSS theming (`--usefy-diff-*`), light/dark/system, `classNames` slots,
      `renderContent` seam.
- [x] Component tests incl. SSR render and StrictMode.

> **Browser QA at Phase 2** (not deferred to Phase 4 — a component nobody has
> looked at is not done). Driven in headless Chromium, both themes, with
> screenshots. It caught two defects that every unit test passed straight
> through, because jsdom applies no CSS:
>
> 1. **Row tints never rendered.** The stylesheet used descendant selectors
>    (`.add .content`) but the change-type class lands on the *same* element
>    as the role class. Only the inline `<mark>`s were coloured; every add/
>    remove row was plain white. Fixed to compound selectors
>    (`.content.add`), with a test asserting the DOM shape the CSS relies on.
> 2. **Columns were sized wrong.** Under `table-layout: fixed` the browser
>    takes widths from the first row — a collapsed-region row with a single
>    `colSpan` cell — so all six columns came out equal and the code was
>    shoved into the middle of the table. Fixed with an explicit
>    `<colgroup>`, plus a test.
>
> Also verified: keyboard focus reaches the expanders with a real 2 px
> outline in both themes; `Enter` activates them; contrast measured at
> 5.25–14.95:1 (WCAG AA needs 4.5:1); collapsed gaps do **not** self-expand
> on load; CJK highlights per character for Han/Kana and per word for Hangul.

### Phase 3 — Virtualization, large inputs & a11y ★ ✅

- [x] Windowed rendering above `virtualizeThreshold` (fixed `rowHeight`),
      scroll-anchored, expansion-aware; `wrap` disables it with a console
      warning above the threshold (resolved decision #6).
- [x] Row-count assertions: a 20k-line diff keeps **45 rows** in the DOM.
- [x] A11y: one `<th scope="row">` per row, visually-hidden "Added"/"Removed",
      descriptive expander names, a visually-hidden `<caption>`, a
      keyboard-reachable scroll region, and `aria-rowcount`/`aria-rowindex`
      that stay truthful **under** virtualization; focus is caught by the
      scroll container when the focused expander is windowed out.
- [x] Performance measurements recorded in §4.7 (real numbers).

> **Virtualization needs a bounded viewport.** Above the threshold the
> component caps its own height (`--usefy-diff-max-height`, default `70vh`)
> and scrolls internally; below it the diff grows with its content rather
> than trapping the page's scroll in an arbitrary box.
>
> A bug worth remembering, caught only in the browser: the height cap was
> first driven by *whether windowing had happened* rather than by whether it
> was **wanted**. That deadlocks — an unbounded scroller grows to the full
> 20 000-row height, so it always "fits" its own content, so the window never
> narrows, so the cap is never applied. All 20 000 rows stayed in the DOM
> while every unit test passed. Intent first, measurement second.

### Phase 4 — Ship ★ ✅

- [x] Storybook: interactive-first stories (no self-running plays) — split-vs-
      unified toggle, real-world code diff, prose/CJK diff, whitespace-option
      demo, huge-diff (virtualization) demo, custom `renderContent` with a tiny
      dependency-free highlighter, dark theme; one `!autodocs` InteractionTest
      that expands a gap, toggles the view, and walks the "diff anyway" path.
- [x] **Browser QA with screenshots**: every story idle on open (nothing
      self-runs), both views legible, inline highlighting readable in both
      themes, long lines don't overlap (B1 re-verified in Storybook),
      expanders work by mouse and keyboard with a visible focus ring, 20k
      virtualized scroll (median 16.6 ms), CJK per-char/per-word confirmed,
      refusal copy distinguishes too-large from too-different, `+`/`−` glyph
      present as the non-colour channel.
- [x] READMEs (package + root), **`apps/web` presentation — all six touchpoints
      (registry, `PRODUCTS` + `demo` union + `LIVE_DEMO_SLUGS`, `--accent-diff-viewer`
      ×3, card micro-demo, `diff-viewer-demo.tsx` + `DEMOS` map, workspace
      dep)**, browser-verified card + live demo in both themes, changeset
      (`@usefy/diff-viewer` minor, standalone), SPEC status flipped, competitive
      claim verified (§1.1 / README "Prior Art").

---

## 7. Testing Strategy

- **Pure core** (highest signal): hand-computed Myers op sequences for small
  inputs; the reconstruct-`b`-from-ops property test over randomized strings;
  tokenizer tables (latin/punctuation/CJK/whitespace); normalization matrix;
  similarity/threshold boundaries; hunk grouping and collapse arithmetic.
- **View models**: split alignment with unpaired surpluses, unified ordering,
  line-number continuity across expansions.
- **Component**: both views render the same content; markers + a11y labels;
  expansion; "no changes"/"too large" states; `renderContent` invoked with the
  right args; SSR/StrictMode.
- **Virtualization**: rendered-row count ≪ total rows; scroll updates the
  window; disabled under `wrap`.
- **Browser (Phase 4)**: visual quality, 60 fps scroll, huge-diff timing.

---

## 8. Accessibility

- The diff is a `<table>`: rows are `<tr>`, line numbers are `<th scope="row">`,
  content cells are `<td>` — screen readers can navigate it as tabular data.
- Every changed row carries a visually-hidden "Added"/"Removed" label, so the
  change type is announced, never conveyed by color alone (gutter glyphs back
  it visually).
- Expanders are real `<button>`s with descriptive labels ("Expand 20 lines
  above"), in natural focus order.
- Palette meets WCAG AA contrast in both themes and is checked for
  deuteranopia/protanopia legibility (the red/green trap).
- Virtualized rows use `aria-rowcount`/`aria-rowindex` so assistive tech sees
  the true total, not the rendered window.

---

## 9. Security

- No network, no telemetry, no storage.
- All diff content renders as **text nodes** — never `dangerouslySetInnerHTML`.
  The `renderContent` seam hands the consumer plain strings/segments; if they
  choose to render highlighted HTML, that is their trust boundary and the
  README says so explicitly.

---

## 10. Success Criteria

### Functional
- [x] Correct diffs for the standard case matrix; ops always reconstruct `b`
      (property test over 600 seeded cases + a DP-LCS optimality oracle).
- [x] Split and unified agree (asserted by object identity); line numbers
      correct through expansions.
- [x] Inline word highlighting reads clearly and doesn't fire on unrelated
      lines (similarity gate; verified by eye in Storybook, both themes).
- [x] 20k-line diff renders and scrolls smoothly (~45 rows in the DOM, median
      16.4 ms/frame); oversize/too-different input degrades gracefully with an
      explicit "diff anyway" escape hatch.

### Non-functional
- [x] `src/diff/` **100%** coverage; package **100%** lines/functions, 99.5%
      branches (well past the ≥ 90% bar).
- [x] Headless **3.03 KB gz** (< 5), React **9.18 KB gz** (< 11); zero runtime
      deps in headless (grep-verified, no React/DOM in the built graph).
- [x] SSR + StrictMode safe; React 18 & 19; TS strict.
- [x] WCAG AA (measured 5.25–14.95:1) with an honest colour-blind note (the
      `+`/`−` glyph and sr-only label are the primary channels); browser-QA
      screenshots cited.
- [x] `apps/web` card + live demo shipped in this same branch, browser-verified
      in both themes.

---

## 11. Resolved Decisions

1. **Packaging** — single package + `./headless` (5th consecutive house use);
   no umbrella wiring; independent versioning. ✅
2. **Ships CSS** — unlike confetti/signature-pad this component is real styled
   markup: SCSS modules + runtime injection + `./styles.css` export,
   `sideEffects: ["*.css"]` (virtual-keyboard/spotlight-tour precedent). ✅
3. **Myers, not patience/histogram** — Myers is the well-understood baseline and
   the pure-function shape the house tests best; alternative algorithms can be
   added behind an `algorithm` option later without an API break. ✅
4. **No bundled syntax highlighter** — a `renderContent` seam instead. Bundling
   Shiki/Prism would multiply the package size and force a version on consumers;
   the seam keeps the diff engine the product. ✅
5. **Compare normalized, render original** — whitespace/case options affect
   *matching* only; the viewer always shows the real text. ✅
6. **`wrap` disables virtualization** — variable row heights would require
   measured virtualization, which is a Phase-5-class problem. Fixed-height rows
   virtualize; wrapping renders every row and is documented as such (with a
   console warning above a large row count). ✅
7. **Size guard over a Worker** — an explicit `truncated` result with a "diff
   anyway" affordance is honest and dependency-free; Workers stay out of scope. ✅
8. **NaN/Infinity guards from day one** (`toFinite` on every numeric option) —
   confetti/signature-pad review lesson, pre-applied. ✅
9. **Defaults are hypotheses until browser QA** (row height, palette, inline
   threshold, collapse thresholds); retune by eye at Phase 4 is pre-authorized
   and must be documented in §4.4. ✅
10. **Cost guard as well as size guards** — `maxLines`/`maxBytes` bound input
    size, which is *not* the same as bounding work: Myers is O(N·D), and two
    unrelated 20 000-line files pass every size check while freezing the tab
    for ~5.7 s. `maxEditDistance` caps the search and returns the same honest
    `truncated` result, so the existing "diff anyway" affordance covers it.
    `truncatedReason` (`"size"` vs `"complexity"`) lets the UI say *which*,
    because "too large" and "too different" need different words. A silent
    delete-all/insert-all fallback was rejected: a wrong-looking diff is worse
    than an explicit refusal the user can override. ✅
11. **Expansion data travels with the model** — `buildHunks` used to discard
    the lines it collapsed, so a consumer passing the pre-computed `diff` prop
    (§4.5) could not expand at all, and trailing hidden lines had no marker
    whatsoever. Hunks now carry `hiddenBefore`/`hiddenAfter` as real
    `DiffLine[]`. Peak memory is unchanged — `computeDiff` already
    materializes every line before hunking, and the arrays share those
    objects. There is deliberately **no** `gapBefore`/`gapAfter` count field:
    two sources of truth for one number is a trap for hand-built `diff`
    props, where a stale count and a real array silently disagree. ✅
12. **The table sizes to its content, not to its container** —
    `table-layout: fixed` + `width: 100%` cannot grow a column, and
    `white-space: pre` cannot wrap, so any line wider than its column painted
    over the opposite side's gutter and code with no scroll range to escape
    it. `width: max-content; min-width: 100%` with `table-layout: auto` gives
    the scroller a real range and extends the row tints across it. Long lines
    are the normal case (imports, URLs, JSX props, config objects), and
    §1.2 names config/infra diffing as a target use. The scroll region is
    focusable when it overflows, because a browser will not scroll a
    container that cannot take focus. ✅
13. **Every row has a fixed height** (`--usefy-diff-row-height`, 22px) — an
    empty cell generates no line box under `white-space: pre`, so a blank
    source line collapsed the row to 0px and the viewer silently drew fewer
    lines than its own header claimed. The same constant is the unit
    virtualization windows on, which is why `wrap` (variable heights)
    disables windowing rather than working around it. ✅
14. **Interactive state is scoped to what produced it** — expansion counts
    are held together with the model they belong to, and "Diff anyway" is
    stored as the input identity it was granted for rather than as a bare
    boolean. Both used to survive a document swap: a fresh diff rendered
    already-expanded (with a negative remaining count that made the gap
    vanish), and the next *refused* pair was force-diffed with every guard at
    `Infinity` — re-opening the exact freeze the cost guard exists to
    prevent. ✅
15. **Windowing starts from an estimated viewport, not from "render
    everything"** — the pre-measurement render used to fall into "viewport
    unknown → render every row", so mounting a large diff built the whole
    list (~1.1 s / ~120 000 nodes for 20 000 rows) only for the first
    measurement to tear it back down to the window. The first render now
    windows from a fixed viewport estimate, so the initial client paint — and
    the server render for a large diff — is already bounded; the effect
    corrects the exact height one frame later. The estimate is a constant so
    the server and the client's first render agree, keeping hydration stable.
    (SPEC §3.4 already said the server renders *small* diffs in full; a large
    diff now emits a bounded first screen there too, which is strictly
    better HTML.) ✅

---

## 12. Appendix

### A. Related packages
- `@usefy/signature-pad`, `@usefy/confetti` — engine/tsup/measure-size precedents.
- `@usefy/spotlight-tour`, `@usefy/virtual-keyboard` — SCSS pipeline precedent.

### B. Prior art
- Eugene Myers, *An O(ND) Difference Algorithm and Its Variations* (1986).
- `react-diff-viewer` (+ the `-continued` community fork) — the gap this fills.
- `diff` (jsdiff) — the vanilla algorithm reference.

---

*Document Version: 1.0*
*Last Updated: 2026-07-24*
