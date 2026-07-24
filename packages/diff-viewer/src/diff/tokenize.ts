/**
 * Tokenization and normalization for the diff core (SPEC §3.1, §4.2).
 *
 * Three pure functions, no state, no globals:
 * - {@link splitLines} turns a document into the line tokens the outer diff
 *   runs over;
 * - {@link tokenizeWords} turns one line into the word tokens the inline
 *   diff runs over;
 * - {@link normalizeLine} produces the **compare form** of a line under the
 *   whitespace/case options — the diff matches on this form and renders the
 *   original (SPEC resolved decision #5).
 */

import type { NormalizeOptions } from "../types";

/**
 * Split a document into lines.
 *
 * Rules:
 * - `\r\n` is normalized to `\n` first, so a file's line ending never shows
 *   up as a difference (a lone `\r` is left alone — it is content, not a
 *   line break, in every environment this component targets).
 * - A **trailing newline is a terminator, not a separator**: `"a\nb\n"` and
 *   `"a\nb"` both yield `["a", "b"]`. Without this rule every POSIX text
 *   file would grow a phantom empty final line and every diff against one
 *   would show a spurious change.
 * - The empty string has zero lines, not one empty line.
 * - A blank line in the middle is preserved as `""`, and so is a deliberate
 *   blank final line: `"a\n\n"` → `["a", ""]`.
 *
 * @example
 * ```ts
 * import { splitLines } from "@usefy/diff-viewer/headless";
 *
 * splitLines("a\nb");     // ["a", "b"]
 * splitLines("a\nb\n");   // ["a", "b"]   ← no phantom final line
 * splitLines("a\r\nb\r\n"); // ["a", "b"]
 * splitLines("a\n\n");    // ["a", ""]
 * splitLines("");         // []
 * ```
 */
export function splitLines(text: string): string[] {
  if (text === "") return [];
  const normalized = text.indexOf("\r") === -1 ? text : text.replace(/\r\n/g, "\n");
  const body = normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized;
  return body.split("\n");
}

/**
 * Token classes recognised by {@link tokenizeWords}, in priority order:
 *
 * 1. a run of whitespace,
 * 2. a single Han / Hiragana / Katakana character,
 * 3. a run of word characters (letters, digits, `_`),
 * 4. any other single character (punctuation, symbols, emoji…).
 *
 * The CJK alternative must precede the word-run alternative because
 * `\p{L}` also matches those scripts.
 */
const TOKEN_RE =
  /\s+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[\p{L}\p{N}_]+|[\s\S]/gu;

/**
 * Split one line into the tokens the inline (word-level) diff runs over.
 *
 * Token rules:
 * - **Whitespace runs** are a single token, so re-indentation shows up as
 *   one change rather than one per space.
 * - **Word runs** (Unicode letters, digits and `_`) are a single token —
 *   this is what makes `getUser` → `getUserById` highlight the suffix
 *   instead of every character.
 * - **Han, Hiragana and Katakana characters are one token each.** Chinese
 *   and Japanese are written without spaces, so a "word run" would swallow
 *   a whole sentence and the inline diff would degrade to a whole-line
 *   change. Per-character tokens give real intra-sentence highlighting.
 * - **Hangul is deliberately treated as a word run, not per character.**
 *   Korean *is* space-delimited, so word tokens are both correct and much
 *   less noisy there. (This is the one place this tokenizer distinguishes
 *   inside "CJK".)
 * - Every other character — punctuation, symbols, emoji — is its own token,
 *   so `foo(bar)` and `foo[bar]` differ only in the brackets.
 *
 * Concatenating the result always reproduces the input exactly, which is
 * what lets {@link inlineSegments} rebuild a line from its segments.
 *
 * @example
 * ```ts
 * import { tokenizeWords } from "@usefy/diff-viewer/headless";
 *
 * tokenizeWords("const a = 1;");
 * // ["const", " ", "a", " ", "=", " ", "1", ";"]
 *
 * tokenizeWords("你好世界");
 * // ["你", "好", "世", "界"]   ← per character (no spaces in Chinese)
 *
 * tokenizeWords("안녕 세계");
 * // ["안녕", " ", "세계"]      ← Korean is space-delimited
 *
 * tokenizeWords("");
 * // []
 * ```
 */
export function tokenizeWords(line: string): string[] {
  if (line === "") return [];
  // `match` with a /g regex resets lastIndex itself, so the module-level
  // regex carries no state between calls. The final `[\s\S]` alternative
  // matches any single character, so a non-empty line always matches —
  // hence the cast rather than a dead `?? []` fallback.
  return line.match(TOKEN_RE) as string[];
}

/**
 * Produce the **compare form** of a line under the whitespace/case options.
 *
 * The result is used only for matching; the model always keeps the original
 * text in `DiffLine.content` (SPEC resolved decision #5).
 *
 * - `ignoreWhitespace: "none"` — the line is unchanged.
 * - `ignoreWhitespace: "trailing"` — trailing whitespace is stripped, so a
 *   stray space at end of line is not a diff.
 * - `ignoreWhitespace: "all"` — **every** whitespace character is removed,
 *   so pure re-indentation or re-wrapping of spacing is not a diff.
 * - `ignoreCase: true` — applied after the whitespace rule, via
 *   `toLowerCase()`.
 *
 * @example
 * ```ts
 * import { normalizeLine } from "@usefy/diff-viewer/headless";
 *
 * normalizeLine("  let x = 1  ", {});                             // "  let x = 1  "
 * normalizeLine("  let x = 1  ", { ignoreWhitespace: "trailing" }); // "  let x = 1"
 * normalizeLine("  let x = 1  ", { ignoreWhitespace: "all" });      // "letx=1"
 * normalizeLine("Let X", { ignoreCase: true });                     // "let x"
 * ```
 */
export function normalizeLine(line: string, opts: NormalizeOptions = {}): string {
  let out = line;
  if (opts.ignoreWhitespace === "all") {
    out = out.replace(/\s+/g, "");
  } else if (opts.ignoreWhitespace === "trailing") {
    out = out.replace(/\s+$/, "");
  }
  if (opts.ignoreCase === true) {
    out = out.toLowerCase();
  }
  return out;
}

/**
 * How many lines {@link splitLines} would produce, **without building the
 * array**.
 *
 * The size guard needs the line count before it decides whether to proceed;
 * materialising 60 000 line strings only to throw them away is exactly the
 * allocation the guard exists to prevent. Follows the same rules as
 * `splitLines`, so `countLines(t) === splitLines(t).length` always holds.
 *
 * Internal — not part of the public `./headless` surface.
 *
 * @example
 * ```ts
 * countLines("");       // 0
 * countLines("a\nb");   // 2
 * countLines("a\nb\n"); // 2  — the trailing newline terminates, not separates
 * countLines("a\n\n");  // 2
 * ```
 */
export function countLines(text: string): number {
  if (text === "") return 0;
  // A single trailing newline is a terminator; anything before it separates.
  const end = text.charCodeAt(text.length - 1) === 10 ? text.length - 1 : text.length;
  let count = 1;
  for (let i = 0; i < end; i++) {
    if (text.charCodeAt(i) === 10) count++;
  }
  return count;
}

/**
 * UTF-8 byte length of a string, without allocating an encoder or a buffer.
 *
 * Used by the size guard, which must be able to reject a 50 MB input
 * *cheaply* — `new TextEncoder().encode(s)` would allocate the very buffer
 * we are trying to avoid.
 *
 * Internal — not part of the public `./headless` surface.
 *
 * @example
 * ```ts
 * utf8Length("abc");  // 3
 * utf8Length("é");    // 2
 * utf8Length("한");   // 3
 * utf8Length("😀");   // 4
 * ```
 */
export function utf8Length(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        // A well-formed surrogate pair is one 4-byte code point.
        bytes += 4;
        i++;
        continue;
      }
      // Lone high surrogate — 3 bytes as WTF-8 / replacement character.
      bytes += 3;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}
