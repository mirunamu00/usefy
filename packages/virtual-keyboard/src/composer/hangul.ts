import type { Composer, ComposerResult, ComposerState } from "../types";

// ============================================================================
// Hangul 두벌식 (dubeolsik) composer
// ----------------------------------------------------------------------------
// A finite-state 한글 오토마타 that combines a stream of compatibility jamo
// (ㄱ, ㅏ, ㅐ, …) into complete syllable blocks (가, 각, 값, 과, …). It handles
// the four hard cases: initial/medial/final assembly, compound vowels (ㅗ+ㅏ→ㅘ),
// compound finals (ㄱ+ㅅ→ㄳ), and final→initial migration when a vowel follows a
// completed block (강+ㅏ → 가+ㅏ → …, 값+ㅏ → 갑+사).
//
// State is carried entirely in `ComposerState.buffer` as the *rendered* in-progress
// syllable (e.g. "각" or a lone "ㄱ"/"ㅏ"), so the interface stays the plain
// `{ buffer: string }` and every step is a pure function of (buffer, key).
// ============================================================================

/** Compatibility-jamo tables, indexed as the Unicode syllable composition expects. */
// prettier-ignore
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]; // 19 initials
// prettier-ignore
const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"]; // 21 medials
// prettier-ignore
const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]; // 28 finals (index 0 = none)

const HANGUL_BASE = 0xac00; // '가'
const HANGUL_LAST = 0xd7a3; // '힣'

/** Two single vowels that merge into a compound medial, keyed by `base + added`. */
// prettier-ignore
const JUNG_COMBINE: Record<string, number> = {
  "ㅗㅏ": 9, "ㅗㅐ": 10, "ㅗㅣ": 11, // ㅘ ㅙ ㅚ
  "ㅜㅓ": 14, "ㅜㅔ": 15, "ㅜㅣ": 16, // ㅝ ㅞ ㅟ
  "ㅡㅣ": 19,                         // ㅢ
};

/** A single final + a consonant that merge into a compound final, keyed by `final + cons`. */
// prettier-ignore
const JONG_COMBINE: Record<string, number> = {
  "ㄱㅅ": 3,                                                             // ㄳ
  "ㄴㅈ": 5, "ㄴㅎ": 6,                                                   // ㄵ ㄶ
  "ㄹㄱ": 9, "ㄹㅁ": 10, "ㄹㅂ": 11, "ㄹㅅ": 12, "ㄹㅌ": 13, "ㄹㅍ": 14, "ㄹㅎ": 15, // ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ
  "ㅂㅅ": 18,                                                            // ㅄ
};

/** Inverse of {@link JUNG_COMBINE}: compound medial index → base medial index. */
const JUNG_DECOMPOSE: Record<number, number> = {};
for (const [pair, idx] of Object.entries(JUNG_COMBINE)) {
  JUNG_DECOMPOSE[idx] = JUNG.indexOf(pair[0]);
}

/** Inverse of {@link JONG_COMBINE}: compound final index → `[keptFinalChar, migratingConsonant]`. */
const JONG_DECOMPOSE: Record<number, [string, string]> = {};
for (const [pair, idx] of Object.entries(JONG_COMBINE)) {
  JONG_DECOMPOSE[idx] = [pair[0], pair[1]];
}

const isConsonant = (ch: string): boolean => CHO.includes(ch);
const isVowel = (ch: string): boolean => JUNG.includes(ch);

/** A decomposed in-progress syllable. `cho`/`jung` are `-1` when absent; `jong` is `0` when absent. */
interface Syllable {
  cho: number;
  jung: number;
  jong: number;
}

/** Parse the buffer (a syllable, a lone jamo, or "") back into its components. */
function decompose(buffer: string): Syllable {
  if (buffer.length === 1) {
    const code = buffer.charCodeAt(0);
    if (code >= HANGUL_BASE && code <= HANGUL_LAST) {
      const s = code - HANGUL_BASE;
      return { cho: Math.floor(s / 588), jung: Math.floor((s % 588) / 28), jong: s % 28 };
    }
    if (isConsonant(buffer)) return { cho: CHO.indexOf(buffer), jung: -1, jong: 0 };
    if (isVowel(buffer)) return { cho: -1, jung: JUNG.indexOf(buffer), jong: 0 };
  }
  return { cho: -1, jung: -1, jong: 0 };
}

/** Render a decomposed syllable back to a string (full block, lone jamo, or ""). */
function compose({ cho, jung, jong }: Syllable): string {
  if (cho >= 0 && jung >= 0) {
    return String.fromCharCode(HANGUL_BASE + cho * 588 + jung * 28 + jong);
  }
  if (cho >= 0) return CHO[cho];
  if (jung >= 0) return JUNG[jung];
  return "";
}

const result = (committed: string, composing: string): ComposerResult => ({
  committed,
  composing,
  next: { buffer: composing },
});

/** Apply one compatibility jamo (or any other char) to the current composing buffer. */
function input(state: ComposerState, key: string): ComposerResult {
  const buffer = state.buffer ?? "";

  // Anything that is not a jamo (digit, space, punctuation) flushes the pending
  // syllable and commits itself — matching how an OS IME behaves.
  if (!isConsonant(key) && !isVowel(key)) {
    return result(buffer + key, "");
  }

  const s = decompose(buffer);
  let committed = "";

  if (isConsonant(key)) {
    const asJong = JONG.indexOf(key); // -1 for ㄸ/ㅃ/ㅉ (never valid finals)
    if (s.cho < 0 && s.jung < 0) {
      // Empty buffer → begin a new syllable with this initial.
      s.cho = CHO.indexOf(key);
    } else if (s.jung < 0) {
      // Two consonants with no vowel between them: commit, restart.
      committed = compose(s);
      s.cho = CHO.indexOf(key);
    } else if (s.jong === 0) {
      if (s.cho < 0) {
        // A lone medial (vowel with no initial) can't take a final → commit it
        // and let this consonant lead a new syllable.
        committed = compose(s);
        s.cho = CHO.indexOf(key);
        s.jung = -1;
      } else if (asJong > 0) {
        s.jong = asJong; // consonant becomes the final
      } else {
        committed = compose(s); // ㄸ/ㅃ/ㅉ can't be a final → commit, restart
        s.cho = CHO.indexOf(key);
        s.jung = -1;
      }
    } else {
      const combined = JONG_COMBINE[JONG[s.jong] + key];
      if (combined) {
        s.jong = combined; // ㄱ + ㅅ → ㄳ, …
      } else {
        committed = compose(s); // final already set/incompatible → commit, restart
        s.cho = CHO.indexOf(key);
        s.jung = -1;
        s.jong = 0;
      }
    }
  } else {
    const vIdx = JUNG.indexOf(key);
    if (s.jung < 0) {
      // Empty buffer or lone initial → attach the medial (가, or a lone ㅏ).
      s.jung = vIdx;
    } else if (s.jong === 0) {
      const combined = JUNG_COMBINE[JUNG[s.jung] + key];
      if (combined !== undefined) {
        s.jung = combined; // ㅗ + ㅏ → ㅘ, …
      } else {
        committed = compose(s); // two medials that don't merge → commit, new lone vowel
        s.cho = -1;
        s.jung = vIdx;
      }
    } else {
      // A vowel after a completed block: the final migrates to lead a new syllable.
      const split = JONG_DECOMPOSE[s.jong];
      if (split) {
        const [keep, move] = split;
        committed = compose({ cho: s.cho, jung: s.jung, jong: JONG.indexOf(keep) });
        s.cho = CHO.indexOf(move);
      } else {
        committed = compose({ cho: s.cho, jung: s.jung, jong: 0 });
        s.cho = CHO.indexOf(JONG[s.jong]);
      }
      s.jung = vIdx;
      s.jong = 0;
    }
  }

  return result(committed, compose(s));
}

/** Flush the pending syllable into committed text (called on space/enter). */
function flush(state: ComposerState): ComposerResult {
  return result(state.buffer ?? "", "");
}

/** Delete the last jamo of the composing syllable (compound-aware), committing nothing. */
function backspace(state: ComposerState): ComposerResult {
  const buffer = state.buffer ?? "";
  if (buffer === "") return result("", "");
  const s = decompose(buffer);

  if (s.jong !== 0) {
    const split = JONG_DECOMPOSE[s.jong];
    s.jong = split ? JONG.indexOf(split[0]) : 0; // ㄳ → ㄱ, else drop the final
  } else if (s.jung >= 0) {
    const base = JUNG_DECOMPOSE[s.jung];
    s.jung = base !== undefined ? base : -1; // ㅘ → ㅗ, else drop the medial
  } else {
    s.cho = -1; // drop the lone initial
  }

  return result("", compose(s));
}

/**
 * The Korean **두벌식 (dubeolsik)** IME composer — an opt-in {@link Composer} that
 * assembles compatibility jamo into Hangul syllable blocks with full support for
 * compound vowels/finals and final→initial migration.
 *
 * Attach it to a layout (see {@link hangulLayout}) or pass it directly; the
 * {@link VirtualKeyboard} renders the returned `composing` text as an underlined
 * pending block until it is committed (on the next block, space, or enter).
 *
 * @example
 * ```ts
 * import { hangulComposer } from "@usefy/virtual-keyboard/hangul";
 *
 * let s = hangulComposer.reset();
 * let r = hangulComposer.input(s, "ㄱ"); // { committed: "", composing: "ㄱ" }
 * r = hangulComposer.input(r.next, "ㅏ"); // { committed: "", composing: "가" }
 * r = hangulComposer.input(r.next, "ㅁ"); // { committed: "", composing: "감" }
 * r = hangulComposer.flush(r.next);       // { committed: "감", composing: "" }
 * ```
 */
export const hangulComposer: Composer = {
  input,
  flush,
  backspace,
  reset() {
    return { buffer: "" };
  },
};
