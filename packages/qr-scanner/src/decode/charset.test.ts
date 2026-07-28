import { describe, expect, it } from "vitest";
import { decodeDefaultCharset, decodeSegmentText, decodeWithLabel, eciLabel, isValidUtf8 } from "./charset";

describe("isValidUtf8", () => {
  it("accepts well-formed sequences of every length", () => {
    for (const text of ["", "ascii", "héllo", "안녕하세요", "🎯 emoji", "混ぜ書き"]) {
      expect(isValidUtf8(new TextEncoder().encode(text)), text).toBe(true);
    }
  });

  it("rejects continuation bytes in a leading position", () => {
    expect(isValidUtf8(Uint8Array.from([0x80]))).toBe(false);
    expect(isValidUtf8(Uint8Array.from([0xbf, 0x41]))).toBe(false);
  });

  it("rejects truncated multi-byte sequences", () => {
    expect(isValidUtf8(Uint8Array.from([0xe2, 0x98]))).toBe(false);
    expect(isValidUtf8(Uint8Array.from([0xf0, 0x9f, 0x8e]))).toBe(false);
  });

  it("rejects a broken continuation byte", () => {
    expect(isValidUtf8(Uint8Array.from([0xe2, 0x28, 0xa1]))).toBe(false);
  });

  it("rejects overlong encodings", () => {
    expect(isValidUtf8(Uint8Array.from([0xc0, 0x80]))).toBe(false); // overlong NUL
    expect(isValidUtf8(Uint8Array.from([0xc1, 0xbf]))).toBe(false);
    expect(isValidUtf8(Uint8Array.from([0xe0, 0x80, 0x80]))).toBe(false);
  });

  it("rejects surrogates and out-of-range code points", () => {
    expect(isValidUtf8(Uint8Array.from([0xed, 0xa0, 0x80]))).toBe(false); // U+D800
    expect(isValidUtf8(Uint8Array.from([0xf5, 0x80, 0x80, 0x80]))).toBe(false); // > U+10FFFF
    expect(isValidUtf8(Uint8Array.from([0xf4, 0x90, 0x80, 0x80]))).toBe(false); // U+110000
  });
});

describe("decodeDefaultCharset", () => {
  it("prefers UTF-8 when the bytes are valid UTF-8", () => {
    expect(decodeDefaultCharset(new TextEncoder().encode("héllo"))).toBe("héllo");
  });

  it("falls back to ISO-8859-1 otherwise", () => {
    // 0xE9 alone is é in Latin-1 and invalid UTF-8 — the case the fallback exists for.
    expect(decodeDefaultCharset(Uint8Array.from([0xe9, 0x21]))).toBe("é!");
  });
});

describe("decodeSegmentText", () => {
  it("uses the declared ECI when one is present", () => {
    expect(decodeSegmentText(Uint8Array.from([0x82, 0xa0]), 20)).toBe("あ");
  });

  it("returns undefined for an ECI the platform cannot decode", () => {
    expect(decodeSegmentText(Uint8Array.from([0x41]), 2)).toBeUndefined();
    expect(decodeSegmentText(Uint8Array.from([0x41]), 999)).toBeUndefined();
  });

  it("falls back to the default when no ECI is declared", () => {
    expect(decodeSegmentText(new TextEncoder().encode("plain"), undefined)).toBe("plain");
  });
});

describe("decodeWithLabel", () => {
  it("returns undefined rather than throwing for an unknown label", () => {
    expect(decodeWithLabel(Uint8Array.from([0x41]), "not-an-encoding")).toBeUndefined();
  });

  it("caches decoders across calls", () => {
    // Second call must hit the cache and behave identically.
    expect(decodeWithLabel(Uint8Array.from([0x41]), "utf-8")).toBe("A");
    expect(decodeWithLabel(Uint8Array.from([0x42]), "utf-8")).toBe("B");
    expect(decodeWithLabel(Uint8Array.from([0x41]), "not-an-encoding")).toBeUndefined();
  });
});

describe("eciLabel", () => {
  it("maps the assignments this package knows", () => {
    expect(eciLabel(26)).toBe("utf-8");
    expect(eciLabel(20)).toBe("shift_jis");
    expect(eciLabel(3)).toBe("iso-8859-1");
  });

  it("returns undefined for assignments with no Encoding Standard equivalent", () => {
    // ECI 0/2 are CP437, which browsers do not implement — better to hand back
    // bytes than to decode with the wrong table.
    expect(eciLabel(0)).toBeUndefined();
    expect(eciLabel(2)).toBeUndefined();
  });
});
