import { describe, expect, it, vi } from "vitest";
import type { SignaturePoint, SignatureStroke } from "../types";
import { strokeSteps } from "../ink/strokeWalker";
import { dataURLToBlob, exportPNG, type PNGRenderInput } from "./png";

const P = (x: number, y: number, time = 0, pressure = 0): SignaturePoint => ({
  x,
  y,
  time,
  pressure,
});

const dotStroke = (x: number, y: number): SignatureStroke => ({
  points: [P(x, y)],
  color: "#000",
  minWidth: 1,
  maxWidth: 3, // dot radius (1+3)/2 = 2
  velocityFilterWeight: 0.7,
  pressure: "auto",
  pointerType: "mouse",
});

interface RecordedCall {
  method: string;
  args: unknown[];
}

interface MockOffscreen {
  width: number;
  height: number;
  getContext: (id: string) => unknown;
  toDataURL: ReturnType<typeof vi.fn>;
  toBlob?: (cb: (blob: Blob | null) => void, type?: string) => void;
}

/** Expand #abc → #aabbcc lowercase (canvas fillStyle normalization). */
function normalizeHex(value: string): string {
  const hex = value.toLowerCase();
  return hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
}

function makeMockDoc(
  overrides: Partial<MockOffscreen> = {},
  ctxOpts: { normalizeFillStyle?: boolean } = {},
) {
  const calls: RecordedCall[] = [];
  const record =
    (method: string) =>
    (...args: unknown[]) =>
      calls.push({ method, args });
  const ctx = {
    beginPath: record("beginPath"),
    moveTo: record("moveTo"),
    arc: record("arc"),
    fill: record("fill"),
    fillRect: record("fillRect"),
    clearRect: record("clearRect"),
    setTransform: record("setTransform"),
    _fillStyle: "",
  };
  Object.defineProperty(ctx, "fillStyle", {
    get() {
      return ctx._fillStyle;
    },
    set(value: string) {
      calls.push({ method: "fillStyle", args: [value] });
      if (ctxOpts.normalizeFillStyle) {
        // Real-canvas behavior: valid values are stored normalized,
        // INVALID assignments are silently ignored (previous value kept).
        if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
          ctx._fillStyle = normalizeHex(value);
        }
      } else {
        ctx._fillStyle = value; // jsdom-like raw store
      }
    },
  });
  const off: MockOffscreen = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toDataURL: vi.fn(() => "data:image/png;base64,QUJD"), // "ABC"
    ...overrides,
  };
  const ownerDocument = {
    createElement: vi.fn(() => off),
  } as unknown as Document;
  return { ownerDocument, off, calls };
}

function input(
  ownerDocument: Document,
  strokes: readonly SignatureStroke[],
  extra: Partial<PNGRenderInput> = {},
): PNGRenderInput {
  return {
    ownerDocument,
    strokes,
    viewWidth: 300,
    viewHeight: 150,
    defaultBackground: undefined,
    defaultScale: 1,
    ...extra,
  };
}

describe("exportPNG", () => {
  it("trims to the ink bbox + padding and maps coordinates into the crop", async () => {
    const { ownerDocument, off, calls } = makeMockDoc();
    // dot at (10,20), radius 2 → bounds {8,18,4,4}; padding 5 → region {3,13,14,14}
    await exportPNG(input(ownerDocument, [dotStroke(10, 20)]), { padding: 5 });
    expect(off.width).toBe(14);
    expect(off.height).toBe(14);
    const transform = calls.find((c) => c.method === "setTransform");
    expect(transform?.args).toEqual([1, 0, 0, 1, -3, -13]);
  });

  it("applies the scale multiplier to the store and the transform", async () => {
    const { ownerDocument, off, calls } = makeMockDoc();
    await exportPNG(input(ownerDocument, [dotStroke(10, 20)]), { padding: 5, scale: 2 });
    expect(off.width).toBe(28);
    expect(off.height).toBe(28);
    expect(calls.find((c) => c.method === "setTransform")?.args).toEqual([2, 0, 0, 2, -6, -26]);
  });

  it("falls back to the engine's scale for NaN/absent scale", async () => {
    const { ownerDocument, off } = makeMockDoc();
    await exportPNG(input(ownerDocument, [dotStroke(10, 20)], { defaultScale: 2 }), {
      padding: 5,
      scale: NaN,
    });
    expect(off.width).toBe(28);
  });

  it("trim: false exports the full canvas viewport", async () => {
    const { ownerDocument, off, calls } = makeMockDoc();
    await exportPNG(input(ownerDocument, [dotStroke(10, 20)]), { trim: false });
    expect(off.width).toBe(300);
    expect(off.height).toBe(150);
    expect(calls.find((c) => c.method === "setTransform")?.args).toEqual([1, 0, 0, 1, -0, -0]);
  });

  it("an empty pad yields a minimal 1×1 artifact — never rejects", async () => {
    const { ownerDocument, off } = makeMockDoc();
    const { dataURL, blob } = await exportPNG(input(ownerDocument, []));
    expect(off.width).toBe(1);
    expect(off.height).toBe(1);
    expect(dataURL).toMatch(/^data:image\/png/);
    expect(blob.type).toBe("image/png");
  });

  it("replays the exact stroke geometry onto the offscreen canvas", async () => {
    const { ownerDocument, calls } = makeMockDoc();
    const s: SignatureStroke = {
      ...dotStroke(0, 0),
      points: [P(0, 0, 0), P(10, 2, 12), P(20, 6, 25)],
    };
    await exportPNG(input(ownerDocument, [s]));
    const arcs = calls.filter((c) => c.method === "arc");
    expect(arcs).toHaveLength(strokeSteps(s).length);
    expect((arcs[0].args as number[])[0]).toBeCloseTo(strokeSteps(s)[0].x, 10);
  });

  it("paints the background (option, falling back to the engine default)", async () => {
    const hasFillStyle = (calls: RecordedCall[], v: string) =>
      calls.some((c) => c.method === "fillStyle" && c.args[0] === v);

    const a = makeMockDoc();
    await exportPNG(input(a.ownerDocument, [dotStroke(10, 20)], { defaultBackground: "#eee" }));
    expect(a.calls.find((c) => c.method === "fillRect")).toBeTruthy();
    expect(hasFillStyle(a.calls, "#eee")).toBe(true);

    const b = makeMockDoc();
    await exportPNG(input(b.ownerDocument, [dotStroke(10, 20)], { defaultBackground: "#eee" }), {
      background: "#123",
    });
    expect(hasFillStyle(b.calls, "#123")).toBe(true);
    expect(hasFillStyle(b.calls, "#eee")).toBe(false);

    const c = makeMockDoc();
    await exportPNG(input(c.ownerDocument, [dotStroke(10, 20)]));
    expect(c.calls.find((c2) => c2.method === "fillRect")).toBeUndefined(); // transparent
  });

  it("skips typo'd colors a real canvas rejects (read-back probe)", async () => {
    // Normalizing (real-canvas-like) context: "#ffg" is ignored by the
    // fillStyle setter → the two-sentinel probe detects it → no paint.
    const typo = makeMockDoc({}, { normalizeFillStyle: true });
    await exportPNG(input(typo.ownerDocument, [dotStroke(10, 20)]), { background: "#ffg" });
    expect(typo.calls.find((c) => c.method === "fillRect")).toBeUndefined();

    // A valid color passes the probe (reads back the same normalization
    // after both sentinels) and paints.
    const valid = makeMockDoc({}, { normalizeFillStyle: true });
    await exportPNG(input(valid.ownerDocument, [dotStroke(10, 20)]), { background: "#fff" });
    expect(valid.calls.find((c) => c.method === "fillRect")).toBeTruthy();

    // jsdom-tolerance: a NON-normalizing context reads back raw values,
    // so the probe never false-negatives — it passes for everything
    // (browser-only protection, verified in Phase 4 QA).
    const raw = makeMockDoc();
    await exportPNG(input(raw.ownerDocument, [dotStroke(10, 20)]), { background: "#ffg" });
    expect(raw.calls.find((c) => c.method === "fillRect")).toBeTruthy();
  });

  it("treats an unsafe background as transparent (aligned with SVG semantics)", async () => {
    // An invalid fillStyle assignment would be IGNORED by canvas and the
    // rect painted with the previous (near-black) fill — so unsafe
    // strings must skip the background paint entirely.
    const a = makeMockDoc();
    await exportPNG(input(a.ownerDocument, [dotStroke(10, 20)]), {
      background: 'red"/><script>',
    });
    expect(a.calls.find((c) => c.method === "fillRect")).toBeUndefined();

    const b = makeMockDoc();
    await exportPNG(
      input(b.ownerDocument, [dotStroke(10, 20)], {
        defaultBackground: "url(//evil.example/leak.svg#g)",
      }),
    );
    expect(b.calls.find((c) => c.method === "fillRect")).toBeUndefined();
  });

  it("floors the trim inflation by the cap slack (parity with SVG at padding: 0)", async () => {
    const { ownerDocument, off, calls } = makeMockDoc();
    // dot radius (1+3)/2 = 2 at (10,20) → bounds {8,18,4,4};
    // cap slack = (3−1)/2 = 1 > padding 0 → region {7,17,6,6}.
    await exportPNG(input(ownerDocument, [dotStroke(10, 20)]), { padding: 0 });
    expect(off.width).toBe(6);
    expect(off.height).toBe(6);
    expect(calls.find((c) => c.method === "setTransform")?.args).toEqual([1, 0, 0, 1, -7, -17]);
  });

  it("uses canvas.toBlob when available", async () => {
    const native = new Blob(["native"], { type: "image/png" });
    const { ownerDocument } = makeMockDoc({
      toBlob: (cb) => cb(native),
    });
    const { blob } = await exportPNG(input(ownerDocument, [dotStroke(10, 20)]));
    expect(blob).toBe(native);
  });

  it("falls back to decoding the dataURL when toBlob yields null or throws", async () => {
    const nullBlob = makeMockDoc({ toBlob: (cb) => cb(null) });
    const a = await exportPNG(input(nullBlob.ownerDocument, [dotStroke(10, 20)]));
    expect(a.blob.size).toBe(3); // atob("QUJD") = "ABC"

    const throwing = makeMockDoc({
      toBlob: () => {
        throw new Error("no canvas backend");
      },
    });
    const b = await exportPNG(input(throwing.ownerDocument, [dotStroke(10, 20)]));
    expect(b.blob.size).toBe(3);
  });

  it("throws loudly when the offscreen 2D context is unavailable", async () => {
    const { ownerDocument } = makeMockDoc({ getContext: () => null });
    await expect(exportPNG(input(ownerDocument, []))).rejects.toThrow(/toPNG: no 2D context/);
  });
});

describe("dataURLToBlob", () => {
  it("decodes base64 into a PNG blob of the exact byte length", () => {
    // (jsdom's Blob lacks arrayBuffer(), so byte-level verification is a
    // Phase 4 real-browser QA item; size + type pin the decode here.)
    const blob = dataURLToBlob("data:image/png;base64,QUJD"); // "ABC"
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBe(3);
  });
});
