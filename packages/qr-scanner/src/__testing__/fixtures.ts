import {
  codewordModuleOrder,
  dataCodewords,
  ecCodewordsPerBlock,
  encodeQR,
  maskAt,
  numEcBlocks,
  rsEncode,
  type ErrorCorrectionLevel,
  type QRMatrix,
} from "@usefy/qr-code/headless";
import { BitMatrix } from "../image/bitmatrix";

/**
 * Test-only helpers that turn `@usefy/qr-code`'s encoder into this package's
 * oracle (SPEC §7).
 *
 * The counterpart encoder produces both the symbol *and* the payload it should
 * decode to, so every assertion here is exact rather than "looks plausible".
 * Degradation is seeded and reproducible: a failure can be replayed from its
 * seed instead of being a flaky "sometimes decodes".
 */

/** A `QRMatrix` from the encoder, as the module grid the decoder consumes. */
export function gridFromMatrix(matrix: QRMatrix): BitMatrix {
  return BitMatrix.square(matrix.size, Uint8Array.from(matrix.modules));
}

/**
 * Build a real, scannable symbol carrying an **arbitrary** bit stream.
 *
 * `@usefy/qr-code` only emits the modes it encodes, so Kanji, Structured
 * Append and FNC1 have no oracle. This takes a genuine symbol of the requested
 * version/level/mask — keeping its function patterns, format word and mask
 * exactly as the encoder produced them — and rewrites only the data modules
 * with codewords built here. The result travels the entire decode path, so
 * those modes are tested against the real reader rather than a shortcut.
 *
 * Restricted to single-block versions so no interleaving has to be restated:
 * at levels L and M, versions 1–4 qualify.
 */
export function symbolWithBitStream(
  bits: Readonly<Uint8Array>,
  bitLength: number,
  version: number,
  level: ErrorCorrectionLevel,
  mask = 0,
): BitMatrix {
  if (numEcBlocks(version, level) !== 1) {
    throw new RangeError(
      `symbolWithBitStream needs a single-block symbol; v${version}-${level} has ` +
        `${numEcBlocks(version, level)}`,
    );
  }

  const dataLength = dataCodewords(version, level);
  const data = new Uint8Array(dataLength);
  data.set(bits.subarray(0, Math.min(bits.length, dataLength)));

  // Pad exactly as the specification does, so the parser meets a realistic
  // stream: terminator (already implied by the zero fill), then 0xEC / 0x11.
  for (let i = Math.ceil(bitLength / 8); i < dataLength; i++) {
    data[i] = i % 2 === Math.ceil(bitLength / 8) % 2 ? 0xec : 0x11;
  }

  const ecLength = ecCodewordsPerBlock(version, level);
  const codewords = new Uint8Array(dataLength + ecLength);
  codewords.set(data);
  codewords.set(rsEncode(data, ecLength), dataLength);

  // A throwaway symbol of the same shape supplies the function patterns and the
  // format word; only the data modules are replaced.
  const base = encodeQR("x", { version, level, mask });
  const grid = gridFromMatrix(base);
  const order = codewordModuleOrder(version);

  for (let bit = 0; bit < codewords.length * 8; bit++) {
    const index = order[bit]!;
    const x = index % grid.size;
    const y = (index / grid.size) | 0;
    const value = (codewords[bit >>> 3]! >>> (7 - (bit & 7))) & 1;
    grid.data[index] = value ^ (maskAt(mask, x, y) ? 1 : 0);
  }

  return grid;
}

/** Mulberry32 — small, fast, and identical across runs and platforms. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Flip `count` distinct modules of a grid, avoiding the function patterns.
 *
 * Damaging only data modules is what makes "recovers up to the EC budget" a
 * meaningful claim: flipping a finder pattern tests detection, not error
 * correction, and mixing the two would blur which layer a failure came from.
 */
export function damageDataModules(
  grid: BitMatrix,
  reserved: Readonly<Uint8Array>,
  count: number,
  random: () => number,
): BitMatrix {
  const damaged = new BitMatrix(grid.width, grid.height, Uint8Array.from(grid.data));
  const candidates: number[] = [];
  for (let i = 0; i < reserved.length; i++) {
    if (reserved[i] === 0) candidates.push(i);
  }

  // Partial Fisher–Yates: only the prefix we consume gets shuffled.
  for (let i = 0; i < count && i < candidates.length; i++) {
    const j = i + Math.floor(random() * (candidates.length - i));
    const temp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = temp;
    damaged.data[candidates[i]!] ^= 1;
  }

  return damaged;
}

/** Flip `count` distinct modules anywhere in the grid, function patterns included. */
export function damageAnyModules(
  grid: BitMatrix,
  count: number,
  random: () => number,
): BitMatrix {
  const damaged = new BitMatrix(grid.width, grid.height, Uint8Array.from(grid.data));
  const seen = new Set<number>();
  while (seen.size < count && seen.size < damaged.data.length) {
    const index = Math.floor(random() * damaged.data.length);
    if (seen.has(index)) continue;
    seen.add(index);
    damaged.data[index] ^= 1;
  }
  return damaged;
}
