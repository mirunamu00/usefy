import type { AsyncState } from "@usefy/use-async-fn";

/**
 * The signature of an async function driven by {@link useAsync}.
 *
 * Unlike {@link import("@usefy/use-async-fn").AsyncFn}, an `AsyncFnWithSignal`
 * receives an {@link AbortSignal} as its **first** argument, followed by the
 * arguments forwarded to `execute(...)`. Wire the signal into your `fetch`
 * (or any abortable API) so a superseded / reset / unmounted request is
 * actually cancelled, not merely ignored:
 *
 * ```ts
 * const asyncFn = (signal: AbortSignal, id: string) =>
 *   fetch(`/api/user/${id}`, { signal }).then((r) => r.json());
 * ```
 *
 * The signal-first shape keeps the forwarded `Args` tuple clean and fully
 * inferable.
 *
 * @typeParam T - The resolved data type.
 * @typeParam Args - The tuple of arguments forwarded to the function (after the signal).
 */
export type AsyncFnWithSignal<T, Args extends unknown[] = unknown[]> = (
  signal: AbortSignal,
  ...args: Args
) => Promise<T>;

/**
 * The stable trigger returned by {@link useAsync} as `execute`. Call it from an
 * event handler; it forwards its arguments to the wrapped async function (after
 * the {@link AbortSignal}).
 *
 * Mirrors `useAsyncFn`'s `run`: the returned promise **never rejects** — errors
 * (including the abort of a superseded call) are surfaced via `state.error` or
 * discarded by the stale-guard. It resolves with the value `fn` produced for
 * *that specific call* on success (even if the call was later superseded —
 * supersession only suppresses the state/callback update, not this return
 * value), or `undefined` if `fn` rejected. (A `T` of `undefined` is therefore
 * ambiguous with failure — read `status`/`error` to disambiguate.)
 *
 * @typeParam T - The resolved data type.
 * @typeParam Args - The tuple of arguments forwarded to the function.
 */
export type AsyncExecuteFn<T, Args extends unknown[]> = (
  ...args: Args
) => Promise<T | undefined>;

/**
 * Options for {@link useAsync}.
 *
 * @typeParam T - The resolved data type.
 * @typeParam Args - The tuple of arguments forwarded to `fn`.
 * @typeParam E - The error type (defaults to `Error`).
 */
export interface UseAsyncOptions<
  T,
  Args extends unknown[] = unknown[],
  E = Error,
> {
  /**
   * Auto-run the task once on mount (client-side only, from an effect — never
   * during SSR render).
   *
   * **Defaults to `true`** — `useAsync` is the auto-running counterpart to the
   * manual `useAsyncFn`; the whole point of reaching for it (vs. `useAsyncFn`)
   * is a declarative "load on mount". Set `immediate: false` to defer to a
   * manual `execute()`.
   *
   * The immediate run uses {@link UseAsyncOptions.args} (or no args when
   * omitted). Under React 18 StrictMode the mount effect runs twice: the first
   * run's `AbortController` is aborted by the cleanup and the second run wins,
   * so state never ends up corrupted.
   */
  immediate?: boolean;
  /**
   * Arguments for the immediate (auto-run) invocation. Required if your async
   * function needs arguments and you keep `immediate` enabled — otherwise the
   * immediate run calls the function with no forwarded args. Ignored for manual
   * `execute(...)` calls (which take their own args).
   */
  args?: Args;
  /**
   * Seed value for `data` before the first successful run. The status still
   * starts as `"idle"` regardless of this value, and `reset()` restores it.
   */
  initialData?: T;
  /**
   * Called after a run resolves successfully — but only for the latest
   * (non-superseded) run and only while the component is still mounted. Fired
   * from the event turn (after `setState`), never from inside a state updater.
   */
  onSuccess?: (data: T) => void;
  /**
   * Called after a run fails — but only for the latest (non-superseded) run and
   * only while the component is still mounted. Fired from the event turn (after
   * `setState`), never from inside a state updater. The abort of a superseded /
   * reset / unmounted call is never reported here.
   */
  onError?: (error: E) => void;
}

/**
 * The object returned by {@link useAsync}: the full {@link AsyncState} spread
 * flat (`data` / `error` / `status` / `isLoading`) plus `execute` and `reset`.
 *
 * This is the object-style sibling of `useAsyncFn`'s `[state, run]` tuple —
 * the state fields carry identical meaning.
 *
 * @typeParam T - The resolved data type.
 * @typeParam Args - The tuple of arguments forwarded to `fn`.
 * @typeParam E - The error type (defaults to `Error`).
 */
export interface UseAsyncReturn<
  T,
  Args extends unknown[] = unknown[],
  E = Error,
> extends AsyncState<T, E> {
  /**
   * Runs the async function, forwarding `args` (after the `AbortSignal`).
   * Referentially stable. Aborts any previous in-flight request before starting.
   * Never rejects — see {@link AsyncExecuteFn}.
   */
  execute: AsyncExecuteFn<T, Args>;
  /**
   * Returns state to idle (`{ data: initialData, error: undefined, status: "idle" }`),
   * aborts any in-flight request, and supersedes it so its late settlement is
   * ignored. Referentially stable.
   */
  reset: () => void;
}
