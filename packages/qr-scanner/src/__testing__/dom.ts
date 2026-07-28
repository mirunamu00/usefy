import { vi } from "vitest";

/**
 * Doubles for the browser APIs that turn a source into pixels.
 *
 * jsdom ships no image decoder and no canvas, so `createImageBitmap`,
 * `OffscreenCanvas` and `getContext("2d")` are all missing or inert. Rather
 * than skipping the source-normalization path in tests — it is the one place
 * the decoder touches the DOM, so skipping it would leave the whole file
 * unexercised — these doubles replay a known `ImageData` through the real code.
 */

export interface ImageSourceDoubles {
  /** How many times pixels were read back. */
  readonly reads: () => number;
  /** How many bitmaps were created but never closed. */
  readonly leakedBitmaps: () => number;
  restore(): void;
}

/**
 * Install doubles that make every drawable source resolve to `pixels`.
 *
 * @param pixels - The image every read returns.
 */
export function installImageSourceDoubles(pixels: ImageData): ImageSourceDoubles {
  let reads = 0;
  let open = 0;

  class FakeContext {
    clearRect(): void {}
    drawImage(): void {}
    getImageData(): ImageData {
      reads++;
      return pixels;
    }
  }

  class FakeOffscreenCanvas {
    width: number;
    height: number;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }
    getContext(): FakeContext {
      return new FakeContext();
    }
  }

  vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);
  vi.stubGlobal("createImageBitmap", async () => {
    open++;
    return {
      width: pixels.width,
      height: pixels.height,
      close(): void {
        open--;
      },
    };
  });

  return {
    reads: () => reads,
    leakedBitmaps: () => open,
    restore: () => {
      vi.unstubAllGlobals();
    },
  };
}
