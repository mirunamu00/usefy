import type { QRMatrix } from "@usefy/qr-code/headless";
import { PerspectiveTransform, type Quad4 } from "../detect/perspective";

/**
 * Deterministic rendering and degradation of QR symbols, for the detection
 * oracle (SPEC §7).
 *
 * Everything here is pure arithmetic over `ImageData` — no canvas, no DOM — so
 * the corpus is byte-identical on every machine and a failure can be replayed
 * from its seed. That matters more than realism: a "sometimes decodes" test
 * teaches nothing, and a corpus that differs between CI and a laptop cannot be
 * debugged.
 */

export interface RenderOptions {
  /** Pixels per module. */
  scale?: number;
  /** Quiet zone in modules. */
  margin?: number;
  /** Rotation about the image centre, in degrees. */
  rotate?: number;
  /** Extra padding in pixels around the rotated result. */
  padding?: number;
  /** Luminance of a dark module (0–255). */
  dark?: number;
  /** Luminance of a light module (0–255). */
  light?: number;
}

function createImage(width: number, height: number, fill: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill;
    data[i + 1] = fill;
    data[i + 2] = fill;
    data[i + 3] = 255;
  }
  return { data, width, height, colorSpace: "srgb" } as ImageData;
}

/** Render a symbol to an `ImageData`, optionally rotated about its centre. */
export function renderMatrix(matrix: QRMatrix, options: RenderOptions = {}): ImageData {
  const scale = options.scale ?? 6;
  const margin = options.margin ?? 4;
  const dark = options.dark ?? 0;
  const light = options.light ?? 255;
  const padding = options.padding ?? 0;

  const side = (matrix.size + margin * 2) * scale;
  const flat = createImage(side, side, light);

  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.get(x, y)) continue;
      const px = (x + margin) * scale;
      const py = (y + margin) * scale;
      for (let dy = 0; dy < scale; dy++) {
        let index = ((py + dy) * side + px) * 4;
        for (let dx = 0; dx < scale; dx++) {
          flat.data[index] = dark;
          flat.data[index + 1] = dark;
          flat.data[index + 2] = dark;
          index += 4;
        }
      }
    }
  }

  if (!options.rotate && !padding) return flat;
  return rotate(flat, options.rotate ?? 0, padding, light);
}

/**
 * Rotate an image about its centre, sampling the source bilinearly.
 *
 * Bilinear rather than nearest-neighbour on purpose: a rotated QR in the real
 * world has soft module edges, and testing against hard-edged nearest-neighbour
 * output would flatter the binarizer into looking better than it is.
 */
export function rotate(image: ImageData, degrees: number, padding = 0, fill = 255): ImageData {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const width = image.width + padding * 2;
  const height = image.height + padding * 2;
  const out = createImage(width, height, fill);

  const cx = width / 2;
  const cy = height / 2;
  const scx = image.width / 2;
  const scy = image.height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const sx = scx + dx * cos + dy * sin;
      const sy = scy - dx * sin + dy * cos;

      if (sx < 0 || sy < 0 || sx >= image.width - 1 || sy >= image.height - 1) continue;

      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;

      const index = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const p00 = image.data[(y0 * image.width + x0) * 4 + channel]!;
        const p10 = image.data[(y0 * image.width + x0 + 1) * 4 + channel]!;
        const p01 = image.data[((y0 + 1) * image.width + x0) * 4 + channel]!;
        const p11 = image.data[((y0 + 1) * image.width + x0 + 1) * 4 + channel]!;
        out.data[index + channel] =
          p00 * (1 - fx) * (1 - fy) + p10 * fx * (1 - fy) + p01 * (1 - fx) * fy + p11 * fx * fy;
      }
    }
  }

  return out;
}

/**
 * Apply a true projective warp — what photographing a flat code at an angle
 * actually does.
 *
 * A homography, not a per-row stretch: in a real photograph the rows also
 * *bunch up* towards the far edge, and a fixture that scales each row while
 * leaving the vertical spacing uniform is a bilinear warp no camera produces —
 * and one no four-point transform can model, so it would test the decoder
 * against an impossible target.
 *
 * `strength` is the fraction of the image width by which the top edge narrows;
 * 0.2 is a pronounced but entirely ordinary hand-held angle.
 */
export function perspective(image: ImageData, strength: number, fill = 255): ImageData {
  const { width, height } = image;
  const inset = (width * strength) / 2;

  return warp(
    image,
    [
      { x: inset, y: 0 },
      { x: width - inset, y: 0 },
      { x: width, y: height - 1 },
      { x: 0, y: height - 1 },
    ],
    fill,
  );
}

/**
 * Map the image's corners onto an arbitrary quadrilateral, sampling the source
 * bilinearly.
 *
 * The transform is the package's own `PerspectiveTransform`. That is not
 * circular: the transform is unit-tested independently, and what this fixture
 * exercises is everything the decoder does *around* it — finding the finder
 * patterns, locating the alignment pattern, and recovering a transform of its
 * own from those points alone.
 */
export function warp(image: ImageData, destination: Quad4, fill = 255): ImageData {
  const { width, height } = image;
  const out = createImage(width, height, fill);

  // Destination → source, so every output pixel is filled exactly once.
  const inverse = PerspectiveTransform.quadToQuad(destination, [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: width - 1, y: height - 1 },
    { x: 0, y: height - 1 },
  ]);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { x: sx, y: sy } = inverse.map(x, y);
      if (sx < 0 || sy < 0 || sx >= width - 1 || sy >= height - 1) continue;

      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const index = (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel++) {
        const p00 = image.data[(y0 * width + x0) * 4 + channel]!;
        const p10 = image.data[(y0 * width + x0 + 1) * 4 + channel]!;
        const p01 = image.data[((y0 + 1) * width + x0) * 4 + channel]!;
        const p11 = image.data[((y0 + 1) * width + x0 + 1) * 4 + channel]!;
        out.data[index + channel] =
          p00 * (1 - fx) * (1 - fy) + p10 * fx * (1 - fy) + p01 * (1 - fx) * fy + p11 * fx * fy;
      }
    }
  }

  return out;
}

/** Separable box blur — a cheap, deterministic stand-in for defocus. */
export function blur(image: ImageData, radius: number): ImageData {
  if (radius < 1) return image;
  const { width, height } = image;
  const out = createImage(width, height, 255);
  const window = radius * 2 + 1;

  const horizontal = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const sx = Math.min(width - 1, Math.max(0, x + k));
        sum += image.data[(y * width + sx) * 4]!;
      }
      horizontal[y * width + x] = sum / window;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const sy = Math.min(height - 1, Math.max(0, y + k));
        sum += horizontal[sy * width + x]!;
      }
      const value = sum / window;
      const index = (y * width + x) * 4;
      out.data[index] = value;
      out.data[index + 1] = value;
      out.data[index + 2] = value;
    }
  }

  return out;
}

/** Additive uniform noise, seeded. */
export function noise(image: ImageData, amplitude: number, random: () => number): ImageData {
  const out = createImage(image.width, image.height, 0);
  for (let i = 0; i < image.data.length; i += 4) {
    const delta = (random() * 2 - 1) * amplitude;
    const value = image.data[i]! + delta;
    out.data[i] = value;
    out.data[i + 1] = value;
    out.data[i + 2] = value;
  }
  return out;
}

/**
 * A smooth illumination gradient across the image — the shadow of the hand
 * holding the phone, which is what defeats a single global threshold.
 *
 * `strength` is the fraction of full range lost at the darkest corner.
 */
export function illuminate(image: ImageData, strength: number, angle = 0): ImageData {
  const out = createImage(image.width, image.height, 0);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const span = Math.abs(dx) * image.width + Math.abs(dy) * image.height;

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const t = (x * dx + y * dy) / span;
      const factor = 1 - strength * t;
      const index = (y * image.width + x) * 4;
      const value = image.data[index]! * factor;
      out.data[index] = value;
      out.data[index + 1] = value;
      out.data[index + 2] = value;
    }
  }

  return out;
}

/**
 * A soft-edged shadow over part of the image — the hand holding the phone.
 *
 * Unlike a smooth ramp across the whole frame, a shadow has an *edge*: bright
 * paper on one side, dim paper on the other, with both black and white present
 * in each region. That is what actually defeats a single global cutoff, because
 * the "white" under the shadow is darker than the "black" outside it.
 *
 * @param fraction - How much of the width the shadow covers, from the left.
 * @param factor - Brightness multiplier inside the shadow.
 * @param feather - Width of the transition, in pixels.
 */
export function shadow(
  image: ImageData,
  fraction: number,
  factor: number,
  feather = 8,
): ImageData {
  const out = createImage(image.width, image.height, 0);
  const edge = image.width * fraction;

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const t = Math.min(1, Math.max(0, (edge - x) / feather));
      const multiplier = 1 - (1 - factor) * t;
      const index = (y * image.width + x) * 4;
      const value = image.data[index]! * multiplier;
      out.data[index] = value;
      out.data[index + 1] = value;
      out.data[index + 2] = value;
    }
  }

  return out;
}

/** Paint a filled rectangle — occlusion, a finger over the corner, a logo. */
export function occlude(
  image: ImageData,
  x: number,
  y: number,
  width: number,
  height: number,
  value = 128,
): ImageData {
  const out = createImage(image.width, image.height, 0);
  out.data.set(image.data);
  for (let py = y; py < y + height; py++) {
    if (py < 0 || py >= image.height) continue;
    for (let px = x; px < x + width; px++) {
      if (px < 0 || px >= image.width) continue;
      const index = (py * image.width + px) * 4;
      out.data[index] = value;
      out.data[index + 1] = value;
      out.data[index + 2] = value;
    }
  }
  return out;
}

/** Invert every channel — a light-on-dark symbol. */
export function invertImage(image: ImageData): ImageData {
  const out = createImage(image.width, image.height, 0);
  for (let i = 0; i < image.data.length; i += 4) {
    out.data[i] = 255 - image.data[i]!;
    out.data[i + 1] = 255 - image.data[i + 1]!;
    out.data[i + 2] = 255 - image.data[i + 2]!;
  }
  return out;
}

/** Mirror horizontally. */
export function mirrorImage(image: ImageData): ImageData {
  const out = createImage(image.width, image.height, 0);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const from = (y * image.width + (image.width - 1 - x)) * 4;
      const to = (y * image.width + x) * 4;
      out.data[to] = image.data[from]!;
      out.data[to + 1] = image.data[from + 1]!;
      out.data[to + 2] = image.data[from + 2]!;
    }
  }
  return out;
}

/** Place several images side by side on one canvas — a multi-symbol frame. */
export function compose(
  images: readonly ImageData[],
  positions: ReadonlyArray<{ x: number; y: number }>,
  width: number,
  height: number,
  fill = 255,
): ImageData {
  const out = createImage(width, height, fill);
  images.forEach((image, index) => {
    const { x: ox, y: oy } = positions[index]!;
    for (let y = 0; y < image.height; y++) {
      const ty = oy + y;
      if (ty < 0 || ty >= height) continue;
      for (let x = 0; x < image.width; x++) {
        const tx = ox + x;
        if (tx < 0 || tx >= width) continue;
        const from = (y * image.width + x) * 4;
        const to = (ty * width + tx) * 4;
        out.data[to] = image.data[from]!;
        out.data[to + 1] = image.data[from + 1]!;
        out.data[to + 2] = image.data[from + 2]!;
      }
    }
  });
  return out;
}
