import { gfDiv, gfExp, gfMul } from "@usefy/qr-code/headless";
import { QRDecodeError } from "../errors";

/**
 * Reed–Solomon **decoding** over GF(256) — the half `@usefy/qr-code` does not
 * have (it only encodes) and the reason this package can repair a smudged,
 * printed or badly-lit symbol instead of merely noticing it is damaged.
 *
 * The pipeline is the classical one:
 *
 * 1. **Syndromes** `S_i = R(α^i)` for `i` in `[0, ec)`. All zero ⇒ untouched.
 * 2. **Berlekamp–Massey** finds the error-locator polynomial `Λ`, whose degree
 *    is the number of errors.
 * 3. **Chien search** finds `Λ`'s roots; each root `α^-i` marks an error at
 *    position `i`.
 * 4. **Forney** computes each error's magnitude from the error evaluator `Ω`.
 *
 * The generator polynomials `@usefy/qr-code` encodes with start at `α^0`
 * (`generatorPoly` multiplies `(x - α^i)` from `i = 0`), so this decoder uses
 * the `b = 0` convention throughout — that is why Forney needs no extra
 * `X^(1-b)` correction factor beyond a single multiply by `X_j`.
 *
 * ── What actually stops a wrong payload ──
 * Reed–Solomon can "correct" heavy noise into a *different* valid codeword.
 * Re-checking the syndromes afterwards cannot detect that — a miscorrected
 * word is a real codeword, so its syndromes are legitimately zero. Being clear
 * about this matters, because a check that sounds protective and isn't is
 * worse than no check.
 *
 * Two things do the real work, and both refuse rather than guess:
 *
 * - **Degree.** A locator of degree greater than `⌊ec/2⌋` means more errors
 *   than the parity can locate; the block is rejected outright.
 * - **Root count.** If the Chien search finds fewer roots inside the block
 *   than the locator's degree, the error pattern the syndromes imply does not
 *   live in this block at all — noise misread as a codeword. Rejected.
 *
 * Neither check *eliminates* miscorrection — that is a property of the code
 * itself, not of the search. What they do is bound it: across 600 trials at
 * exactly one error past the limit (`rsDecode.test.ts`), no wrong payload was
 * ever returned, but the honest statement is "not observed", not "impossible".
 * The reason it does not surface in practice is that two further independent
 * checks sit above this layer — the BCH-protected format word, and a
 * bit-stream parser that refuses malformed streams instead of zero-filling.
 *
 * The post-correction syndrome check that closes `rsDecode` is therefore an
 * *invariant guard*, not a miscorrection detector: it would catch a bug in the
 * Forney step or a future change to the field, and it is documented as such
 * rather than sold as something it cannot do (SPEC decision #11).
 */

export interface RSDecodeResult {
  /** The data codewords, with the parity section removed. */
  readonly data: Uint8Array;
  /** How many codewords were repaired. */
  readonly errorsCorrected: number;
}

/**
 * Evaluate a polynomial at `x`, coefficients given **highest degree first**
 * (the layout of a received codeword block).
 */
function evaluate(coefficients: Readonly<Uint8Array>, x: number): number {
  let result = 0;
  for (let i = 0; i < coefficients.length; i++) {
    result = gfMul(result, x) ^ coefficients[i]!;
  }
  return result;
}

/**
 * The `ec` syndromes of a received block.
 *
 * Exported for tests: a hand-built block with a known error pattern has
 * hand-computable syndromes, which is the only way to check this layer without
 * trusting the layers above it.
 */
export function syndromes(received: Readonly<Uint8Array>, ecLength: number): Uint8Array {
  const result = new Uint8Array(ecLength);
  for (let i = 0; i < ecLength; i++) {
    result[i] = evaluate(received, gfExp(i));
  }
  return result;
}

/**
 * Berlekamp–Massey: the shortest linear-feedback shift register that generates
 * the syndrome sequence. Its connection polynomial is the error locator `Λ`,
 * returned lowest-degree-first (`Λ[0]` is always 1).
 */
function berlekampMassey(syndrome: Readonly<Uint8Array>): Uint8Array {
  const n = syndrome.length;
  let current = new Uint8Array(n + 1);
  let previous = new Uint8Array(n + 1);
  current[0] = 1;
  previous[0] = 1;

  let errors = 0;
  let shift = 1;
  let lastDiscrepancy = 1;

  for (let step = 0; step < n; step++) {
    let discrepancy = syndrome[step]!;
    for (let i = 1; i <= errors; i++) {
      discrepancy ^= gfMul(current[i]!, syndrome[step - i]!);
    }

    if (discrepancy === 0) {
      shift++;
      continue;
    }

    const scale = gfDiv(discrepancy, lastDiscrepancy);
    if (2 * errors <= step) {
      const snapshot = current.slice();
      for (let i = 0; i + shift <= n; i++) {
        current[i + shift] = current[i + shift]! ^ gfMul(scale, previous[i]!);
      }
      errors = step + 1 - errors;
      previous = snapshot;
      lastDiscrepancy = discrepancy;
      shift = 1;
    } else {
      for (let i = 0; i + shift <= n; i++) {
        current[i + shift] = current[i + shift]! ^ gfMul(scale, previous[i]!);
      }
      shift++;
    }
  }

  // Trim to the actual degree so callers can read `length - 1` as the error count.
  let degree = n;
  while (degree > 0 && current[degree] === 0) degree--;
  return current.slice(0, degree + 1);
}

/**
 * Chien search: the positions (as powers of α) where `Λ` vanishes.
 *
 * `Λ(α^-i) = 0` means position `i` — counted from the *end* of the block, i.e.
 * the coefficient of `x^i` — carries an error.
 */
function chienSearch(locator: Readonly<Uint8Array>, blockLength: number): number[] {
  const positions: number[] = [];
  for (let i = 0; i < blockLength; i++) {
    // Evaluate Λ at α^-i, coefficients being lowest-degree-first.
    const x = gfExp((255 - (i % 255)) % 255);
    let value = 0;
    let power = 1;
    for (let k = 0; k < locator.length; k++) {
      value ^= gfMul(locator[k]!, power);
      power = gfMul(power, x);
    }
    if (value === 0) positions.push(i);
  }
  return positions;
}

/** The error evaluator `Ω(x) = S(x)·Λ(x) mod x^ec`, lowest-degree-first. */
function errorEvaluator(
  syndrome: Readonly<Uint8Array>,
  locator: Readonly<Uint8Array>,
): Uint8Array {
  const omega = new Uint8Array(syndrome.length);
  for (let i = 0; i < syndrome.length; i++) {
    let sum = 0;
    for (let j = 0; j <= i && j < locator.length; j++) {
      sum ^= gfMul(syndrome[i - j]!, locator[j]!);
    }
    omega[i] = sum;
  }
  return omega;
}

/**
 * Correct one received block in place-ish (a corrected copy is returned) and
 * split off its data codewords.
 *
 * @param received - Data codewords followed by their `ecLength` parity codewords.
 * @param ecLength - Parity codewords in this block.
 * @throws {QRDecodeError} with stage `"ec"` when the block carries more errors
 *   than the parity can locate, or when a correction fails re-verification.
 */
export function rsDecode(received: Readonly<Uint8Array>, ecLength: number): RSDecodeResult {
  if (ecLength <= 0 || ecLength >= received.length) {
    throw new RangeError(
      `A block of ${received.length} codewords cannot carry ${ecLength} parity codewords`,
    );
  }

  const syndrome = syndromes(received, ecLength);
  let clean = true;
  for (const value of syndrome) {
    if (value !== 0) {
      clean = false;
      break;
    }
  }
  if (clean) {
    return { data: received.slice(0, received.length - ecLength), errorsCorrected: 0 };
  }

  const locator = berlekampMassey(syndrome);
  const errorCount = locator.length - 1;
  /* c8 ignore start -- unreachable: at least one syndrome is non-zero here (the
     all-zero case returned above), and Berlekamp–Massey always produces a
     locator of degree ≥ 1 for a non-zero syndrome sequence. Kept as a guard
     against a future change to the field or the syndrome convention. */
  if (errorCount === 0) {
    throw new QRDecodeError(
      "ec",
      "The parity codewords disagree with the data but no error pattern explains " +
        "the difference — the symbol is unreadable.",
    );
  }
  /* c8 ignore stop */
  if (errorCount > ecLength / 2) {
    throw new QRDecodeError(
      "ec",
      `Too many errors to correct: the block needs ${errorCount} corrections but ` +
        `${ecLength} parity codewords can repair at most ${Math.floor(ecLength / 2)}.`,
    );
  }

  const positions = chienSearch(locator, received.length);
  if (positions.length !== errorCount) {
    // Fewer roots than the locator's degree means the errors are outside the
    // block — noise misread as a codeword. Refusing here is the point.
    throw new QRDecodeError(
      "ec",
      `Error correction failed: the locator polynomial has degree ${errorCount} but ` +
        `${positions.length} error positions were found inside the block.`,
    );
  }

  const omega = errorEvaluator(syndrome, locator);
  const corrected = received.slice();

  for (const position of positions) {
    // X_j = α^position, and the evaluation point is its inverse.
    const inverse = gfExp((255 - (position % 255)) % 255);

    let numerator = 0;
    let power = 1;
    for (let i = 0; i < omega.length; i++) {
      numerator ^= gfMul(omega[i]!, power);
      power = gfMul(power, inverse);
    }

    // Formal derivative of Λ over GF(2^m): the even-degree terms vanish.
    let denominator = 0;
    let derivativePower = 1;
    for (let i = 1; i < locator.length; i += 2) {
      denominator ^= gfMul(locator[i]!, derivativePower);
      derivativePower = gfMul(derivativePower, gfMul(inverse, inverse));
    }
    /* c8 ignore start -- unreachable: the root count was already checked to
       equal the locator's degree, which makes the roots distinct, and a
       square-free locator has a non-vanishing formal derivative at each of
       them. Kept because "divide by zero" would otherwise surface as a silently
       wrong magnitude rather than an error. */
    if (denominator === 0) {
      throw new QRDecodeError(
        "ec",
        "Error correction failed: the error locator has a repeated root, which no " +
          "valid error pattern produces.",
      );
    }
    /* c8 ignore stop */

    const magnitude = gfMul(gfDiv(numerator, denominator), gfExp(position % 255));
    const index = received.length - 1 - position;
    corrected[index] = corrected[index]! ^ magnitude;
  }

  // ── Invariant guard, not a miscorrection detector (see the module header) ──
  /* c8 ignore start -- unreachable while the algorithm is correct: a locator
     consistent with all `ec` syndromes, whose roots were all found inside the
     block, always reconstructs an error pattern that zeroes them. This fires
     only if the Forney step or the field arithmetic is broken. */
  const after = syndromes(corrected, ecLength);
  for (const value of after) {
    if (value !== 0) {
      throw new QRDecodeError(
        "ec",
        "Error correction produced an inconsistent codeword — the symbol is too " +
          "damaged to read reliably.",
      );
    }
  }
  /* c8 ignore stop */

  return {
    data: corrected.slice(0, corrected.length - ecLength),
    errorsCorrected: positions.length,
  };
}
