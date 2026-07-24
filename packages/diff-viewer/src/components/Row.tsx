/**
 * Row renderers for both views (SPEC §3.3).
 *
 * Split and unified share every cell primitive below, so a change to how a
 * line is drawn lands in both views at once — the views differ only in how
 * many columns they arrange those cells into.
 */

import type { ReactNode } from "react";

import type { DiffLine, DiffSegment } from "../types";
import type { SplitRow } from "../view/rows";

/** Slot class names a consumer can inject (SPEC §4.5). */
export interface RowClassNames {
  row?: string;
  gutter?: string;
  lineNumber?: string;
  content?: string;
  marker?: string;
}

/** Strings shown to assistive technology; all overridable for i18n. */
export interface RowLabels {
  added: string;
  removed: string;
}

/** The syntax-highlighting seam (SPEC §4.5, §9). */
export type RenderContent = (args: {
  text: string;
  segments?: DiffSegment[];
  side: "old" | "new";
  line: DiffLine;
}) => ReactNode;

/** The stylesheet's class map, threaded through rather than re-imported. */
export type RowStyles = Record<string, string>;

/**
 * Join the truthy class names; keeps JSX free of `&&` noise.
 *
 * Returns `undefined` rather than `""` when nothing applies, so React omits
 * the attribute instead of emitting a bare `class=""`.
 *
 * @example
 * ```ts
 * cx("row", false, undefined, "add"); // "row add"
 * cx(false, undefined);               // undefined
 * ```
 */
export function cx(...values: Array<string | false | null | undefined>): string | undefined {
  const out = values.filter(Boolean).join(" ");
  return out === "" ? undefined : out;
}

/**
 * Render a line's text as plain text nodes, with word-level segments
 * highlighted when the model provides them.
 *
 * **Never** uses `dangerouslySetInnerHTML` (SPEC §9): diff content is
 * untrusted by definition. A consumer who wants highlighted markup opts in
 * through `renderContent`, and that is explicitly their trust boundary.
 */
function LineText({
  line,
  side,
  styles,
  renderContent,
}: {
  line: DiffLine;
  side: "old" | "new";
  styles: RowStyles;
  renderContent?: RenderContent;
}): ReactNode {
  if (renderContent) {
    return renderContent({ text: line.content, segments: line.segments, side, line });
  }
  if (!line.segments) return line.content;
  return line.segments.map((segment, index) =>
    segment.type === "change" ? (
      <mark key={index} className={styles.segmentChange}>
        {segment.text}
      </mark>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}

/** The `+` / `−` gutter glyph — colour is never the only signal (SPEC §8). */
function markerFor(line: DiffLine | null): string {
  if (line === null) return "";
  if (line.type === "add") return "+";
  if (line.type === "remove") return "−";
  return " ";
}

/** The visually-hidden change announcement for a row. */
function AnnouncementFor({
  line,
  labels,
  styles,
}: {
  line: DiffLine | null;
  labels: RowLabels;
  styles: RowStyles;
}): ReactNode {
  if (line === null || line.type === "context") return null;
  return (
    <span className={styles.srOnly}>
      {line.type === "add" ? labels.added : labels.removed}
    </span>
  );
}

interface CellProps {
  line: DiffLine | null;
  side: "old" | "new";
  showLineNumbers: boolean;
  /** Only the FIRST line-number cell of a row is the row's header (N8). */
  isRowHeader: boolean;
  styles: RowStyles;
  classNames: RowClassNames;
  labels: RowLabels;
  renderContent?: RenderContent;
}

/**
 * A line-number cell.
 *
 * Exactly one per row is `<th scope="row">` — the row's header. The others
 * are plain `<td>`s: a second `scope="row"` header makes the row's identity
 * ambiguous to assistive technology, which then has two competing answers
 * for "what row is this?".
 */
function LineNumberCell({
  value,
  isRowHeader,
  className,
}: {
  value: number | undefined;
  isRowHeader: boolean;
  className: string | undefined;
}): ReactNode {
  const content = value ?? "";
  return isRowHeader ? (
    <th scope="row" className={className}>
      {content}
    </th>
  ) : (
    <td className={className}>{content}</td>
  );
}

/** One side of a split row: line number, marker, content. */
function SideCells({
  line,
  side,
  showLineNumbers,
  isRowHeader,
  styles,
  classNames,
  labels,
  renderContent,
}: CellProps): ReactNode {
  const number = side === "old" ? line?.oldNumber : line?.newNumber;
  const typeClass =
    line === null
      ? styles.filler
      : line.type === "add"
        ? styles.add
        : line.type === "remove"
          ? styles.remove
          : undefined;

  return (
    <>
      {showLineNumbers && (
        <LineNumberCell
          value={number}
          isRowHeader={isRowHeader}
          className={cx(
            styles.lineNumber,
            typeClass,
            classNames.lineNumber,
            classNames.gutter,
          )}
        />
      )}
      <td className={cx(styles.marker, typeClass, classNames.marker)} aria-hidden="true">
        {markerFor(line)}
      </td>
      <td className={cx(styles.content, typeClass, classNames.content)}>
        <AnnouncementFor line={line} labels={labels} styles={styles} />
        {line === null ? null : (
          <LineText line={line} side={side} styles={styles} renderContent={renderContent} />
        )}
      </td>
    </>
  );
}

/**
 * One row of the side-by-side view: old on the left, new on the right.
 *
 * A `null` side renders a filler cell so the two columns stay aligned even
 * when a change block is lopsided.
 */
export function SplitRowView({
  row,
  ariaRowIndex,
  showLineNumbers,
  styles,
  classNames,
  labels,
  renderContent,
}: {
  row: SplitRow;
  ariaRowIndex: number;
  showLineNumbers: boolean;
  styles: RowStyles;
  classNames: RowClassNames;
  labels: RowLabels;
  renderContent?: RenderContent;
}): ReactNode {
  return (
    <tr className={cx(styles.row, classNames.row)} aria-rowindex={ariaRowIndex}>
      <SideCells
        line={row.left}
        side="old"
        showLineNumbers={showLineNumbers}
        isRowHeader
        styles={styles}
        classNames={classNames}
        labels={labels}
        renderContent={renderContent}
      />
      <SideCells
        line={row.right}
        side="new"
        showLineNumbers={showLineNumbers}
        isRowHeader={false}
        styles={styles}
        classNames={classNames}
        labels={labels}
        renderContent={renderContent}
      />
    </tr>
  );
}

/**
 * One row of the unified view: both line numbers, then a single content
 * column.
 */
export function UnifiedRowView({
  line,
  ariaRowIndex,
  showLineNumbers,
  styles,
  classNames,
  labels,
  renderContent,
}: {
  line: DiffLine;
  ariaRowIndex: number;
  showLineNumbers: boolean;
  styles: RowStyles;
  classNames: RowClassNames;
  labels: RowLabels;
  renderContent?: RenderContent;
}): ReactNode {
  const typeClass =
    line.type === "add" ? styles.add : line.type === "remove" ? styles.remove : undefined;
  // A removal shows the old text, everything else the new.
  const side = line.type === "remove" ? "old" : "new";
  const numberClass = cx(
    styles.lineNumber,
    typeClass,
    classNames.lineNumber,
    classNames.gutter,
  );

  return (
    <tr className={cx(styles.row, classNames.row)} aria-rowindex={ariaRowIndex}>
      {showLineNumbers && (
        <>
          <LineNumberCell value={line.oldNumber} isRowHeader className={numberClass} />
          <LineNumberCell value={line.newNumber} isRowHeader={false} className={numberClass} />
        </>
      )}
      <td className={cx(styles.marker, typeClass, classNames.marker)} aria-hidden="true">
        {markerFor(line)}
      </td>
      <td className={cx(styles.content, typeClass, classNames.content)}>
        <AnnouncementFor line={line} labels={labels} styles={styles} />
        <LineText line={line} side={side} styles={styles} renderContent={renderContent} />
      </td>
    </tr>
  );
}
