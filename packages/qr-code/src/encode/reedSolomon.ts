import { gfExp, gfMul, polyMul } from "./galois";

/**
 * Reed–Solomon error correction over GF(256) (ISO/IEC 18004 §7.5).
 *
 * The generator polynomial of degree `n` is `Π (x - α^i)` for `i` in `[0, n)`.
 * Because subtraction is XOR in a binary field, `-α^i` is just `α^i`.
 */

const generatorCache = new Map<number, Uint8Array>();

/**
 * The Reed–Solomon generator polynomial of the given degree, highest-degree
 * coefficient first (always 1). Cached — QR only ever uses a handful of
 * degrees (7…30).
 *
 * Returns a copy: the cache is process-wide, and handing out the live array
 * would let one caller's mutation corrupt every symbol encoded afterwards.
 */
export function generatorPoly(degree: number): Uint8Array {
  if (!Number.isInteger(degree) || degree < 1) {
    throw new RangeError(`Generator polynomial degree must be a positive integer, got ${degree}`);
  }
  const cached = generatorCache.get(degree);
  if (cached) return cached.slice();

  let poly: Uint8Array = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    poly = polyMul(poly, new Uint8Array([1, gfExp(i)]));
  }
  generatorCache.set(degree, poly);
  return poly.slice();
}

/**
 * The `ecLength` error-correction codewords for one data block — the remainder
 * of `data · x^ecLength` divided by the generator polynomial.
 *
 * @param data - Data codewords for a single block.
 * @param ecLength - Number of EC codewords to produce.
 */
export function rsEncode(data: Readonly<Uint8Array>, ecLength: number): Uint8Array {
  const generator = generatorPoly(ecLength);
  // Working buffer: the dividend (data shifted left by ecLength) reduced in place.
  const remainder = new Uint8Array(data.length + ecLength);
  remainder.set(data);

  for (let i = 0; i < data.length; i++) {
    const factor = remainder[i]!;
    if (factor === 0) continue;
    // generator[0] is 1, so this zeroes remainder[i] and folds the rest down.
    for (let j = 0; j < generator.length; j++) {
      remainder[i + j] ^= gfMul(generator[j]!, factor);
    }
  }

  return remainder.slice(data.length);
}
