import { describe, it, expect } from "vitest";
import { hangulComposer } from "./hangul";
import type { ComposerState } from "../types";

/**
 * Drive a jamo stream through the composer the way the hook does — accumulating
 * `committed` and tracking the trailing `composing` block. `text` is what the
 * user sees (committed + composing).
 */
function type(...jamos: string[]) {
  let state: ComposerState = hangulComposer.reset();
  let committed = "";
  let composing = "";
  for (const j of jamos) {
    const r = hangulComposer.input(state, j);
    committed += r.committed;
    composing = r.composing;
    state = r.next;
  }
  return { committed, composing, text: committed + composing, state };
}

describe("hangulComposer — assembly", () => {
  it("combines an initial + medial into a block", () => {
    expect(type("ㄱ", "ㅏ").composing).toBe("가");
    expect(type("ㄱ", "ㅏ").committed).toBe("");
  });

  it("shows a lone initial before a vowel arrives", () => {
    expect(type("ㄱ").composing).toBe("ㄱ");
  });

  it("adds a final consonant to a block", () => {
    expect(type("ㄱ", "ㅏ", "ㅁ").composing).toBe("감");
  });

  it("assembles a tense (shifted) consonant", () => {
    expect(type("ㄲ", "ㅏ").composing).toBe("까");
    expect(type("ㄲ", "ㅏ", "ㄲ").composing).toBe("깎"); // ㄲ is also a valid final
  });

  it("assembles a tense (shifted) vowel", () => {
    expect(type("ㅇ", "ㅒ").composing).toBe("얘");
  });

  it("shows a lone vowel with no initial", () => {
    expect(type("ㅏ").composing).toBe("ㅏ");
  });

  it("commits a lone vowel when a consonant follows (no dropped jamo)", () => {
    // A medial with no initial can't take a final: ㅏ then ㄴ → commit ㅏ, start ㄴ.
    const r = type("ㅏ", "ㄴ");
    expect(r.committed).toBe("ㅏ");
    expect(r.composing).toBe("ㄴ");
    expect(r.text).toBe("ㅏㄴ");
  });

  it("recovers the initial after a lone vowel: ㅏㄴㅏ → ㅏ나", () => {
    const r = type("ㅏ", "ㄴ", "ㅏ");
    expect(r.text).toBe("ㅏ나");
  });

  it.each(["ㄱ", "ㅁ", "ㅅ", "ㅇ", "ㅎ"])(
    "does not drop a valid-final consonant %s after a lone vowel",
    (cons) => {
      const r = type("ㅗ", cons);
      expect(r.committed).toBe("ㅗ");
      expect(r.composing).toBe(cons);
    }
  );
});

describe("hangulComposer — compound vowels", () => {
  it.each([
    ["ㅗ", "ㅏ", "과"],
    ["ㅗ", "ㅐ", "괘"],
    ["ㅗ", "ㅣ", "괴"],
    ["ㅜ", "ㅓ", "궈"],
    ["ㅜ", "ㅔ", "궤"],
    ["ㅜ", "ㅣ", "귀"],
    ["ㅡ", "ㅣ", "긔"],
  ])("ㄱ + %s + %s → %s", (v1, v2, expected) => {
    expect(type("ㄱ", v1, v2).composing).toBe(expected);
  });

  it("commits and restarts on two medials that do not merge", () => {
    const r = type("ㄱ", "ㅏ", "ㅑ"); // ㅏ + ㅑ don't combine
    expect(r.committed).toBe("가");
    expect(r.composing).toBe("ㅑ");
    expect(r.text).toBe("가ㅑ");
  });
});

describe("hangulComposer — compound finals", () => {
  it.each([
    [["ㄱ", "ㅏ", "ㅂ", "ㅅ"], "값"], // ㅂ + ㅅ → ㅄ
    [["ㄷ", "ㅏ", "ㄹ", "ㄱ"], "닭"], // ㄹ + ㄱ → ㄺ
    [["ㅇ", "ㅏ", "ㄴ", "ㅈ"], "앉"], // ㄴ + ㅈ → ㄵ
    [["ㅇ", "ㅏ", "ㄴ", "ㅎ"], "않"], // ㄴ + ㅎ → ㄶ
  ])("%j → %s", (jamos, expected) => {
    const r = type(...jamos);
    expect(r.composing).toBe(expected);
    expect(r.committed).toBe("");
  });

  it("commits and restarts when a third consonant can't extend the final", () => {
    // 값 is complete; a following ㄷ starts a new syllable.
    const r = type("ㄱ", "ㅏ", "ㅂ", "ㅅ", "ㄷ");
    expect(r.committed).toBe("값");
    expect(r.composing).toBe("ㄷ");
  });
});

describe("hangulComposer — final → initial migration", () => {
  it("moves a simple final to the next syllable when a vowel follows", () => {
    // 간 + ㅏ → 가 + 나
    const r = type("ㄱ", "ㅏ", "ㄴ", "ㅏ");
    expect(r.committed).toBe("가");
    expect(r.composing).toBe("나");
    expect(r.text).toBe("가나");
  });

  it("keeps the first half of a compound final and migrates the second", () => {
    // 값 + ㅣ → 갑 + 시
    const r = type("ㄱ", "ㅏ", "ㅂ", "ㅅ", "ㅣ");
    expect(r.committed).toBe("갑");
    expect(r.composing).toBe("시");
    expect(r.text).toBe("갑시");
  });

  it("migrates ㅇ finals too (강 + ㅣ → 가 + 이)", () => {
    const r = type("ㄱ", "ㅏ", "ㅇ", "ㅣ");
    expect(r.committed).toBe("가");
    expect(r.composing).toBe("이");
  });

  it("types a full word: 안녕하세요", () => {
    const r = type(
      "ㅇ", "ㅏ", "ㄴ", // 안
      "ㄴ", "ㅕ", "ㅇ", // 녕
      "ㅎ", "ㅏ", // 하
      "ㅅ", "ㅔ", // 세
      "ㅇ", "ㅛ" // 요
    );
    expect(r.text).toBe("안녕하세요");
  });
});

describe("hangulComposer — commit boundaries", () => {
  it("commits a lone consonant before another consonant", () => {
    const r = type("ㄱ", "ㄴ");
    expect(r.committed).toBe("ㄱ");
    expect(r.composing).toBe("ㄴ");
  });

  it("flushes and commits a non-jamo character", () => {
    const r = hangulComposer.input({ buffer: "가" }, "1");
    expect(r.committed).toBe("가1");
    expect(r.composing).toBe("");
    expect(r.next.buffer).toBe("");
  });

  it("flush() commits the pending block", () => {
    const r = hangulComposer.flush({ buffer: "감" });
    expect(r.committed).toBe("감");
    expect(r.composing).toBe("");
  });

  it("flush() on an empty buffer commits nothing", () => {
    expect(hangulComposer.flush({ buffer: "" })).toEqual({
      committed: "",
      composing: "",
      next: { buffer: "" },
    });
  });
});

describe("hangulComposer — backspace", () => {
  it("drops a final jamo", () => {
    expect(hangulComposer.backspace!({ buffer: "감" }).composing).toBe("가");
  });

  it("drops a compound final by one component", () => {
    expect(hangulComposer.backspace!({ buffer: "값" }).composing).toBe("갑");
  });

  it("drops a compound vowel by one component", () => {
    expect(hangulComposer.backspace!({ buffer: "과" }).composing).toBe("고");
  });

  it("drops a medial back to a lone initial", () => {
    expect(hangulComposer.backspace!({ buffer: "가" }).composing).toBe("ㄱ");
  });

  it("clears a lone jamo", () => {
    expect(hangulComposer.backspace!({ buffer: "ㄱ" }).composing).toBe("");
  });

  it("never commits and is a no-op on an empty buffer", () => {
    expect(hangulComposer.backspace!({ buffer: "" })).toEqual({
      committed: "",
      composing: "",
      next: { buffer: "" },
    });
  });
});

describe("hangulComposer — state", () => {
  it("reset() yields an empty buffer", () => {
    expect(hangulComposer.reset()).toEqual({ buffer: "" });
  });

  it("carries state forward through next", () => {
    const r1 = hangulComposer.input(hangulComposer.reset(), "ㄱ");
    expect(r1.next.buffer).toBe("ㄱ");
    const r2 = hangulComposer.input(r1.next, "ㅏ");
    expect(r2.next.buffer).toBe("가");
  });
});
