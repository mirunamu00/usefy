/**
 * A DOM target that {@link useIdle} can attach its generic activity listeners
 * to. Defaults to `window` (resolved at runtime), which is where the common
 * activity events (`mousemove`, `keydown`, `wheel`, …) bubble to.
 *
 * Note: the `"visibilitychange"` event is special — it only fires on
 * `document`, so it is always attached to `document` regardless of this target.
 */
export type IdleEventTarget = HTMLElement | Document | Window;

/**
 * Options for {@link useIdle}.
 */
export interface UseIdleOptions {
  /**
   * The activity events that reset the idle timer. Any listened event marks the
   * user active (`idle` → `false`) and restarts the timer.
   *
   * The special `"visibilitychange"` entry is always attached to `document`:
   * returning to a backgrounded tab (`document.hidden === false`) counts as
   * activity, while backgrounding the tab is **not** treated as activity, so the
   * timer keeps running and the user is allowed to fall idle.
   *
   * @default ["mousemove", "mousedown", "resize", "keydown", "touchstart", "wheel", "visibilitychange"]
   */
  events?: string[];

  /**
   * The initial idle state, used for the first render and as the SSR/inert
   * value. Set to `true` to start in the idle state until the first activity.
   *
   * @default false
   */
  initialState?: boolean;

  /**
   * The element the generic activity events are attached to. Defaults to
   * `window` (resolved at runtime). The `"visibilitychange"` event is always
   * attached to `document`, independent of this target.
   *
   * @default window
   */
  element?: IdleEventTarget;
}

/**
 * The value returned by {@link useIdle}: `true` once the user has been inactive
 * for the configured timeout, `false` while active.
 */
export type UseIdleReturn = boolean;
