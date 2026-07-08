import { describe, it, expect } from "vitest";
import { applyKey } from "./applyKey";
import { resolveKey } from "./resolveLayout";
import type { KeyboardModifiers, ResolvedKey } from "../types";

const NONE: KeyboardModifiers = { shift: false, capsLock: false, layer: false };

const charKey = (value: string): ResolvedKey => resolveKey({ key: value }, NONE);
const actionKey = (
  key: string,
  action: ResolvedKey["action"]
): ResolvedKey => resolveKey({ key, action }, NONE);

describe("applyKey", () => {
  it("inserts a char at the caret and advances the caret", () => {
    const result = applyKey(
      charKey("a"),
      { value: "bc", selectionStart: 1, selectionEnd: 1 },
      NONE
    );
    expect(result.value).toBe("bac");
    expect(result.selectionStart).toBe(2);
    expect(result.selectionEnd).toBe(2);
    expect(result.changed).toBe(true);
  });

  it("appends when the caret is at the end", () => {
    const result = applyKey(
      charKey("d"),
      { value: "abc", selectionStart: 3, selectionEnd: 3 },
      NONE
    );
    expect(result.value).toBe("abcd");
    expect(result.selectionStart).toBe(4);
  });

  it("backspace deletes the char before the caret", () => {
    const result = applyKey(
      actionKey("Backspace", "backspace"),
      { value: "abc", selectionStart: 2, selectionEnd: 2 },
      NONE
    );
    expect(result.value).toBe("ac");
    expect(result.selectionStart).toBe(1);
    expect(result.changed).toBe(true);
  });

  it("backspace is a no-op at the start of the value", () => {
    const result = applyKey(
      actionKey("Backspace", "backspace"),
      { value: "abc", selectionStart: 0, selectionEnd: 0 },
      NONE
    );
    expect(result.value).toBe("abc");
    expect(result.changed).toBe(false);
  });

  it("backspace removes a full surrogate pair (emoji) as one unit", () => {
    const value = "a😀";
    const result = applyKey(
      actionKey("Backspace", "backspace"),
      { value, selectionStart: value.length, selectionEnd: value.length },
      NONE
    );
    expect(result.value).toBe("a");
  });

  it("insert replaces the active selection range", () => {
    const result = applyKey(
      charKey("X"),
      { value: "abcd", selectionStart: 1, selectionEnd: 3 },
      NONE
    );
    expect(result.value).toBe("aXd");
    expect(result.selectionStart).toBe(2);
    expect(result.selectionEnd).toBe(2);
  });

  it("backspace deletes the active selection range", () => {
    const result = applyKey(
      actionKey("Backspace", "backspace"),
      { value: "abcd", selectionStart: 1, selectionEnd: 3 },
      NONE
    );
    expect(result.value).toBe("ad");
    expect(result.selectionStart).toBe(1);
    expect(result.selectionEnd).toBe(1);
  });

  it("respects maxLength", () => {
    const result = applyKey(
      charKey("e"),
      { value: "abcd", selectionStart: 4, selectionEnd: 4 },
      NONE,
      { maxLength: 4 }
    );
    expect(result.value).toBe("abcd");
    expect(result.changed).toBe(false);
  });

  it("still allows replacing a selection at maxLength", () => {
    const result = applyKey(
      charKey("e"),
      { value: "abcd", selectionStart: 0, selectionEnd: 1 },
      NONE,
      { maxLength: 4 }
    );
    expect(result.value).toBe("ebcd");
    expect(result.changed).toBe(true);
  });

  it("respects keyFilter (digits only)", () => {
    const digitsOnly = (key: string) => /^[0-9]$/.test(key);
    const rejected = applyKey(
      charKey("a"),
      { value: "12", selectionStart: 2, selectionEnd: 2 },
      NONE,
      { keyFilter: digitsOnly }
    );
    expect(rejected.changed).toBe(false);

    const accepted = applyKey(
      charKey("3"),
      { value: "12", selectionStart: 2, selectionEnd: 2 },
      NONE,
      { keyFilter: digitsOnly }
    );
    expect(accepted.value).toBe("123");
  });

  it("passes the candidate value to keyFilter", () => {
    const seen: string[] = [];
    applyKey(
      charKey("c"),
      { value: "ab", selectionStart: 2, selectionEnd: 2 },
      NONE,
      {
        keyFilter: (key, next) => {
          seen.push(`${key}:${next}`);
          return true;
        },
      }
    );
    expect(seen).toEqual(["c:abc"]);
  });

  it("space, tab and newline insert the expected whitespace", () => {
    const at = { value: "", selectionStart: 0, selectionEnd: 0 };
    expect(applyKey(actionKey("Space", "space"), at, NONE).value).toBe(" ");
    expect(applyKey(actionKey("Tab", "tab"), at, NONE).value).toBe("\t");
    expect(applyKey(actionKey("Enter", "enter"), at, NONE).value).toBe("\n");
  });

  it("Enter submits (no newline) when submitOnEnter is set", () => {
    const result = applyKey(
      actionKey("Enter", "enter"),
      { value: "hi", selectionStart: 2, selectionEnd: 2 },
      NONE,
      { submitOnEnter: true }
    );
    expect(result.submit).toBe(true);
    expect(result.changed).toBe(false);
    expect(result.value).toBe("hi");
  });

  it("clear empties the value and resets the caret", () => {
    const result = applyKey(
      actionKey("Clear", "clear"),
      { value: "abc", selectionStart: 3, selectionEnd: 3 },
      NONE
    );
    expect(result.value).toBe("");
    expect(result.selectionStart).toBe(0);
    expect(result.changed).toBe(true);
  });

  it("clear on an empty value is a no-op", () => {
    const result = applyKey(
      actionKey("Clear", "clear"),
      { value: "", selectionStart: 0, selectionEnd: 0 },
      NONE
    );
    expect(result.changed).toBe(false);
  });

  it("modifier / structural actions do not change the value", () => {
    const at = { value: "abc", selectionStart: 1, selectionEnd: 1 };
    for (const action of [
      "shift",
      "capslock",
      "layer",
      "layout-switch",
      "hide",
    ] as const) {
      const result = applyKey(actionKey("m", action), at, NONE);
      expect(result.changed).toBe(false);
      expect(result.value).toBe("abc");
    }
  });

  it("clamps out-of-range selections", () => {
    const result = applyKey(
      charKey("z"),
      { value: "ab", selectionStart: 99, selectionEnd: 99 },
      NONE
    );
    expect(result.value).toBe("abz");
    expect(result.selectionStart).toBe(3);
  });

  it("is a no-op for a char with an empty effective value (spacer)", () => {
    const spacer: ResolvedKey = {
      key: "",
      type: "char",
      effectiveValue: "",
      displayLabel: "",
    };
    const result = applyKey(
      spacer,
      { value: "ab", selectionStart: 2, selectionEnd: 2 },
      NONE
    );
    expect(result.changed).toBe(false);
    expect(result.value).toBe("ab");
  });

  it("builds a synthetic event for the press", () => {
    const result = applyKey(
      resolveKey({ key: "a", code: "KeyA" }, { ...NONE, shift: true }),
      { value: "", selectionStart: 0, selectionEnd: 0 },
      { ...NONE, shift: true }
    );
    expect(result.event.key).toBe("A");
    expect(result.event.code).toBe("KeyA");
    expect(result.event.shiftKey).toBe(true);
  });
});
