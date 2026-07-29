"use client";

/**
 * One rendered row (SPEC.md §3.3).
 *
 * Memoised, because a scroll re-renders the whole window and the row itself is
 * the only thing in this package that is rendered dozens of times per frame.
 */

import { memo } from "react";
import { cx } from "./cx";
import styles from "./styles/JsonViewer.module.scss";
import type { JsonKind, JsonPath, JsonRow } from "./types";

export interface RowProps {
  /** DOM id, so the tree can point `aria-activedescendant` at it. */
  id: string;
  row: JsonRow;
  active: boolean;
  matched: boolean;
  currentMatch: boolean;
  showDataTypes: boolean;
  quoteKeys: boolean;
  onToggle: (path: JsonPath) => void;
  onActivate: (index: number) => void;
  onCopyPath: (row: JsonRow) => void;
  onCopyValue: (row: JsonRow) => void;
  onShowFull: (row: JsonRow, anchor: HTMLElement) => void;
  onRowClick?: (row: JsonRow, event: React.MouseEvent) => void;
  renderValue?: (row: JsonRow) => React.ReactNode;
}

/**
 * Whether a type badge would tell the reader anything new.
 *
 * `showDataTypes` earns its keep on `"42"` versus `42`. It does not on a row
 * that already reads `undefined`, `function retry()` or `{ 3 keys }` — there it
 * just prints the word twice ("draft: undefined undefined"), which is noise
 * dressed up as information.
 */
function typeIsInformative(kind: JsonKind): boolean {
  switch (kind) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
    case "date":
      return true;
    default:
      return false;
  }
}

/** Which colour token a value gets. Kept out of the render path as a lookup. */
function valueClass(kind: JsonKind): string {
  switch (kind) {
    case "string":
      return styles.string!;
    case "number":
    case "bigint":
      return styles.number!;
    case "boolean":
      return styles.boolean!;
    case "null":
    case "undefined":
      return styles.null!;
    case "circular":
    case "unknown":
    case "symbol":
    case "function":
      return styles.special!;
    case "object":
    case "array":
    case "map":
    case "set":
      return styles.container!;
    default:
      return styles.value!;
  }
}

export const Row = memo(function Row({
  id,
  row,
  active,
  matched,
  currentMatch,
  showDataTypes,
  quoteKeys,
  onToggle,
  onActivate,
  onCopyPath,
  onCopyValue,
  onShowFull,
  onRowClick,
  renderValue,
}: RowProps) {
  const hasKey = row.key !== undefined && !row.closing;
  const label = quoteKeys && typeof row.key === "string" ? `"${row.label}"` : row.label;

  return (
    <div
      id={id}
      // A closing bracket is the same tree item as its opening row, so it is
      // presentational — otherwise every container would be announced twice
      // and cost two arrow presses to walk past.
      role={row.closing ? "none" : "treeitem"}
      // A bare `}` between tree items is noise in a screen reader's browse
      // mode; the item it closes has already been announced with its state.
      aria-hidden={row.closing ? "true" : undefined}
      aria-level={row.closing ? undefined : row.depth + 1}
      aria-posinset={row.closing ? undefined : row.posInSet}
      aria-setsize={row.closing ? undefined : row.setSize}
      aria-expanded={row.expandable && !row.closing ? row.expanded : undefined}
      aria-selected={row.closing ? undefined : active || undefined}
      data-row-index={row.index}
      data-testid={`json-row-${row.index}`}
      className={cx(
        styles.row,
        active && styles.rowActive,
        currentMatch ? styles.rowMatchCurrent : matched && styles.rowMatch,
      )}
      onMouseDown={() => {
        if (!row.closing) onActivate(row.index);
      }}
      onClick={(event) => {
        if (!row.closing) onRowClick?.(row, event);
      }}
      onDoubleClick={() => {
        if (row.expandable) onToggle(row.path);
      }}
    >
      <span className={styles.guides} aria-hidden="true">
        {Array.from({ length: row.depth }, (_, level) => (
          <span key={level} className={styles.guide} />
        ))}
      </span>

      {row.expandable && !row.closing ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className={cx(styles.twisty, row.expanded && styles.twistyOpen)}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(row.path);
          }}
        >
          <span className={styles.twistyGlyph}>{"▸"}</span>
        </button>
      ) : (
        <span className={styles.twistySpacer} aria-hidden="true" />
      )}

      {hasKey ? (
        <>
          <span className={styles.key}>{label}</span>
          <span className={styles.punct}>{": "}</span>
        </>
      ) : null}

      {renderValue && !row.closing ? (
        renderValue(row)
      ) : (
        <span className={cx(styles.value, valueClass(row.kind))}>{row.display}</span>
      )}

      {showDataTypes && !row.closing && typeIsInformative(row.kind) ? (
        <span className={styles.type}>{row.kind}</span>
      ) : null}

      {row.truncated ? (
        <button
          type="button"
          tabIndex={-1}
          className={styles.more}
          aria-label={`Show the full value of ${label || "this node"}`}
          onClick={(event) => {
            event.stopPropagation();
            onShowFull(row, event.currentTarget);
          }}
        >
          {"…"}
        </button>
      ) : null}

      {row.closing ? null : (
        <span className={styles.actions}>
          <button
            type="button"
            tabIndex={-1}
            className={styles.action}
            aria-label={`Copy the path to ${label || "the root"}`}
            onClick={(event) => {
              event.stopPropagation();
              onCopyPath(row);
            }}
          >
            path
          </button>
          <button
            type="button"
            tabIndex={-1}
            className={styles.action}
            aria-label={`Copy the value of ${label || "the root"}`}
            onClick={(event) => {
              event.stopPropagation();
              onCopyValue(row);
            }}
          >
            value
          </button>
        </span>
      )}
    </div>
  );
});
