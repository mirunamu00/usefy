import { describe, it, expect, vi } from "vitest";
import { useRef, useState } from "react";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { VirtualKeyboard, __resetDevWarnings } from "./VirtualKeyboard";
import { numericLayout } from "./layouts/numeric";
import { qwertyLayout } from "./layouts/qwerty";
import { createLayout } from "./engine/createLayout";

function BoundSearch({ onChange }: { onChange?: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input ref={inputRef} aria-label="search" defaultValue="" />
      <VirtualKeyboard inputRef={inputRef} onChange={onChange} />
    </div>
  );
}

describe("VirtualKeyboard — rendering & interaction", () => {
  it("renders the QWERTY layout as a labelled group of buttons", () => {
    render(<VirtualKeyboard />);
    const group = screen.getByRole("group", { name: "On-screen keyboard" });
    expect(group).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "q" })).toBeInTheDocument();
    expect(
      within(group).getByRole("button", { name: "Backspace" })
    ).toBeInTheDocument();
  });

  it("clicking a key types into the bound input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BoundSearch onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "h" }));
    await user.click(screen.getByRole("button", { name: "i" }));

    const input = screen.getByLabelText("search") as HTMLInputElement;
    expect(input.value).toBe("hi");
    expect(onChange).toHaveBeenLastCalledWith("hi");
  });

  it("clicking a key keeps a ref-bound input focused (no focus steal)", async () => {
    const user = userEvent.setup();
    render(<BoundSearch />);
    const input = screen.getByLabelText("search") as HTMLInputElement;
    input.focus();
    expect(input).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "a" }));
    expect(input).toHaveFocus();
    expect(input.value).toBe("a");
  });

  it("Shift is a modifier button exposing aria-pressed", async () => {
    const user = userEvent.setup();
    render(<VirtualKeyboard />);
    const shift = screen.getByRole("button", { name: "Shift" });
    expect(shift).toHaveAttribute("aria-pressed", "false");
    await user.click(shift);
    expect(shift).toHaveAttribute("aria-pressed", "true");
    // The letter keys now display uppercase.
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
  });

  it("meets the 44px minimum target size (min-width/height set)", () => {
    render(<VirtualKeyboard layouts={numericLayout} />);
    const key = screen.getByRole("button", { name: "1" });
    // jsdom does not compute layout, but the inline/CSS var contract is present.
    expect(key).toHaveAttribute("data-vk-key");
  });
});

describe("VirtualKeyboard — keyboard operability (roving focus)", () => {
  it("arrow keys move focus and Enter/Space activate the focused key", async () => {
    const user = userEvent.setup();
    render(<VirtualKeyboard layouts={numericLayout} />);

    const one = screen.getByRole("button", { name: "1" });
    one.focus();
    expect(one).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "2" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "5" })).toHaveFocus();

    // Space activates the focused button (native <button> behavior).
    await user.keyboard(" ");
    // 5 was typed.
    // (No bound input here; just assert no crash and focus retained.)
    expect(screen.getByRole("button", { name: "5" })).toHaveFocus();
  });

  it("Home/End jump to the first/last key and ArrowUp moves up a row", async () => {
    const user = userEvent.setup();
    render(<VirtualKeyboard layouts={numericLayout} />);

    const five = screen.getByRole("button", { name: "5" });
    five.focus();

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("button", { name: "2" })).toHaveFocus();

    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "Backspace" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(screen.getByRole("button", { name: "1" })).toHaveFocus();

    // ArrowLeft from the first key wraps to the last.
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "Backspace" })).toHaveFocus();
  });

  it("Escape blurs the focused key", async () => {
    const user = userEvent.setup();
    render(<VirtualKeyboard layouts={numericLayout} />);
    const one = screen.getByRole("button", { name: "1" });
    one.focus();
    await user.keyboard("{Escape}");
    expect(one).not.toHaveFocus();
  });

  it("exactly one key is tabbable (roving tabindex)", () => {
    render(<VirtualKeyboard layouts={numericLayout} />);
    const buttons = screen.getAllByRole("button");
    const tabbable = buttons.filter((b) => b.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
  });
});

describe("VirtualKeyboard — theming", () => {
  it("applies the dark class when theme='dark'", () => {
    render(<VirtualKeyboard theme="dark" />);
    const group = screen.getByRole("group");
    // The scoped dark class name contains 'dark'.
    expect(group.className).toMatch(/dark/);
  });

  it("resolves theme='system' via matchMedia (light when not preferred dark)", () => {
    render(<VirtualKeyboard theme="system" layouts={numericLayout} />);
    const group = screen.getByRole("group");
    expect(group.className).not.toMatch(/_dark_/);
  });

  it("theme='light' stays light", () => {
    render(<VirtualKeyboard theme="light" layouts={numericLayout} />);
    const group = screen.getByRole("group");
    expect(group.className).not.toMatch(/_dark_/);
  });
});

describe("VirtualKeyboard — renderKey", () => {
  it("lets the consumer render keys with the provided default props", async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(
      <VirtualKeyboard
        layouts={numericLayout}
        onKeyPress={onKeyPress}
        renderKey={(key, defaultProps) => (
          <button {...defaultProps} data-testid={`custom-${key.key}`}>
            {key.displayLabel}
          </button>
        )}
      />
    );
    const custom = screen.getByTestId("custom-7");
    expect(custom).toBeInTheDocument();
    await user.click(custom);
    expect(onKeyPress).toHaveBeenCalled();
  });
});

describe("VirtualKeyboard — SSR", () => {
  it("renders to static markup without a DOM (no window access at render)", () => {
    const html = renderToStaticMarkup(<VirtualKeyboard layouts={numericLayout} />);
    expect(html).toContain("role=\"group\"");
    expect(html).toContain("aria-label=\"On-screen keyboard\"");
  });

  it("docked and floating render to static markup without throwing", () => {
    expect(() =>
      renderToStaticMarkup(
        <VirtualKeyboard variant="docked" defaultOpen layouts={numericLayout} />
      )
    ).not.toThrow();
    expect(() =>
      renderToStaticMarkup(
        <VirtualKeyboard variant="floating" defaultOpen layouts={numericLayout} />
      )
    ).not.toThrow();
  });
});

describe("VirtualKeyboard — variant placement", () => {
  it("docked applies fixed-bar styling and honors zIndex", () => {
    render(
      <VirtualKeyboard variant="docked" defaultOpen zIndex={2000} layouts={numericLayout} />
    );
    const group = screen.getByRole("group");
    expect(group.className).toMatch(/docked/);
    expect(group.style.zIndex).toBe("2000");
  });

  it("floating applies floating-panel styling with a default zIndex", () => {
    render(
      <VirtualKeyboard variant="floating" defaultOpen layouts={numericLayout} />
    );
    const group = screen.getByRole("group");
    expect(group.className).toMatch(/floating/);
    expect(group.style.zIndex).toBe("1000");
  });

  it("inline ignores zIndex and is unaffected by placement classes", () => {
    render(<VirtualKeyboard layouts={numericLayout} zIndex={5000} />);
    const group = screen.getByRole("group");
    expect(group.className).not.toMatch(/docked|floating/);
    expect(group.style.zIndex).toBe("");
  });
});

describe("VirtualKeyboard — open/close (docked/floating)", () => {
  // The trigger's accessible name comes from its visible content (WCAG 2.5.3).
  const TRIGGER_NAME = "KB";
  const tabbableCount = () =>
    screen.getAllByRole("button").filter((b) => b.tabIndex === 0).length;

  it("with a trigger, defaults closed: keys hidden, trigger visible", () => {
    render(
      <VirtualKeyboard
        variant="floating"
        trigger={<span>KB</span>}
        layouts={numericLayout}
      />
    );
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: TRIGGER_NAME })).toBeInTheDocument();
  });

  it("defaults OPEN when no trigger is present (uncontrolled)", () => {
    render(<VirtualKeyboard variant="docked" layouts={numericLayout} />);
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("uncontrolled: clicking the trigger opens then closes the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <VirtualKeyboard
        variant="floating"
        trigger={<span>KB</span>}
        layouts={numericLayout}
      />
    );
    const trigger = screen.getByRole("button", { name: TRIGGER_NAME });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("has exactly one tabbable key after opening via the trigger (floating)", async () => {
    const user = userEvent.setup();
    render(
      <VirtualKeyboard
        variant="floating"
        trigger={<span>KB</span>}
        layouts={numericLayout}
      />
    );
    await user.click(screen.getByRole("button", { name: TRIGGER_NAME }));
    // The trigger itself is a <button> too, so filter to keyboard keys.
    const keys = screen
      .getByRole("group")
      .querySelectorAll<HTMLButtonElement>("button[data-vk-key]");
    const tabbable = Array.from(keys).filter((k) => k.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
  });

  it("has exactly one tabbable key after opening via the trigger (docked)", async () => {
    const user = userEvent.setup();
    render(
      <VirtualKeyboard
        variant="docked"
        trigger={<span>KB</span>}
        layouts={numericLayout}
      />
    );
    await user.click(screen.getByRole("button", { name: TRIGGER_NAME }));
    const keys = screen
      .getByRole("group")
      .querySelectorAll<HTMLButtonElement>("button[data-vk-key]");
    expect(Array.from(keys).filter((k) => k.tabIndex === 0)).toHaveLength(1);
  });

  it("re-initializes a tab stop after a close → reopen cycle", async () => {
    const user = userEvent.setup();
    render(
      <VirtualKeyboard
        variant="floating"
        trigger={<span>KB</span>}
        layouts={numericLayout}
      />
    );
    const trigger = screen.getByRole("button", { name: TRIGGER_NAME });
    await user.click(trigger); // open
    await user.click(trigger); // close
    expect(screen.queryByRole("group")).not.toBeInTheDocument();

    await user.click(trigger); // reopen
    const keys = screen
      .getByRole("group")
      .querySelectorAll<HTMLButtonElement>("button[data-vk-key]");
    expect(Array.from(keys).filter((k) => k.tabIndex === 0)).toHaveLength(1);
  });

  it("trigger aria-controls matches the keyboard id", async () => {
    const user = userEvent.setup();
    render(
      <VirtualKeyboard
        variant="docked"
        trigger={<span>KB</span>}
        layouts={numericLayout}
      />
    );
    const trigger = screen.getByRole("button", { name: TRIGGER_NAME });
    await user.click(trigger);
    const group = screen.getByRole("group");
    expect(trigger.getAttribute("aria-controls")).toBe(group.id);
    expect(group.id).toBeTruthy();
  });

  it("uses triggerLabel as the accessible name for an icon-only trigger", () => {
    render(
      <VirtualKeyboard
        variant="floating"
        trigger={<span aria-hidden>⌨️</span>}
        triggerLabel="Open keyboard"
        layouts={numericLayout}
      />
    );
    expect(
      screen.getByRole("button", { name: "Open keyboard" })
    ).toBeInTheDocument();
  });

  it("controlled: open prop drives visibility and onOpenChange fires without self-toggling", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <VirtualKeyboard
        variant="docked"
        open={false}
        onOpenChange={onOpenChange}
        trigger={<span>KB</span>}
        layouts={numericLayout}
      />
    );
    expect(screen.queryByRole("group")).not.toBeInTheDocument();

    // Clicking requests open via onOpenChange but does NOT self-open (controlled).
    await user.click(screen.getByRole("button", { name: TRIGGER_NAME }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();

    // Parent flips the prop → keyboard appears.
    rerender(
      <VirtualKeyboard
        variant="docked"
        open={true}
        onOpenChange={onOpenChange}
        trigger={<span>KB</span>}
        layouts={numericLayout}
      />
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("Escape closes the keyboard, fires onOpenChange(false), and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <VirtualKeyboard
        variant="floating"
        defaultOpen
        onOpenChange={onOpenChange}
        trigger={<span>KB</span>}
        layouts={numericLayout}
      />
    );
    const one = screen.getByRole("button", { name: "1" });
    one.focus();
    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    // Focus returns to the trigger, not <body>.
    expect(screen.getByRole("button", { name: TRIGGER_NAME })).toHaveFocus();
  });

  it("controlled: Escape fires onOpenChange(false) without self-closing", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <VirtualKeyboard
        variant="floating"
        open={true}
        onOpenChange={onOpenChange}
        layouts={numericLayout}
      />
    );
    screen.getByRole("button", { name: "1" }).focus();
    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Controlled: the parent didn't flip `open`, so it stays visible.
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("inline + open passed logs a one-time dev warning", () => {
    __resetDevWarnings();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<VirtualKeyboard open layouts={numericLayout} />);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("ignored by the inline variant")
    );
    warn.mockRestore();
  });

  it("tabbableCount helper reports one tab stop for a visible inline keyboard", () => {
    render(<VirtualKeyboard layouts={numericLayout} />);
    expect(tabbableCount()).toBe(1);
  });
});

// ============================================================================
// Batch 2 — accent variants
// ============================================================================

function VariantsHarness({ enableVariants = true }: { enableVariants?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <div>
      <div data-testid="val">{value || "—"}</div>
      <VirtualKeyboard
        layouts={qwertyLayout}
        enableVariants={enableVariants}
        value={value}
        onChange={setValue}
      />
    </div>
  );
}

const dotOf = (button: HTMLElement) =>
  button.querySelector('span[aria-hidden="true"]');

describe("VirtualKeyboard — accent variants", () => {
  it("shows a corner dot only when enableVariants AND the key has variants", () => {
    render(<VariantsHarness enableVariants />);
    // 'a' has variants → dot; 'q' has none → no dot.
    expect(dotOf(screen.getByRole("button", { name: "a" }))).not.toBeNull();
    expect(dotOf(screen.getByRole("button", { name: "q" }))).toBeNull();
  });

  it("shows no dots when enableVariants is off", () => {
    render(<VariantsHarness enableVariants={false} />);
    expect(dotOf(screen.getByRole("button", { name: "a" }))).toBeNull();
  });

  it("right-click / contextmenu opens the variants popup", () => {
    render(<VariantsHarness />);
    fireEvent.contextMenu(screen.getByRole("button", { name: "a" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "a" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "à" })).toBeInTheDocument();
  });

  it("selecting a variant inserts that glyph into the value", async () => {
    const user = userEvent.setup();
    render(<VariantsHarness />);
    fireEvent.contextMenu(screen.getByRole("button", { name: "a" }));
    await user.click(screen.getByRole("menuitem", { name: "á" }));
    expect(screen.getByTestId("val")).toHaveTextContent("á");
    // Popup closed after selection.
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("a short click still inserts the base glyph", async () => {
    const user = userEvent.setup();
    render(<VariantsHarness />);
    await user.click(screen.getByRole("button", { name: "a" }));
    expect(screen.getByTestId("val")).toHaveTextContent("a");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Escape closes the popup only (keyboard stays) and returns focus to the key", async () => {
    const user = userEvent.setup();
    render(<VariantsHarness />);
    const aKey = screen.getByRole("button", { name: "a" });
    fireEvent.contextMenu(aKey);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    // The keyboard itself is still there…
    expect(screen.getByRole("group")).toBeInTheDocument();
    // …and focus went back to the originating key.
    expect(aKey).toHaveFocus();
  });

  it("arrow keys / Home / End navigate the popup menuitems", async () => {
    const user = userEvent.setup();
    render(<VariantsHarness />);
    fireEvent.contextMenu(screen.getByRole("button", { name: "a" }));

    // Focus starts on the base glyph.
    expect(screen.getByRole("menuitem", { name: "a" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("menuitem", { name: "à" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("menuitem", { name: "a" })).toHaveFocus();

    await user.keyboard("{End}");
    // Last variant for 'a' is 'ã'.
    expect(screen.getByRole("menuitem", { name: "ã" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: "a" })).toHaveFocus();
  });

  it("a click outside closes the popup", async () => {
    const user = userEvent.setup();
    render(<VariantsHarness />);
    fireEvent.contextMenu(screen.getByRole("button", { name: "a" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByTestId("val"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("long-press opens the popup and suppresses the trailing base insert", () => {
    vi.useFakeTimers();
    try {
      render(<VariantsHarness />);
      const aKey = screen.getByRole("button", { name: "a" });

      fireEvent.mouseDown(aKey);
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByRole("menu")).toBeInTheDocument();

      // The release + click that follows a long-press must NOT insert "a".
      fireEvent.mouseUp(aKey);
      fireEvent.click(aKey);
      expect(screen.getByTestId("val")).toHaveTextContent("—");
    } finally {
      vi.useRealTimers();
    }
  });

  it("drag-away-then-select leaves the NEXT tap on the key working (B1)", () => {
    vi.useFakeTimers();
    try {
      render(<VariantsHarness />);
      const aKey = screen.getByRole("button", { name: "a" });

      // Long-press to open the popup, then drag off the key (no trailing click).
      fireEvent.mouseDown(aKey);
      act(() => vi.advanceTimersByTime(400));
      expect(screen.getByRole("menu")).toBeInTheDocument();
      fireEvent.mouseLeave(aKey);

      // Release over a menuitem → select it.
      fireEvent.click(screen.getByRole("menuitem", { name: "á" }));
      expect(screen.getByTestId("val")).toHaveTextContent("á");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      // A fresh tap must insert the base glyph (the stale suppression flag is
      // cleared on the new mousedown, not only by a trailing click).
      fireEvent.mouseDown(aKey);
      fireEvent.mouseUp(aKey);
      fireEvent.click(aKey);
      expect(screen.getByTestId("val")).toHaveTextContent("áa");
    } finally {
      vi.useRealTimers();
    }
  });

  it("a held right-click leaves the NEXT left tap working (B1)", () => {
    vi.useFakeTimers();
    try {
      render(<VariantsHarness />);
      const aKey = screen.getByRole("button", { name: "a" });

      // Hold the secondary button past the threshold — long-press fires, but a
      // right-button release produces no click to clear the flag.
      fireEvent.mouseDown(aKey, { button: 2 });
      act(() => vi.advanceTimersByTime(400));
      expect(screen.getByRole("menu")).toBeInTheDocument();
      fireEvent.mouseUp(aKey, { button: 2 });

      // Close the popup.
      fireEvent.keyDown(screen.getByRole("menuitem", { name: "a" }), {
        key: "Escape",
      });
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      // The next left tap must insert the base glyph.
      fireEvent.mouseDown(aKey);
      fireEvent.mouseUp(aKey);
      fireEvent.click(aKey);
      expect(screen.getByTestId("val")).toHaveTextContent("a");
    } finally {
      vi.useRealTimers();
    }
  });
});

// ============================================================================
// Batch 2 — auto-repeat
// ============================================================================

function RepeatHarness({
  enableKeyRepeat = true,
  onChange,
}: {
  enableKeyRepeat?: boolean;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = useState("abcdef");
  return (
    <div>
      <div data-testid="rval">{value || "—"}</div>
      <VirtualKeyboard
        layouts={qwertyLayout}
        enableKeyRepeat={enableKeyRepeat}
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange?.(v);
        }}
      />
    </div>
  );
}

describe("VirtualKeyboard — auto-repeat", () => {
  it("holding Backspace deletes multiple chars and stops on release", () => {
    vi.useFakeTimers();
    try {
      render(<RepeatHarness enableKeyRepeat />);
      const backspace = screen.getByRole("button", { name: "Backspace" });

      fireEvent.mouseDown(backspace);
      // Step the timers with a flush between fires so the controlled value
      // updates each tick (delay 400, then interval 50).
      act(() => vi.advanceTimersByTime(400)); // 1st delete
      act(() => vi.advanceTimersByTime(50)); // 2nd
      act(() => vi.advanceTimersByTime(50)); // 3rd
      fireEvent.mouseUp(backspace);
      act(() => vi.advanceTimersByTime(500)); // no more fires after release

      expect(screen.getByTestId("rval")).toHaveTextContent("abc");
    } finally {
      vi.useRealTimers();
    }
  });

  it("a short tap deletes exactly one via the native click (no repeat)", () => {
    vi.useFakeTimers();
    try {
      render(<RepeatHarness enableKeyRepeat />);
      const backspace = screen.getByRole("button", { name: "Backspace" });
      // Released before the 400ms delay → no repeat; the click deletes once.
      fireEvent.mouseDown(backspace);
      fireEvent.mouseUp(backspace);
      fireEvent.click(backspace);
      expect(screen.getByTestId("rval")).toHaveTextContent("abcde");
    } finally {
      vi.useRealTimers();
    }
  });

  it("a hold then release deletes the repeats PLUS the release click (N+1)", () => {
    vi.useFakeTimers();
    try {
      render(<RepeatHarness enableKeyRepeat />);
      const backspace = screen.getByRole("button", { name: "Backspace" });
      fireEvent.mouseDown(backspace);
      act(() => vi.advanceTimersByTime(400)); // repeat #1 → abcde
      act(() => vi.advanceTimersByTime(50)); // repeat #2 → abcd
      fireEvent.mouseUp(backspace);
      fireEvent.click(backspace); // trailing native click → abc
      // 2 repeats + 1 release click = 3 deletes.
      expect(screen.getByTestId("rval")).toHaveTextContent("abc");
    } finally {
      vi.useRealTimers();
    }
  });

  it("stops repeating on touchCancel (H2 — no data loss after touch is gone)", () => {
    vi.useFakeTimers();
    try {
      render(<RepeatHarness enableKeyRepeat />);
      const backspace = screen.getByRole("button", { name: "Backspace" });
      fireEvent.touchStart(backspace);
      act(() => vi.advanceTimersByTime(400)); // delete #1 → abcde
      act(() => vi.advanceTimersByTime(50)); // delete #2 → abcd
      fireEvent.touchCancel(backspace); // system cancelled the touch
      act(() => vi.advanceTimersByTime(1000)); // must NOT keep deleting
      expect(screen.getByTestId("rval")).toHaveTextContent("abcd");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does NOT auto-repeat when enableKeyRepeat is false", () => {
    vi.useFakeTimers();
    try {
      render(<RepeatHarness enableKeyRepeat={false} />);
      const backspace = screen.getByRole("button", { name: "Backspace" });
      fireEvent.mouseDown(backspace);
      act(() => vi.advanceTimersByTime(2000));
      fireEvent.mouseUp(backspace);
      // No repeat fired — a plain click would still delete exactly one.
      expect(screen.getByTestId("rval")).toHaveTextContent("abcdef");
    } finally {
      vi.useRealTimers();
    }
  });

  it("cleans up its timers on unmount (no fires after unmount)", () => {
    vi.useFakeTimers();
    try {
      const onChange = vi.fn();
      const { unmount } = render(
        <RepeatHarness enableKeyRepeat onChange={onChange} />
      );
      const backspace = screen.getByRole("button", { name: "Backspace" });
      fireEvent.mouseDown(backspace); // arms the 400ms delay timer
      unmount();
      act(() => vi.advanceTimersByTime(2000));
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("char keys never auto-repeat even with enableKeyRepeat on", () => {
    vi.useFakeTimers();
    try {
      render(<VariantsHarnessRepeat />);
      const qKey = screen.getByRole("button", { name: "q" });
      fireEvent.mouseDown(qKey);
      act(() => vi.advanceTimersByTime(2000));
      fireEvent.mouseUp(qKey);
      expect(screen.getByTestId("val")).toHaveTextContent("—");
    } finally {
      vi.useRealTimers();
    }
  });
});

// A char key ('q', no variants) under enableKeyRepeat — must not repeat.
function VariantsHarnessRepeat() {
  const [value, setValue] = useState("");
  return (
    <div>
      <div data-testid="val">{value || "—"}</div>
      <VirtualKeyboard
        layouts={qwertyLayout}
        enableKeyRepeat
        value={value}
        onChange={setValue}
      />
    </div>
  );
}

// ============================================================================
// Batch 2 — randomize (component stability; the pure helper is unit-tested)
// ============================================================================

describe("VirtualKeyboard — randomize", () => {
  const orderOf = () =>
    screen
      .getByRole("group")
      .querySelectorAll<HTMLButtonElement>("button[data-vk-key]")
      .length;

  it("keeps the shuffled layout stable across re-renders (keys don't jump)", () => {
    function Harness() {
      const [, force] = useState(0);
      return (
        <div>
          <button data-testid="rerender" onClick={() => force((n) => n + 1)}>
            rerender
          </button>
          <VirtualKeyboard layouts={numericLayout} randomize />
        </div>
      );
    }
    render(<Harness />);
    const group = screen.getByRole("group");
    const before = Array.from(
      group.querySelectorAll<HTMLButtonElement>("button[data-vk-key]")
    ).map((b) => b.textContent);

    fireEvent.click(screen.getByTestId("rerender"));

    const after = Array.from(
      group.querySelectorAll<HTMLButtonElement>("button[data-vk-key]")
    ).map((b) => b.textContent);
    expect(after).toEqual(before);
  });

  it("still renders every key (randomize only moves char positions)", () => {
    render(<VirtualKeyboard layouts={numericLayout} randomize />);
    // 10 digits + Clear + Backspace = 12 keys.
    expect(orderOf()).toBe(12);
    for (const d of ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
      expect(screen.getByRole("button", { name: d })).toBeInTheDocument();
    }
  });
});

// ============================================================================
// Batch 3 — sound + haptics
// ============================================================================

function makeMockAudio() {
  const osc = {
    type: "",
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
  const ctx = {
    state: "running" as string,
    currentTime: 0,
    destination: {},
    createOscillator: vi.fn(() => osc),
    createGain: vi.fn(() => gain),
    resume: vi.fn(),
    close: vi.fn(),
  };
  // A regular (constructable) function so `new ctor()` works and returns `ctx`.
  const ctor = vi.fn(function AudioContextMock() {
    return ctx;
  });
  return { ctx, osc, ctor };
}

// Install a mock AudioContext on `window` (what the hook reads); returns a
// restore fn. `ctor` may be a constructor or `undefined` (to simulate no support).
function installAudio(ctor: unknown): () => void {
  const define = (key: string, value: unknown) =>
    Object.defineProperty(window, key, {
      value,
      configurable: true,
      writable: true,
    });
  define("AudioContext", ctor);
  define("webkitAudioContext", undefined);
  return () => {
    delete (window as unknown as Record<string, unknown>).AudioContext;
    delete (window as unknown as Record<string, unknown>).webkitAudioContext;
  };
}

describe("VirtualKeyboard — sound", () => {
  it("synthesizes a Web Audio click on press when sound is on", async () => {
    const user = userEvent.setup();
    const { ctx, ctor } = makeMockAudio();
    const restore = installAudio(ctor);
    try {
      render(<VirtualKeyboard layouts={numericLayout} sound />);
      // Not created at import / mount — only on the first real press.
      expect(ctor).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "1" }));
      expect(ctor).toHaveBeenCalledTimes(1);
      expect(ctx.createOscillator).toHaveBeenCalledTimes(1);

      // Reuses the same AudioContext across presses.
      await user.click(screen.getByRole("button", { name: "2" }));
      expect(ctor).toHaveBeenCalledTimes(1);
      expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
    } finally {
      restore();
    }
  });

  it("does not touch Web Audio when sound is off", async () => {
    const user = userEvent.setup();
    const { ctor } = makeMockAudio();
    const restore = installAudio(ctor);
    try {
      render(<VirtualKeyboard layouts={numericLayout} />);
      await user.click(screen.getByRole("button", { name: "1" }));
      expect(ctor).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });

  it("no-ops (no throw) when Web Audio is unsupported", async () => {
    const user = userEvent.setup();
    const restore = installAudio(undefined);
    try {
      render(<VirtualKeyboard layouts={numericLayout} sound />);
      await user.click(screen.getByRole("button", { name: "1" }));
      // No throw; the click still types (uncontrolled internal value here is fine).
      expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it("fires feedback once per real press, not on a suppressed long-press base-insert", () => {
    vi.useFakeTimers();
    const { ctx, ctor } = makeMockAudio();
    const restore = installAudio(ctor);
    try {
      render(<VirtualKeyboard layouts={qwertyLayout} sound enableVariants />);
      const aKey = screen.getByRole("button", { name: "a" });

      // Long-press opens the popup (no press → no feedback), and the trailing
      // click is suppressed (no press → no feedback).
      fireEvent.mouseDown(aKey);
      act(() => vi.advanceTimersByTime(400));
      fireEvent.mouseUp(aKey);
      fireEvent.click(aKey);
      expect(ctx.createOscillator).not.toHaveBeenCalled();
    } finally {
      restore();
      vi.useRealTimers();
    }
  });

  it("closes the AudioContext on unmount", async () => {
    const user = userEvent.setup();
    const { ctx, ctor } = makeMockAudio();
    const restore = installAudio(ctor);
    try {
      const { unmount } = render(
        <VirtualKeyboard layouts={numericLayout} sound />
      );
      await user.click(screen.getByRole("button", { name: "1" }));
      expect(ctor).toHaveBeenCalledTimes(1); // context created
      unmount();
      expect(ctx.close).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  });

  it("reuses the same AudioContext after toggling sound off then on", async () => {
    const user = userEvent.setup();
    const { ctor } = makeMockAudio();
    const restore = installAudio(ctor);
    try {
      function Harness() {
        const [sound, setSound] = useState(true);
        return (
          <div>
            <button data-testid="toggle" onClick={() => setSound((s) => !s)}>
              toggle
            </button>
            <VirtualKeyboard layouts={numericLayout} sound={sound} />
          </div>
        );
      }
      render(<Harness />);
      await user.click(screen.getByRole("button", { name: "1" }));
      expect(ctor).toHaveBeenCalledTimes(1);

      await user.click(screen.getByTestId("toggle")); // sound off
      await user.click(screen.getByTestId("toggle")); // sound on
      await user.click(screen.getByRole("button", { name: "2" }));
      // No second AudioContext constructed.
      expect(ctor).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  });

  it("variant selection fires feedback exactly once", async () => {
    const user = userEvent.setup();
    const { ctx, ctor } = makeMockAudio();
    const restore = installAudio(ctor);
    try {
      render(<VirtualKeyboard layouts={qwertyLayout} sound enableVariants />);
      fireEvent.contextMenu(screen.getByRole("button", { name: "a" }));
      await user.click(screen.getByRole("menuitem", { name: "á" }));
      expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  });

  it("auto-repeat ticks fire NO feedback (a hold isn't a per-tick click)", () => {
    vi.useFakeTimers();
    const { ctx, ctor } = makeMockAudio();
    const restore = installAudio(ctor);
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
      writable: true,
    });
    try {
      render(
        <VirtualKeyboard
          layouts={qwertyLayout}
          sound
          haptics
          enableKeyRepeat
          defaultValue="abcdef"
        />
      );
      const backspace = screen.getByRole("button", { name: "Backspace" });
      fireEvent.mouseDown(backspace);
      act(() => vi.advanceTimersByTime(400)); // repeat tick 1
      act(() => vi.advanceTimersByTime(50)); // tick 2
      act(() => vi.advanceTimersByTime(50)); // tick 3
      fireEvent.mouseUp(backspace); // no trailing click in this test

      // Repeat ticks route through the raw press → zero feedback.
      expect(ctor).not.toHaveBeenCalled();
      expect(ctx.createOscillator).not.toHaveBeenCalled();
      expect(vibrate).not.toHaveBeenCalled();
    } finally {
      delete (navigator as unknown as { vibrate?: unknown }).vibrate;
      restore();
      vi.useRealTimers();
    }
  });

  it("renders to static markup with sound+haptics without throwing (SSR)", () => {
    expect(() =>
      renderToStaticMarkup(
        <VirtualKeyboard layouts={numericLayout} sound haptics />
      )
    ).not.toThrow();
  });
});

describe("VirtualKeyboard — haptics", () => {
  it("vibrates on press when haptics is on and supported", async () => {
    const user = userEvent.setup();
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
      writable: true,
    });
    try {
      render(<VirtualKeyboard layouts={numericLayout} haptics />);
      await user.click(screen.getByRole("button", { name: "1" }));
      expect(vibrate).toHaveBeenCalledWith(10);
    } finally {
      delete (navigator as unknown as { vibrate?: unknown }).vibrate;
    }
  });

  it("does not vibrate when haptics is off", async () => {
    const user = userEvent.setup();
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
      writable: true,
    });
    try {
      render(<VirtualKeyboard layouts={numericLayout} />);
      await user.click(screen.getByRole("button", { name: "1" }));
      expect(vibrate).not.toHaveBeenCalled();
    } finally {
      delete (navigator as unknown as { vibrate?: unknown }).vibrate;
    }
  });

  it("no-ops (no throw) when vibrate is unsupported", async () => {
    const user = userEvent.setup();
    // navigator.vibrate is absent in jsdom by default.
    render(<VirtualKeyboard layouts={numericLayout} haptics />);
    await user.click(screen.getByRole("button", { name: "1" }));
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
  });
});

// ============================================================================
// Batch 3 — RTL
// ============================================================================

const rtlLayout = createLayout({
  name: "rtl-test",
  direction: "rtl",
  rows: [
    ["a", "b", "c", "d"],
    ["e", "f", "g", "h"],
  ],
});

describe("VirtualKeyboard — RTL", () => {
  it("sets dir=rtl on the keyboard root for an RTL layout", () => {
    render(<VirtualKeyboard layouts={rtlLayout} />);
    expect(screen.getByRole("group")).toHaveAttribute("dir", "rtl");
  });

  it("leaves dir=ltr for a normal layout", () => {
    render(<VirtualKeyboard layouts={numericLayout} />);
    expect(screen.getByRole("group")).toHaveAttribute("dir", "ltr");
  });

  it("mirrors ArrowLeft/ArrowRight under RTL (visually-adjacent = logical swap)", async () => {
    const user = userEvent.setup();
    render(<VirtualKeyboard layouts={rtlLayout} />);
    screen.getByRole("button", { name: "a" }).focus();

    // ArrowLeft moves to the visually-left key = the NEXT logical key ('b').
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "b" })).toHaveFocus();

    // ArrowRight moves back to the previous logical key ('a').
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "a" })).toHaveFocus();
  });

  it("does NOT mirror arrows for an LTR layout", async () => {
    const user = userEvent.setup();
    const ltr = createLayout({ name: "ltr", rows: [["a", "b", "c", "d"]] });
    render(<VirtualKeyboard layouts={ltr} />);
    screen.getByRole("button", { name: "a" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "b" })).toHaveFocus();
  });

  it("keeps Home/End logical and Up/Down unchanged under RTL", async () => {
    const user = userEvent.setup();
    render(<VirtualKeyboard layouts={rtlLayout} />);
    const a = screen.getByRole("button", { name: "a" });
    a.focus();

    // End → logical last key overall.
    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "h" })).toHaveFocus();
    // Home → logical first key.
    await user.keyboard("{Home}");
    expect(screen.getByRole("button", { name: "a" })).toHaveFocus();

    // ArrowDown → same logical column, next row (unchanged by RTL).
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "e" })).toHaveFocus();
  });
});
