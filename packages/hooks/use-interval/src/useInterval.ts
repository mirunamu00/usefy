import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Interval delay in milliseconds. `null`/`undefined` disables the interval.
 */
export type IntervalDelay = number | null | undefined;

/**
 * Callback invoked on each interval tick.
 */
export type UseIntervalCallback = () => void;

/**
 * Options for {@link useInterval}.
 */
export interface UseIntervalOptions {
  /**
   * Execute the callback immediately when the interval (re)starts, then again on
   * each interval. On auto-start this fires once on mount (StrictMode-safe).
   * @default false
   */
  immediate?: boolean;
  /**
   * Start the interval automatically on mount. When `false`, call `start()`.
   * @default true
   */
  autoStart?: boolean;
}

/**
 * Return value of {@link useInterval}.
 */
export interface UseIntervalReturn {
  /** Start the interval (idempotent while already running). */
  start: () => void;
  /** Stop the interval (idempotent while already stopped). */
  stop: () => void;
  /** Toggle between running and stopped. */
  toggle: () => void;
  /** Whether the interval is currently ticking (started AND a valid delay). */
  isRunning: boolean;
}

/**
 * A declarative, SSR-safe `setInterval` for React with start/stop/toggle
 * controls. The callback is always read through a ref, so changing it never
 * restarts the interval, and the interval is cleared automatically on unmount.
 *
 * Passing `null`/`undefined` as the delay disables the interval; changing the
 * delay restarts it with the new value. A negative delay is treated as `0`.
 *
 * @param callback - Function to run on each tick.
 * @param delay - Interval in ms, or `null`/`undefined` to disable.
 * @param options - `immediate` and `autoStart` behavior.
 * @returns `{ start, stop, toggle, isRunning }`.
 *
 * @example
 * ```tsx
 * // Poll every 5 seconds
 * useInterval(() => {
 *   fetchData().then(setData);
 * }, 5000);
 * ```
 *
 * @example
 * ```tsx
 * // Countdown that stops itself at zero (disable via null delay)
 * const [count, setCount] = useState(10);
 * useInterval(() => setCount((c) => c - 1), count > 0 ? 1000 : null);
 * ```
 *
 * @example
 * ```tsx
 * // Manual pause/resume
 * const { toggle, isRunning } = useInterval(() => tick(), 1000);
 * return <button onClick={toggle}>{isRunning ? "Pause" : "Resume"}</button>;
 * ```
 */
export function useInterval(
  callback: UseIntervalCallback,
  delay: IntervalDelay,
  options: UseIntervalOptions = {}
): UseIntervalReturn {
  const { immediate = false, autoStart = true } = options;

  // The user's start/stop intent. The interval only ticks when this is true
  // AND a valid delay is set (see `isRunning`).
  const [started, setStarted] = useState(autoStart);

  // Latest values in refs so start/stop/toggle stay identity-stable and the
  // interval never re-subscribes just because the callback changed.
  const callbackRef = useRef(callback);
  const delayRef = useRef(delay);
  const immediateRef = useRef(immediate);
  const startedRef = useRef(started);

  // Keep the refs current post-commit (never mutate during render — that would
  // be unsafe under concurrent rendering / StrictMode).
  useEffect(() => {
    callbackRef.current = callback;
    delayRef.current = delay;
    immediateRef.current = immediate;
    startedRef.current = started;
  });

  const start = useCallback(() => {
    if (startedRef.current) {
      return; // idempotent: already running
    }
    startedRef.current = true;
    setStarted(true);
    if (immediateRef.current && delayRef.current != null) {
      callbackRef.current();
    }
  }, []);

  const stop = useCallback(() => {
    if (!startedRef.current) {
      return; // idempotent: already stopped
    }
    startedRef.current = false;
    setStarted(false);
  }, []);

  const toggle = useCallback(() => {
    if (startedRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  // The interval itself. Symmetric setup/cleanup so a StrictMode double-invoke
  // (or a delay change) correctly tears down and re-establishes the timer.
  useEffect(() => {
    if (!started || delay == null) {
      return;
    }
    const id = setInterval(() => {
      callbackRef.current();
    }, Math.max(0, delay));
    return () => clearInterval(id);
  }, [started, delay]);

  // Immediate execution for the auto-start path, fired exactly once on mount
  // (ref-guarded so a StrictMode double-invoke doesn't fire it twice).
  const didAutoImmediateRef = useRef(false);
  useEffect(() => {
    if (
      autoStart &&
      immediate &&
      delay != null &&
      !didAutoImmediateRef.current
    ) {
      didAutoImmediateRef.current = true;
      callbackRef.current();
    }
    // Mount-only; guarded by the ref above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRunning = started && delay != null;

  return useMemo(
    () => ({ start, stop, toggle, isRunning }),
    [start, stop, toggle, isRunning]
  );
}
