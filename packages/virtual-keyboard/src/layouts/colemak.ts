import { createLayout } from "../engine/createLayout";
import { ck } from "./latin";
import {
  BACKSPACE_KEY,
  ENTER_KEY,
  LAYER_KEY,
  SHIFT_KEY,
  SPACE_KEY,
} from "./qwerty";

/**
 * **Colemak** layout — a modern ergonomic arrangement that keeps `QWERTY`'s
 * bottom-row muscle memory (`z x c v b`) while placing the most frequent letters
 * on the home row (`arstdhneio`). Shift/Caps and the `?123` symbol layer behave
 * as on {@link qwertyLayout}; vowel accents are available as long-press variants.
 *
 * @example
 * ```tsx
 * import { VirtualKeyboard, colemakLayout } from "@usefy/virtual-keyboard";
 * <VirtualKeyboard layouts={colemakLayout} />;
 * ```
 */
export const colemakLayout = createLayout({
  name: "colemak",
  label: "Colemak",
  rows: [
    [
      ck("q", "1"),
      ck("w", "2"),
      ck("f", "3"),
      ck("p", "4"),
      ck("g", "5"),
      ck("j", "6"),
      ck("l", "7"),
      ck("u", "8"),
      ck("y", "9"),
      { key: ";", type: "char", layerKey: "0" },
    ],
    [
      ck("a", "@"),
      ck("r", "#"),
      ck("s", "$"),
      ck("t", "_"),
      ck("d", "&"),
      ck("h", "-"),
      ck("n", "+"),
      ck("e", "("),
      ck("i", ")"),
      ck("o", "?"),
    ],
    [
      SHIFT_KEY,
      ck("z", "*"),
      ck("x", '"'),
      ck("c", "'"),
      ck("v", ":"),
      ck("b", ";"),
      ck("k", "!"),
      ck("m", "="),
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
