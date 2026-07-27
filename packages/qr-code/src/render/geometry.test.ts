import { describe, expect, it } from "vitest";
import { buildModuleField, eyeOrigins, horizontalRuns, isEyeModule, logoBox } from "./geometry";
import { resolveStyle } from "./style";
import { encodeQR } from "../encode/encodeQR";
import { decodeField, decodeMatrix } from "../__testing__/decode";

describe("eyeOrigins / isEyeModule", () => {
  it("puts the three finders in the top-left, top-right and bottom-left corners", () => {
    expect(eyeOrigins(21)).toEqual([
      [0, 0],
      [14, 0],
      [0, 14],
    ]);
  });

  it("covers exactly 3 × 49 modules, and never the bottom-right corner", () => {
    const size = 25;
    let covered = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) if (isEyeModule(x, y, size)) covered++;
    }
    expect(covered).toBe(3 * 49);
    expect(isEyeModule(size - 1, size - 1, size)).toBe(false);
    // The separator ring sits outside the 7×7 box.
    expect(isEyeModule(7, 0, size)).toBe(false);
    expect(isEyeModule(6, 6, size)).toBe(true);
  });
});

describe("buildModuleField", () => {
  const matrix = encodeQR("https://usefy.dev/packages/qr-code", { level: "Q" });

  it("paints every dark module except the eyes", () => {
    const field = buildModuleField(matrix, resolveStyle());
    for (let y = 0; y < matrix.size; y++) {
      for (let x = 0; x < matrix.size; x++) {
        const expected = matrix.get(x, y) && !isEyeModule(x, y, matrix.size);
        expect(field.isDark(x, y)).toBe(expected);
      }
    }
  });

  it("reads out of range as light", () => {
    const field = buildModuleField(matrix, resolveStyle());
    expect(field.isDark(-1, 0)).toBe(false);
    expect(field.isDark(0, matrix.size)).toBe(false);
  });

  it("reports the padded side length", () => {
    expect(buildModuleField(matrix, resolveStyle({ margin: 2 })).side).toBe(matrix.size + 4);
    expect(buildModuleField(matrix, resolveStyle({ margin: 0 })).side).toBe(matrix.size);
  });

  it("does not excavate when there is no logo, or when excavate is off", () => {
    for (const style of [
      resolveStyle(),
      resolveStyle({ logo: { src: "a", size: 0.3, excavate: false } }),
    ]) {
      const field = buildModuleField(matrix, style);
      expect(field.excavated.every((value) => value === 0)).toBe(true);
    }
  });

  it("excavates a centred square whose size tracks the logo", () => {
    const small = buildModuleField(matrix, resolveStyle({ logo: { src: "a", size: 0.1 } }));
    const large = buildModuleField(matrix, resolveStyle({ logo: { src: "a", size: 0.3 } }));
    const count = (field: { excavated: Uint8Array }): number =>
      field.excavated.reduce((sum, value) => sum + value, 0);

    expect(count(small)).toBeGreaterThan(0);
    expect(count(large)).toBeGreaterThan(count(small));

    // Centred: the excavated modules are symmetric about the middle.
    const middle = Math.floor(matrix.size / 2);
    expect(large.excavated[middle * matrix.size + middle]).toBe(1);
    expect(large.excavated[0]).toBe(0);
  });

  it("excavates a disc for a circular logo, so corners survive", () => {
    const square = buildModuleField(matrix, resolveStyle({ logo: { src: "a", size: 0.3, shape: "square" } }));
    const circle = buildModuleField(matrix, resolveStyle({ logo: { src: "a", size: 0.3, shape: "circle" } }));
    const count = (field: { excavated: Uint8Array }): number =>
      field.excavated.reduce((sum, value) => sum + value, 0);
    // A disc inscribed in the same box covers roughly π/4 of it.
    expect(count(circle)).toBeLessThan(count(square));
    expect(count(circle)).toBeGreaterThan(count(square) * 0.6);
  });

  it("never leaves a finder pattern to the data layer, even under an oversized logo", () => {
    // The eyes are drawn separately and never excavated — they are what a
    // scanner uses to find the symbol at all.
    const tiny = encodeQR("A", { version: 1, level: "H" });
    const field = buildModuleField(tiny, resolveStyle({ logo: { src: "a", size: 0.35, padding: 0.1 } }));
    for (let y = 0; y < tiny.size; y++) {
      for (let x = 0; x < tiny.size; x++) {
        if (isEyeModule(x, y, tiny.size)) expect(field.isDark(x, y)).toBe(false);
      }
    }
  });

  it("still decodes with a logo excavated at the level's safe size", () => {
    // Level H absorbs ~30%; a 20% logo is comfortably inside that budget.
    const value = "https://usefy.dev/packages/qr-code";
    const high = encodeQR(value, { level: "H" });
    const field = buildModuleField(high, resolveStyle({ logo: { src: "a", size: 0.2 } }));
    expect(decodeField(high, field)).toBe(value);
    // Sanity: the same symbol without a logo decodes too.
    expect(decodeMatrix(high)).toBe(value);
  });
});

describe("logoBox", () => {
  const matrix = encodeQR("USEFY", { level: "H" });

  it("is null without a logo", () => {
    expect(logoBox(matrix, resolveStyle())).toBeNull();
  });

  it("centres the logo and grows the cleared area by the padding", () => {
    const style = resolveStyle({ margin: 4, logo: { src: "a", size: 0.2, padding: 0.05 } });
    const box = logoBox(matrix, style)!;
    const side = matrix.size + 8;

    expect(box.width).toBeCloseTo(side * 0.2, 10);
    expect(box.x + box.width / 2).toBeCloseTo(side / 2, 10);
    expect(box.y + box.height / 2).toBeCloseTo(side / 2, 10);
    expect(box.clear.width).toBeCloseTo(side * 0.3, 10);
    expect(box.clear.x + box.clear.width / 2).toBeCloseTo(side / 2, 10);
  });
});

describe("horizontalRuns", () => {
  it("merges each row's painted modules into maximal runs", () => {
    const field = {
      size: 5,
      isDark: (x: number, y: number) =>
        y === 0 ? x < 3 : y === 1 ? x === 1 || x === 3 : false,
    };
    expect(horizontalRuns(field as never)).toEqual([
      { y: 0, x: 0, length: 3 },
      { y: 1, x: 1, length: 1 },
      { y: 1, x: 3, length: 1 },
    ]);
  });

  it("covers exactly the painted modules of a real symbol", () => {
    const matrix = encodeQR("https://usefy.dev", { level: "M" });
    const field = buildModuleField(matrix, resolveStyle());
    const runs = horizontalRuns(field);
    const covered = runs.reduce((sum, run) => sum + run.length, 0);
    const painted = field.dark.reduce((sum, value) => sum + value, 0);
    expect(covered).toBe(painted);
    // Merging is worthwhile: far fewer runs than modules.
    expect(runs.length).toBeLessThan(painted);
  });
});
