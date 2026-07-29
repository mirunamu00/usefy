"use client";

/**
 * Expand / collapse controls and the row counter (SPEC.md §3.5).
 *
 * The row counter is the package's own proof: "1,048,578 rows" next to a
 * viewport holding thirty of them is the differentiator, stated in the UI.
 */

import styles from "./styles/JsonViewer.module.scss";

export interface ToolbarProps {
  rowCount: number;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onCopyAll: () => void;
  children?: React.ReactNode;
}

export function Toolbar({
  rowCount,
  onExpandAll,
  onCollapseAll,
  onCopyAll,
  children,
}: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        className={styles.button}
        onClick={onExpandAll}
        data-testid="json-expand-all"
      >
        Expand all
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={onCollapseAll}
        data-testid="json-collapse-all"
      >
        Collapse all
      </button>
      <button type="button" className={styles.button} onClick={onCopyAll}>
        Copy JSON
      </button>
      {children}
      <span className={styles.spacerFlex} />
      <span className={styles.count} data-testid="json-row-count">
        {`${rowCount.toLocaleString()} ${rowCount === 1 ? "row" : "rows"}`}
      </span>
    </div>
  );
}
