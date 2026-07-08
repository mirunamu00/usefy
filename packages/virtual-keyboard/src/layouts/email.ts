import { createLayout } from "../engine/createLayout";
import type { KeyDefinition } from "../types";
import { BACKSPACE_KEY, ENTER_KEY, SHIFT_KEY, SPACE_KEY } from "./qwerty";

function ck(key: string): KeyDefinition {
  return { key, type: "char" };
}

/**
 * An email-optimized QWERTY: no symbol layer, but dedicated `@` and `.com`
 * convenience keys on the bottom row for faster address entry.
 *
 * @example
 * ```tsx
 * import { VirtualKeyboard, emailLayout } from "@usefy/virtual-keyboard";
 * <VirtualKeyboard layouts={emailLayout} />;
 * ```
 */
export const emailLayout = createLayout({
  name: "email",
  label: "Email",
  rows: [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    [SHIFT_KEY, "z", "x", "c", "v", "b", "n", "m", BACKSPACE_KEY],
    [
      { key: "@", type: "char", width: 1.5 },
      ck("."),
      { key: ".com", label: ".com", type: "char", width: 1.5 },
      SPACE_KEY,
      ENTER_KEY,
    ],
  ],
});
