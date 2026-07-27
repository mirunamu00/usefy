import type { QRGradientDef, QRMatrix, QRStyleOptions } from "../types";
import { clampFinite } from "../types";
import { QRExportError } from "../errors";
import { linearEndpoints, radialGeometry } from "./gradient";
import { logoBox } from "./geometry";
import { matrixToPaths } from "./paths";
import { resolveStyle } from "./style";

/** Options for {@link drawToCanvas}. */
export interface CanvasRenderOptions extends QRStyleOptions {
  /** Rendered CSS size in px (square). @default one module ≈ 4px */
  size?: number;
  /** Backing-store scale. @default `min(devicePixelRatio, 2)` */
  dpr?: number;
  /**
   * A logo image that is already loaded. Canvas drawing is synchronous, so the
   * caller (or {@link toPNG}) owns the async load.
   */
  logoImage?: CanvasImageSource | null;
}

function defaultDpr(): number {
  return typeof devicePixelRatio === "number" ? Math.min(devicePixelRatio, 2) : 1;
}

/**
 * Resolve a fill string to something canvas understands. Path fills are either
 * a plain colour or a `url(#id)` reference into `defs`, exactly as in SVG —
 * translating here (rather than branching earlier) is what keeps one path list
 * feeding both renderers.
 */
function toCanvasFill(
  ctx: CanvasRenderingContext2D,
  fill: string,
  defs: QRGradientDef[],
): string | CanvasGradient {
  const reference = /^url\(#(.+)\)$/.exec(fill);
  if (!reference) return fill;
  const def = defs.find((candidate) => candidate.id === reference[1]);
  if (!def) return "#000000";

  const gradient =
    def.gradient.type === "radial"
      ? (() => {
          const { cx, cy, r } = radialGeometry(def.bounds);
          return ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        })()
      : (() => {
          const { x1, y1, x2, y2 } = linearEndpoints(def.bounds, def.gradient.rotation ?? 0);
          return ctx.createLinearGradient(x1, y1, x2, y2);
        })();

  for (const stop of def.gradient.stops) gradient.addColorStop(stop.offset, stop.color);
  return gradient;
}

/**
 * Draw a matrix into a 2D context, sizing the canvas's backing store for the
 * device pixel ratio.
 *
 * The geometry comes from the very same path strings the SVG renderer emits,
 * replayed through `Path2D` — so "rounded" or "classy" cannot mean two
 * different things in two different outputs.
 *
 * @example
 * ```ts
 * const ctx = canvas.getContext("2d")!;
 * drawToCanvas(ctx, encodeQR("https://usefy.dev"), { size: 256, moduleShape: "dot" });
 * ```
 */
export function drawToCanvas(
  ctx: CanvasRenderingContext2D,
  matrix: QRMatrix,
  options: CanvasRenderOptions = {},
): void {
  if (typeof Path2D === "undefined") {
    throw new QRExportError(
      "Canvas rendering requires Path2D. Use toSVG()/toSVGProps() in environments without it.",
    );
  }

  const style = resolveStyle(options);
  const side = matrix.size + style.margin * 2;
  const cssSize = clampFinite(options.size, side * 4, 1, 8192);
  const dpr = clampFinite(options.dpr, defaultDpr(), 0.5, 4);
  const pixels = Math.max(1, Math.round(cssSize * dpr));

  const canvas = ctx.canvas;
  if (canvas.width !== pixels || canvas.height !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pixels, pixels);
  const scale = pixels / side;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  if (style.bg) {
    ctx.fillStyle = style.bg;
    ctx.fillRect(0, 0, side, side);
  }

  const { paths, defs } = matrixToPaths(matrix, style);
  for (const path of paths) {
    ctx.fillStyle = toCanvasFill(ctx, path.fill, defs);
    ctx.fill(new Path2D(path.d));
  }

  const box = logoBox(matrix, style);
  if (box && options.logoImage) {
    ctx.save();
    if (box.shape === "circle") {
      ctx.beginPath();
      ctx.arc(box.x + box.width / 2, box.y + box.height / 2, box.width / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(options.logoImage, box.x, box.y, box.width, box.height);
    ctx.restore();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
