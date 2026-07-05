import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLatest } from "@usefy/use-latest";
import type { AsyncState } from "@usefy/use-async-fn";
import type {
  AsyncExecuteFn,
  AsyncFnWithSignal,
  UseAsyncOptions,
  UseAsyncReturn,
} from "./types";

/**
 * Manages the full lifecycle of a single async task
 * (`idle → pending → success | error`) with an **object-style** return,
 * built-in **`AbortController` cancellation**, and an **`immediate` auto-run**
 * on mount.
 *
 * This is the object-style, abortable sibling of `useAsyncFn`. It reuses the
 * same state shape (`{ data, error, status, isLoading }`, where `status` is the
 * source of truth and `isLoading === status === "pending"`) but adds the three
 * things a self-contained data-load needs: it runs itself on mount, it hands
 * your function an {@link AbortSignal} so an obsolete request is truly cancelled,
 * and it can be `reset()` back to idle.
 *
 * It is deliberately **not** a query cache — no keys, no dedupe across
 * components, no background revalidation. For that reach for TanStack Query;
 * `useAsync` is a focused local-async primitive.
 *
 * Returns `{ data, error, status, isLoading, execute, reset }`:
 * - **state fields** — identical in meaning to `useAsyncFn`. `data` is retained
 *   across later `pending`/`error` transitions and only replaced on success;
 *   `error` is cleared when a run starts and on success.
 * - **execute(...args)** — runs `fn(signal, ...args)`, transitioning to
 *   `pending` then `success`/`error`. **Referentially stable.** Its promise
 *   **never rejects** (resolves with the value `fn` produced — even for a
 *   superseded call, since supersession only suppresses the state update — or
 *   `undefined` if `fn` rejected; errors surface via `state.error`). Starting a
 *   new `execute` aborts the previous in-flight request.
 * - **reset()** — returns state to idle (restoring `initialData`), aborts any
 *   in-flight request, and supersedes it. **Referentially stable.**
 *
 * ### AbortController cancellation
 * Every `execute` creates a fresh `AbortController` and passes its `signal` as
 * the **first argument** to `fn` — wire it into `fetch(url, { signal })`. The
 * previous controller is aborted when a new `execute` starts, when `reset()` is
 * called, and on unmount. Aborting cannot stop a plain promise, so a
 * monotonic call-id **stale-guard** is kept as well: a superseded call can
 * never update state (or fire `onSuccess`/`onError`) even if it resolves after
 * being aborted.
 *
 * ### immediate (auto-run)
 * `immediate` **defaults to `true`** — the hook runs itself once on mount. Pass
 * `immediate: false` for a manual-only hook, or `args` to feed the auto-run
 * (see {@link UseAsyncOptions.args}). The auto-run fires from a `useEffect`, so
 * it **never runs during SSR** render. Under React 18 StrictMode the mount
 * effect double-invokes; the first run is aborted by the cleanup and the second
 * wins, so the double-mount is harmless.
 *
 * ### Unmount-safety
 * If the component unmounts before `fn` settles, the in-flight request is
 * aborted and no state update / callback runs.
 *
 * @remarks
 * `fn` and `options` are read through refs, so you can pass a fresh inline async
 * function and inline callbacks on every render without breaking `execute`'s
 * identity or causing stale captures. SSR-safe (touches no browser globals at
 * module or render time; `AbortController` is only constructed inside
 * `execute`, which only runs client-side).
 *
 * @typeParam T - The resolved data type.
 * @typeParam Args - The tuple of arguments forwarded to `fn` (after the signal).
 * @typeParam E - The error type (defaults to `Error`).
 *
 * @param fn - The async function to run. Receives `(signal, ...args)`.
 * @param options - Optional `immediate`, `args`, `initialData`, `onSuccess`, `onError`.
 * @returns `{ data, error, status, isLoading, execute, reset }`.
 *
 * @example
 * ```tsx
 * function UserProfile({ id }: { id: string }) {
 *   const { data, error, isLoading, execute, reset } = useAsync(
 *     async (signal: AbortSignal, userId: string) => {
 *       const res = await fetch(`/api/user/${userId}`, { signal });
 *       if (!res.ok) throw new Error("Failed to load user");
 *       return (await res.json()) as { name: string };
 *     },
 *     { immediate: true, args: [id] }, // auto-load on mount with `id`
 *   );
 *
 *   if (isLoading) return <p>Loading…</p>;
 *   if (error) return <button onClick={() => execute(id)}>Retry</button>;
 *   return (
 *     <div>
 *       <h1>{data?.name}</h1>
 *       <button onClick={reset}>Clear</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAsync<T, Args extends unknown[] = unknown[], E = Error>(
  fn: AsyncFnWithSignal<T, Args>,
  options: UseAsyncOptions<T, Args, E> = {},
): UseAsyncReturn<T, Args, E> {
  const [state, setState] = useState<AsyncState<T, E>>(() => ({
    data: options.initialData,
    error: undefined,
    status: "idle",
    isLoading: false,
  }));

  // Keep the latest fn/options in refs so `execute`/`reset` stay referentially
  // stable and an inline fn/callbacks passed each render never go stale.
  const latestFn = useLatest(fn);
  const latestOptions = useLatest(options);

  // Monotonic call id — only the newest call may commit state (race guard).
  const callIdRef = useRef(0);

  // The AbortController of the current in-flight request (or null).
  const controllerRef = useRef<AbortController | null>(null);

  // Mounted flag — re-armed on (re-)mount so StrictMode's mount→unmount→mount
  // double-invoke does not leave it stuck at `false`.
  const mountedRef = useRef(true);

  // Abort + drop the current in-flight controller, if any.
  const abortInFlight = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const execute = useCallback<AsyncExecuteFn<T, Args>>(
    async (...args: Args): Promise<T | undefined> => {
      const callId = ++callIdRef.current;

      // A new run supersedes and aborts the previous in-flight request.
      abortInFlight();
      const controller = new AbortController();
      controllerRef.current = controller;

      setState((prev) => ({
        data: prev.data,
        error: undefined,
        status: "pending",
        isLoading: true,
      }));

      try {
        const data = await latestFn.current(controller.signal, ...args);

        // Ignore for state purposes if unmounted or superseded by a newer call.
        if (mountedRef.current && callId === callIdRef.current) {
          setState({
            data,
            error: undefined,
            status: "success",
            isLoading: false,
          });
          latestOptions.current.onSuccess?.(data);
        }

        return data;
      } catch (err) {
        const error = err as E;

        if (mountedRef.current && callId === callIdRef.current) {
          setState((prev) => ({
            data: prev.data,
            error,
            status: "error",
            isLoading: false,
          }));
          latestOptions.current.onError?.(error);
        }

        return undefined;
      } finally {
        // Only clear the controller ref if this call still owns it.
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    [abortInFlight, latestFn, latestOptions],
  );

  const reset = useCallback(() => {
    // Supersede the in-flight call so its (aborted) settlement never commits.
    callIdRef.current++;
    abortInFlight();
    setState({
      data: latestOptions.current.initialData,
      error: undefined,
      status: "idle",
      isLoading: false,
    });
  }, [abortInFlight, latestOptions]);

  // Auto-run on mount (client only) + unmount cleanup.
  useEffect(() => {
    mountedRef.current = true;

    // `immediate` defaults to true; only opt out with an explicit `false`.
    if (latestOptions.current.immediate !== false) {
      const args = latestOptions.current.args ?? ([] as unknown as Args);
      void execute(...args);
    }

    return () => {
      mountedRef.current = false;
      abortInFlight();
    };
    // `execute`/`abortInFlight` are stable; this runs once per mount.
  }, [execute, abortInFlight]);

  return useMemo<UseAsyncReturn<T, Args, E>>(
    () => ({
      data: state.data,
      error: state.error,
      status: state.status,
      isLoading: state.isLoading,
      execute,
      reset,
    }),
    [state, execute, reset],
  );
}
