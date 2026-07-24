/**
 * View models (SPEC §4.3) — the pure shaping step between the diff model and
 * the two renderers.
 *
 * Both views project the **same `DiffLine` objects**; neither copies or
 * rewrites content. That is what makes split/unified parity structural
 * rather than something the tests have to police: a rendering bug can change
 * how a line looks, but it can never make the two views disagree about what
 * the line *is*.
 *
 * Pure and framework-free — no React, no DOM.
 */

import type { DiffHunk, DiffLine } from "../types";

/**
 * One row of the side-by-side view.
 *
 * `null` on a side means a filler cell: the change block had more lines on
 * the other side, so there is nothing to show here.
 *
 * @example
 * ```ts
 * import { toSplitRows } from "@usefy/diff-viewer";
 *
 * for (const row of toSplitRows(hunk)) {
 *   render(row.left ?? blank, row.right ?? blank);
 * }
 * ```
 */
export interface SplitRow {
  /** The old-side line, or `null` for a filler cell. */
  left: DiffLine | null;
  /** The new-side line, or `null` for a filler cell. */
  right: DiffLine | null;
}

/**
 * Project a hunk into aligned side-by-side rows.
 *
 * Rules:
 * - A **context** line occupies both cells of its row — the same object, so
 *   the two columns can never drift apart.
 * - Inside a change block the *i*-th removed line shares a row with the
 *   *i*-th added line, matching the pairing `computeDiff` used for inline
 *   segments. A row therefore shows a modification as one before/after pair,
 *   which is the whole point of the split view.
 * - Surplus lines on either side get a filler cell opposite them, so the
 *   columns stay vertically aligned no matter how lopsided the block is.
 *
 * @example
 * ```ts
 * import { computeDiff, toSplitRows } from "@usefy/diff-viewer";
 *
 * const { hunks } = computeDiff("a\nb\n", "a\nB\nc\n");
 * toSplitRows(hunks[0]);
 * // [ { left: contextA, right: contextA },
 * //   { left: removedB, right: addedB },   ← paired modification
 * //   { left: null,     right: addedC } ]  ← surplus addition, filler left
 * ```
 */
export function toSplitRows(hunk: DiffHunk): SplitRow[] {
  return alignRows(hunk.lines);
}

/**
 * Align a flat run of `DiffLine`s into side-by-side rows.
 *
 * Exported for the Gap component, which has to align newly-revealed lines
 * the same way; those are always context lines, but going through the same
 * function keeps the two paths from diverging.
 *
 * @example
 * ```ts
 * alignRows(hunk.hiddenBefore); // context lines → one row each, both sides
 * ```
 */
export function alignRows(lines: readonly DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.type === "context") {
      rows.push({ left: line, right: line });
      i++;
      continue;
    }

    // Collect the change block: removals first, then additions.
    const removed: DiffLine[] = [];
    const added: DiffLine[] = [];
    let j = i;
    for (; j < lines.length && lines[j].type !== "context"; j++) {
      if (lines[j].type === "remove") removed.push(lines[j]);
      else added.push(lines[j]);
    }

    const height = Math.max(removed.length, added.length);
    for (let k = 0; k < height; k++) {
      rows.push({
        left: removed[k] ?? null,
        right: added[k] ?? null,
      });
    }
    i = j;
  }

  return rows;
}

/**
 * Project a hunk into the unified (single-column) row order.
 *
 * This is simply the hunk's lines as they already are: `computeDiff` emits
 * removals before additions inside every change block, which is exactly the
 * order a unified diff displays. Returning the array as-is — rather than
 * rebuilding it — is deliberate: there is no second ordering to get wrong.
 *
 * The return type is `readonly` because this hands back the hunk's own
 * array, not a copy — mutating it would corrupt the model.
 *
 * @example
 * ```ts
 * import { computeDiff, toUnifiedRows } from "@usefy/diff-viewer";
 *
 * const { hunks } = computeDiff("a\nb\n", "a\nB\n");
 * toUnifiedRows(hunks[0]).map((line) => line.type);
 * // ["context", "remove", "add"]
 * ```
 */
export function toUnifiedRows(hunk: DiffHunk): readonly DiffLine[] {
  return hunk.lines;
}
