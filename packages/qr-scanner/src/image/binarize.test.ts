import { describe, expect, it } from "vitest";
import { binarize, globalBinarize, hybridBinarize, otsuThreshold } from "./binarize";
import { BitMatrix } from "./bitmatrix";
import type { GrayImage } from "../types";

function gray(width: number, height: number, fill: (x: number, y: number) => number): GrayImage {
  const data = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) data[y * width + x] = fill(x, y);
  }
  return { data, width, height, scale: 1, offsetX: 0, offsetY: 0 };
}

describe("otsuThreshold", () => {
  it("lands between two well-separated populations", () => {
    const image = gray(40, 40, (x) => (x < 20 ? 30 : 220));
    const threshold = otsuThreshold(image);
    expect(threshold).toBeGreaterThanOrEqual(30);
    expect(threshold).toBeLessThan(220);
  });

  it("handles a uniform image without dividing by zero", () => {
    expect(Number.isFinite(otsuThreshold(gray(10, 10, () => 128)))).toBe(true);
  });
});

describe("globalBinarize", () => {
  it("marks pixels at or below the threshold as dark", () => {
    const image = gray(4, 1, (x) => x * 60);
    const bits = globalBinarize(image, 60);
    expect(bits.get(0, 0)).toBe(true);
    expect(bits.get(1, 0)).toBe(true);
    expect(bits.get(2, 0)).toBe(false);
    expect(bits.get(3, 0)).toBe(false);
  });
});

describe("hybridBinarize", () => {
  it("separates ink from paper under a hard-edged shadow", () => {
    // Left half in shadow: its "white" (90) is darker than the right half's
    // "black" (120). No single cutoff can split those; a local one can.
    const image = gray(80, 80, (x, y) => {
      const ink = Math.floor(x / 4) % 2 === Math.floor(y / 4) % 2;
      if (x < 40) return ink ? 20 : 90;
      return ink ? 120 : 240;
    });

    const bits = hybridBinarize(image);
    // Sample the middle of a few known cells on both sides of the shadow.
    expect(bits.get(2, 2)).toBe(true); // dark cell, in shadow
    expect(bits.get(6, 2)).toBe(false); // light cell, in shadow
    expect(bits.get(42, 2)).toBe(true); // dark cell, lit
    expect(bits.get(46, 2)).toBe(false); // light cell, lit
  });

  it("does not shred a large uniform region into noise", () => {
    // A block with no edges has no meaningful midpoint of its own; treating it
    // as ink/paper at 50 % would fill the quiet zone with speckle.
    const image = gray(80, 80, (x, y) => (x < 20 && y < 20 ? 20 : 235));
    const bits = hybridBinarize(image);

    let darkOutside = 0;
    for (let y = 40; y < 80; y++) {
      for (let x = 40; x < 80; x++) if (bits.get(x, y)) darkOutside++;
    }
    expect(darkOutside).toBe(0);
  });
});

describe("binarize", () => {
  it("falls back to a global threshold for images too small to block up", () => {
    // Fewer than five blocks a side: "local" would just be a noisier global.
    const image = gray(20, 20, (x) => (x < 10 ? 10 : 250));
    const bits = binarize(image, "hybrid");
    expect(bits.get(2, 2)).toBe(true);
    expect(bits.get(15, 2)).toBe(false);
  });

  it("honours an explicit `otsu` choice", () => {
    const image = gray(100, 100, (x) => (x < 50 ? 10 : 250));
    expect(binarize(image, "otsu").get(2, 2)).toBe(true);
  });

  it("accepts a custom binarizer", () => {
    const image = gray(100, 100, () => 128);
    const custom = binarize(image, (source) => {
      const matrix = new BitMatrix(source.width, source.height);
      matrix.set(3, 4, true);
      return matrix;
    });

    expect(custom.get(3, 4)).toBe(true);
    expect(custom.countDark()).toBe(1);
  });
});
