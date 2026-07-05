import { useCallback, useEffect, useRef, useState } from "react";
import { useLatest } from "@usefy/use-latest";
import type {
  AsyncFn,
  AsyncState,
  UseAsyncFnOptions,
  UseAsyncFnReturn,
} from "./types";

/**
 * Runs a single async function on demand and tracks its lifecycle
 * (`idle → pending → success | error`), with built-in race-safety and
 * unmount-safety.
 *
 * This is the manual-trigger core: nothing runs until you call `run(...)`,
 * typically from an event handler (button click, form submit). It is the
 * foundation the auto-executing `useAsync` builds on.
 *
 * Returns `[state, run]`:
 * - **state** — `{ data, error, status, isLoading }`. `status` is the source of
 *   truth; `isLoading === (status === "pending")`. `data` is retained across
 *   later runs and only replaced on success. `error` is cleared when a run
 *   starts and when a run succeeds.
 * - **run(...args)** — forwards `args` to `fn`, transitions to `pending`, then
 *   to `success` or `error`. It is **referentially stable** (safe as an effect
 *   dependency or child prop) and its returned promise **never rejects**:
 *   it resolves with `fn`'s value on success, or `undefined` on failure —
 *   errors surface via `state.error`. This means an un-awaited `run()` cannot
 *   produce an unhandled rejection.
 *
 * ### Race-safety (stale-response guarding)
 * Each call gets a monotonically increasing id. If a newer `run` starts before
 * an older one settles, the older result is ignored for state purposes — only
 * the latest call may update state. (Each `run()` promise still resolves with
 * its own result.)
 *
 * ### Unmount-safety
 * If the component unmounts before `fn` settles, no state update is performed
 * (no "state update on an unmounted component" warning). User callbacks
 * (`onSuccess`/`onError`) are likewise skipped after unmount.
 *
 * @remarks
 * `fn` is read through a ref, so you can pass a fresh inline async function on
 * every render without breaking `run`'s identity or causing stale captures.
 * The hook is SSR-safe (it touches no browser globals) and StrictMode-safe
 * (the mounted flag is re-armed on re-mount).
 *
 * `useAsyncFn` intentionally does **not** wire an `AbortController` into `fn`'s
 * signature — that keeps the generic `Args` clean. Abortable fetching is layered
 * on by `useAsync`/`usePolling`; here, in-flight results are simply discarded by
 * the stale-guard rather than aborted.
 *
 * @typeParam T - The resolved data type.
 * @typeParam Args - The tuple of arguments forwarded to `fn`.
 * @typeParam E - The error type (defaults to `Error`).
 *
 * @param fn - The async function to run. Receives whatever args you pass to `run`.
 * @param options - Optional `initialData` and `onSuccess`/`onError` callbacks.
 * @returns A `[state, run]` tuple.
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const [state, run] = useAsyncFn(async (email: string, password: string) => {
 *     const res = await fetch("/api/login", {
 *       method: "POST",
 *       body: JSON.stringify({ email, password }),
 *     });
 *     if (!res.ok) throw new Error("Invalid credentials");
 *     return (await res.json()) as { token: string };
 *   });
 *
 *   const handleSubmit = (e: React.FormEvent) => {
 *     e.preventDefault();
 *     run("me@example.com", "hunter2"); // fire-and-forget is safe
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button disabled={state.isLoading}>
 *         {state.isLoading ? "Signing in…" : "Sign in"}
 *       </button>
 *       {state.status === "error" && <p role="alert">{state.error?.message}</p>}
 *       {state.status === "success" && <p>Welcome! Token: {state.data?.token}</p>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useAsyncFn<T, Args extends unknown[] = unknown[], E = Error>(
  fn: AsyncFn<T, Args>,
  options: UseAsyncFnOptions<T, E> = {},
): UseAsyncFnReturn<T, Args, E> {
  const [state, setState] = useState<AsyncState<T, E>>(() => ({
    data: options.initialData,
    error: undefined,
    status: "idle",
    isLoading: false,
  }));

  // Keep the latest fn/options in refs so `run` stays referentially stable and
  // an inline fn passed each render never goes stale.
  const latestFn = useLatest(fn);
  const latestOptions = useLatest(options);

  // Monotonic call id — only the newest call may commit state (race guard).
  const callIdRef = useRef(0);

  // Mounted flag — re-armed on (re-)mount so StrictMode's mount→unmount→mount
  // double-invoke does not leave it stuck at `false`.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      const callId = ++callIdRef.current;

      setState((prev) => ({
        data: prev.data,
        error: undefined,
        status: "pending",
        isLoading: true,
      }));

      try {
        const data = await latestFn.current(...args);

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
      }
    },
    [latestFn, latestOptions],
  );

  return [state, run];
}
