import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  KEY_REPEAT_DELAY_MS,
  KEY_REPEAT_INTERVAL_MS,
} from "../constants";

/** Pointer/touch handlers returned by {@link useKeyRepeat}, to spread on a key. */
export interface KeyRepeatHandlers {
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  /** Touch was cancelled (system gesture / scroll takeover) — must stop repeat. */
  onTouchCancel: () => void;
  onBlur: () => void;
}

export interface UseKeyRepeatOptions {
  /** Delay before repeating begins (ms). */
  delay?: number;
  /** Interval between repeats once started (ms). */
  interval?: number;
}

/**
 * Auto-repeat a key action while it is held. Returns hold handlers that, once
 * `enabled`, wait `delay` ms then fire `onRepeat` every `interval` ms until the
 * pointer is released / leaves / the touch is cancelled / the key blurs. The
 * consumer's own `onClick` still fires the initial single press (so a short tap
 * = one action, a long hold = the release click + N repeats).
 *
 * SSR-safe (touches no timers at import), and **leak-free**: every timer is
 * cleared on release and on unmount, so it is safe under StrictMode.
 *
 * @param enabled - When false the handlers are inert (no repeat).
 * @param onRepeat - Fired on each repeat tick. Read from a ref, so its identity
 *   may change freely without restarting anything.
 * @param options - `delay` / `interval` overrides.
 */
export function useKeyRepeat(
  enabled: boolean,
  onRepeat: () => void,
  options: UseKeyRepeatOptions = {}
): KeyRepeatHandlers {
  const { delay = KEY_REPEAT_DELAY_MS, interval = KEY_REPEAT_INTERVAL_MS } =
    options;

  const onRepeatRef = useRef(onRepeat);
  onRepeatRef.current = onRepeat;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const delayRef = useRef(delay);
  delayRef.current = delay;
  const intervalRef = useRef(interval);
  intervalRef.current = interval;

  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!enabledRef.current) return;
    stop();
    timeoutId.current = setTimeout(() => {
      timeoutId.current = null;
      onRepeatRef.current();
      intervalId.current = setInterval(() => {
        onRepeatRef.current();
      }, intervalRef.current);
    }, delayRef.current);
  }, [stop]);

  // Clear any pending timers on unmount (leak-free / StrictMode-safe).
  useEffect(() => stop, [stop]);

  // Stable handlers object (matches useLongPress's memoized `bind`).
  return useMemo<KeyRepeatHandlers>(
    () => ({
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: start,
      onTouchEnd: stop,
      onTouchCancel: stop,
      onBlur: stop,
    }),
    [start, stop]
  );
}
