import type { RefObject } from "react";
import type {
  KeyPressEventTarget,
  KeyPressMatchBy,
  KeyPressTarget,
  ParsedShortcut,
} from "./types";

/**
 * Detects whether the current runtime is a browser with DOM access.
 * Returns `false` during server-side rendering.
 */
export function isKeyPressSupported(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

const APPLE_PLATFORM_RE = /Mac|iPhone|iPod|iPad/i;

/**
 * Detects Apple platforms so the `"mod"` alias can resolve to the Command
 * (Meta) key on macOS/iOS and to Control everywhere else. SSR-safe.
 */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  // `navigator.platform` is deprecated but remains the most reliable synchronous
  // signal; fall back to the user-agent string when it is unavailable.
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ||
    navigator.platform ||
    "";
  const userAgent = navigator.userAgent || "";
  return APPLE_PLATFORM_RE.test(platform) || APPLE_PLATFORM_RE.test(userAgent);
}

/**
 * Maps modifier aliases to their canonical modifier name. `"mod"` is resolved
 * later against the current platform.
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
 * Friendly aliases mapped to canonical `event.key` values (used when
 * `matchBy` is `"key"`).
 */
const KEY_ALIASES: Record<string, string> = {
  esc: "Escape",
  escape: "Escape",
  space: " ",
  spacebar: " ",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  enter: "Enter",
  return: "Enter",
  del: "Delete",
  delete: "Delete",
  ins: "Insert",
  tab: "Tab",
  backspace: "Backspace",
  plus: "+",
};

/**
 * Friendly aliases mapped to lower-cased `event.code` values (used when
 * `matchBy` is `"code"`).
 */
const CODE_ALIASES: Record<string, string> = {
  space: "space",
  esc: "escape",
  escape: "escape",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  enter: "enter",
  return: "enter",
};

/**
 * Splits a shortcut string on `+` while treating the literal `+` key
 * correctly (e.g. `"ctrl++"` → `["ctrl", "+"]`, `"+"` → `["+"]`).
 */
function splitShortcut(shortcut: string): string[] {
  const parts = shortcut.trim().split("+");
  const tokens: string[] = [];
  for (const part of parts) {
    const token = part.trim();
    if (token === "") {
      // An empty segment means the `+` character was itself a key, not a
      // separator. Collapse consecutive empties so we only add one.
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
 * Normalizes a non-modifier key token to the form it will be compared against
 * at match time.
 */
export function normalizeKeyToken(
  token: string,
  matchBy: KeyPressMatchBy,
  caseSensitive: boolean
): string {
  const lower = token.toLowerCase();

  if (matchBy === "code") {
    if (lower in CODE_ALIASES) {
      return CODE_ALIASES[lower];
    }
    // Allow bare letters/digits to map to their physical code, e.g.
    // "s" -> "keys", "1" -> "digit1".
    if (/^[a-z]$/.test(lower)) {
      return `key${lower}`;
    }
    if (/^[0-9]$/.test(lower)) {
      return `digit${lower}`;
    }
    return lower;
  }

  const canonical = lower in KEY_ALIASES ? KEY_ALIASES[lower] : token;
  return caseSensitive ? canonical : canonical.toLowerCase();
}

/**
 * Parses a single shortcut binding such as `"mod+shift+k"` into a
 * {@link ParsedShortcut}. The last non-modifier token wins as the key.
 *
 * @param shortcut - The shortcut string.
 * @param matchBy - Whether to match by logical key or physical code.
 * @param caseSensitive - Whether letter matching is case-sensitive (key mode only).
 */
export function parseShortcut(
  shortcut: string,
  matchBy: KeyPressMatchBy = "key",
  caseSensitive = false
): ParsedShortcut {
  const parsed: ParsedShortcut = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: null,
  };
  const apple = isApplePlatform();

  for (const token of splitShortcut(shortcut)) {
    const modifier = MODIFIER_TOKENS[token.toLowerCase()];
    if (modifier) {
      if (modifier === "mod") {
        if (apple) {
          parsed.meta = true;
        } else {
          parsed.ctrl = true;
        }
      } else {
        parsed[modifier] = true;
      }
      continue;
    }
    // Non-modifier token: the last one specified is the key to match.
    parsed.key = normalizeKeyToken(token, matchBy, caseSensitive);
  }

  return parsed;
}

/**
 * Extracts the comparable key string from a keyboard event.
 */
function getComparableEventKey(
  event: KeyboardEvent,
  matchBy: KeyPressMatchBy,
  caseSensitive: boolean
): string {
  if (matchBy === "code") {
    return event.code.toLowerCase();
  }
  return caseSensitive ? event.key : event.key.toLowerCase();
}

/**
 * Determines whether a keyboard event satisfies a parsed shortcut.
 *
 * @param event - The keyboard event.
 * @param parsed - The parsed shortcut to test against.
 * @param exactModifiers - When `true`, modifier state must match exactly.
 * @param matchBy - Whether to compare `event.key` or `event.code`.
 * @param caseSensitive - Whether letter matching is case-sensitive (key mode only).
 */
export function matchesShortcut(
  event: KeyboardEvent,
  parsed: ParsedShortcut,
  exactModifiers: boolean,
  matchBy: KeyPressMatchBy,
  caseSensitive: boolean
): boolean {
  if (exactModifiers) {
    if (
      event.ctrlKey !== parsed.ctrl ||
      event.shiftKey !== parsed.shift ||
      event.altKey !== parsed.alt ||
      event.metaKey !== parsed.meta
    ) {
      return false;
    }
  } else {
    if (
      (parsed.ctrl && !event.ctrlKey) ||
      (parsed.shift && !event.shiftKey) ||
      (parsed.alt && !event.altKey) ||
      (parsed.meta && !event.metaKey)
    ) {
      return false;
    }
  }

  // Modifier-only binding (e.g. "shift"): matched purely on modifier state.
  if (parsed.key === null) {
    return true;
  }

  return getComparableEventKey(event, matchBy, caseSensitive) === parsed.key;
}

/**
 * Builds a predicate from a {@link KeyPressTarget}. String and string-array
 * targets are pre-parsed once; a function target is used directly.
 *
 * @param target - The key(s) or predicate to match.
 * @param matchBy - Whether to compare `event.key` or `event.code`.
 * @param caseSensitive - Whether letter matching is case-sensitive (key mode only).
 * @param exactModifiers - Whether modifier state must match exactly.
 */
export function createMatcher(
  target: KeyPressTarget,
  matchBy: KeyPressMatchBy,
  caseSensitive: boolean,
  exactModifiers: boolean
): (event: KeyboardEvent) => boolean {
  if (typeof target === "function") {
    return target;
  }

  const shortcuts = (Array.isArray(target) ? target : [target]).map((binding) =>
    parseShortcut(binding, matchBy, caseSensitive)
  );

  return (event: KeyboardEvent) =>
    shortcuts.some((parsed) =>
      matchesShortcut(event, parsed, exactModifiers, matchBy, caseSensitive)
    );
}

/**
 * Returns `true` if the event originated from an editable element — an
 * `<input>`, `<textarea>`, `<select>`, or `contenteditable` node. Used to
 * suppress shortcuts while the user is typing.
 */
export function isEditableElement(target: EventTarget | null): boolean {
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
  // `isContentEditable` may be `undefined` in some environments (e.g. jsdom);
  // coerce to a strict boolean.
  return target.isContentEditable === true;
}

/**
 * Type guard for React `RefObject`s.
 */
function isRefObject(
  target: KeyPressEventTarget
): target is RefObject<HTMLElement | null> {
  return (
    target !== null &&
    target !== undefined &&
    typeof target === "object" &&
    "current" in target
  );
}

/**
 * Resolves a {@link KeyPressEventTarget} to a concrete event target, defaulting
 * to `window` when omitted and returning `null` when detached or unresolved.
 */
export function resolveTarget(
  target: KeyPressEventTarget
): Window | Document | HTMLElement | null {
  if (target === undefined) {
    return typeof window !== "undefined" ? window : null;
  }
  if (target === null) {
    return null;
  }
  if (isRefObject(target)) {
    return target.current;
  }
  return target;
}
