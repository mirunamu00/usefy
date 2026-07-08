import type React from "react";

// ============================================================================
// Layout & key model (SPEC §4.1)
// ============================================================================

/**
 * A single key on the keyboard.
 *
 * @example
 * ```ts
 * // A simple character key.
 * const a: KeyDefinition = { key: "a" };
 *
 * // A shifted symbol key with a second (symbol layer) glyph.
 * const one: KeyDefinition = { key: "1", shiftKey: "!", layerKey: "!" };
 *
 * // An action key (Backspace) with an icon label.
 * const back: KeyDefinition = { key: "Backspace", label: "⌫", type: "action", action: "backspace", width: 1.5 };
 * ```
 */
export interface KeyDefinition {
  /** Value emitted / inserted when pressed (e.g. `"a"`, `" "`, `"Enter"`). */
  key: string;
  /** Display label; defaults to `key`. Can be a node (icon for action keys). */
  label?: React.ReactNode;
  /** Physical `KeyboardEvent.code` equivalent, for event synthesis & D-pad. */
  code?: string;
  /** Relative width in flex units (`1` = a standard key). */
  width?: number;
  /** Semantic type — drives styling and behavior. */
  type?: "char" | "action" | "modifier" | "spacer";
  /** For action/modifier keys, the built-in behavior to run. */
  action?: KeyAction;
  /** Value emitted when Shift is active (e.g. `"A"`, `"!"`). */
  shiftKey?: string;
  /** Value emitted on the symbol layer, if different. */
  layerKey?: string;
  /** For layout-switch keys: the target layout name. */
  targetLayout?: string;
  /** Long-press alternates (accents), e.g. `["à","á","â","ä"]`. */
  variants?: string[];
  /** Explicit ARIA label (falls back to a humanized `key`). */
  ariaLabel?: string;
  /** Disable this key. */
  disabled?: boolean;
}

/**
 * The set of built-in behaviors an action or modifier key can trigger.
 *
 * - `backspace` / `enter` / `space` / `tab` / `clear` — text editing actions.
 * - `shift` / `capslock` / `layer` — modifier toggles.
 * - `layout-switch` — swap to another registered layout ({@link KeyDefinition.targetLayout}).
 * - `hide` — dismiss the keyboard (component-level).
 */
export type KeyAction =
  | "backspace"
  | "enter"
  | "space"
  | "tab"
  | "clear"
  | "shift"
  | "capslock"
  | "layer"
  | "layout-switch"
  | "hide";

/**
 * A named, data-driven keyboard layout.
 *
 * @example
 * ```ts
 * const layout: KeyboardLayout = {
 *   name: "digits",
 *   rows: [[{ key: "1" }, { key: "2" }, { key: "3" }]],
 * };
 * ```
 */
export interface KeyboardLayout {
  /** Unique layout name (used by `layout-switch` keys). */
  name: string;
  /** Human label for the layout picker. */
  label?: string;
  /** Text direction. */
  direction?: "ltr" | "rtl";
  /** Rows of keys, top to bottom. */
  rows: KeyDefinition[][];
  /** Optional composer for IME layouts (default: {@link identityComposer}). */
  composer?: Composer;
}

/** Layout after modifier resolution — what the renderer draws. */
export interface ResolvedLayout {
  name: string;
  direction: "ltr" | "rtl";
  rows: ResolvedKey[][];
}

/** A {@link KeyDefinition} with modifier state resolved for rendering. */
export interface ResolvedKey extends KeyDefinition {
  /** The label to actually show given current modifiers. */
  displayLabel: React.ReactNode;
  /** The value that will be emitted given current modifiers. */
  effectiveValue: string;
  /** Whether this key is a currently-active modifier (for styling). */
  active?: boolean;
}

/**
 * A lightweight synthetic descriptor of a key press — deliberately **not** a
 * real `KeyboardEvent`, so it is SSR-safe and testable, but shaped familiarly.
 */
export interface VirtualKeyEvent {
  /** The value that was emitted for this press (post modifier resolution). */
  key: string;
  /** The physical code of the pressed key, if the definition supplied one. */
  code?: string;
  /** Whether Shift was active at press time. */
  shiftKey: boolean;
  /** Whether the symbol layer was active at press time. */
  layer: boolean;
}

/** The three modifier toggles the engine tracks. */
export interface KeyboardModifiers {
  shift: boolean;
  capsLock: boolean;
  layer: boolean;
}

// ============================================================================
// Composer (IME seam — interface in MVP, implementations later; SPEC §4.4)
// ============================================================================

/**
 * Transforms a raw key press into committed + composing text.
 *
 * The MVP ships {@link identityComposer} (a 1:1 pass-through). Future concrete
 * composers (Hangul 두벌식, etc.) will ship as opt-in subpath exports without a
 * breaking change to this interface.
 */
export interface Composer {
  /** Apply a key to the current composing buffer. */
  input(state: ComposerState, key: string): ComposerResult;
  /** Flush any pending composition (e.g. on space/enter). */
  flush(state: ComposerState): ComposerResult;
  /**
   * Delete the last unit of the pending composition (e.g. drop one jamo from a
   * Hangul block). Optional — when absent, Backspace on active composition falls
   * back to clearing the whole composing buffer. Commits nothing.
   */
  backspace?(state: ComposerState): ComposerResult;
  /** Produce a fresh, empty composer state. */
  reset(): ComposerState;
}

/** The composer's private working buffer. */
export interface ComposerState {
  buffer: string;
}

/** The outcome of a composer `input`/`flush` call. */
export interface ComposerResult {
  /** Text to commit into the value. */
  committed: string;
  /** Text still being composed (shown but not committed). */
  composing: string;
  /** The next composer state. */
  next: ComposerState;
}

// ============================================================================
// Headless hook API (SPEC §4.2)
// ============================================================================

/** Options for {@link useVirtualKeyboard}. */
export interface UseVirtualKeyboardOptions {
  /** Registered layouts (or a single layout). First is the initial layout. */
  layouts?: KeyboardLayout | KeyboardLayout[];
  /** Name of the initial layout (defaults to the first). */
  defaultLayout?: string;

  // --- value ownership (choose one style) ---
  /** Controlled string value. */
  value?: string;
  /** Uncontrolled seed value. */
  defaultValue?: string;
  /** Called whenever the value changes. */
  onChange?: (value: string) => void;

  // --- input binding ---
  /** Target input/textarea to write into (ref-bound mode). */
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;

  // --- behavior ---
  /** Maximum length of the value; inserts that would exceed it are ignored. */
  maxLength?: number;
  /** Per-key predicate; return `false` to reject an insertion. */
  keyFilter?: (key: string, nextValue: string) => boolean;
  /** Enter submits (fires {@link UseVirtualKeyboardOptions.onEnter}) instead of inserting a newline. */
  submitOnEnter?: boolean;
  /** Accessible label for the keyboard group (defaults to `"On-screen keyboard"`). */
  ariaLabel?: string;

  // --- callbacks ---
  /** Fired on every key press with the definition and a synthetic event. */
  onKeyPress?: (key: KeyDefinition, event: VirtualKeyEvent) => void;
  /** Fired when Enter is pressed while `submitOnEnter` is enabled. */
  onEnter?: (value: string) => void;
  /** Fired when the active layout changes. */
  onLayoutChange?: (name: string) => void;
}

/** Return value of {@link useVirtualKeyboard}. */
export interface UseVirtualKeyboardReturn {
  /** Current committed string value (controlled or internal; composition-free). */
  value: string;
  /**
   * The in-progress IME composition — the block being assembled but not yet
   * committed to {@link UseVirtualKeyboardReturn.value} (e.g. a forming Hangul
   * syllable). Empty unless the active layout has a {@link Composer}. Render it
   * appended to `value` (underlined) to show the pending composition.
   */
  composing: string;
  /** Current resolved layout to render. */
  layout: ResolvedLayout;
  /** All registered layout names. */
  layoutNames: string[];
  /** Active modifier state. */
  modifiers: KeyboardModifiers;

  // --- imperative controls (all useCallback-stable) ---
  /** Simulate pressing a key (what the UI calls on click). */
  press: (key: KeyDefinition) => void;
  /** Insert an arbitrary string at the caret. */
  insert: (text: string) => void;
  /** Delete the character before the caret (or the active selection). */
  backspace: () => void;
  /** Clear the entire value. */
  clear: () => void;
  /** Replace the entire value. */
  setValue: (value: string) => void;
  /** Switch to a registered layout by name. */
  setLayout: (name: string) => void;
  /** Toggle the one-shot Shift modifier. */
  toggleShift: () => void;
  /** Toggle the sticky Caps Lock modifier. */
  toggleCapsLock: () => void;

  // --- prop getters for custom UIs (a11y baked in) ---
  /** Props for the keyboard container element. */
  getKeyboardProps: () => React.HTMLAttributes<HTMLElement>;
  /** Props for a keyboard row element. */
  getRowProps: (rowIndex: number) => React.HTMLAttributes<HTMLElement>;
  /** Props (including `onClick`) for a resolved key's `<button>`. */
  getKeyProps: (
    key: ResolvedKey
  ) => React.ButtonHTMLAttributes<HTMLButtonElement>;
}
