import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { textShape } from "./textShape";

interface TextCtxMock {
  font: string;
  textBaseline: string;
  fillStyle: string;
  measureText: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
}

let textCtx: TextCtxMock;

function installCanvasMock(ctx: TextCtxMock | null = null): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => (ctx ?? textCtx) as unknown as CanvasRenderingContext2D,
  );
}

beforeEach(() => {
  textCtx = {
    font: "",
    textBaseline: "",
    fillStyle: "",
    measureText: vi.fn(() => ({
      width: 20,
      actualBoundingBoxAscent: 16,
      actualBoundingBoxDescent: 4,
    })),
    fillText: vi.fn(),
  };
  installCanvasMock();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("textShape", () => {
  it("rasterizes exactly once and memoizes the sprite entry", () => {
    const shape = textShape("🎉");
    const first = shape.rasterize(1);
    const second = shape.rasterize(1);
    expect(first).not.toBeNull();
    expect(second).toBe(first); // memoized — one raster ever
    expect(textCtx.measureText).toHaveBeenCalledTimes(1);
    expect(textCtx.fillText).toHaveBeenCalledTimes(1);
  });

  it("sizes the sprite from text metrics with 1 CSS px padding (dpr 1)", () => {
    const shape = textShape("🎉", { size: 14 });
    const entry = shape.rasterize(1)!;
    // metrics: width 20, ascent 16, descent 4 → 20×20 device px + 1px pad each side.
    const canvas = entry.source as HTMLCanvasElement;
    expect(canvas.width).toBe(22);
    expect(canvas.height).toBe(22);
    // resolution 1 → logical size equals device size.
    expect(entry.width).toBe(22);
    expect(entry.height).toBe(22);
    // Glyph drawn at the padded baseline.
    expect(textCtx.fillText).toHaveBeenCalledWith("🎉", 1, 17); // pad, pad+ascent
  });

  it("rasters at devicePixelRatio resolution (capped at 2) but reports CSS-px size", () => {
    vi.stubGlobal("devicePixelRatio", 3); // capped to 2
    const shape = textShape("A", { size: 14 });
    const entry = shape.rasterize(1)!;
    expect(textCtx.font).toContain("28px"); // 14 × resolution 2 (capped)
    const canvas = entry.source as HTMLCanvasElement;
    expect(canvas.width).toBe(24); // 20 device px + 2px pad each side (pad = ceil(2))
    expect(entry.width).toBe(12); // 24 / resolution 2 → CSS px
  });

  it("adds raster headroom for enlarged particles (scalar > 1)", () => {
    const shape = textShape("A", { size: 10 });
    shape.rasterize(2); // first particle has scalar 2 → resolution 2
    expect(textCtx.font).toContain("20px"); // 10 × 2 — sharp when scaled up
  });

  it("caps the scalar headroom at ×4 — a huge scalar never allocates a giant bitmap", () => {
    const shape = textShape("A", { size: 10 });
    const entry = shape.rasterize(50)!; // headroom clamps 50 → 4
    expect(textCtx.font).toContain("40px"); // 10 × 4, not 10 × 50
    const canvas = entry.source as HTMLCanvasElement;
    // metrics width 20 + pad 2×ceil(4) → bounded, kilobyte-scale bitmap.
    expect(canvas.width).toBeLessThan(100);
    expect(canvas.height).toBeLessThan(100);
  });

  it("applies font family, weight, and color", () => {
    const shape = textShape("W", {
      size: 18,
      fontFamily: "monospace",
      fontWeight: 700,
      color: "#4f8ef7",
    });
    shape.rasterize(1);
    expect(textCtx.font).toBe("700 18px monospace");
    expect(textCtx.fillStyle).toBe("#4f8ef7");
    expect(textCtx.textBaseline).toBe("alphabetic");
  });

  it("keys are stable for equal inputs and distinct for different ones", () => {
    expect(textShape("🎉").key).toBe(textShape("🎉").key);
    expect(textShape("🎉").key).not.toBe(textShape("🎊").key);
    expect(textShape("🎉", { size: 20 }).key).not.toBe(textShape("🎉").key);
    expect(textShape("🎉", { color: "#fff" }).key).not.toBe(textShape("🎉").key);
  });

  it("falls back to estimated metrics when actualBoundingBox* is missing (older engines)", () => {
    textCtx.measureText.mockReturnValue({ width: 20 });
    const shape = textShape("A", { size: 20 });
    const entry = shape.rasterize(1)!;
    // ascent ≈ 16 (0.8×20), descent ≈ 5 (0.25×20) → 21 + 2px pad.
    const canvas = entry.source as HTMLCanvasElement;
    expect(canvas.height).toBe(23);
  });

  it("returns null (retry later) without a document (SSR)", () => {
    const shape = textShape("🎉");
    vi.stubGlobal("document", undefined);
    expect(shape.rasterize(1)).toBeNull();
    vi.unstubAllGlobals();
    installCanvasMock();
    expect(shape.rasterize(1)).not.toBeNull(); // recovers client-side
  });

  it("returns null when the offscreen canvas has no 2D context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => null,
    );
    expect(textShape("🎉").rasterize(1)).toBeNull();
  });

  it("clamps degenerate size options", () => {
    const shape = textShape("A", { size: NaN });
    shape.rasterize(1);
    expect(textCtx.font).toContain("14px"); // fell back to the default size
  });
});
