import { describe, expect, it } from "vitest";
import { cornersToPolygon, joinStructuredAppend, mapCorners, mapPointToElement } from "./utils";
import type { QRScanResult, StructuredAppendInfo } from "./types";

function symbolResult(
  text: string,
  structuredAppend?: StructuredAppendInfo,
): QRScanResult {
  return {
    text,
    bytes: new TextEncoder().encode(text),
    segments: [{ mode: "byte", text, bytes: new TextEncoder().encode(text) }],
    symbol: {
      version: 2,
      size: 25,
      level: "M",
      mask: 0,
      mirrored: false,
      inverted: false,
      errorsCorrected: 0,
      ...(structuredAppend ? { structuredAppend } : {}),
    },
    corners: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
    center: { x: 5, y: 5 },
    engine: "internal",
    timestamp: 0,
  };
}

describe("joinStructuredAppend", () => {
  const parity = 0x5a;

  it("orders the parts and concatenates them", () => {
    const joined = joinStructuredAppend([
      symbolResult("world", { index: 1, total: 3, parity }),
      symbolResult("hello ", { index: 0, total: 3, parity }),
      symbolResult("!", { index: 2, total: 3, parity }),
    ]);

    expect(joined.text).toBe("hello world!");
    expect(new TextDecoder().decode(joined.bytes)).toBe("hello world!");
    expect(joined.missing).toEqual([]);
    expect(joined.total).toBe(3);
    expect(joined.parts).toHaveLength(3);
  });

  it("reports which parts are still missing", () => {
    // The camera sees symbols in whatever order the user waves it, so a UI has
    // to be able to say "2 of 4 — keep going" rather than joining a partial.
    const joined = joinStructuredAppend([
      symbolResult("a", { index: 0, total: 4, parity }),
      symbolResult("c", { index: 2, total: 4, parity }),
    ]);

    expect(joined.text).toBe("ac");
    expect(joined.missing).toEqual([1, 3]);
  });

  it("de-duplicates a symbol seen in several frames", () => {
    const joined = joinStructuredAppend([
      symbolResult("a", { index: 0, total: 2, parity }),
      symbolResult("a", { index: 0, total: 2, parity }),
      symbolResult("b", { index: 1, total: 2, parity }),
    ]);

    expect(joined.text).toBe("ab");
    expect(joined.parts).toHaveLength(2);
  });

  it("refuses to mix two different sequences", () => {
    // Joining across sequences would produce convincing nonsense, which is
    // worse than refusing.
    expect(() =>
      joinStructuredAppend([
        symbolResult("a", { index: 0, total: 2, parity }),
        symbolResult("b", { index: 1, total: 2, parity: 0x11 }),
      ]),
    ).toThrow(/different Structured Append sequences/);

    expect(() =>
      joinStructuredAppend([
        symbolResult("a", { index: 0, total: 2, parity }),
        symbolResult("b", { index: 1, total: 3, parity }),
      ]),
    ).toThrow(/different Structured Append sequences/);
  });

  it("refuses results that are not part of a sequence at all", () => {
    expect(() => joinStructuredAppend([symbolResult("plain")])).toThrow(/None of these results/);
    expect(() => joinStructuredAppend([])).toThrow(/None of these results/);
  });

  it("ignores plain symbols mixed in with a sequence", () => {
    const joined = joinStructuredAppend([
      symbolResult("unrelated"),
      symbolResult("a", { index: 0, total: 2, parity }),
      symbolResult("b", { index: 1, total: 2, parity }),
    ]);

    expect(joined.text).toBe("ab");
  });
});

describe("mapPointToElement", () => {
  const source = { sourceWidth: 1280, sourceHeight: 720 };

  it("scales and centres under object-fit: cover", () => {
    // A 16:9 stream in a 9:16 viewport: scaled to fill the width... no, to fill
    // the *height*, with the sides cropped. The crop is what a naive scale
    // misses, and it is why an overlay drawn without it drifts sideways.
    const geometry = { ...source, elementWidth: 360, elementHeight: 640, objectFit: "cover" as const };
    const scale = 640 / 720;
    const offsetX = (360 - 1280 * scale) / 2;

    expect(mapPointToElement({ x: 0, y: 0 }, geometry)).toEqual({ x: offsetX, y: 0 });
    expect(mapPointToElement({ x: 640, y: 360 }, geometry)).toEqual({ x: 180, y: 320 });
    expect(offsetX).toBeLessThan(0); // the sides really are cropped
  });

  it("letterboxes under object-fit: contain", () => {
    const geometry = { ...source, elementWidth: 640, elementHeight: 640, objectFit: "contain" as const };
    const mapped = mapPointToElement({ x: 0, y: 0 }, geometry);

    expect(mapped.x).toBe(0);
    expect(mapped.y).toBeGreaterThan(0); // bars top and bottom
    expect(mapPointToElement({ x: 640, y: 360 }, geometry)).toEqual({ x: 320, y: 320 });
  });

  it("stretches independently under object-fit: fill", () => {
    const geometry = { ...source, elementWidth: 500, elementHeight: 500, objectFit: "fill" as const };
    expect(mapPointToElement({ x: 1280, y: 720 }, geometry)).toEqual({ x: 500, y: 500 });
  });

  it("flips the x axis for a mirrored front camera", () => {
    const geometry = {
      ...source,
      elementWidth: 1280,
      elementHeight: 720,
      objectFit: "fill" as const,
      mirrored: true,
    };

    expect(mapPointToElement({ x: 0, y: 100 }, geometry)).toEqual({ x: 1280, y: 100 });
    expect(mapPointToElement({ x: 1280, y: 100 }, geometry)).toEqual({ x: 0, y: 100 });
  });

  it("returns the origin rather than NaN when the source has no size yet", () => {
    // A <video> before its first frame reports 0×0; an overlay must not be
    // asked to draw at NaN.
    expect(
      mapPointToElement({ x: 5, y: 5 }, { sourceWidth: 0, sourceHeight: 0, elementWidth: 100, elementHeight: 100 }),
    ).toEqual({ x: 0, y: 0 });
  });

  it("defaults to cover, which is what a camera preview uses", () => {
    const withDefault = mapPointToElement(
      { x: 10, y: 10 },
      { ...source, elementWidth: 360, elementHeight: 640 },
    );
    const explicit = mapPointToElement(
      { x: 10, y: 10 },
      { ...source, elementWidth: 360, elementHeight: 640, objectFit: "cover" },
    );
    expect(withDefault).toEqual(explicit);
  });
});

describe("mapCorners", () => {
  it("maps all four corners", () => {
    const result = symbolResult("corners");
    const mapped = mapCorners(result, {
      sourceWidth: 10,
      sourceHeight: 10,
      elementWidth: 100,
      elementHeight: 100,
      objectFit: "fill",
    });

    expect(mapped).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]);
  });
});

describe("cornersToPolygon", () => {
  it("formats an SVG points attribute", () => {
    expect(
      cornersToPolygon([
        { x: 1, y: 2 },
        { x: 3.456, y: 4 },
        { x: 5, y: 6 },
        { x: 7, y: 8 },
      ]),
    ).toBe("1.00,2.00 3.46,4.00 5.00,6.00 7.00,8.00");
  });
});
