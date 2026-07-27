import { describe, expect, it } from "vitest";
import {
  PENALTY_N1,
  PENALTY_N2,
  PENALTY_N3,
  PENALTY_N4,
  applyBestMask,
  applyMask,
  maskAt,
  penaltyScore,
} from "./mask";
import { buildMatrix } from "./matrix";
import { encodeQR } from "./encodeQR";

/** Build a `size × size` module grid from rows of "#" and "." characters. */
function grid(rows: string[]): { modules: Uint8Array; size: number } {
  const size = rows.length;
  const modules = new Uint8Array(size * size);
  rows.forEach((row, y) => {
    expect(row).toHaveLength(size);
    for (let x = 0; x < size; x++) modules[y * size + x] = row[x] === "#" ? 1 : 0;
  });
  return { modules, size };
}

describe("maskAt", () => {
  it("matches the eight published conditions (ISO Table 10)", () => {
    const conditions: Array<(x: number, y: number) => boolean> = [
      (x, y) => (x + y) % 2 === 0,
      (_x, y) => y % 2 === 0,
      (x) => x % 3 === 0,
      (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
      (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
      (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
      (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
    ];
    for (let mask = 0; mask < 8; mask++) {
      for (let y = 0; y < 12; y++) {
        for (let x = 0; x < 12; x++) {
          expect(maskAt(mask, x, y)).toBe(conditions[mask]!(x, y));
        }
      }
    }
  });

  it("rejects an unknown mask", () => {
    expect(() => maskAt(8, 0, 0)).toThrow(RangeError);
  });
});

describe("applyMask", () => {
  it("is its own inverse and never touches reserved modules", () => {
    const raw = buildMatrix(new Uint8Array(26), 1, "M");
    const before = Array.from(raw.modules);
    applyMask(raw, 4);
    expect(Array.from(raw.modules)).not.toEqual(before);
    // Reserved modules are untouched by the mask.
    for (let i = 0; i < raw.modules.length; i++) {
      if (raw.reserved[i] === 1) expect(raw.modules[i]).toBe(before[i]);
    }
    applyMask(raw, 4);
    expect(Array.from(raw.modules)).toEqual(before);
  });
});

/**
 * A deliberately naive, rule-by-rule transcription of ISO Table 11, written
 * for obviousness rather than speed. `penaltyScore` fuses all four rules into
 * two passes, which is where a subtle indexing slip would hide; comparing the
 * two implementations across structured and pseudo-random grids is a far
 * stronger check than any single hand-computed total.
 */
function referencePenalty(modules: Uint8Array, size: number): number {
  const at = (x: number, y: number): number => modules[y * size + x]!;
  let n1 = 0;
  let n2 = 0;
  let n3 = 0;

  const scanLine = (read: (i: number) => number): void => {
    let run = 1;
    for (let i = 1; i < size; i++) {
      if (read(i) === read(i - 1)) {
        run++;
        if (run === 5) n1 += PENALTY_N1;
        else if (run > 5) n1 += 1;
      } else {
        run = 1;
      }
    }
    for (let i = 0; i + 11 <= size; i++) {
      let bits = 0;
      for (let k = 0; k < 11; k++) bits = (bits << 1) | read(i + k);
      if (bits === 0b10111010000 || bits === 0b00001011101) n3 += PENALTY_N3;
    }
  };

  for (let a = 0; a < size; a++) {
    scanLine((i) => at(i, a)); // row a
    scanLine((i) => at(a, i)); // column a
  }

  for (let y = 0; y + 1 < size; y++) {
    for (let x = 0; x + 1 < size; x++) {
      const v = at(x, y);
      if (v === at(x + 1, y) && v === at(x, y + 1) && v === at(x + 1, y + 1)) n2 += PENALTY_N2;
    }
  }

  let dark = 0;
  for (let i = 0; i < modules.length; i++) dark += modules[i]!;
  const n4 = Math.floor((Math.abs(dark * 2 - size * size) * 10) / (size * size)) * PENALTY_N4;

  return n1 + n2 + n3 + n4;
}

describe("penaltyScore", () => {
  it("scores nothing for a checkerboard, which has no runs, blocks or imbalance", () => {
    const rows = Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => ((x + y) % 2 === 0 ? "#" : ".")).join(""),
    );
    const { modules, size } = grid(rows);
    expect(penaltyScore(modules, size)).toBe(0);
  });

  it("matches a rule-by-rule reference implementation, term for term", () => {
    // One fully derived case, spelled out so the reference itself is anchored:
    // a 5×5 grid whose top row is dark.
    //   rule 1  row 0 is a dark run of 5 (3) and rows 1–4 are light runs of 5
    //           (3 each) → 15; no column reaches 5.
    //   rule 2  rows 1–4 hold 3×4 = 12 solid light 2×2 blocks → 36.
    //   rule 3  none.
    //   rule 4  5 of 25 dark → floor(|10−25|·10/25) = 6 steps → 60.
    const { modules, size } = grid(["#####", ".....", ".....", ".....", "....."]);
    expect(penaltyScore(modules, size)).toBe(15 + 36 + 0 + 60);
    expect(referencePenalty(modules, size)).toBe(15 + 36 + 0 + 60);
  });

  it("agrees with the reference on structured grids", () => {
    const cases: string[][] = [
      ["##..", "##..", "....", "...."], // a single solid block
      ["###.", "###.", "....", "...."], // two overlapping blocks
      ["#.###.#....", ...Array.from({ length: 10 }, () => ".".repeat(11))], // finder lookalike
      ["....#.###.#", ...Array.from({ length: 10 }, () => ".".repeat(11))], // …reversed
      Array.from({ length: 11 }, () => "#.###.#...."), // the lookalike in every row
      Array.from({ length: 12 }, () => "#".repeat(12)), // all dark
      Array.from({ length: 12 }, () => ".".repeat(12)), // all light
    ];
    for (const rows of cases) {
      const { modules, size } = grid(rows);
      expect(penaltyScore(modules, size)).toBe(referencePenalty(modules, size));
    }
  });

  it("agrees with the reference on pseudo-random grids", () => {
    // A fixed LCG keeps this deterministic — a failing seed is reproducible.
    let seed = 0x2f6e2b1;
    const next = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (const size of [11, 21, 25, 33]) {
      for (const density of [0.2, 0.5, 0.8]) {
        const modules = new Uint8Array(size * size);
        for (let i = 0; i < modules.length; i++) modules[i] = next() < density ? 1 : 0;
        expect(penaltyScore(modules, size)).toBe(referencePenalty(modules, size));
      }
    }
  });

  it("charges rule 3 identically in both orientations and both axes", () => {
    const blank = ".".repeat(11);
    const forward = grid(["#.###.#....", ...Array.from({ length: 10 }, () => blank)]);
    const backward = grid(["....#.###.#", ...Array.from({ length: 10 }, () => blank)]);
    expect(penaltyScore(forward.modules, forward.size)).toBe(
      penaltyScore(backward.modules, backward.size),
    );

    // The same pattern rotated into a column must cost the same.
    const column = new Uint8Array(11 * 11);
    for (let i = 0; i < 11; i++) column[i * 11] = forward.modules[i]!;
    expect(penaltyScore(column, 11)).toBe(penaltyScore(forward.modules, 11));
  });

  it("charges rule 4 in whole 5% steps away from an even balance", () => {
    // Checkerboard rows keep runs at 1 and leave no 2×2 block or finder
    // lookalike, so the only term that can move is the balance one. Flipping
    // whole rows dark then adjusts the dark count in known increments.
    const size = 10;
    const build = (darkRows: number): { modules: Uint8Array; size: number } => {
      const modules = new Uint8Array(size * size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          modules[y * size + x] = y < darkRows ? 1 : (x + y) % 2 === 0 ? 1 : 0;
        }
      }
      return { modules, size };
    };

    // 5 checkerboard rows dark + 5 solid rows → 50 + 25 = 75 of 100 dark.
    const balanced = build(0); // 50/100 → 0 steps
    expect(penaltyScore(balanced.modules, balanced.size) % PENALTY_N4).toBe(0);

    // Verified against the reference implementation, which computes the four
    // rules separately — so this asserts the fused version, not itself.
    for (const darkRows of [0, 1, 2, 4, 6, 10]) {
      const grid = build(darkRows);
      expect(penaltyScore(grid.modules, grid.size)).toBe(
        referencePenalty(grid.modules, grid.size),
      );
    }

    // And the balance term itself moves in 10-point steps as the count drifts.
    const term = (dark: number): number =>
      Math.floor((Math.abs(dark * 2 - 100) * 10) / 100) * PENALTY_N4;
    expect([term(50), term(48), term(45), term(20), term(0)]).toEqual([0, 0, 10, 60, 100]);
  });
});

describe("applyBestMask", () => {
  it("chooses the lowest-scoring mask", () => {
    const codewords = new Uint8Array(26).fill(0b10110100);
    const scores: number[] = [];
    for (let mask = 0; mask < 8; mask++) {
      const candidate = buildMatrix(codewords, 1, "M");
      const applied = applyBestMask(candidate, mask);
      scores.push(penaltyScore(applied.modules, applied.size));
    }
    const best = scores.indexOf(Math.min(...scores));

    const auto = applyBestMask(buildMatrix(codewords, 1, "M"));
    expect(auto.mask).toBe(best);
  });

  it("writes the format information for the mask it chose", () => {
    // Re-deriving the format bits from the symbol proves the two agree.
    const matrix = encodeQR("USEFY", { level: "Q" });
    let read = 0;
    for (let i = 0; i <= 5; i++) read |= (matrix.get(8, i) ? 1 : 0) << i;
    read |= (matrix.get(8, 7) ? 1 : 0) << 6;
    read |= (matrix.get(8, 8) ? 1 : 0) << 7;
    read |= (matrix.get(7, 8) ? 1 : 0) << 8;
    for (let i = 9; i < 15; i++) read |= (matrix.get(14 - i, 8) ? 1 : 0) << i;

    const data = (read ^ 0x5412) >>> 10;
    expect(data & 0b111).toBe(matrix.mask);
    expect(data >>> 3).toBe(3); // Q
  });

  it("rejects an invalid forced mask", () => {
    const raw = buildMatrix(new Uint8Array(26), 1, "M");
    expect(() => applyBestMask(raw, 8)).toThrow(RangeError);
    expect(() => applyBestMask(raw, -1)).toThrow(RangeError);
    expect(() => applyBestMask(raw, 2.5)).toThrow(RangeError);
  });

  it("exposes the published penalty weights", () => {
    expect([PENALTY_N1, PENALTY_N2, PENALTY_N3, PENALTY_N4]).toEqual([3, 3, 40, 10]);
  });
});
