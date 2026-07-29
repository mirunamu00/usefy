"use client";

/**
 * `<JsonViewer />` — the React layer over the engine (SPEC.md §4.9).
 *
 * Everything expensive lives below this file. What happens here is assembly:
 * resolve the input, window the rows, keep the scroll anchored across
 * expansion changes, run the search off the main thread, and expose the
 * whole thing as an ARIA tree.
 */

import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useControllableState } from "@usefy/use-controllable-state";
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";
import { useDebounceCallback } from "@usefy/use-debounce-callback";
import { useEventCallback } from "@usefy/use-event-callback";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useMergedRefs } from "@usefy/use-merged-refs";
import { useResizeObserver } from "@usefy/use-resize-observer";
import { Row } from "./Row";
import { SearchBar } from "./SearchBar";
import { Toolbar } from "./Toolbar";
import { ValueOverlay } from "./ValueOverlay";
import { cx } from "./cx";
import { formatPath, pathToPointer } from "./model/path";
import { serializeSubtree } from "./model/serialize";
import { displayOf } from "./model/value";
import { searchJson } from "./search/scan";
import styles from "./styles/JsonViewer.module.scss";
import { useJsonTree } from "./useJsonTree";
import { useRowWindow } from "./useRowWindow";
import { useTreeKeyboard } from "./useTreeKeyboard";
import type {
  ExpandResult,
  JsonPath,
  JsonRow,
  JsonSearchOptions,
  JsonSearchProgress,
  JsonTreeOptions,
  PathFormat,
} from "./types";

/** Imperative handle for consumers that need to drive the viewer. */
export interface JsonViewerController {
  expand: (path: JsonPath) => ExpandResult;
  collapse: (path: JsonPath) => ExpandResult;
  expandAll: (maxDepth?: number) => ExpandResult;
  collapseAll: () => ExpandResult;
  scrollToPath: (path: JsonPath) => void;
  search: (query: string) => void;
  getRowCount: () => number;
}

export interface JsonViewerProps
  extends JsonTreeOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, "onCopy" | "onError" | "children"> {
  /** The value to render. Preferred — it is never parsed, cloned or mutated. */
  data?: unknown;
  /** Raw JSON text. Parsed per SPEC decision #5; use `data` when you already have a value. */
  json?: string;
  /**
   * Above this many characters of `json`, a "Parsing…" state paints first.
   * 40 MB parses in ~400 ms, which is not a bottleneck but *is* long enough to
   * read as a frozen tab with no feedback.
   * @defaultValue 2_097_152 (2 MB)
   */
  parseSyncLimit?: number;

  /** Controlled expansion state, as RFC 6901 pointers. */
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (paths: string[]) => void;

  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  searchOptions?: Omit<JsonSearchOptions, "query" | "signal">;

  /** @defaultValue 22 */
  rowHeight?: number;
  /** @defaultValue 400 */
  height?: number | string;
  /** @defaultValue "js" */
  pathFormat?: PathFormat;
  /** @defaultValue true */
  showSearch?: boolean;
  /** @defaultValue true */
  showToolbar?: boolean;
  /** @defaultValue false */
  showDataTypes?: boolean;
  /** @defaultValue false */
  quoteKeys?: boolean;
  /** @defaultValue "auto" */
  theme?: "light" | "dark" | "auto";

  renderValue?: (row: JsonRow) => React.ReactNode;
  onCopy?: (payload: { kind: "path" | "value"; text: string; row: JsonRow }) => void;
  onRowClick?: (row: JsonRow, event: React.MouseEvent) => void;
  onError?: (error: Error) => void;
  controllerRef?: React.Ref<JsonViewerController>;
}

const DEFAULT_PARSE_SYNC_LIMIT = 2 * 1024 * 1024;

interface Parsed {
  value: unknown;
  error: string | null;
}

export function JsonViewer({
  data,
  json,
  parseSyncLimit = DEFAULT_PARSE_SYNC_LIMIT,
  expanded,
  defaultExpanded,
  onExpandedChange,
  query: queryProp,
  defaultQuery,
  onQueryChange,
  searchOptions,
  rowHeight = 22,
  height = 400,
  pathFormat = "js",
  showSearch = true,
  showToolbar = true,
  showDataTypes = false,
  quoteKeys = false,
  theme = "auto",
  renderValue,
  onCopy,
  onRowClick,
  onError,
  controllerRef,
  maxValueLength = 120,
  sortKeys,
  defaultExpandDepth,
  maxExpandedRows,
  denseThreshold,
  className,
  style,
  "aria-label": ariaLabel,
  ...rest
}: JsonViewerProps) {
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reportError = useEventCallback((error: Error) => onError?.(error));

  // ── input ───────────────────────────────────────────────────────────────

  const syncParse = useMemo<Parsed | null>(() => {
    if (json === undefined || json.length > parseSyncLimit) return null;
    try {
      return { value: JSON.parse(json), error: null };
    } catch (error) {
      return { value: undefined, error: (error as Error).message };
    }
  }, [json, parseSyncLimit]);

  const [asyncParse, setAsyncParse] = useState<Parsed | null>(null);

  useEffect(() => {
    if (json === undefined || json.length <= parseSyncLimit) {
      setAsyncParse(null);
      return;
    }
    setAsyncParse(null);
    // One frame so the "Parsing…" state actually paints before the main
    // thread disappears into JSON.parse.
    let cancelled = false;
    const schedule =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (callback: () => void) => setTimeout(callback, 0) as unknown as number;

    const handle = schedule(() => {
      if (cancelled) return;
      try {
        setAsyncParse({ value: JSON.parse(json), error: null });
      } catch (error) {
        setAsyncParse({ value: undefined, error: (error as Error).message });
      }
    });

    return () => {
      cancelled = true;
      if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(handle);
    };
  }, [json, parseSyncLimit]);

  const parsed: Parsed | null = json === undefined ? { value: data, error: null } : (syncParse ?? asyncParse);
  const parseError = parsed?.error ?? null;
  const value = parsed?.value;

  useEffect(() => {
    if (parseError) reportError(new SyntaxError(parseError));
  }, [parseError, reportError]);

  // ── model ───────────────────────────────────────────────────────────────

  const tree = useJsonTree({
    data: value,
    expanded,
    defaultExpanded,
    onExpandedChange,
    maxValueLength,
    sortKeys,
    defaultExpandDepth,
    maxExpandedRows,
    denseThreshold,
  });
  const { model, rowCount } = tree;

  const { ref: resizeRef, height: measuredHeight } = useResizeObserver<HTMLDivElement>();
  const mergedScrollRef = useMergedRefs<HTMLDivElement>(scrollRef, resizeRef);

  const {
    window: rowWindow,
    anchor,
    scrollToRow,
    ensureRowVisible,
  } = useRowWindow({
    scrollRef,
    rowHeight,
    rowCount,
    viewportHeight: measuredHeight,
  });

  const [announcement, setAnnouncement] = useState("");
  const announce = useCallback((message: string) => setAnnouncement(message), []);
  /** The row `aria-activedescendant` points at — the tree's one "cursor". */
  const [activeRow, setActiveRow] = useState(0);

  const applyExpansion = useCallback(
    (result: ExpandResult) => {
      anchor(result);
      if (result.refused?.reason === "row-budget") {
        announce(
          `Too large to expand fully — stopped at the ${result.refused.budget?.toLocaleString()} row limit`,
        );
      }
      return result;
    },
    [anchor, announce],
  );

  const toggle = useCallback(
    (path: JsonPath) => applyExpansion(tree.toggle(path)),
    [applyExpansion, tree],
  );
  const expand = useCallback(
    (path: JsonPath) => applyExpansion(tree.expand(path)),
    [applyExpansion, tree],
  );
  const collapse = useCallback(
    (path: JsonPath) => applyExpansion(tree.collapse(path)),
    [applyExpansion, tree],
  );

  // ── copy ────────────────────────────────────────────────────────────────

  const [, copyToClipboard] = useCopyToClipboard();

  const copyText = useEventCallback(
    (kind: "path" | "value", text: string, row: JsonRow) => {
      void copyToClipboard(text).then((ok) => {
        announce(ok ? `Copied the ${kind}` : `Could not copy the ${kind}`);
        if (!ok) reportError(new Error(`json-viewer: copying the ${kind} failed`));
      });
      onCopy?.({ kind, text, row });
    },
  );

  const copyPath = useEventCallback((row: JsonRow) => {
    copyText("path", formatPath(row.path, pathFormat), row);
  });

  const copyValue = useEventCallback((row: JsonRow) => {
    const result = serializeSubtree(row.value);
    if (result.refused) {
      announce(
        `That value is too large to copy (over ${Math.round(result.refused.maxBytes / 1024 / 1024)} MB)`,
      );
      return;
    }
    copyText("value", result.text, row);
  });

  // ── the full-value overlay ──────────────────────────────────────────────

  const [overlay, setOverlay] = useState<{
    text: string;
    label: string;
    top: number;
    left: number;
    rowIndex: number;
  } | null>(null);

  const showFull = useEventCallback((row: JsonRow, anchorElement: HTMLElement) => {
    const rootBox = rootRef.current?.getBoundingClientRect();
    const anchorBox = anchorElement.getBoundingClientRect();
    const text =
      typeof row.value === "string"
        ? row.value
        : displayOf(row.value, row.kind, Number.MAX_SAFE_INTEGER).text;

    setOverlay({
      text,
      label: row.label,
      top: rootBox ? anchorBox.bottom - rootBox.top + 4 : 0,
      left: rootBox ? Math.max(8, anchorBox.left - rootBox.left) : 0,
      rowIndex: row.index,
    });
  });

  const closeOverlay = useCallback(() => {
    // Focus returns to the tree with the originating row active — the tree is
    // the single tab stop, so "the row" is `aria-activedescendant`, not an
    // element that can hold focus itself.
    setOverlay((current) => {
      if (current) setActiveRow(current.rowIndex);
      return null;
    });
    scrollRef.current?.focus();
  }, []);

  // ── search ──────────────────────────────────────────────────────────────

  const [query, setQuery] = useControllableState<string>({
    value: queryProp,
    defaultValue: defaultQuery ?? "",
    onChange: onQueryChange,
  });
  const [matches, setMatches] = useState<JsonPath[]>([]);
  const [progress, setProgress] = useState<JsonSearchProgress | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentMatch, setCurrentMatch] = useState(0);
  /** The query whose scan has finished; anything else means results are stale. */
  const [completedQuery, setCompletedQuery] = useState("");
  const searchAbort = useRef<AbortController | null>(null);

  const runSearch = useEventCallback(() => {
    searchAbort.current?.abort();

    if (!query) {
      setMatches([]);
      setProgress(null);
      setSearchError(null);
      setCurrentMatch(0);
      setCompletedQuery("");
      return;
    }

    const controller = new AbortController();
    searchAbort.current = controller;

    let options: JsonSearchOptions;
    try {
      options = { ...searchOptions, query, signal: controller.signal };
      // Fail fast on an invalid pattern rather than throwing inside the scan.
      if (options.regex) new RegExp(query);
    } catch (error) {
      setSearchError((error as Error).message);
      setMatches([]);
      setProgress(null);
      return;
    }

    setSearchError(null);
    // The progress callback needs the same guard as the result: a superseded
    // scan runs on until its next yield, and its last report would otherwise
    // overwrite the live scan's.
    const report = (next: JsonSearchProgress) => {
      if (!controller.signal.aborted) setProgress(next);
    };
    void searchJson(value, options, report)
      .then((result) => {
        if (controller.signal.aborted) return;
        setMatches(result.paths);
        setCurrentMatch(0);
        setCompletedQuery(query);
        if (result.capped) {
          announce(`Showing the first ${result.paths.length.toLocaleString()} matches`);
        } else {
          announce(
            result.paths.length === 0
              ? "No matches"
              : `${result.paths.length.toLocaleString()} matches`,
          );
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSearchError((error as Error).message);
        reportError(error as Error);
      });
  });

  const debouncedSearch = useDebounceCallback(runSearch, 180);

  // `searchOptions` is deliberately absent from the dependencies: it is read
  // through `runSearch`, which is an event callback and always sees the latest
  // props. Including it would restart the 180 ms debounce on every parent
  // re-render for the common case of an inline object literal — a parent
  // re-rendering faster than that would stop the search ever starting.
  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [query, value, debouncedSearch]);

  useEffect(() => () => searchAbort.current?.abort(), []);

  const matchSet = useMemo(() => new Set(matches.map(pathToPointer)), [matches]);
  const currentMatchPointer =
    matches.length > 0 ? pathToPointer(matches[currentMatch % matches.length]!) : null;

  const goToMatch = useCallback(
    (index: number) => {
      if (matches.length === 0) return;
      const next = ((index % matches.length) + matches.length) % matches.length;
      setCurrentMatch(next);
      const path = matches[next]!;
      applyExpansion(tree.expandTo(path));
      const row = model.rowIndexOf(path);
      if (row >= 0) {
        setActiveRow(row);
        scrollToRow(row);
      }
      announce(`Match ${next + 1} of ${matches.length}`);
    },
    [matches, applyExpansion, tree, model, scrollToRow, announce],
  );

  // ── keyboard ────────────────────────────────────────────────────────────

  const pageSize = Math.max(1, Math.floor((measuredHeight || 400) / rowHeight) - 1);

  const onKeyDown = useTreeKeyboard({
    model,
    rowCount,
    activeRow,
    setActiveRow,
    toggle,
    expand,
    collapse,
    pageSize,
    // Scroll into view, not to view: an arrow key must be able to walk the
    // highlight down the rows already on screen.
    onMove: ensureRowVisible,
    announce,
    onCopyValue: copyValue,
    onCopyPath: copyPath,
  });

  // Keep the active row inside the tree even after a collapse removed it.
  useIsomorphicLayoutEffect(() => {
    if (activeRow >= rowCount) setActiveRow(Math.max(0, rowCount - 1));
  }, [activeRow, rowCount]);

  // ── controller ──────────────────────────────────────────────────────────

  useImperativeHandle(
    controllerRef,
    () => ({
      expand,
      collapse,
      expandAll: (maxDepth?: number) => applyExpansion(tree.expandAll(maxDepth)),
      collapseAll: () => applyExpansion(tree.collapseAll()),
      scrollToPath: (path: JsonPath) => {
        applyExpansion(tree.expandTo(path));
        const row = model.rowIndexOf(path);
        if (row >= 0) {
          setActiveRow(row);
          scrollToRow(row);
        }
      },
      search: setQuery,
      getRowCount: () => model.rowCount(),
    }),
    [expand, collapse, applyExpansion, tree, model, scrollToRow, setQuery],
  );

  // ── render ──────────────────────────────────────────────────────────────

  const rows: JsonRow[] = [];
  for (let index = rowWindow.start; index < rowWindow.end; index++) {
    rows.push(model.rowAt(index));
  }

  const activeVisible = activeRow >= rowWindow.start && activeRow < rowWindow.end;
  const parsing = parsed === null;

  return (
    <div
      {...rest}
      ref={rootRef}
      data-usefy-theme={theme === "auto" ? undefined : theme}
      className={cx(styles.root, className)}
      style={{
        ...style,
        height,
        ["--usefy-json-row-height" as string]: `${rowHeight}px`,
      }}
    >
      {showToolbar ? (
        <Toolbar
          rowCount={rowCount}
          onExpandAll={() => applyExpansion(tree.expandAll())}
          onCollapseAll={() => applyExpansion(tree.collapseAll())}
          onCopyAll={() => copyValue(model.rowAt(0))}
        />
      ) : null}

      {showSearch ? (
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          matchCount={matches.length}
          currentMatch={currentMatch}
          progress={progress}
          scanning={query !== "" && completedQuery !== query && searchError === null}
          error={searchError}
          onPrevious={() => goToMatch(currentMatch - 1)}
          onNext={() => goToMatch(currentMatch + 1)}
        />
      ) : null}

      {parseError ? (
        <div className={styles.error} role="alert">
          {`Could not parse the JSON: ${parseError}`}
        </div>
      ) : parsing ? (
        <div className={styles.parsing}>Parsing…</div>
      ) : (
        <div
          ref={mergedScrollRef}
          className={styles.scroll}
          role="tree"
          tabIndex={0}
          aria-label={ariaLabel ?? "JSON tree"}
          aria-activedescendant={
            activeVisible ? `${baseId}-row-${activeRow}` : undefined
          }
          onKeyDown={onKeyDown}
          data-testid="json-scroll"
        >
          <div
            className={styles.sizer}
            style={{ height: rowWindow.contentHeight }}
            role="none"
          >
            <div
              className={styles.rows}
              style={{ transform: `translateY(${rowWindow.offset}px)` }}
              role="none"
            >
              {rows.map((row) => (
                <Row
                  key={row.index}
                  id={`${baseId}-row-${row.index}`}
                  row={row}
                  active={row.index === activeRow}
                  matched={matchSet.has(pathToPointer(row.path)) && !row.closing}
                  currentMatch={
                    !row.closing && currentMatchPointer === pathToPointer(row.path)
                  }
                  showDataTypes={showDataTypes}
                  quoteKeys={quoteKeys}
                  onToggle={toggle}
                  onActivate={setActiveRow}
                  onCopyPath={copyPath}
                  onCopyValue={copyValue}
                  onShowFull={showFull}
                  onRowClick={onRowClick}
                  renderValue={renderValue}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {overlay ? (
        <ValueOverlay
          text={overlay.text}
          label={overlay.label}
          top={overlay.top}
          left={overlay.left}
          onCopy={() => {
            void copyToClipboard(overlay.text).then((ok) =>
              announce(ok ? "Copied the value" : "Could not copy the value"),
            );
          }}
          onClose={closeOverlay}
        />
      ) : null}

      <div className={styles.status} role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
