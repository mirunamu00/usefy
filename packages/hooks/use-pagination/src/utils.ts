/**
 * Coerce a value to a safe integer, flooring fractions and enforcing a minimum.
 * Non-finite values (`NaN`, `Infinity`) fall back to `fallback`.
 *
 * @internal
 */
export function toSafeInt(value: number, min: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  const floored = Math.floor(value);
  return floored < min ? min : floored;
}

/**
 * Compute the number of pages for a dataset. Always returns at least `1` — an
 * empty dataset still has a single (empty) page — so it is safe to use directly
 * as the upper clamp bound. `total` is treated as `>= 0` and `pageSize` as
 * `>= 1` (both floored; non-finite inputs are normalized).
 *
 * @param total - Total number of items.
 * @param pageSize - Items per page.
 * @returns The page count, `>= 1`.
 *
 * @example
 * ```ts
 * getPageCount(0, 10);  // 1
 * getPageCount(25, 10); // 3
 * getPageCount(30, 10); // 3
 * ```
 */
export function getPageCount(total: number, pageSize: number): number {
  const safeTotal = toSafeInt(total, 0, 0);
  const safeSize = toSafeInt(pageSize, 1, 1);
  return Math.max(1, Math.ceil(safeTotal / safeSize));
}

/**
 * Clamp a requested page into `[1, pageCount]`, flooring fractions. Non-finite
 * requests fall back to page `1`. `pageCount` is assumed to be `>= 1` (as
 * returned by {@link getPageCount}).
 *
 * @param page - The requested 1-based page.
 * @param pageCount - The number of pages (upper bound).
 * @returns The clamped page, within `[1, pageCount]`.
 */
export function clampPage(page: number, pageCount: number): number {
  if (!Number.isFinite(page)) {
    return 1;
  }
  const floored = Math.floor(page);
  if (floored < 1) {
    return 1;
  }
  return floored > pageCount ? pageCount : floored;
}

/**
 * Parameters for {@link buildPaginationRange}.
 */
export interface BuildPaginationRangeParams {
  /** The current (clamped) 1-based page. */
  page: number;
  /** Total number of pages (`>= 1`). */
  pageCount: number;
  /** Pages shown on each side of the current page. @defaultValue 1 */
  siblingCount?: number;
  /** Pages shown at the start and end. @defaultValue 1 */
  boundaryCount?: number;
}

const inclusiveRange = (start: number, end: number): number[] =>
  start > end
    ? []
    : Array.from({ length: end - start + 1 }, (_, index) => start + index);

/**
 * Build the ordered list of page numbers with `"ellipsis"` gap tokens for a
 * pager UI — the well-known MUI/Mantine `usePagination` model. Always shows the
 * `boundaryCount` first/last pages and the `siblingCount` pages around the
 * current page, collapsing anything in between into a single `"ellipsis"`. When
 * a gap would hide exactly one page, that page is shown instead of an ellipsis.
 *
 * @param params - See {@link BuildPaginationRangeParams}.
 * @returns An ordered array of 1-based page numbers and `"ellipsis"` tokens.
 *
 * @example
 * ```ts
 * buildPaginationRange({ page: 1, pageCount: 10 });
 * // [1, 2, 3, 4, 5, "ellipsis", 10]
 * buildPaginationRange({ page: 6, pageCount: 10 });
 * // [1, "ellipsis", 5, 6, 7, "ellipsis", 10]
 * ```
 */
export function buildPaginationRange(
  params: BuildPaginationRangeParams
): (number | "ellipsis")[] {
  const count = Math.max(1, Math.floor(params.pageCount));
  const page = clampPage(params.page, count);
  const siblingCount = Math.max(0, Math.floor(params.siblingCount ?? 1));
  const boundaryCount = Math.max(0, Math.floor(params.boundaryCount ?? 1));

  const startPages = inclusiveRange(1, Math.min(boundaryCount, count));
  const endPages = inclusiveRange(
    Math.max(count - boundaryCount + 1, boundaryCount + 1),
    count
  );

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : count - 1
  );

  return [
    ...startPages,
    // Start gap: an ellipsis, or the single page it would have hidden.
    ...(siblingsStart > boundaryCount + 2
      ? (["ellipsis"] as const)
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...inclusiveRange(siblingsStart, siblingsEnd),
    // End gap: an ellipsis, or the single page it would have hidden.
    ...(siblingsEnd < count - boundaryCount - 1
      ? (["ellipsis"] as const)
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),
    ...endPages,
  ];
}
