import type { RefObject } from "react";

/**
 * A hotkey string. Either a single **combo** (modifier tokens joined with `+`
 * and a final key, e.g. `"mod+k"`, `"ctrl+shift+p"`, `"shift+?"`, `"Escape"`)
 * or a **sequence** of combos separated by spaces (e.g. `"g i"`, `"g g"`).
 *
 * Modifier tokens (case-insensitive): `ctrl`/`control`, `shift`, `alt`/`option`,
 * `meta`/`cmd`/`command`, and the cross-platform `mod` (Cmd on macOS, Ctrl
 * elsewhere). The final non-modifier token is the key, matched against
 * `KeyboardEvent.key` case-insensitively, with friendly aliases such as
 * `esc`→`Escape`, `space`→`" "`, and `up`/`down`/`left`/`right`→arrow keys.
 */
export type Hotkey = string;

/**
 * The DOM target the keyboard listener is attached to.
 *
 * - `undefined` (omitted) defaults to `document`.
 * - `null` disables the listener (useful for conditional targets).
 * - A `RefObject` is resolved lazily to its `.current` element.
 */
export type HotkeyTarget =
  | Window
  | Document
  | HTMLElement
  | RefObject<HTMLElement | null>
  | null
  | undefined;

/**
 * Details about the binding that matched, passed to the handler as its second
 * argument.
 */
export interface HotkeyMatch {
  /** The raw hotkey string that matched (as written by the caller). */
  hotkey: string;
  /**
   * The index of the matched binding within the `keys` array. `0` when a single
   * string was passed.
   */
  index: number;
  /** `true` when the matched binding was a multi-combo sequence (e.g. `"g i"`). */
  sequence: boolean;
}

/**
 * The user callback invoked when a bound hotkey fires. Receives the raw
 * {@link KeyboardEvent} (call `event.preventDefault()` here for manual control)
 * and a {@link HotkeyMatch} describing which binding matched.
 */
export type HotkeyHandler = (event: KeyboardEvent, match: HotkeyMatch) => void;

/**
 * A single parsed combo — one press of a key with a required modifier state.
 * `"mod"` has already been resolved to `ctrl` or `meta` for the current
 * platform.
 */
export interface ParsedChord {
  /** Whether the Ctrl modifier must be held. */
  ctrl: boolean;
  /** Whether the Shift modifier must be held. */
  shift: boolean;
  /** Whether the Alt/Option modifier must be held. */
  alt: boolean;
  /** Whether the Meta/Command modifier must be held. */
  meta: boolean;
  /**
   * The normalized (alias-resolved, lower-cased) key to match against
   * `event.key`. Empty string for a modifier-only combo (which never matches a
   * real key event).
   */
  key: string;
}

/**
 * A parsed hotkey binding: the original string plus its ordered list of combos.
 * A single combo produces a length-1 `chords` array; a sequence produces one
 * entry per space-separated combo.
 */
export interface ParsedHotkey {
  /** The original hotkey string as written by the caller. */
  raw: string;
  /** The ordered combos that make up this binding. */
  chords: ParsedChord[];
}

/**
 * Configuration options for {@link useHotkeys}.
 */
export interface UseHotkeysOptions {
  /**
   * When `false`, no listener is attached and no hotkey fires. Any in-progress
   * sequence buffer is cleared.
   * @default true
   */
  enabled?: boolean;

  /**
   * The element the keyboard listener is attached to. Accepts `document`,
   * `window`, an `HTMLElement`, or a React `RefObject`. Pass `null` to detach.
   * @default document
   */
  target?: HotkeyTarget;

  /**
   * Which keyboard event drives matching.
   * @default "keydown"
   */
  eventType?: "keydown" | "keyup";

  /**
   * By default hotkeys do **not** fire while an editable element is focused
   * (`<input>`, `<textarea>`, `<select>`, or a `contenteditable` node), so
   * typing in a form never triggers shortcuts. Set to `true` to allow hotkeys
   * to fire inside form fields as well.
   * @default false
   */
  enableOnFormTags?: boolean;

  /**
   * Call `event.preventDefault()` when a hotkey matches. Only affects matched
   * events (never every keystroke), so it is safe to enable for overriding
   * browser shortcuts such as `mod+s`.
   * @default false
   */
  preventDefault?: boolean;

  /**
   * How long (ms) the sequence buffer waits between combos before resetting.
   * Only relevant for space-separated sequence bindings like `"g i"`.
   * @default 1000
   */
  sequenceTimeoutMs?: number;

  /**
   * Override platform detection for the `mod` alias. When `true`, `mod`
   * resolves to `meta` (Cmd); when `false`, to `ctrl`. Leave undefined to
   * auto-detect from the user agent. Primarily useful for tests.
   * @default undefined (auto-detect)
   */
  mac?: boolean;
}
