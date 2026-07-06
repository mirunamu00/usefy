/**
 * Options for the {@link usePagination} hook.
 */
export interface UsePaginationOptions {
  /**
   * Total number of items across all pages. Values below `0` (and non-finite
   * values) are treated as `0`. Fractional values are floored.
   */
  total: number;

  /**
   * Number of items per page.
   *
   * @defaultValue 10
   * @remarks Clamped to a minimum of `1` — a page size of `0` or a negative
   * value would make `pageCount` meaningless, so it is coerced to `1`.
   */
  pageSize?: number;

  /**
   * The **controlled** current page (1-based). When provided (not `undefined`),
   * the hook runs in controlled mode: the returned `page` mirrors this prop
   * (clamped into `[1, pageCount]`) and `setPage`/`next`/`prev`/… only call
   * `onChange` — the parent owns the value.
   *
   * Pass `undefined` to run uncontrolled, seeded from {@link defaultPage}.
   */
  page?: number;

  /**
   * The initial current page (1-based) in **uncontrolled** mode. Ignored while
   * controlled.
   *
   * @defaultValue 1
   */
  defaultPage?: number;

  /**
   * Number of always-visible page buttons on each side of the current page in
   * the {@link UsePaginationReturn.items} model.
   *
   * @defaultValue 1
   */
  siblingCount?: number;

  /**
   * Number of always-visible page buttons at the start and end (the boundaries)
   * in the {@link UsePaginationReturn.items} model.
   *
   * @defaultValue 1
   */
  boundaryCount?: number;

  /**
   * Called with the next page whenever the current page changes — via any of the
   * navigation controls in uncontrolled mode, or when a control requests a
   * *different* page in controlled mode. Its identity may change between renders
   * without any effect on the hook (the latest callback is always used).
   */
  onChange?: (page: number) => void;
}

/**
 * The kind of a {@link PaginationItem}: a real page button, or an `"ellipsis"`
 * gap token used to collapse a long run of pages.
 */
export type PaginationItemType = "page" | "ellipsis";

/**
 * A single entry in the ellipsis-aware page-number model
 * ({@link UsePaginationReturn.items}) used to render a pager UI.
 */
export interface PaginationItem {
  /** Whether this entry is a clickable page or an `"ellipsis"` gap. */
  type: PaginationItemType;

  /**
   * The 1-based page number for a `"page"` entry, or `null` for an `"ellipsis"`.
   */
  page: number | null;

  /** `true` when this is the current page (always `false` for `"ellipsis"`). */
  selected: boolean;
}

/**
 * The 0-based index window of the current page, ready to slice an array with
 * `array.slice(range.start, range.end)`.
 */
export interface PaginationRange {
  /** 0-based index of the first item on the current page (**inclusive**). */
  readonly start: number;

  /**
   * 0-based index **one past** the last item on the current page
   * (**exclusive**), clamped to `total`. `array.slice(start, end)` yields the
   * current page's items. For an empty dataset, `start === end === 0`.
   */
  readonly end: number;
}

/**
 * Return value of {@link usePagination}.
 */
export interface UsePaginationReturn {
  /** The current page, 1-based, always within `[1, pageCount]`. */
  page: number;

  /**
   * Total number of pages, always `>= 1` (an empty dataset still has one empty
   * page). Equals `Math.max(1, Math.ceil(total / pageSize))`.
   */
  pageCount: number;

  /** The effective page size (clamped to a minimum of `1`). */
  pageSize: number;

  /**
   * Go to a specific page. The argument is clamped into `[1, pageCount]` and
   * floored; going to the page you are already on is a no-op (no re-render, no
   * `onChange`). Stable identity.
   */
  setPage: (page: number) => void;

  /** Go to the next page (no-op on the last page). Stable identity. */
  next: () => void;

  /** Go to the previous page (no-op on the first page). Stable identity. */
  prev: () => void;

  /** Go to the first page. Stable identity. */
  first: () => void;

  /** Go to the last page. Stable identity. */
  last: () => void;

  /** `true` when there is a next page (`page < pageCount`). */
  canNext: boolean;

  /** `true` when there is a previous page (`page > 1`). */
  canPrev: boolean;

  /**
   * The 0-based index window of the current page for slicing your data array.
   * See {@link PaginationRange}.
   */
  range: PaginationRange;

  /**
   * The ellipsis-aware ordered list of page buttons and gap tokens to render a
   * pager UI, driven by `siblingCount`/`boundaryCount`. Read-only — it is a
   * memoized derived model, so treat it as immutable. See {@link PaginationItem}.
   */
  items: readonly PaginationItem[];
}
