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
 * German **QWERTZ** layout — `Y` and `Z` swap (`Z` sits on the top row next to
 * `T`, `Y` moves to the bottom-left of the last letter row). Shift/Caps and the
 * `?123` symbol layer behave as on {@link qwertyLayout}; German umlauts and
 * eszett (ä, ö, ü, ß) are available as long-press variants.
 *
 * @example
 * ```tsx
 * import { VirtualKeyboard, qwertzLayout } from "@usefy/virtual-keyboard";
 * <VirtualKeyboard layouts={qwertzLayout} />;
 * ```
 */
export const qwertzLayout = createLayout({
  name: "qwertz",
  label: "QWERTZ",
  rows: [
    [
      ck("q", "1"),
      ck("w", "2"),
      ck("e", "3"),
      ck("r", "4"),
      ck("t", "5"),
      ck("z", "6"),
      ck("u", "7"),
      ck("i", "8"),
      ck("o", "9"),
      ck("p", "0"),
    ],
    [
      ck("a", "@"),
      ck("s", "#"),
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
      ck("y", "*"),
      ck("x", '"'),
      ck("c", "'"),
      ck("v", ":"),
      ck("b", ";"),
      ck("n", "!"),
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
