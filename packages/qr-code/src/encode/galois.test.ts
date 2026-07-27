import { describe, expect, it } from "vitest";
import { PRIMITIVE, gfDiv, gfExp, gfLog, gfMul, polyMul } from "./galois";

describe("GF(256)", () => {
  it("uses the QR primitive polynomial", () => {
    expect(PRIMITIVE).toBe(0x11d);
  });

  it("has a multiplicative group of order 255", () => {
    expect(gfExp(0)).toBe(1);
    expect(gfExp(255)).toBe(1);
    expect(gfExp(1)).toBe(2);
    expect(gfExp(8)).toBe(0x1d); // α^8 = the primitive polynomial's tail
  });

  it("round-trips exp and log for every non-zero element", () => {
    for (let i = 1; i < 256; i++) {
      expect(gfExp(gfLog(i))).toBe(i);
    }
  });

  it("multiplies as a field: absorbing zero, identity, commutativity", () => {
    expect(gfMul(0, 123)).toBe(0);
    expect(gfMul(123, 0)).toBe(0);
    for (let a = 1; a < 256; a += 7) {
      expect(gfMul(a, 1)).toBe(a);
      for (let b = 1; b < 256; b += 13) {
        expect(gfMul(a, b)).toBe(gfMul(b, a));
        expect(gfDiv(gfMul(a, b), b)).toBe(a);
      }
    }
  });

  it("divides, including the zero numerator", () => {
    expect(gfDiv(0, 5)).toBe(0);
    expect(gfDiv(5, 5)).toBe(1);
    expect(() => gfDiv(5, 0)).toThrow(RangeError);
  });

  it("multiplies polynomials, skipping zero coefficients", () => {
    // (x + 1)(x + 1) = x² + 2x + 1 → x² + 1 in a binary field.
    expect(Array.from(polyMul(new Uint8Array([1, 1]), new Uint8Array([1, 1])))).toEqual([1, 0, 1]);
    // A leading zero coefficient must not corrupt the result.
    expect(Array.from(polyMul(new Uint8Array([0, 1]), new Uint8Array([1])))).toEqual([0, 1]);
  });
});
