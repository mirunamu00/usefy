import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { encodeQR } from "@usefy/qr-code/headless";
import { decodeImageData } from "./decodeImage";
import { seededRandom } from "./__testing__/fixtures";
import {
  blur,
  illuminate,
  invertImage,
  mirrorImage,
  noise,
  perspective,
  renderMatrix,
  shadow,
} from "./__testing__/render";

/**
 * Interoperability: reading symbols this ecosystem did **not** produce, and
 * measuring recall against an independent decoder (SPEC §7 step 3).
 *
 * The oracle everywhere else is `@usefy/qr-code`, which is the right tool for
 * exactness — it knows the payload. But it shares this package's understanding
 * of ISO/IEC 18004 by construction, so agreeing with it proves the two halves
 * are consistent, not that either is *correct*. These two checks close that:
 *
 * 1. **A different encoder.** `node-qrcode` (19 M weekly downloads, an entirely
 *    separate implementation) generates the symbols; ours reads them. Every
 *    mask, every version group, every mode.
 * 2. **A different decoder.** `jsQR` reads the same degraded corpus ours does,
 *    and the recall claim in SPEC §10 — "a superset of jsQR's successes" — is
 *    measured rather than asserted.
 */

/** Render a `node-qrcode` symbol into an `ImageData` this package can read. */
async function foreignSymbol(
  value: string,
  options: Parameters<typeof QRCode.create>[1] & { scale?: number; margin?: number } = {},
): Promise<{ image: ImageData; version: number }> {
  const scale = options.scale ?? 6;
  const margin = options.margin ?? 4;
  const symbol = QRCode.create(value, options);
  const size = symbol.modules.size;
  const data = symbol.modules.data;

  const side = (size + margin * 2) * scale;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!data[y * size + x]) continue;
      const px = (x + margin) * scale;
      const py = (y + margin) * scale;
      for (let dy = 0; dy < scale; dy++) {
        let index = ((py + dy) * side + px) * 4;
        for (let dx = 0; dx < scale; dx++) {
          pixels[index] = 0;
          pixels[index + 1] = 0;
          pixels[index + 2] = 0;
          index += 4;
        }
      }
    }
  }

  return {
    image: { data: pixels, width: side, height: side, colorSpace: "srgb" } as ImageData,
    version: symbol.version,
  };
}

describe("symbols from a different encoder", () => {
  it("reads node-qrcode output across the version groups and levels", async () => {
    const failures: string[] = [];

    for (const version of [1, 5, 9, 10, 20, 26, 27, 33, 40]) {
      for (const errorCorrectionLevel of ["L", "M", "Q", "H"] as const) {
        // Version 1 at level H holds 9 data codewords, so the payload has to
        // stay short enough for the tightest symbol in the sweep.
        const value =
          version === 1 ? `v1-${errorCorrectionLevel}` : `interop v${version} ${"x".repeat(version)}`;
        const { image, version: actual } = await foreignSymbol(value, {
          version,
          errorCorrectionLevel,
          scale: 5,
        });

        const results = decodeImageData(image);
        if (results[0]?.text !== value) {
          failures.push(`v${version}-${errorCorrectionLevel}: not decoded`);
        } else if (results[0]!.symbol?.version !== actual) {
          failures.push(`v${version}-${errorCorrectionLevel}: version mismatch`);
        }
      }
    }

    expect(failures).toEqual([]);
  }, 120_000);

  it("reads every mask pattern chosen by a different encoder", async () => {
    const masks = [0, 1, 2, 3, 4, 5, 6, 7] as const;
    for (const maskPattern of masks) {
      const value = `foreign mask ${maskPattern}`;
      const { image } = await foreignSymbol(value, { maskPattern, errorCorrectionLevel: "Q" });
      const results = decodeImageData(image);

      expect(results[0]?.text, `mask ${maskPattern}`).toBe(value);
      expect(results[0]?.symbol?.mask).toBe(maskPattern);
    }
  }, 30_000);

  it("reads numeric, alphanumeric, byte and mixed payloads from a different encoder", async () => {
    for (const value of [
      "8675309",
      "HELLO WORLD $%*+-./:",
      "https://usefy.dev/qr-scanner?x=1&y=2",
      "ORDER 12345 — 안녕하세요",
    ]) {
      const { image } = await foreignSymbol(value, { errorCorrectionLevel: "M" });
      expect(decodeImageData(image)[0]?.text, value).toBe(value);
    }
  }, 30_000);

  it("reads a degraded symbol from a different encoder", async () => {
    const value = "a foreign symbol, photographed badly";
    const { image } = await foreignSymbol(value, { errorCorrectionLevel: "H", scale: 8 });

    let degraded = perspective(image, 0.12);
    degraded = blur(degraded, 1);
    degraded = illuminate(degraded, 0.5, 0.8);
    degraded = noise(degraded, 16, seededRandom(31337));

    expect(decodeImageData(degraded)[0]?.text).toBe(value);
  }, 30_000);
});

describe("recall against an independent decoder", () => {
  /**
   * The corpus SPEC §10 measures against. Each entry is a named degradation of
   * the same symbol, built deterministically so the comparison is stable.
   */
  function corpus(): Array<{ name: string; image: ImageData }> {
    const value = "https://usefy.dev/qr-scanner";
    const matrix = encodeQR(value, { level: "Q" });
    const base = renderMatrix(matrix, { scale: 8, padding: 24 });

    return [
      { name: "clean", image: base },
      { name: "small modules", image: renderMatrix(matrix, { scale: 2 }) },
      { name: "rotated 15°", image: renderMatrix(matrix, { scale: 6, rotate: 15, padding: 60 }) },
      { name: "rotated 45°", image: renderMatrix(matrix, { scale: 6, rotate: 45, padding: 60 }) },
      { name: "rotated 75°", image: renderMatrix(matrix, { scale: 6, rotate: 75, padding: 60 }) },
      { name: "perspective 0.2", image: perspective(base, 0.2) },
      { name: "perspective 0.3", image: perspective(base, 0.3) },
      { name: "blur 2", image: blur(base, 2) },
      { name: "blur 3", image: blur(base, 3) },
      { name: "noise 60", image: noise(base, 60, seededRandom(7)) },
      { name: "gradient", image: illuminate(base, 0.9, 0.6) },
      { name: "hard shadow", image: shadow(base, 0.5, 0.35) },
      { name: "low contrast", image: renderMatrix(matrix, { scale: 6, dark: 90, light: 200 }) },
      { name: "tight quiet zone", image: renderMatrix(matrix, { scale: 5, margin: 2 }) },
      { name: "inverted", image: invertImage(base) },
      { name: "mirrored", image: mirrorImage(base) },
      { name: "blur 4", image: blur(base, 4) },
      { name: "perspective 0.4", image: perspective(base, 0.4) },
    ];
  }

  it("decodes a superset of what jsQR decodes", () => {
    const value = "https://usefy.dev/qr-scanner";
    const ours: string[] = [];
    const theirs: string[] = [];

    for (const { name, image } of corpus()) {
      if (decodeImageData(image)[0]?.text === value) ours.push(name);
      if (jsQR(image.data, image.width, image.height)?.data === value) theirs.push(name);
    }

    // Two independent implementations, one corpus. Ours must not be worse on
    // any case — that is the claim in SPEC §10, and this is what checks it.
    const jsqrOnly = theirs.filter((name) => !ours.includes(name));
    expect({ jsqrOnly }).toEqual({ jsqrOnly: [] });

    // And the corpus has to be hard enough to distinguish them at all,
    // otherwise the assertion above is decoration.
    expect(ours.length).toBeGreaterThan(theirs.length);
  }, 60_000);
});
