import type { AsyncState } from "@usefy/use-async-fn";

/**
 * Fine-grained exponential-backoff configuration for {@link UsePollingOptions.backoff}.
 *
 * The delay before the next poll grows as
 * `baseInterval * factor ** failureCount`, clamped to `maxInterval`, where
 * `failureCount` is the number of **consecutive** failed polls (reset to `0` by
 * any success). The first failure already applies one `factor` step.
 */
export interface BackoffOptions {
  /**
   * The multiplier applied per consecutive failure. Defaults to `2` (classic
   * exponential backoff — the delay doubles each failure). A `factor` of `1`
   * keeps the delay constant.
   */
  factor?: number;
  /**
   * The upper bound (in ms) for the backed-off delay. Defaults to `Infinity`
   * (no ceiling). Use it to stop the delay from growing without limit, e.g.
   * `maxInterval: 30_000`.
   */
  maxInterval?: number;
}

/**
 * A custom backoff function for {@link UsePollingOptions.backoff}. Receives the
 * number of consecutive failures (`>= 1`) and the configured base `interval`,
 * and returns the delay (in ms) to wait before the next poll.
 *
 * Return a non-finite or negative value to fall back to the base interval.
 *
 * @example
 * ```ts
 * // Linear backoff: interval, 2×interval, 3×interval, …
 * backoff: (failures, base) => base * failures
 * ```
 */
export type BackoffFn = (failureCount: number, baseInterval: number) => number;

/**
 * The `backoff` option shape:
 * - `false` / omitted — no backoff; always wait `interval` (default).
 * - `true` — exponential backoff with `factor: 2`, no ceiling.
 * - {@link BackoffOptions} — exponential backoff with a custom `factor` / `maxInterval`.
 * - {@link BackoffFn} — full control over the delay per failure count.
 */
export type PollingBackoff = boolean | BackoffOptions | BackoffFn;

/**
 * Options for {@link usePolling}.
 *
 * @typeParam T - The resolved data type of a single poll.
 * @typeParam Args - The tuple of arguments forwarded to `fn` (after the signal).
 * @typeParam E - The error type (defaults to `Error`).
 */
export interface UsePollingOptions<
  T,
  Args extends unknown[] = unknown[],
  E = Error,
> {
  /**
   * The base delay (in ms) between the settlement of one poll and the start of
   * the next. Defaults to `1000`. Changing it applies from the **next** tick —
   * it never tears down or restarts the running loop.
   */
  interval?: number;
  /**
   * Whether the first poll fires **immediately** when the loop starts (or
   * resumes) rather than after one `interval`. Defaults to `true`. Set `false`
   * to wait one `interval` before the first poll.
   */
  immediate?: boolean;
  /**
   * Declarative gate for the whole loop. Defaults to `true`. When `false` the
   * hook does not poll at all; flipping it back to `true` (re)starts the loop
   * (respecting `immediate`). `enabled` is the **master switch** — while it is
   * `false`, `resume()` cannot start polling. See {@link UsePollingReturn.isPolling}.
   */
  enabled?: boolean;
  /**
   * Grow the delay after **consecutive** failures (exponential backoff), reset
   * to `interval` on the next success. Defaults to `false` (constant interval).
   * See {@link PollingBackoff}.
   */
  backoff?: PollingBackoff;
  /**
   * Arguments forwarded to `fn` (after the `AbortSignal`) on every poll. Read
   * fresh each tick, so changing them applies from the next poll without
   * restarting the loop.
   */
  args?: Args;
  /**
   * Seed value for `data` before the first successful poll. The status still
   * starts as `"idle"`.
   */
  initialData?: T;
  /**
   * Called after a poll resolves successfully — only while polling and only for
   * a non-superseded poll. Fired from the event turn (after `setState`), never
   * from inside a state updater.
   */
  onSuccess?: (data: T) => void;
  /**
   * Called after a poll fails — same in-flight / mounted guarantees as
   * `onSuccess`. The abort of a poll cancelled by `pause`/`stop`/`enabled=false`
   * or unmount is never reported here.
   */
  onError?: (error: E) => void;
}

/**
 * The object returned by {@link usePolling}: the full {@link AsyncState} of the
 * latest poll spread flat (`data` / `error` / `status` / `isLoading`) plus the
 * polling-loop control surface (`isPolling` + imperative controls).
 *
 * The async state fields carry **identical meaning** to `useAsyncFn` /
 * `useAsync` — `status` is the source of truth, `isLoading === status === "pending"`,
 * and `data` is retained across later `pending`/`error` transitions.
 *
 * @typeParam T - The resolved data type of a single poll.
 * @typeParam E - The error type (defaults to `Error`).
 */
export interface UsePollingReturn<T, E = Error> extends AsyncState<T, E> {
  /**
   * Whether the loop is currently active — i.e. `enabled && !paused`. `true`
   * while polls are running or a next tick is scheduled, `false` while paused,
   * stopped, or gated off by `enabled: false`.
   */
  isPolling: boolean;
  /**
   * Halt the loop imperatively: no new polls are scheduled, the pending timeout
   * is cleared, and any in-flight poll is aborted (its result is discarded).
   * Referentially stable. No-op if already paused.
   */
  pause: () => void;
  /**
   * Restart the loop imperatively (respecting `immediate`). Referentially
   * stable. Has **no effect while `enabled` is `false`** — `enabled` is the
   * master gate. No-op if already running.
   */
  resume: () => void;
  /**
   * Alias of {@link UsePollingReturn.resume}, for call sites that read more
   * naturally as "start". Same referential identity guarantees.
   */
  start: () => void;
  /**
   * Alias of {@link UsePollingReturn.pause}, for call sites that read more
   * naturally as "stop". Same referential identity guarantees.
   */
  stop: () => void;
}
