import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import type { LongPressEvent } from "./types";

/** Default press-and-hold threshold in milliseconds. */
export const DEFAULT_THRESHOLD = 400;

/** Default movement-cancellation distance in pixels. */
export const DEFAULT_MOVE_THRESHOLD = 10;

/**
 * How long, in milliseconds, after a touch event any `mouse*` handler is treated
 * as a browser-emitted *synthetic* mouse event and ignored. Browsers fire
 * `mousedown`/`mouseup`/`click` shortly after `touchend`; without this guard a
 * single touch long-press would also start a second gesture through the mouse
 * handlers.
 */
export const TOUCH_MOUSE_GUARD_MS = 500;

/** A pointer position in client coordinates. */
export interface Position {
  x: number;
  y: number;
}

/**
 * Type guard: is this a React touch event (as opposed to a mouse event)? Touch
 * events expose a `touches` list; mouse events do not.
 */
export function isTouchEvent(
  event: LongPressEvent
): event is ReactTouchEvent {
  return "touches" in event;
}

/**
 * Extract the client `{ x, y }` position from a mouse or touch event, or `null`
 * if it cannot be determined (e.g. a touch event with no active touches).
 *
 * For touch events it prefers the first active touch (`touches[0]`, available on
 * `touchstart`/`touchmove`) and falls back to the first changed touch
 * (`changedTouches[0]`, the one available on `touchend`).
 */
export function getPositionFromEvent(event: LongPressEvent): Position | null {
  if (isTouchEvent(event)) {
    const touch = event.touches[0] ?? event.changedTouches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : null;
  }
  return { x: event.clientX, y: event.clientY };
}

/**
 * Straight-line (Euclidean) distance in pixels between two positions.
 */
export function getDistance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Current timestamp in milliseconds. Uses `Date.now()` so it is deterministic
 * under fake timers and available in every environment (no `window`/SSR access).
 */
export function now(): number {
  return Date.now();
}
