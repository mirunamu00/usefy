"use client";

/**
 * Keyboard navigation for the tree (SPEC.md §8).
 *
 * Implements the WAI-ARIA Tree View key map. This logic stays local rather
 * than being pulled from a `@usefy/use-*` hook because it is not a generic
 * concern: it drives a single tab stop with `aria-activedescendant` over a
 * *windowed* list whose row indices move under it on every expand and
 * collapse. (Not roving tabindex — the row that should hold focus is often not
 * in the DOM at all.)
 *
 * Closing rows (`}` / `]`) are skipped by navigation — they are the same tree
 * item as their opening row, and stopping on them would make every container
 * cost two presses to walk past.
 *
 * **Type-ahead is not implemented**, and `c`/`p` claim those two letters for
 * copy. A tree of arbitrary JSON has no stable label alphabet to type ahead
 * *to* — half the rows are array indices — while copying a path out of a
 * payload is the thing people actually reach for.
 */

import { useCallback } from "react";
import type { ExpandResult, JsonRow, JsonTreeModel } from "./types";

/**
 * Siblings past which `*` (expand all siblings) refuses.
 *
 * Each expansion is cheap, but a million of them in one keypress is not — and
 * the row budget would refuse the result anyway. Refusing loudly beats a
 * multi-second freeze.
 */
const SIBLING_EXPAND_LIMIT = 10_000;

export interface UseTreeKeyboardOptions {
  model: JsonTreeModel;
  rowCount: number;
  activeRow: number;
  setActiveRow: (row: number) => void;
  toggle: (path: JsonRow["path"]) => ExpandResult;
  expand: (path: JsonRow["path"]) => ExpandResult;
  collapse: (path: JsonRow["path"]) => ExpandResult;
  /** Rows to move for PageUp / PageDown. */
  pageSize: number;
  /** Called after a move so the row can be brought into view. */
  onMove: (row: number) => void;
  /** Called with a message for the live region. */
  announce: (message: string) => void;
  /**
   * `c` and `p` on the active row.
   *
   * The per-row copy buttons carry `tabIndex={-1}` so Tab keeps leaving the
   * tree as a composite widget should; these shortcuts are what keeps copying
   * reachable without a mouse (SPEC.md §8).
   */
  onCopyValue: (row: JsonRow) => void;
  onCopyPath: (row: JsonRow) => void;
}

/**
 * The tree's `onKeyDown`.
 *
 * @example
 * ```tsx
 * const onKeyDown = useTreeKeyboard({ model, rowCount, activeRow, … });
 * <div role="tree" onKeyDown={onKeyDown} />
 * ```
 */
export function useTreeKeyboard({
  model,
  rowCount,
  activeRow,
  setActiveRow,
  toggle,
  expand,
  collapse,
  pageSize,
  onMove,
  announce,
  onCopyValue,
  onCopyPath,
}: UseTreeKeyboardOptions): (event: React.KeyboardEvent) => void {
  /** Nearest non-closing row at or after `from`, searching in `step` direction. */
  const seek = useCallback(
    (from: number, step: number): number => {
      for (let row = from; row >= 0 && row < rowCount; row += step) {
        if (!model.rowAt(row).closing) return row;
      }
      return -1;
    },
    [model, rowCount],
  );

  const move = useCallback(
    (row: number) => {
      if (row < 0 || row >= rowCount) return;
      setActiveRow(row);
      onMove(row);
    },
    [rowCount, setActiveRow, onMove],
  );

  return useCallback(
    (event: React.KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (rowCount === 0) return;

      const current = Math.min(Math.max(activeRow, 0), rowCount - 1);
      const row = model.rowAt(current);

      /** `*` — expand every sibling of the active node, within a sane bound. */
      const expandSiblings = (active: JsonRow): void => {
        const parentPath = active.path.slice(0, -1);
        const parentRow = model.rowIndexOf(parentPath);
        const start = parentRow < 0 ? 0 : parentRow + 1;

        // Collect first, expand after: expanding shifts every row index below.
        const targets: JsonRow["path"][] = [];
        for (let index = start; index < model.rowCount(); index++) {
          const candidate = model.rowAt(index);
          if (candidate.depth < active.depth) break;
          if (
            candidate.depth === active.depth &&
            !candidate.closing &&
            candidate.expandable &&
            !candidate.expanded
          ) {
            targets.push(candidate.path);
            if (targets.length > SIBLING_EXPAND_LIMIT) {
              announce(
                `Too many siblings to expand at once (over ${SIBLING_EXPAND_LIMIT})`,
              );
              return;
            }
          }
        }

        for (const path of targets) expand(path);
        announce(`Expanded ${targets.length} sibling nodes`);
      };

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          const next = seek(current + 1, 1);
          if (next >= 0) move(next);
          return;
        }
        case "ArrowUp": {
          event.preventDefault();
          const previous = seek(current - 1, -1);
          if (previous >= 0) move(previous);
          return;
        }
        case "ArrowRight": {
          event.preventDefault();
          if (row.expandable && !row.expanded) {
            const result = expand(row.path);
            if (result.refused) announce("This node cannot be expanded");
          } else if (row.expanded) {
            move(seek(current + 1, 1));
          }
          return;
        }
        case "ArrowLeft": {
          event.preventDefault();
          if (row.expanded) {
            collapse(row.path);
          } else if (row.path.length > 0) {
            const parent = model.rowIndexOf(row.path.slice(0, -1));
            if (parent >= 0) move(parent);
          }
          return;
        }
        case "Home": {
          event.preventDefault();
          move(0);
          return;
        }
        case "End": {
          event.preventDefault();
          const last = seek(rowCount - 1, -1);
          if (last >= 0) move(last);
          return;
        }
        case "PageDown": {
          event.preventDefault();
          const target = Math.min(rowCount - 1, current + pageSize);
          const next = seek(target, -1);
          move(next >= 0 ? next : target);
          return;
        }
        case "PageUp": {
          event.preventDefault();
          const target = Math.max(0, current - pageSize);
          const previous = seek(target, 1);
          move(previous >= 0 ? previous : target);
          return;
        }
        case "Enter":
        case " ": {
          if (!row.expandable) return;
          event.preventDefault();
          toggle(row.path);
          return;
        }
        case "*": {
          event.preventDefault();
          expandSiblings(row);
          return;
        }
        case "c":
        case "C": {
          event.preventDefault();
          onCopyValue(row);
          return;
        }
        case "p":
        case "P": {
          event.preventDefault();
          onCopyPath(row);
          return;
        }
        default:
          return;
      }
    },
    [
      activeRow,
      announce,
      collapse,
      expand,
      model,
      move,
      onCopyPath,
      onCopyValue,
      pageSize,
      rowCount,
      seek,
      toggle,
    ],
  );
}
