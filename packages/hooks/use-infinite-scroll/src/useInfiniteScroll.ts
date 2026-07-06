import { useCallback, useRef } from "react";
import {
  useIntersectionObserver,
  type OnChangeCallback,
} from "@usefy/use-intersection-observer";
import type {
  LoadMoreFn,
  UseInfiniteScrollOptions,
  UseInfiniteScrollRef,
} from "./types";

/**
 * Sentinel-driven infinite scrolling built on the Intersection Observer API.
 *
 * Attach the returned callback ref to a small sentinel element rendered at the
 * end of your list. Whenever that sentinel scrolls into view — and there is
 * more to load, nothing is currently loading, and the hook is enabled — your
 * `loadMore` callback fires exactly **once** per intersection.
 *
 * Built on top of {@link useIntersectionObserver}, so it inherits its SSR-safe
 * (returns an inert no-op ref on the server) and StrictMode-safe behavior.
 *
 * Key guarantees:
 * - **Fires once per intersection.** It does not re-fire while the sentinel
 *   stays in view; the sentinel must leave and re-enter to trigger again.
 * - **Latest-callback pattern.** Changing `loadMore` (or the `hasMore` /
 *   `loading` / `enabled` flags) never re-subscribes the observer.
 * - **No double-fire while loading.** Respects the `loading` flag *and* an
 *   internal in-flight guard: if `loadMore` returns a promise, the hook will
 *   not fire again until it settles.
 * - **Stops observing when exhausted.** Once `hasMore` is `false` (or `enabled`
 *   is `false`), the observer disconnects entirely.
 *
 * @param loadMore - Called to load the next page. May be sync or async.
 * @param options - Configuration (`hasMore`, `loading`, `enabled`, `rootMargin`,
 *   `threshold`, `root`).
 * @returns A callback ref to attach to the sentinel element.
 *
 * @example
 * ```tsx
 * function Feed() {
 *   const [items, setItems] = useState<Item[]>([]);
 *   const [loading, setLoading] = useState(false);
 *   const [hasMore, setHasMore] = useState(true);
 *
 *   const loadMore = async () => {
 *     setLoading(true);
 *     const { data, done } = await fetchNextPage(items.length);
 *     setItems((prev) => [...prev, ...data]);
 *     setHasMore(!done);
 *     setLoading(false);
 *   };
 *
 *   const sentinelRef = useInfiniteScroll(loadMore, { hasMore, loading });
 *
 *   return (
 *     <ul>
 *       {items.map((item) => (
 *         <li key={item.id}>{item.title}</li>
 *       ))}
 *       {hasMore && <li ref={sentinelRef} aria-hidden />}
 *     </ul>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Prefetch 300px early, inside a fixed-height scroll container.
 * const containerRef = useRef<HTMLDivElement>(null);
 * const sentinelRef = useInfiniteScroll(loadMore, {
 *   hasMore,
 *   loading,
 *   root: containerRef.current,
 *   rootMargin: "300px",
 * });
 * ```
 */
export function useInfiniteScroll(
  loadMore: LoadMoreFn,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollRef {
  const {
    hasMore = true,
    loading = false,
    enabled = true,
    rootMargin = "0px",
    threshold = 0,
    root = null,
  } = options;

  // Latest-callback pattern: mirror the callback and flags into refs so that a
  // changing `loadMore` (or flags) never re-subscribes the observer.
  const loadMoreRef = useRef<LoadMoreFn>(loadMore);
  loadMoreRef.current = loadMore;

  const stateRef = useRef({ hasMore, loading, enabled });
  stateRef.current = { hasMore, loading, enabled };

  // Internal in-flight guard for the async case, independent of the `loading`
  // prop: prevents a second fire while a returned promise is still pending.
  const inFlightRef = useRef(false);

  // Tracks the sentinel's previous visibility so we fire on the `false -> true`
  // transition only. Without this, a multi-threshold observer (e.g.
  // `threshold: [0, 0.5, 1]`) emits several `inView === true` callbacks as the
  // sentinel scrolls in; a synchronous `loadMore` (one that never sets
  // `loading`) would otherwise fire once per crossing.
  const prevInViewRef = useRef(false);

  const fireLoadMore = useCallback(() => {
    const state = stateRef.current;
    if (!state.enabled || !state.hasMore || state.loading || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    let result: void | Promise<void>;
    try {
      result = loadMoreRef.current();
    } catch (error) {
      // Synchronous throw: release the guard so a later intersection can retry,
      // then rethrow (mirrors the caller invoking loadMore directly).
      inFlightRef.current = false;
      throw error;
    }

    if (result && typeof (result as Promise<void>).then === "function") {
      const release = () => {
        inFlightRef.current = false;
      };
      // Handle both settle paths so the guard is always released and a rejected
      // promise does not surface as an unhandled rejection. The hook does not
      // itself surface loadMore errors — handle them inside loadMore.
      Promise.resolve(result).then(release, release);
    } else {
      inFlightRef.current = false;
    }
  }, []);

  const handleChange = useCallback<OnChangeCallback>(
    (_entry, inView) => {
      // Fire only on the transition into view, so a multi-threshold observer
      // that emits several `inView === true` callbacks per entry triggers a
      // single load.
      if (inView && !prevInViewRef.current) {
        fireLoadMore();
      }
      prevInViewRef.current = inView;
    },
    [fireLoadMore]
  );

  const { ref } = useIntersectionObserver({
    root,
    rootMargin,
    threshold,
    // Disconnect the observer entirely when there is nothing more to load or the
    // hook is disabled — there is no point observing a sentinel we will never
    // act on. `loading` is intentionally *not* folded in here: we keep observing
    // while a load is in flight (the fire guard handles it) so we don't lose the
    // sentinel's position mid-request.
    enabled: enabled && hasMore,
    onChange: handleChange,
  });

  return ref;
}
