import { describe, expect, it } from "vitest";
import { QRDecodeError } from "../errors";
import { BitReader } from "./bitreader";

describe("BitReader", () => {
  it("reads most-significant bit first, across byte boundaries", () => {
    const reader = new BitReader(Uint8Array.from([0b1011_0010, 0b0100_1111]));
    expect(reader.read(4)).toBe(0b1011);
    expect(reader.read(6)).toBe(0b0010_01);
    expect(reader.read(6)).toBe(0b00_1111);
    expect(reader.available).toBe(0);
  });

  it("tracks the offset and what remains", () => {
    const reader = new BitReader(new Uint8Array(3));
    expect(reader.available).toBe(24);
    expect(reader.offset).toBe(0);
    reader.read(11);
    expect(reader.offset).toBe(11);
    expect(reader.available).toBe(13);
  });

  it("reads whole bytes", () => {
    const reader = new BitReader(Uint8Array.from([0x41, 0x42, 0x43]));
    expect(Array.from(reader.readBytes(3))).toEqual([0x41, 0x42, 0x43]);
  });

  it("reads a full 32-bit value without going negative", () => {
    const reader = new BitReader(Uint8Array.from([0xff, 0xff, 0xff, 0xff]));
    expect(reader.read(32)).toBe(0xffffffff);
  });

  it("reads zero bits as a no-op", () => {
    const reader = new BitReader(Uint8Array.from([0xff]));
    expect(reader.read(0)).toBe(0);
    expect(reader.offset).toBe(0);
  });

  it("throws rather than zero-filling past the end", () => {
    // Zero-filling would turn a truncated symbol into a plausible wrong
    // payload, which is the one outcome this package refuses.
    const reader = new BitReader(Uint8Array.from([0xff]));
    reader.read(6);
    expect(() => reader.read(4)).toThrow(QRDecodeError);
    try {
      new BitReader(new Uint8Array(1)).read(9);
    } catch (error) {
      expect((error as QRDecodeError).stage).toBe("parse");
      expect((error as Error).message).toMatch(/ended early/);
    }
  });

  it("rejects a read width it cannot represent", () => {
    const reader = new BitReader(new Uint8Array(8));
    expect(() => reader.read(33)).toThrow(RangeError);
    expect(() => reader.read(-1)).toThrow(RangeError);
  });
});
