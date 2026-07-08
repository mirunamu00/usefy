import { createLayout } from "../engine/createLayout";
import type { KeyDefinition } from "../types";

/** Shared action keys reused across the Latin layouts. */
export const SHIFT_KEY: KeyDefinition = {
  key: "Shift",
  label: "⇧",
  type: "modifier",
  action: "shift",
  width: 1.5,
  ariaLabel: "Shift",
};

export const BACKSPACE_KEY: KeyDefinition = {
  key: "Backspace",
  label: "⌫",
  type: "action",
  action: "backspace",
  width: 1.5,
  ariaLabel: "Backspace",
};

export const LAYER_KEY: KeyDefinition = {
  key: "Layer",
  label: "?123",
  type: "modifier",
  action: "layer",
  width: 1.5,
  ariaLabel: "Symbols",
};

export const SPACE_KEY: KeyDefinition = {
  key: "Space",
  label: "space",
  type: "action",
  action: "space",
  width: 5,
  ariaLabel: "Space",
};

export const ENTER_KEY: KeyDefinition = {
  key: "Enter",
  label: "return",
  type: "action",
  action: "enter",
  width: 2,
  ariaLabel: "Enter",
};

/** Build a char key with an optional symbol-layer glyph and accent variants. */
function ck(
  key: string,
  layerKey?: string,
  variants?: string[]
): KeyDefinition {
  const def: KeyDefinition = { key, type: "char" };
  if (layerKey !== undefined) def.layerKey = layerKey;
  if (variants) def.variants = variants;
  return def;
}

/**
 * US-QWERTY layout with Shift/Caps uppercasing and a symbol layer (`?123`).
 * When the layer is active the letter rows emit numbers and common symbols via
 * each key's `layerKey`.
 *
 * @example
 * ```tsx
 * import { VirtualKeyboard, qwertyLayout } from "@usefy/virtual-keyboard";
 * <VirtualKeyboard layouts={qwertyLayout} />;
 * ```
 */
export const qwertyLayout = createLayout({
  name: "qwerty",
  label: "QWERTY",
  rows: [
    [
      ck("q", "1"),
      ck("w", "2"),
      ck("e", "3", ["é", "è", "ê", "ë", "ē", "ę"]),
      ck("r", "4"),
      ck("t", "5"),
      ck("y", "6", ["ý", "ÿ"]),
      ck("u", "7", ["ú", "ù", "û", "ü", "ū"]),
      ck("i", "8", ["í", "ì", "î", "ï", "ī"]),
      ck("o", "9", ["ó", "ò", "ô", "ö", "õ", "ø"]),
      ck("p", "0"),
    ],
    [
      ck("a", "@", ["à", "á", "â", "ä", "å", "æ", "ã"]),
      ck("s", "#", ["ß", "ś", "š"]),
      ck("d", "$"),
      ck("f", "_"),
      ck("g", "&"),
      ck("h", "-"),
      ck("j", "+"),
      ck("k", "("),
      ck("l", ")"),
    ],
    [
      SHIFT_KEY,
      ck("z", "*", ["ž", "ź", "ż"]),
      ck("x", '"'),
      ck("c", "'", ["ç", "ć", "č"]),
      ck("v", ":"),
      ck("b", ";"),
      ck("n", "!", ["ñ", "ń"]),
      ck("m", "?"),
      BACKSPACE_KEY,
    ],
    [
      LAYER_KEY,
      { key: ",", type: "char", layerKey: "<" },
      SPACE_KEY,
      { key: ".", type: "char", layerKey: ">" },
      ENTER_KEY,
    ],
  ],
});
