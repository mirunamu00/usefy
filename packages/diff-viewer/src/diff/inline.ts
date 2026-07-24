/**
 * Word-level (intra-line) diffing (SPEC §3.1, §4.2).
 *
 * When a change block pairs a removed line with an added line, the viewer
 * can highlight *what inside the line* changed instead of painting the whole
 * row. That is only useful when the two lines are actually related — a
 * completely rewritten line word-diffs into unreadable character soup — so
 * a {@link similarity} gate decides whether to do it at all.
 *
 * Pure and framework-free.
 */

import type { DiffSegment } from "../types";
import { myersDiff, type DiffOp } from "./myers";
import { tokenizeWords } from "./tokenize";

/** One token-level diff of two lines, reused by similarity and segments. */
interface TokenDiff {
  aTokens: string[];
  bTokens: string[];
  ops: DiffOp[];
}

/** Tokenize both lines and diff them once. */
function tokenDiff(oldLine: string, newLine: string): TokenDiff {
  const aTokens = tokenizeWords(oldLine);
  const bTokens = tokenizeWords(newLine);
  return { aTokens, bTokens, ops: myersDiff(aTokens, bTokens) };
}

/**
 * Fraction of characters the two lines keep in common, from a token diff.
 *
 * `2 × matchedChars / (aChars + bChars)` — the Sørensen–Dice shape applied
 * to the LCS produced by the same engine that will render the segments.
 */
function similarityFromDiff(diff: TokenDiff): number {
  let aChars = 0;
  for (const t of diff.aTokens) aChars += t.length;
  let bChars = 0;
  for (const t of diff.bTokens) bChars += t.length;

  // Two empty lines are identical, not undefined.
  if (aChars + bChars === 0) return 1;

  let matched = 0;
  for (const op of diff.ops) {
    if (op.type !== "equal") continue;
    for (let i = 0; i < op.length; i++) matched += diff.aTokens[op.aIndex + i].length;
  }
  return (2 * matched) / (aChars + bChars);
}

/**
 * How similar two lines are, on a 0–1 scale — the gate for inline diffing.
 *
 * ## The metric, precisely
 *
 * Both lines are tokenized with {@link tokenizeWords} and diffed with
 * {@link myersDiff}. Let `M` be the total **character length of the tokens
 * that matched** (the LCS, measured in characters rather than tokens) and
 * `A`, `B` the total character lengths of the two lines' tokens. Then
 *
 * ```text
 * similarity = 2M / (A + B)
 * ```
 *
 * — the Sørensen–Dice coefficient over the LCS.
 *
 * ## Why this metric
 *
 * Two cheaper candidates were considered and rejected:
 *
 * - **Dice over character bigrams** is fast but measures a different thing
 *   than the renderer does: a line could score 0.7 and still word-diff into
 *   confetti, because bigram overlap ignores *order*.
 * - **Matched-token count** (`2 × matchedTokens / (tokens…)`) over-weights
 *   punctuation and whitespace: `a(b);` vs `x(y);` shares 3 of 5 tokens
 *   (0.6) despite sharing almost no content.
 *
 * Measuring the LCS in characters makes the number mean exactly what the
 * viewer will show: *the proportion of the line that renders unhighlighted*.
 * A pair at 0.5 really does keep about half its text. That makes the
 * `inlineThreshold` option tunable by eye instead of by trial and error.
 *
 * Boundary cases: two empty lines score `1` (identical); an empty line
 * against a non-empty one scores `0`; identical lines always score `1`.
 *
 * @example
 * ```ts
 * import { similarity } from "@usefy/diff-viewer/headless";
 *
 * similarity("const a = 1;", "const a = 2;"); // ≈ 0.92 — one token changed
 * similarity("const a = 1;", "");             // 0
 * similarity("", "");                         // 1
 * similarity("hello world", "hello world");   // 1
 * ```
 */
export function similarity(a: string, b: string): number {
  return similarityFromDiff(tokenDiff(a, b));
}

/**
 * Append text to a segment list, merging into the previous same-type run.
 *
 * `text` is never empty: `tokenizeWords` emits no empty tokens and
 * `myersDiff` emits no zero-length ops, so every call covers at least one
 * real character.
 */
function pushSegment(segments: DiffSegment[], type: DiffSegment["type"], text: string): void {
  const last = segments[segments.length - 1];
  if (last !== undefined && last.type === type) {
    last.text += text;
    return;
  }
  segments.push({ type, text });
}

/** Build both sides' segment lists from an already-computed token diff. */
function segmentsFromDiff(diff: TokenDiff): { left: DiffSegment[]; right: DiffSegment[] } {
  const left: DiffSegment[] = [];
  const right: DiffSegment[] = [];

  for (const op of diff.ops) {
    if (op.type === "equal") {
      const text = diff.aTokens.slice(op.aIndex, op.aIndex + op.length).join("");
      pushSegment(left, "same", text);
      pushSegment(right, "same", text);
    } else if (op.type === "delete") {
      // Removed material exists only on the old side.
      pushSegment(left, "change", diff.aTokens.slice(op.aIndex, op.aIndex + op.length).join(""));
    } else {
      // Added material exists only on the new side.
      pushSegment(right, "change", diff.bTokens.slice(op.bIndex, op.bIndex + op.length).join(""));
    }
  }

  return { left, right };
}

/**
 * Word-level segments for one paired line change.
 *
 * Returns the segment list for each side: `left` describes `oldLine`
 * (unchanged spans plus what was **removed**), `right` describes `newLine`
 * (unchanged spans plus what was **added**). Concatenating a side's segment
 * texts reproduces that side's line exactly — the renderer never has to
 * reconstruct anything.
 *
 * Adjacent segments of the same type are merged, so a run of changed tokens
 * renders as one highlight instead of a fragmented row of boxes.
 *
 * Matching is exact on the tokens (the whitespace/case options apply to
 * *line* matching, not to intra-line matching — a line that only differs in
 * case has already been matched as unchanged by then).
 *
 * Callers should gate this on {@link similarity} — see `inlineThreshold`.
 *
 * @example
 * ```ts
 * import { inlineSegments } from "@usefy/diff-viewer/headless";
 *
 * inlineSegments("const a = 1;", "const b = 1;");
 * // {
 * //   left:  [{ type: "same", text: "const " },
 * //           { type: "change", text: "a" },
 * //           { type: "same", text: " = 1;" }],
 * //   right: [{ type: "same", text: "const " },
 * //           { type: "change", text: "b" },
 * //           { type: "same", text: " = 1;" }],
 * // }
 * ```
 */
export function inlineSegments(
  oldLine: string,
  newLine: string,
): { left: DiffSegment[]; right: DiffSegment[] } {
  return segmentsFromDiff(tokenDiff(oldLine, newLine));
}

/**
 * Decide — **without diffing** — whether a pair could possibly clear the
 * inline-diff gate.
 *
 * Two cheap tests, both O(1) on the line lengths:
 *
 * 1. **Length limit.** A line longer than `maxInlineChars` is never word-
 *    diffed. Inline diffing is O(L²) in the worst case (disjoint tokens), so
 *    a 110 KB minified line costs seconds — and highlighting individual
 *    words inside a line that nobody can read on screen buys nothing.
 * 2. **Provable ceiling.** At most `min(A, B)` characters can ever match, so
 *    `similarity ≤ 2·min(A,B) / (A+B)`. When that ceiling is already below
 *    `threshold` the gate is *mathematically unreachable* and running the
 *    diff to discover it would be pure waste. This is what kills the
 *    "one-line file replaced by a much longer one-line file" shape.
 *
 * Returning `true` means "might pass" — the real {@link similarity} still
 * decides. Returning `false` is a guarantee that it would not have.
 *
 * Internal — not part of the public `./headless` surface.
 *
 * @example
 * ```ts
 * canAttemptInline(10, 10_000, 0.5, Infinity); // false — ceiling is 0.002
 * canAttemptInline(50, 52, 0.5, Infinity);     // true  — worth diffing
 * canAttemptInline(5000, 5000, 0.5, 1000);     // false — too long to bother
 * ```
 */
export function canAttemptInline(
  oldLength: number,
  newLength: number,
  threshold: number,
  maxInlineChars: number,
): boolean {
  if (oldLength > maxInlineChars || newLength > maxInlineChars) return false;
  const total = oldLength + newLength;
  // Two empty lines are identical (similarity 1) — never gated out.
  if (total === 0) return true;
  const ceiling = (2 * Math.min(oldLength, newLength)) / total;
  return ceiling >= threshold;
}

/**
 * Similarity **and** segments from a single token diff.
 *
 * `computeDiff` needs both numbers for every paired line; calling the two
 * public helpers separately would tokenize and run Myers twice per pair.
 * Callers must pre-filter with {@link canAttemptInline} — this function does
 * the expensive work unconditionally, by design.
 *
 * Internal — not part of the public `./headless` surface.
 *
 * @example
 * ```ts
 * const { score, left, right } = inlinePair("let x = 1", "let y = 1");
 * score; // ≈ 0.89
 * ```
 */
export function inlinePair(
  oldLine: string,
  newLine: string,
): { score: number; left: DiffSegment[]; right: DiffSegment[] } {
  const diff = tokenDiff(oldLine, newLine);
  const { left, right } = segmentsFromDiff(diff);
  return { score: similarityFromDiff(diff), left, right };
}
