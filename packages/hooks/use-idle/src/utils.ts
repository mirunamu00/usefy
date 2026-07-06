import type { IdleEventTarget } from "./types";

/**
 * The default set of activity events that reset the idle timer. Mirrors the set
 * used by `react-use` / `@mantine/hooks`, plus `"visibilitychange"` so that
 * returning to a backgrounded tab counts as activity.
 */
export const DEFAULT_IDLE_EVENTS: string[] = [
  "mousemove",
  "mousedown",
  "resize",
  "keydown",
  "touchstart",
  "wheel",
  "visibilitychange",
];

/**
 * The minimum interval (in milliseconds) between two activity-driven timer
 * resets. High-frequency events (`mousemove`, `wheel`, `resize`) can fire dozens
 * of times per second; throttling to a leading-edge reset at most once per this
 * window keeps the hook from thrashing while still restarting the (much larger)
 * idle timeout well before it can elapse.
 */
export const ACTIVITY_THROTTLE_MS = 200;

/**
 * The special event name that is always bound to `document` (it does not fire on
 * arbitrary elements) and routed through the visibility-aware handler.
 */
export const VISIBILITY_CHANGE_EVENT = "visibilitychange";

/**
 * Whether the hook is running in a browser-like environment with a `window`.
 *
 * @returns `true` when `window` is defined (client), `false` under SSR.
 *
 * @example
 * ```ts
 * if (isBrowser()) {
 *   // safe to attach activity listeners
 * }
 * ```
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Whether a `document` is available (needed for the `visibilitychange` event).
 *
 * @returns `true` when `document` is defined.
 */
export function isDocumentAvailable(): boolean {
  return typeof document !== "undefined";
}

/**
 * Resolve the target that generic activity events attach to. Returns the
 * provided `element` when given, otherwise `window` in the browser, or
 * `undefined` under SSR (where no listeners are attached).
 *
 * @param element - An explicit target, or `undefined` to default to `window`.
 * @returns The resolved target, or `undefined` when there is no `window`.
 *
 * @example
 * ```ts
 * const target = resolveIdleTarget(); // window in the browser
 * ```
 */
export function resolveIdleTarget(
  element?: IdleEventTarget
): IdleEventTarget | undefined {
  if (element) {
    return element;
  }
  return isBrowser() ? window : undefined;
}
