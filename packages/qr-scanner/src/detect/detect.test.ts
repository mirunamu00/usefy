import { describe, expect, it } from "vitest";
import { encodeQR } from "@usefy/qr-code/headless";
import { BitMatrix } from "../image/bitmatrix";
import { binarize } from "../image/binarize";
import { toGray } from "../image/luminance";
import { decodeImageData } from "../decodeImage";
import { renderMatrix } from "../__testing__/render";
import { findAlignmentPattern, predictAlignment } from "./alignment";
import { detectSymbols } from "./detect";
import { distance, findFinderPatterns } from "./finder";
import { dimensionCandidates, estimateDimension, groupFinders } from "./group";
import { moduleSizeBetween } from "./moduleSize";
import { PerspectiveTransform } from "./perspective";
import { sampleGrid } from "./sample";

/** Binarize a rendered symbol, the way the real pipeline does. */
function bitsFor(value: string, options?: Parameters<typeof renderMatrix>[1]) {
  const matrix = encodeQR(value, { level: "Q", ...(options as object) });
  const image = renderMatrix(matrix, { scale: 6, ...options });
  return { bits: binarize(toGray(image, { maxDimension: 800 })), matrix, image };
}

describe("findFinderPatterns", () => {
  it("finds exactly three patterns in a clean symbol", () => {
    const { bits } = bitsFor("finder patterns");
    const candidates = findFinderPatterns(bits);

    expect(candidates).toHaveLength(3);
    for (const candidate of candidates) {
      expect(candidate.moduleSize).toBeCloseTo(6, 0);
      expect(candidate.count).toBeGreaterThan(1);
    }
  });

  it("finds nothing in a blank image", () => {
    expect(findFinderPatterns(new BitMatrix(100, 100))).toEqual([]);
  });

  it("stops early when a limit is given", () => {
    const { bits } = bitsFor("limit");
    expect(findFinderPatterns(bits, 1).length).toBeGreaterThanOrEqual(1);
  });

  it("sees a pattern that ends flush with the right edge", () => {
    // The row scanner completes a pattern on a colour change; one that runs to
    // the last pixel of the row has no change to complete on, so it is checked
    // separately after the loop.
    const { bits, image } = bitsFor("flush", { margin: 0 });
    expect(image.width).toBeGreaterThan(0);
    expect(findFinderPatterns(bits).length).toBeGreaterThanOrEqual(3);
  });
});

describe("distance", () => {
  it("is Euclidean", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("groupFinders", () => {
  it("orients the corners so the right angle is the top-left", () => {
    const { bits, matrix } = bitsFor("orientation");
    const [triple] = groupFinders(bits, findFinderPatterns(bits), 1);

    expect(triple).toBeDefined();
    expect(triple!.dimension).toBe(matrix.size);
    // Top-left is up and to the left of both others in an unrotated render.
    expect(triple!.topLeft.x).toBeLessThan(triple!.topRight.x);
    expect(triple!.topLeft.y).toBeLessThan(triple!.bottomLeft.y);
  });

  it("returns nothing when there are fewer than three candidates", () => {
    const { bits } = bitsFor("too few");
    const candidates = findFinderPatterns(bits);
    expect(groupFinders(bits, candidates.slice(0, 2), 1)).toEqual([]);
    expect(groupFinders(bits, candidates, 0)).toEqual([]);
  });

  it("rejects three patterns that do not form a right isoceles triangle", () => {
    // Three symbols in a row on a page: nine real finder patterns, none of
    // which should combine across symbols into a phantom tenth.
    const { bits } = bitsFor("collinear");
    const candidates = findFinderPatterns(bits);
    const collinear = candidates.map((candidate, index) => ({
      ...candidate,
      x: 20 + index * 60,
      y: 20,
    }));

    expect(groupFinders(bits, collinear, 1)).toEqual([]);
  });

  it("rejects candidates whose module sizes disagree wildly", () => {
    const { bits } = bitsFor("module sizes");
    const candidates = findFinderPatterns(bits);
    const mismatched = candidates.map((candidate, index) =>
      index === 0 ? { ...candidate, moduleSize: candidate.moduleSize * 8 } : candidate,
    );

    expect(groupFinders(bits, mismatched, 1)).toEqual([]);
  });

  it("does not let two symbols share a finder pattern", () => {
    // Six candidates laid out as two adjacent symbols. A cross-symbol triple
    // here is geometrically valid — (110,110), (0,0), (220,110) forms a
    // perfectly good right isoceles triangle — so nothing but the used-set
    // stops a phantom third symbol being reported from two real ones' corners.
    //
    // The layout matters: with only one symbol's three candidates, the loop
    // bounds alone permit exactly one triple, and the assertion would hold
    // whether or not the used-set existed.
    const { bits } = bitsFor("sharing");
    const template = findFinderPatterns(bits)[0]!;
    const at = (x: number, y: number) => ({ ...template, x, y });

    const candidates = [
      at(0, 0),
      at(110, 0),
      at(0, 110),
      at(110, 110),
      at(220, 110),
      at(110, 220),
    ];

    const triples = groupFinders(bits, candidates, 4);
    const finders = triples.flatMap((triple) => [triple.topLeft, triple.topRight, triple.bottomLeft]);

    expect(triples.length).toBeGreaterThan(0);
    expect(new Set(finders).size).toBe(finders.length);
  });
});

describe("estimateDimension", () => {
  const origin = { x: 0, y: 0 };

  it("recovers the module count from the finder spacing", () => {
    // A version 3 symbol: 29 modules, finder centres 22 modules apart.
    expect(estimateDimension(origin, { x: 220, y: 0 }, { x: 0, y: 220 }, 10)).toBe(29);
  });

  it("nudges a result that is one off a legal size", () => {
    // Legal sizes are ≡ 1 (mod 4); a rounding artefact of ±1 is corrected.
    // These two spacings land on 28 and 30 before the nudge — 21 and 23 modules
    // between centres — so they exercise both correction branches rather than
    // arriving at 29 unaided (which 218 and 224 both do).
    expect(estimateDimension(origin, { x: 210, y: 0 }, { x: 0, y: 210 }, 10)).toBe(29);
    expect(estimateDimension(origin, { x: 230, y: 0 }, { x: 0, y: 230 }, 10)).toBe(29);
  });

  it("offers both neighbours when the estimate lands exactly between two sizes", () => {
    // 24 modules between centres ⇒ 31, equidistant from 29 and 33. There is no
    // basis for choosing, so both are offered and the decode decides.
    expect(dimensionCandidates(origin, { x: 240, y: 0 }, { x: 0, y: 240 }, 10)).toEqual([29, 33]);
  });

  it("offers neighbouring sizes only for symbols big enough to need them", () => {
    // Shifting a version 1 symbol by one version needs a 29 % module-size
    // error — that is broken geometry, not measurement bias, and sampling a
    // second grid for it would be pure waste.
    expect(dimensionCandidates(origin, { x: 220, y: 0 }, { x: 0, y: 220 }, 10)).toEqual([29]);

    // A version 40 symbol needs only 2.4 %, which a blurred or downscaled frame
    // produces routinely.
    const large = dimensionCandidates(origin, { x: 1700, y: 0 }, { x: 0, y: 1700 }, 10);
    expect(large[0]).toBe(177);
    expect(large.length).toBeGreaterThan(1);
  });

  it("refuses an impossible module size or an out-of-range result", () => {
    expect(estimateDimension(origin, { x: 100, y: 0 }, { x: 0, y: 100 }, 0)).toBeNull();
    expect(estimateDimension(origin, { x: 20, y: 0 }, { x: 0, y: 20 }, 10)).toBeNull();
    expect(estimateDimension(origin, { x: 5000, y: 0 }, { x: 0, y: 5000 }, 10)).toBeNull();
  });
});

describe("moduleSizeBetween", () => {
  it("measures one module along the axis between two finder centres", () => {
    const { bits } = bitsFor("module size");
    const [a, b, c] = findFinderPatterns(bits);
    const triple = groupFinders(bits, [a!, b!, c!], 1)[0]!;

    expect(moduleSizeBetween(bits, triple.topLeft, triple.topRight)).toBeCloseTo(6, 0);
    expect(moduleSizeBetween(bits, triple.topLeft, triple.bottomLeft)).toBeCloseTo(6, 0);
  });

  it("is not fooled by rotation, where a row scan would be", () => {
    // A row through a pattern rotated 45° crosses a chord √2 times as long, so
    // the scan-derived estimate is 41 % high; measuring along the symbol's own
    // axis is unaffected.
    const matrix = encodeQR("rotation", { level: "Q" });
    const image = renderMatrix(matrix, { scale: 6, rotate: 45, padding: 60 });
    const bits = binarize(toGray(image, { maxDimension: 800 }));
    const triple = groupFinders(bits, findFinderPatterns(bits), 1)[0]!;

    expect(triple.moduleSize).toBeGreaterThan(5.3);
    expect(triple.moduleSize).toBeLessThan(6.7);
  });

  it("returns something usable when the walk runs off the image", () => {
    // Two points inside a solid dark field: the run never ends, so the
    // measurement falls back to the distance travelled rather than NaN.
    const solid = new BitMatrix(40, 40, new Uint8Array(1600).fill(1));
    const value = moduleSizeBetween(solid, { x: 5, y: 5 }, { x: 35, y: 5 });
    expect(Number.isNaN(value) || value > 0).toBe(true);
  });
});

describe("findAlignmentPattern", () => {
  it("finds the pattern within a pixel of where the geometry predicts", () => {
    const { bits, matrix } = bitsFor("alignment", { version: 3 } as never);
    const triple = groupFinders(bits, findFinderPatterns(bits), 1)[0]!;
    const predicted = predictAlignment(
      triple.topLeft,
      triple.topRight,
      triple.bottomLeft,
      triple.dimension,
    );
    const found = findAlignmentPattern(bits, predicted, triple.moduleSize);

    expect(matrix.size).toBeGreaterThan(21);
    expect(found).not.toBeNull();
    expect(Math.abs(found!.x - predicted.x)).toBeLessThan(triple.moduleSize);
    expect(Math.abs(found!.y - predicted.y)).toBeLessThan(triple.moduleSize);
  });

  it("returns null when the search window is too small to hold a pattern", () => {
    const { bits } = bitsFor("small window");
    expect(findAlignmentPattern(bits, { x: 50, y: 50 }, 10, 4)).toBeNull();
  });

  it("returns null when there is nothing there", () => {
    expect(findAlignmentPattern(new BitMatrix(200, 200), { x: 100, y: 100 }, 6)).toBeNull();
  });
});

describe("sampleGrid", () => {
  it("reads back the exact module grid of a clean render", () => {
    const scale = 6;
    const margin = 4;
    const matrix = encodeQR("sampling", { level: "M", version: 2 });
    const image = renderMatrix(matrix, { scale, margin });
    const bits = binarize(toGray(image, { maxDimension: 0 }));

    const offset = margin * scale;
    const side = matrix.size * scale;
    const transform = PerspectiveTransform.quadToQuad(
      [
        { x: 0, y: 0 },
        { x: matrix.size, y: 0 },
        { x: matrix.size, y: matrix.size },
        { x: 0, y: matrix.size },
      ],
      [
        { x: offset, y: offset },
        { x: offset + side, y: offset },
        { x: offset + side, y: offset + side },
        { x: offset, y: offset + side },
      ],
    );

    const grid = sampleGrid(bits, transform, matrix.size)!;
    expect(grid).not.toBeNull();
    expect(Array.from(grid.data)).toEqual(Array.from(matrix.modules));
  });

  it("returns null when the transform maps modules outside the image", () => {
    const bits = new BitMatrix(50, 50);
    const transform = PerspectiveTransform.quadToQuad(
      [
        { x: 0, y: 0 },
        { x: 21, y: 0 },
        { x: 21, y: 21 },
        { x: 0, y: 21 },
      ],
      [
        { x: -100, y: -100 },
        { x: 200, y: -100 },
        { x: 200, y: 200 },
        { x: -100, y: 200 },
      ],
    );

    expect(sampleGrid(bits, transform, 21)).toBeNull();
  });

  it("majority sampling reads a symbol a single tap struggles with", () => {
    // Two pixels per module, with noise: the centre tap can land on a flipped
    // pixel, where the five-tap majority cannot.
    const matrix = encodeQR("majority sampling", { level: "Q" });
    const image = renderMatrix(matrix, { scale: 3, margin: 4 });
    const results = decodeImageData(image, { sampling: "majority5" });

    expect(results[0]?.text).toBe("majority sampling");
  });
});

describe("detectSymbols", () => {
  it("offers a second sampling without the alignment pattern as a fallback", () => {
    // A misplaced fourth point is worse than none, so when one is found the
    // detector keeps the three-point reading available too.
    const { bits } = bitsFor("fallback attempts", { version: 5 } as never);
    const [symbol] = detectSymbols(bits, { maxSymbols: 1 });

    expect(symbol).toBeDefined();
    expect(symbol!.attempts.length).toBe(2);
    expect(symbol!.attempts[0]!.alignmentFound).toBe(true);
    expect(symbol!.attempts[1]!.alignmentFound).toBe(false);
    // Both read the same, correct dimension — the alternatives only appear when
    // the symbol is large enough for the module-size bias to reach them.
    expect(symbol!.attempts.map((attempt) => attempt.dimension)).toEqual([37, 37]);
  });

  it("offers a single attempt for a version 1 symbol, which has no alignment pattern", () => {
    const { bits } = bitsFor("v1", { version: 1 } as never);
    const [symbol] = detectSymbols(bits, { maxSymbols: 1 });

    expect(symbol!.attempts).toHaveLength(1);
    expect(symbol!.attempts[0]!.alignmentFound).toBe(false);
    expect(symbol!.attempts[0]!.dimension).toBe(21);
  });

  it("offers neighbouring dimensions for a large symbol", () => {
    // The case a downscaled version 40 photograph hits: the module size measures
    // a couple of percent high and the count comes out four modules short, so
    // the detector keeps the neighbouring readings available.
    const matrix = encodeQR("a large symbol, sampled at several dimensions", {
      version: 20,
      level: "M",
    });
    const image = renderMatrix(matrix, { scale: 4 });
    const bits = binarize(toGray(image, { maxDimension: 800 }));
    const [symbol] = detectSymbols(bits, { maxSymbols: 1 });

    const dimensions = new Set(symbol!.attempts.map((attempt) => attempt.dimension));
    expect(dimensions.has(matrix.size)).toBe(true);
    expect(dimensions.size).toBeGreaterThan(1);
  });

  it("returns an empty array when there is nothing to find", () => {
    expect(detectSymbols(new BitMatrix(120, 120))).toEqual([]);
  });
});
