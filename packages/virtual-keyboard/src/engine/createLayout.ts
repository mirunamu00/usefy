import type { Composer, KeyboardLayout, KeyDefinition } from "../types";

/** A key in a {@link createLayout} row: either a full definition or a shorthand string (a char key). */
export type KeyInput = string | KeyDefinition;

/** Configuration accepted by {@link createLayout}. */
export interface CreateLayoutConfig {
  /** Unique layout name (used by `layout-switch` keys). */
  name: string;
  /** Human label for the layout picker. */
  label?: string;
  /** Text direction (defaults to `"ltr"`). */
  direction?: "ltr" | "rtl";
  /**
   * Rows of keys, top to bottom. A bare string is expanded to a char key
   * (`"a"` → `{ key: "a", type: "char" }`), so simple layouts stay terse.
   */
  rows: KeyInput[][];
  /** Optional composer for IME layouts. */
  composer?: Composer;
}

function normalizeKey(input: KeyInput): KeyDefinition {
  if (typeof input === "string") {
    return { key: input, type: "char" };
  }
  return input;
}

/**
 * Authoring helper that builds a {@link KeyboardLayout} from a terse config,
 * expanding bare-string keys into char definitions and filling defaults.
 *
 * @example
 * ```ts
 * const layout = createLayout({
 *   name: "digits",
 *   rows: [
 *     ["1", "2", "3"],
 *     ["4", "5", "6"],
 *     ["7", "8", "9"],
 *     [{ key: "Backspace", label: "⌫", action: "backspace" }, "0"],
 *   ],
 * });
 * ```
 */
export function createLayout(config: CreateLayoutConfig): KeyboardLayout {
  return {
    name: config.name,
    label: config.label,
    direction: config.direction ?? "ltr",
    composer: config.composer,
    rows: config.rows.map((row) => row.map(normalizeKey)),
  };
}
