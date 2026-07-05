/**
 * Lifecycle status of an async operation.
 *
 * - `idle` — no run has started yet (initial state).
 * - `pending` — a run is in flight (`isLoading` is `true`).
 * - `success` — the most recent run resolved.
 * - `error` — the most recent run rejected/threw.
 */
export type AsyncStatus = "idle" | "pending" | "success" | "error";

/**
 * The signature of an async function driven by {@link useAsyncFn}.
 *
 * @typeParam T - The resolved data type.
 * @typeParam Args - The tuple of arguments forwarded to the function.
 */
export type AsyncFn<T, Args extends unknown[] = unknown[]> = (
  ...args: Args
) => Promise<T>;

/**
 * The lifecycle state tracked for an async function.
 *
 * `status` is the source of truth; `isLoading` is a convenience mirror of
 * `status === "pending"`.
 *
 * @typeParam T - The resolved data type.
 * @typeParam E - The error type (defaults to `Error`).
 */
export interface AsyncState<T, E = Error> {
  /**
   * The most recent successfully-resolved value, or `undefined` if no run has
   * succeeded yet. Retained across subsequent `pending`/`error` transitions
   * (only replaced when a new run succeeds).
   */
  data: T | undefined;
  /**
   * The error from the most recent failed run, or `undefined`. Cleared when a
   * new run starts (`pending`) and when a run succeeds.
   */
  error: E | undefined;
  /** The current lifecycle status (source of truth). */
  status: AsyncStatus;
  /** Convenience mirror of `status === "pending"`. */
  isLoading: boolean;
}

/**
 * Options for {@link useAsyncFn}.
 *
 * @typeParam T - The resolved data type.
 * @typeParam E - The error type (defaults to `Error`).
 */
export interface UseAsyncFnOptions<T, E = Error> {
  /**
   * Seed value for `state.data` before the first successful run. The status
   * still starts as `"idle"` regardless of this value.
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
   * `setState`), never from inside a state updater.
   */
  onError?: (error: E) => void;
}

/**
 * The stable trigger returned by {@link useAsyncFn}. Call it from an event
 * handler; it forwards its arguments to the wrapped async function.
 *
 * The returned promise **never rejects** — errors are surfaced via
 * `state.error`. It resolves with the value `fn` produced for *that specific
 * call* on success, or `undefined` if `fn` rejected. (A `T` of `undefined` is
 * therefore ambiguous with failure — read `state.error` to disambiguate.)
 *
 * @typeParam T - The resolved data type.
 * @typeParam Args - The tuple of arguments forwarded to the function.
 */
export type AsyncRunFn<T, Args extends unknown[]> = (
  ...args: Args
) => Promise<T | undefined>;

/**
 * The tuple returned by {@link useAsyncFn}: `[state, run]`.
 *
 * @typeParam T - The resolved data type.
 * @typeParam Args - The tuple of arguments forwarded to the function.
 * @typeParam E - The error type (defaults to `Error`).
 */
export type UseAsyncFnReturn<
  T,
  Args extends unknown[],
  E = Error,
> = readonly [AsyncState<T, E>, AsyncRunFn<T, Args>];
