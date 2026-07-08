import { createLayout } from "../engine/createLayout";
import { BACKSPACE_KEY } from "./qwerty";

/**
 * A 3×3 + zero numeric pad — ideal for PIN entry and numeric fields.
 *
 * @example
 * ```tsx
 * import { VirtualKeyboard, numericLayout } from "@usefy/virtual-keyboard";
 * <VirtualKeyboard layouts={numericLayout} maxLength={4} />;
 * ```
 */
export const numericLayout = createLayout({
  name: "numeric",
  label: "Numeric",
  rows: [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [{ key: "Clear", label: "clear", type: "action", action: "clear", ariaLabel: "Clear" }, "0", BACKSPACE_KEY],
  ],
});
