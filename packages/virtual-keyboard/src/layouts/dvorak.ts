import { createLayout } from "../engine/createLayout";
import { ck } from "./latin";
import { BACKSPACE_KEY, ENTER_KEY, LAYER_KEY, SHIFT_KEY, SPACE_KEY } from "./qwerty";

/**
 * **Dvorak** simplified layout — vowels and the most common consonants sit on
 * the home row (`aoeuidhtns`) for reduced finger travel. The top row leads with
 * the apostrophe, comma and period. Shift/Caps and the `?123` symbol layer work
 * as on {@link qwertyLayout}; vowel accents are available as long-press variants.
 *
 * @example
 * ```tsx
 * import { VirtualKeyboard, dvorakLayout } from "@usefy/virtual-keyboard";
 * <VirtualKeyboard layouts={dvorakLayout} />;
 * ```
 */
export const dvorakLayout = createLayout({
  name: "dvorak",
  label: "Dvorak",
  rows: [
    [
      { key: "'", type: "char", layerKey: "1" },
      { key: ",", type: "char", layerKey: "2" },
      { key: ".", type: "char", layerKey: "3" },
      ck("p", "4"),
      ck("y", "5"),
      ck("f", "6"),
      ck("g", "7"),
      ck("c", "8"),
      ck("r", "9"),
      ck("l", "0"),
    ],
    [
      ck("a", "@"),
      ck("o", "#"),
      ck("e", "$"),
      ck("u", "_"),
      ck("i", "&"),
      ck("d", "-"),
      ck("h", "+"),
      ck("t", "("),
      ck("n", ")"),
      ck("s", "?"),
    ],
    [
      SHIFT_KEY,
      ck("q", "*"),
      ck("j", '"'),
      ck("k", ":"),
      ck("x", ";"),
      ck("b", "!"),
      ck("m", "="),
      ck("w", "/"),
      ck("v", "\\"),
      ck("z", "~"),
      BACKSPACE_KEY,
    ],
    [LAYER_KEY, SPACE_KEY, ENTER_KEY],
  ],
});
