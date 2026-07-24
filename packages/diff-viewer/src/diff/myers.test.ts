import { describe, expect, it } from "vitest";

import { myersDiff, myersDiffBounded, type DiffOp } from "./myers";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Apply an edit script to `a` and return the sequence it produces. */
function applyOps<T>(ops: readonly DiffOp[], a: readonly T[], b: readonly T[]): T[] {
  const out: T[] = [];
  for (const op of ops) {
    if (op.type === "equal") out.push(...a.slice(op.aIndex, op.aIndex + op.length));
    else if (op.type === "insert") out.push(...b.slice(op.bIndex, op.bIndex + op.length));
  }
  return out;
}

/** Edit distance implied by a script (number of deleted + inserted elements). */
function editDistance(ops: readonly DiffOp[]): number {
  return ops.reduce((sum, op) => (op.type === "equal" ? sum : sum + op.length), 0);
}

/** Number of matched elements implied by a script. */
function lcsLength(ops: readonly DiffOp[]): number {
  return ops.reduce((sum, op) => (op.type === "equal" ? sum + op.length : sum), 0);
}

/**
 * An **independent** longest-common-subsequence length, by textbook
 * dynamic programming — deliberately sharing no code with the
 * implementation under test.
 *
 * This is the optimality oracle. Well-formedness (below) only proves a
 * script is *valid*; a middle-snake regression that returns a valid but
 * longer-than-necessary script would sail past it. `LCS` pins the one number
 * that makes a script optimal: the edit distance of a shortest script is
 * exactly `|a| + |b| − 2·LCS(a, b)`.
 *
 * O(|a|·|b|) time, O(|b|) space — far too slow to ship, which is the whole
 * point of having Myers, and exactly why it makes a trustworthy oracle.
 */
function lcsLengthOracle<T>(a: readonly T[], b: readonly T[]): number {
  const m = b.length;
  let previous = new Int32Array(m + 1);
  let current = new Int32Array(m + 1);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= m; j++) {
      current[j] =
        a[i - 1] === b[j - 1]
          ? previous[j - 1] + 1
          : Math.max(previous[j], current[j - 1]);
    }
    const swap = previous;
    previous = current;
    current = swap;
    current.fill(0);
  }
  return previous[m];
}

/** Assert the script is not merely valid but *shortest* (SPEC §3.1). */
function expectOptimal<T>(ops: readonly DiffOp[], a: readonly T[], b: readonly T[]): void {
  const lcs = lcsLengthOracle(a, b);
  expect(lcsLength(ops)).toBe(lcs);
  expect(editDistance(ops)).toBe(a.length + b.length - 2 * lcs);
}

/**
 * Structural invariants every script must satisfy, independent of which
 * optimal path the algorithm happened to take.
 */
function expectWellFormed<T>(ops: readonly DiffOp[], a: readonly T[], b: readonly T[]): void {
  let aCursor = 0;
  let bCursor = 0;
  ops.forEach((op, index) => {
    // No zero-length ops.
    expect(op.length).toBeGreaterThan(0);
    // No adjacent same-type ops (they must be merged).
    if (index > 0) expect(ops[index - 1].type).not.toBe(op.type);
    // Canonical order: a change run is deletions first, then insertions.
    if (index > 0 && ops[index - 1].type === "insert") expect(op.type).not.toBe("delete");
    // Indices advance monotonically and describe the same walk.
    expect(op.aIndex).toBe(aCursor);
    expect(op.bIndex).toBe(bCursor);
    if (op.type !== "insert") aCursor += op.length;
    if (op.type !== "delete") bCursor += op.length;
    // "equal" really is equal.
    if (op.type === "equal") {
      expect(a.slice(op.aIndex, op.aIndex + op.length)).toEqual(
        b.slice(op.bIndex, op.bIndex + op.length),
      );
    }
  });
  expect(aCursor).toBe(a.length);
  expect(bCursor).toBe(b.length);
  // The contract: applying the script to `a` reconstructs `b`.
  expect(applyOps(ops, a, b)).toEqual([...b]);
}

/** Deterministic 32-bit PRNG (mulberry32) — no Math.random, ever. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const chars = (s: string) => s.split("");

/* -------------------------------------------------------------------------- */
/* Hand-computed scripts                                                      */
/* -------------------------------------------------------------------------- */

describe("myersDiff — trivial cases", () => {
  it("returns no ops for two empty sequences", () => {
    expect(myersDiff([], [])).toEqual([]);
  });

  it("returns a single insert when a is empty", () => {
    expect(myersDiff([], chars("abc"))).toEqual([
      { type: "insert", aIndex: 0, bIndex: 0, length: 3 },
    ]);
  });

  it("returns a single delete when b is empty", () => {
    expect(myersDiff(chars("abc"), [])).toEqual([
      { type: "delete", aIndex: 0, bIndex: 0, length: 3 },
    ]);
  });

  it("returns a single equal for identical sequences", () => {
    expect(myersDiff(chars("abc"), chars("abc"))).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 3 },
    ]);
  });

  it("returns delete-then-insert when nothing matches", () => {
    // LCS is empty, so the only optimal script is "delete all, insert all".
    expect(myersDiff(chars("ab"), chars("xy"))).toEqual([
      { type: "delete", aIndex: 0, bIndex: 0, length: 2 },
      { type: "insert", aIndex: 2, bIndex: 0, length: 2 },
    ]);
  });
});

describe("myersDiff — hand-computed scripts (unique optimal solutions)", () => {
  it("insert at head", () => {
    // a = b c ; b = a b c ; LCS = "bc" ⇒ the only optimal script inserts "a".
    expect(myersDiff(chars("bc"), chars("abc"))).toEqual([
      { type: "insert", aIndex: 0, bIndex: 0, length: 1 },
      { type: "equal", aIndex: 0, bIndex: 1, length: 2 },
    ]);
  });

  it("insert in the middle", () => {
    expect(myersDiff(chars("ac"), chars("abc"))).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 1 },
      { type: "insert", aIndex: 1, bIndex: 1, length: 1 },
      { type: "equal", aIndex: 1, bIndex: 2, length: 1 },
    ]);
  });

  it("insert at tail", () => {
    expect(myersDiff(chars("ab"), chars("abc"))).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 2 },
      { type: "insert", aIndex: 2, bIndex: 2, length: 1 },
    ]);
  });

  it("delete at head", () => {
    expect(myersDiff(chars("abc"), chars("bc"))).toEqual([
      { type: "delete", aIndex: 0, bIndex: 0, length: 1 },
      { type: "equal", aIndex: 1, bIndex: 0, length: 2 },
    ]);
  });

  it("delete in the middle", () => {
    expect(myersDiff(chars("abc"), chars("ac"))).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 1 },
      { type: "delete", aIndex: 1, bIndex: 1, length: 1 },
      { type: "equal", aIndex: 2, bIndex: 1, length: 1 },
    ]);
  });

  it("delete at tail", () => {
    expect(myersDiff(chars("abc"), chars("ab"))).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 2 },
      { type: "delete", aIndex: 2, bIndex: 2, length: 1 },
    ]);
  });

  it("replace in the middle (delete before insert)", () => {
    expect(myersDiff(chars("abc"), chars("axc"))).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 1 },
      { type: "delete", aIndex: 1, bIndex: 1, length: 1 },
      { type: "insert", aIndex: 2, bIndex: 1, length: 1 },
      { type: "equal", aIndex: 2, bIndex: 2, length: 1 },
    ]);
  });

  it("replace at head", () => {
    expect(myersDiff(chars("abc"), chars("xbc"))).toEqual([
      { type: "delete", aIndex: 0, bIndex: 0, length: 1 },
      { type: "insert", aIndex: 1, bIndex: 0, length: 1 },
      { type: "equal", aIndex: 1, bIndex: 1, length: 2 },
    ]);
  });

  it("replace at tail", () => {
    expect(myersDiff(chars("abc"), chars("abx"))).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 2 },
      { type: "delete", aIndex: 2, bIndex: 2, length: 1 },
      { type: "insert", aIndex: 3, bIndex: 2, length: 1 },
    ]);
  });

  it("wraps a single kept element in inserts on both sides", () => {
    expect(myersDiff(chars("a"), chars("bac"))).toEqual([
      { type: "insert", aIndex: 0, bIndex: 0, length: 1 },
      { type: "equal", aIndex: 0, bIndex: 1, length: 1 },
      { type: "insert", aIndex: 1, bIndex: 2, length: 1 },
    ]);
  });

  it("merges a multi-element deletion into one op", () => {
    expect(myersDiff(chars("axyzb"), chars("ab"))).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 1 },
      { type: "delete", aIndex: 1, bIndex: 1, length: 3 },
      { type: "equal", aIndex: 4, bIndex: 1, length: 1 },
    ]);
  });

  it("diffs line arrays, not just characters", () => {
    const a = ["import x", "", "function f() {", "  return 1;", "}"];
    const b = ["import x", "", "function f() {", "  return 2;", "}"];
    expect(myersDiff(a, b)).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 3 },
      { type: "delete", aIndex: 3, bIndex: 3, length: 1 },
      { type: "insert", aIndex: 4, bIndex: 3, length: 1 },
      { type: "equal", aIndex: 4, bIndex: 4, length: 1 },
    ]);
  });
});

describe("myersDiff — optimality on the paper's example", () => {
  // Myers 1986, §1: A B C A B B A → C B A B A C has edit distance 5
  // (LCS length 4). Several optimal scripts exist, so assert the
  // *properties* an optimal script must have rather than one arbitrary path.
  const a = chars("ABCABBA");
  const b = chars("CBABAC");

  it("finds a shortest edit script (D = 5, LCS = 4)", () => {
    const ops = myersDiff(a, b);
    expectWellFormed(ops, a, b);
    expect(editDistance(ops)).toBe(5);
    expect(lcsLength(ops)).toBe(4);
  });

  it("is symmetric in cost when the inputs are swapped", () => {
    expect(editDistance(myersDiff(b, a))).toBe(5);
    expectWellFormed(myersDiff(b, a), b, a);
  });
});

describe("myersDiff — custom equality", () => {
  it("matches through a case-insensitive comparator", () => {
    const ops = myersDiff(
      ["Alpha", "Beta"],
      ["alpha", "beta"],
      (x, y) => x.toLowerCase() === y.toLowerCase(),
    );
    expect(ops).toEqual([{ type: "equal", aIndex: 0, bIndex: 0, length: 2 }]);
  });

  it("matches objects by key", () => {
    const a = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const b = [{ id: 1 }, { id: 3 }];
    const ops = myersDiff(a, b, (x, y) => x.id === y.id);
    expect(ops).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 1 },
      { type: "delete", aIndex: 1, bIndex: 1, length: 1 },
      { type: "equal", aIndex: 2, bIndex: 1, length: 1 },
    ]);
  });
});

describe("myersDiff — structural invariants across shapes", () => {
  const cases: Array<[string, string]> = [
    ["", ""],
    ["a", ""],
    ["", "a"],
    ["a", "a"],
    ["a", "b"],
    ["abcdef", "abcdef"],
    ["abcdef", "fedcba"],
    ["aaaaaa", "aaa"],
    ["aaa", "aaaaaa"],
    ["abab", "baba"],
    ["the quick brown fox", "the quick brown dog"],
    ["xxxxxxxxxx", "yyyyyyyyyy"],
    ["abcabcabc", "cbacbacba"],
  ];

  it.each(cases)("is well-formed and optimal for %j → %j", (rawA, rawB) => {
    const a = chars(rawA);
    const b = chars(rawB);
    const ops = myersDiff(a, b);
    expectWellFormed(ops, a, b);
    expectOptimal(ops, a, b);
  });
});

describe("myersDiff — optimality against an independent DP oracle", () => {
  /** Every string over `alphabet` of length 0…maxLength. */
  function allStrings(alphabet: string, maxLength: number): string[] {
    const out = [""];
    let frontier = [""];
    for (let length = 1; length <= maxLength; length++) {
      const next: string[] = [];
      for (const prefix of frontier) {
        for (const ch of alphabet) next.push(prefix + ch);
      }
      out.push(...next);
      frontier = next;
    }
    return out;
  }

  it("is optimal for all 3,969 binary-alphabet pairs up to length 5", () => {
    // Exhaustive: 63 strings × 63 strings. A suboptimality bug anywhere in
    // the middle-snake recursion shows up somewhere in this square.
    const strings = allStrings("ab", 5);
    expect(strings).toHaveLength(63);

    let checked = 0;
    for (const rawA of strings) {
      for (const rawB of strings) {
        const a = chars(rawA);
        const b = chars(rawB);
        const ops = myersDiff(a, b);
        expectOptimal(ops, a, b);
        checked++;
      }
    }
    expect(checked).toBe(3969);
  });

  it("is optimal for a 3-symbol alphabet sweep up to length 4", () => {
    const strings = allStrings("abc", 4);
    for (const rawA of strings) {
      for (const rawB of strings) {
        const a = chars(rawA);
        const b = chars(rawB);
        expectOptimal(myersDiff(a, b), a, b);
      }
    }
  });

  it("is optimal across a long-prefix / long-suffix matrix", () => {
    // A small change buried between long identical runs is the shape the
    // linear-space recursion most often gets wrong: the middle snake lands
    // inside a trimmed region and the sub-problem bounds go subtly off.
    const lengths = [0, 1, 2, 3, 7, 16, 40, 129];
    for (const prefixLength of lengths) {
      for (const suffixLength of lengths) {
        const prefix = Array.from({ length: prefixLength }, (_, i) => `p${i}`);
        const suffix = Array.from({ length: suffixLength }, (_, i) => `s${i}`);
        for (const [midA, midB] of [
          [["x"], ["y"]],
          [["x"], []],
          [[], ["y"]],
          [["x", "y"], ["y", "x"]],
          [["x", "y", "z"], ["z", "q"]],
          [[], []],
        ] as Array<[string[], string[]]>) {
          const a = [...prefix, ...midA, ...suffix];
          const b = [...prefix, ...midB, ...suffix];
          const ops = myersDiff(a, b);
          expectWellFormed(ops, a, b);
          expectOptimal(ops, a, b);
        }
      }
    }
  });

  it("is optimal on the paper's example and on repeated-symbol inputs", () => {
    const cases: Array<[string, string]> = [
      ["ABCABBA", "CBABAC"],
      ["aaaaaaaa", "aaa"],
      ["abababab", "babababa"],
      ["abcdefgh", "hgfedcba"],
      ["aabbaabb", "bbaabbaa"],
    ];
    for (const [rawA, rawB] of cases) {
      const a = chars(rawA);
      const b = chars(rawB);
      expectOptimal(myersDiff(a, b), a, b);
    }
  });
});

describe("myersDiffBounded — the edit-distance budget", () => {
  it("returns the same script as myersDiff when the budget is generous", () => {
    const a = chars("ABCABBA");
    const b = chars("CBABAC");
    expect(myersDiffBounded(a, b, 100)).toEqual(myersDiff(a, b));
  });

  it("returns null when the budget is below the true edit distance", () => {
    // "ABCABBA" → "CBABAC" needs 5 edits.
    const a = chars("ABCABBA");
    const b = chars("CBABAC");
    expect(myersDiffBounded(a, b, 4)).toBeNull();
    expect(myersDiffBounded(a, b, 5)).not.toBeNull();
  });

  it("finds the exact boundary for an even-distance family", () => {
    for (let n = 1; n <= 8; n++) {
      const a = Array.from({ length: n }, () => "a");
      const b = Array.from({ length: n }, () => "b");
      const trueDistance = 2 * n; // delete n, insert n
      expect(myersDiffBounded(a, b, trueDistance - 1)).toBeNull();
      expect(myersDiffBounded(a, b, trueDistance)).not.toBeNull();
    }
  });

  it("finds the exact boundary for an odd-distance family", () => {
    // Odd `delta` ⇒ odd edit distance: the parity branch the depth
    // translation has to get right (D = 2d − 1 rather than 2d).
    for (let n = 1; n <= 8; n++) {
      const a = Array.from({ length: n + 1 }, () => "a");
      const b = Array.from({ length: n }, () => "b");
      const trueDistance = 2 * n + 1; // delete n+1, insert n
      expect(myersDiffBounded(a, b, trueDistance - 1)).toBeNull();
      expect(myersDiffBounded(a, b, trueDistance)).not.toBeNull();
    }
  });

  /**
   * True when trimming the common prefix and suffix empties one side, i.e.
   * the pair reduces to a single insertion or deletion. No edit-graph search
   * happens for those, so the budget deliberately never applies to them.
   */
  function reducesToPureIndel(a: readonly string[], b: readonly string[]): boolean {
    let lo = 0;
    while (lo < a.length && lo < b.length && a[lo] === b[lo]) lo++;
    let aHi = a.length;
    let bHi = b.length;
    while (aHi > lo && bHi > lo && a[aHi - 1] === b[bHi - 1]) {
      aHi--;
      bHi--;
    }
    return aHi === lo || bHi === lo;
  }

  it("bounds the budget EXACTLY over an exhaustive small sweep", () => {
    // For every pair the true edit distance is D. The budget must admit every
    // value ≥ D and refuse every value < D — no off-by-one in either
    // direction — EXCEPT for pairs that need no search at all, which are
    // exempt by design and always diff.
    const strings = ["", "a", "b", "ab", "ba", "aab", "aba", "abab", "baba", "abcab"];
    let exempt = 0;
    let bounded = 0;

    for (const rawA of strings) {
      for (const rawB of strings) {
        const a = chars(rawA);
        const b = chars(rawB);
        const trueDistance = editDistance(myersDiff(a, b));
        const searchless = reducesToPureIndel(a, b);
        if (searchless) exempt++;
        else bounded++;

        for (let budget = 0; budget <= trueDistance + 2; budget++) {
          const ops = myersDiffBounded(a, b, budget);
          const label = `${rawA || "∅"}→${rawB || "∅"} budget=${budget} D=${trueDistance}`;

          if (searchless) {
            // Pure insert/delete: no search ⇒ no budget charge, ever.
            expect(ops, `${label} (searchless, must always diff)`).not.toBeNull();
            expectWellFormed(ops!, a, b);
          } else if (budget >= trueDistance) {
            expect(ops, `${label} (budget ≥ D)`).not.toBeNull();
            expectWellFormed(ops!, a, b);
            expectOptimal(ops!, a, b);
          } else {
            expect(ops, `${label} (budget < D)`).toBeNull();
          }
        }
      }
    }

    // Both branches must actually be exercised by the sweep.
    expect(exempt).toBeGreaterThan(0);
    expect(bounded).toBeGreaterThan(0);
  });

  it("never charges the budget for a pure insertion, however large", () => {
    const a: string[] = [];
    const b = Array.from({ length: 50_000 }, (_, i) => `line ${i}`);
    expect(myersDiffBounded(a, b, 1)).toEqual([
      { type: "insert", aIndex: 0, bIndex: 0, length: 50_000 },
    ]);
  });

  it("never charges the budget for a pure deletion, however large", () => {
    const a = Array.from({ length: 50_000 }, (_, i) => `line ${i}`);
    expect(myersDiffBounded(a, [], 1)).toEqual([
      { type: "delete", aIndex: 0, bIndex: 0, length: 50_000 },
    ]);
  });

  it("never charges the budget for a large insertion inside common context", () => {
    // Prefix/suffix trimming reduces this to one insert — no search at all.
    const prefix = Array.from({ length: 500 }, (_, i) => `p${i}`);
    const suffix = Array.from({ length: 500 }, (_, i) => `s${i}`);
    const inserted = Array.from({ length: 10_000 }, (_, i) => `new ${i}`);
    const a = [...prefix, ...suffix];
    const b = [...prefix, ...inserted, ...suffix];

    const ops = myersDiffBounded(a, b, 2);
    expect(ops).not.toBeNull();
    expectWellFormed(ops!, a, b);
  });

  it("never charges the budget for identical inputs", () => {
    const a = Array.from({ length: 10_000 }, (_, i) => `line ${i}`);
    expect(myersDiffBounded(a, [...a], 0)).toEqual([
      { type: "equal", aIndex: 0, bIndex: 0, length: 10_000 },
    ]);
  });

  it("bails far faster than the unbounded search would finish", () => {
    // A ratio rather than a wall-clock budget: coverage instrumentation
    // slows both runs by the same constant, so the comparison holds either
    // way, while an absolute threshold would be flaky under `--coverage`.
    const a = Array.from({ length: 3000 }, (_, i) => `alpha ${i}`);
    const b = Array.from({ length: 3000 }, (_, i) => `beta ${i}`);

    const time = (run: () => unknown) => {
      const started = performance.now();
      run();
      return performance.now() - started;
    };

    const bounded = time(() => myersDiffBounded(a, b, 200));
    const unbounded = time(() => myersDiffBounded(a, b, Infinity));

    expect(myersDiffBounded(a, b, 200)).toBeNull();
    expect(myersDiffBounded(a, b, Infinity)).not.toBeNull();
    expect(bounded * 5).toBeLessThan(unbounded);
  });

  it("treats Infinity as no budget at all", () => {
    const a = chars("ABCABBA");
    const b = chars("CBABAC");
    expect(myersDiffBounded(a, b, Infinity)).toEqual(myersDiff(a, b));
  });

  it("still returns an optimal script when it does not bail", () => {
    const rng = makeRng(0x5150);
    for (let iteration = 0; iteration < 150; iteration++) {
      const a = Array.from({ length: Math.floor(rng() * 25) }, () => "abcd"[Math.floor(rng() * 4)]);
      const b = Array.from({ length: Math.floor(rng() * 25) }, () => "abcd"[Math.floor(rng() * 4)]);
      const ops = myersDiffBounded(a, b, 1000);
      expect(ops).not.toBeNull();
      expectWellFormed(ops!, a, b);
      expectOptimal(ops!, a, b);
    }
  });
});

describe("myersDiff — randomized property test", () => {
  /**
   * The algorithm's contract: applying the ops to `a` must reconstruct `b`
   * exactly. Run over a few hundred seeded random pairs so the assertion is
   * about behaviour, not about one hand-picked input. The PRNG is our own,
   * so a failure is always reproducible from its seed.
   */
  it("reconstructs b from a AND stays optimal for 400 random pairs", () => {
    const rng = makeRng(0x5eed_1986);
    const alphabets = ["ab", "abc", "abcdefgh", "abcdefghijklmnopqrstuvwxyz"];

    for (let iteration = 0; iteration < 400; iteration++) {
      const alphabet = alphabets[Math.floor(rng() * alphabets.length)];
      const lenA = Math.floor(rng() * 40);
      const lenB = Math.floor(rng() * 40);
      const pick = () => alphabet[Math.floor(rng() * alphabet.length)];
      const a = Array.from({ length: lenA }, pick);
      const b = Array.from({ length: lenB }, pick);

      const ops = myersDiff(a, b);
      // The full invariant set, on every single case…
      expectWellFormed(ops, a, b);
      // …plus minimality, against the independent DP oracle.
      expectOptimal(ops, a, b);
    }
  });

  it("reconstructs b when b is a mutation of a (the realistic shape)", () => {
    const rng = makeRng(0xc0ffee);

    for (let iteration = 0; iteration < 200; iteration++) {
      const length = 5 + Math.floor(rng() * 60);
      const a = Array.from({ length }, () => "abcdefghij"[Math.floor(rng() * 10)]);
      const b = [...a];
      const edits = Math.floor(rng() * 8);
      for (let e = 0; e < edits; e++) {
        const at = Math.floor(rng() * (b.length + 1));
        const kind = rng();
        if (kind < 0.34 && b.length > 0) b.splice(Math.min(at, b.length - 1), 1);
        else if (kind < 0.67) b.splice(at, 0, "abcdefghij"[Math.floor(rng() * 10)]);
        else if (b.length > 0) b[Math.min(at, b.length - 1)] = "xyz"[Math.floor(rng() * 3)];
      }

      const ops = myersDiff(a, b);
      expectWellFormed(ops, a, b);
      expectOptimal(ops, a, b);
    }
  });

  it("is deterministic — the same input twice yields deeply equal ops", () => {
    const rng = makeRng(42);
    const a = Array.from({ length: 200 }, () => "abcde"[Math.floor(rng() * 5)]);
    const b = Array.from({ length: 200 }, () => "abcde"[Math.floor(rng() * 5)]);
    expect(myersDiff(a, b)).toEqual(myersDiff(a, b));
  });
});

describe("myersDiff — linear-space behaviour on large inputs", () => {
  it("handles a 4000-element diff without blowing the stack or the heap", () => {
    const rng = makeRng(7);
    const a = Array.from({ length: 4000 }, (_, i) => `line ${i}`);
    const b = [...a];
    // 200 scattered single-line edits — a high edit distance, which is what
    // makes the O(D²)-memory variant fall over.
    for (let i = 0; i < 200; i++) {
      b[Math.floor(rng() * b.length)] = `changed ${i}`;
    }

    const ops = myersDiff(a, b);
    expectWellFormed(ops, a, b);
  });

  it("handles two completely unrelated 2000-element inputs", () => {
    const a = Array.from({ length: 2000 }, (_, i) => `old ${i}`);
    const b = Array.from({ length: 2000 }, (_, i) => `new ${i}`);
    const ops = myersDiff(a, b);
    expect(ops).toEqual([
      { type: "delete", aIndex: 0, bIndex: 0, length: 2000 },
      { type: "insert", aIndex: 2000, bIndex: 0, length: 2000 },
    ]);
  });
});
