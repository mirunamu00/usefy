import { createLayout } from "../engine/createLayout";
import { hangulComposer } from "../composer/hangul";
import type { KeyDefinition } from "../types";
import {
  BACKSPACE_KEY,
  ENTER_KEY,
  LAYER_KEY,
  SHIFT_KEY,
  SPACE_KEY,
} from "./qwerty";

/** Build a jamo char key with an optional symbol-layer glyph and Shift alternate. */
function jk(key: string, layerKey?: string, shiftKey?: string): KeyDefinition {
  const def: KeyDefinition = { key, type: "char" };
  if (layerKey !== undefined) def.layerKey = layerKey;
  if (shiftKey !== undefined) def.shiftKey = shiftKey;
  return def;
}

/**
 * Korean **두벌식 (dubeolsik)** layout, pre-wired with {@link hangulComposer}. The
 * five tense consonants (ㄲ ㄸ ㅃ ㅆ ㅉ) and the two tense vowels (ㅒ ㅖ) are typed
 * with Shift; a `?123` symbol layer and Shift/Backspace/Space/Enter behave as on
 * the Latin layouts. Because the layout carries a `composer`, the
 * {@link VirtualKeyboard} assembles jamo into syllable blocks and renders the
 * in-progress block underlined until it commits.
 *
 * @example
 * ```tsx
 * import { VirtualKeyboard } from "@usefy/virtual-keyboard";
 * import { hangulLayout } from "@usefy/virtual-keyboard/hangul";
 *
 * <VirtualKeyboard layouts={hangulLayout} />;
 * ```
 */
export const hangulLayout = createLayout({
  name: "hangul",
  label: "한글",
  composer: hangulComposer,
  rows: [
    [
      jk("ㅂ", "1", "ㅃ"),
      jk("ㅈ", "2", "ㅉ"),
      jk("ㄷ", "3", "ㄸ"),
      jk("ㄱ", "4", "ㄲ"),
      jk("ㅅ", "5", "ㅆ"),
      jk("ㅛ", "6"),
      jk("ㅕ", "7"),
      jk("ㅑ", "8"),
      jk("ㅐ", "9", "ㅒ"),
      jk("ㅔ", "0", "ㅖ"),
    ],
    [
      jk("ㅁ", "@"),
      jk("ㄴ", "#"),
      jk("ㅇ", "$"),
      jk("ㄹ", "_"),
      jk("ㅎ", "&"),
      jk("ㅗ", "-"),
      jk("ㅓ", "+"),
      jk("ㅏ", "("),
      jk("ㅣ", ")"),
    ],
    [
      SHIFT_KEY,
      jk("ㅋ", "*"),
      jk("ㅌ", '"'),
      jk("ㅊ", "'"),
      jk("ㅍ", ":"),
      jk("ㅠ", ";"),
      jk("ㅜ", "!"),
      jk("ㅡ", "?"),
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
