"use client";

/**
 * `<DiffViewer />` — the React shell (SPEC §3.3, §4.5).
 *
 * The component is a *rendering of the model and nothing more*: it computes
 * a {@link DiffResult} (or takes one), flattens it into an explicit row
 * list, and draws that list. All the diff intelligence lives in
 * `./headless`; everything here is presentation, expansion state, and
 * accessibility.
 *
 * The row list is deliberately materialised rather than nested-mapped: it is
 * what makes `aria-rowcount`/`aria-rowindex` truthful, and it is the array
 * Phase 3's virtualization will window over.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import styles from "./DiffViewer.module.scss";
import { Gap, type ExpandDirection, type GapLabels } from "./components/Gap";
import {
  SplitRowView,
  UnifiedRowView,
  cx,
  type RenderContent,
  type RowClassNames,
} from "./components/Row";
import { observeSize, useVirtualRows } from "./components/useVirtualRows";
import { computeDiff } from "./diff/computeDiff";
import { resolveOptions, type DiffLine, type DiffOptions, type DiffResult } from "./types";
import { alignRows, type SplitRow } from "./view/rows";

/**
 * Coerce a numeric prop, keeping `Infinity` only where it is meaningful.
 *
 * Mirrors the headless `toExtent`/`toFinite` split (SPEC resolved decision
 * #8) for the two props that never reach `resolveOptions`.
 */
function toPositive(value: number | undefined, fallback: number, allowInfinity = false): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  if (!Number.isFinite(value)) return allowInfinity && value > 0 ? value : fallback;
  return value;
}

/** Every user-facing string, so the viewer can be localised (SPEC §3.4). */
export type DiffViewerLabels = Partial<{
  /** Visible text on the "reveal from the top of the gap" control. */
  expandUp: string;
  /** Visible text on the "reveal from the bottom of the gap" control. */
  expandDown: string;
  /** Visible text on the "reveal everything" control. */
  expandAll: string;
  /** Accessible name for the up control — the visible text is only a glyph. */
  ariaExpandUp: (count: number) => string;
  /** Accessible name for the down control. */
  ariaExpandDown: (count: number) => string;
  /** Accessible name for the expand-all control. */
  ariaExpandAll: string;
  /** Receives the number of hidden lines. */
  hiddenLines: (count: number) => string;
  /** Accessible name for the diff table itself. */
  tableLabel: string;
  /** Accessible name for the horizontally scrollable code region. */
  scrollRegionLabel: string;
  noChanges: string;
  noChangesDetail: string;
  tooLarge: string;
  tooDifferent: string;
  diffAnyway: string;
  added: string;
  removed: string;
  /** Receives the stats; renders the header summary. */
  stats: (stats: { added: number; removed: number; unchanged: number }) => ReactNode;
}>;

/** Class-name slots (SPEC §4.5). */
export type DiffViewerClassNames = Partial<
  Record<
    "root" | "header" | "row" | "gutter" | "lineNumber" | "content" | "gap" | "marker",
    string
  >
>;

export interface DiffViewerProps extends DiffOptions {
  /** The "before" document. Ignored when `diff` is supplied. */
  oldText?: string;
  /** The "after" document. Ignored when `diff` is supplied. */
  newText?: string;
  /**
   * A pre-computed model — skips `computeDiff` entirely (e.g. computed in a
   * worker or on the server). Expansion still works: the hidden lines travel
   * inside the model (SPEC resolved decision #11).
   */
  diff?: DiffResult;
  /** @default "split" */
  view?: "split" | "unified";
  /** @default true */
  showLineNumbers?: boolean;
  /**
   * Wrap long lines instead of scrolling horizontally.
   * @default false
   */
  wrap?: boolean;
  /**
   * Row count above which only the visible window is rendered (SPEC §3.3).
   *
   * Virtualization needs a bounded viewport to window against, so above the
   * threshold the component also caps its own height
   * (`--usefy-diff-max-height`, default `70vh`) and scrolls internally.
   * Below it the diff renders in full and grows with its content.
   *
   * `Infinity` disables windowing; so does `wrap` (resolved decision #6).
   * @default 200
   */
  virtualizeThreshold?: number;
  /**
   * Height of one row in pixels — the unit windowing counts in.
   *
   * Must match the rendered row height, which is why it is written to
   * `--usefy-diff-row-height` rather than merely assumed.
   * @default 22
   */
  rowHeight?: number;
  /** Reveal every collapsed region on first render. @default false */
  defaultExpandAll?: boolean;
  /** The syntax-highlighting seam (SPEC §4.5). */
  renderContent?: RenderContent;
  labels?: DiffViewerLabels;
  /** `"system"` follows `prefers-color-scheme`. @default "system" */
  theme?: "light" | "dark" | "system";
  classNames?: DiffViewerClassNames;
  className?: string;
  /** Fired after a gap is expanded, with how many lines were revealed. */
  onExpand?: (hunkIndex: number, lines: number) => void;
}

const DEFAULT_LABELS = {
  expandUp: "↑ {count}",
  expandDown: "↓ {count}",
  expandAll: "Expand all",
  ariaExpandUp: (count: number) => `Expand ${count} lines above`,
  ariaExpandDown: (count: number) => `Expand ${count} lines below`,
  ariaExpandAll: "Expand all hidden lines",
  hiddenLines: (count: number) => `⋯ ${count} unchanged ${count === 1 ? "line" : "lines"}`,
  tableLabel: "Diff",
  scrollRegionLabel: "Diff content, scrollable horizontally",
  noChanges: "No changes",
  noChangesDetail: "The two versions are identical.",
  tooLarge: "This diff is too large to display.",
  tooDifferent: "These two versions have too little in common to diff quickly.",
  diffAnyway: "Diff anyway",
  added: "Added",
  removed: "Removed",
} as const;

/**
 * Resolve the effective dark-mode boolean for the chosen theme.
 *
 * `"system"` is resolved in **CSS** first (a `prefers-color-scheme` media
 * query in the stylesheet), so the very first paint — including a server
 * render, and including a page with JS disabled — is already correct. This
 * hook exists only so a *live* OS theme change repaints; it therefore starts
 * from `false` for `"system"` and never causes the initial flash.
 */
function useResolvedDark(theme: "light" | "dark" | "system"): boolean {
  const [dark, setDark] = useState(theme === "dark");

  useEffect(() => {
    if (theme === "light") {
      setDark(false);
      return;
    }
    if (theme === "dark") {
      setDark(true);
      return;
    }
    if (typeof window === "undefined" || !window.matchMedia) {
      setDark(false);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, [theme]);

  return dark;
}

/**
 * How much of one collapsed region has been revealed.
 *
 * `top` counts lines revealed from the start of the run, `bottom` from the
 * end, so the remaining gap marker stays *between* them — the shape every
 * code-review tool uses.
 */
interface Revealed {
  top: number;
  bottom: number;
}

const NOTHING_REVEALED: Revealed = { top: 0, bottom: 0 };
const NO_REVEALS: Record<string, Revealed> = {};

/** Key for one expandable region: which hunk, and which side of it. */
function regionKey(hunkIndex: number, side: "before" | "after"): string {
  return `${hunkIndex}:${side}`;
}

/** One rendered table row. The list of these is the render plan. */
type RenderRow =
  | { kind: "split"; key: string; row: SplitRow }
  | { kind: "unified"; key: string; line: DiffLine }
  | {
      kind: "gap";
      key: string;
      hunkIndex: number;
      side: "before" | "after";
      hidden: number;
      state: Revealed;
    };

/**
 * Track whether the scroll container actually overflows.
 *
 * A scrollable region has to be keyboard-reachable or a keyboard-only user
 * simply cannot see the right-hand side of a long line (Chromium only
 * scrolls a container that can take focus). But an always-tabbable div adds
 * a dead tab stop to every short diff, so the affordance is applied only
 * when there is something to scroll.
 */
function useOverflowing(ref: React.RefObject<HTMLElement | null>, deps: unknown[]): boolean {
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => setOverflowing(node.scrollWidth > node.clientWidth + 1);
    measure();
    return observeSize(node, measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return overflowing;
}

/**
 * Render a text diff as a side-by-side or unified table.
 *
 * ## What it renders
 *
 * A real `<table>`: rows are `<tr>`, the first line-number cell of each row
 * is a `<th scope="row">` and everything else is a `<td>`, so assistive
 * technology can navigate the diff as the tabular data it is (SPEC §8).
 * Every changed row carries a visually-hidden "Added"/"Removed" label **and**
 * a `+`/`−` gutter glyph, so the change type is never signalled by colour
 * alone. `aria-rowcount`/`aria-rowindex` describe the rows actually drawn.
 *
 * Content always renders as **text nodes** — never `dangerouslySetInnerHTML`
 * (SPEC §9). Pass `renderContent` to plug in a syntax highlighter; that is
 * explicitly your trust boundary.
 *
 * ## States
 *
 * - **Changes** — the normal table.
 * - **No changes** — an explicit message, not a blank box.
 * - **Refused** — when a guard trips, an honest explanation that distinguishes
 *   "too large" (`truncatedReason: "size"`) from "too different"
 *   (`"complexity"`), plus a "Diff anyway" button that retries with the
 *   guards off. That approval is scoped to the inputs that earned it: change
 *   the documents and the guards are back on.
 *
 * @example
 * ```tsx
 * import { DiffViewer } from "@usefy/diff-viewer";
 * import "@usefy/diff-viewer/styles.css";
 *
 * <DiffViewer oldText={before} newText={after} view="split" />
 * ```
 *
 * @example
 * ```tsx
 * // Bring your own highlighter — the seam hands you plain strings.
 * <DiffViewer
 *   oldText={before}
 *   newText={after}
 *   renderContent={({ text, segments }) =>
 *     segments ? segments.map((s, i) => <Token key={i} {...s} />) : <Token text={text} />
 *   }
 * />
 * ```
 */
export function DiffViewer({
  oldText = "",
  newText = "",
  diff,
  view = "split",
  showLineNumbers = true,
  wrap = false,
  virtualizeThreshold = 200,
  rowHeight = 22,
  defaultExpandAll = false,
  renderContent,
  labels,
  theme = "system",
  classNames = {},
  className,
  onExpand,
  ...diffOptions
}: DiffViewerProps): ReactNode {
  const isDark = useResolvedDark(theme);

  // The option object is spread from props, so memoise on the resolved
  // values rather than on an identity that changes every render.
  const resolved = resolveOptions(diffOptions);
  const optionsKey = JSON.stringify(resolved);

  /**
   * A token that changes whenever the *inputs* change.
   *
   * "Diff anyway" is approval for one specific pair of documents, so it is
   * stored as the token it was granted for rather than as a bare boolean.
   * A bare boolean stayed `true` across a document swap, and the next
   * refused pair would then be diffed with every guard set to `Infinity` —
   * re-opening the multi-second synchronous freeze the cost guard exists to
   * prevent, inside `useMemo`, during render. Comparing tokens resolves
   * `forced` back to `false` in the *same* render the inputs change, before
   * anything is computed.
   */
  const inputToken = useMemo(() => ({}), [oldText, newText, diff, optionsKey]);
  const [forcedFor, setForcedFor] = useState<object | null>(null);
  const forced = forcedFor === inputToken;

  const model = useMemo(() => {
    if (diff) return diff;
    const options: DiffOptions = forced
      ? { ...diffOptions, maxLines: Infinity, maxBytes: Infinity, maxEditDistance: Infinity }
      : diffOptions;
    return computeDiff(oldText, newText, options);
    // `optionsKey` stands in for the spread options object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diff, oldText, newText, optionsKey, forced]);

  /**
   * Expansion state, held together with the model it belongs to.
   *
   * Keys are `hunkIndex:side`, which say nothing about *which document* they
   * came from — so carrying the map across a model change made a fresh diff
   * render already-expanded, and a stale `top` larger than the new hidden
   * run drove the remaining count negative and made the gap vanish entirely.
   * Storing the model alongside makes a mismatch impossible to miss, with no
   * effect and no extra render.
   */
  const [reveal, setReveal] = useState<{
    model: DiffResult | null;
    map: Record<string, Revealed>;
  }>({ model: null, map: NO_REVEALS });
  const revealed = reveal.model === model ? reveal.map : NO_REVEALS;

  const text = { ...DEFAULT_LABELS, ...labels };
  const gapLabels: GapLabels = {
    expandUp: text.expandUp,
    expandDown: text.expandDown,
    expandAll: text.expandAll,
    ariaExpandUp: text.ariaExpandUp,
    ariaExpandDown: text.ariaExpandDown,
    ariaExpandAll: text.ariaExpandAll,
    hiddenLines: text.hiddenLines,
  };
  const rowLabels = { added: text.added, removed: text.removed };

  /**
   * Reveal part of a collapsed region.
   *
   * Everything is derived from the state the clicked gap actually rendered
   * with — nothing is computed inside the state updater. StrictMode invokes
   * updaters twice, so an updater that also decided how many lines to report
   * would double-fire `onExpand`; keeping the updater a pure merge makes
   * that impossible by construction.
   *
   * `remaining` is always ≥ 1 here: `Gap` renders nothing when there is
   * nothing left to reveal, so there is no button to click.
   */
  const handleExpand = useCallback(
    (
      hunkIndex: number,
      side: "before" | "after",
      current: Revealed,
      remaining: number,
      direction: ExpandDirection,
    ) => {
      const key = regionKey(hunkIndex, side);
      const step = Math.min(resolved.expandStep, remaining);
      const lines = direction === "all" ? remaining : step;
      const next: Revealed =
        direction === "all"
          ? { top: current.top + remaining, bottom: current.bottom }
          : direction === "up"
            ? { top: current.top + step, bottom: current.bottom }
            : { top: current.top, bottom: current.bottom + step };

      setReveal((previous) => ({
        model,
        map: { ...(previous.model === model ? previous.map : NO_REVEALS), [key]: next },
      }));
      onExpand?.(hunkIndex, lines);
    },
    [model, onExpand, resolved.expandStep],
  );

  const columnCount = view === "split" ? (showLineNumbers ? 6 : 4) : showLineNumbers ? 4 : 2;

  const rootClass = cx(
    styles.root,
    isDark && styles.dark,
    theme === "light" && styles.light,
    wrap && styles.wrap,
    classNames.root,
    className,
  );

  /* ---------------------------------------------------------------------- */
  /* The render plan                                                        */
  /* ---------------------------------------------------------------------- */

  /**
   * Flatten the model plus the current expansion state into the exact list
   * of rows to draw. Built even for the guarded states (where it is empty)
   * so the hook order never changes.
   */
  const rows = useMemo<RenderRow[]>(() => {
    if (model.truncated) return [];

    const out: RenderRow[] = [];

    const pushLines = (lines: readonly DiffLine[], keyPrefix: string) => {
      if (view === "split") {
        alignRows(lines).forEach((row, index) =>
          out.push({ kind: "split", key: `${keyPrefix}-${index}`, row }),
        );
      } else {
        lines.forEach((line, index) =>
          out.push({ kind: "unified", key: `${keyPrefix}-${index}`, line }),
        );
      }
    };

    const pushRegion = (hidden: DiffLine[], hunkIndex: number, side: "before" | "after") => {
      if (hidden.length === 0) return;
      const key = regionKey(hunkIndex, side);
      const state = defaultExpandAll
        ? { top: hidden.length, bottom: 0 }
        : (revealed[key] ?? NOTHING_REVEALED);
      const remaining = Math.max(0, hidden.length - state.top - state.bottom);

      if (state.top > 0) pushLines(hidden.slice(0, state.top), `${key}-top`);
      if (remaining > 0) {
        out.push({ kind: "gap", key, hunkIndex, side, hidden: remaining, state });
      }
      if (state.bottom > 0) {
        pushLines(hidden.slice(hidden.length - state.bottom), `${key}-bottom`);
      }
    };

    model.hunks.forEach((hunk, hunkIndex) => {
      pushRegion(hunk.hiddenBefore, hunkIndex, "before");
      pushLines(hunk.lines, `hunk-${hunkIndex}`);
      pushRegion(hunk.hiddenAfter, hunkIndex, "after");
    });

    return out;
  }, [model, view, revealed, defaultExpandAll]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const overflowing = useOverflowing(scrollerRef, [rows, view, showLineNumbers, wrap]);

  /* ---------------------------------------------------------------------- */
  /* Virtualization (SPEC §3.3, resolved decision #6)                       */
  /* ---------------------------------------------------------------------- */

  const safeRowHeight = Math.max(1, toPositive(rowHeight, 22));
  const threshold = Math.max(0, toPositive(virtualizeThreshold, 200, true));
  // `wrap` makes rows variable-height, which fixed-height windowing cannot
  // model — measured virtualization is a different, much larger problem.
  const wantsVirtual = rows.length > threshold;
  const virtualEnabled = wantsVirtual && !wrap;

  const rowWindow = useVirtualRows({
    enabled: virtualEnabled,
    total: rows.length,
    rowHeight: safeRowHeight,
    scrollRef: scrollerRef,
  });

  useEffect(() => {
    if (wrap && wantsVirtual && typeof console !== "undefined") {
      console.warn(
        `[@usefy/diff-viewer] wrap is on, so virtualization is disabled and all ${rows.length} rows are in the DOM. ` +
          "Wrapped rows have no fixed height, which fixed-height windowing cannot model (SPEC resolved decision #6). " +
          "Turn off wrap for large diffs.",
      );
    }
  }, [wrap, wantsVirtual, rows.length]);

  /**
   * Keep the keyboard somewhere sensible when the focused control is
   * windowed out — but never yank focus a user has deliberately moved away.
   *
   * Scrolling an expander out of the window unmounts it, and the browser
   * drops focus to `<body>`; catching that in the scroll container keeps a
   * keyboard user in the diff with arrow-key scrolling intact.
   *
   * The trap this avoids: a stale "focus was inside" flag would let an
   * *unrelated* resize (which also moves the window) steal focus off `<body>`
   * even though the user chose to leave. The discriminator is
   * `isConnected` — when a user tabs or clicks away the element stays in the
   * DOM, and `focusout` clears the ref; when windowing removes it the element
   * is already gone, so the ref survives for the window effect to act on.
   */
  const focusedInside = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const remember = (e: FocusEvent) => {
      focusedInside.current = e.target as HTMLElement;
    };
    const forget = (e: FocusEvent) => {
      // Still in the DOM ⇒ a real focus move, not an unmount ⇒ don't chase it.
      if ((e.target as HTMLElement).isConnected) focusedInside.current = null;
    };
    node.addEventListener("focusin", remember);
    node.addEventListener("focusout", forget);
    return () => {
      node.removeEventListener("focusin", remember);
      node.removeEventListener("focusout", forget);
    };
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    const focused = focusedInside.current;
    if (!node || !focused) return;
    // Restore focus only when the element that held it was actually windowed
    // out (removed from the DOM) and focus landed on <body> as a result.
    if (
      !focused.isConnected &&
      typeof document !== "undefined" &&
      document.activeElement === document.body
    ) {
      node.focus({ preventScroll: true });
    }
  }, [rowWindow.start, rowWindow.end]);

  const visibleRows = rowWindow.virtualized
    ? rows.slice(rowWindow.start, rowWindow.end)
    : rows;

  /* ---------------------------------------------------------------------- */
  /* Guarded and empty states                                               */
  /* ---------------------------------------------------------------------- */

  if (model.truncated) {
    const canRetry = !diff;
    return (
      <div className={rootClass} data-usefy-diff-state="truncated">
        <div className={styles.notice} role="status">
          <strong className={styles.noticeTitle}>
            {model.truncatedReason === "complexity" ? text.tooDifferent : text.tooLarge}
          </strong>
          {canRetry && (
            <div className={styles.noticeAction}>
              <button
                type="button"
                className={styles.gapButton}
                onClick={() => setForcedFor(inputToken)}
              >
                {text.diffAnyway}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (model.hunks.length === 0) {
    return (
      <div className={rootClass} data-usefy-diff-state="unchanged">
        <div className={styles.notice} role="status">
          <strong className={styles.noticeTitle}>{text.noChanges}</strong>
          {text.noChangesDetail}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* The diff itself                                                        */
  /* ---------------------------------------------------------------------- */

  return (
    <div className={rootClass} data-usefy-diff-state="diff" data-usefy-diff-view={view}>
      <div className={cx(styles.header, classNames.header)}>
        {labels?.stats ? (
          labels.stats(model.stats)
        ) : (
          <span className={styles.stats}>
            <span className={styles.statAdded}>+{model.stats.added}</span>
            <span className={styles.statRemoved}>−{model.stats.removed}</span>
            <span className={styles.statUnchanged}>{model.stats.unchanged} unchanged</span>
          </span>
        )}
      </div>

      <div
        // The height bound is driven by whether windowing is WANTED, not by
        // whether it has happened yet. Gating it on the outcome deadlocks:
        // an unbounded scroller grows to the full 20 000-row height, so it
        // always "fits" its own content, so the window never narrows, so the
        // bound is never applied. Intent first, measurement second.
        className={cx(styles.scroller, virtualEnabled && styles.virtualized)}
        ref={scrollerRef}
        style={{ "--usefy-diff-row-height": `${safeRowHeight}px` } as React.CSSProperties}
        data-usefy-diff-virtualized={rowWindow.virtualized ? "true" : undefined}
        // A scrollable region is only reachable by keyboard if it can take
        // focus; applied whenever there is actually something to scroll.
        {...(overflowing || virtualEnabled
          ? { tabIndex: 0, role: "group", "aria-label": text.scrollRegionLabel }
          : {})}
      >
        {/* aria-rowcount is the TRUE total so assistive tech never sees the
            window as the whole document. */}
        <table className={styles.table} aria-rowcount={rows.length}>
          <caption className={styles.srOnly}>
            {text.tableLabel}: {model.stats.added} added, {model.stats.removed} removed,{" "}
            {model.stats.unchanged} unchanged.
          </caption>
          {/* Explicit column widths — the first row is a collapsed-region
              row spanning every column and must not dictate the layout. */}
          <colgroup>
            {view === "split" ? (
              <>
                {showLineNumbers && <col className={styles.colNumber} />}
                <col className={styles.colMarker} />
                <col className={styles.colContent} />
                {showLineNumbers && <col className={styles.colNumber} />}
                <col className={styles.colMarker} />
                <col className={styles.colContent} />
              </>
            ) : (
              <>
                {showLineNumbers && (
                  <>
                    <col className={styles.colNumber} />
                    <col className={styles.colNumber} />
                  </>
                )}
                <col className={styles.colMarker} />
                <col className={styles.colContent} />
              </>
            )}
          </colgroup>
          <tbody>
            {/* Spacers stand in for the rows that are not in the DOM, so the
                scrollbar reflects the whole document rather than the
                window. */}
            {rowWindow.paddingTop > 0 && (
              <tr aria-hidden="true" className={styles.spacer}>
                <td colSpan={columnCount} style={{ height: rowWindow.paddingTop }} />
              </tr>
            )}
            {visibleRows.map((entry, offset) => {
              const index = rowWindow.start + offset;
              const ariaRowIndex = index + 1;
              if (entry.kind === "gap") {
                return (
                  <Gap
                    key={entry.key}
                    ariaRowIndex={ariaRowIndex}
                    hidden={entry.hidden}
                    columnCount={columnCount}
                    styles={styles}
                    classNames={classNames}
                    labels={gapLabels}
                    expandStep={resolved.expandStep}
                    onExpand={(direction) =>
                      handleExpand(
                        entry.hunkIndex,
                        entry.side,
                        entry.state,
                        entry.hidden,
                        direction,
                      )
                    }
                  />
                );
              }
              if (entry.kind === "split") {
                return (
                  <SplitRowView
                    key={entry.key}
                    ariaRowIndex={ariaRowIndex}
                    row={entry.row}
                    showLineNumbers={showLineNumbers}
                    styles={styles}
                    classNames={classNames}
                    labels={rowLabels}
                    renderContent={renderContent}
                  />
                );
              }
              return (
                <UnifiedRowView
                  key={entry.key}
                  ariaRowIndex={ariaRowIndex}
                  line={entry.line}
                  showLineNumbers={showLineNumbers}
                  styles={styles}
                  classNames={classNames}
                  labels={rowLabels}
                  renderContent={renderContent}
                />
              );
            })}
            {rowWindow.paddingBottom > 0 && (
              <tr aria-hidden="true" className={styles.spacer}>
                <td colSpan={columnCount} style={{ height: rowWindow.paddingBottom }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
