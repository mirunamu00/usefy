/**
 * Hunk building: grouping changes with context, collapsing the long
 * unchanged runs around them, and carrying the collapsed lines along so a
 * viewer can expand them (SPEC §3.2, §4.2).
 *
 * Pure and framework-free — takes a flat `DiffLine[]` and returns the
 * regions a viewer should actually draw.
 */

import {
  DEFAULT_COLLAPSE_THRESHOLD,
  DEFAULT_CONTEXT,
  toExtent,
  toFinite,
  type DiffHunk,
  type DiffLine,
  type HunkOptions,
} from "../types";

/**
 * Group the diff's lines into hunks, keeping `context` unchanged lines
 * around every change and collapsing the unchanged runs around them.
 *
 * ## The collapse economics
 *
 * A collapsed region costs the viewer a "⋯ N unchanged lines" expander. That
 * only pays for itself when it hides more than `collapseThreshold` lines —
 * a "⋯ 1 unchanged line" marker takes more space than the line it hides. So
 * a run collapses only when doing so hides **more than `collapseThreshold`**
 * lines, and the same economics apply at all three positions:
 *
 * | Run | Context spent | Collapses when | Then hides |
 * |---|---|---|---|
 * | Leading (before the first change) | `context` (one side) | `R > context + collapseThreshold` | `R − context` |
 * | Interior (between two changes) | `2 × context` (both sides) | `R > 2 × context + collapseThreshold` | `R − 2 × context` |
 * | Trailing (after the last change) | `context` (one side) | `R > context + collapseThreshold` | `R − context` |
 *
 * With the defaults (`context: 3`, `collapseThreshold: 4`) an interior run
 * of 10 stays inline and one of 11 collapses hiding 5; a leading or trailing
 * run of 7 stays inline and one of 8 collapses hiding 5. **No gap ever hides
 * `collapseThreshold` lines or fewer**, at any position.
 *
 * ## Expansion data travels with the model
 *
 * `hiddenBefore` / `hiddenAfter` carry the actual collapsed `DiffLine`
 * objects, so a consumer holding only a `DiffResult` can expand a gap
 * without the original texts and without re-diffing (SPEC resolved
 * decision #11). They are slices of the same objects, so this costs no
 * extra memory. The gap *size* is simply `hiddenBefore.length` — there is
 * no separate count field to fall out of sync with the array.
 *
 * An interior collapsed region is recorded as the **following** hunk's
 * `hiddenBefore`, never as the previous hunk's `hiddenAfter`; only the last
 * hunk can have a non-empty `hiddenAfter`. Every line of the document
 * therefore appears exactly once across all hunks' `hiddenBefore` +
 * `lines` + `hiddenAfter`.
 *
 * ## Special cases
 *
 * - **No changes at all** → `[]`. There is no region worth drawing; the
 *   viewer renders its "No changes" state (SPEC §3.3). This holds for
 *   `context: Infinity` too — whole-file mode shows the whole file *around a
 *   change*, and there is none.
 * - **`context: Infinity`** (whole-file mode) → exactly one hunk containing
 *   every line, with no gaps.
 * - **`context: 0`** → hunks contain only changed lines.
 *
 * `oldStart` / `newStart` are the 1-based line numbers of the hunk's first
 * *rendered* line in each document, computed from the line types alone
 * (standard unified-diff header semantics), so they are correct even when a
 * hunk begins with an addition.
 *
 * Numeric options are guarded: `context` accepts `Infinity` deliberately,
 * everything non-numeric or `NaN` falls back to the default.
 *
 * @example
 * ```ts
 * import { buildHunks, type DiffLine } from "@usefy/diff-viewer/headless";
 *
 * const lines: DiffLine[] = [
 *   { type: "context", oldNumber: 1, newNumber: 1, content: "a" },
 *   { type: "remove", oldNumber: 2, content: "b" },
 *   { type: "add", newNumber: 2, content: "B" },
 *   { type: "context", oldNumber: 3, newNumber: 3, content: "c" },
 * ];
 *
 * const [hunk] = buildHunks(lines, { context: 1 });
 * hunk.lines.length;        // 4 — nothing was worth collapsing
 * hunk.hiddenBefore.length; // 0 — the gap size IS the array length
 *
 * // Expanding a collapsed region needs nothing but the model:
 * const revealed = hunk.hiddenBefore.slice(-20);
 * ```
 */
export function buildHunks(lines: DiffLine[], options: HunkOptions = {}): DiffHunk[] {
  // `Infinity` is a legal, meaningful context (whole-file mode); `NaN` and
  // non-numbers are not (SPEC resolved decision #8).
  const context = Math.max(0, toExtent(options.context, DEFAULT_CONTEXT));
  const collapseThreshold = Math.max(
    0,
    toFinite(options.collapseThreshold, DEFAULT_COLLAPSE_THRESHOLD),
  );

  const changed: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].type !== "context") changed.push(i);
  }
  if (changed.length === 0) return [];

  // Group changed-line indices into ranges that share one hunk. An interior
  // run spends context on both sides, so it must exceed 2*context before the
  // remainder is even a candidate for collapsing.
  const maxInteriorRun = 2 * context + collapseThreshold;
  const groups: Array<{ first: number; last: number }> = [];
  let group = { first: changed[0], last: changed[0] };
  for (let i = 1; i < changed.length; i++) {
    const index = changed[i];
    const run = index - group.last - 1; // unchanged lines in between
    if (run <= maxInteriorRun) {
      group.last = index;
    } else {
      groups.push(group);
      group = { first: index, last: index };
    }
  }
  groups.push(group);

  // Running old/new line numbers so a hunk's header is correct even when it
  // starts with an "add" (which has no oldNumber of its own).
  const oldNumberAt: number[] = new Array(lines.length);
  const newNumberAt: number[] = new Array(lines.length);
  let oldNo = 1;
  let newNo = 1;
  for (let i = 0; i < lines.length; i++) {
    oldNumberAt[i] = oldNo;
    newNumberAt[i] = newNo;
    if (lines[i].type !== "add") oldNo++;
    if (lines[i].type !== "remove") newNo++;
  }

  // An edge run spends context on ONE side only, so its break-even point is
  // lower than an interior run's.
  const maxEdgeRun = context + collapseThreshold;
  const lastIndex = lines.length - 1;

  const hunks: DiffHunk[] = [];
  let previousEnd = -1; // document index of the last line the previous hunk rendered
  for (let g = 0; g < groups.length; g++) {
    const { first, last } = groups[g];
    const isFirst = g === 0;
    const isLast = g === groups.length - 1;

    // How far back this hunk reaches. A leading run short enough to be
    // cheaper than its expander is rendered in full instead of collapsed.
    const start = isFirst && first <= maxEdgeRun ? 0 : Math.max(0, first - context);

    // How far forward it reaches — same rule at the trailing edge.
    const end =
      isLast && lastIndex - last <= maxEdgeRun
        ? lastIndex
        : Math.min(lastIndex, last + context);

    const hiddenBefore = lines.slice(previousEnd + 1, start);
    const hiddenAfter = isLast ? lines.slice(end + 1) : [];

    hunks.push({
      oldStart: oldNumberAt[start],
      newStart: newNumberAt[start],
      lines: lines.slice(start, end + 1),
      hiddenBefore,
      hiddenAfter,
    });
    previousEnd = end;
  }

  return hunks;
}
