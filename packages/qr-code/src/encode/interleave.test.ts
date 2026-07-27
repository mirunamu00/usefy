import { describe, expect, it } from "vitest";
import { interleave } from "./interleave";
import {
  EC_LEVELS,
  MAX_VERSION,
  MIN_VERSION,
  dataCodewords,
  ecCodewordsPerBlock,
  numEcBlocks,
  totalCodewords,
} from "./capacity";
import { rsEncode } from "./reedSolomon";

describe("interleave", () => {
  it("passes a single-block version straight through, parity appended", () => {
    // Version 1 has exactly one block at every level, so interleaving is a no-op.
    const data = Uint8Array.from({ length: dataCodewords(1, "M") }, (_, i) => i + 1);
    const result = interleave(data, 1, "M");
    expect(Array.from(result.slice(0, data.length))).toEqual(Array.from(data));
    expect(Array.from(result.slice(data.length))).toEqual(
      Array.from(rsEncode(data, ecCodewordsPerBlock(1, "M"))),
    );
  });

  it("interleaves equal-length blocks round-robin", () => {
    // Version 6-L: two blocks of equal length.
    const version = 6;
    const level = "L";
    expect(numEcBlocks(version, level)).toBe(2);
    const perBlock = dataCodewords(version, level) / 2;
    const data = Uint8Array.from({ length: dataCodewords(version, level) }, (_, i) => i);
    const result = interleave(data, version, level);

    // The first two output codewords are the first codeword of each block.
    expect(result[0]).toBe(data[0]);
    expect(result[1]).toBe(data[perBlock]);
    expect(result[2]).toBe(data[1]);
    expect(result[3]).toBe(data[perBlock + 1]);
  });

  it("places the extra codeword of long blocks after every short block's data", () => {
    // Version 5-Q: two short blocks (15 data) and two long ones (16 data).
    const version = 5;
    const level = "Q";
    const blocks = numEcBlocks(version, level); // 4
    const total = dataCodewords(version, level); // 62
    const ecLength = ecCodewordsPerBlock(version, level);
    const shortBlockLength = Math.floor(totalCodewords(version) / blocks);
    const shortCount = blocks - (totalCodewords(version) % blocks);
    const shortData = shortBlockLength - ecLength;

    const data = Uint8Array.from({ length: total }, (_, i) => i);
    const result = interleave(data, version, level);

    // Up to shortData, every block contributes one codeword per round.
    expect(result.slice(0, blocks).length).toBe(blocks);
    // At index shortData only the long blocks contribute, so that round is shorter.
    const beforeExtra = shortData * blocks;
    const longBlockCount = blocks - shortCount;
    const extraRound = Array.from(result.slice(beforeExtra, beforeExtra + longBlockCount));
    expect(extraRound).toHaveLength(longBlockCount);
    // Those are the last data codeword of each long block.
    expect(extraRound[0]).toBe(data[shortCount * shortData + shortData]);
  });

  it("produces exactly totalCodewords for every version and level", () => {
    for (let version = MIN_VERSION; version <= MAX_VERSION; version++) {
      for (const level of EC_LEVELS) {
        const data = Uint8Array.from({ length: dataCodewords(version, level) }, (_, i) => i & 0xff);
        expect(interleave(data, version, level).length).toBe(totalCodewords(version));
      }
    }
  });

  it("emits every data codeword exactly once, and never the block placeholder", () => {
    // A payload of distinct non-zero values makes an accidentally emitted
    // placeholder (always 0) or a dropped codeword immediately visible.
    const version = 5;
    const level = "Q";
    const data = Uint8Array.from({ length: dataCodewords(version, level) }, (_, i) => i + 1);
    const result = interleave(data, version, level);
    const dataPortion = Array.from(result.slice(0, data.length));
    expect([...dataPortion].sort((a, b) => a - b)).toEqual(Array.from(data));
  });
});
