import { describe, expect, it } from "vitest";
import { BitMatrix } from "./bitmatrix";

describe("BitMatrix", () => {
  it("stores and reads bits by coordinate", () => {
    const matrix = new BitMatrix(4, 3);
    matrix.set(2, 1, true);
    expect(matrix.get(2, 1)).toBe(true);
    expect(matrix.get(1, 2)).toBe(false);
    expect(matrix.width).toBe(4);
    expect(matrix.height).toBe(3);
  });

  it("reads outside its bounds as light rather than throwing", () => {
    // Finder cross-checks walk off the edge routinely; a bounds exception there
    // would mean guarding every call site instead of one place.
    const matrix = BitMatrix.square(3);
    matrix.set(0, 0, true);
    expect(matrix.getSafe(-1, 0)).toBe(false);
    expect(matrix.getSafe(0, -1)).toBe(false);
    expect(matrix.getSafe(3, 0)).toBe(false);
    expect(matrix.getSafe(0, 3)).toBe(false);
    expect(matrix.getSafe(0, 0)).toBe(true);
  });

  it("reports `size` for a square matrix", () => {
    expect(BitMatrix.square(21).size).toBe(21);
  });

  it("rejects impossible dimensions and mismatched data", () => {
    expect(() => new BitMatrix(0, 5)).toThrow(RangeError);
    expect(() => new BitMatrix(5, -1)).toThrow(RangeError);
    expect(() => new BitMatrix(2.5, 4)).toThrow(RangeError);
    expect(() => new BitMatrix(3, 3, new Uint8Array(4))).toThrow(/must be 9 bytes/);
  });

  it("counts dark bits", () => {
    const matrix = BitMatrix.fromString("#.#\n..#\n###");
    expect(matrix.countDark()).toBe(6);
  });

  it("inverts every bit into a new matrix", () => {
    const matrix = BitMatrix.fromString("#.\n.#");
    const inverted = matrix.inverted();
    expect(inverted.toString()).toBe(".#\n#.");
    expect(matrix.toString()).toBe("#.\n.#"); // the original is untouched
  });

  it("transposes across the main diagonal", () => {
    const matrix = BitMatrix.fromString("##.\n...");
    expect(matrix.transposed().toString()).toBe("#.\n#.\n..");
    expect(matrix.transposed().width).toBe(2);
    expect(matrix.transposed().height).toBe(3);
  });

  it("round trips through its string form", () => {
    const text = "#..#\n.##.\n#..#";
    expect(BitMatrix.fromString(text).toString()).toBe(text);
  });

  it("accepts `1`/`0` as well as `#`/`.` in fixtures", () => {
    expect(BitMatrix.fromString("10\n01").toString()).toBe("#.\n.#");
  });

  it("rejects malformed fixture text", () => {
    expect(() => BitMatrix.fromString("")).toThrow(RangeError);
    expect(() => BitMatrix.fromString("##\n#")).toThrow(/Row 1 is 1 wide/);
  });
});
