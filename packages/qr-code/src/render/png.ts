import type { QRMatrix } from "../types";
import { clampInt } from "../types";
import { QRExportError } from "../errors";
import { type CanvasRenderOptions, drawToCanvas } from "./canvas";
import { loadImage } from "./logo";
import { resolveStyle } from "./style";

/** Options for {@link toPNG}. */
export interface PNGExportOptions extends CanvasRenderOptions {
  /** Output width and height in pixels. @default 512 */
  pixelSize?: number;
}

/** A rasterized QR code, as both a data URI and a `Blob`. */
export interface PNGExport {
  dataURL: string;
  blob: Blob;
}

function dataURLToBlob(dataURL: string): Blob {
  const comma = dataURL.indexOf(",");
  const header = dataURL.slice(0, comma);
  const body = dataURL.slice(comma + 1);
  const mime = /:(.*?);/.exec(header)?.[1] ?? "image/png";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Render a matrix to a PNG.
 *
 * Loads the logo (if any) first, draws through the shared canvas renderer, and
 * returns both a data URI and a `Blob` so the result is equally usable in an
 * `<img>`, an upload, and a download link.
 *
 * A **cross-origin logo taints the canvas** and makes the export impossible.
 * Rather than returning a blank image — the classic silent failure of this
 * feature — that case throws a {@link QRExportError} naming the fix: serve the
 * logo with CORS headers and set `logo.crossOrigin`, or inline it as a data
 * URI.
 *
 * @example
 * ```ts
 * const { dataURL, blob } = await toPNG(encodeQR("https://usefy.dev"), { pixelSize: 1024 });
 * ```
 */
export async function toPNG(
  matrix: QRMatrix,
  options: PNGExportOptions = {},
): Promise<PNGExport> {
  if (typeof document === "undefined") {
    throw new QRExportError("toPNG() requires a browser environment — use toSVG() on the server");
  }

  const style = resolveStyle(options);
  // Runs through the same guard as every other numeric option, so a NaN
  // exports at the documented default instead of silently at some other size.
  const pixelSize = clampInt(options.pixelSize, 512, 16, 8192);

  let logoImage: CanvasImageSource | null = options.logoImage ?? null;
  if (!logoImage && style.logo) {
    logoImage = await loadImage(style.logo.src, style.logo.crossOrigin);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new QRExportError("Could not acquire a 2D canvas context");

  drawToCanvas(ctx, matrix, { ...options, size: pixelSize, dpr: 1, logoImage });

  let dataURL: string;
  try {
    dataURL = canvas.toDataURL("image/png");
  } catch (cause) {
    throw new QRExportError(
      "Could not export the PNG: the canvas is tainted, which happens when the logo is " +
        "loaded cross-origin. Serve it with CORS headers and set logo.crossOrigin, or " +
        "embed the logo as a data URI.",
      cause,
    );
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    if (typeof canvas.toBlob !== "function") {
      resolve(null);
      return;
    }
    canvas.toBlob((result) => resolve(result), "image/png");
  });

  return { dataURL, blob: blob ?? dataURLToBlob(dataURL) };
}
