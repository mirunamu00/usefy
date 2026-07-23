/**
 * `imageShape` — image confetti (logos, avatars, stickers).
 *
 * Async decode is handled through the sprite cache's null-retry contract:
 * until the image has loaded, `rasterize` returns `null` and the particle
 * simply isn't drawn — no placeholder flash, no throw. Load errors are a
 * silent permanent skip (confetti must never take the page down).
 *
 * SSR-safe: no `Image` construction at import time, and `rasterize`
 * returns `null` in environments without one.
 */
import { toFinite, type SpriteEntry, type SpriteShape } from "../types";

/**
 * Options for {@link imageShape}.
 *
 * Provide `width` and/or `height` in CSS px at `scalar: 1`; a missing
 * dimension is derived from the image's natural aspect ratio. With neither
 * given, the image is sized to {@link DEFAULT_IMAGE_HEIGHT} px tall.
 *
 * @example
 * ```ts
 * imageShape("/logo.svg", { height: 16 });
 * ```
 */
export interface ImageShapeOptions {
  /** Drawn width in CSS px at `scalar: 1`. */
  width?: number;
  /** Drawn height in CSS px at `scalar: 1`. */
  height?: number;
}

/** Default drawn height (CSS px at `scalar: 1`) when no size is given. */
export const DEFAULT_IMAGE_HEIGHT = 12;

let anonymousElementCounter = 0;

/**
 * Create an image confetti shape from a URL or an existing
 * `HTMLImageElement`. Loading starts lazily on the first draw that needs
 * the sprite; particles are skipped (not delayed, not errored) until the
 * image is ready.
 *
 * @param src - Image URL, or an `HTMLImageElement` you manage yourself.
 * @param options - Target size, see {@link ImageShapeOptions}.
 * @returns A {@link SpriteShape} usable anywhere a `ConfettiShape` goes.
 *
 * @example
 * ```ts
 * import { fireConfetti, imageShape } from "@usefy/confetti";
 *
 * fireConfetti({ shapes: [imageShape("/logo.png", { height: 14 })] });
 * ```
 */
export function imageShape(
  src: string | HTMLImageElement,
  options: ImageShapeOptions = {},
): SpriteShape {
  const isElement =
    typeof HTMLImageElement !== "undefined" && src instanceof HTMLImageElement;
  const url = isElement ? src.src : (src as string);
  let img: HTMLImageElement | null = isElement ? src : null;
  let failed = false;
  let cached: SpriteEntry | null = null;

  const identity = url || `element#${++anonymousElementCounter}`;

  return {
    key: `usefy-image:${identity}|${options.width ?? ""}x${options.height ?? ""}`,
    rasterize(): SpriteEntry | null {
      if (cached) return cached;
      if (failed) return null; // permanent silent skip

      if (!img) {
        if (typeof Image === "undefined") return null; // SSR — retry client-side
        // Note: each imageShape() call owns one Image, so two shapes made
        // from the same URL decode it twice. Bounded and deliberate — the
        // browser's HTTP cache dedupes the network fetch, the sprite cache
        // dedupes per shape key, and sharing decode state across factory
        // calls would need module-global bookkeeping for a rare case.
        img = new Image();
        img.decoding = "async";
        img.addEventListener("error", () => {
          failed = true;
        });
        img.src = url;
      }
      if (!img.complete || !img.naturalWidth) return null; // still decoding

      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight || naturalW;
      let width = toFinite(options.width, NaN);
      let height = toFinite(options.height, NaN);
      if (Number.isNaN(width) && Number.isNaN(height)) {
        height = DEFAULT_IMAGE_HEIGHT;
      }
      if (Number.isNaN(width)) width = (height * naturalW) / naturalH;
      if (Number.isNaN(height)) height = (width * naturalH) / naturalW;

      cached = { source: img, width, height };
      return cached;
    },
  };
}
