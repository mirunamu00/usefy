import { describe, it, expect } from "vitest";
import { hangulLayout } from "./hangul";
import { hangulComposer } from "../composer/hangul";
import { resolveLayout } from "../engine/resolveLayout";

const NONE = { shift: false, capsLock: false, layer: false };

describe("hangulLayout", () => {
  it("is named 'hangul' and carries the Hangul composer", () => {
    expect(hangulLayout.name).toBe("hangul");
    expect(hangulLayout.label).toBe("한글");
    expect(hangulLayout.composer).toBe(hangulComposer);
  });

  it("emits jamo and the standard action keys", () => {
    const flat = hangulLayout.rows.flat();
    const chars = flat.filter((k) => k.type === "char").map((k) => k.key);
    // A representative sample of the 두벌식 jamo set.
    for (const jamo of ["ㅂ", "ㅈ", "ㄱ", "ㅁ", "ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅣ"]) {
      expect(chars).toContain(jamo);
    }
    expect(flat.some((k) => k.action === "shift")).toBe(true);
    expect(flat.some((k) => k.action === "backspace")).toBe(true);
    expect(flat.some((k) => k.action === "space")).toBe(true);
    expect(flat.some((k) => k.action === "enter")).toBe(true);
    expect(flat.some((k) => k.action === "layer")).toBe(true);
  });

  it("resolves tense consonants under Shift (ㄱ → ㄲ)", () => {
    const shifted = resolveLayout(hangulLayout, { ...NONE, shift: true });
    const gg = shifted.rows
      .flat()
      .find((k) => k.key === "ㄱ" && k.type === "char");
    expect(gg?.effectiveValue).toBe("ㄲ");
  });

  it("resolves the number layer on the top row", () => {
    const layered = resolveLayout(hangulLayout, { ...NONE, layer: true });
    expect(layered.rows[0][0].effectiveValue).toBe("1");
  });
});
