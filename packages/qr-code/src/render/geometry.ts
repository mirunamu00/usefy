import type { QRMatrix } from "../types";
import type { ResolvedLogo, ResolvedStyle } from "./style";

/**
 * The layer between "which modules are dark" and "what shapes to draw".
 *
 * Two things complicate a QR renderer beyond a grid of squares: the three
 * finder patterns are drawn as *eyes* (their own shape and colour) rather than
 * 49 individual modules each, and a logo may excavate the modules beneath it.
 * Both decisions are made once, here, so the SVG, canvas and PNG paths can
 * never disagree about which module belongs to what.
 */

/** Top-left corners of the three 7×7 finder patterns. */
export function eyeOrigins(size: number): Array<readonly [number, number]> {
  return [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];
}

/** Does this module belong to one of the three finder patterns? */
export function isEyeModule(x: number, y: number, size: number): boolean {
  for (const [ox, oy] of eyeOrigins(size)) {
    if (x >= ox && x < ox + 7 && y >= oy && y < oy + 7) return true;
  }
  return false;
}

/** The logo's footprint, in padded user units (modules, quiet zone included). */
export interface LogoBox {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The excavated footprint, i.e. the box grown by the logo's padding. */
  clear: { x: number; y: number; width: number; height: number };
  shape: "square" | "circle";
}

/**
 * Where the logo sits, in the same padded coordinate space as the rendered
 * modules. `null` when there is no logo.
 */
export function logoBox(matrix: QRMatrix, style: ResolvedStyle): LogoBox | null {
  const logo: ResolvedLogo | null = style.logo;
  if (!logo) return null;

  const side = matrix.size + style.margin * 2;
  const width = side * logo.size;
  const clearWidth = width + side * logo.padding * 2;
  const centre = side / 2;

  return {
    x: centre - width / 2,
    y: centre - width / 2,
    width,
    height: width,
    clear: {
      x: centre - clearWidth / 2,
      y: centre - clearWidth / 2,
      width: clearWidth,
      height: clearWidth,
    },
    shape: logo.shape,
  };
}

/**
 * A per-module classification of the whole symbol, in padded coordinates.
 *
 * `dark` is the paint mask the shape builders consume — it already excludes
 * eye modules (drawn separately) and anything the logo excavated, so a shape
 * builder never has to re-derive those rules.
 */
export interface ModuleField {
  size: number;
  margin: number;
  /** Side length in user units, quiet zone included. */
  side: number;
  /** `size * size`, 1 = paint this module as a data module. */
  dark: Uint8Array;
  /** `size * size`, 1 = excavated by the logo. */
  excavated: Uint8Array;
  isDark(x: number, y: number): boolean;
}

/**
 * Classify every module once.
 *
 * Excavation is decided by the module's **centre**: a module is cleared only
 * when its middle falls inside the logo's cleared area, so the logo never eats
 * a module it merely clips a corner of.
 */
export function buildModuleField(matrix: QRMatrix, style: ResolvedStyle): ModuleField {
  const { size } = matrix;
  const { margin } = style;
  const side = size + margin * 2;
  const dark = new Uint8Array(size * size);
  const excavated = new Uint8Array(size * size);
  const box = logoBox(matrix, style);
  const clear = box && style.logo?.excavate ? box.clear : null;
  const radius = clear ? clear.width / 2 : 0;
  const centre = side / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = y * size + x;
      if (clear) {
        const cx = margin + x + 0.5;
        const cy = margin + y + 0.5;
        const inside =
          box!.shape === "circle"
            ? (cx - centre) ** 2 + (cy - centre) ** 2 <= radius * radius
            : cx >= clear.x && cx <= clear.x + clear.width && cy >= clear.y && cy <= clear.y + clear.height;
        if (inside) excavated[index] = 1;
      }
      if (matrix.get(x, y) && !isEyeModule(x, y, size) && excavated[index] === 0) {
        dark[index] = 1;
      }
    }
  }

  return {
    size,
    margin,
    side,
    dark,
    excavated,
    isDark(x: number, y: number): boolean {
      if (x < 0 || y < 0 || x >= size || y >= size) return false;
      return dark[y * size + x] === 1;
    },
  };
}

/** A maximal horizontal run of painted modules on one row. */
export interface ModuleRun {
  y: number;
  x: number;
  length: number;
}

/**
 * Merge each row's painted modules into maximal horizontal runs.
 *
 * This is what keeps a default-styled version-10 code at a few dozen path
 * commands instead of ~3,000 — one rectangle per run rather than per module.
 * Only shape-and-gap combinations that actually tile seamlessly may use it
 * (see `paths.ts`).
 */
export function horizontalRuns(field: ModuleField): ModuleRun[] {
  const runs: ModuleRun[] = [];
  for (let y = 0; y < field.size; y++) {
    let x = 0;
    while (x < field.size) {
      if (!field.isDark(x, y)) {
        x++;
        continue;
      }
      const start = x;
      while (x < field.size && field.isDark(x, y)) x++;
      runs.push({ y, x: start, length: x - start });
    }
  }
  return runs;
}
