import type { RefObject } from "react";

/**
 * The set of DOM targets that {@link useKeyPress} can attach its keyboard
 * listeners to.
 *
 * - `undefined` (omitted) defaults to `window`.
 * - `null` disables the listener (useful for conditional targets).
 * - A `RefObject` is resolved lazily to its `.current` element.
 */
export type KeyPressEventTarget =
  | Window
  | Document
  | HTMLElement
  | RefObject<HTMLElement | null>
  | null
  | undefined;

/**
 * A predicate that receives the raw {@link KeyboardEvent} and returns whether
 * it should be considered a match. Use this for advanced matching logic that
 * cannot be expressed as a shortcut string.
 *
 * @example
 * ```tsx
 * // Match any digit key
 * useKeyPress((event) => /^[0-9]$/.test(event.key));
 * ```
 */
export type KeyPressPredicate = (event: KeyboardEvent) => boolean;

/**
 * Describes which key(s) {@link useKeyPress} should react to.
 *
 * - A **string** is a single binding. It may be a bare key (`"Escape"`,
 *   `"a"`, `"ArrowUp"`) or a modifier combination joined with `+`
 *   (`"ctrl+s"`, `"mod+shift+k"`).
 * - A **string array** is a list of **alternative** bindings — the hook
 *   matches if *any* of them is satisfied (logical OR). This is ideal for
 *   cross-platform shortcuts, e.g. `["ctrl+s", "meta+s"]`.
 * - A **predicate** gives full control over matching.
 *
 * @example
 * ```tsx
 * useKeyPress("Escape");                 // single key
 * useKeyPress("mod+k");                   // combination ("mod" = ctrl on Win/Linux, cmd on Mac)
 * useKeyPress(["ctrl+s", "meta+s"]);      // alternatives (OR)
 * useKeyPress((e) => e.key === "Enter");  // predicate
 * ```
 */
export type KeyPressTarget = string | string[] | KeyPressPredicate;

/**
 * Which keyboard event(s) drive the pressed state.
 *
 * - `"keydown"` — pressed becomes `true` on key down only (never resets on its own).
 * - `"keyup"` — reacts to key up only.
 * - `"both"` — tracks the full press/release lifecycle so the returned boolean
 *   reflects whether the key is *currently held*. This is the default.
 */
export type KeyPressEventType = "keydown" | "keyup" | "both";

/**
 * Whether shortcuts are matched against the logical key (`event.key`, which is
 * affected by keyboard layout and modifiers) or the physical key
 * (`event.code`, layout-independent — useful for WASD-style controls).
 */
export type KeyPressMatchBy = "key" | "code";

/**
 * Configuration options for {@link useKeyPress}.
 */
export interface UseKeyPressOptions {
  /**
   * The element the keyboard listeners are attached to.
   * Accepts `window`, `document`, an `HTMLElement`, or a React `RefObject`.
   * Pass `null` to temporarily detach.
   * @default window
   */
  target?: KeyPressEventTarget;

  /**
   * Which keyboard event(s) drive the returned pressed state.
   * @default "both"
   */
  eventType?: KeyPressEventType;

  /**
   * When `false`, no listeners are attached and the hook always reports `false`.
   * @default true
   */
  enabled?: boolean;

  /**
   * Call `event.preventDefault()` when the target matches.
   * Useful for overriding browser shortcuts such as `ctrl+s`.
   * @default false
   */
  preventDefault?: boolean;

  /**
   * Call `event.stopPropagation()` when the target matches.
   * @default false
   */
  stopPropagation?: boolean;

  /**
   * Ignore auto-repeated `keydown` events (fired while a key is held down)
   * when invoking {@link UseKeyPressOptions.onPress}. Does not affect the
   * returned boolean state.
   * @default true
   */
  ignoreRepeat?: boolean;

  /**
   * Ignore key events that originate from editable elements — `<input>`,
   * `<textarea>`, `<select>`, and `contenteditable` nodes. Essential for
   * app-level shortcuts that must not fire while the user is typing.
   * @default false
   */
  ignoreInputElements?: boolean;

  /**
   * Match keys case-sensitively. When `false`, `"a"` also matches `"A"`.
   * Only applies when {@link UseKeyPressOptions.matchBy} is `"key"`.
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Match against the logical key (`"key"`) or the physical key (`"code"`).
   * @default "key"
   */
  matchBy?: KeyPressMatchBy;

  /**
   * Require an exact modifier match for combinations. When `true`,
   * `"ctrl+s"` will **not** match `ctrl+shift+s` because an extra modifier is
   * held. When `false`, additional modifiers are permitted.
   * @default true
   */
  exactModifiers?: boolean;

  /**
   * Called when the target is matched on `keydown`, receiving the raw event.
   * This is the correct place to call `event.preventDefault()` manually.
   */
  onPress?: (event: KeyboardEvent) => void;

  /**
   * Called when a previously matched target is released on `keyup`.
   *
   * To keep `onPress`/`onRelease` balanced, this also fires once when the
   * window loses focus (`blur`) while the target was held — in that case it
   * receives a **synthetic** `keyup` event (no real key data), since the OS
   * never delivers a real `keyup`. It is **not** called when the hook is
   * disabled (`enabled: false`) or unmounted while pressed.
   */
  onRelease?: (event: KeyboardEvent) => void;
}

/**
 * A parsed representation of a single shortcut binding such as `"mod+shift+k"`.
 * Modifier requirements are resolved to concrete booleans; `"mod"` is expanded
 * to `metaKey` on Apple platforms and `ctrlKey` elsewhere.
 */
export interface ParsedShortcut {
  /** Whether the Ctrl modifier must be held. */
  ctrl: boolean;
  /** Whether the Shift modifier must be held. */
  shift: boolean;
  /** Whether the Alt/Option modifier must be held. */
  alt: boolean;
  /** Whether the Meta/Command modifier must be held. */
  meta: boolean;
  /**
   * The non-modifier key that must match, already normalized for
   * case-insensitive comparison when applicable. `null` for modifier-only
   * bindings such as `"shift"`.
   */
  key: string | null;
}
