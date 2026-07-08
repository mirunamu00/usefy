import { StrictMode } from "react";
import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useVirtualKeyboard } from "./useVirtualKeyboard";
import { numericLayout } from "./layouts/numeric";
import { qwertyLayout } from "./layouts/qwerty";
import { hangulLayout } from "./layouts/hangul";
import { createLayout } from "./engine/createLayout";
import type { KeyDefinition } from "./types";

const CHAR = (key: string): KeyDefinition => ({ key, type: "char" });
const SHIFT: KeyDefinition = { key: "Shift", action: "shift" };
const CAPS: KeyDefinition = { key: "Caps", action: "capslock" };
const LAYER: KeyDefinition = { key: "?123", action: "layer" };
const BACKSPACE: KeyDefinition = { key: "Backspace", action: "backspace" };
const ENTER: KeyDefinition = { key: "Enter", action: "enter" };
const SPACE: KeyDefinition = { key: "Space", action: "space" };

describe("useVirtualKeyboard — input modes", () => {
  it("event-emit / uncontrolled: owns the value and fires onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useVirtualKeyboard({ defaultValue: "", onChange })
    );

    act(() => result.current.press(CHAR("h")));
    act(() => result.current.press(CHAR("i")));

    expect(result.current.value).toBe("hi");
    expect(onChange).toHaveBeenLastCalledWith("hi");
  });

  it("controlled: does not mutate internal state, only notifies onChange", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useVirtualKeyboard({ value, onChange }),
      { initialProps: { value: "a" } }
    );

    act(() => result.current.press(CHAR("b")));
    // Value stays at the controlled prop until the parent updates it.
    expect(result.current.value).toBe("a");
    expect(onChange).toHaveBeenCalledWith("ab");

    rerender({ value: "ab" });
    expect(result.current.value).toBe("ab");
  });

  it("ref-bound: writes into the target input and restores the caret", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    const inputRef = { current: input };

    const { result } = renderHook(() => useVirtualKeyboard({ inputRef }));

    act(() => result.current.press(CHAR("a")));
    act(() => result.current.press(CHAR("c")));
    expect(input.value).toBe("ac");
    expect(input.selectionStart).toBe(2);

    // Move the caret between the two chars and insert.
    input.setSelectionRange(1, 1);
    act(() => result.current.press(CHAR("b")));
    expect(input.value).toBe("abc");
    expect(input.selectionStart).toBe(2);

    document.body.removeChild(input);
  });

  it("ref-bound: adopts a pre-filled input value on mount", () => {
    const input = document.createElement("input");
    input.value = "seed";
    document.body.appendChild(input);
    const inputRef = { current: input };

    const { result } = renderHook(() => useVirtualKeyboard({ inputRef }));
    expect(result.current.value).toBe("seed");

    act(() => result.current.press(CHAR("!")));
    expect(input.value).toBe("seed!");

    document.body.removeChild(input);
  });

  it("ref-bound: seeding survives StrictMode's double effect run", () => {
    const input = document.createElement("input");
    input.value = "seed";
    document.body.appendChild(input);
    const inputRef = { current: input };

    const { result } = renderHook(() => useVirtualKeyboard({ inputRef }), {
      wrapper: StrictMode,
    });
    // The pre-filled value is adopted and never clobbered back to "".
    expect(result.current.value).toBe("seed");
    expect(input.value).toBe("seed");

    document.body.removeChild(input);
  });
});

describe("useVirtualKeyboard — modifiers", () => {
  it("one-shot shift uppercases exactly the next key then clears", () => {
    const { result } = renderHook(() => useVirtualKeyboard());

    act(() => result.current.press(SHIFT));
    expect(result.current.modifiers.shift).toBe(true);

    act(() => result.current.press(CHAR("a")));
    expect(result.current.value).toBe("A");
    expect(result.current.modifiers.shift).toBe(false);

    act(() => result.current.press(CHAR("b")));
    expect(result.current.value).toBe("Ab");
  });

  it("one-shot shift is NOT consumed by a key rejected by keyFilter/maxLength", () => {
    const { result } = renderHook(() =>
      // Reject the letter "a" (case-insensitive); allow everything else.
      useVirtualKeyboard({ keyFilter: (key) => key.toLowerCase() !== "a" })
    );

    act(() => result.current.press(SHIFT));
    expect(result.current.modifiers.shift).toBe(true);

    // Shift + "a" resolves to "A" but is rejected — Shift must stay armed.
    act(() => result.current.press(CHAR("a")));
    expect(result.current.value).toBe("");
    expect(result.current.modifiers.shift).toBe(true);

    // The next accepted key consumes the still-armed Shift → uppercase "B".
    act(() => result.current.press(CHAR("b")));
    expect(result.current.value).toBe("B");
    expect(result.current.modifiers.shift).toBe(false);
  });

  it("caps lock is sticky across keys until toggled off", () => {
    const { result } = renderHook(() => useVirtualKeyboard());

    act(() => result.current.press(CAPS));
    act(() => result.current.press(CHAR("a")));
    act(() => result.current.press(CHAR("b")));
    expect(result.current.value).toBe("AB");

    act(() => result.current.press(CAPS));
    act(() => result.current.press(CHAR("c")));
    expect(result.current.value).toBe("ABc");
  });

  it("layer toggle emits layerKey values", () => {
    const { result } = renderHook(() => useVirtualKeyboard());
    // qwerty 'q' has layerKey '1'.
    act(() => result.current.press(LAYER));
    expect(result.current.modifiers.layer).toBe(true);
    act(() => result.current.press({ key: "q", type: "char", layerKey: "1" }));
    expect(result.current.value).toBe("1");
  });

  it("toggleShift / toggleCapsLock imperative helpers work", () => {
    const { result } = renderHook(() => useVirtualKeyboard());
    act(() => result.current.toggleShift());
    expect(result.current.modifiers.shift).toBe(true);
    act(() => result.current.toggleCapsLock());
    expect(result.current.modifiers.capsLock).toBe(true);
  });
});

describe("useVirtualKeyboard — action keys", () => {
  it("backspace, space, enter (newline), and clear", () => {
    const { result } = renderHook(() => useVirtualKeyboard());

    act(() => result.current.press(CHAR("a")));
    act(() => result.current.press(SPACE));
    act(() => result.current.press(CHAR("b")));
    expect(result.current.value).toBe("a b");

    act(() => result.current.press(BACKSPACE));
    expect(result.current.value).toBe("a ");

    act(() => result.current.press(ENTER));
    expect(result.current.value).toBe("a \n");

    act(() => result.current.clear());
    expect(result.current.value).toBe("");
  });

  it("insert() adds arbitrary text at the caret", () => {
    const { result } = renderHook(() => useVirtualKeyboard());
    act(() => result.current.insert("hello"));
    expect(result.current.value).toBe("hello");
  });

  it("setValue() replaces the whole value", () => {
    const { result } = renderHook(() => useVirtualKeyboard());
    act(() => result.current.setValue("replaced"));
    expect(result.current.value).toBe("replaced");
  });

  it("respects maxLength and keyFilter", () => {
    const { result } = renderHook(() =>
      useVirtualKeyboard({
        maxLength: 3,
        keyFilter: (key) => /^[0-9]$/.test(key),
      })
    );
    act(() => result.current.press(CHAR("1")));
    act(() => result.current.press(CHAR("a"))); // rejected by filter
    act(() => result.current.press(CHAR("2")));
    act(() => result.current.press(CHAR("3")));
    act(() => result.current.press(CHAR("4"))); // rejected by maxLength
    expect(result.current.value).toBe("123");
  });
});

describe("useVirtualKeyboard — onEnter / submitOnEnter", () => {
  it("fires onEnter with the value and does not insert a newline", () => {
    const onEnter = vi.fn();
    const { result } = renderHook(() =>
      useVirtualKeyboard({ defaultValue: "query", submitOnEnter: true, onEnter })
    );
    act(() => result.current.press(ENTER));
    expect(onEnter).toHaveBeenCalledWith("query");
    expect(result.current.value).toBe("query");
  });

  it("does not fire onEnter when submitOnEnter is off", () => {
    const onEnter = vi.fn();
    const { result } = renderHook(() => useVirtualKeyboard({ onEnter }));
    act(() => result.current.press(ENTER));
    expect(onEnter).not.toHaveBeenCalled();
    expect(result.current.value).toBe("\n");
  });
});

describe("useVirtualKeyboard — callbacks & layouts", () => {
  it("onKeyPress fires with the raw key and a synthetic event", () => {
    const onKeyPress = vi.fn();
    const { result } = renderHook(() => useVirtualKeyboard({ onKeyPress }));
    act(() => result.current.press(CHAR("z")));
    expect(onKeyPress).toHaveBeenCalledTimes(1);
    const [key, event] = onKeyPress.mock.calls[0];
    expect(key.key).toBe("z");
    expect(event).toMatchObject({ key: "z", shiftKey: false, layer: false });
  });

  it("switches between registered layouts and fires onLayoutChange", () => {
    const onLayoutChange = vi.fn();
    const { result } = renderHook(() =>
      useVirtualKeyboard({
        layouts: [qwertyLayout, numericLayout],
        onLayoutChange,
      })
    );
    expect(result.current.layoutNames).toEqual(["qwerty", "numeric"]);
    expect(result.current.layout.name).toBe("qwerty");

    act(() => result.current.setLayout("numeric"));
    expect(result.current.layout.name).toBe("numeric");
    expect(onLayoutChange).toHaveBeenCalledWith("numeric");

    // Unknown layout is ignored.
    act(() => result.current.setLayout("nope"));
    expect(result.current.layout.name).toBe("numeric");
  });

  it("layout-switch action key swaps layouts", () => {
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: [qwertyLayout, numericLayout] })
    );
    act(() =>
      result.current.press({
        key: "123",
        action: "layout-switch",
        targetLayout: "numeric",
      })
    );
    expect(result.current.layout.name).toBe("numeric");
  });

  it("routes character insertion through the layout composer (identity pass-through)", () => {
    const spy = vi.fn((state, key: string) => ({
      committed: key,
      composing: "",
      next: state,
    }));
    const customLayout = createLayout({
      name: "spy",
      rows: [["a", "b"]],
      composer: { input: spy, flush: () => ({ committed: "", composing: "", next: { buffer: "" } }), reset: () => ({ buffer: "" }) },
    });
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: customLayout })
    );
    act(() => result.current.press(CHAR("a")));
    expect(spy).toHaveBeenCalledWith(expect.anything(), "a");
    expect(result.current.value).toBe("a");
  });
});

describe("useVirtualKeyboard — reference stability", () => {
  it("keeps imperative actions & getters stable across rerenders", () => {
    const { result, rerender } = renderHook(() => useVirtualKeyboard());
    const first = { ...result.current };

    act(() => result.current.press(CHAR("a")));
    rerender();

    expect(result.current.press).toBe(first.press);
    expect(result.current.insert).toBe(first.insert);
    expect(result.current.backspace).toBe(first.backspace);
    expect(result.current.clear).toBe(first.clear);
    expect(result.current.setValue).toBe(first.setValue);
    expect(result.current.setLayout).toBe(first.setLayout);
    expect(result.current.toggleShift).toBe(first.toggleShift);
    expect(result.current.getKeyProps).toBe(first.getKeyProps);
    expect(result.current.getKeyboardProps).toBe(first.getKeyboardProps);
    expect(result.current.getRowProps).toBe(first.getRowProps);
  });
});

describe("useVirtualKeyboard — prop getters", () => {
  it("getKeyboardProps exposes the group role and aria-label", () => {
    const { result } = renderHook(() =>
      useVirtualKeyboard({ ariaLabel: "PIN pad" })
    );
    const props = result.current.getKeyboardProps();
    expect(props.role).toBe("group");
    expect(props["aria-label"]).toBe("PIN pad");
  });

  it("getKeyProps marks active modifiers with aria-pressed", () => {
    const { result } = renderHook(() => useVirtualKeyboard());
    act(() => result.current.toggleShift());
    const shiftKey = result.current.layout.rows
      .flat()
      .find((k) => k.action === "shift")!;
    const props = result.current.getKeyProps(shiftKey);
    expect(props["aria-pressed"]).toBe(true);
    expect(props.type).toBe("button");
  });
});

describe("useVirtualKeyboard — composition (IME)", () => {
  const JAMO = (key: string): KeyDefinition => ({ key, type: "char" });

  it("identity layouts never expose composing text", () => {
    const { result } = renderHook(() => useVirtualKeyboard());
    act(() => result.current.press(CHAR("a")));
    expect(result.current.value).toBe("a");
    expect(result.current.composing).toBe("");
  });

  it("assembles jamo into a composing block, keeping value committed-only", () => {
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: hangulLayout })
    );

    act(() => result.current.press(JAMO("ㄱ")));
    expect(result.current.composing).toBe("ㄱ");
    expect(result.current.value).toBe("");

    act(() => result.current.press(JAMO("ㅏ")));
    expect(result.current.composing).toBe("가");
    expect(result.current.value).toBe("");

    act(() => result.current.press(JAMO("ㅁ")));
    expect(result.current.composing).toBe("감");
    expect(result.current.value).toBe("");
  });

  it("commits the previous block when a final migrates to a new syllable", () => {
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: hangulLayout, onChange: vi.fn() })
    );
    // 간 + ㅏ → commit 가, compose 나
    ["ㄱ", "ㅏ", "ㄴ", "ㅏ"].forEach((j) =>
      act(() => result.current.press(JAMO(j)))
    );
    expect(result.current.value).toBe("가");
    expect(result.current.composing).toBe("나");
  });

  it("Space flushes the pending block into the value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: hangulLayout, onChange })
    );
    ["ㄱ", "ㅏ"].forEach((j) => act(() => result.current.press(JAMO(j))));
    expect(result.current.value).toBe("");

    act(() => result.current.press(SPACE));
    expect(result.current.value).toBe("가 ");
    expect(result.current.composing).toBe("");
    expect(onChange).toHaveBeenLastCalledWith("가 ");
  });

  it("Enter flushes the pending block and can submit", () => {
    const onEnter = vi.fn();
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: hangulLayout, submitOnEnter: true, onEnter })
    );
    ["ㅎ", "ㅏ"].forEach((j) => act(() => result.current.press(JAMO(j))));
    act(() => result.current.press(ENTER));
    expect(result.current.value).toBe("하");
    expect(result.current.composing).toBe("");
    expect(onEnter).toHaveBeenCalledWith("하");
  });

  it("Backspace deletes one jamo from the composing block before the value", () => {
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: hangulLayout })
    );
    ["ㄱ", "ㅏ", "ㅁ"].forEach((j) => act(() => result.current.press(JAMO(j))));
    expect(result.current.composing).toBe("감");

    act(() => result.current.press(BACKSPACE));
    expect(result.current.composing).toBe("가");
    act(() => result.current.press(BACKSPACE));
    expect(result.current.composing).toBe("ㄱ");
    act(() => result.current.press(BACKSPACE));
    expect(result.current.composing).toBe("");
    expect(result.current.value).toBe("");
  });

  it("ref-bound: displays value + composing and pins the caret past it", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    const inputRef = { current: input };
    const { result } = renderHook(() =>
      useVirtualKeyboard({ inputRef, layouts: hangulLayout })
    );

    act(() => result.current.press(JAMO("ㄱ")));
    expect(input.value).toBe("ㄱ");
    act(() => result.current.press(JAMO("ㅏ")));
    expect(input.value).toBe("가");
    expect(input.selectionStart).toBe(1);

    // ㄱㅏㅂㅅ → 값, then ㅣ migrates ㅅ: commit 갑, compose 시.
    ["ㅂ", "ㅅ"].forEach((j) => act(() => result.current.press(JAMO(j))));
    expect(input.value).toBe("값");
    act(() => result.current.press(JAMO("ㅣ")));
    expect(result.current.value).toBe("갑");
    expect(input.value).toBe("갑시");
    expect(input.selectionStart).toBe(2);

    document.body.removeChild(input);
  });

  it("switching layouts flushes the pending composition", () => {
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: [hangulLayout, qwertyLayout] })
    );
    ["ㄱ", "ㅏ"].forEach((j) => act(() => result.current.press(JAMO(j))));
    expect(result.current.composing).toBe("가");

    act(() => result.current.setLayout("qwerty"));
    expect(result.current.value).toBe("가");
    expect(result.current.composing).toBe("");
  });

  it("clear() drops both the value and the pending composition", () => {
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: hangulLayout })
    );
    ["ㄱ", "ㅏ"].forEach((j) => act(() => result.current.press(JAMO(j))));
    act(() => result.current.clear());
    expect(result.current.value).toBe("");
    expect(result.current.composing).toBe("");
  });

  it("respects maxLength across the value + pending composition", () => {
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: hangulLayout, maxLength: 1 })
    );
    // A block composes within the limit (displayed length 1).
    ["ㄱ", "ㅏ"].forEach((j) => act(() => result.current.press(JAMO(j))));
    expect(result.current.composing).toBe("가");
    // Space would push the flushed value past maxLength=1, so it is rejected.
    act(() => result.current.press(SPACE));
    expect(result.current.value).toBe("가");
    expect(result.current.composing).toBe("");
  });

  it("blocks starting a new composition once value is at maxLength", () => {
    const { result } = renderHook(() =>
      useVirtualKeyboard({ layouts: hangulLayout, maxLength: 1 })
    );
    // Commit a first block up to the limit (Space flush retains "가").
    ["ㄱ", "ㅏ"].forEach((j) => act(() => result.current.press(JAMO(j))));
    act(() => result.current.press(SPACE));
    expect(result.current.value).toBe("가");
    // Value is at maxLength=1, so a new jamo would overflow (1 + 1) → rejected.
    act(() => result.current.press(JAMO("ㄴ")));
    expect(result.current.value).toBe("가");
    expect(result.current.composing).toBe("");
  });
});
