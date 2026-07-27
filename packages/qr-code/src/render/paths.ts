import type { QRGradientDef, QRMatrix, QRPath } from "../types";
import type { ResolvedStyle } from "./style";
import { buildModuleField, eyeOrigins, horizontalRuns } from "./geometry";
import { gradientId } from "./ids";
import { eyeInnerPath, eyeOuterPath, modulePath, rectPath } from "./shapes";

/** Paths plus any gradient definitions they reference. */
export interface RenderedPaths {
  paths: QRPath[];
  defs: QRGradientDef[];
}

/**
 * Can this style be drawn as merged horizontal runs?
 *
 * Run-merging is what keeps a default code at a few dozen path commands
 * instead of one rectangle per module, but it is only *correct* for shapes
 * that tile seamlessly: the moment modules are inset or rounded, each one has
 * its own outline and merging would erase the gaps that define the style.
 */
function canMergeRuns(style: ResolvedStyle): boolean {
  return style.moduleShape === "square" && style.moduleGap === 0;
}

/**
 * Turn a matrix into fill paths.
 *
 * Data modules, finder rings and finder centres are built as three groups so
 * each can take its own colour; groups that end up with the *same* fill are
 * merged back into a single path, so the common case — one colour, square
 * modules — emits exactly one `<path>`.
 *
 * The finder patterns are never excavated by a logo: they are what a scanner
 * uses to locate the symbol at all, and clearing them trades a decorative
 * detail for a code that cannot be found.
 */
export function matrixToPaths(matrix: QRMatrix, style: ResolvedStyle): RenderedPaths {
  const field = buildModuleField(matrix, style);
  const { margin, size } = field;

  const defs: QRGradientDef[] = [];
  let foreground = style.fg;
  if (style.fgGradient) {
    const id = gradientId(style.fgGradient);
    foreground = `url(#${id})`;
    defs.push({
      id,
      gradient: style.fgGradient,
      bounds: { x: 0, y: 0, width: field.side, height: field.side },
    });
  }

  // Data modules.
  let data = "";
  if (canMergeRuns(style)) {
    for (const run of horizontalRuns(field)) {
      data += rectPath(margin + run.x, margin + run.y, run.length, 1);
    }
  } else {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!field.isDark(x, y)) continue;
        data += modulePath(style.moduleShape, margin + x, margin + y, style.moduleGap, {
          up: field.isDark(x, y - 1),
          down: field.isDark(x, y + 1),
          left: field.isDark(x - 1, y),
          right: field.isDark(x + 1, y),
        });
      }
    }
  }

  // Finder patterns.
  let outer = "";
  let inner = "";
  for (const [ox, oy] of eyeOrigins(size)) {
    outer += eyeOuterPath(style.eyeShape, margin + ox, margin + oy);
    inner += eyeInnerPath(style.eyeShape, margin + ox, margin + oy);
  }

  const groups: QRPath[] = [
    { d: data, fill: foreground },
    { d: outer, fill: style.eyeOuter ?? foreground },
    { d: inner, fill: style.eyeInner ?? foreground },
  ].filter((group) => group.d.length > 0);

  // Collapse neighbouring groups that share a fill.
  const paths: QRPath[] = [];
  for (const group of groups) {
    const previous = paths[paths.length - 1];
    if (previous && previous.fill === group.fill) previous.d += group.d;
    else paths.push({ ...group });
  }

  return { paths, defs };
}
