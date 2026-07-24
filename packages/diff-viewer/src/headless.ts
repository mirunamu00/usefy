/**
 * `@usefy/diff-viewer/headless` — the framework-free diff engine.
 *
 * Pure TypeScript, **zero runtime dependencies, zero React imports**, and
 * SSR-safe to import: nothing here touches `window`, `document`, a clock or
 * a random source, at module scope or at call time. Usable from any
 * framework, a Node script, a Web Worker, or vanilla JS.
 *
 * @example
 * ```ts
 * import { computeDiff } from "@usefy/diff-viewer/headless";
 *
 * const result = computeDiff(before, after, { context: 3 });
 *
 * if (result.truncated) {
 *   console.log("input too large — offer a 'diff anyway' affordance");
 * } else {
 *   console.log(`+${result.stats.added} -${result.stats.removed}`);
 *   for (const hunk of result.hunks) {
 *     if (hunk.hiddenBefore.length > 0) console.log(`⋯ ${hunk.hiddenBefore.length} unchanged lines`);
 *     for (const line of hunk.lines) {
 *       const marker = line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
 *       console.log(marker + line.content);
 *     }
 *   }
 * }
 * ```
 *
 * The lower-level pieces are exported too, so you can build a bespoke model
 * (or test one) without going through `computeDiff`:
 *
 * @example
 * ```ts
 * import { myersDiff, splitLines, buildHunks } from "@usefy/diff-viewer/headless";
 *
 * const ops = myersDiff(splitLines(before), splitLines(after));
 * ```
 */

// The composed entry point
export { computeDiff } from "./diff/computeDiff";

// The pure core (SPEC §4.2)
export { myersDiff, myersDiffBounded } from "./diff/myers";
export type { DiffOp, DiffOpType } from "./diff/myers";
export { splitLines, tokenizeWords, normalizeLine } from "./diff/tokenize";
export { similarity, inlineSegments } from "./diff/inline";
export { buildHunks } from "./diff/hunks";

// Option resolution + defaults (SPEC §4.4)
export {
  resolveOptions,
  DEFAULT_CONTEXT,
  DEFAULT_COLLAPSE_THRESHOLD,
  DEFAULT_EXPAND_STEP,
  DEFAULT_IGNORE_WHITESPACE,
  DEFAULT_INLINE_THRESHOLD,
  DEFAULT_MAX_INLINE_CHARS,
  DEFAULT_MAX_LINES,
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_EDIT_DISTANCE,
} from "./types";

// Model + option types (SPEC §4.1)
export type {
  DiffHunk,
  DiffLine,
  DiffLineType,
  DiffOptions,
  DiffResult,
  DiffSegment,
  DiffStats,
  DiffTruncationReason,
  HunkOptions,
  IgnoreWhitespace,
  NormalizeOptions,
  ResolvedDiffOptions,
} from "./types";
