import type { PollingBackoff } from "./types";

/**
 * The default base polling interval (ms) when `options.interval` is omitted.
 */
export const DEFAULT_POLLING_INTERVAL = 1000;

/**
 * Compute the delay (in ms) to wait before the next poll, given how many polls
 * have failed **consecutively** so far and the configured backoff strategy.
 *
 * Pure and side-effect free — exported so the backoff behaviour can be unit
 * tested (and previewed) in isolation.
 *
 * - `failureCount <= 0` (a success, or the very first poll) or a falsy `backoff`
 *   → the plain `baseInterval`.
 * - `backoff === true` → exponential: `baseInterval * 2 ** failureCount`, no ceiling.
 * - {@link BackoffOptions} → exponential with a custom `factor` (default `2`),
 *   clamped to `maxInterval` (default `Infinity`).
 * - {@link BackoffFn} → whatever the function returns, falling back to
 *   `baseInterval` for a non-finite / negative result.
 *
 * @param failureCount - Number of consecutive failed polls (reset to 0 on success).
 * @param baseInterval - The configured base interval in ms.
 * @param backoff - The backoff strategy (see {@link PollingBackoff}).
 * @returns The delay in ms before the next poll.
 */
export function computePollingDelay(
  failureCount: number,
  baseInterval: number,
  backoff?: PollingBackoff,
): number {
  // No consecutive failures (or backoff disabled) → the plain base interval.
  if (failureCount <= 0 || !backoff) return baseInterval;

  if (typeof backoff === "function") {
    const delay = backoff(failureCount, baseInterval);
    return Number.isFinite(delay) && delay >= 0 ? delay : baseInterval;
  }

  const factor = backoff === true ? 2 : (backoff.factor ?? 2);
  const maxInterval =
    backoff === true ? Infinity : (backoff.maxInterval ?? Infinity);

  const delay = baseInterval * factor ** failureCount;
  return Math.min(delay, maxInterval);
}
