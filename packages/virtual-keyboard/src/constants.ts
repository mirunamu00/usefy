import type { KeyAction, KeyDefinition } from "./types";

/** Default accessible label for the keyboard container. */
export const DEFAULT_ARIA_LABEL = "On-screen keyboard";

/** Names of the built-in layouts. */
export const LAYOUT_NAMES = {
  qwerty: "qwerty",
  numeric: "numeric",
  phone: "phone",
  email: "email",
} as const;

/** Actions that toggle a modifier (and therefore expose `aria-pressed`). */
const MODIFIER_ACTIONS: ReadonlySet<KeyAction> = new Set<KeyAction>([
  "shift",
  "capslock",
  "layer",
]);

/**
 * Whether a key action toggles a modifier (Shift / Caps Lock / symbol layer).
 * Modifier keys expose `aria-pressed` in the rendered UI.
 */
export function isModifierAction(action: KeyAction | undefined): boolean {
  return action !== undefined && MODIFIER_ACTIONS.has(action);
}

/** Whether a key action is a text-editing / value-affecting action. */
export function isTextAction(action: KeyAction | undefined): boolean {
  return (
    action === "backspace" ||
    action === "enter" ||
    action === "space" ||
    action === "tab" ||
    action === "clear"
  );
}

/**
 * Actions eligible for auto-repeat while held (with `enableKeyRepeat`). Only
 * `backspace` today — it is the sole destructive / caret-motion action in the
 * built-in layouts. Character keys never auto-repeat (holding a letter opens the
 * accent-variants popup instead).
 */
const REPEATABLE_ACTIONS: ReadonlySet<KeyAction> = new Set<KeyAction>([
  "backspace",
]);

/** Whether an action auto-repeats when held (and `enableKeyRepeat` is on). */
export function isRepeatableAction(action: KeyAction | undefined): boolean {
  return action !== undefined && REPEATABLE_ACTIONS.has(action);
}

/** Long-press threshold (ms) before the accent-variants popup opens. */
export const LONG_PRESS_MS = 400;
/** Delay (ms) before auto-repeat begins while a repeatable key is held. */
export const KEY_REPEAT_DELAY_MS = 400;
/** Interval (ms) between auto-repeat fires once repeating. */
export const KEY_REPEAT_INTERVAL_MS = 50;

/** Human-readable names for action keys, used as an ARIA fallback. */
const ACTION_LABELS: Record<KeyAction, string> = {
  backspace: "Backspace",
  enter: "Enter",
  space: "Space",
  tab: "Tab",
  clear: "Clear",
  shift: "Shift",
  capslock: "Caps Lock",
  layer: "Symbols",
  "layout-switch": "Switch layout",
  hide: "Hide keyboard",
};

/**
 * Compute an accessible name for a key. Prefers an explicit `ariaLabel`, then a
 * humanized action label, then the emitted value (space is spelled out).
 */
export function keyAccessibleName(
  key: KeyDefinition,
  effectiveValue?: string
): string {
  if (key.ariaLabel) return key.ariaLabel;
  if (key.action) return ACTION_LABELS[key.action];
  const value = effectiveValue ?? key.key;
  if (value === " ") return "Space";
  return value;
}
