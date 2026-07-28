import { afterEach, describe, expect, it, vi } from "vitest";
import { encodeQR } from "@usefy/qr-code/headless";
import { decode, decodeFile, decodeFirst } from "./engine";
import { QRUnsupportedError } from "./errors";
import { isNativeSupported, resetNativeSupport } from "./native";
import { renderMatrix } from "./__testing__/render";
import { installImageSourceDoubles } from "./__testing__/dom";
import { BitMatrix } from "./image/bitmatrix";
import { releaseScratchCanvas } from "./image/source";
import type { GrayImage } from "./types";

const VALUE = "https://usefy.dev/qr-scanner";

/** A fake `BarcodeDetector` with controllable behaviour. */
function installNative(options: {
  formats?: string[];
  detect?: () => Promise<unknown[]>;
  noFormatsMethod?: boolean;
}) {
  const detect = options.detect ?? (async () => []);
  class FakeDetector {
    static getSupportedFormats = options.noFormatsMethod
      ? undefined
      : async () => options.formats ?? ["qr_code"];
    detect = detect;
  }
  vi.stubGlobal("BarcodeDetector", FakeDetector);
  resetNativeSupport();
  return { detect };
}

function nativeBarcode(rawValue: string) {
  return {
    rawValue,
    format: "qr_code",
    cornerPoints: [
      { x: 10, y: 10 },
      { x: 90, y: 12 },
      { x: 92, y: 92 },
      { x: 12, y: 90 },
    ],
  };
}

function image() {
  return renderMatrix(encodeQR(VALUE, { level: "M" }), { scale: 6 });
}

afterEach(() => {
  resetNativeSupport();
});

describe("isNativeSupported", () => {
  it("is false when the platform has no BarcodeDetector", async () => {
    vi.stubGlobal("BarcodeDetector", undefined);
    resetNativeSupport();
    expect(await isNativeSupported()).toBe(false);
  });

  it("is false when the detector exists but cannot do QR", async () => {
    // Some builds ship the API for 1D formats only — asking it for `qr_code`
    // then fails at the first detect rather than at construction, so the
    // format list has to be checked up front.
    installNative({ formats: ["code_128", "ean_13"] });
    expect(await isNativeSupported()).toBe(false);
  });

  it("is true when qr_code is supported", async () => {
    installNative({ formats: ["qr_code", "code_128"] });
    expect(await isNativeSupported()).toBe(true);
  });

  it("assumes QR when the build predates getSupportedFormats", async () => {
    installNative({ noFormatsMethod: true });
    expect(await isNativeSupported()).toBe(true);
  });

  it("is false when the probe itself throws", async () => {
    class Broken {
      static getSupportedFormats = async () => {
        throw new Error("no");
      };
    }
    vi.stubGlobal("BarcodeDetector", Broken);
    resetNativeSupport();
    expect(await isNativeSupported()).toBe(false);
  });

  it("probes once and caches the answer", async () => {
    const spy = vi.fn(async () => ["qr_code"]);
    class Counting {
      static getSupportedFormats = spy;
      detect = async () => [];
    }
    vi.stubGlobal("BarcodeDetector", Counting);
    resetNativeSupport();

    await Promise.all([isNativeSupported(), isNativeSupported()]);
    await isNativeSupported();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('engine: "auto"', () => {
  it("uses the native detector when it finds something", async () => {
    installNative({ detect: async () => [nativeBarcode(VALUE)] });

    const [result] = await decode(image());
    expect(result!.engine).toBe("native");
    expect(result!.text).toBe(VALUE);
    // The native API exposes no symbol metadata, and none is invented.
    expect(result!.symbol).toBeUndefined();
  });

  it("falls back to the internal engine when the native one finds nothing", async () => {
    installNative({ detect: async () => [] });

    const [result] = await decode(image());
    expect(result!.engine).toBe("internal");
    expect(result!.text).toBe(VALUE);
    expect(result!.symbol?.version).toBeGreaterThan(0);
  });

  it("falls back when the native detector throws", async () => {
    installNative({
      detect: async () => {
        throw new Error("the platform decided otherwise");
      },
    });

    const [result] = await decode(image());
    expect(result!.engine).toBe("internal");
    expect(result!.text).toBe(VALUE);
  });

  it("uses the internal engine when there is no native detector at all", async () => {
    vi.stubGlobal("BarcodeDetector", undefined);
    resetNativeSupport();

    const [result] = await decode(image());
    expect(result!.engine).toBe("internal");
  });
});

describe("options that force the internal engine", () => {
  it.each([
    ["binary", { binary: true }],
    ["invert: always", { invert: "always" as const }],
    ["majority sampling", { sampling: "majority5" as const }],
    ["a custom binarizer", { binarizer: (gray: GrayImage) => new BitMatrix(gray.width, gray.height) }],
  ])("%s never reaches the native detector", async (_label, options) => {
    const detect = vi.fn(async () => [nativeBarcode("native would have said this")]);
    installNative({ detect });

    const results = await decode(image(), options as never);
    expect(detect).not.toHaveBeenCalled();
    if (results.length > 0) expect(results[0]!.engine).toBe("internal");
  });

  it("keeps raw bytes intact, which the native path cannot promise", async () => {
    // The native API returns a string; re-encoding it as UTF-8 is not the
    // symbol's original payload for non-UTF-8 byte data. `binary` therefore
    // forces the engine that actually has the bytes.
    const bytes = Uint8Array.from([0x00, 0xff, 0xfe, 0x41]);
    installNative({ detect: async () => [nativeBarcode("wrong")] });

    const [result] = await decode(renderMatrix(encodeQR(bytes, { level: "M" }), { scale: 6 }), {
      binary: true,
    });
    expect(Array.from(result!.bytes)).toEqual(Array.from(bytes));
  });
});

describe('engine: "native"', () => {
  it("throws where the platform cannot do it, instead of silently degrading", async () => {
    vi.stubGlobal("BarcodeDetector", undefined);
    resetNativeSupport();

    await expect(decode(image(), { engine: "native" })).rejects.toBeInstanceOf(QRUnsupportedError);
  });

  it("returns native results without a fallback", async () => {
    installNative({ detect: async () => [] });
    expect(await decode(image(), { engine: "native" })).toEqual([]);
  });

  it("derives a quad from a bounding box when corner points are missing", async () => {
    installNative({
      detect: async () => [
        { rawValue: VALUE, format: "qr_code", boundingBox: { x: 5, y: 7, width: 20, height: 30 } },
      ],
    });

    const [result] = await decode(image(), { engine: "native" });
    expect(result!.corners).toEqual([
      { x: 5, y: 7 },
      { x: 25, y: 7 },
      { x: 25, y: 37 },
      { x: 5, y: 37 },
    ]);
    expect(result!.center).toEqual({ x: 15, y: 22 });
  });

  it("ignores non-QR formats the detector volunteers", async () => {
    installNative({
      detect: async () => [
        { rawValue: "1234567890128", format: "ean_13" },
        nativeBarcode(VALUE),
      ],
    });

    const results = await decode(image(), { engine: "native", maxSymbols: 5 });
    expect(results.map((result) => result.text)).toEqual([VALUE]);
  });

  it("honours maxSymbols", async () => {
    installNative({
      detect: async () => [nativeBarcode("one"), nativeBarcode("two"), nativeBarcode("three")],
    });

    expect(await decode(image(), { engine: "native" })).toHaveLength(1);
    expect(await decode(image(), { engine: "native", maxSymbols: 2 })).toHaveLength(2);
  });
});

describe('engine: "internal"', () => {
  it("never consults the platform, even when it is available", async () => {
    const detect = vi.fn(async () => [nativeBarcode("native")]);
    installNative({ detect });

    const [result] = await decode(image(), { engine: "internal" });
    expect(detect).not.toHaveBeenCalled();
    expect(result!.engine).toBe("internal");
  });
});

describe("decodeFile and decodeFirst", () => {
  it("decodeFirst returns one result or null", async () => {
    vi.stubGlobal("BarcodeDetector", undefined);
    resetNativeSupport();

    expect((await decodeFirst(image()))?.text).toBe(VALUE);

    const blank: ImageData = {
      data: new Uint8ClampedArray(80 * 80 * 4).fill(255),
      width: 80,
      height: 80,
      colorSpace: "srgb",
    } as ImageData;
    expect(await decodeFirst(blank)).toBeNull();
  });

  it("decodeFile decodes a blob and releases the bitmap it decoded", async () => {
    // jsdom has no image decoder, so `createImageBitmap` and the canvas are
    // doubled — but the code under test is the real path, including the
    // `bitmap.close()` that keeps a burst of dropped files from piling up
    // several megabytes of GPU memory each.
    releaseScratchCanvas();
    const doubles = installImageSourceDoubles(image());
    vi.stubGlobal("BarcodeDetector", undefined);
    resetNativeSupport();

    try {
      const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
      const [result] = await decodeFile(blob);

      expect(result!.text).toBe(VALUE);
      expect(doubles.reads()).toBe(1);
      expect(doubles.leakedBitmaps()).toBe(0);
    } finally {
      doubles.restore();
      releaseScratchCanvas();
    }
  });
});
