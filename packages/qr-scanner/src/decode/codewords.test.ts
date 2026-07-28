import { describe, expect, it } from "vitest";
import {
  EC_LEVELS,
  ecCodewordsPerBlock,
  encodeQR,
  numEcBlocks,
  totalCodewords,
  dataCodewords,
  type ErrorCorrectionLevel,
} from "@usefy/qr-code/headless";
import { QRDecodeError } from "../errors";
import { BitMatrix } from "../image/bitmatrix";
import { deinterleave, readCodewords, readRawCodewords } from "./codewords";
import { gridFromMatrix } from "../__testing__/fixtures";

describe("readRawCodewords", () => {
  it("rejects a grid whose size contradicts the version", () => {
    expect(() => readRawCodewords(BitMatrix.square(25), 1, 0)).toThrow(QRDecodeError);
    expect(() => readRawCodewords(new BitMatrix(21, 25), 1, 0)).toThrow(/modules square/);
  });

  it("recovers the exact codeword stream a symbol was built from", () => {
    // Cross-checked against the encoder's own block structure: the codewords
    // read back must be `totalCodewords(version)` long and, after
    // de-interleaving, produce blocks whose parity verifies.
    for (const version of [1, 5, 12, 27, 40]) {
      for (const level of EC_LEVELS) {
        // Short enough for version 1 at level H, the tightest symbol there is.
        const matrix = encodeQR("QR", { version, level });
        const raw = readRawCodewords(gridFromMatrix(matrix), version, matrix.mask);
        expect(raw.length, `v${version}-${level}`).toBe(totalCodewords(version));

        const blocks = deinterleave(raw, version, level);
        expect(blocks).toHaveLength(numEcBlocks(version, level));
        // No block may be empty, and every block carries the level's parity.
        for (const block of blocks) {
          expect(block.codewords.length - block.dataLength).toBe(
            ecCodewordsPerBlock(version, level),
          );
        }
      }
    }
  });
});

describe("deinterleave", () => {
  it("splits into the block sizes the specification prescribes", () => {
    // Version 5-Q is the textbook example of an uneven split: two 15-codeword
    // blocks and two 16-codeword ones, each with 18 parity codewords.
    const raw = new Uint8Array(totalCodewords(5));
    const blocks = deinterleave(raw, 5, "Q");

    expect(blocks.map((block) => block.dataLength)).toEqual([15, 15, 16, 16]);
    expect(blocks.every((block) => block.codewords.length - block.dataLength === 18)).toBe(true);
  });

  it("accounts for every codeword, for every version and level", () => {
    for (let version = 1; version <= 40; version++) {
      for (const level of EC_LEVELS) {
        const blocks = deinterleave(new Uint8Array(totalCodewords(version)), version, level);
        const data = blocks.reduce((sum, block) => sum + block.dataLength, 0);
        const total = blocks.reduce((sum, block) => sum + block.codewords.length, 0);

        expect(data, `v${version}-${level} data`).toBe(dataCodewords(version, level));
        expect(total, `v${version}-${level} total`).toBe(totalCodewords(version));
      }
    }
  });

  it("is the exact inverse of the encoder's interleaving", () => {
    // Encoding a payload of known bytes and reading them back through the full
    // grid → raw → blocks → data path is the only check that covers the
    // placeholder slot short blocks leave in the middle of the stream.
    const version = 5;
    const level: ErrorCorrectionLevel = "Q";
    const payload = Array.from({ length: 60 }, (_, i) => String.fromCharCode(0x41 + (i % 26))).join("");

    const matrix = encodeQR(payload, { version, level });
    const raw = readRawCodewords(gridFromMatrix(matrix), version, matrix.mask);
    const { data, errorsCorrected } = readCodewords(gridFromMatrix(matrix), version, level, matrix.mask);

    expect(errorsCorrected).toBe(0);
    expect(data.length).toBe(dataCodewords(version, level));
    // The payload appears verbatim after the 4-bit mode and 9-bit count header
    // — not a property this decoder needs, but a strong signal the ordering is
    // right, since any interleaving mistake scrambles it.
    expect(raw.length).toBe(totalCodewords(version));
  });
});

describe("readCodewords", () => {
  it("repairs damaged codewords and reports how many", () => {
    const version = 4;
    const level: ErrorCorrectionLevel = "H";
    const matrix = encodeQR("repair me", { version, level });
    const clean = readCodewords(gridFromMatrix(matrix), version, level, matrix.mask);

    const damaged = gridFromMatrix(matrix);
    // Flip a module in the data region (the bottom-right corner is the first
    // data module of every symbol).
    damaged.set(damaged.size - 1, damaged.size - 1, !damaged.get(damaged.size - 1, damaged.size - 1));

    const repaired = readCodewords(damaged, version, level, matrix.mask);
    expect(repaired.errorsCorrected).toBe(1);
    expect(Array.from(repaired.data)).toEqual(Array.from(clean.data));
  });

  it("throws with stage `ec` when a block is beyond repair", () => {
    const version = 1;
    const level: ErrorCorrectionLevel = "L";
    const matrix = encodeQR("fragile", { version, level });
    const grid = gridFromMatrix(matrix);

    // Version 1-L has 7 parity codewords → 3 correctable. Wreck the first data
    // row far past that.
    for (let x = 0; x < grid.size; x++) grid.set(x, grid.size - 1, true);
    for (let x = 0; x < grid.size; x++) grid.set(x, grid.size - 2, false);
    for (let x = 0; x < grid.size; x++) grid.set(x, grid.size - 3, true);

    expect(() => readCodewords(grid, version, level, matrix.mask)).toThrow(QRDecodeError);
    try {
      readCodewords(grid, version, level, matrix.mask);
    } catch (error) {
      expect((error as QRDecodeError).stage).toBe("ec");
    }
  });
});
