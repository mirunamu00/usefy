/**
 * Public types for `@usefy/json-viewer` (SPEC.md §4.1).
 *
 * Everything here is shared by the pure engine (`./headless`) and the React
 * layer (`.`), so this module imports nothing — not even React.
 */

/**
 * What a value *is*, for rendering and for deciding whether it has children.
 *
 * The list goes well past what `JSON.parse` can produce because real app state
 * is not a JSON document: a Redux store, a React Query cache or a server action
 * payload routinely holds `Map`s, `Date`s and `undefined`, and a viewer that
 * renders those as `{}` is lying to the person debugging.
 */
export type JsonKind =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "undefined"
  | "bigint"
  | "date"
  | "map"
  | "set"
  | "function"
  | "symbol"
  | "circular"
  | "unknown";

/** One step of a path: an object key, or an array / `Map` / `Set` index. */
export type PathSegment = string | number;

/** A location in the tree, from the root down. The root itself is `[]`. */
export type JsonPath = readonly PathSegment[];

/** How {@link formatPath} renders a path (SPEC.md §4.5). */
export type PathFormat = "js" | "pointer" | "jsonpath";

/**
 * Everything the renderer needs for one row.
 *
 * Built during descent and handed to the caller — never stored. A 4.5 M-node
 * tree would need gigabytes to keep one of these per node, and the whole point
 * of the engine is that it doesn't have to.
 */
export interface JsonRow {
  /** Row index in the current expansion state. */
  index: number;
  /** Location of the node this row belongs to. */
  path: JsonPath;
  /** The key under the parent; `undefined` for the root. */
  key: PathSegment | undefined;
  /**
   * The text shown as this row's key.
   *
   * Usually `String(key)`, but not for a `Map`: its children are addressed
   * positionally (their keys need not be strings), so `key` is an index while
   * `label` is the map key rendered for a human.
   */
  label: string;
  kind: JsonKind;
  /** Indentation level; the root is 0. */
  depth: number;
  /** True for the synthetic `}` / `]` line of an expanded container. */
  closing: boolean;
  /** True when this node can be expanded (a non-empty container). */
  expandable: boolean;
  expanded: boolean;
  /** Number of children; 0 for leaves. */
  childCount: number;
  /**
   * 1-based position among the node's siblings, and how many there are.
   *
   * Required, not decorative: the siblings are windowed out of the DOM, so
   * without `aria-posinset`/`aria-setsize` a screen reader reports the size of
   * the *window* as the size of the tree (SPEC.md decision #8).
   */
  posInSet: number;
  setSize: number;
  /** Rendered text for a leaf, or the collapsed preview for a container. */
  display: string;
  /** True when `display` was cut at `maxValueLength`. */
  truncated: boolean;
  /** Live reference to the underlying value. Never cloned, never mutated. */
  value: unknown;
}

/** Tuning shared by the engine and the component (SPEC.md §4.1, §4.6). */
export interface JsonTreeOptions {
  /**
   * Characters of a leaf value rendered inline before truncation.
   * @defaultValue 120
   */
  maxValueLength?: number;
  /**
   * Sort object keys alphabetically instead of using insertion order.
   * @defaultValue false
   */
  sortKeys?: boolean;
  /**
   * How deep the tree starts out expanded. `0` shows only the root row.
   * @defaultValue 1
   */
  defaultExpandDepth?: number;
  /**
   * Ceiling for {@link JsonTreeModel.expandAll}. Expanding 4.5 M nodes is not
   * a useful operation, it is a frozen tab — so it is refused with a reason
   * rather than attempted.
   * @defaultValue 100_000
   */
  maxExpandedRows?: number;
  /**
   * Number of *expanded* children past which a container's order index is
   * promoted from the sparse representation to a dense Fenwick tree
   * (SPEC.md §4.2).
   *
   * Measured, not guessed: `pnpm bench` builds and exercises both
   * representations over a 200 000-child container and the crossover lands at
   * 1024. The first guess was 512, and it was wrong in the direction that
   * costs memory — below the crossover the sparse index is both faster *and*
   * three orders of magnitude smaller (12 KB against 1.5 MB).
   * @defaultValue 1024
   */
  denseThreshold?: number;
}

/** Why an expansion operation did not do what was asked. */
export interface ExpandRefusal {
  reason: "row-budget" | "depth-cap" | "not-expandable" | "unreachable";
  /** The ceiling that was hit, for `"row-budget"` and `"depth-cap"`. */
  budget?: number;
}

/**
 * The result of any operation that changes the expansion state.
 *
 * `delta` and `anchorRow` exist so the scroll container can anchor without
 * re-deriving either (SPEC.md §4.3) — the model already knows both, and
 * recomputing `anchorRow` after the mutation would give the wrong answer.
 */
export interface ExpandResult {
  /** Change in total row count. Negative on collapse. */
  delta: number;
  /** Row index of the toggled node *before* the change, or -1 if not visible. */
  anchorRow: number;
  /** Set when the operation was refused; absent on success. */
  refused?: ExpandRefusal;
}

/** The pure tree model. Created by `createJsonTree`, consumed by React or not. */
export interface JsonTreeModel {
  /** Total rows in the current expansion state. */
  rowCount(): number;
  /** The descriptor for row `index`. O(depth · log e). */
  rowAt(index: number): JsonRow;
  /** Row index of `path`, or -1 when an ancestor is collapsed or the path is dead. */
  rowIndexOf(path: JsonPath): number;
  isExpanded(path: JsonPath): boolean;
  /** True when the node exists and is a non-empty container. */
  isExpandable(path: JsonPath): boolean;
  toggle(path: JsonPath): ExpandResult;
  expand(path: JsonPath): ExpandResult;
  collapse(path: JsonPath): ExpandResult;
  /** Expand every *ancestor* of `path` so the node becomes visible. */
  expandTo(path: JsonPath): ExpandResult;
  /** Expand everything, or everything down to `maxDepth`, within the row budget. */
  expandAll(maxDepth?: number): ExpandResult;
  collapseAll(): ExpandResult;
  /** The expanded set, as formatted path strings — stable across re-creation. */
  getExpandedPaths(): string[];
  setExpandedPaths(paths: readonly string[]): ExpandResult;
  /** Bumped on every mutation. The subscription key for `useSyncExternalStore`. */
  version(): number;
  /** The value the model was built over. Read-only by contract. */
  readonly data: unknown;
}

/** Options for {@link searchJson} (SPEC.md §4.4). */
export interface JsonSearchOptions {
  query: string;
  /** @defaultValue true */
  matchKeys?: boolean;
  /** @defaultValue true */
  matchValues?: boolean;
  /** @defaultValue false */
  caseSensitive?: boolean;
  /** Treat `query` as a regular expression. @defaultValue false */
  regex?: boolean;
  /** Stop collecting past this many matches, and report it. @defaultValue 10_000 */
  maxResults?: number;
  /** Wall-clock budget for one synchronous slice, in ms. @defaultValue 8 */
  budgetMs?: number;
  signal?: AbortSignal;
}

/** Progress for a running scan. */
export interface JsonSearchProgress {
  /** Nodes visited so far. */
  scanned: number;
  matches: number;
  done: boolean;
  /** True once `maxResults` was reached — results are incomplete. */
  capped: boolean;
}

/** The outcome of a scan. */
export interface JsonSearchResult {
  paths: JsonPath[];
  /** True when `maxResults` cut the results short. Surfaced in the UI, never silent. */
  capped: boolean;
  aborted: boolean;
}
