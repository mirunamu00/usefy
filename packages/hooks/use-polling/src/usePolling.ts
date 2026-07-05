import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLatest } from "@usefy/use-latest";
import type { AsyncFnWithSignal } from "@usefy/use-async";
import type { AsyncState } from "@usefy/use-async-fn";
import { computePollingDelay, DEFAULT_POLLING_INTERVAL } from "./utils";
import type { UsePollingOptions, UsePollingReturn } from "./types";

/**
 * Poll an async function on an interval, with **non-overlapping** self-scheduling
 * ticks, imperative `pause`/`resume` (and `start`/`stop` aliases), a declarative
 * `enabled` gate, and optional **exponential backoff** on consecutive failures.
 *
 * `usePolling` reuses the shared async-state shape of its batch-6 siblings
 * (`useAsyncFn` / `useAsync`): the latest poll is exposed as
 * `{ data, error, status, isLoading }` where `status` is the source of truth,
 * `isLoading === status === "pending"`, and `data` is **retained** across later
 * `pending`/`error` transitions. On top of that it adds polling-loop state:
 * `isPolling` plus the controls.
 *
 * It is deliberately a **standalone** minimal state machine rather than a wrapper
 * around `useAsync` — the same call `useAsync` itself made when it declined to
 * wrap `useAsyncFn`. Driving `useAsync.execute()` from a timer would force us to
 * suppress its `immediate`/mount auto-run and hijack its `onSuccess`/`onError`
 * just to recover the per-poll success/failure signal that `execute()`'s
 * ambiguous `T | undefined` return throws away (needed for backoff). Owning a
 * tiny `AbortController` + call loop is clearer; the shared **types** keep the
 * family consistent.
 *
 * ### No overlapping polls
 * The next tick is scheduled with a self-rescheduling `setTimeout` **only after
 * the current poll settles** — never a fixed `setInterval` that could stack
 * requests when `fn` is slower than `interval`. There is at most one poll in
 * flight at any moment.
 *
 * ### Controls & precedence
 * - **`enabled`** (default `true`) is the declarative master gate. While it is
 *   `false` the loop never runs and `resume()` cannot start it.
 * - **`pause`/`stop`** and **`resume`/`start`** are the imperative override
 *   *within* an enabled session. `isPolling === enabled && !paused`.
 * - Pausing (or `enabled: false`, or unmounting) clears the pending timeout and
 *   **aborts** the in-flight poll via its `AbortSignal`; the aborted poll's
 *   result is discarded. If a poll was in flight when you pause, `status`
 *   settles back to its last resolved value (`success`/`error`/`idle`) and
 *   `isLoading` clears — it never sticks on `pending`.
 *
 * ### immediate
 * `immediate` **defaults to `true`** — the first poll fires as soon as the loop
 * starts (or resumes); the next tick waits `interval`. Pass `immediate: false`
 * to wait one `interval` before the first poll.
 *
 * ### backoff
 * With `backoff` enabled, the delay grows after each **consecutive** failure and
 * resets to `interval` on the next success — `true` for exponential (`factor: 2`),
 * `{ factor, maxInterval }` for a tuned exponential, or a `(failures, base) =>
 * ms` function for full control.
 *
 * ### Safety
 * SSR-safe (no timers or `AbortController` at module/render time — only inside
 * effects, which never run on the server) and StrictMode-safe (the double-invoked
 * mount effect tears the first loop down before starting the second, so exactly
 * one self-scheduling loop is ever live — no runaway duplicate timers). `fn` and
 * every option are read through refs, so an inline `fn` / changing options never
 * restart the loop or go stale; only `enabled`/pause state starts and stops it.
 *
 * @typeParam T - The resolved data type of a single poll.
 * @typeParam Args - The tuple of arguments forwarded to `fn` (after the signal).
 * @typeParam E - The error type (defaults to `Error`).
 *
 * @param fn - The async function to poll. Receives `(signal, ...args)` — wire the
 *   {@link AbortSignal} into `fetch(url, { signal })` so a paused/stopped poll is
 *   truly cancelled.
 * @param options - Optional `interval`, `immediate`, `enabled`, `backoff`, `args`,
 *   `initialData`, `onSuccess`, `onError`.
 * @returns `{ data, error, status, isLoading, isPolling, pause, resume, start, stop }`.
 *
 * @example
 * ```tsx
 * function LiveStatus() {
 *   const { data, isPolling, pause, resume } = usePolling(
 *     async (signal: AbortSignal) => {
 *       const res = await fetch("/api/status", { signal });
 *       return (await res.json()) as { online: number };
 *     },
 *     { interval: 5000, immediate: true, backoff: { factor: 2, maxInterval: 30_000 } },
 *   );
 *
 *   return (
 *     <div>
 *       <p>{data ? `${data.online} online` : "…"}</p>
 *       <button onClick={isPolling ? pause : resume}>
 *         {isPolling ? "Pause" : "Resume"}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePolling<T, Args extends unknown[] = unknown[], E = Error>(
  fn: AsyncFnWithSignal<T, Args>,
  options: UsePollingOptions<T, Args, E> = {},
): UsePollingReturn<T, E> {
  const { enabled = true } = options;

  const [state, setState] = useState<AsyncState<T, E>>(() => ({
    data: options.initialData,
    error: undefined,
    status: "idle",
    isLoading: false,
  }));

  // Imperative pause flag. `enabled` is the declarative master gate; the loop is
  // active only while `enabled && !paused`.
  const [paused, setPaused] = useState(false);
  const active = enabled && !paused;

  // Keep the latest fn/options in refs so the loop reads fresh values (a changed
  // interval/args/inline fn applies on the next tick) without restarting, and so
  // the controls stay referentially stable.
  const latestFn = useLatest(fn);
  const latestOptions = useLatest(options);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  // Consecutive-failure counter driving backoff (reset to 0 on success / restart).
  const failureCountRef = useRef(0);

  useEffect(() => {
    if (!active) {
      // Loop gated off (pause / stop / enabled:false). If a poll was in flight
      // it has been aborted by the previous effect's cleanup — settle a stuck
      // `pending` so `isLoading` never sticks. This effect body never runs on
      // unmount (only cleanups do), so it can't setState after unmount.
      setState((prev) =>
        prev.status === "pending"
          ? {
              // A `pending` poll has already cleared `error`, so settle to the
              // last successful value if there is one, otherwise back to idle.
              ...prev,
              status: prev.data !== undefined ? "success" : "idle",
              isLoading: false,
            }
          : prev,
      );
      return;
    }

    // A fresh loop instance. `cancelled` is closed over by this instance only,
    // so StrictMode's mount→cleanup→mount double-invoke leaves exactly one live
    // loop: the first instance's cleanup sets its own `cancelled` and clears the
    // shared timeout before the second instance starts.
    let cancelled = false;
    const isLive = () => !cancelled;

    // Restart with a clean backoff slate.
    failureCountRef.current = 0;

    const runTick = async () => {
      if (!isLive()) return;

      const controller = new AbortController();
      controllerRef.current = controller;

      setState((prev) => ({
        data: prev.data,
        error: undefined,
        status: "pending",
        isLoading: true,
      }));

      let result: T | undefined;
      let failed = false;
      let caught: E | undefined;
      try {
        const args = (latestOptions.current.args ?? []) as Args;
        result = await latestFn.current(controller.signal, ...args);
      } catch (err) {
        failed = true;
        caught = err as E;
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }

      // The loop was torn down (pause / stop / enabled:false / unmount) while
      // this poll was in flight — discard its result and schedule nothing.
      if (!isLive()) return;

      const baseInterval =
        latestOptions.current.interval ?? DEFAULT_POLLING_INTERVAL;

      if (failed) {
        failureCountRef.current += 1;
        setState((prev) => ({
          data: prev.data,
          error: caught,
          status: "error",
          isLoading: false,
        }));
        latestOptions.current.onError?.(caught as E);
      } else {
        failureCountRef.current = 0;
        setState({
          data: result,
          error: undefined,
          status: "success",
          isLoading: false,
        });
        latestOptions.current.onSuccess?.(result as T);
      }

      scheduleNext(
        computePollingDelay(
          failureCountRef.current,
          baseInterval,
          latestOptions.current.backoff,
        ),
      );
    };

    const scheduleNext = (delay: number) => {
      if (!isLive()) return;
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        void runTick();
      }, delay);
    };

    // Start the loop: immediate first poll, or wait one interval.
    if (latestOptions.current.immediate !== false) {
      void runTick();
    } else {
      scheduleNext(latestOptions.current.interval ?? DEFAULT_POLLING_INTERVAL);
    }

    return () => {
      cancelled = true;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
    // `latestFn`/`latestOptions` are stable refs; only `active` starts/stops the loop.
  }, [active, latestFn, latestOptions]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return useMemo<UsePollingReturn<T, E>>(
    () => ({
      data: state.data,
      error: state.error,
      status: state.status,
      isLoading: state.isLoading,
      isPolling: active,
      pause,
      resume,
      // `start`/`stop` are documented aliases of `resume`/`pause` — same identity.
      start: resume,
      stop: pause,
    }),
    [state, active, pause, resume],
  );
}
