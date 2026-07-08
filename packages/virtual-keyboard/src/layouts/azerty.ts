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
 * French **AZERTY** layout — `A` and `Z` swap onto the top row, `M` moves up to
 * the home row, and the bottom letter row starts at `W`. Shift/Caps uppercase
 * and a `?123` symbol layer work exactly as on {@link qwertyLayout}; French
 * accents (é, è, à, ç, …) are available as long-press variants.
 *
 * @example
 * ```tsx
 * import { VirtualKeyboard, azertyLayout } from "@usefy/virtual-keyboard";
 * <VirtualKeyboard layouts={azertyLayout} />;
 * ```
 */
export const azertyLayout = createLayout({
  name: "azerty",
  label: "AZERTY",
  rows: [
    [
      ck("a", "1"),
      ck("z", "2"),
      ck("e", "3"),
      ck("r", "4"),
      ck("t", "5"),
      ck("y", "6"),
      ck("u", "7"),
      ck("i", "8"),
      ck("o", "9"),
      ck("p", "0"),
    ],
    [
      ck("q", "@"),
      ck("s", "#"),
      ck("d", "$"),
      ck("f", "_"),
      ck("g", "&"),
      ck("h", "-"),
      ck("j", "+"),
      ck("k", "("),
      ck("l", ")"),
      ck("m", "?"),
    ],
    [
      SHIFT_KEY,
      ck("w", "*"),
      ck("x", '"'),
      ck("c", "'"),
      ck("v", ":"),
      ck("b", ";"),
      ck("n", "!"),
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
