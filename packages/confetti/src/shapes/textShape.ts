/**
 * `textShape` — emoji/text confetti. The text is rasterized ONCE to an
 * offscreen canvas sprite (at device-pixel-ratio resolution so it stays
 * sharp on retina screens) and drawn via the sprite cache thereafter, with
 * full per-particle rotation/tumble/scalar.
 *
 * SSR-safe: nothing touches `document` until the sprite is first needed
 * inside a browser draw loop.
 */
import { toFinite, type SpriteEntry, type SpriteShape } from "../types";

/**
 * Options for {@link textShape}.
 *
 * @example
 * ```ts
 * textShape("🎉", { size: 24 });
 * textShape("W", { size: 18, color: "#4f8ef7", fontWeight: 700 });
 * ```
 */
export interface TextShapeOptions {
  /** Font size in CSS px at `scalar: 1`. Default `14`. */
  size?: number;
  /** CSS font-family. Default: an emoji-capable system stack. */
  fontFamily?: string;
  /** Fill color for plain text (color emoji glyphs ignore it). Default `"#000000"`. */
  color?: string;
  /** CSS font-weight. Default `"normal"`. */
  fontWeight?: string | number;
}

/** Emoji-capable default font stack. */
const DEFAULT_FONT_FAMILY =
  '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", system-ui, sans-serif';

/** Raster resolution is capped here (device px per CSS px), like the engine's DPR cap. */
const MAX_RASTER_DPR = 2;

/**
 * Cap on the scalar-driven raster headroom. A `scalar: 50` particle must
 * not allocate a 50×-resolution bitmap — beyond ×4 the memory cost
 * outweighs any visible sharpness gain.
 */
const MAX_SCALAR_HEADROOM = 4;

/**
 * Create an emoji/text confetti shape. The glyph rasters once per shape
 * (cached by key) — a burst of 500 "🎉" costs one raster and 500
 * `drawImage` calls per frame.
 *
 * @param text - The text to render — typically a single emoji or character.
 * @param options - Size/font/color, see {@link TextShapeOptions}.
 * @returns A {@link SpriteShape} usable anywhere a `ConfettiShape` goes.
 *
 * @example
 * ```ts
 * import { fireConfetti, textShape } from "@usefy/confetti";
 *
 * fireConfetti({ shapes: [textShape("🎉"), textShape("🎊", { size: 20 })] });
 * ```
 */
export function textShape(
  text: string,
  options: TextShapeOptions = {},
): SpriteShape {
  const size = Math.max(1, toFinite(options.size, 14));
  const fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;
  const color = options.color ?? "#000000";
  const fontWeight = options.fontWeight ?? "normal";
  let cached: SpriteEntry | null = null;

  return {
    key: `usefy-text:${text}|${size}|${fontWeight}|${fontFamily}|${color}`,
    rasterize(scalar: number): SpriteEntry | null {
      if (cached) return cached;
      if (typeof document === "undefined") return null; // SSR — retry client-side

      const dpr =
        typeof window !== "undefined" && window.devicePixelRatio
          ? Math.min(window.devicePixelRatio, MAX_RASTER_DPR)
          : 1;
      // Device px per CSS px, with headroom when the first particle is
      // enlarged (scalar > 1) so upscaling never blurs — capped at ×4 so a
      // huge scalar can't allocate a giant bitmap.
      const resolution =
        Math.max(1, dpr) *
        Math.min(Math.max(1, toFinite(scalar, 1)), MAX_SCALAR_HEADROOM);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const font = `${fontWeight} ${size * resolution}px ${fontFamily}`;
      ctx.font = font;
      const metrics = ctx.measureText(text);
      const ascent =
        metrics.actualBoundingBoxAscent ?? size * resolution * 0.8;
      const descent =
        metrics.actualBoundingBoxDescent ?? size * resolution * 0.25;
      const widthDev = Math.max(1, Math.ceil(metrics.width || size * resolution));
      const heightDev = Math.max(1, Math.ceil(ascent + descent));
      const pad = Math.ceil(resolution); // ~1 CSS px guard against clipping

      canvas.width = widthDev + pad * 2;
      canvas.height = heightDev + pad * 2;
      // Resizing the canvas reset its state — set the text state again.
      ctx.font = font;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = color;
      ctx.fillText(text, pad, pad + ascent);

      cached = {
        source: canvas,
        // Logical (CSS px) size at scalar 1 — the renderer applies each
        // particle's own scalar on top.
        width: canvas.width / resolution,
        height: canvas.height / resolution,
      };
      return cached;
    },
  };
}
