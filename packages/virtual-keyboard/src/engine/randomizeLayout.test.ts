import { describe, it, expect } from "vitest";
import { randomizeLayout } from "./randomizeLayout";
import { createLayout } from "./createLayout";
import { numericLayout } from "../layouts/numeric";

/** A tiny seeded LCG so tests are deterministic. Divides by 2^31 to stay in [0, 1). */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x80000000;
  };
}

const flatKeys = (rows: { key: string }[][]) => rows.flat().map((k) => k.key);

describe("randomizeLayout", () => {
  it("produces a deterministic permutation for a given seed", () => {
    const a = randomizeLayout(numericLayout, seededRng(1));
    const b = randomizeLayout(numericLayout, seededRng(1));
    expect(flatKeys(a.rows)).toEqual(flatKeys(b.rows));
  });

  it("different seeds generally produce different orders", () => {
    const a = randomizeLayout(numericLayout, seededRng(1));
    const b = randomizeLayout(numericLayout, seededRng(999));
    expect(flatKeys(a.rows)).not.toEqual(flatKeys(b.rows));
  });

  it("is a permutation of the char keys (same multiset)", () => {
    const shuffled = randomizeLayout(numericLayout, seededRng(7));
    const digits = (rows: { key: string; type?: string }[][]) =>
      rows
        .flat()
        .filter((k) => /^[0-9]$/.test(k.key))
        .map((k) => k.key)
        .sort();
    expect(digits(shuffled.rows)).toEqual(digits(numericLayout.rows));
  });

  it("leaves action / modifier keys in their original slots", () => {
    const layout = createLayout({
      name: "mix",
      rows: [
        ["1", "2", "3"],
        [{ key: "Shift", action: "shift" }, "4", { key: "Backspace", action: "backspace" }],
      ],
    });
    const shuffled = randomizeLayout(layout, seededRng(3));
    // Non-char slots keep their exact keys.
    expect(shuffled.rows[1][0].action).toBe("shift");
    expect(shuffled.rows[1][2].action).toBe("backspace");
    // Char slots still contain char keys only.
    for (const [r, c] of [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ] as const) {
      expect(shuffled.rows[r][c].type).toBe("char");
    }
  });

  it("does not mutate the source layout", () => {
    const before = flatKeys(numericLayout.rows);
    randomizeLayout(numericLayout, seededRng(5));
    expect(flatKeys(numericLayout.rows)).toEqual(before);
  });

  it("preserves layout metadata (name, direction, composer)", () => {
    const shuffled = randomizeLayout(numericLayout, seededRng(2));
    expect(shuffled.name).toBe(numericLayout.name);
    expect(shuffled.direction).toBe(numericLayout.direction);
  });

  it("handles a layout with no char keys without throwing", () => {
    const layout = createLayout({
      name: "actions",
      rows: [[{ key: "Enter", action: "enter" }]],
    });
    const shuffled = randomizeLayout(layout, seededRng(1));
    expect(shuffled.rows[0][0].action).toBe("enter");
  });
});
