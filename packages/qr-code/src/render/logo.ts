import type { ErrorCorrectionLevel, LogoSafety, QRMatrix, QRStyleOptions } from "../types";
import { EC_LEVELS, EC_RECOVERY_RATIO } from "../encode/capacity";
import { QRExportError } from "../errors";
import { logoBox } from "./geometry";
import { resolveStyle } from "./style";

/**
 * Logo occlusion analysis.
 *
 * A centre logo works because Reed–Solomon can reconstruct the codewords it
 * hides — right up until it can't. This computes how much of the symbol a
 * given logo covers and compares it against what the chosen error-correction
 * level can actually absorb.
 *
 * The result is *reported*, never silently applied: quietly raising the EC
 * level would change the symbol's version and physical density behind the
 * caller's back (SPEC decision #7). Callers get a number and a
 * recommendation, and decide for themselves.
 */
export function logoSafety(matrix: QRMatrix, options: QRStyleOptions = {}): LogoSafety {
  const style = resolveStyle(options);
  const box = logoBox(matrix, style);
  const ecBudget = EC_RECOVERY_RATIO[matrix.level];

  if (!box) {
    return {
      occludedModules: 0,
      occludedRatio: 0,
      ecBudget,
      safe: true,
      recommendedLevel: matrix.level,
    };
  }

  // Counted independently of `excavate`: painting over a module hides it just
  // as thoroughly as clearing it.
  const { clear } = box;
  const centre = (matrix.size + style.margin * 2) / 2;
  const radius = clear.width / 2;
  let occludedModules = 0;

  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      const cx = style.margin + x + 0.5;
      const cy = style.margin + y + 0.5;
      const inside =
        box.shape === "circle"
          ? (cx - centre) ** 2 + (cy - centre) ** 2 <= radius * radius
          : cx >= clear.x && cx <= clear.x + clear.width && cy >= clear.y && cy <= clear.y + clear.height;
      if (inside) occludedModules++;
    }
  }

  const occludedRatio = occludedModules / (matrix.size * matrix.size);
  const recommendedLevel: ErrorCorrectionLevel | null =
    EC_LEVELS.find((level) => EC_RECOVERY_RATIO[level] >= occludedRatio) ?? null;

  return {
    occludedModules,
    occludedRatio,
    ecBudget,
    safe: occludedRatio <= ecBudget,
    recommendedLevel,
  };
}

/**
 * Load an image for raster export.
 *
 * Rejects with a {@link QRExportError} rather than a bare event, because "the
 * PNG came out blank" is otherwise one of the hardest things to diagnose in a
 * QR pipeline.
 */
export function loadImage(
  src: string,
  crossOrigin?: "anonymous" | "use-credentials",
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      reject(new QRExportError("Image loading requires a browser environment"));
      return;
    }
    const image = new Image();
    if (crossOrigin) image.crossOrigin = crossOrigin;
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new QRExportError(`Could not load the logo image at ${src.slice(0, 80)}`));
    image.src = src;
  });
}
