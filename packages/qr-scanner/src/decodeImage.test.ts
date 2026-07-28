import { describe, expect, it } from "vitest";
import { encodeQR } from "@usefy/qr-code/headless";
import { decodeImageData } from "./decodeImage";
import { seededRandom } from "./__testing__/fixtures";
import { detectSymbols } from "./detect/detect";
import { binarize } from "./image/binarize";
import { toGray } from "./image/luminance";
import {
  blur,
  compose,
  illuminate,
  invertImage,
  mirrorImage,
  noise,
  occlude,
  perspective,
  renderMatrix,
  shadow,
} from "./__testing__/render";

/**
 * The detection oracle (SPEC §7 step 2): symbols rendered by this package's own
 * counterpart encoder, then degraded deterministically. Every assertion is
 * exact — the payload is known because we encoded it — and every failure is
 * reproducible from its seed.
 */

const URL_VALUE = "https://usefy.dev/qr-scanner";

function decodeOne(image: ImageData, options = {}): string {
  const results = decodeImageData(image, options);
  expect(results.length, "expected exactly one symbol").toBe(1);
  return results[0]!.text;
}

describe("clean renderings", () => {
  it("reads a symbol at a range of module sizes", () => {
    for (const scale of [2, 3, 4, 6, 10, 16]) {
      const image = renderMatrix(encodeQR(URL_VALUE, { level: "M" }), { scale });
      expect(decodeOne(image), `${scale} px per module`).toBe(URL_VALUE);
    }
  });

  it("reads every version group", () => {
    for (const version of [1, 2, 7, 10, 15, 26, 27, 32, 40]) {
      const value = `v${version} payload ${"x".repeat(version * 2)}`;
      const image = renderMatrix(encodeQR(value, { version, level: "M" }), { scale: 4 });
      expect(decodeOne(image), `version ${version}`).toBe(value);
    }
  }, 30_000);

  it("reads a symbol with the minimum quiet zone, and without one", () => {
    const matrix = encodeQR(URL_VALUE, { level: "Q" });
    expect(decodeOne(renderMatrix(matrix, { scale: 5, margin: 4 }))).toBe(URL_VALUE);
    expect(decodeOne(renderMatrix(matrix, { scale: 5, margin: 2 }))).toBe(URL_VALUE);
    // No quiet zone at all is out of spec, but a scanner that gives up on it is
    // annoying in practice — the padding here stands in for the surrounding page.
    expect(decodeOne(renderMatrix(matrix, { scale: 5, margin: 1, padding: 20 }))).toBe(URL_VALUE);
  });

  it("reads low-contrast printing", () => {
    const matrix = encodeQR(URL_VALUE, { level: "M" });
    expect(decodeOne(renderMatrix(matrix, { scale: 6, dark: 90, light: 200 }))).toBe(URL_VALUE);
  });
});

describe("rotation", () => {
  it("reads a symbol at every 15° step through a full turn", () => {
    const matrix = encodeQR(URL_VALUE, { level: "Q" });
    const failures: number[] = [];

    for (let degrees = 0; degrees < 360; degrees += 15) {
      const image = renderMatrix(matrix, { scale: 6, rotate: degrees, padding: 60 });
      try {
        if (decodeImageData(image)[0]?.text !== URL_VALUE) failures.push(degrees);
      } catch {
        failures.push(degrees);
      }
    }

    expect(failures).toEqual([]);
  }, 60_000);
});

describe("perspective", () => {
  it("reads a symbol photographed at an angle", () => {
    const matrix = encodeQR(URL_VALUE, { level: "Q" });
    for (const strength of [0.1, 0.2, 0.3]) {
      const image = perspective(renderMatrix(matrix, { scale: 8, padding: 30 }), strength);
      expect(decodeOne(image), `strength ${strength}`).toBe(URL_VALUE);
    }
  }, 30_000);

  it("reads a flat symbol whose alignment pattern is destroyed, and says where the limit is", () => {
    // "Absence of an alignment pattern is not fatal" is a stated P0, so it gets
    // a test rather than an assumption — and the test records the boundary too,
    // because the honest version of that claim has a condition attached.
    const value = "the alignment pattern took the damage";
    const matrix = encodeQR(value, { version: 5, level: "H" });
    const scale = 8;
    const margin = 4;
    const rendered = renderMatrix(matrix, { scale, margin });

    // Version 5's alignment pattern is centred on module 30 of 37; a six-module
    // white blot removes it entirely (and takes some data with it, which level
    // H absorbs).
    const centre = (margin + 30) * scale;
    const blotted = occlude(rendered, centre - scale * 3, centre - scale * 3, scale * 6, scale * 6, 255);

    const detected = detectSymbols(binarize(toGray(blotted, { maxDimension: 800 })));
    expect(detected[0]!.attempts.every((attempt) => !attempt.alignmentFound)).toBe(true);
    expect(decodeImageData(blotted)[0]?.text).toBe(value);

    // …and the limit: with the fourth corner gone there is nothing to correct a
    // perspective against, so a warp that reads easily *with* the pattern does
    // not read without it. Both reference decoders behave the same way. Pinned
    // here so the claim above cannot quietly grow into "warps are fine too".
    expect(decodeImageData(perspective(blotted, 0.08))).toEqual([]);
    expect(decodeImageData(perspective(rendered, 0.08))[0]?.text).toBe(value);
  }, 30_000);

  it("uses the alignment pattern: a warped version 7 symbol still reads", () => {
    // Version 7 has three alignment patterns; without using one, a 25% warp
    // walks the sampler off the modules well before the far corner.
    const value = "alignment pattern carries the far corner of this symbol";
    const image = perspective(
      renderMatrix(encodeQR(value, { version: 7, level: "M" }), { scale: 8, padding: 40 }),
      0.25,
    );
    expect(decodeOne(image)).toBe(value);
  }, 30_000);
});

describe("photographic degradation", () => {
  it("reads through defocus", () => {
    const matrix = encodeQR(URL_VALUE, { level: "Q" });
    for (const radius of [1, 2, 3]) {
      const image = blur(renderMatrix(matrix, { scale: 8, padding: 20 }), radius);
      expect(decodeOne(image), `blur radius ${radius}`).toBe(URL_VALUE);
    }
  }, 30_000);

  it("reads through sensor noise", () => {
    const matrix = encodeQR(URL_VALUE, { level: "Q" });
    for (const amplitude of [20, 40, 60]) {
      const image = noise(renderMatrix(matrix, { scale: 6 }), amplitude, seededRandom(amplitude));
      expect(decodeOne(image), `noise ±${amplitude}`).toBe(URL_VALUE);
    }
  }, 30_000);

  it("reads through a steep illumination gradient", () => {
    const matrix = encodeQR(URL_VALUE, { level: "Q" });
    // 90 % of the brightness lost across the frame, diagonally.
    const image = illuminate(renderMatrix(matrix, { scale: 8, padding: 20 }), 0.9, 0.6);
    expect(decodeOne(image)).toBe(URL_VALUE);
  }, 30_000);

  it("reads a shadow a global threshold cannot", () => {
    // A hard-edged shadow, not a smooth ramp: the white paper under it is
    // darker than the black ink outside it, so no single cutoff can separate
    // them. This is the case the local binarizer exists for, and the assertion
    // is two-sided so the default cannot quietly stop earning its keep.
    const matrix = encodeQR(URL_VALUE, { level: "Q" });
    const image = shadow(renderMatrix(matrix, { scale: 8, padding: 20 }), 0.5, 0.35);

    expect(decodeOne(image)).toBe(URL_VALUE);
    expect(decodeImageData(image, { binarizer: "otsu" })).toEqual([]);
  }, 30_000);

  it("reads with damage inside the error-correction budget", () => {
    const matrix = encodeQR(URL_VALUE, { level: "H" });
    const rendered = renderMatrix(matrix, { scale: 8, margin: 4 });
    // A 12%-wide blot over the middle of the symbol: well inside level H's
    // 30% recovery capacity, and firmly outside the finder patterns.
    const size = Math.floor(rendered.width * 0.12);
    const image = occlude(
      rendered,
      Math.floor(rendered.width / 2 - size / 2),
      Math.floor(rendered.height / 2 - size / 2),
      size,
      size,
      40,
    );

    const results = decodeImageData(image);
    expect(results[0]?.text).toBe(URL_VALUE);
    expect(results[0]?.symbol?.errorsCorrected).toBeGreaterThan(0);
  }, 30_000);

  it("combines the lot: rotation, warp, blur, noise and a gradient", () => {
    const matrix = encodeQR(URL_VALUE, { level: "H" });
    let image = renderMatrix(matrix, { scale: 10, rotate: 12, padding: 60 });
    image = perspective(image, 0.12);
    image = blur(image, 1);
    image = illuminate(image, 0.4, 0.9);
    image = noise(image, 18, seededRandom(4242));

    expect(decodeOne(image)).toBe(URL_VALUE);
  }, 30_000);
});

describe("inverted and mirrored symbols", () => {
  it("reads a light-on-dark symbol", () => {
    const image = invertImage(renderMatrix(encodeQR(URL_VALUE, { level: "M" }), { scale: 6 }));
    const results = decodeImageData(image);

    expect(results[0]?.text).toBe(URL_VALUE);
    expect(results[0]?.symbol?.inverted).toBe(true);
  });

  it("skips the inverted pass when told to", () => {
    const image = invertImage(renderMatrix(encodeQR(URL_VALUE, { level: "M" }), { scale: 6 }));
    expect(decodeImageData(image, { invert: "never" })).toEqual([]);
  });

  it("reads a mirrored symbol and says so", () => {
    const image = mirrorImage(renderMatrix(encodeQR(URL_VALUE, { level: "M" }), { scale: 6 }));
    const results = decodeImageData(image);

    expect(results[0]?.text).toBe(URL_VALUE);
    expect(results[0]?.symbol?.mirrored).toBe(true);
  });
});

describe("geometry reported back to the caller", () => {
  it("puts the corners on the symbol, in source pixels", () => {
    const matrix = encodeQR(URL_VALUE, { level: "M" });
    const scale = 6;
    const margin = 4;
    const image = renderMatrix(matrix, { scale, margin });

    const [topLeft, topRight, bottomRight, bottomLeft] = decodeImageData(image)[0]!.corners;
    const expectedLow = margin * scale;
    const expectedHigh = (margin + matrix.size) * scale;
    const tolerance = scale * 1.5;

    expect(topLeft.x).toBeCloseTo(expectedLow, -1);
    expect(topLeft.y).toBeCloseTo(expectedLow, -1);
    expect(Math.abs(topRight.x - expectedHigh)).toBeLessThan(tolerance);
    expect(Math.abs(bottomRight.y - expectedHigh)).toBeLessThan(tolerance);
    expect(Math.abs(bottomLeft.x - expectedLow)).toBeLessThan(tolerance);
  });

  it("reports coordinates in the full source image when a region was scanned", () => {
    const matrix = encodeQR(URL_VALUE, { level: "M" });
    const symbol = renderMatrix(matrix, { scale: 5, margin: 4 });
    const framed = compose([symbol], [{ x: 300, y: 120 }], 700, 500);

    const result = decodeImageData(framed, {
      region: { x: 280, y: 100, width: symbol.width + 40, height: symbol.height + 40 },
    })[0]!;

    // Without the offset being added back, the corners would land near (20, 20).
    expect(result.corners[0].x).toBeGreaterThan(280);
    expect(result.corners[0].y).toBeGreaterThan(100);
    expect(result.center.x).toBeGreaterThan(300);
  });

  it("keeps coordinates in source pixels when the frame was downscaled", () => {
    const matrix = encodeQR(URL_VALUE, { level: "M" });
    const image = renderMatrix(matrix, { scale: 12, margin: 4 });
    expect(image.width).toBeGreaterThan(400);

    const result = decodeImageData(image, { maxDimension: 300 })[0]!;
    // Corners must describe the original image, not the 300px working copy.
    expect(result.corners[2].x).toBeGreaterThan(300);
  });
});

describe("multiple symbols in one frame", () => {
  it("decodes two symbols with distinct payloads and positions", () => {
    const left = renderMatrix(encodeQR("LEFT-SYMBOL", { level: "M" }), { scale: 5 });
    const right = renderMatrix(encodeQR("RIGHT-SYMBOL", { level: "M" }), { scale: 5 });
    const frame = compose(
      [left, right],
      [
        { x: 20, y: 40 },
        { x: 40 + left.width, y: 40 },
      ],
      left.width + right.width + 80,
      Math.max(left.height, right.height) + 80,
    );

    const results = decodeImageData(frame, { maxSymbols: 2 });
    expect(results.map((result) => result.text).sort()).toEqual(["LEFT-SYMBOL", "RIGHT-SYMBOL"]);
    expect(results[0]!.center.x).not.toBeCloseTo(results[1]!.center.x, 0);
  }, 30_000);

  it("returns only one when `maxSymbols` is the default", () => {
    const left = renderMatrix(encodeQR("LEFT-SYMBOL", { level: "M" }), { scale: 5 });
    const right = renderMatrix(encodeQR("RIGHT-SYMBOL", { level: "M" }), { scale: 5 });
    const frame = compose(
      [left, right],
      [
        { x: 20, y: 40 },
        { x: 40 + left.width, y: 40 },
      ],
      left.width + right.width + 80,
      Math.max(left.height, right.height) + 80,
    );

    expect(decodeImageData(frame)).toHaveLength(1);
  });
});

describe("images with nothing to find", () => {
  it("returns an empty array for a blank frame", () => {
    const blank = renderMatrix(encodeQR("x"), { scale: 1, margin: 0 });
    const empty: ImageData = {
      data: new Uint8ClampedArray(200 * 200 * 4).fill(255),
      width: 200,
      height: 200,
      colorSpace: "srgb",
    } as ImageData;

    expect(decodeImageData(empty)).toEqual([]);
    expect(blank.width).toBeGreaterThan(0); // the fixture itself is sane
  });

  it("returns an empty array for random noise", () => {
    const random = seededRandom(9);
    const data = new Uint8ClampedArray(240 * 240 * 4);
    for (let i = 0; i < data.length; i += 4) {
      const value = random() * 255;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }

    expect(decodeImageData({ data, width: 240, height: 240, colorSpace: "srgb" } as ImageData)).toEqual(
      [],
    );
  });

  it("does not mistake stripes and text-like rows for a symbol", () => {
    // Horizontal bars produce the 1:1:3:1:1 ratio on a row scan; the vertical
    // and diagonal cross-checks are what reject them.
    const width = 300;
    const height = 300;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    for (let y = 0; y < height; y++) {
      const dark = Math.floor(y / 7) % 2 === 0;
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const value = dark ? 0 : 255;
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = 255;
      }
    }

    expect(decodeImageData({ data, width, height, colorSpace: "srgb" } as ImageData)).toEqual([]);
  });
});
