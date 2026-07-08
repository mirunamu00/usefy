import { isModifierAction } from "../constants";
import type {
  KeyboardLayout,
  KeyboardModifiers,
  KeyDefinition,
  ResolvedKey,
  ResolvedLayout,
  VirtualKeyEvent,
} from "../types";

/** Whether a string is a single Latin letter (a–z / A–Z). */
function isAlpha(value: string): boolean {
  return value.length === 1 && /[a-zA-Z]/.test(value);
}

/** Infer a key's semantic type when it is not declared explicitly. */
function inferType(key: KeyDefinition): NonNullable<KeyDefinition["type"]> {
  if (key.type) return key.type;
  if (key.action) return isModifierAction(key.action) ? "modifier" : "action";
  return "char";
}

/** Whether a resolved/definition key is a currently-active modifier. */
function isActiveModifier(
  key: KeyDefinition,
  modifiers: KeyboardModifiers
): boolean {
  switch (key.action) {
    case "shift":
      return modifiers.shift;
    case "capslock":
      return modifiers.capsLock;
    case "layer":
      return modifiers.layer;
    default:
      return false;
  }
}

/**
 * Resolve a single key against the current modifier state, computing the value
 * it will emit ({@link ResolvedKey.effectiveValue}) and the label to render
 * ({@link ResolvedKey.displayLabel}).
 *
 * Resolution precedence for character keys:
 * 1. **Symbol layer** — when the layer is active and the key declares a
 *    `layerKey`, that value is used.
 * 2. **Shift** — the explicit `shiftKey`, or the uppercased letter.
 * 3. **Caps Lock** — uppercases Latin letters only.
 * 4. Otherwise the base `key`.
 *
 * Action and modifier keys always emit their base `key` unchanged.
 *
 * @example
 * ```ts
 * resolveKey({ key: "a" }, { shift: true, capsLock: false, layer: false }).effectiveValue; // "A"
 * resolveKey({ key: "1", layerKey: "!" }, { shift: false, capsLock: false, layer: true }).effectiveValue; // "!"
 * ```
 */
export function resolveKey(
  key: KeyDefinition,
  modifiers: KeyboardModifiers
): ResolvedKey {
  const type = inferType(key);

  let effectiveValue = key.key;
  if (type === "char") {
    if (modifiers.layer && key.layerKey !== undefined) {
      effectiveValue = key.layerKey;
    } else if (modifiers.shift) {
      effectiveValue =
        key.shiftKey ?? (isAlpha(key.key) ? key.key.toUpperCase() : key.key);
    } else if (modifiers.capsLock && isAlpha(key.key)) {
      effectiveValue = key.key.toUpperCase();
    }
  }

  const displayLabel =
    key.label !== undefined
      ? key.label
      : type === "char"
        ? effectiveValue
        : key.key;

  return {
    ...key,
    type,
    effectiveValue,
    displayLabel,
    active: isActiveModifier(key, modifiers),
  };
}

/**
 * Resolve an entire {@link KeyboardLayout} against the current modifiers into a
 * {@link ResolvedLayout} ready to render. Pure — the same inputs always produce
 * the same output, which makes it cheap to memoize on `(layout, modifiers)`.
 *
 * @example
 * ```ts
 * const resolved = resolveLayout(qwertyLayout, { shift: false, capsLock: true, layer: false });
 * resolved.rows[0][0].effectiveValue; // "Q"
 * ```
 */
export function resolveLayout(
  layout: KeyboardLayout,
  modifiers: KeyboardModifiers
): ResolvedLayout {
  return {
    name: layout.name,
    direction: layout.direction ?? "ltr",
    rows: layout.rows.map((row) => row.map((key) => resolveKey(key, modifiers))),
  };
}

/** Build the SSR-safe synthetic event describing a resolved key press. */
export function buildKeyEvent(
  key: ResolvedKey,
  modifiers: KeyboardModifiers
): VirtualKeyEvent {
  return {
    key: key.effectiveValue,
    code: key.code,
    shiftKey: modifiers.shift,
    layer: modifiers.layer,
  };
}
