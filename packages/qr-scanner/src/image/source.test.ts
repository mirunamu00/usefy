import { afterEach, describe, expect, it, vi } from "vitest";
import { QRUnsupportedError } from "../errors";
import { releaseScratchCanvas, toImageData } from "./source";
import { installImageSourceDoubles } from "../__testing__/dom";

function pixels(width = 8, height = 6): ImageData {
  return {
    data: new Uint8ClampedArray(width * height * 4).fill(200),
    width,
    height,
    colorSpace: "srgb",
  } as ImageData;
}

afterEach(() => {
  releaseScratchCanvas();
  vi.unstubAllGlobals();
});

describe("toImageData", () => {
  it("passes ImageData through untouched", async () => {
    const source = pixels();
    expect(await toImageData(source)).toBe(source);
  });

  it("reads a video at its intrinsic size, not its CSS size", async () => {
    // A 1280-wide stream rendered into a 320-wide canvas throws away exactly
    // the detail a scanner needs, so `videoWidth` wins over `width`.
    const frame = pixels(1280, 720);
    const doubles = installImageSourceDoubles(frame);

    const video = document.createElement("video");
    Object.defineProperty(video, "videoWidth", { value: 1280 });
    Object.defineProperty(video, "videoHeight", { value: 720 });
    video.width = 320;
    video.height = 180;

    expect(await toImageData(video)).toBe(frame);
    expect(doubles.reads()).toBe(1);
  });

  it("reads an image at its natural size", async () => {
    const frame = pixels(40, 30);
    installImageSourceDoubles(frame);

    const element = document.createElement("img");
    Object.defineProperty(element, "naturalWidth", { value: 40 });
    Object.defineProperty(element, "naturalHeight", { value: 30 });

    expect(await toImageData(element)).toBe(frame);
  });

  it("falls back to the element's width when there is no natural size", async () => {
    const frame = pixels(12, 9);
    installImageSourceDoubles(frame);

    const element = document.createElement("img");
    Object.defineProperty(element, "naturalWidth", { value: 0 });
    Object.defineProperty(element, "naturalHeight", { value: 0 });
    element.width = 12;
    element.height = 9;

    expect(await toImageData(element)).toBe(frame);
  });

  it("reads a canvas", async () => {
    const frame = pixels(20, 20);
    installImageSourceDoubles(frame);

    const canvas = document.createElement("canvas");
    canvas.width = 20;
    canvas.height = 20;

    expect(await toImageData(canvas)).toBe(frame);
  });

  it("refuses a source with no pixels yet", async () => {
    installImageSourceDoubles(pixels());

    // A <video> before its first frame reports 0×0. Drawing that would produce
    // an empty buffer and a confusing "no code found", so it is named instead.
    const video = document.createElement("video");
    Object.defineProperty(video, "videoWidth", { value: 0 });
    Object.defineProperty(video, "videoHeight", { value: 0 });

    await expect(toImageData(video)).rejects.toBeInstanceOf(QRUnsupportedError);
    await expect(toImageData(video)).rejects.toThrow(/no pixels yet/);
  });

  it("reuses one scratch canvas across frames of the same size", async () => {
    const frame = pixels(64, 64);
    const constructed = vi.fn();

    class CountingCanvas {
      width: number;
      height: number;
      constructor(width: number, height: number) {
        constructed();
        this.width = width;
        this.height = height;
      }
      getContext() {
        return {
          clearRect: () => {},
          drawImage: () => {},
          getImageData: () => frame,
        };
      }
    }
    vi.stubGlobal("OffscreenCanvas", CountingCanvas);
    releaseScratchCanvas();

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;

    await toImageData(canvas);
    await toImageData(canvas);
    await toImageData(canvas);

    // Three frames, one canvas: at 12 fps the alternative is 12 GPU
    // allocations a second, which browsers punish with visible stutter.
    expect(constructed).toHaveBeenCalledTimes(1);
  });

  it("reallocates when the frame size changes", async () => {
    const constructed = vi.fn();
    class CountingCanvas {
      width: number;
      height: number;
      constructor(width: number, height: number) {
        constructed();
        this.width = width;
        this.height = height;
      }
      getContext() {
        return {
          clearRect: () => {},
          drawImage: () => {},
          getImageData: () => pixels(this.width, this.height),
        };
      }
    }
    vi.stubGlobal("OffscreenCanvas", CountingCanvas);
    releaseScratchCanvas();

    const small = document.createElement("canvas");
    small.width = 32;
    small.height = 32;
    const large = document.createElement("canvas");
    large.width = 64;
    large.height = 64;

    await toImageData(small);
    await toImageData(large);
    expect(constructed).toHaveBeenCalledTimes(2);
  });

  it("decodes a blob through createImageBitmap and closes it", async () => {
    const frame = pixels(30, 30);
    const doubles = installImageSourceDoubles(frame);

    expect(await toImageData(new Blob([new Uint8Array([1])]))).toBe(frame);
    expect(doubles.leakedBitmaps()).toBe(0);
  });

  it("falls back to a DOM canvas where OffscreenCanvas is unavailable", async () => {
    // Safari shipped OffscreenCanvas late, and some embedded webviews still
    // lack it; the DOM canvas path is the one those environments take.
    const frame = pixels(16, 16);
    vi.stubGlobal("OffscreenCanvas", undefined);
    releaseScratchCanvas();

    const context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => frame),
    };
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;

      expect(await toImageData(canvas)).toBe(frame);
      expect(context.drawImage).toHaveBeenCalledTimes(1);
    } finally {
      getContext.mockRestore();
    }
  });

  it("reports a clear error when there is no way to read pixels at all", async () => {
    vi.stubGlobal("OffscreenCanvas", undefined);
    vi.stubGlobal("document", undefined);
    releaseScratchCanvas();

    const fake = { width: 10, height: 10 } as unknown as HTMLCanvasElement;
    await expect(toImageData(fake)).rejects.toBeInstanceOf(QRUnsupportedError);
  });
});
