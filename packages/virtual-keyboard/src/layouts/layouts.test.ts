import { describe, it, expect } from "vitest";
import { qwertyLayout } from "./qwerty";
import { numericLayout } from "./numeric";
import { phoneLayout } from "./phone";
import { emailLayout } from "./email";
import { azertyLayout } from "./azerty";
import { qwertzLayout } from "./qwertz";
import { dvorakLayout } from "./dvorak";
import { colemakLayout } from "./colemak";
import { LATIN_VARIANTS, ck } from "./latin";
import { resolveLayout } from "../engine/resolveLayout";

const NONE = { shift: false, capsLock: false, layer: false };

/** The Latin-alphabet catalog should each expose the same 26 letters. */
const LATIN_CATALOG = [
  ["qwerty", qwertyLayout],
  ["azerty", azertyLayout],
  ["qwertz", qwertzLayout],
  ["dvorak", dvorakLayout],
  ["colemak", colemakLayout],
] as const;

describe("built-in layouts", () => {
  it("qwerty has letters, a shift, a layer, backspace and enter", () => {
    const flat = qwertyLayout.rows.flat();
    expect(qwertyLayout.name).toBe("qwerty");
    expect(flat.some((k) => k.key === "q")).toBe(true);
    expect(flat.some((k) => k.action === "shift")).toBe(true);
    expect(flat.some((k) => k.action === "layer")).toBe(true);
    expect(flat.some((k) => k.action === "backspace")).toBe(true);
    expect(flat.some((k) => k.action === "enter")).toBe(true);
  });

  it("qwerty resolves layer glyphs for the top row", () => {
    const layered = resolveLayout(qwertyLayout, { ...NONE, layer: true });
    // 'q' -> '1' on the symbol layer.
    expect(layered.rows[0][0].effectiveValue).toBe("1");
  });

  it("numeric is a digit pad with clear and backspace", () => {
    const flat = numericLayout.rows.flat();
    expect(flat.filter((k) => /^[0-9]$/.test(k.key))).toHaveLength(10);
    expect(flat.some((k) => k.action === "clear")).toBe(true);
  });

  it("phone includes *, # and +", () => {
    const keys = phoneLayout.rows.flat().map((k) => k.key);
    expect(keys).toContain("*");
    expect(keys).toContain("#");
    expect(keys).toContain("+");
  });

  it("email includes @ and .com convenience keys", () => {
    const keys = emailLayout.rows.flat().map((k) => k.key);
    expect(keys).toContain("@");
    expect(keys).toContain(".com");
  });

  it.each(LATIN_CATALOG)(
    "%s covers all 26 Latin letters exactly once",
    (_name, layout) => {
      const chars = layout.rows
        .flat()
        .filter((k) => k.type !== "modifier" && k.type !== "action" && !k.action)
        .map((k) => k.key)
        .filter((k) => /^[a-z]$/.test(k));
      const letters = new Set(chars);
      expect(chars).toHaveLength(26); // no duplicate letter keys
      expect(letters.size).toBe(26);
      for (const c of "abcdefghijklmnopqrstuvwxyz") {
        expect(letters.has(c)).toBe(true);
      }
    }
  );

  it.each(LATIN_CATALOG)(
    "%s has shift, layer, backspace, enter and a space",
    (name, layout) => {
      const flat = layout.rows.flat();
      expect(layout.name).toBe(name);
      expect(flat.some((k) => k.action === "shift")).toBe(true);
      expect(flat.some((k) => k.action === "layer")).toBe(true);
      expect(flat.some((k) => k.action === "backspace")).toBe(true);
      expect(flat.some((k) => k.action === "enter")).toBe(true);
      expect(flat.some((k) => k.action === "space")).toBe(true);
    }
  );

  /** Extract the char/letter keys of a row as a joined string. */
  const letterRow = (layout: (typeof LATIN_CATALOG)[number][1], row: number) =>
    layout.rows[row]
      .filter((k) => k.type === "char" && /^[a-z]$/.test(k.key))
      .map((k) => k.key)
      .join("");

  it("azerty arranges every letter row exactly (a/z on top, m on home)", () => {
    expect(letterRow(azertyLayout, 0)).toBe("azertyuiop");
    expect(letterRow(azertyLayout, 1)).toBe("qsdfghjklm");
    expect(letterRow(azertyLayout, 2)).toBe("wxcvbn");
  });

  it("qwertz arranges every letter row exactly (y/z swapped vs qwerty)", () => {
    expect(letterRow(qwertzLayout, 0)).toBe("qwertzuiop");
    expect(letterRow(qwertzLayout, 1)).toBe("asdfghjkl");
    expect(letterRow(qwertzLayout, 2)).toBe("yxcvbnm");
  });

  it("dvorak has the aoeuidhtns home row", () => {
    const home = dvorakLayout.rows[1]
      .filter((k) => k.type === "char")
      .map((k) => k.key)
      .join("");
    expect(home).toBe("aoeuidhtns");
  });

  it("colemak has the arstdhneio home row", () => {
    const home = colemakLayout.rows[1]
      .filter((k) => k.type === "char" && /^[a-z]$/.test(k.key))
      .map((k) => k.key)
      .join("");
    expect(home).toBe("arstdhneio");
  });

  it("Latin layouts resolve number glyphs on the symbol layer", () => {
    for (const [, layout] of LATIN_CATALOG) {
      const layered = resolveLayout(layout, { ...NONE, layer: true });
      expect(layered.rows[0][0].effectiveValue).toBe("1");
    }
  });

  it("ck auto-attaches accent variants for a base letter", () => {
    expect(ck("e").variants).toEqual(LATIN_VARIANTS.e);
    // A letter with no accents gets no variants array.
    expect(ck("q").variants).toBeUndefined();
    // An explicit empty list opts out of the auto-attached accents.
    expect(ck("e", undefined, []).variants).toBeUndefined();
  });
});
