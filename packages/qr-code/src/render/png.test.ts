import { afterEach, describe, expect, it, vi } from "vitest";
import { toPNG } from "./png";
import { QRExportError } from "../errors";
import { encodeQR } from "../encode/encodeQR";

const matrix = encodeQR("https://usefy.dev", { level: "M" });
const PIXEL = "data:image/png;base64,iVBORw0KGgo=";

class RecordingPath2D {
  constructor(readonly d: string) {}
}

interface CanvasStub {
  toDataURL: ReturnType<typeof vi.fn>;
  toBlob?: ReturnType<typeof vi.fn>;
  getContext: ReturnType<typeof vi.fn>;
  width: number;
  height: number;
}

function stubCanvas(
  overrides: Partial<CanvasStub> = {},
  contextAvailable = true,
): { canvas: CanvasStub; drawn: string[] } {
  const drawn: string[] = [];
  const ctx = {
    canvas: null as unknown as HTMLCanvasElement,
    fillStyle: "",
    setTransform: () => {},
    clearRect: () => {},
    fillRect: () => {},
    fill: (path: RecordingPath2D) => drawn.push(path.d),
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    arc: () => {},
    clip: () => {},
    drawImage: () => drawn.push("image"),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };

  const canvas: CanvasStub = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => (contextAvailable ? ctx : null)),
    toDataURL: vi.fn(() => PIXEL),
    toBlob: vi.fn((callback: (blob: Blob | null) => void) =>
      callback(new Blob(["png"], { type: "image/png" })),
    ),
    ...overrides,
  };
  ctx.canvas = canvas as unknown as HTMLCanvasElement;

  vi.spyOn(document, "createElement").mockImplementation(((tag: string) =>
    tag === "canvas" ? canvas : ({} as HTMLElement)) as typeof document.createElement);

  return { canvas, drawn };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("toPNG", () => {
  it("returns both a data URI and a blob", async () => {
    vi.stubGlobal("Path2D", RecordingPath2D);
    const { canvas } = stubCanvas();

    const result = await toPNG(matrix, { pixelSize: 256 });
    expect(result.dataURL).toBe(PIXEL);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe("image/png");
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
    // Exported at exactly the requested pixel size, independent of DPR.
    expect(canvas.width).toBe(256);
    expect(canvas.height).toBe(256);
  });

  it("defaults to a 512px export", async () => {
    vi.stubGlobal("Path2D", RecordingPath2D);
    const { canvas } = stubCanvas();
    await toPNG(matrix);
    expect(canvas.width).toBe(512);
  });

  it("draws the styled paths, not a bare grid", async () => {
    vi.stubGlobal("Path2D", RecordingPath2D);
    const { drawn } = stubCanvas();
    await toPNG(matrix, { moduleShape: "dot", eyeColor: { outer: "#ef4444" } });
    // Separate eye colouring means separate paths reach the canvas.
    expect(drawn.length).toBeGreaterThan(1);
    expect(drawn.join("")).toContain("A"); // arcs — the dots really are round
  });

  it("falls back to decoding the data URI when toBlob is unavailable", async () => {
    vi.stubGlobal("Path2D", RecordingPath2D);
    stubCanvas({ toBlob: undefined });
    const result = await toPNG(matrix);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe("image/png");
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it("falls back when toBlob yields null", async () => {
    vi.stubGlobal("Path2D", RecordingPath2D);
    stubCanvas({ toBlob: vi.fn((callback: (blob: Blob | null) => void) => callback(null)) });
    const result = await toPNG(matrix);
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it("assumes image/png when the data URI omits a media type", async () => {
    vi.stubGlobal("Path2D", RecordingPath2D);
    stubCanvas({ toBlob: undefined, toDataURL: vi.fn(() => "data:,AAAA") });
    const result = await toPNG(matrix);
    expect(result.blob.type).toBe("image/png");
  });

  it("loads the logo before drawing", async () => {
    vi.stubGlobal("Path2D", RecordingPath2D);
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      crossOrigin: string | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", FakeImage);
    const { drawn } = stubCanvas();
    await toPNG(matrix, { logo: { src: "logo.png" } });
    expect(drawn).toContain("image");
  });

  it("explains a tainted canvas instead of returning a blank image", async () => {
    vi.stubGlobal("Path2D", RecordingPath2D);
    const cause = new Error("SecurityError");
    stubCanvas({
      toDataURL: vi.fn(() => {
        throw cause;
      }),
    });

    const failure = toPNG(matrix, { logoImage: {} as CanvasImageSource, logo: { src: "x" } });
    await expect(failure).rejects.toBeInstanceOf(QRExportError);
    await expect(failure).rejects.toThrow(/tainted/);
    await expect(failure).rejects.toThrow(/crossOrigin|data URI/);
  });

  it("reports a missing 2D context", async () => {
    vi.stubGlobal("Path2D", RecordingPath2D);
    stubCanvas({}, false);
    await expect(toPNG(matrix)).rejects.toThrow(/2D canvas context/);
  });

  it("directs server callers to toSVG instead of failing obscurely", async () => {
    vi.stubGlobal("document", undefined);
    await expect(toPNG(matrix)).rejects.toThrow(/toSVG\(\) on the server/);
  });
});
