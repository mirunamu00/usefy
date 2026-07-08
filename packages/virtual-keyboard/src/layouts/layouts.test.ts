import { describe, it, expect } from "vitest";
import { qwertyLayout } from "./qwerty";
import { numericLayout } from "./numeric";
import { phoneLayout } from "./phone";
import { emailLayout } from "./email";
import { resolveLayout } from "../engine/resolveLayout";

const NONE = { shift: false, capsLock: false, layer: false };

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
});
