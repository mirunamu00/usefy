import {
  codewordModuleOrder,
  ecCodewordsPerBlock,
  maskAt,
  numEcBlocks,
  totalCodewords,
  type ErrorCorrectionLevel,
} from "@usefy/qr-code/headless";
import { QRDecodeError } from "../errors";
import type { ModuleGrid } from "../types";
import { rsDecode } from "./rsDecode";

/**
 * Turning a sampled module grid back into data codewords: unmask, walk the
 * zig-zag, de-interleave the blocks, and let Reed–Solomon repair what the
 * camera got wrong.
 *
 * Both halves of the geometry — which modules carry data, and in what order —
 * come from `@usefy/qr-code` rather than being restated here (SPEC §4.3), so a
 * change to the encoder's placement cannot silently desynchronise the decoder.
 */

/** One error-correction block: its codewords, and how many of them are data. */
export interface CodewordBlock {
  readonly codewords: Uint8Array;
  readonly dataLength: number;
}

/**
 * Read every data module in codeword order, undoing the mask as it goes.
 *
 * The trailing "remainder" modules some versions carry are not part of any
 * codeword and are simply not read — the traversal supplies more module
 * indices than there are codeword bits.
 */
export function readRawCodewords(grid: ModuleGrid, version: number, mask: number): Uint8Array {
  const size = grid.size;
  if (grid.width !== grid.height || size !== version * 4 + 17) {
    throw new QRDecodeError(
      "format",
      `A version ${version} symbol is ${version * 4 + 17} modules square, but the ` +
        `sampled grid is ${grid.width}×${grid.height}.`,
    );
  }
  const order = codewordModuleOrder(version);
  const codewords = new Uint8Array(totalCodewords(version));
  const bits = codewords.length * 8;

  for (let bit = 0; bit < bits; bit++) {
    const index = order[bit]!;
    const x = index % size;
    const y = (index / size) | 0;
    const dark = grid.data[index] === 1;
    if (dark !== maskAt(mask, x, y)) {
      // dark XOR mask — written out as an inequality because both sides are
      // already booleans and `^` on booleans is a lie TypeScript lets you tell.
      codewords[bit >>> 3]! |= 0x80 >>> (bit & 7);
    }
  }

  return codewords;
}

/**
 * Split the interleaved codeword stream back into error-correction blocks.
 *
 * The inverse of `@usefy/qr-code`'s `interleave()`: blocks come in two sizes,
 * short ones and (sometimes) ones a single codeword longer, and the encoder
 * emits them column-wise while skipping the position where a short block has
 * no codeword to contribute.
 */
export function deinterleave(
  raw: Readonly<Uint8Array>,
  version: number,
  level: ErrorCorrectionLevel,
): CodewordBlock[] {
  const blockCount = numEcBlocks(version, level);
  const ecLength = ecCodewordsPerBlock(version, level);
  const rawCodewords = totalCodewords(version);
  const shortBlockLength = Math.floor(rawCodewords / blockCount);
  const shortBlockCount = blockCount - (rawCodewords % blockCount);
  const shortDataLength = shortBlockLength - ecLength;
  const stride = shortBlockLength + 1;

  // Assembled blocks all have `stride` slots; short blocks leave the slot at
  // `shortDataLength` empty (the encoder's placeholder, never transmitted).
  const assembled: Uint8Array[] = Array.from({ length: blockCount }, () => new Uint8Array(stride));

  let read = 0;
  for (let i = 0; i < stride; i++) {
    for (let j = 0; j < blockCount; j++) {
      if (i === shortDataLength && j < shortBlockCount) continue;
      assembled[j]![i] = raw[read++]!;
    }
  }
  /* c8 ignore start -- structural invariant: the loop above consumes exactly
     `rawCodewords` slots by construction, so this can only fire if the shared
     capacity tables and the traversal disagree with each other. Unreachable by
     design, kept so that disagreement could never be silent. */
  if (read !== rawCodewords) {
    throw new QRDecodeError(
      "ec",
      `De-interleaving consumed ${read} of ${rawCodewords} codewords — the block ` +
        "tables and the symbol disagree.",
    );
  }
  /* c8 ignore stop */

  return assembled.map((block, index) => {
    const isShort = index < shortBlockCount;
    const dataLength = shortDataLength + (isShort ? 0 : 1);
    const codewords = new Uint8Array(dataLength + ecLength);
    codewords.set(block.subarray(0, dataLength));
    codewords.set(block.subarray(stride - ecLength), dataLength);
    return { codewords, dataLength };
  });
}

export interface DecodedCodewords {
  /** The concatenated, error-corrected data codewords. */
  readonly data: Uint8Array;
  /** Codewords Reed–Solomon repaired across every block. */
  readonly errorsCorrected: number;
}

/**
 * Grid → corrected data codewords.
 *
 * @throws {QRDecodeError} with stage `"ec"` when any block is beyond repair.
 */
export function readCodewords(
  grid: ModuleGrid,
  version: number,
  level: ErrorCorrectionLevel,
  mask: number,
): DecodedCodewords {
  const raw = readRawCodewords(grid, version, mask);
  const blocks = deinterleave(raw, version, level);
  const ecLength = ecCodewordsPerBlock(version, level);

  let errorsCorrected = 0;
  const parts: Uint8Array[] = [];
  let total = 0;

  for (const block of blocks) {
    const result = rsDecode(block.codewords, ecLength);
    errorsCorrected += result.errorsCorrected;
    parts.push(result.data);
    total += result.data.length;
  }

  const data = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    data.set(part, offset);
    offset += part.length;
  }

  return { data, errorsCorrected };
}
