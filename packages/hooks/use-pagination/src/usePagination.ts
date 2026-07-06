import { useCallback, useMemo, useRef } from "react";
import { useControllableState } from "@usefy/use-controllable-state";
import type {
  PaginationItem,
  PaginationRange,
  UsePaginationOptions,
  UsePaginationReturn,
} from "./types";
import { buildPaginationRange, clampPage, getPageCount, toSafeInt } from "./utils";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SIBLING_COUNT = 1;
const DEFAULT_BOUNDARY_COUNT = 1;

/**
 * A headless pagination state machine — the current page (controlled or
 * uncontrolled), the derived page count, a slice-ready index range, and an
 * ellipsis-aware page-number model for rendering a pager UI. It owns *state*
 * only; you render however you like.
 *
 * The current page is always kept within `[1, pageCount]`: it is clamped
 * **derived** from `total`/`pageSize`, so when the dataset shrinks the returned
 * `page` never points past the last page and the navigation controls stay
 * correct (a plain re-clamp, no surprise `onChange`). All controls
 * (`setPage`/`next`/`prev`/`first`/`last`) have stable identities and skip
 * no-op moves (staying on the current page does not re-render or fire
 * `onChange`).
 *
 * Works in both modes, mirroring `useControllableState`:
 * - **Uncontrolled** (`page` omitted): the hook owns the page, seeded from
 *   `defaultPage`; `onChange` fires after each committed change.
 * - **Controlled** (`page` provided): the returned `page` mirrors the prop
 *   (clamped) and the controls only call `onChange` — the parent owns the value.
 *
 * @param options - See {@link UsePaginationOptions}.
 * @returns The pagination state and controls — see {@link UsePaginationReturn}.
 *
 * @example
 * ```tsx
 * function UsersTable({ users }: { users: User[] }) {
 *   const { page, pageCount, range, items, setPage, next, prev, canNext, canPrev } =
 *     usePagination({ total: users.length, pageSize: 10 });
 *
 *   const visible = users.slice(range.start, range.end);
 *
 *   return (
 *     <>
 *       <ul>{visible.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
 *       <nav>
 *         <button onClick={prev} disabled={!canPrev}>Prev</button>
 *         {items.map((item, i) =>
 *           item.type === "ellipsis" ? (
 *             <span key={`gap-${i}`}>…</span>
 *           ) : (
 *             <button
 *               key={item.page}
 *               aria-current={item.selected}
 *               onClick={() => setPage(item.page!)}
 *             >
 *               {item.page}
 *             </button>
 *           )
 *         )}
 *         <button onClick={next} disabled={!canNext}>Next</button>
 *       </nav>
 *       <p>Page {page} of {pageCount}</p>
 *     </>
 *   );
 * }
 * ```
 */
export function usePagination(
  options: UsePaginationOptions
): UsePaginationReturn {
  const {
    total: rawTotal,
    pageSize: rawPageSize = DEFAULT_PAGE_SIZE,
    page: controlledPage,
    defaultPage = 1,
    siblingCount = DEFAULT_SIBLING_COUNT,
    boundaryCount = DEFAULT_BOUNDARY_COUNT,
    onChange,
  } = options;

  const total = toSafeInt(rawTotal, 0, 0);
  const pageSize = toSafeInt(rawPageSize, 1, 1);
  const pageCount = getPageCount(rawTotal, rawPageSize);

  // Raw (unclamped) page state, controllable. We always write *concrete*
  // clamped values through this setter (never updater functions), so the fact
  // that its internal value may drift out of range while the dataset shrinks
  // never leaks — the `page` below is always the clamped, derived value.
  const [rawPage, setRawPage] = useControllableState<number>({
    value: controlledPage,
    defaultValue: defaultPage,
    onChange,
  });

  const page = clampPage(rawPage, pageCount);

  // Mirror the latest derived values + setter into refs so the controls can be
  // fully identity-stable (empty dep arrays) while still reading fresh state.
  const stateRef = useRef({ page, pageCount });
  stateRef.current = { page, pageCount };

  const setRawPageRef = useRef(setRawPage);
  setRawPageRef.current = setRawPage;

  const setPage = useCallback((next: number) => {
    const { page: current, pageCount: count } = stateRef.current;
    const target = clampPage(next, count);
    if (target === current) {
      return; // no-op: staying put must not re-render or fire onChange
    }
    setRawPageRef.current(target);
  }, []);

  const next = useCallback(() => {
    setPage(stateRef.current.page + 1);
  }, [setPage]);

  const prev = useCallback(() => {
    setPage(stateRef.current.page - 1);
  }, [setPage]);

  const first = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const last = useCallback(() => {
    setPage(stateRef.current.pageCount);
  }, [setPage]);

  const canNext = page < pageCount;
  const canPrev = page > 1;

  const range = useMemo<PaginationRange>(() => {
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    return { start, end };
  }, [page, pageSize, total]);

  const items = useMemo<readonly PaginationItem[]>(
    () =>
      buildPaginationRange({
        page,
        pageCount,
        siblingCount,
        boundaryCount,
      }).map((entry) =>
        entry === "ellipsis"
          ? { type: "ellipsis", page: null, selected: false }
          : { type: "page", page: entry, selected: entry === page }
      ),
    [page, pageCount, siblingCount, boundaryCount]
  );

  return useMemo<UsePaginationReturn>(
    () => ({
      page,
      pageCount,
      pageSize,
      setPage,
      next,
      prev,
      first,
      last,
      canNext,
      canPrev,
      range,
      items,
    }),
    [
      page,
      pageCount,
      pageSize,
      setPage,
      next,
      prev,
      first,
      last,
      canNext,
      canPrev,
      range,
      items,
    ]
  );
}
