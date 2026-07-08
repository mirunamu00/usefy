import { buildKeyEvent } from "./resolveLayout";
import type {
  KeyboardModifiers,
  ResolvedKey,
  VirtualKeyEvent,
} from "../types";

/** A caret/selection-aware editing snapshot. */
export interface EditState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

/** Behavior options that constrain an edit. */
export interface ApplyKeyOptions {
  /** Maximum length of the value; inserts that would exceed it are ignored. */
  maxLength?: number;
  /** Return `false` to reject an insertion. Receives the inserted text and the candidate value. */
  keyFilter?: (key: string, nextValue: string) => boolean;
  /** When true, Enter fires a submit instead of inserting a newline. */
  submitOnEnter?: boolean;
}

/** The result of applying a key to an {@link EditState}. */
export interface ApplyKeyResult {
  /** The value after the edit (unchanged when `changed` is false). */
  value: string;
  /** Caret/selection start after the edit. */
  selectionStart: number;
  /** Caret/selection end after the edit. */
  selectionEnd: number;
  /** Whether the value actually changed. */
  changed: boolean;
  /** Set when Enter fired as a submit (`submitOnEnter`). */
  submit: boolean;
  /** The synthetic event describing this press. */
  event: VirtualKeyEvent;
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/**
 * The number of UTF-16 code units to delete for a single "backspace" ending at
 * `index`. Removes a full surrogate pair (e.g. an emoji) as one unit.
 */
function backspaceUnits(value: string, index: number): number {
  if (index <= 0) return 0;
  const prev = value.charCodeAt(index - 1);
  // Low surrogate preceded by a high surrogate → delete both.
  if (prev >= 0xdc00 && prev <= 0xdfff && index >= 2) {
    const prev2 = value.charCodeAt(index - 2);
    if (prev2 >= 0xd800 && prev2 <= 0xdbff) return 2;
  }
  return 1;
}

/**
 * Apply a resolved key press to an editing snapshot, returning the next value
 * and caret position. Pure and DOM-free, so it is trivially unit-testable and
 * SSR-safe.
 *
 * Handles character insertion (respecting `maxLength` / `keyFilter`), Space,
 * Tab, Enter (newline or submit), Backspace (deletes the selection, else the
 * char before the caret), and Clear. Modifier / layout-switch / hide actions
 * are no-ops here (the hook handles those) and return `changed: false`.
 *
 * @example
 * ```ts
 * const key = resolveKey({ key: "a" }, mods);
 * applyKey(key, { value: "bc", selectionStart: 1, selectionEnd: 1 }, mods);
 * // → { value: "bac", selectionStart: 2, selectionEnd: 2, changed: true, ... }
 * ```
 */
export function applyKey(
  key: ResolvedKey,
  state: EditState,
  modifiers: KeyboardModifiers,
  options: ApplyKeyOptions = {}
): ApplyKeyResult {
  const event = buildKeyEvent(key, modifiers);
  const { value } = state;
  const len = value.length;
  const start = clamp(state.selectionStart, 0, len);
  const end = clamp(state.selectionEnd, start, len);
  const before = value.slice(0, start);
  const afterSelection = value.slice(end);

  const noChange: ApplyKeyResult = {
    value,
    selectionStart: start,
    selectionEnd: end,
    changed: false,
    submit: false,
    event,
  };

  const action = key.action;

  // Modifier / structural actions do not touch the value here.
  if (
    action === "shift" ||
    action === "capslock" ||
    action === "layer" ||
    action === "layout-switch" ||
    action === "hide"
  ) {
    return noChange;
  }

  if (action === "clear") {
    if (value === "") return noChange;
    return {
      value: "",
      selectionStart: 0,
      selectionEnd: 0,
      changed: true,
      submit: false,
      event,
    };
  }

  if (action === "enter" && options.submitOnEnter) {
    return { ...noChange, submit: true };
  }

  if (action === "backspace") {
    if (start !== end) {
      // Delete the active selection.
      const next = before + afterSelection;
      return {
        value: next,
        selectionStart: start,
        selectionEnd: start,
        changed: true,
        submit: false,
        event,
      };
    }
    if (start === 0) return noChange;
    const units = backspaceUnits(value, start);
    const caret = start - units;
    return {
      value: value.slice(0, caret) + afterSelection,
      selectionStart: caret,
      selectionEnd: caret,
      changed: true,
      submit: false,
      event,
    };
  }

  // Everything else inserts text: char keys, Space, Tab, Enter (newline).
  let text: string;
  if (action === "space") text = " ";
  else if (action === "tab") text = "\t";
  else if (action === "enter") text = "\n";
  else text = key.effectiveValue;

  if (text === "") return noChange;

  const candidate = before + text + afterSelection;

  if (options.maxLength !== undefined && candidate.length > options.maxLength) {
    return noChange;
  }
  if (options.keyFilter && !options.keyFilter(text, candidate)) {
    return noChange;
  }

  const caret = start + text.length;
  return {
    value: candidate,
    selectionStart: caret,
    selectionEnd: caret,
    changed: true,
    submit: false,
    event,
  };
}
