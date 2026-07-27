import type { ErrorCorrectionLevel } from "../types";
import { ecCodewordsPerBlock, numEcBlocks, totalCodewords } from "./capacity";
import { rsEncode } from "./reedSolomon";

/**
 * Block splitting and codeword interleaving (ISO/IEC 18004 §7.6).
 *
 * Data is split into blocks — some "short", some one codeword longer — each
 * gets its own Reed–Solomon parity, and the blocks are then interleaved so a
 * physical smudge damages a few codewords in *every* block rather than
 * destroying one block entirely.
 *
 * Short blocks are padded with a placeholder byte during assembly purely so
 * every block's parity section lines up at the same index; the placeholder is
 * skipped when emitting, never written to the symbol.
 */
export function interleave(
  data: Readonly<Uint8Array>,
  version: number,
  level: ErrorCorrectionLevel,
): Uint8Array {
  const blockCount = numEcBlocks(version, level);
  const ecLength = ecCodewordsPerBlock(version, level);
  const rawCodewords = totalCodewords(version);
  const shortBlockLength = Math.floor(rawCodewords / blockCount);
  const shortBlockCount = blockCount - (rawCodewords % blockCount);
  const shortDataLength = shortBlockLength - ecLength;

  // Every assembled block is shortBlockLength + 1 long: short blocks reach it
  // with a placeholder at `shortDataLength`, long blocks with a real codeword.
  const stride = shortBlockLength + 1;
  const blocks: Uint8Array[] = [];
  for (let i = 0, offset = 0; i < blockCount; i++) {
    const dataLength = shortDataLength + (i < shortBlockCount ? 0 : 1);
    const blockData = data.slice(offset, offset + dataLength);
    offset += dataLength;

    const block = new Uint8Array(stride);
    block.set(blockData);
    block.set(rsEncode(blockData, ecLength), stride - ecLength);
    blocks.push(block);
  }

  const result = new Uint8Array(rawCodewords);
  let out = 0;
  for (let i = 0; i < stride; i++) {
    for (let j = 0; j < blockCount; j++) {
      if (i === shortDataLength && j < shortBlockCount) continue; // the placeholder
      result[out++] = blocks[j]![i]!;
    }
  }
  return result;
}
