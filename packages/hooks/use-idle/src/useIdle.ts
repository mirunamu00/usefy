import { useEffect, useState } from "react";
import type { IdleEventTarget, UseIdleOptions, UseIdleReturn } from "./types";
import {
  ACTIVITY_THROTTLE_MS,
  DEFAULT_IDLE_EVENTS,
  VISIBILITY_CHANGE_EVENT,
  isDocumentAvailable,
  resolveIdleTarget,
} from "./utils";

/**
 * Track whether the user has been **inactive** for a given timeout.
 *
 * Returns `false` while the user is active and flips to `true` once no listened
 * activity (mouse, keyboard, touch, wheel, resize, tab focus) has occurred for
 * `timeout` milliseconds. The very next activity flips it back to `false` and
 * restarts the timer.
 *
 * ### Throttled activity
 * High-frequency events (`mousemove`, `wheel`, `resize`) are throttled with a
 * leading-edge guard so the idle timer is reset at most once every
 * ~{@link ACTIVITY_THROTTLE_MS}ms — enough to keep the timer alive during
 * continuous activity without re-running state work on every pointer move.
 *
 * ### Visibility awareness
 * `"visibilitychange"` is handled specially (and always bound to `document`):
 * **returning** to a backgrounded tab counts as activity and resets the timer,
 * while **backgrounding** the tab is *not* treated as activity — the timer keeps
 * running, so a user who switches away is allowed to fall idle. This is the
 * convention used by `react-use` and `@mantine/hooks`.
 *
 * ### SSR & concurrency
 * SSR-safe: on the server (no `window`) no listeners are attached and the hook
 * returns `initialState` inertly, avoiding hydration mismatches. StrictMode /
 * concurrent-safe: state is only ever set from event handlers and timers (never
 * from a render), and every listener + timer is torn down on unmount or when the
 * `timeout`/`events`/`element` inputs change, so there are no leaks or double
 * timers.
 *
 * @param timeout - Inactivity threshold in milliseconds before the user is
 * considered idle. Defaults to `60_000` (one minute).
 * @param options - Optional configuration (activity `events`, `initialState`,
 * target `element`).
 * @returns `true` once the user has been idle for `timeout` ms, `false` while
 * active.
 *
 * @example
 * ```tsx
 * // Basic: consider the user idle after one minute of inactivity
 * function AwayBadge() {
 *   const idle = useIdle(60_000);
 *   return <span>{idle ? "💤 Away" : "🟢 Active"}</span>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Log the user out after 5 minutes of inactivity
 * function SessionGuard() {
 *   const idle = useIdle(5 * 60_000);
 *   useEffect(() => {
 *     if (idle) logout();
 *   }, [idle]);
 *   return null;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Only listen to keyboard activity, start in the idle state
 * const idle = useIdle(30_000, {
 *   events: ["keydown"],
 *   initialState: true,
 * });
 * ```
 */
export function useIdle(
  timeout: number = 60_000,
  options: UseIdleOptions = {}
): UseIdleReturn {
  const {
    events = DEFAULT_IDLE_EVENTS,
    initialState = false,
    element,
  } = options;

  const [idle, setIdle] = useState<boolean>(initialState);

  // Serialize the event list into a stable primitive dependency so passing a
  // fresh array of the same events each render does not re-subscribe.
  const eventsKey = events.join(",");

  useEffect(() => {
    // Resolve the activity target. Under SSR (no `window`) with no explicit
    // `element`, this is `undefined` and no listeners are attached — the hook
    // returns `initialState` inertly. (Effects never run during SSR anyway; this
    // guard covers exotic client environments without a `window`.)
    const target = resolveIdleTarget(element);
    if (!target) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    // Leading-edge throttle bookkeeping (per effect instance).
    let lastActivity = 0;
    // Keep the throttle window strictly below the timeout so continuous
    // activity always resets the timer before it can fire. Capping at the
    // timeout itself is not enough: with `throttleMs === timeout` the earliest
    // allowed reset lands exactly when the pending idle timer fires, so a
    // dropped event inside that window lets `idle` flip true mid-activity.
    // Halving leaves a non-empty reset window even for sub-throttle timeouts.
    const throttleMs = Math.min(ACTIVITY_THROTTLE_MS, Math.floor(timeout / 2));

    const markIdle = () => {
      // No-op skip: React bails out when the value is unchanged.
      setIdle(true);
    };

    const markActive = () => {
      setIdle(false);
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      timer = setTimeout(markIdle, timeout);
    };

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity < throttleMs) {
        return;
      }
      lastActivity = now;
      markActive();
    };

    const handleVisibility = () => {
      // Returning to a visible tab is activity; backgrounding is not (the timer
      // keeps running so the user can fall idle). Coerce strictly: only a
      // genuine `document.hidden === true` counts as backgrounded.
      if (isDocumentAvailable() && document.hidden !== true) {
        markActive();
      }
    };

    const attached: Array<[IdleEventTarget, string, EventListener]> = [];

    for (const event of events) {
      if (event === VISIBILITY_CHANGE_EVENT) {
        if (isDocumentAvailable()) {
          document.addEventListener(
            VISIBILITY_CHANGE_EVENT,
            handleVisibility
          );
          attached.push([
            document,
            VISIBILITY_CHANGE_EVENT,
            handleVisibility as EventListener,
          ]);
        }
      } else {
        target.addEventListener(event, handleActivity);
        attached.push([target, event, handleActivity as EventListener]);
      }
    }

    // Start the inactivity timer on mount / whenever inputs change.
    timer = setTimeout(markIdle, timeout);

    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      for (const [t, event, listener] of attached) {
        t.removeEventListener(event, listener);
      }
    };
    // `events` is captured via its serialized `eventsKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeout, eventsKey, element]);

  return idle;
}
