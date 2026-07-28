import { describe, expect, it } from "vitest";
import { toGray, toSourcePoint } from "./luminance";

function image(width: number, height: number, fill: (x: number, y: number) => [number, number, number]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = fill(x, y);
      const index = (y * width + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }
  return { data, width, height, colorSpace: "srgb" } as ImageData;
}

describe("toGray", () => {
  it("uses BT.601 luma weights", () => {
    const gray = toGray(image(1, 1, () => [255, 0, 0]));
    expect(gray.data[0]).toBe(76); // 0.299 × 255

    expect(toGray(image(1, 1, () => [0, 255, 0])).data[0]).toBe(149); // 0.587
    expect(toGray(image(1, 1, () => [0, 0, 255])).data[0]).toBe(29); // 0.114
    // The three fixed-point weights sum to exactly 65536, so pure white maps to
    // 255 rather than drifting to 254 — worth pinning, because an off-by-one
    // there biases every threshold in the pipeline.
    expect(toGray(image(1, 1, () => [255, 255, 255])).data[0]).toBe(255);
  });

  it("passes the image through untouched when no cap or crop applies", () => {
    const gray = toGray(image(8, 4, (x) => [x * 30, x * 30, x * 30]));
    expect(gray.width).toBe(8);
    expect(gray.height).toBe(4);
    expect(gray.scale).toBe(1);
    expect(gray.offsetX).toBe(0);
  });

  it("box filters when downscaling rather than dropping rows", () => {
    // Alternating 1-px stripes: point sampling would return all-black or
    // all-white, while averaging returns the mid-grey that is actually there.
    const striped = image(64, 64, (x) => (x % 2 === 0 ? [0, 0, 0] : [255, 255, 255]));
    const gray = toGray(striped, { maxDimension: 16 });

    expect(gray.width).toBe(16);
    expect(gray.scale).toBeCloseTo(0.25, 6);
    for (let i = 0; i < gray.data.length; i++) {
      expect(gray.data[i]).toBeGreaterThan(100);
      expect(gray.data[i]).toBeLessThan(160);
    }
  });

  it("skips a reduction too small to pay for itself", () => {
    // Shrinking reads every source pixel, so a modest reduction costs more than
    // the cheaper analysis it buys — measured at 1.6× and 2.4× (see
    // `luminance.ts`). Below the threshold the frame is analysed at full
    // resolution, which is both faster and more accurate.
    const wide = image(1000, 600, () => [0, 0, 0]);

    const modest = toGray(wide, { maxDimension: 800 }); // 1.25× — not worth it
    expect(modest.width).toBe(1000);
    expect(modest.scale).toBe(1);

    const worthwhile = toGray(image(4000, 3000, () => [0, 0, 0]), { maxDimension: 800 }); // 5×
    expect(worthwhile.width).toBe(800);
    expect(worthwhile.scale).toBeCloseTo(0.2, 6);
  });

  it("weights source pixels by area, leaving a flat field flat", () => {
    // The test that justifies the area-weighted resampler over whole-pixel
    // averaging. At a non-integer ratio, counting whole pixels gives some
    // destination cells two source rows and their neighbours one; on a uniform
    // input that shows up as a periodic ripple, and on a QR symbol as module
    // edges that drift. A flat field must come out flat.
    const flat = image(270, 270, () => [128, 128, 128]);
    const gray = toGray(flat, { maxDimension: 200 }); // ratio 1.35, deliberately awkward

    let min = 255;
    let max = 0;
    for (const value of gray.data) {
      if (value < min) min = value;
      if (value > max) max = value;
    }
    expect(max - min).toBeLessThanOrEqual(1);
  });

  it("does not upscale a small image to meet the cap", () => {
    const gray = toGray(image(40, 30, () => [0, 0, 0]), { maxDimension: 800 });
    expect(gray.width).toBe(40);
    expect(gray.scale).toBe(1);
  });

  it("crops to a region and remembers where it came from", () => {
    const source = image(100, 100, (x, y) => (x >= 40 && y >= 30 ? [0, 0, 0] : [255, 255, 255]));
    const gray = toGray(source, { region: { x: 40, y: 30, width: 20, height: 20 } });

    expect(gray.width).toBe(20);
    expect(gray.offsetX).toBe(40);
    expect(gray.offsetY).toBe(30);
    expect(gray.data[0]).toBe(0);
  });

  it("clamps a region that runs outside the image", () => {
    const gray = toGray(image(50, 50, () => [10, 10, 10]), {
      region: { x: -20, y: 40, width: 200, height: 200 },
    });

    expect(gray.offsetX).toBe(0);
    expect(gray.offsetY).toBe(40);
    expect(gray.width).toBe(50);
    expect(gray.height).toBe(10);
  });

  it("reuses a supplied buffer when it is big enough", () => {
    const buffer = new Uint8ClampedArray(10_000);
    const gray = toGray(image(50, 50, () => [0, 0, 0]), { buffer });
    expect(gray.data.buffer).toBe(buffer.buffer);

    // Too small: a fresh buffer is allocated rather than truncating the image.
    const small = new Uint8ClampedArray(4);
    const second = toGray(image(50, 50, () => [0, 0, 0]), { buffer: small });
    expect(second.data.length).toBe(2500);
    expect(second.data.buffer).not.toBe(small.buffer);
  });

  it("combines a crop with a downscale", () => {
    const gray = toGray(image(400, 400, () => [128, 128, 128]), {
      region: { x: 100, y: 100, width: 200, height: 200 },
      maxDimension: 50,
    });

    expect(gray.width).toBe(50);
    expect(gray.offsetX).toBe(100);
    expect(gray.scale).toBeCloseTo(0.25, 6);
  });
});

describe("toSourcePoint", () => {
  it("undoes the crop and the scale", () => {
    const gray = toGray(image(400, 400, () => [0, 0, 0]), {
      region: { x: 100, y: 60, width: 200, height: 200 },
      maxDimension: 50,
    });

    expect(toSourcePoint(gray, 0, 0)).toEqual({ x: 100, y: 60 });
    expect(toSourcePoint(gray, 25, 25)).toEqual({ x: 200, y: 160 });
  });
});
