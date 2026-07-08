import { resolveKey } from "./resolveLayout";
import type { KeyboardLayout, KeyDefinition } from "../types";

/**
 * Whether a key is a character key (the only kind whose position is shuffled).
 * Uses the same type inference as the resolver so untyped keys are classified
 * consistently.
 */
function isCharKey(key: KeyDefinition): boolean {
  return (
    resolveKey(key, { shift: false, capsLock: false, layer: false }).type ===
    "char"
  );
}

/**
 * Return a **new** layout with the positions of its `type: "char"` keys shuffled
 * (Fisher–Yates), leaving every action / modifier / spacer key exactly where it
 * was. Pure and seedable — pass a custom `rng` (returning `[0, 1)`) for
 * deterministic output, e.g. in tests or for a reproducible per-session pad.
 *
 * This backs the `randomize` prop for secure PIN pads: shuffling key positions
 * each mount frustrates positional shoulder-surfing / keyloggers (SPEC §10). The
 * emitted values are unchanged — only where each key sits moves.
 *
 * @param layout - The layout to shuffle (not mutated).
 * @param rng - A random source returning a float in `[0, 1)` (default `Math.random`).
 * @returns A new {@link KeyboardLayout} with char-key positions permuted.
 *
 * @example
 * ```ts
 * // Deterministic shuffle with a seeded RNG. Divide by 0x80000000 (2^31) so the
 * // value stays in [0, 1) — dividing by its own max could yield exactly 1.0,
 * // which would index out of bounds in the Fisher–Yates swap.
 * let seed = 42;
 * const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x80000000);
 * const shuffled = randomizeLayout(numericLayout, rng);
 * ```
 */
export function randomizeLayout(
  layout: KeyboardLayout,
  rng: () => number = Math.random
): KeyboardLayout {
  // Collect the char keys in reading order along with their (row, col) slots.
  const slots: Array<[number, number]> = [];
  const charKeys: KeyDefinition[] = [];
  layout.rows.forEach((row, r) => {
    row.forEach((key, c) => {
      if (isCharKey(key)) {
        slots.push([r, c]);
        charKeys.push(key);
      }
    });
  });

  // Fisher–Yates shuffle of the char keys.
  const shuffled = charKeys.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }

  // Rebuild rows, dropping the shuffled char keys back into the char slots.
  const rows = layout.rows.map((row) => row.slice());
  slots.forEach(([r, c], index) => {
    rows[r][c] = shuffled[index];
  });

  return { ...layout, rows };
}
