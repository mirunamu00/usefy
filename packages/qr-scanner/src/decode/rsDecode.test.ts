import { describe, expect, it } from "vitest";
import { gfExp, gfMul, rsEncode } from "@usefy/qr-code/headless";
import { QRDecodeError } from "../errors";
import { rsDecode, syndromes } from "./rsDecode";
import { seededRandom } from "../__testing__/fixtures";

/** A block: `dataLength` random data codewords followed by their parity. */
function makeBlock(dataLength: number, ecLength: number, random: () => number): Uint8Array {
  const data = new Uint8Array(dataLength);
  for (let i = 0; i < dataLength; i++) data[i] = Math.floor(random() * 256);
  const block = new Uint8Array(dataLength + ecLength);
  block.set(data);
  block.set(rsEncode(data, ecLength), dataLength);
  return block;
}

describe("syndromes", () => {
  it("are all zero for an untouched codeword", () => {
    const block = makeBlock(16, 10, seededRandom(1));
    expect(Array.from(syndromes(block, 10))).toEqual(new Array(10).fill(0));
  });

  it("match the hand-computed value for a single known error", () => {
    // With one error of magnitude `e` at position `p` (counted from the end),
    // S_i = e · (α^p)^i. That closed form is independent of this decoder, so
    // agreeing with it proves the evaluation convention is right.
    const block = makeBlock(20, 8, seededRandom(2));
    const position = 5;
    const magnitude = 0x9d;
    block[block.length - 1 - position] ^= magnitude;

    const locator = gfExp(position);
    const expected = [];
    let power = 1;
    for (let i = 0; i < 8; i++) {
      expected.push(gfMul(magnitude, power));
      power = gfMul(power, locator);
    }
    expect(Array.from(syndromes(block, 8))).toEqual(expected);
  });
});

describe("rsDecode", () => {
  it("returns the data untouched when there are no errors", () => {
    const block = makeBlock(24, 12, seededRandom(3));
    const result = rsDecode(block, 12);
    expect(result.errorsCorrected).toBe(0);
    expect(Array.from(result.data)).toEqual(Array.from(block.subarray(0, 24)));
  });

  it("rejects a parity length that cannot be a block", () => {
    expect(() => rsDecode(new Uint8Array(10), 0)).toThrow(RangeError);
    expect(() => rsDecode(new Uint8Array(10), 10)).toThrow(RangeError);
  });

  // The heart of the claim in SPEC §10: every count up to the capacity limit
  // recovers, and one past it never returns a wrong payload.
  describe.each([
    [16, 10],
    [44, 22],
    [86, 30],
  ])("a %i + %i codeword block", (dataLength, ecLength) => {
    const capacity = Math.floor(ecLength / 2);

    it.each(Array.from({ length: capacity }, (_, i) => i + 1))(
      `recovers exactly %i corrupted codewords (limit ${capacity})`,
      (errorCount) => {
        for (let seed = 0; seed < 12; seed++) {
          const random = seededRandom(seed * 977 + errorCount);
          const block = makeBlock(dataLength, ecLength, random);
          const original = block.slice(0, dataLength);

          const positions = new Set<number>();
          while (positions.size < errorCount) {
            positions.add(Math.floor(random() * block.length));
          }
          for (const position of positions) {
            // A non-zero delta: flipping by 0 would not be an error at all.
            block[position] = block[position]! ^ (1 + Math.floor(random() * 255));
          }

          const result = rsDecode(block, ecLength);
          expect(Array.from(result.data), `seed ${seed}`).toEqual(Array.from(original));
          expect(result.errorsCorrected).toBe(errorCount);
        }
      },
    );

    it(`never returns a wrong payload past ${capacity} errors`, () => {
      let refused = 0;
      let recovered = 0;
      const attempts = 200;

      for (let seed = 0; seed < attempts; seed++) {
        const random = seededRandom(seed * 7919 + ecLength);
        const block = makeBlock(dataLength, ecLength, random);
        const original = block.slice(0, dataLength);

        const positions = new Set<number>();
        while (positions.size < capacity + 1) {
          positions.add(Math.floor(random() * block.length));
        }
        for (const position of positions) {
          block[position] = block[position]! ^ (1 + Math.floor(random() * 255));
        }

        try {
          const result = rsDecode(block, ecLength);
          // A decode past the limit is allowed to *succeed* only by landing on
          // the true codeword; what it must never do is return a different one.
          expect(Array.from(result.data), `seed ${seed} returned a wrong payload`).toEqual(
            Array.from(original),
          );
          recovered++;
        } catch (error) {
          expect(error).toBeInstanceOf(QRDecodeError);
          expect((error as QRDecodeError).stage).toBe("ec");
          refused++;
        }
      }

      // Sanity: the experiment has to actually be exercising the failure path.
      expect(refused + recovered).toBe(attempts);
      expect(refused).toBeGreaterThan(0);
    });
  });

  it("reports the number of codewords it repaired", () => {
    const random = seededRandom(42);
    const block = makeBlock(30, 18, random);
    block[3] = block[3]! ^ 0x41;
    block[17] = block[17]! ^ 0x0f;
    block[40] = block[40]! ^ 0xc3;

    expect(rsDecode(block, 18).errorsCorrected).toBe(3);
  });

  it("refuses a block of pure noise rather than inventing a payload", () => {
    const random = seededRandom(99);
    let refusals = 0;
    for (let attempt = 0; attempt < 50; attempt++) {
      const noise = new Uint8Array(44);
      for (let i = 0; i < noise.length; i++) noise[i] = Math.floor(random() * 256);
      try {
        rsDecode(noise, 22);
      } catch (error) {
        expect(error).toBeInstanceOf(QRDecodeError);
        refusals++;
      }
    }
    // Random 44-byte strings are essentially never valid 22-parity codewords.
    expect(refusals).toBe(50);
  });
});
