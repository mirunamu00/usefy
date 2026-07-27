import type {
  QREyeShape,
  QRGradient,
  QRLogoOptions,
  QRModuleShape,
  QRStyleOptions,
} from "../types";
import { clampFinite, clampInt } from "../types";
import {
  DEFAULT_BG,
  DEFAULT_FG,
  contrastRatio,
  isSafeCssColor,
  relativeLuminance,
  sanitizeBackground,
  sanitizeColor,
} from "./color";

/**
 * Option resolution: one pass that clamps every number, sanitizes every
 * colour, and hands the renderers a struct with no optional fields left to
 * re-interpret. Every surface (SVG, canvas, PNG) consumes the *same* resolved
 * object, which is what makes them agree by construction.
 */

const MODULE_SHAPES: readonly QRModuleShape[] = ["square", "rounded", "dot", "classy"];
const EYE_SHAPES: readonly QREyeShape[] = ["square", "rounded", "circle", "leaf"];

/** Below this WCAG ratio a code is at real risk of not scanning. */
export const MIN_SCANNABLE_CONTRAST = 3;
/** A logo may never cover more than this fraction of the code's width. */
export const MAX_LOGO_SIZE = 0.35;
/** The hard ceiling on `moduleGap`; see {@link MAX_SAFE_MODULE_GAP}. */
export const MAX_MODULE_GAP = 0.3;
/** The spec's minimum quiet zone, in modules. */
export const MIN_QUIET_ZONE = 4;

/**
 * The largest `moduleGap` each shape still decodes at reliably.
 *
 * **Measured, not assumed.** Each combination was rendered by this package in
 * a real browser, rasterized at 180/240/360/480/640 px, and decoded with a real
 * QR decoder. The table is the number of those five rasterizations that read
 * back correctly:
 *
 * | shape | 0 | 0.05 | 0.1 | 0.15 | 0.2 | 0.25 | 0.3 |
 * |---|---|---|---|---|---|---|---|
 * | square  | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 4/5 | 2/5 |
 * | rounded | 5/5 | 5/5 | 4/5 | 5/5 | 4/5 | 1/5 | 0/5 |
 * | classy  | 5/5 | 5/5 | 4/5 | 5/5 | 1/5 | 0/5 | 0/5 |
 * | dot     | 5/5 | 5/5 | 4/5 | 2/5 | 0/5 | 0/5 | 0/5 |
 *
 * The budgets below are the last gap that read back at *every* resolution.
 * Partial scores are the decoder's binarizer landing differently as the
 * module-to-pixel ratio shifts — which is exactly why a threshold has to be
 * checked at several sizes rather than one.
 *
 * Separated circles disturb timing-pattern detection far sooner than inset
 * squares do, which is why `dot` gets the tightest budget by a wide margin.
 *
 * Exceeding these warns in development rather than clamping: a code rendered
 * large or for print tolerates more than one on a phone screen, and silently
 * overriding an explicit value would be the more surprising behaviour.
 */
export const MAX_SAFE_MODULE_GAP: Record<QRModuleShape, number> = {
  square: 0.2,
  rounded: 0.15,
  classy: 0.15,
  dot: 0.05,
};

export interface ResolvedLogo {
  src: string;
  /** Width as a fraction of the rendered side, including the quiet zone. */
  size: number;
  excavate: boolean;
  padding: number;
  shape: "square" | "circle";
  crossOrigin?: "anonymous" | "use-credentials";
}

export interface ResolvedStyle {
  margin: number;
  /** Solid foreground; also the fallback paint when a gradient can't be used. */
  fg: string;
  /** Sanitized gradient, or `null` for a solid foreground. */
  fgGradient: QRGradient | null;
  bg: string | null;
  moduleShape: QRModuleShape;
  eyeShape: QREyeShape;
  /** Finder-ring paint; `null` means "same as the foreground". */
  eyeOuter: string | null;
  /** Finder-centre paint; `null` means "same as the foreground". */
  eyeInner: string | null;
  moduleGap: number;
  logo: ResolvedLogo | null;
}

function resolveGradient(gradient: QRGradient): QRGradient | null {
  const stops = gradient.stops
    .filter((stop) => isSafeCssColor(stop.color))
    .map((stop) => ({ offset: clampFinite(stop.offset, 0, 0, 1), color: stop.color }));
  // A gradient needs two stops to be a gradient; anything less falls back to a
  // solid colour rather than rendering an invisible code.
  if (stops.length < 2) return null;
  return {
    type: gradient.type === "radial" ? "radial" : "linear",
    rotation: clampFinite(gradient.rotation, 0, -360, 360),
    stops,
  };
}

function resolveLogo(logo: QRLogoOptions): ResolvedLogo | null {
  if (typeof logo.src !== "string" || logo.src.length === 0) return null;
  return {
    src: logo.src,
    size: clampFinite(logo.size, 0.2, 0.05, MAX_LOGO_SIZE),
    excavate: logo.excavate !== false,
    padding: clampFinite(logo.padding, 0.02, 0, 0.1),
    shape: logo.shape === "circle" ? "circle" : "square",
    ...(logo.crossOrigin ? { crossOrigin: logo.crossOrigin } : {}),
  };
}

/**
 * Normalize style options into the struct every renderer consumes.
 *
 * @example
 * ```ts
 * resolveStyle({ margin: NaN, fg: "url(#x)", moduleGap: 5 });
 * // → { margin: 4, fg: "#000000", moduleGap: 0.3, … }
 * ```
 */
export function resolveStyle(options: QRStyleOptions = {}): ResolvedStyle {
  const gradient =
    options.fg && typeof options.fg === "object" ? resolveGradient(options.fg) : null;
  // With a gradient, the solid `fg` becomes the canvas/PNG fallback and the
  // colour a contrast check can reason about: its first stop.
  const fg = gradient
    ? sanitizeColor(gradient.stops[0]!.color)
    : sanitizeColor(typeof options.fg === "string" ? options.fg : DEFAULT_FG);

  const bg =
    options.bg === undefined ? DEFAULT_BG : options.bg === null ? null : sanitizeBackground(options.bg);

  return {
    margin: clampInt(options.margin, 4, 0, 64),
    fg,
    fgGradient: gradient,
    bg,
    moduleShape: MODULE_SHAPES.includes(options.moduleShape!) ? options.moduleShape! : "square",
    eyeShape: EYE_SHAPES.includes(options.eyeShape!) ? options.eyeShape! : "square",
    eyeOuter: isSafeCssColor(options.eyeColor?.outer) ? options.eyeColor!.outer! : null,
    eyeInner: isSafeCssColor(options.eyeColor?.inner) ? options.eyeColor!.inner! : null,
    moduleGap: clampFinite(options.moduleGap, 0, 0, MAX_MODULE_GAP),
    logo: options.logo ? resolveLogo(options.logo) : null,
  };
}

/**
 * The *worst* foreground/background contrast in a style — and which colour
 * produces it.
 *
 * For a gradient this examines every stop, not just the first. A gradient that
 * starts at a strong navy and fades to pale pink is perfectly legible where it
 * starts and unreadable where it ends; judging it by its first stop alone
 * would wave through exactly the codes most likely to fail a scanner.
 *
 * Stops in a colour format this package cannot parse are skipped rather than
 * poisoning the result — see `relativeLuminance`.
 */
export function worstContrast(
  style: ResolvedStyle,
): { ratio: number; color: string } | null {
  const background = style.bg ?? DEFAULT_BG;
  const colors = style.fgGradient ? style.fgGradient.stops.map((stop) => stop.color) : [style.fg];

  let worst: { ratio: number; color: string } | null = null;
  for (const color of colors) {
    const ratio = contrastRatio(color, background);
    if (ratio === null) continue;
    if (worst === null || ratio < worst.ratio) worst = { ratio, color };
  }
  return worst;
}

/**
 * Contrast between the resolved foreground and background, or `null` when no
 * colour involved could be parsed. For a gradient this is its worst stop.
 */
export function styleContrast(style: ResolvedStyle): number | null {
  return worstContrast(style)?.ratio ?? null;
}

/**
 * The lightest foreground colour in a style — for a gradient, its lightest
 * stop rather than its first.
 *
 * Polarity has the same trap as contrast: a gradient may start at a strong
 * navy and end at near-white, and judging it by `fg` alone would miss that
 * most of the code is painted lighter than its background.
 */
export function lightestForeground(
  style: ResolvedStyle,
): { luminance: number; color: string } | null {
  const colors = style.fgGradient ? style.fgGradient.stops.map((stop) => stop.color) : [style.fg];

  let lightest: { luminance: number; color: string } | null = null;
  for (const color of colors) {
    const luminance = relativeLuminance(color);
    if (luminance === null) continue;
    if (lightest === null || luminance > lightest.luminance) lightest = { luminance, color };
  }
  return lightest;
}
