import type { ParsedChord, ParsedHotkey } from "./types";

/**
 * Detects whether the current runtime is a browser with DOM access.
 * Returns `false` during server-side rendering.
 */
export function isHotkeysSupported(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

const APPLE_PLATFORM_RE = /Mac|iPhone|iPod|iPad/i;

/**
 * Detects macOS/iOS so the `"mod"` alias can resolve to the Command (Meta) key
 * on Apple platforms and to Control everywhere else. SSR-safe (returns `false`
 * when `navigator` is unavailable).
 */
export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  // `navigator.platform` is deprecated but remains the most reliable
  // synchronous signal; prefer `userAgentData.platform` when present and fall
  // back to the user-agent string.
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ||
    navigator.platform ||
    "";
  const userAgent = navigator.userAgent || "";
  return APPLE_PLATFORM_RE.test(platform) || APPLE_PLATFORM_RE.test(userAgent);
}

/**
 * `event.key` values that represent modifier keys. A modifier-only `keydown`
 * neither starts a combo nor breaks an in-progress sequence.
 */
export const MODIFIER_KEY_NAMES = new Set(["Control", "Shift", "Alt", "Meta"]);

/**
 * Maps modifier aliases to their canonical modifier name. `"mod"` is resolved
 * against the current platform at parse time.
 */
const MODIFIER_TOKENS: Record<
  string,
  "ctrl" | "shift" | "alt" | "meta" | "mod"
> = {
  ctrl: "ctrl",
  control: "ctrl",
  ctl: "ctrl",
  shift: "shift",
  alt: "alt",
  option: "alt",
  opt: "alt",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  win: "meta",
  windows: "meta",
  super: "meta",
  mod: "mod",
};

/**
 * Friendly key aliases mapped to the lower-cased canonical `event.key` value
 * they should compare against.
 */
const KEY_ALIASES: Record<string, string> = {
  esc: "escape",
  escape: "escape",
  space: " ",
  spacebar: " ",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  arrowup: "arrowup",
  arrowdown: "arrowdown",
  arrowleft: "arrowleft",
  arrowright: "arrowright",
  enter: "enter",
  return: "enter",
  del: "delete",
  delete: "delete",
  ins: "insert",
  tab: "tab",
  backspace: "backspace",
  plus: "+",
};

/**
 * Splits a combo on `+` while treating a literal `+` key correctly
 * (`"ctrl++"` → `["ctrl", "+"]`, `"+"` → `["+"]`).
 */
function splitCombo(combo: string): string[] {
  const parts = combo.split("+");
  const tokens: string[] = [];
  for (const part of parts) {
    const token = part.trim();
    if (token === "") {
      if (tokens[tokens.length - 1] !== "+") {
        tokens.push("+");
      }
    } else {
      tokens.push(token);
    }
  }
  return tokens;
}

/**
 * Normalizes a non-modifier key token to its canonical, lower-cased comparison
 * form (resolving friendly aliases such as `esc` → `escape`).
 */
export function normalizeKeyToken(token: string): string {
  const lower = token.toLowerCase();
  return lower in KEY_ALIASES ? KEY_ALIASES[lower] : lower;
}

/**
 * Parses a single combo such as `"mod+shift+k"` into a {@link ParsedChord}.
 * The last non-modifier token wins as the key.
 *
 * @param combo - The combo string (no spaces).
 * @param mac - Whether `"mod"` should resolve to `meta` (Apple) instead of `ctrl`.
 */
export function parseCombo(combo: string, mac: boolean): ParsedChord {
  const chord: ParsedChord = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: "",
  };

  for (const token of splitCombo(combo)) {
    const modifier = MODIFIER_TOKENS[token.toLowerCase()];
    if (modifier) {
      if (modifier === "mod") {
        if (mac) {
          chord.meta = true;
        } else {
          chord.ctrl = true;
        }
      } else {
        chord[modifier] = true;
      }
      continue;
    }
    chord.key = normalizeKeyToken(token);
  }

  return chord;
}

/**
 * Parses a full hotkey string into a {@link ParsedHotkey}. Space-separated
 * combos become an ordered sequence; a single combo yields a length-1 sequence.
 *
 * @param hotkey - The hotkey string, e.g. `"mod+k"` or `"g i"`.
 * @param options - `mac` overrides `"mod"` resolution; defaults to platform detection.
 *
 * @example
 * ```ts
 * parseHotkey("mod+k", { mac: false });
 * // { raw: "mod+k", chords: [{ ctrl: true, shift: false, alt: false, meta: false, key: "k" }] }
 *
 * parseHotkey("g i");
 * // { raw: "g i", chords: [{ ...key: "g" }, { ...key: "i" }] }
 * ```
 */
export function parseHotkey(
  hotkey: string,
  options: { mac?: boolean } = {}
): ParsedHotkey {
  const mac = options.mac ?? isMacPlatform();
  const chords = hotkey
    .trim()
    .split(/\s+/)
    .filter((combo) => combo.length > 0)
    .map((combo) => parseCombo(combo, mac));
  return { raw: hotkey, chords };
}

/**
 * Derives a {@link ParsedChord} from a live keyboard event, capturing its
 * modifier state and normalized key.
 */
export function eventToChord(event: KeyboardEvent): ParsedChord {
  return {
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
    meta: event.metaKey,
    key: (event.key || "").toLowerCase(),
  };
}

/**
 * Returns `true` when an event-derived chord satisfies a parsed combo. Modifier
 * state must match **exactly** (e.g. plain `"a"` does not match `Ctrl+A`).
 */
export function chordMatches(eventChord: ParsedChord, combo: ParsedChord): boolean {
  return (
    eventChord.ctrl === combo.ctrl &&
    eventChord.shift === combo.shift &&
    eventChord.alt === combo.alt &&
    eventChord.meta === combo.meta &&
    combo.key !== "" &&
    eventChord.key === combo.key
  );
}

/**
 * Returns `true` if the event originated from an editable element — an
 * `<input>`, `<textarea>`, `<select>`, or `contenteditable` node. Used to
 * suppress hotkeys while the user is typing.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (target === null || typeof HTMLElement === "undefined") {
    return false;
  }
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }
  // `isContentEditable` can be `undefined` in some environments (e.g. jsdom);
  // coerce to a strict boolean.
  return target.isContentEditable === true;
}
