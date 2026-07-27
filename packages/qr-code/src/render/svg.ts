import type { QRGradientDef, QRMatrix, QRSVGProps, QRStyleOptions } from "../types";
import { escapeXml, fmt } from "./color";
import { linearEndpoints, radialGeometry } from "./gradient";
import { logoClipId } from "./ids";
import { logoBox } from "./geometry";
import { matrixToPaths } from "./paths";
import { resolveStyle } from "./style";

/** Options accepted by both SVG renderers. */
export interface RenderOptions extends QRStyleOptions {
  /**
   * Accessible name. `toSVG()` emits it as a `<title>` and switches the root
   * to `role="img"`; without it the root is `aria-hidden`.
   */
  title?: string;
}

/**
 * Structured SVG output — every value a React Server Component needs to render
 * a `<svg>` as ordinary JSX.
 *
 * This exists so server-rendering a QR code costs **zero** client JavaScript
 * and needs no `dangerouslySetInnerHTML`: the caller maps `paths` to `<path>`
 * elements directly. It is the same data {@link toSVG} serializes, so the two
 * can never drift.
 *
 * @example
 * ```tsx
 * // A React Server Component — no "use client", no hydration.
 * const qr = encodeQR("https://usefy.dev");
 * const { viewBox, paths, background, side } = toSVGProps(qr);
 * return (
 *   <svg viewBox={viewBox} width={200} height={200}>
 *     {background && <rect width={side} height={side} fill={background} />}
 *     {paths.map((p, i) => <path key={i} d={p.d} fill={p.fill} />)}
 *   </svg>
 * );
 * ```
 */
export function toSVGProps(matrix: QRMatrix, options: RenderOptions = {}): QRSVGProps {
  const style = resolveStyle(options);
  const { paths, defs } = matrixToPaths(matrix, style);
  const side = matrix.size + style.margin * 2;
  const box = logoBox(matrix, style);

  let image: QRSVGProps["image"] = null;
  if (box) {
    const identity = {
      href: style.logo!.src,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      clipCircle: box.shape === "circle",
    };
    image = {
      ...identity,
      clipId: logoClipId(identity),
      ...(style.logo!.crossOrigin ? { crossOrigin: style.logo!.crossOrigin } : {}),
    };
  }

  return {
    viewBox: `0 0 ${fmt(side)} ${fmt(side)}`,
    side,
    background: style.bg,
    // Axis-aligned squares want crisp edges; anything curved or inset needs
    // real antialiasing or it looks ragged.
    shapeRendering:
      style.moduleShape === "square" && style.moduleGap === 0 && style.eyeShape === "square"
        ? "crispEdges"
        : "geometricPrecision",
    paths,
    defs,
    image,
  };
}

function serializeDefs(defs: QRGradientDef[]): string {
  if (defs.length === 0) return "";
  const body = defs
    .map(({ id, gradient, bounds }) => {
      const stops = gradient.stops
        .map((stop) => `<stop offset="${fmt(stop.offset)}" stop-color="${escapeXml(stop.color)}"/>`)
        .join("");
      if (gradient.type === "radial") {
        const { cx, cy, r } = radialGeometry(bounds);
        return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}">${stops}</radialGradient>`;
      }
      const { x1, y1, x2, y2 } = linearEndpoints(bounds, gradient.rotation ?? 0);
      return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}">${stops}</linearGradient>`;
    })
    .join("");
  return `<defs>${body}</defs>`;
}

/**
 * Serialize a matrix as a standalone SVG document.
 *
 * A logo is emitted as an `<image>` referencing `logo.src` verbatim. For a
 * self-contained file — one that renders identically offline and makes no
 * network request when opened — pass a data URI.
 *
 * @example
 * ```ts
 * const svg = toSVG(encodeQR("https://usefy.dev"), { fg: "#0f172a", margin: 2 });
 * ```
 */
export function toSVG(matrix: QRMatrix, options: RenderOptions = {}): string {
  const props = toSVGProps(matrix, options);
  const side = fmt(props.side);

  const title = options.title ? `<title>${escapeXml(options.title)}</title>` : "";
  const background = props.background
    ? `<rect width="${side}" height="${side}" fill="${escapeXml(props.background)}"/>`
    : "";
  const body = props.paths
    .map((path) => `<path d="${path.d}" fill="${escapeXml(path.fill)}"/>`)
    .join("");

  let image = "";
  if (props.image) {
    const { clipId, clipCircle, x, y, width, height, href } = props.image;
    const clip = clipCircle
      ? `<clipPath id="${clipId}"><circle cx="${fmt(x + width / 2)}" cy="${fmt(y + height / 2)}" r="${fmt(width / 2)}"/></clipPath>`
      : "";
    const clipAttr = clipCircle ? ` clip-path="url(#${clipId})"` : "";
    image =
      clip +
      `<image href="${escapeXml(href)}" x="${fmt(x)}" y="${fmt(y)}" ` +
      `width="${fmt(width)}" height="${fmt(height)}" preserveAspectRatio="xMidYMid meet"${clipAttr}/>`;
  }

  const role = options.title ? ` role="img"` : ` aria-hidden="true"`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${props.viewBox}" ` +
    `width="${side}" height="${side}" shape-rendering="${props.shapeRendering}"${role}>` +
    title +
    serializeDefs(props.defs) +
    background +
    body +
    image +
    "</svg>"
  );
}
