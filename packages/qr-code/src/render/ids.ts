import type { QRGradient } from "../types";

/**
 * Deterministic DOM ids for the SVG fragments a QR code needs to reference —
 * gradients and the logo's clip path.
 *
 * SVG ids are **document-global**. Two codes on one page that reference
 * `url(#logo-clip)` both resolve to whichever element the browser sees first,
 * so an id must encode everything that makes the referenced fragment
 * different: identical definitions may safely share an id, differing ones must
 * never collide. Hashing the definition gives exactly that, and being a pure
 * function of the input it also survives server rendering and hydration —
 * which a counter or a random id would not.
 */

/** FNV-1a, rendered base-36. */
function hash(value: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** A stable id for a gradient definition. */
export function gradientId(gradient: QRGradient): string {
  const canonical =
    `${gradient.type}|${gradient.rotation ?? 0}|` +
    gradient.stops.map((stop) => `${stop.offset}:${stop.color}`).join(",");
  return `usefy-qr-g-${hash(canonical)}`;
}

/** The identity of a logo clip path — everything that changes its geometry. */
export interface LogoClipIdentity {
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
  clipCircle: boolean;
}

/**
 * A stable id for a logo's clip path.
 *
 * Every geometric input is included. Deriving it from the viewBox alone (an
 * earlier version of this code) meant two codes of the same version and margin
 * shared an id while having *different* clip circles — so the second code's
 * logo was clipped by the first code's geometry and all but disappeared.
 */
export function logoClipId(identity: LogoClipIdentity): string {
  const canonical = [
    identity.href,
    identity.x,
    identity.y,
    identity.width,
    identity.height,
    identity.clipCircle ? "c" : "s",
  ].join("|");
  return `usefy-qr-c-${hash(canonical)}`;
}
