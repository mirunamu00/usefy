import { describe, expect, it } from "vitest";

import { countLines, normalizeLine, splitLines, tokenizeWords, utf8Length } from "./tokenize";

describe("splitLines", () => {
  it("returns no lines for the empty string", () => {
    expect(splitLines("")).toEqual([]);
  });

  it("returns one line for a document without a newline", () => {
    expect(splitLines("only")).toEqual(["only"]);
  });

  it("splits on newlines", () => {
    expect(splitLines("a\nb")).toEqual(["a", "b"]);
  });

  it("treats a trailing newline as a terminator, not a separator", () => {
    // The phantom-final-line bug: "a\nb\n" must NOT become ["a", "b", ""].
    expect(splitLines("a\nb\n")).toEqual(["a", "b"]);
    expect(splitLines("a\nb")).toEqual(splitLines("a\nb\n"));
  });

  it("keeps a deliberate blank final line", () => {
    expect(splitLines("a\n\n")).toEqual(["a", ""]);
  });

  it("keeps blank lines in the middle", () => {
    expect(splitLines("a\n\nb\n")).toEqual(["a", "", "b"]);
  });

  it("returns a single empty line for a lone newline", () => {
    expect(splitLines("\n")).toEqual([""]);
  });

  it("normalizes CRLF to LF", () => {
    expect(splitLines("a\r\nb\r\nc")).toEqual(["a", "b", "c"]);
  });

  it("normalizes a CRLF document with a trailing CRLF", () => {
    expect(splitLines("a\r\nb\r\n")).toEqual(["a", "b"]);
  });

  it("produces the same lines for CRLF and LF documents", () => {
    expect(splitLines("a\r\nb\r\n")).toEqual(splitLines("a\nb\n"));
  });

  it("leaves a lone CR as content, not a line break", () => {
    expect(splitLines("a\rb")).toEqual(["a\rb"]);
  });

  it("handles a document of only newlines", () => {
    expect(splitLines("\n\n\n")).toEqual(["", "", ""]);
  });
});

describe("tokenizeWords", () => {
  it("returns no tokens for an empty line", () => {
    expect(tokenizeWords("")).toEqual([]);
  });

  const cases: Array<[string, string, string[]]> = [
    ["latin words and spaces", "hello world", ["hello", " ", "world"]],
    [
      "code punctuation splits per character",
      "const a = 1;",
      ["const", " ", "a", " ", "=", " ", "1", ";"],
    ],
    ["a whitespace run is one token", "a   b", ["a", "   ", "b"]],
    ["tabs are whitespace", "a\tb", ["a", "\t", "b"]],
    ["digits join word runs", "abc123", ["abc123"]],
    ["underscores join word runs", "snake_case_name", ["snake_case_name"]],
    ["dots split identifiers", "a.b", ["a", ".", "b"]],
    ["brackets are their own tokens", "foo(bar)", ["foo", "(", "bar", ")"]],
    ["accented latin stays one word", "café", ["café"]],
    ["Han is one token per character", "你好世界", ["你", "好", "世", "界"]],
    ["Hiragana is one token per character", "ひらがな", ["ひ", "ら", "が", "な"]],
    ["Katakana is one token per character", "カタカナ", ["カ", "タ", "カ", "ナ"]],
    ["Hangul is space-delimited, so word runs", "안녕 세계", ["안녕", " ", "세계"]],
    [
      "mixed CJK and latin",
      "日本語 text",
      ["日", "本", "語", " ", "text"],
    ],
    ["emoji is its own token", "hi 🎉", ["hi", " ", "🎉"]],
    ["leading whitespace is a token", "  indented", ["  ", "indented"]],
  ];

  it.each(cases)("%s", (_label, line, expected) => {
    expect(tokenizeWords(line)).toEqual(expected);
  });

  it("always concatenates back to the original line", () => {
    const lines = [
      "const a = 1;",
      "  deeply    spaced\ttext  ",
      "你好, world! 안녕하세요",
      "foo(bar[baz]);",
      "🎉🎉 party",
      "",
    ];
    for (const line of lines) {
      expect(tokenizeWords(line).join("")).toBe(line);
    }
  });

  it("does not leak regex lastIndex between calls", () => {
    // A module-level /g regex used with .exec would; .match must not.
    const first = tokenizeWords("alpha beta gamma");
    const second = tokenizeWords("alpha beta gamma");
    expect(second).toEqual(first);
    expect(tokenizeWords("x")).toEqual(["x"]);
  });
});

describe("normalizeLine", () => {
  it("is the identity with no options", () => {
    expect(normalizeLine("  Let X = 1  ")).toBe("  Let X = 1  ");
  });

  it("is the identity with ignoreWhitespace: none", () => {
    expect(normalizeLine("  Let X  ", { ignoreWhitespace: "none" })).toBe("  Let X  ");
  });

  it("strips trailing whitespace with ignoreWhitespace: trailing", () => {
    expect(normalizeLine("  let x = 1  \t", { ignoreWhitespace: "trailing" })).toBe("  let x = 1");
  });

  it("keeps leading whitespace with ignoreWhitespace: trailing", () => {
    expect(normalizeLine("    indented", { ignoreWhitespace: "trailing" })).toBe("    indented");
  });

  it("removes every whitespace character with ignoreWhitespace: all", () => {
    expect(normalizeLine("  let x = 1  ", { ignoreWhitespace: "all" })).toBe("letx=1");
  });

  it("lowercases with ignoreCase", () => {
    expect(normalizeLine("Let X", { ignoreCase: true })).toBe("let x");
  });

  it("leaves case alone when ignoreCase is false", () => {
    expect(normalizeLine("Let X", { ignoreCase: false })).toBe("Let X");
  });

  it("applies the case rule after the whitespace rule", () => {
    expect(normalizeLine("  Let X  ", { ignoreWhitespace: "all", ignoreCase: true })).toBe("letx");
    expect(normalizeLine("  Let X  ", { ignoreWhitespace: "trailing", ignoreCase: true })).toBe(
      "  let x",
    );
  });

  it("maps whitespace-only lines to empty under ignoreWhitespace: all", () => {
    expect(normalizeLine("   \t ", { ignoreWhitespace: "all" })).toBe("");
  });

  it("maps whitespace-only lines to empty under ignoreWhitespace: trailing", () => {
    expect(normalizeLine("   \t ", { ignoreWhitespace: "trailing" })).toBe("");
  });
});

describe("countLines", () => {
  const documents = [
    "",
    "only",
    "a\nb",
    "a\nb\n",
    "\n",
    "a\n\n",
    "a\n\nb\n",
    "\n\n\n",
    "a\r\nb\r\nc",
    "a\r\nb\r\n",
    "a\rb",
    "line\n".repeat(50),
    "no trailing newline at all",
  ];

  it.each(documents)("agrees with splitLines().length for %j", (text) => {
    expect(countLines(text)).toBe(splitLines(text).length);
  });

  it("returns 0 for the empty string", () => {
    expect(countLines("")).toBe(0);
  });

  it("treats a trailing newline as a terminator", () => {
    expect(countLines("a\nb\n")).toBe(2);
    expect(countLines("a\nb")).toBe(2);
  });

  it("counts a large document without building it", () => {
    expect(countLines("x\n".repeat(100_000))).toBe(100_000);
  });
});

describe("utf8Length", () => {
  it("counts ASCII as one byte per character", () => {
    expect(utf8Length("abc")).toBe(3);
    expect(utf8Length("")).toBe(0);
  });

  it("counts 2-byte code points", () => {
    expect(utf8Length("é")).toBe(2);
    expect(utf8Length("ü¢")).toBe(4);
  });

  it("counts 3-byte code points", () => {
    expect(utf8Length("한")).toBe(3);
    expect(utf8Length("日本語")).toBe(9);
  });

  it("counts a surrogate pair as one 4-byte code point", () => {
    expect(utf8Length("😀")).toBe(4);
    expect(utf8Length("a😀b")).toBe(6);
  });

  it("counts a lone high surrogate followed by other text as 3 bytes", () => {
    expect(utf8Length("\ud800a")).toBe(4); // 3 (lone surrogate) + 1 (a)
  });

  it("counts a trailing lone high surrogate as 3 bytes", () => {
    expect(utf8Length("\ud800")).toBe(3);
  });

  it("counts a lone low surrogate as 3 bytes", () => {
    expect(utf8Length("\udc00")).toBe(3);
  });

  it("agrees with TextEncoder on well-formed strings", () => {
    const encoder = new TextEncoder();
    const samples = ["", "hello", "café", "日本語のテキスト", "안녕하세요", "🎉 party 🎉", "a\nb\tc"];
    for (const sample of samples) {
      expect(utf8Length(sample)).toBe(encoder.encode(sample).length);
    }
  });
});
