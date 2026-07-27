/**
 * A minimal SVG path reader for tests.
 *
 * The renderers emit compact paths that lean on `H`/`V` shorthands and arcs,
 * so a naive "grab every pair of numbers" regex reads arc radii and flags as
 * if they were coordinates. This walks the commands properly and returns only
 * real endpoints — which is what bounds and winding assertions need.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Subpath {
  points: Point[];
  /** Net arc direction: +1 per clockwise sweep, −1 per counter-clockwise. */
  arcSweep: number;
}

/** Every subpath's endpoints, in order. */
export function subpaths(d: string): Subpath[] {
  const tokens = d.match(/[MLHVAZ]|-?\d+(?:\.\d+)?/gi) ?? [];
  const result: Subpath[] = [];
  let current: Subpath = { points: [], arcSweep: 0 };
  let x = 0;
  let y = 0;
  let i = 0;

  const number = (): number => Number(tokens[i++]);
  const flush = (): void => {
    if (current.points.length > 0) result.push(current);
  };

  while (i < tokens.length) {
    const command = tokens[i++];
    switch (command) {
      case "M":
        flush();
        current = { points: [], arcSweep: 0 };
        x = number();
        y = number();
        current.points.push({ x, y });
        break;
      case "L":
        x = number();
        y = number();
        current.points.push({ x, y });
        break;
      case "H":
        x = number();
        current.points.push({ x, y });
        break;
      case "V":
        y = number();
        current.points.push({ x, y });
        break;
      case "A": {
        number(); // rx
        number(); // ry
        number(); // x-axis rotation
        number(); // large-arc flag
        current.arcSweep += number() === 1 ? 1 : -1;
        x = number();
        y = number();
        current.points.push({ x, y });
        break;
      }
      case "Z":
        break;
      default:
        throw new Error(`Unsupported path command: ${String(command)}`);
    }
  }

  flush();
  return result;
}

/** Every endpoint in a path, across all subpaths. */
export function points(d: string): Point[] {
  return subpaths(d).flatMap((subpath) => subpath.points);
}

/**
 * Direction of a subpath: +1 clockwise in screen coordinates (y down), −1
 * counter-clockwise.
 *
 * The shoelace formula over endpoints answers this for anything with area. A
 * circle drawn as two half-arcs has *collinear* endpoints and zero shoelace
 * area, so its direction is read from the arc sweep flags instead.
 */
export function windingSign(subpath: Subpath): number {
  let area = 0;
  const { points: list } = subpath;
  for (let i = 0; i < list.length; i++) {
    const a = list[i]!;
    const b = list[(i + 1) % list.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  return area !== 0 ? Math.sign(area) : Math.sign(subpath.arcSweep);
}

/** Axis-aligned bounding box of a path's endpoints. */
export function bounds(d: string): { minX: number; minY: number; maxX: number; maxY: number } {
  const all = points(d);
  return {
    minX: Math.min(...all.map((p) => p.x)),
    minY: Math.min(...all.map((p) => p.y)),
    maxX: Math.max(...all.map((p) => p.x)),
    maxY: Math.max(...all.map((p) => p.y)),
  };
}
