import { createLayout } from "../engine/createLayout";
import { BACKSPACE_KEY } from "./qwerty";

/**
 * A telephone keypad: digits plus `*`, `#`, and a `+` for international dialing.
 *
 * @example
 * ```tsx
 * import { VirtualKeyboard, phoneLayout } from "@usefy/virtual-keyboard";
 * <VirtualKeyboard layouts={phoneLayout} />;
 * ```
 */
export const phoneLayout = createLayout({
  name: "phone",
  label: "Phone",
  rows: [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
    ["+", BACKSPACE_KEY],
  ],
});
