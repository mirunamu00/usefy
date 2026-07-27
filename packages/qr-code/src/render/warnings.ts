import type { QRMatrix, QRStyleOptions } from "../types";
import { relativeLuminance } from "./color";
import { logoSafety } from "./logo";
import {
  MAX_SAFE_MODULE_GAP,
  MIN_QUIET_ZONE,
  MIN_SCANNABLE_CONTRAST,
  lightestForeground,
  resolveStyle,
  worstContrast,
} from "./style";

/**
 * Development-time scannability diagnostics.
 *
 * A QR code fails silently: it renders beautifully and simply doesn't scan,
 * and the author usually finds out from a user, not from their own phone.
 * These warnings turn the two most common causes — a logo bigger than the
 * error correction can absorb, and foreground/background colours too close
 * together — into something you notice while building.
 *
 * Nothing here changes what is rendered. Auto-raising the EC level or
 * "correcting" a brand colour would surprise the caller far more than a
 * console warning does (SPEC decision #7).
 */

/**
 * Declared locally so the package needs no Node type dependency, while the
 * literal `process.env.NODE_ENV` text is still what bundlers look for and
 * replace — which is what lets them drop this whole path from a production
 * build.
 */
declare const process: { env?: { NODE_ENV?: string } } | undefined;

/**
 * `process` is not defined in a plain browser without a bundler, so this is
 * guarded rather than read directly — a diagnostic must never be the thing
 * that crashes the page it was meant to help debug.
 */
function isProduction(): boolean {
  return typeof process !== "undefined" && process.env?.NODE_ENV === "production";
}

const warned = new Set<string>();
/** Bounded so a dev app animating colours cannot grow this without limit. */
const WARN_MEMO_LIMIT = 64;

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  if (warned.size >= WARN_MEMO_LIMIT) warned.clear();
  warned.add(key);
  // eslint-disable-next-line no-console
  console.warn(`[@usefy/qr-code] ${message}`);
}

const percent = (value: number): string => `${(value * 100).toFixed(1)}%`;

/** Warn when a logo occludes more than the error-correction level can recover. */
export function warnUnsafeLogo(matrix: QRMatrix, options: QRStyleOptions): void {
  if (!options.logo) return;
  const safety = logoSafety(matrix, options);
  if (safety.safe) return;

  const remedy = safety.recommendedLevel
    ? `use level "${safety.recommendedLevel}"`
    : "shrink the logo";
  warnOnce(
    `logo:${matrix.level}:${safety.occludedRatio.toFixed(3)}`,
    `The logo covers ${percent(safety.occludedRatio)} of the symbol, but error-correction ` +
      `level "${matrix.level}" only recovers about ${percent(safety.ecBudget)}. Scanners may ` +
      `fail to read this code — ${remedy}, or reduce logo.padding.`,
  );
}

/** Warn when the foreground and background are too close to tell apart. */
export function warnLowContrast(options: QRStyleOptions): void {
  const style = resolveStyle(options);
  const worst = worstContrast(style);
  // `null` means no colour involved is in a format this package parses —
  // staying quiet beats crying wolf about a perfectly good `hsl()` value.
  if (worst === null || worst.ratio >= MIN_SCANNABLE_CONTRAST) return;

  const subject = style.fgGradient
    ? `The gradient's ${worst.color} stop and the background`
    : `The foreground (${worst.color}) and background`;

  warnOnce(
    `contrast:${worst.color}:${style.bg}`,
    `${subject} (${style.bg ?? "transparent"}) have a contrast ratio of ` +
      `${worst.ratio.toFixed(2)}:1, below the ${MIN_SCANNABLE_CONTRAST}:1 scanners need. ` +
      `Use a darker foreground on a lighter background.`,
  );
}

/**
 * Warn when the foreground is *lighter* than the background.
 *
 * The contrast ratio is symmetric, so an inverted code — white modules on
 * black — scores a perfect 21:1 and passes the contrast check while being
 * unreliable in practice: scanners are specified for dark modules on a light
 * field, and many refuse an inverted symbol outright.
 */
export function warnInvertedPolarity(options: QRStyleOptions): void {
  const style = resolveStyle(options);
  // The lightest stop, not the first: a gradient can start dark and end pale,
  // and it is the pale end that a scanner loses against a light background.
  const foreground = lightestForeground(style);
  const background = relativeLuminance(style.bg ?? "#ffffff");
  if (foreground === null || background === null || foreground.luminance <= background) return;

  const subject = style.fgGradient
    ? `The gradient's ${foreground.color} stop is lighter`
    : `The foreground (${foreground.color}) is lighter`;

  warnOnce(
    `polarity:${foreground.color}:${style.bg}`,
    `${subject} than the background (${style.bg ?? "transparent"}). Scanners expect dark modules ` +
      `on a light field and many will not read an inverted code — swap the two colours.`,
  );
}

/** Warn when the quiet zone is below the four modules the spec requires. */
export function warnQuietZone(options: QRStyleOptions): void {
  const style = resolveStyle(options);
  if (style.margin >= MIN_QUIET_ZONE) return;

  warnOnce(
    `margin:${style.margin}`,
    `The quiet zone is ${style.margin} module${style.margin === 1 ? "" : "s"}; the specification ` +
      `requires ${MIN_QUIET_ZONE}. Scanners need that clear border to find the symbol against ` +
      `whatever surrounds it.`,
  );
}

/**
 * Warn when `moduleGap` is pushed past what the chosen shape survives.
 *
 * The thresholds in {@link MAX_SAFE_MODULE_GAP} come from decoding real
 * rendered output at several resolutions — see that constant for the table.
 */
export function warnModuleGap(options: QRStyleOptions): void {
  const style = resolveStyle(options);
  const safe = MAX_SAFE_MODULE_GAP[style.moduleShape];
  if (style.moduleGap <= safe) return;

  warnOnce(
    `gap:${style.moduleShape}:${style.moduleGap}`,
    `A moduleGap of ${style.moduleGap} with "${style.moduleShape}" modules stops decoding ` +
      `reliably at some rendered sizes; measured safe up to ${safe}. Reduce the gap, or switch ` +
      `to "square" modules, which tolerate the most.`,
  );
}

/**
 * Run every scannability check. Called by the React layer on each distinct
 * configuration; a no-op in production.
 */
export function warnScannability(matrix: QRMatrix, options: QRStyleOptions): void {
  if (isProduction()) return;
  warnUnsafeLogo(matrix, options);
  warnLowContrast(options);
  warnInvertedPolarity(options);
  warnQuietZone(options);
  warnModuleGap(options);
}

/** Reset the warn-once memo. Testing seam. */
export function resetWarnings(): void {
  warned.clear();
}
