/**
 * `computeDiff` — the one public entry point of the diff core (SPEC §4.2).
 *
 * Composes the pure pieces in this directory into the {@link DiffResult}
 * every view renders:
 *
 * ```text
 * size guard → cost guard → splitLines → normalizeLine → myersDiff (lines)
 *            → DiffLine[] with old/new numbering
 *            → pair changed lines → inlineSegments (gated by similarity)
 *            → buildHunks → stats
 * ```
 *
 * Pure, deterministic, framework-free: no React, no DOM, no clock, no
 * randomness. The same inputs and options always produce a deeply-equal
 * result (SPEC §3.1).
 */

import {
  MAX_INLINE_TOTAL_CHARS,
  resolveOptions,
  type DiffLine,
  type DiffOptions,
  type DiffResult,
  type DiffStats,
  type DiffTruncationReason,
} from "../types";
import { buildHunks } from "./hunks";
import { canAttemptInline, inlinePair } from "./inline";
import { myersDiffBounded } from "./myers";
import { countLines, normalizeLine, splitLines, utf8Length } from "./tokenize";

/** The result returned when a guard refuses the diff. */
function truncatedResult(reason: DiffTruncationReason): DiffResult {
  return {
    hunks: [],
    stats: { added: 0, removed: 0, unchanged: 0 },
    truncated: true,
    truncatedReason: reason,
  };
}

/**
 * Diff two texts into the renderable model.
 *
 * ## Behaviour worth knowing
 *
 * - **Guards first, in cost order.** `maxBytes` is checked on the raw
 *   strings, then `maxLines` via a scan that does not build the line array,
 *   and only then is anything allocated. Beyond those, `maxEditDistance`
 *   bounds the *work* rather than the input: Myers costs O((N + M) · D), so
 *   two unrelated 20 000-line files pass every size limit and still block the
 *   main thread for seconds. Any guard that trips returns
 *   `{ hunks: [], stats: { 0, 0, 0 }, truncated: true, truncatedReason }`
 *   and the viewer offers its "diff anyway" escape hatch (SPEC resolved
 *   decisions #7 and #10). `truncatedReason` distinguishes `"size"` (too
 *   big) from `"complexity"` (too different). Pass `Infinity` to disable
 *   any of them.
 * - **Compare normalized, render original.** `ignoreWhitespace` and
 *   `ignoreCase` affect matching only; `DiffLine.content` is always the real
 *   text (SPEC resolved decision #5).
 * - **Context lines carry the NEW text.** A context line is one `DiffLine`
 *   shared by both columns of the split view, and under
 *   `ignoreWhitespace`/`ignoreCase` the two sides' originals can differ. The
 *   model keeps the new text — what the document looks like *now* — which is
 *   also what `git diff` shows for context.
 * - **Pairing.** Inside a change block the *i*-th removed line pairs with the
 *   *i*-th added line; surplus lines on either side stand alone and get no
 *   segments.
 * - **Inline gate.** A pair is word-diffed only when `inlineDiff` is on, both
 *   lines are at most `maxInlineChars` long, and the pair's
 *   {@link similarity} is at least `inlineThreshold`. The length and
 *   provable-ceiling checks happen *before* the word diff runs, so a long
 *   dissimilar pair costs O(1) rather than O(L²).
 * - **Stats are per file**, counted over every line — not just the lines
 *   inside hunks. They are also unaffected by collapsing: a hidden line
 *   still counts as unchanged.
 *
 * @param oldText The "before" document.
 * @param newText The "after" document.
 * @param options See {@link DiffOptions}; every field is optional and
 *   sanitized (`NaN` falls back, `context: Infinity` is whole-file mode).
 *
 * @example
 * ```ts
 * import { computeDiff } from "@usefy/diff-viewer/headless";
 *
 * const result = computeDiff("let x = 1;\nkeep\n", "const x = 1;\nkeep\n");
 *
 * result.stats;                       // { added: 1, removed: 1, unchanged: 1 }
 * result.hunks[0].lines[0].type;      // "remove"
 * result.hunks[0].lines[0].segments;  // [{ type: "change", text: "let" }, …]
 *
 * // Whole file, no collapsed gaps:
 * computeDiff(oldText, newText, { context: Infinity });
 *
 * // Ignore re-indentation:
 * computeDiff(oldText, newText, { ignoreWhitespace: "all" });
 *
 * // Tell the user *why* a diff was refused:
 * const guarded = computeDiff(oldText, newText);
 * if (guarded.truncated) {
 *   console.log(
 *     guarded.truncatedReason === "size"
 *       ? "These files are too large to diff."
 *       : "These files have too little in common to diff.",
 *   );
 * }
 * ```
 */
export function computeDiff(
  oldText: string,
  newText: string,
  options: DiffOptions = {},
): DiffResult {
  const opts = resolveOptions(options);

  // --- size guards — before any allocation (SPEC §3.1) --------------------
  // Bytes first: a scan of the raw strings, no array built.
  if (
    Number.isFinite(opts.maxBytes) &&
    (utf8Length(oldText) > opts.maxBytes || utf8Length(newText) > opts.maxBytes)
  ) {
    return truncatedResult("size");
  }

  // Lines next, still without materialising them.
  if (
    Number.isFinite(opts.maxLines) &&
    (countLines(oldText) > opts.maxLines || countLines(newText) > opts.maxLines)
  ) {
    return truncatedResult("size");
  }

  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);

  // --- line diff on the compare form, within the cost budget --------------
  const oldCompare = oldLines.map((line) => normalizeLine(line, opts));
  const newCompare = newLines.map((line) => normalizeLine(line, opts));
  const ops = myersDiffBounded(oldCompare, newCompare, opts.maxEditDistance);

  // The inputs were small enough but too different to diff cheaply.
  if (ops === null) return truncatedResult("complexity");

  // --- ops → numbered DiffLines ------------------------------------------
  const lines: DiffLine[] = [];
  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 };
  let oldNumber = 1;
  let newNumber = 1;

  for (const op of ops) {
    if (op.type === "equal") {
      for (let i = 0; i < op.length; i++) {
        lines.push({
          type: "context",
          oldNumber: oldNumber++,
          newNumber: newNumber++,
          content: newLines[op.bIndex + i],
        });
      }
      stats.unchanged += op.length;
    } else if (op.type === "delete") {
      for (let i = 0; i < op.length; i++) {
        lines.push({
          type: "remove",
          oldNumber: oldNumber++,
          content: oldLines[op.aIndex + i],
        });
      }
      stats.removed += op.length;
    } else {
      for (let i = 0; i < op.length; i++) {
        lines.push({
          type: "add",
          newNumber: newNumber++,
          content: newLines[op.bIndex + i],
        });
      }
      stats.added += op.length;
    }
  }

  // --- pair changed lines and add inline segments -------------------------
  if (opts.inlineDiff) {
    // Aggregate ceiling: `maxInlineChars` bounds one pair, this bounds the
    // whole call so a document full of just-under-the-limit changed lines
    // cannot add up to seconds. Opting out of the per-line limit opts out of
    // this one too.
    let inlineBudget =
      opts.maxInlineChars === Infinity ? Infinity : MAX_INLINE_TOTAL_CHARS;
    let i = 0;
    // Recorded on the result so a missing `segments` past the budget is
    // distinguishable from a similarity-gate miss.
    let budgetRanOut = false;
    while (i < lines.length) {
      if (lines[i].type === "context") {
        i++;
        continue;
      }
      // A change block: removals first, then additions (myersDiff emits a
      // canonical order, so this holds by construction).
      const removed: DiffLine[] = [];
      const added: DiffLine[] = [];
      let j = i;
      for (; j < lines.length && lines[j].type !== "context"; j++) {
        if (lines[j].type === "remove") removed.push(lines[j]);
        else added.push(lines[j]);
      }

      const pairs = Math.min(removed.length, added.length);
      for (let p = 0; p < pairs; p++) {
        const oldContent = removed[p].content;
        const newContent = added[p].content;
        // Cheap O(1) pre-gate: skip pairs that are too long to be worth
        // word-diffing, or whose best possible similarity is already below
        // the threshold. Without this the word diff runs — at O(L²) — only
        // for its result to be thrown away.
        if (
          !canAttemptInline(
            oldContent.length,
            newContent.length,
            opts.inlineThreshold,
            opts.maxInlineChars,
          )
        ) {
          continue;
        }
        if (inlineBudget <= 0) {
          // Eligible, but the per-call ceiling is spent. Record it — this is
          // the one case where a missing `segments` is our doing, not the
          // similarity gate's.
          budgetRanOut = true;
          continue;
        }
        inlineBudget -= oldContent.length + newContent.length;
        const { score, left, right } = inlinePair(oldContent, newContent);
        if (score >= opts.inlineThreshold) {
          removed[p].segments = left;
          added[p].segments = right;
        }
      }
      i = j;
    }

    if (budgetRanOut) {
      return {
        hunks: buildHunks(lines, opts),
        stats,
        truncated: false,
        inlineBudgetExhausted: true,
      };
    }
  }

  return { hunks: buildHunks(lines, opts), stats, truncated: false };
}
