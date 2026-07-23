/**
 * SVG export — strokes → a standalone `<svg>` string built from the SAME
 * segment geometry the canvas renders ({@link strokeGeometry}), so the
 * vector output mirrors the on-screen ink by construction (SPEC §3.3
 * "geometry parity", resolved decision #7).
 *
 * Pure and framework-free: builds a string from numbers and a fixed
 * template. Colors pass through a sanitizing whitelist so no markup can
 * be injected via `penColor` or `fromJSON` data (SPEC §9).
 */
import {
  DEFAULT_EXPORT_PADDING,
  DEFAULT_PEN_COLOR,
  toFinite,
  type SignatureData,
  type SVGExportOptions,
} from "../types";
import type { BezierSegment } from "./bezier";
import { exportBounds, type Rect } from "./bounds";
import { strokeGeometry } from "./strokeWalker";

/**
 * Characters allowed in a serialized color: enough for every plausible
 * CSS color syntax (`#hex`, `rgb()/rgba()/hsl()/oklch()` with numbers,
 * percentages, spaces, slashes, dots and commas, plus named colors) while
 * excluding everything XML-active (`< > & " '`).
 */
const SAFE_COLOR = /^[#a-zA-Z0-9(),.%/\s-]+$/;

/**
 * Blocklist on top of the whitelist: `url(...)` is charset-legal but is a
 * PAINT-SERVER REFERENCE, not a color — an external `url(//evil/leak.svg#g)`
 * in an exported SVG becomes a tracking beacon when the SVG is rendered
 * (violates SPEC §9 "no network calls"). No legitimate CSS *color* ever
 * contains `url(`.
 */
const URL_REFERENCE = /url\s*\(/i;

/**
 * Is `color` safe to serialize as a paint value? (Charset whitelist +
 * `url(...)` blocklist.) Shared with the PNG exporter so an unsafe
 * background means "transparent" in both formats.
 */
export function isSafeCssColor(color: string): boolean {
  return typeof color === "string" && SAFE_COLOR.test(color) && !URL_REFERENCE.test(color);
}

/**
 * Sanitize an INK color for embedding in SVG markup: values that fail
 * {@link isSafeCssColor} (hostile markup, `url(...)` paint-server
 * references, empty/non-string) fall back to a visible pen color — a
 * hostile `penColor`/`fromJSON` string can never break out of an
 * attribute or trigger a network fetch (SPEC §9).
 *
 * Note this fallback is for INK only — an unsafe *background* is instead
 * omitted entirely (transparent), because falling back to a near-black
 * pen color under near-black ink would render the signature invisible.
 *
 * @example
 * ```ts
 * sanitizeColor("#1e293b");            // "#1e293b"
 * sanitizeColor("rgb(255, 0, 0)");     // "rgb(255, 0, 0)"
 * sanitizeColor('red"/><script>');     // "#1e293b" (fallback)
 * sanitizeColor("url(#gradient)");     // "#1e293b" (fallback)
 * ```
 */
export function sanitizeColor(color: string, fallback: string = DEFAULT_PEN_COLOR): string {
  return isSafeCssColor(color) ? color : fallback;
}

/**
 * Deterministic number formatting: rounded to 3 decimals (sub-millipixel
 * precision is visual noise and bloats the markup), `-0` normalized.
 */
function fmt(n: number): string {
  const rounded = Math.round(n * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** `d` attribute for one cubic segment. */
function pathD(b: BezierSegment): string {
  return (
    `M ${fmt(b.start.x)} ${fmt(b.start.y)} ` +
    `C ${fmt(b.c1.x)} ${fmt(b.c1.y)}, ${fmt(b.c2.x)} ${fmt(b.c2.y)}, ${fmt(b.end.x)} ${fmt(b.end.y)}`
  );
}

/**
 * Serialize a signature document as a standalone SVG string.
 *
 * Fidelity model (documented tradeoff): each Bézier segment becomes one
 * round-capped `<path>` whose constant `stroke-width` is the segment's
 * **mean diameter** (`startWidth + endWidth` — widths are radii).
 * Segments span adjacent filtered input points, so within-segment width
 * variation is visually negligible, and the round caps overlap exactly
 * like the canvas's stamped dots — a faithful vector twin at a fraction
 * of the size of per-dot circles. Single-point taps become a `<circle>`
 * of the dot radius.
 *
 * Layout: `trim: true` (default) crops the `viewBox` to
 * {@link inkBounds} inflated by `padding` (default 8); `trim: false`
 * uses the document's full capture-time canvas (`data.width/height`).
 * An empty document yields a minimal valid `viewBox="0 0 1 1"` SVG —
 * never throws. `background` (optional) is painted as a full-box
 * `<rect>` beneath the ink.
 *
 * @example
 * ```ts
 * import { strokesToSVG } from "@usefy/signature-pad/headless";
 *
 * const svg = strokesToSVG(engine.toJSON(), { background: "#fff" });
 * // "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>...</svg>"
 * ```
 */
export function strokesToSVG(data: SignatureData, opts: SVGExportOptions = {}): string {
  if (typeof data !== "object" || data === null || !Array.isArray(data.strokes)) {
    throw new TypeError("@usefy/signature-pad: strokesToSVG: invalid SignatureData");
  }
  const trim = opts.trim !== false;
  const padding = Math.max(0, toFinite(opts.padding, DEFAULT_EXPORT_PADDING));

  let box: Rect;
  if (trim) {
    // exportBounds floors the inflation by the round caps' slack so caps
    // are never clipped, even at padding: 0.
    box = exportBounds(data.strokes, padding) ?? { x: 0, y: 0, width: 1, height: 1 };
  } else {
    box = {
      x: 0,
      y: 0,
      width: Math.max(1, toFinite(data.width, 1)),
      height: Math.max(1, toFinite(data.height, 1)),
    };
  }

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(box.width)}" height="${fmt(
      box.height,
    )}" viewBox="${fmt(box.x)} ${fmt(box.y)} ${fmt(box.width)} ${fmt(box.height)}">`,
  ];

  // An unsafe background is OMITTED (transparent), never substituted:
  // falling back to the pen color would paint a near-black rect under
  // near-black ink — an invisible signature.
  if (typeof opts.background === "string" && isSafeCssColor(opts.background)) {
    parts.push(
      `<rect x="${fmt(box.x)}" y="${fmt(box.y)}" width="${fmt(box.width)}" height="${fmt(
        box.height,
      )}" fill="${opts.background}"/>`,
    );
  }

  for (const stroke of data.strokes) {
    const color = sanitizeColor(stroke.color);
    const { segments, dot } = strokeGeometry(stroke);
    if (dot) {
      parts.push(`<circle cx="${fmt(dot.x)}" cy="${fmt(dot.y)}" r="${fmt(dot.width)}" fill="${color}"/>`);
      continue;
    }
    if (segments.length === 0) continue;
    parts.push(`<g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">`);
    for (const segment of segments) {
      parts.push(
        `<path d="${pathD(segment.bezier)}" stroke-width="${fmt(
          segment.startWidth + segment.endWidth,
        )}"/>`,
      );
    }
    parts.push("</g>");
  }

  parts.push("</svg>");
  return parts.join("");
}
