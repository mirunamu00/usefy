import { afterEach, describe, expect, it, vi } from "vitest";
import { drawToCanvas } from "./canvas";
import { toSVGProps } from "./svg";
import { QRExportError } from "../errors";
import { encodeQR } from "../encode/encodeQR";

const matrix = encodeQR("https://usefy.dev", { level: "M", mask: 2 });

/** Records the `d` string each Path2D was built from. */
class RecordingPath2D {
  static built: string[] = [];
  constructor(readonly d: string) {
    RecordingPath2D.built.push(d);
  }
}

interface FakeGradient {
  kind: "linear" | "radial";
  args: number[];
  stops: Array<[number, string]>;
}

function fakeContext(): {
  ctx: CanvasRenderingContext2D;
  calls: string[];
  fills: unknown[];
  gradients: FakeGradient[];
  /** Every value assigned to `canvas.width` — re-assigning it clears the canvas. */
  resizes: number[];
} {
  const calls: string[] = [];
  const fills: unknown[] = [];
  const gradients: FakeGradient[] = [];
  const resizes: number[] = [];
  let width = 0;
  let height = 0;
  const canvas = {
    get width(): number {
      return width;
    },
    set width(value: number) {
      width = value;
      resizes.push(value);
    },
    get height(): number {
      return height;
    },
    set height(value: number) {
      height = value;
    },
  } as HTMLCanvasElement;

  const makeGradient = (kind: "linear" | "radial", args: number[]): FakeGradient => {
    const gradient: FakeGradient = { kind, args, stops: [] };
    gradients.push(gradient);
    return gradient;
  };

  const ctx = {
    canvas,
    set fillStyle(value: unknown) {
      fills.push(value);
    },
    get fillStyle(): unknown {
      return fills[fills.length - 1];
    },
    setTransform: (...args: number[]) => calls.push(`setTransform(${args.join(",")})`),
    clearRect: (...args: number[]) => calls.push(`clearRect(${args.join(",")})`),
    fillRect: (...args: number[]) => calls.push(`fillRect(${args.join(",")})`),
    fill: (path: RecordingPath2D) => calls.push(`fill(${path.d.length})`),
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    beginPath: () => calls.push("beginPath"),
    arc: (...args: number[]) => calls.push(`arc(${args.slice(0, 3).join(",")})`),
    clip: () => calls.push("clip"),
    drawImage: (...args: unknown[]) => calls.push(`drawImage(${args.slice(1).join(",")})`),
    createLinearGradient: (...args: number[]) => {
      const gradient = makeGradient("linear", args);
      return {
        ...gradient,
        addColorStop: (offset: number, color: string) => gradient.stops.push([offset, color]),
      } as unknown as CanvasGradient;
    },
    createRadialGradient: (...args: number[]) => {
      const gradient = makeGradient("radial", args);
      return {
        ...gradient,
        addColorStop: (offset: number, color: string) => gradient.stops.push([offset, color]),
      } as unknown as CanvasGradient;
    },
  } as unknown as CanvasRenderingContext2D;

  return { ctx, calls, fills, gradients, resizes };
}

function withPath2D<T>(run: () => T): T {
  RecordingPath2D.built = [];
  vi.stubGlobal("Path2D", RecordingPath2D);
  try {
    return run();
  } finally {
    vi.unstubAllGlobals();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("drawToCanvas", () => {
  it("draws exactly the paths the SVG renderer emits", () => {
    // This is the parity guarantee: one geometry pipeline, two outputs. If the
    // canvas ever drew its own shapes, these strings would diverge.
    const { ctx } = fakeContext();
    withPath2D(() => drawToCanvas(ctx, matrix, { moduleShape: "rounded", size: 100 }));
    expect(RecordingPath2D.built).toEqual(
      toSVGProps(matrix, { moduleShape: "rounded" }).paths.map((path) => path.d),
    );
  });

  it("sizes the backing store for the device pixel ratio", () => {
    const { ctx, calls } = fakeContext();
    withPath2D(() => drawToCanvas(ctx, matrix, { size: 200, dpr: 2 }));
    expect(ctx.canvas.width).toBe(400);
    expect(ctx.canvas.height).toBe(400);

    // The transform maps padded user units onto those device pixels.
    const side = matrix.size + 8;
    expect(calls).toContain(`setTransform(${400 / side},0,0,${400 / side},0,0)`);
    // …and is reset before returning, so the caller's context is untouched.
    expect(calls[calls.length - 1]).toBe("setTransform(1,0,0,1,0,0)");
  });

  it("clamps a hostile size or dpr instead of allocating a giant canvas", () => {
    const { ctx } = fakeContext();
    withPath2D(() => drawToCanvas(ctx, matrix, { size: Infinity, dpr: NaN }));
    expect(Number.isFinite(ctx.canvas.width)).toBe(true);
    expect(ctx.canvas.width).toBeLessThanOrEqual(8192 * 4);
  });

  it("does not resize the canvas when the size has not changed", () => {
    // Re-assigning canvas.width wipes the backing store; skipping the no-op
    // assignment is what keeps a re-render from flashing.
    const { ctx, resizes } = fakeContext();
    withPath2D(() => drawToCanvas(ctx, matrix, { size: 100, dpr: 1 }));
    expect(resizes).toEqual([100]);
    withPath2D(() => drawToCanvas(ctx, matrix, { size: 100, dpr: 1 }));
    expect(resizes).toEqual([100]);
    withPath2D(() => drawToCanvas(ctx, matrix, { size: 120, dpr: 1 }));
    expect(resizes).toEqual([100, 120]);
  });

  it("paints the background before the modules, and skips it when transparent", () => {
    const { ctx, calls } = fakeContext();
    withPath2D(() => drawToCanvas(ctx, matrix, { size: 100 }));
    const side = matrix.size + 8;
    expect(calls).toContain(`fillRect(0,0,${side},${side})`);
    expect(calls.indexOf(`fillRect(0,0,${side},${side})`)).toBeLessThan(
      calls.findIndex((call) => call.startsWith("fill(")),
    );

    const transparent = fakeContext();
    withPath2D(() => drawToCanvas(transparent.ctx, matrix, { size: 100, bg: null }));
    expect(transparent.calls.some((call) => call.startsWith("fillRect"))).toBe(false);
  });

  it("builds a canvas gradient matching the SVG gradient definition", () => {
    const { ctx, gradients, fills } = fakeContext();
    withPath2D(() =>
      drawToCanvas(ctx, matrix, {
        size: 100,
        fg: {
          type: "linear",
          rotation: 90,
          stops: [
            { offset: 0, color: "#6366f1" },
            { offset: 1, color: "#ec4899" },
          ],
        },
      }),
    );
    expect(gradients).toHaveLength(1);
    expect(gradients[0]!.kind).toBe("linear");
    expect(gradients[0]!.stops).toEqual([
      [0, "#6366f1"],
      [1, "#ec4899"],
    ]);
    // The path is filled with the gradient object, not the `url(#…)` string.
    expect(fills.some((fill) => typeof fill === "object")).toBe(true);
  });

  it("treats a gradient with no rotation as horizontal", () => {
    const { ctx, gradients } = fakeContext();
    withPath2D(() =>
      drawToCanvas(ctx, matrix, {
        size: 100,
        fg: {
          type: "linear",
          stops: [
            { offset: 0, color: "#6366f1" },
            { offset: 1, color: "#ec4899" },
          ],
        },
      }),
    );
    const side = matrix.size + 8;
    expect(gradients[0]!.args).toEqual([0, side / 2, side, side / 2]);
  });

  it("falls back to devicePixelRatio 1 where the global is absent", () => {
    const { ctx } = fakeContext();
    vi.stubGlobal("devicePixelRatio", undefined);
    withPath2D(() => drawToCanvas(ctx, matrix, { size: 64 }));
    expect(ctx.canvas.width).toBe(64);
  });

  it("caps the backing store at 2× even on a very dense display", () => {
    const { ctx } = fakeContext();
    vi.stubGlobal("devicePixelRatio", 4);
    withPath2D(() => drawToCanvas(ctx, matrix, { size: 64 }));
    expect(ctx.canvas.width).toBe(128);
  });

  it("builds a radial canvas gradient from the same bounds", () => {
    const { ctx, gradients } = fakeContext();
    withPath2D(() =>
      drawToCanvas(ctx, matrix, {
        size: 100,
        fg: {
          type: "radial",
          stops: [
            { offset: 0, color: "#22c55e" },
            { offset: 1, color: "#0ea5e9" },
          ],
        },
      }),
    );
    const side = matrix.size + 8;
    expect(gradients[0]!.kind).toBe("radial");
    expect(gradients[0]!.args).toEqual([side / 2, side / 2, 0, side / 2, side / 2, side / 2]);
  });

  it("draws a logo image, clipping it to a circle when asked", () => {
    const image = {} as CanvasImageSource;
    const square = fakeContext();
    withPath2D(() =>
      drawToCanvas(square.ctx, matrix, { size: 100, logo: { src: "a" }, logoImage: image }),
    );
    expect(square.calls.some((call) => call.startsWith("drawImage"))).toBe(true);
    expect(square.calls).not.toContain("clip");

    const circle = fakeContext();
    withPath2D(() =>
      drawToCanvas(circle.ctx, matrix, {
        size: 100,
        logo: { src: "a", shape: "circle" },
        logoImage: image,
      }),
    );
    expect(circle.calls).toContain("clip");
    expect(circle.calls.indexOf("save")).toBeLessThan(circle.calls.indexOf("clip"));
    expect(circle.calls).toContain("restore");
  });

  it("skips the logo when no image was supplied — drawing is synchronous", () => {
    const { ctx, calls } = fakeContext();
    withPath2D(() => drawToCanvas(ctx, matrix, { size: 100, logo: { src: "a" } }));
    expect(calls.some((call) => call.startsWith("drawImage"))).toBe(false);
  });

  it("fails loudly where Path2D is unavailable rather than drawing nothing", () => {
    const { ctx } = fakeContext();
    vi.stubGlobal("Path2D", undefined);
    expect(() => drawToCanvas(ctx, matrix)).toThrow(QRExportError);
    expect(() => drawToCanvas(ctx, matrix)).toThrow(/Path2D/);
  });
});
