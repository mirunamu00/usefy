/**
 * The collapsed-region expander (SPEC §3.2, §8).
 *
 * Everything it needs comes from the model: `hunk.hiddenBefore` /
 * `hiddenAfter` carry the real `DiffLine` objects (SPEC resolved decision
 * #11), so expansion works even when the consumer passed a pre-computed
 * `diff` and never handed us the original texts.
 *
 * Accessibility: the controls are real `<button>`s in natural focus order,
 * and their **accessible names are descriptive sentences** ("Expand 20 lines
 * above") even though the visible label is a compact glyph ("↑ 20"). A
 * screen reader reading the visible text would announce "up arrow twenty,
 * button"; under a label override that drops the glyph it would announce two
 * identically-named "20, button" controls. The two are therefore decoupled
 * (SPEC §8).
 */

import type { ReactNode } from "react";

import { cx, type RowClassNames, type RowStyles } from "./Row";

/** Which end of a gap a click revealed — drives what gets sliced off. */
export type ExpandDirection = "up" | "down" | "all";

/** Strings shown in a gap row; all overridable for i18n. */
export interface GapLabels {
  /** Visible text; `{count}` is substituted. */
  expandUp: string;
  /** Visible text; `{count}` is substituted. */
  expandDown: string;
  /** Visible text. */
  expandAll: string;
  /** Accessible name, given the number of lines the click will reveal. */
  ariaExpandUp: (count: number) => string;
  /** Accessible name, given the number of lines the click will reveal. */
  ariaExpandDown: (count: number) => string;
  /** Accessible name. */
  ariaExpandAll: string;
  /** The "⋯ N unchanged lines" summary. */
  hiddenLines: (count: number) => string;
}

/**
 * A single "⋯ N unchanged lines" row with its expand controls.
 *
 * **Precondition:** `hidden ≥ 1`. A gap with nothing left in it is not a
 * gap, and the caller already has to know the remaining count in order to
 * decide what to render — so the check lives there rather than being
 * duplicated (and left unreachable) here.
 */
export function Gap({
  hidden,
  ariaRowIndex,
  columnCount,
  styles,
  classNames,
  labels,
  expandStep,
  onExpand,
}: {
  /** How many lines are currently hidden here. */
  hidden: number;
  ariaRowIndex: number;
  /** Table columns to span. */
  columnCount: number;
  styles: RowStyles;
  classNames: RowClassNames & { gap?: string };
  labels: GapLabels;
  expandStep: number;
  onExpand: (direction: ExpandDirection) => void;
}): ReactNode {
  // One step would reveal everything — offer a single, honest control
  // instead of three that all do the same thing.
  const oneStepIsAll = hidden <= expandStep;
  const step = Math.min(expandStep, hidden);
  const withCount = (template: string) => template.replace("{count}", String(step));

  return (
    <tr className={cx(styles.row, classNames.row)} aria-rowindex={ariaRowIndex}>
      <td className={cx(styles.gapCell, classNames.gap)} colSpan={columnCount}>
        <div className={styles.gapInner}>
          <span className={styles.gapLabel}>{labels.hiddenLines(hidden)}</span>
          {oneStepIsAll ? (
            <button
              type="button"
              className={styles.gapButton}
              onClick={() => onExpand("all")}
              aria-label={labels.ariaExpandAll}
            >
              {labels.expandAll}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.gapButton}
                onClick={() => onExpand("up")}
                aria-label={labels.ariaExpandUp(step)}
              >
                {withCount(labels.expandUp)}
              </button>
              <button
                type="button"
                className={styles.gapButton}
                onClick={() => onExpand("down")}
                aria-label={labels.ariaExpandDown(step)}
              >
                {withCount(labels.expandDown)}
              </button>
              <button
                type="button"
                className={styles.gapButton}
                onClick={() => onExpand("all")}
                aria-label={labels.ariaExpandAll}
              >
                {labels.expandAll}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
