/**
 * Data model and option resolution for `@usefy/diff-viewer` (SPEC §4.1, §4.4).
 *
 * Everything in this module is framework-free and SSR-safe — no React, no
 * `window`/`document` access at module scope or inside {@link resolveOptions}.
 */

/* -------------------------------------------------------------------------- */
/* Model (SPEC §4.1)                                                          */
/* -------------------------------------------------------------------------- */

/**
 * How one line of the diff relates to the two inputs.
 *
 * - `"add"` — present only in the new text.
 * - `"remove"` — present only in the old text.
 * - `"context"` — unchanged; present in both.
 */
export type DiffLineType = "add" | "remove" | "context";

/**
 * One word-level span inside a paired changed line.
 *
 * @example
 * ```ts
 * import type { DiffSegment } from "@usefy/diff-viewer/headless";
 *
 * // "const a = 1" → "const b = 1"
 * const right: DiffSegment[] = [
 *   { type: "same", text: "const " },
 *   { type: "change", text: "b" },
 *   { type: "same", text: " = 1" },
 * ];
 * ```
 */
export interface DiffSegment {
  /** `"same"` renders plain; `"change"` renders the inline highlight. */
  type: "same" | "change";
  text: string;
}

/**
 * One line in the diff model.
 *
 * `content` is always the **original** text. The `ignoreWhitespace` /
 * `ignoreCase` options change how lines are *matched*, never what is
 * rendered (SPEC resolved decision #5).
 *
 * @example
 * ```ts
 * import type { DiffLine } from "@usefy/diff-viewer/headless";
 *
 * const removed: DiffLine = { type: "remove", oldNumber: 4, content: "let x = 1;" };
 * const added: DiffLine = { type: "add", newNumber: 4, content: "const x = 1;" };
 * const kept: DiffLine = { type: "context", oldNumber: 5, newNumber: 5, content: "" };
 * ```
 */
export interface DiffLine {
  type: DiffLineType;
  /** 1-based line number in the old text (undefined for adds). */
  oldNumber?: number;
  /** 1-based line number in the new text (undefined for removes). */
  newNumber?: number;
  /** The ORIGINAL line text (never the normalized compare form). */
  content: string;
  /** Word-level segments when this line was paired; undefined otherwise. */
  segments?: DiffSegment[];
}

/**
 * A contiguous region of the diff, with its surrounding context lines and
 * the collapsed regions on either side of it.
 *
 * The hidden lines **travel with the model** (SPEC resolved decision #11):
 * `hiddenBefore` / `hiddenAfter` hold the actual `DiffLine` objects that
 * were collapsed, so a consumer holding only a `DiffResult` — for example
 * one passing the pre-computed `diff` prop — can expand a gap without
 * re-diffing or even keeping the original texts around. They are slices of
 * the same line objects the hunk itself holds, so carrying them costs no
 * extra memory.
 *
 * The gap size a viewer renders ("⋯ 42 unchanged lines") is just
 * `hiddenBefore.length` — there is deliberately no separate count field (see
 * the field docs below for why).
 *
 * `hiddenAfter` is non-empty only on the **last** hunk: an interior
 * collapsed region belongs to the `hiddenBefore` of the hunk that follows
 * it, so nothing is ever counted twice.
 *
 * @example
 * ```ts
 * import type { DiffHunk } from "@usefy/diff-viewer/headless";
 *
 * const hunk: DiffHunk = {
 *   oldStart: 12,
 *   newStart: 12,
 *   lines: [{ type: "add", newNumber: 12, content: "// new" }],
 *   hiddenBefore: [], // the collapsed lines, ready to expand into
 *   hiddenAfter: [],
 * };
 *
 * // "⋯ N unchanged lines" — the count is just the array's length:
 * const collapsed = hunk.hiddenBefore.length;
 * // Expand the last 20 hidden lines above a hunk:
 * const revealed = hunk.hiddenBefore.slice(-20);
 * ```
 */
export interface DiffHunk {
  /** 1-based old-text line number of the hunk's first line. */
  oldStart: number;
  /** 1-based new-text line number of the hunk's first line. */
  newStart: number;
  lines: DiffLine[];
  /**
   * The unchanged lines collapsed BEFORE this hunk, in document order.
   * Empty when nothing was collapsed; its `length` **is** the gap size.
   *
   * There is deliberately no separate count field: two sources of truth for
   * one number is a trap for hand-built `diff` props, where a stale count
   * and a real array silently disagree.
   */
  hiddenBefore: DiffLine[];
  /**
   * The unchanged lines collapsed AFTER this hunk — only the **last** hunk
   * can have any, since an interior region belongs to the following hunk's
   * `hiddenBefore`.
   */
  hiddenAfter: DiffLine[];
}

/**
 * Per-file line counts.
 *
 * @example
 * ```ts
 * import type { DiffStats } from "@usefy/diff-viewer/headless";
 *
 * const stats: DiffStats = { added: 3, removed: 1, unchanged: 40 };
 * ```
 */
export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

/**
 * Why `computeDiff` refused to produce a model.
 *
 * - `"size"` — the inputs exceeded `maxLines` or `maxBytes`. The diff was
 *   never attempted; the documents are simply too big.
 * - `"complexity"` — the inputs were small enough, but too *different*:
 *   producing the diff would have exceeded `maxEditDistance`. Myers costs
 *   O((N + M) · D), so this is the case that would otherwise freeze the tab.
 *
 * The distinction matters to the UI: "this file is too large to diff" and
 * "these two files have almost nothing in common" call for different words.
 */
export type DiffTruncationReason = "size" | "complexity";

/**
 * The complete diff model produced by `computeDiff`.
 *
 * @example
 * ```ts
 * import { computeDiff } from "@usefy/diff-viewer/headless";
 *
 * const result = computeDiff("a\nb\n", "a\nc\n");
 * result.stats;    // { added: 1, removed: 1, unchanged: 1 }
 * result.truncated; // false
 *
 * const huge = computeDiff(a, b, { maxLines: 10 });
 * huge.truncated;       // true
 * huge.truncatedReason; // "size"
 * ```
 */
export interface DiffResult {
  hunks: DiffHunk[];
  stats: DiffStats;
  /**
   * True when a guard refused the diff — `hunks` is empty and `stats` is
   * zeroed. See {@link DiffResult.truncatedReason} for which guard.
   */
  truncated: boolean;
  /** Why, when `truncated` is true; `undefined` otherwise. */
  truncatedReason?: DiffTruncationReason;
  /**
   * `true` when the per-call inline budget ran out, so some paired lines
   * render as whole-line changes even though they might have cleared
   * `inlineThreshold`.
   *
   * The diff itself is complete and correct — only the word-level
   * highlighting was skipped. It is surfaced because otherwise a missing
   * `segments` is indistinguishable from a similarity-gate miss, and this
   * package's whole stance is that degradation should be visible rather
   * than silent. Absent (not `false`) when everything was diffed.
   */
  inlineBudgetExhausted?: true;
}

/* -------------------------------------------------------------------------- */
/* Options (SPEC §4.4)                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Whitespace handling for the **compare form** of a line.
 *
 * - `"none"` — whitespace is significant.
 * - `"trailing"` — trailing whitespace is ignored.
 * - `"all"` — every whitespace character is ignored.
 */
export type IgnoreWhitespace = "none" | "trailing" | "all";

/**
 * Options accepted by `normalizeLine` — the compare-form rules.
 *
 * @example
 * ```ts
 * import { normalizeLine } from "@usefy/diff-viewer/headless";
 *
 * normalizeLine("  Foo  ", { ignoreWhitespace: "all", ignoreCase: true }); // "foo"
 * ```
 */
export interface NormalizeOptions {
  /** @default "none" */
  ignoreWhitespace?: IgnoreWhitespace;
  /** @default false */
  ignoreCase?: boolean;
}

/**
 * Options accepted by `buildHunks` — context grouping and gap collapsing.
 *
 * @example
 * ```ts
 * import { buildHunks } from "@usefy/diff-viewer/headless";
 *
 * buildHunks(lines, { context: 3, collapseThreshold: 4 });
 * buildHunks(lines, { context: Infinity }); // whole-file, no gaps
 * ```
 */
export interface HunkOptions {
  /** @default 3 */
  context?: number;
  /** @default 4 */
  collapseThreshold?: number;
}

/**
 * Every option understood by `computeDiff` (SPEC §4.4).
 *
 * @example
 * ```ts
 * import { computeDiff, type DiffOptions } from "@usefy/diff-viewer/headless";
 *
 * const options: DiffOptions = {
 *   context: 3,
 *   ignoreWhitespace: "trailing",
 *   inlineThreshold: 0.6,
 * };
 * computeDiff(oldText, newText, options);
 * ```
 */
export interface DiffOptions extends NormalizeOptions, HunkOptions {
  /**
   * Unchanged lines kept around each change. `Infinity` renders the whole
   * file with no collapsed gaps.
   * @default 3
   */
  context?: number;
  /**
   * Extra unchanged lines beyond `2 × context` before a run collapses into
   * a gap. Prevents a "⋯ 1 unchanged line" marker that costs more space
   * than the line it hides.
   * @default 4
   */
  collapseThreshold?: number;
  /**
   * Lines revealed per expand click. Consumed by the Phase 2 component;
   * resolved here so the whole option surface has one home.
   * @default 20
   */
  expandStep?: number;
  /**
   * Word-level diffing inside paired changed lines.
   * @default true
   */
  inlineDiff?: boolean;
  /**
   * Minimum {@link similarity} (0–1) before a changed pair is word-diffed.
   * Below this the two lines are unrelated enough that inline highlighting
   * would render as character soup, so they stay whole-line changes.
   * @default 0.5
   */
  inlineThreshold?: number;
  /**
   * Longest line (in characters, per side) that is still word-diffed.
   *
   * Inline diffing is O(L²) in the worst case, so a single 110 KB minified
   * line costs seconds — and word-level highlighting inside a line nobody
   * can read on screen is worthless anyway. Lines longer than this render as
   * whole-line changes.
   *
   * A companion internal ceiling bounds the *total* characters word-diffed
   * per call, so a document made entirely of just-under-the-limit lines
   * cannot add up either; past it, later pairs render as whole-line changes.
   * `Infinity` opts out of both limits.
   * @default 1000
   */
  maxInlineChars?: number;
  /**
   * Size guard: maximum lines **per side**. `Infinity` disables it.
   * @default 20000
   */
  maxLines?: number;
  /**
   * Size guard: maximum UTF-8 bytes **per side**. `Infinity` disables it.
   * @default 2000000
   */
  maxBytes?: number;
  /**
   * Cost guard: the largest edit distance the line diff will search for
   * before giving up with `truncated: true` and
   * `truncatedReason: "complexity"`.
   *
   * `maxLines`/`maxBytes` bound the inputs' **size**; they do not bound the
   * **work**, because Myers costs O((N + M) · D). Two unrelated 20 000-line
   * files sit comfortably inside every size limit and still take ~5.7 s of
   * blocked main thread. This is the limit that makes the promise in
   * SPEC §1.3 true.
   *
   * Common prefixes/suffixes and pure insertions/deletions are handled
   * without searching, so they never count against it — only genuinely
   * interleaved divergence does. Note a *modified* line costs 2 (one delete
   * plus one insert), so the default allows ~3 000 modified lines. See SPEC
   * §4.4 for the measurements behind it. `Infinity` disables the guard —
   * and the time bound with it.
   * @default 6000
   */
  maxEditDistance?: number;
}

/**
 * {@link DiffOptions} with every field resolved to a concrete, sanitized
 * value — the shape the diff core actually consumes.
 *
 * @example
 * ```ts
 * import { resolveOptions } from "@usefy/diff-viewer/headless";
 *
 * const opts: ResolvedDiffOptions = resolveOptions();
 * opts.context; // 3
 * ```
 */
export interface ResolvedDiffOptions {
  /** `≥ 0`, finite or `Infinity` (whole-file mode). */
  context: number;
  /** `≥ 0`, finite. */
  collapseThreshold: number;
  /** `≥ 1`, finite. */
  expandStep: number;
  ignoreWhitespace: IgnoreWhitespace;
  ignoreCase: boolean;
  inlineDiff: boolean;
  /** Clamped to `[0, 1]`. */
  inlineThreshold: number;
  /** `≥ 0`, finite or `Infinity` (limit disabled). */
  maxInlineChars: number;
  /** `≥ 0`, finite or `Infinity` (guard disabled). */
  maxLines: number;
  /** `≥ 0`, finite or `Infinity` (guard disabled). */
  maxBytes: number;
  /** `≥ 0`, finite or `Infinity` (guard disabled). */
  maxEditDistance: number;
}

/* -------------------------------------------------------------------------- */
/* Defaults (SPEC §4.4)                                                       */
/* -------------------------------------------------------------------------- */

/** Default unchanged lines kept around each change. */
export const DEFAULT_CONTEXT = 3;
/** Default extra unchanged lines beyond context before a gap collapses. */
export const DEFAULT_COLLAPSE_THRESHOLD = 4;
/** Default number of lines revealed per expand click. */
export const DEFAULT_EXPAND_STEP = 20;
/** Default whitespace comparison mode. */
export const DEFAULT_IGNORE_WHITESPACE: IgnoreWhitespace = "none";
/** Default minimum similarity before a changed pair is word-diffed. */
export const DEFAULT_INLINE_THRESHOLD = 0.5;
/** Default longest line still word-diffed, in characters per side. */
export const DEFAULT_MAX_INLINE_CHARS = 1000;
/** Default size guard: maximum lines per side. */
export const DEFAULT_MAX_LINES = 20000;
/** Default size guard: maximum UTF-8 bytes per side. */
export const DEFAULT_MAX_BYTES = 2_000_000;
/**
 * Default cost guard: maximum edit distance the line diff will search for.
 *
 * 6 000 edits ≈ **3 000 modified lines** (a modification is one delete plus
 * one insert), i.e. 15 % of a `maxLines`-sized file — enough for codemods
 * and formatter runs, while refusing pairs with essentially nothing in
 * common. Bailing at this depth on the worst possible input (two unrelated
 * 20 000-line files) measured ~93 ms. See SPEC §4.4 for the full table.
 */
export const DEFAULT_MAX_EDIT_DISTANCE = 6000;

/**
 * Total characters `computeDiff` will submit to word-level diffing in one
 * call, across all paired lines.
 *
 * `maxInlineChars` bounds a *single* pair, but inline diffing is O(L²), so a
 * document made entirely of changed lines just under that limit can still
 * add up: 2 000 pairs of ~700-character lines measured ~660 ms of pure
 * word-diffing, all of it thrown away because the pairs were dissimilar.
 * This aggregate ceiling bounds that at roughly
 * `maxInlineChars × MAX_INLINE_TOTAL_CHARS` character-comparisons — about
 * 120 ms with the defaults.
 *
 * Past the budget the diff is still complete and correct; the remaining
 * pairs simply render as whole-line changes instead of gaining word-level
 * highlighting. 200 000 characters is far more inline diffing than any
 * realistic review needs, so this never fires on real input.
 *
 * Setting `maxInlineChars: Infinity` opts out of both limits together.
 *
 * Internal — not part of the public `./headless` surface.
 */
export const MAX_INLINE_TOTAL_CHARS = 200_000;

/** The three legal {@link IgnoreWhitespace} values. */
const VALID_IGNORE_WHITESPACE: readonly IgnoreWhitespace[] = ["none", "trailing", "all"];

/* -------------------------------------------------------------------------- */
/* Numeric guards (SPEC resolved decision #8)                                 */
/* -------------------------------------------------------------------------- */

/**
 * Coerce a possibly-absent/degenerate numeric option to a **finite** number.
 * `undefined`, non-numbers, `NaN` and `±Infinity` all fall back.
 *
 * Use this for every option where an infinite value is meaningless — an
 * `Infinity` collapse threshold would silently disable gap collapsing, and
 * a `NaN` expand step would reveal nothing forever.
 *
 * Internal: deliberately NOT part of the public `./headless` surface
 * (signature-pad precedent — generic helpers must not leak).
 *
 * @example
 * ```ts
 * toFinite(4, 3);        // 4
 * toFinite(NaN, 3);      // 3
 * toFinite(Infinity, 3); // 3
 * toFinite(undefined, 3) // 3
 * ```
 */
export function toFinite(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Like `toFinite`, but **deliberately admits `+Infinity`** — the legal
 * "unbounded" value for the options where infinity has a defined meaning:
 * `context: Infinity` is whole-file mode (SPEC §3.2), and
 * `maxLines` / `maxBytes` / `maxEditDistance` / `maxInlineChars` of
 * `Infinity` disable their respective guards.
 *
 * `NaN`, non-numbers and `undefined` still fall back; `-Infinity` survives
 * here and is neutralised by the caller's `Math.max(0, …)` clamp.
 *
 * Internal — not part of the public surface.
 *
 * @example
 * ```ts
 * toExtent(Infinity, 3);  // Infinity  (whole-file mode is legal)
 * toExtent(NaN, 3);       // 3
 * toExtent(-Infinity, 3); // -Infinity (clamped to 0 by the caller)
 * ```
 */
export function toExtent(value: number | undefined, fallback: number): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

/**
 * Fill in defaults and sanitize a {@link DiffOptions} object into a
 * {@link ResolvedDiffOptions}. Pure — safe to call anywhere, including
 * during SSR. The returned object is always freshly allocated.
 *
 * Sanitization rules:
 * - `context`, `maxInlineChars`, `maxLines`, `maxBytes` and
 *   `maxEditDistance` are clamped to `≥ 0` and **may be `Infinity`** —
 *   whole-file mode for `context`, "no limit" for the rest. `NaN` and
 *   non-numbers fall back to the default.
 * - `collapseThreshold` is clamped to `≥ 0` and `expandStep` to `≥ 1`, and
 *   both reject `±Infinity` (it has no meaning for either: an infinite
 *   collapse threshold would silently disable collapsing, and an infinite
 *   expand step is just "expand all").
 * - `inlineThreshold` rejects `±Infinity` and is clamped to `[0, 1]`.
 * - `ignoreWhitespace` falls back to `"none"` for unknown values.
 * - `ignoreCase` is on only for exactly `true`; `inlineDiff` is on unless it
 *   is exactly `false`. Both therefore coerce any other value to their
 *   default rather than to its truthiness — `inlineDiff: 0` resolves to
 *   `true`, not `false`.
 *
 * @example
 * ```ts
 * import { resolveOptions } from "@usefy/diff-viewer/headless";
 *
 * resolveOptions();                          // all defaults
 * resolveOptions({ context: Infinity });     // → context: Infinity (whole file)
 * resolveOptions({ context: NaN });          // → context: 3
 * resolveOptions({ inlineThreshold: 9 });    // → inlineThreshold: 1
 * ```
 */
export function resolveOptions(options: DiffOptions = {}): ResolvedDiffOptions {
  const context = Math.max(0, toExtent(options.context, DEFAULT_CONTEXT));
  const collapseThreshold = Math.max(
    0,
    toFinite(options.collapseThreshold, DEFAULT_COLLAPSE_THRESHOLD),
  );
  const expandStep = Math.max(1, toFinite(options.expandStep, DEFAULT_EXPAND_STEP));
  const ignoreWhitespace = VALID_IGNORE_WHITESPACE.includes(
    options.ignoreWhitespace as IgnoreWhitespace,
  )
    ? (options.ignoreWhitespace as IgnoreWhitespace)
    : DEFAULT_IGNORE_WHITESPACE;
  const ignoreCase = options.ignoreCase === true;
  const inlineDiff = options.inlineDiff !== false;
  const inlineThreshold = Math.min(
    1,
    Math.max(0, toFinite(options.inlineThreshold, DEFAULT_INLINE_THRESHOLD)),
  );
  const maxInlineChars = Math.max(
    0,
    toExtent(options.maxInlineChars, DEFAULT_MAX_INLINE_CHARS),
  );
  const maxLines = Math.max(0, toExtent(options.maxLines, DEFAULT_MAX_LINES));
  const maxBytes = Math.max(0, toExtent(options.maxBytes, DEFAULT_MAX_BYTES));
  const maxEditDistance = Math.max(
    0,
    toExtent(options.maxEditDistance, DEFAULT_MAX_EDIT_DISTANCE),
  );

  return {
    context,
    collapseThreshold,
    expandStep,
    ignoreWhitespace,
    ignoreCase,
    inlineDiff,
    inlineThreshold,
    maxInlineChars,
    maxLines,
    maxBytes,
    maxEditDistance,
  };
}
