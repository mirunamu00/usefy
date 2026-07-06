/**
 * The function invoked to load the next page of data.
 *
 * It may be synchronous (`void`) or asynchronous (`Promise<void>`). When it
 * returns a promise, `useInfiniteScroll` tracks it as in-flight and will not
 * fire again until it settles, even if the sentinel re-enters view in the
 * meantime — an internal guard on top of the `loading` flag.
 */
export type LoadMoreFn = () => void | Promise<void>;

/**
 * Options for configuring the {@link useInfiniteScroll} hook.
 */
export interface UseInfiniteScrollOptions {
  /**
   * Whether there is more data to load. When `false`, the sentinel is no longer
   * observed and `loadMore` will never fire — set it `false` once the last page
   * has been reached.
   * @default true
   */
  hasMore?: boolean;

  /**
   * Whether a load is currently in progress. When `true`, an intersection will
   * not trigger `loadMore`, preventing overlapping requests. Wire this to your
   * own loading state.
   * @default false
   */
  loading?: boolean;

  /**
   * Master enable/disable switch. When `false`, the sentinel is not observed
   * and `loadMore` never fires, regardless of `hasMore`/`loading`.
   * @default true
   */
  enabled?: boolean;

  /**
   * Margin around the root, in CSS margin syntax, used to grow (or shrink) the
   * area that triggers a load. A positive margin like `"200px"` fires
   * `loadMore` *before* the sentinel is actually on screen, prefetching the
   * next page for a seamless scroll.
   * @default "0px"
   */
  rootMargin?: string;

  /**
   * The intersection ratio(s) at which a load is triggered. `0` fires as soon
   * as a single pixel of the sentinel is visible.
   * @default 0
   */
  threshold?: number | number[];

  /**
   * The scroll container used as the observer root. `null` (default) uses the
   * browser viewport. Pass a scrollable element (e.g. `containerRef.current`)
   * to run infinite scroll inside a fixed-height panel.
   * @default null
   */
  root?: Element | Document | null;
}

/**
 * The value returned by {@link useInfiniteScroll}: a callback ref to attach to
 * the sentinel element (typically an empty `<div>` at the end of the list).
 *
 * @example
 * ```tsx
 * const sentinelRef = useInfiniteScroll(loadMore, { hasMore, loading });
 * return <div ref={sentinelRef} />;
 * ```
 */
export type UseInfiniteScrollRef = (node: Element | null) => void;
