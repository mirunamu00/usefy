import { QRUnsupportedError } from "../errors";
import type { ImageSource } from "../types";

/**
 * Normalizing every accepted input into `ImageData`.
 *
 * This is the only file in the decode path that touches the DOM, which is what
 * keeps everything below it usable in a worker, in a test, and on a server.
 * The rest of the pipeline never learns whether its pixels came from a camera
 * frame, a dropped screenshot or a hand-built array.
 */

/** A canvas that can be reused across frames rather than reallocated. */
interface ScratchCanvas {
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  readonly context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

let scratch: ScratchCanvas | null = null;

function createCanvas(width: number, height: number): ScratchCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) return { canvas, context };
  }

  if (typeof document === "undefined") {
    throw new QRUnsupportedError(
      "Reading pixels needs a canvas: pass an ImageData directly, or run where " +
        "OffscreenCanvas or the DOM is available.",
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  /* c8 ignore next 6 -- a 2D context is unavailable only when canvas support is
     disabled outright; jsdom without a canvas package hits the OffscreenCanvas
     branch above or throws there first. */
  if (!context) {
    throw new QRUnsupportedError(
      "This browser refused a 2D canvas context, so pixels cannot be read from " +
        "the supplied source.",
    );
  }
  return { canvas, context };
}

/**
 * Draw a drawable source and read its pixels back.
 *
 * The scratch canvas is module-level and reused: at 12 frames a second, a new
 * canvas per frame is 12 GPU allocations a second, and browsers punish that
 * with visible stutter.
 */
function readPixels(
  source: CanvasImageSource,
  width: number,
  height: number,
): ImageData {
  if (width < 1 || height < 1) {
    throw new QRUnsupportedError(
      "The image source has no pixels yet — a video that has not loaded a frame, " +
        "or an image that has not decoded.",
    );
  }

  if (!scratch || scratch.canvas.width !== width || scratch.canvas.height !== height) {
    scratch = createCanvas(width, height);
    scratch.canvas.width = width;
    scratch.canvas.height = height;
  }

  const { context } = scratch;
  context.clearRect(0, 0, width, height);
  context.drawImage(source as CanvasImageSource, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

/** Release the shared scratch canvas — for tests, and for a scanner shutting down. */
export function releaseScratchCanvas(): void {
  scratch = null;
}

function isImageData(source: ImageSource): source is ImageData {
  return (
    typeof source === "object" &&
    source !== null &&
    "data" in source &&
    "width" in source &&
    "height" in source
  );
}

/**
 * The pixel dimensions of a source, preferring its *intrinsic* size.
 *
 * A `<video>` element's CSS size has nothing to do with the frame it is
 * showing, and reading pixels at the CSS size would silently downscale (or
 * upscale) every frame — a `videoWidth` of 1280 rendered into a 320-wide
 * canvas throws away exactly the detail a scanner needs.
 */
function dimensionsOf(source: ImageSource): { width: number; height: number } {
  if (typeof HTMLVideoElement !== "undefined" && source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) {
    return { width: source.naturalWidth || source.width, height: source.naturalHeight || source.height };
  }
  const sized = source as { width: number; height: number };
  return { width: sized.width, height: sized.height };
}

/**
 * Turn any accepted source into `ImageData`.
 *
 * @throws {QRUnsupportedError} when the environment cannot read pixels from the
 *   source, or the source has no pixels yet.
 */
export async function toImageData(source: ImageSource): Promise<ImageData> {
  if (isImageData(source)) return source;

  if (typeof Blob !== "undefined" && source instanceof Blob) {
    return fromBlob(source);
  }

  const { width, height } = dimensionsOf(source);
  return readPixels(source as CanvasImageSource, width, height);
}

/**
 * Decode a blob (a `File` from an `<input>`, a paste, or a drop) into pixels.
 *
 * `createImageBitmap` is preferred — it decodes off the main thread and works
 * in a worker. The `<img>` fallback covers Safari versions that reject blobs
 * there, and is the reason this function is async at all.
 */
async function fromBlob(blob: Blob): Promise<ImageData> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    try {
      return readPixels(bitmap, bitmap.width, bitmap.height);
    } finally {
      // Bitmaps hold GPU memory until closed; a scanner reading a burst of
      // dropped files would otherwise pile up several megabytes each.
      bitmap.close();
    }
  }

  /* c8 ignore start -- the `<img>` fallback needs a real image decoder, which
     jsdom does not have; it is exercised in the browser QA pass instead. */
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new QRUnsupportedError("This environment cannot decode an image blob.");
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new QRUnsupportedError("The supplied file is not an image this browser can decode."));
      element.src = url;
    });
    return readPixels(image, image.naturalWidth, image.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
  /* c8 ignore stop */
}
