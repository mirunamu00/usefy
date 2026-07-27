/**
 * Colour safety and deterministic number formatting for every renderer.
 *
 * The same values reach SVG markup, a canvas `fillStyle`, and a PNG export, so
 * they are sanitized exactly **once** at resolve time (SPEC decision #8). If
 * each surface sanitized independently they could disagree, and a QR code
 * whose PNG differs from what the user sees on screen is a scanning bug
 * waiting to happen.
 */

/**
 * Charset whitelist: everything a real CSS colour needs (hex, functional
 * notation, percentages, spaces, slashes, dots, commas, named colours) and
 * nothing that is XML-active (`< > & " '`).
 */
const SAFE_COLOR = /^[#a-zA-Z0-9(),.%/\s-]+$/;

/**
 * Blocklist on top of the whitelist: `url(...)` passes the charset test but is
 * a paint-server reference, not a colour. An external `url(//evil/x.svg#g)` in
 * an exported SVG becomes a tracking beacon the moment the file is rendered,
 * which would break SPEC §9's "no network calls" guarantee. No legitimate CSS
 * *colour* ever contains `url(`.
 */
const URL_REFERENCE = /url\s*\(/i;

/** Default foreground — dark on light is the only reliably scannable polarity. */
export const DEFAULT_FG = "#000000";
/** Default background. */
export const DEFAULT_BG = "#ffffff";

/** Is `color` safe to serialize as a paint value? */
export function isSafeCssColor(color: unknown): color is string {
  return typeof color === "string" && SAFE_COLOR.test(color) && !URL_REFERENCE.test(color);
}

/**
 * Sanitize a foreground colour, falling back to a *visible* value.
 *
 * @example
 * ```ts
 * sanitizeColor("#0f172a");          // "#0f172a"
 * sanitizeColor('red"/><script>');   // "#000000"
 * sanitizeColor("url(#leak)");       // "#000000"
 * ```
 */
export function sanitizeColor(color: unknown, fallback: string = DEFAULT_FG): string {
  return isSafeCssColor(color) ? color : fallback;
}

/**
 * Sanitize a background colour. Unlike a foreground, an unsafe background is
 * *omitted* rather than replaced: substituting a default could paint dark on
 * dark and render the code unscannable, whereas transparent always leaves the
 * modules visible against the page.
 */
export function sanitizeBackground(color: unknown): string | null {
  if (color === null || color === undefined) return null;
  return isSafeCssColor(color) ? color : null;
}

/** Escape a string for embedding in XML text or an attribute value. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Deterministic number formatting: rounded to three decimals (sub-millimodule
 * precision is visual noise that only bloats the markup) with `-0` normalized
 * so golden path strings stay stable.
 */
export function fmt(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/**
 * Relative luminance (WCAG) of a colour this package can parse — hex and
 * `rgb()`/`rgba()`. Returns `null` for anything else (named colours, `hsl()`,
 * `color-mix()`), because guessing would produce false warnings.
 */
export function relativeLuminance(color: string): number | null {
  const rgb = parseRgb(color);
  if (!rgb) return null;
  const channel = (value: number): number => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

function parseRgb(color: string): [number, number, number] | null {
  const value = color.trim();

  const hex = /^#([0-9a-f]{3,8})$/i.exec(value);
  if (hex) {
    const digits = hex[1]!;
    if (digits.length === 3 || digits.length === 4) {
      return [
        parseInt(digits[0]! + digits[0]!, 16),
        parseInt(digits[1]! + digits[1]!, 16),
        parseInt(digits[2]! + digits[2]!, 16),
      ];
    }
    if (digits.length === 6 || digits.length === 8) {
      return [
        parseInt(digits.slice(0, 2), 16),
        parseInt(digits.slice(2, 4), 16),
        parseInt(digits.slice(4, 6), 16),
      ];
    }
    return null;
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(value);
  if (!rgb) return null;
  const parts = rgb[1]!.split(/[\s,/]+/).filter(Boolean).slice(0, 3);
  if (parts.length < 3) return null;
  const channels = parts.map((part) =>
    part.endsWith("%") ? (parseFloat(part) / 100) * 255 : parseFloat(part),
  );
  if (channels.some((c) => !Number.isFinite(c))) return null;
  return [channels[0]!, channels[1]!, channels[2]!];
}

/**
 * WCAG contrast ratio between two colours, or `null` when either cannot be
 * parsed. Scanners need a strong dark/light difference; SPEC §3.3 warns in
 * development below the practical floor.
 */
export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return null;
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
