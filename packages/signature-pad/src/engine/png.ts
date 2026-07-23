/**
 * PNG export — offscreen replay of the committed strokes through the
 * exact same render pipeline as the visible canvas ({@link replayStrokes}),
 * at an arbitrary `scale`, optionally trimmed to the ink bounding box.
 *
 * Needs a DOM (it creates an offscreen `<canvas>`); importing the module
 * is SSR-safe. The blob is produced via `canvas.toBlob` when available,
 * with a base64 `dataURL` decode fallback for environments without it
 * (jsdom) — real-browser output verification lands in Phase 4 QA.
 */
import {
  DEFAULT_EXPORT_PADDING,
  toFinite,
  type PNGExportOptions,
  type SignatureStroke,
} from "../types";
import { exportBounds, type Rect } from "../ink/bounds";
import { isSafeCssColor } from "../ink/svg";
import { replayStrokes } from "./render";

/** Everything the engine hands over for one export. */
export interface PNGRenderInput {
  /** Document used to create the offscreen canvas. */
  ownerDocument: Document;
  /** Committed strokes only (a mid-stroke export is a race by definition). */
  strokes: readonly SignatureStroke[];
  /** CSS-px canvas viewport (the `trim: false` region). */
  viewWidth: number;
  viewHeight: number;
  /** Engine `background` option — the default export background. */
  defaultBackground: string | undefined;
  /** Engine effective devicePixelRatio — the default `scale`. */
  defaultScale: number;
}

/** Decode a base64 PNG data URL into a Blob (toBlob fallback). */
export function dataURLToBlob(dataURL: string): Blob {
  const base64 = dataURL.slice(dataURL.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

/**
 * Read-back validity probe: does assigning `color` to `fillStyle`
 * actually take? A real canvas silently ignores invalid assignments
 * (e.g. the typo `"#ffg"`), keeping the previous value — painting after
 * that would fill with near-black instead of the intended color, while
 * the SVG exporter renders the same document transparent. Two sentinels
 * make the probe collision-proof: an ignored assignment reads back a
 * DIFFERENT value per sentinel; a valid color reads back the same
 * normalized value both times. Environments whose fillStyle does not
 * normalize (jsdom, test doubles) read back the raw string both times —
 * the probe then always passes, never false-negating a valid color.
 */
function fillStyleTakes(ctx: CanvasRenderingContext2D, color: string): boolean {
  ctx.fillStyle = "#000000";
  ctx.fillStyle = color;
  const first = ctx.fillStyle;
  ctx.fillStyle = "#ffffff";
  ctx.fillStyle = color;
  return first === ctx.fillStyle;
}

function canvasBlob(canvas: HTMLCanvasElement, dataURL: string): Promise<Blob> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob === "function") {
      try {
        canvas.toBlob((blob) => resolve(blob ?? dataURLToBlob(dataURL)), "image/png");
        return;
      } catch {
        /* jsdom without canvas support — fall through to the decode path */
      }
    }
    resolve(dataURLToBlob(dataURL));
  });
}

/**
 * Render strokes to a PNG `{ dataURL, blob }`.
 *
 * - `trim` (default `true`): crop to {@link inkBounds} inflated by
 *   `padding` (default 8 px). An empty document yields a minimal 1×1
 *   transparent artifact — never throws. `trim: false` exports the full
 *   canvas viewport.
 * - `scale` (default: the engine's devicePixelRatio): output resolution
 *   multiplier (clamped to ≥ 0.1; NaN/Infinity fall back).
 * - `background` (default: the engine's `background` option): fill
 *   painted beneath the ink; omit both for a transparent PNG.
 *
 * @example
 * ```ts
 * const { dataURL, blob } = await engine.toPNG({ scale: 2, background: "#fff" });
 * downloadLink.href = dataURL;
 * await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
 * ```
 */
export async function exportPNG(
  input: PNGRenderInput,
  opts: PNGExportOptions = {},
): Promise<{ dataURL: string; blob: Blob }> {
  const trim = opts.trim !== false;
  const padding = Math.max(0, toFinite(opts.padding, DEFAULT_EXPORT_PADDING));
  const scale = Math.max(0.1, toFinite(opts.scale, input.defaultScale));
  // Same semantics as the SVG exporter: an UNSAFE background string means
  // "transparent" (omitted), never a color substitute — on canvas an
  // invalid fillStyle assignment is ignored, which would silently paint
  // with the context's previous (near-black) fill instead.
  const requested =
    typeof opts.background === "string" ? opts.background : input.defaultBackground;
  const background =
    requested !== undefined && isSafeCssColor(requested) ? requested : undefined;

  // exportBounds floors the inflation by the round caps' slack — keeps
  // the PNG crop identical to the SVG viewBox (parity), incl. padding: 0.
  const region: Rect = trim
    ? exportBounds(input.strokes, padding) ?? { x: 0, y: 0, width: 1, height: 1 }
    : { x: 0, y: 0, width: Math.max(1, input.viewWidth), height: Math.max(1, input.viewHeight) };

  const off = input.ownerDocument.createElement("canvas");
  off.width = Math.max(1, Math.round(region.width * scale));
  off.height = Math.max(1, Math.round(region.height * scale));
  const ctx = off.getContext("2d");
  if (!ctx) {
    throw new Error("@usefy/signature-pad: toPNG: no 2D context");
  }
  // Map CSS-px stroke coordinates into the scaled, region-cropped store.
  ctx.setTransform(scale, 0, 0, scale, -region.x * scale, -region.y * scale);
  if (background !== undefined && fillStyleTakes(ctx, background)) {
    ctx.fillStyle = background;
    ctx.fillRect(region.x, region.y, region.width, region.height);
  }
  replayStrokes(ctx, input.strokes);

  const dataURL = off.toDataURL("image/png");
  const blob = await canvasBlob(off, dataURL);
  return { dataURL, blob };
}
