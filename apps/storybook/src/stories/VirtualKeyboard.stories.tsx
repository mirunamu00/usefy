import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import {
  VirtualKeyboard,
  qwertyLayout,
  numericLayout,
  azertyLayout,
  qwertzLayout,
  dvorakLayout,
  colemakLayout,
  createLayout,
} from "@usefy/virtual-keyboard";
import { hangulLayout } from "@usefy/virtual-keyboard/hangul";
import { storyTheme } from "../styles/storyTheme";

// A small demo-only Arabic subset (story-local — the full RTL catalog is Phase 4).
const arabicLayout = createLayout({
  name: "arabic-demo",
  direction: "rtl",
  rows: [
    ["ا", "ب", "ت", "ث", "ج", "ح", "خ"],
    ["د", "ذ", "ر", "ز", "س", "ش", "ص"],
    ["ض", "ط", "ظ", "ع", "غ", "ف", "ق"],
    [
      { key: "Shift", label: "⇧", action: "shift", width: 1.5 },
      "ك",
      "ل",
      "م",
      "ن",
      "ه",
      { key: "Backspace", label: "⌫", action: "backspace", width: 1.5 },
    ],
    [
      { key: "Space", label: "مسافة", action: "space", width: 5 },
      { key: "Enter", label: "إدخال", action: "enter", width: 2 },
    ],
  ],
});

// ============================================================================
// Demo 1 — YouTube-style search box (inline QWERTY, ref-bound)
// ============================================================================

function SearchDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [value, setValue] = useState("");

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>VirtualKeyboard</h2>
      <p className={storyTheme.subtitle}>
        An on-screen keyboard bound to a search box — type with the mouse, touch,
        or D-pad. Press <strong>return</strong> to search.
      </p>

      <label className={storyTheme.label} htmlFor="vk-search">
        Search
      </label>
      <input
        id="vk-search"
        ref={inputRef}
        className={`${storyTheme.input} mb-4`}
        placeholder="Type with the keyboard below…"
        onChange={(e) => setValue(e.target.value)}
        data-testid="search-input"
      />

      <VirtualKeyboard
        inputRef={inputRef}
        layouts={qwertyLayout}
        submitOnEnter
        onChange={setValue}
        onEnter={(v) => setSubmitted(v)}
      />

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          value:{" "}
          <span className={storyTheme.statValue} data-testid="search-value">
            {value || "—"}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          submitted:{" "}
          <span className={storyTheme.statText} data-testid="search-submitted">
            {submitted ?? "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Demo 2 — Numeric PIN pad (controlled value, maxLength + digit filter)
// ============================================================================

function PinDemo() {
  const [pin, setPin] = useState("");
  const unlocked = pin.length === 4;

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>PIN pad</h2>
      <p className={storyTheme.subtitle}>
        A controlled numeric layout with <code>maxLength</code> and a digit-only
        filter.
      </p>

      <div className="flex justify-center gap-3 mb-5" data-testid="pin-dots">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              i < pin.length
                ? "bg-indigo-500 border-indigo-500"
                : "border-gray-300"
            }`}
          />
        ))}
      </div>

      <div className="max-w-[260px] mx-auto">
        <VirtualKeyboard
          layouts={numericLayout}
          value={pin}
          onChange={setPin}
          maxLength={4}
          keyFilter={(key) => /^[0-9]$/.test(key)}
          ariaLabel="PIN pad"
        />
      </div>

      <div className={`${unlocked ? storyTheme.messageSuccess : storyTheme.messageInfo} mt-5`}>
        {unlocked ? "🔓 PIN complete" : `Enter ${4 - pin.length} more digit(s)`}
      </div>
    </div>
  );
}

// ============================================================================
// Demo — Latin layout catalog (QWERTY / AZERTY / QWERTZ / Dvorak / Colemak)
// ============================================================================

const LATIN_LAYOUTS = [
  qwertyLayout,
  azertyLayout,
  qwertzLayout,
  dvorakLayout,
  colemakLayout,
] as const;

function LayoutCatalogDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [active, setActive] = useState(0);
  const layout = LATIN_LAYOUTS[active];

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Layout catalog</h2>
      <p className={storyTheme.subtitle}>
        Five Latin arrangements — the same 26 letters, rearranged. Pick one and
        type; long-press a vowel (é, ü, …) for accent variants.
      </p>

      <div className="flex flex-wrap gap-2 mb-4" data-testid="layout-picker">
        {LATIN_LAYOUTS.map((l, i) => (
          <button
            key={l.name}
            type="button"
            aria-pressed={i === active}
            className={
              i === active ? storyTheme.buttonPrimary : storyTheme.buttonSecondary
            }
            onClick={() => setActive(i)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        className={`${storyTheme.input} mb-4`}
        placeholder="Type with the keyboard below…"
        onChange={(e) => setValue(e.target.value)}
        data-testid="catalog-input"
      />

      <VirtualKeyboard
        inputRef={inputRef}
        layouts={layout}
        enableVariants
        onChange={setValue}
      />

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          layout:{" "}
          <span className={storyTheme.statValue} data-testid="catalog-layout">
            {layout.name}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          value:{" "}
          <span className={storyTheme.statValue} data-testid="catalog-value">
            {value || "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Demo — Korean 두벌식 IME (composing text, underlined until committed)
// ============================================================================

function HangulDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Korean IME (두벌식)</h2>
      <p className={storyTheme.subtitle}>
        Jamo assemble into syllable blocks. The forming block shows{" "}
        <u>underlined</u> above the keys and commits on the next block, Space, or
        Enter — try <code>ㅇ ㅏ ㄴ ㄴ ㅕ ㅇ</code> → 안녕.
      </p>

      <label className={storyTheme.label} htmlFor="vk-hangul">
        입력
      </label>
      <input
        id="vk-hangul"
        ref={inputRef}
        className={`${storyTheme.input} mb-4`}
        placeholder="키보드로 입력하세요…"
        onChange={(e) => setValue(e.target.value)}
        data-testid="hangul-input"
      />

      <VirtualKeyboard
        inputRef={inputRef}
        layouts={hangulLayout}
        onChange={setValue}
      />

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          committed value:{" "}
          <span className={storyTheme.statValue} data-testid="hangul-value">
            {value || "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof VirtualKeyboard> = {
  title: "Components/VirtualKeyboard",
  component: VirtualKeyboard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `An on-screen (virtual) keyboard with a declarative layout engine, a headless hook (\`useVirtualKeyboard\`), and enterprise accessibility. Click, tap, or D-pad through a data-driven layout to type into any input.

## Features
- **Three input modes** — event-emit, controlled/uncontrolled \`value\`, or ref-bound to a real \`<input>\` with caret tracking
- **Declarative layouts** — QWERTY / AZERTY / QWERTZ / Dvorak / Colemak / numeric / phone / email built in, plus a \`createLayout\` API
- **Modifiers** — one-shot Shift, sticky Caps Lock, and a symbol layer
- **A11y** — \`role="group"\`, real \`<button>\` keys, \`aria-pressed\` modifiers, roving-tabindex arrow-key navigation, 44px targets
- **IME composition** — opt-in Korean 두벌식 composer (\`@usefy/virtual-keyboard/hangul\`); the forming block renders underlined and \`value\` stays composition-free
- **Themeable** — \`--usefy-vk-*\` CSS variables, light/dark, SSR-safe

## Basic Usage
\`\`\`tsx
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} />
<VirtualKeyboard inputRef={inputRef} submitOnEnter onEnter={search} />
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof VirtualKeyboard>;

// ============================================================================
// Stories
// ============================================================================

export const SearchBox: Story = {
  render: () => <SearchDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "The YouTube-style demo: an inline QWERTY keyboard bound to a search input via `inputRef`. Clicking keys types into the box and `submitOnEnter` fires `onEnter` with the query.",
      },
      source: {
        language: "tsx",
        code: `import { useRef } from "react";
import { VirtualKeyboard, qwertyLayout } from "@usefy/virtual-keyboard";

function Search() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input ref={inputRef} placeholder="Search…" />
      <VirtualKeyboard
        inputRef={inputRef}
        layouts={qwertyLayout}
        submitOnEnter
        onEnter={(query) => runSearch(query)}
      />
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "On-screen keyboard" });

    // Click three letters — they type into the bound input.
    await userEvent.click(within(group).getByRole("button", { name: "h" }));
    await userEvent.click(within(group).getByRole("button", { name: "i" }));
    await waitFor(() =>
      expect(canvas.getByTestId("search-value")).toHaveTextContent("hi")
    );

    // Toggle Shift and confirm the letters render uppercase.
    await userEvent.click(within(group).getByRole("button", { name: "Shift" }));
    await expect(
      within(group).getByRole("button", { name: "Shift" })
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(within(group).getByRole("button", { name: "A" }));
    await waitFor(() =>
      expect(canvas.getByTestId("search-value")).toHaveTextContent("hiA")
    );

    // Enter submits (submitOnEnter) without inserting a newline.
    await userEvent.click(within(group).getByRole("button", { name: "Enter" }));
    await waitFor(() =>
      expect(canvas.getByTestId("search-submitted")).toHaveTextContent("hiA")
    );
  },
};

export const NumericPin: Story = {
  render: () => <PinDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A controlled numeric PIN pad. `value`/`onChange` own the string, `maxLength={4}` caps it, and `keyFilter` rejects non-digits.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { VirtualKeyboard, numericLayout } from "@usefy/virtual-keyboard";

function PinPad() {
  const [pin, setPin] = useState("");

  return (
    <VirtualKeyboard
      layouts={numericLayout}
      value={pin}
      onChange={setPin}
      maxLength={4}
      keyFilter={(key) => /^[0-9]$/.test(key)}
      ariaLabel="PIN pad"
    />
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "PIN pad" });

    for (const digit of ["1", "2", "3", "4"]) {
      await userEvent.click(within(group).getByRole("button", { name: digit }));
    }
    await waitFor(() =>
      expect(canvas.getByText("🔓 PIN complete")).toBeInTheDocument()
    );

    // maxLength blocks a fifth digit.
    await userEvent.click(within(group).getByRole("button", { name: "5" }));
    await expect(canvas.getByText("🔓 PIN complete")).toBeInTheDocument();

    // Clear resets the PIN.
    await userEvent.click(within(group).getByRole("button", { name: "Clear" }));
    await waitFor(() =>
      expect(canvas.getByText(/Enter 4 more/)).toBeInTheDocument()
    );
  },
};

export const LayoutCatalog: Story = {
  render: () => <LayoutCatalogDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "The built-in Latin catalog: **QWERTY**, **AZERTY** (French), **QWERTZ** (German), **Dvorak**, and **Colemak**. Each is a `KeyboardLayout` you pass straight to `layouts` — the same 26 letters rearranged, with a shared `?123` symbol layer and accent long-press variants.",
      },
      source: {
        language: "tsx",
        code: `import { useRef, useState } from "react";
import {
  VirtualKeyboard,
  qwertyLayout,
  azertyLayout,
  qwertzLayout,
  dvorakLayout,
  colemakLayout,
} from "@usefy/virtual-keyboard";

const LAYOUTS = [
  qwertyLayout,
  azertyLayout,
  qwertzLayout,
  dvorakLayout,
  colemakLayout,
];

function LayoutPicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(0);

  return (
    <>
      {LAYOUTS.map((l, i) => (
        <button key={l.name} onClick={() => setActive(i)}>
          {l.label}
        </button>
      ))}
      <input ref={inputRef} />
      <VirtualKeyboard inputRef={inputRef} layouts={LAYOUTS[active]} enableVariants />
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Defaults to QWERTY — the top-left key is "q".
    let group = canvas.getByRole("group", { name: "On-screen keyboard" });
    await expect(within(group).getByRole("button", { name: "q" })).toBeVisible();

    // Switch to AZERTY — the top-left letter becomes "a".
    await userEvent.click(canvas.getByRole("button", { name: "AZERTY" }));
    await waitFor(() =>
      expect(canvas.getByTestId("catalog-layout")).toHaveTextContent("azerty")
    );
    group = canvas.getByRole("group", { name: "On-screen keyboard" });
    await userEvent.click(within(group).getByRole("button", { name: "a" }));
    await waitFor(() =>
      expect(canvas.getByTestId("catalog-value")).toHaveTextContent("a")
    );

    // Switch to Dvorak — the home row leads with "a", "o", "e".
    await userEvent.click(canvas.getByRole("button", { name: "Dvorak" }));
    await waitFor(() =>
      expect(canvas.getByTestId("catalog-layout")).toHaveTextContent("dvorak")
    );
    group = canvas.getByRole("group", { name: "On-screen keyboard" });
    await expect(within(group).getByRole("button", { name: "o" })).toBeVisible();
  },
};

export const KoreanIme: Story = {
  render: () => <HangulDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "The opt-in Korean **두벌식** IME from `@usefy/virtual-keyboard/hangul`. Jamo assemble into full syllable blocks — including compound vowels (ㅗ+ㅏ→ㅘ), compound finals (ㄱ+ㅅ→ㄳ), and final→initial migration (강+ㅏ → 가+…). The forming block renders underlined (`role=\"status\"`) and commits on the next block, Space, or Enter; `value`/`onChange` stay composition-free (read `composing` from the hook for the pending block).",
      },
      source: {
        language: "tsx",
        code: `import { useRef } from "react";
import { VirtualKeyboard } from "@usefy/virtual-keyboard";
import { hangulLayout } from "@usefy/virtual-keyboard/hangul";

function KoreanInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input ref={inputRef} placeholder="키보드로 입력하세요…" />
      <VirtualKeyboard inputRef={inputRef} layouts={hangulLayout} />
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group");
    const input = canvas.getByTestId("hangul-input") as HTMLInputElement;

    // No composition preview until a jamo is pressed.
    await expect(canvas.queryByRole("status")).not.toBeInTheDocument();

    // ㅎ + ㅏ → the block "하" forms and shows underlined.
    await userEvent.click(within(group).getByRole("button", { name: "ㅎ" }));
    await userEvent.click(within(group).getByRole("button", { name: "ㅏ" }));
    await waitFor(() =>
      expect(canvas.getByRole("status")).toHaveTextContent("하")
    );
    await expect(input).toHaveValue("하");

    // Space commits the block and dismisses the preview.
    await userEvent.click(within(group).getByRole("button", { name: "Space" }));
    await waitFor(() =>
      expect(canvas.queryByRole("status")).not.toBeInTheDocument()
    );
    await expect(canvas.getByTestId("hangul-value")).toHaveTextContent("하");
  },
};

// ============================================================================
// Demo 3 — Floating panel opened by a trigger button
// ============================================================================

function FloatingDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Floating variant</h2>
      <p className={storyTheme.subtitle}>
        Click the keyboard button to open a floating panel bound to the input.
        Click anywhere outside it — or press <strong>Escape</strong> while a key
        is focused — to close it.
      </p>

      <label className={storyTheme.label} htmlFor="vk-floating">
        Search
      </label>
      <input
        id="vk-floating"
        ref={inputRef}
        className={`${storyTheme.input} mb-4`}
        placeholder="Open the keyboard below…"
        onChange={(e) => setValue(e.target.value)}
        data-testid="floating-input"
      />

      <VirtualKeyboard
        variant="floating"
        inputRef={inputRef}
        layouts={qwertyLayout}
        onChange={setValue}
        trigger={
          <span className={storyTheme.buttonPrimary}>⌨️ Open keyboard</span>
        }
      />

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>
          value:{" "}
          <span className={storyTheme.statValue} data-testid="floating-value">
            {value || "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

export const Floating: Story = {
  render: () => <FloatingDemo />,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "A floating keyboard panel toggled by a `trigger` button. The trigger is an accessible control (`aria-expanded` + `aria-controls`). Dismiss it by clicking outside the panel (the trigger and a bound `inputRef` are excluded) or with Escape while a key is focused; opt out with `closeOnClickOutside={false}`.",
      },
      source: {
        language: "tsx",
        code: `import { useRef, useState } from "react";
import { VirtualKeyboard, qwertyLayout } from "@usefy/virtual-keyboard";

function FloatingSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  return (
    <>
      <input ref={inputRef} placeholder="Open the keyboard…" />
      <VirtualKeyboard
        variant="floating"
        inputRef={inputRef}
        layouts={qwertyLayout}
        onChange={setValue}
        // \`trigger\` content must be NON-interactive — it is wrapped in a <button>.
        trigger={<span>⌨️ Open keyboard</span>}
        // For an icon-only trigger, name it via triggerLabel="Open keyboard".
        // Uncontrolled by default (starts closed because a trigger is present).
        // Or drive it yourself: open={open} onOpenChange={setOpen}
      />
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Open keyboard/ });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    // Open the panel, type a letter into the bound input.
    await userEvent.click(trigger);
    const group = await waitFor(() =>
      canvas.getByRole("group", { name: "On-screen keyboard" })
    );
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(within(group).getByRole("button", { name: "h" }));
    await waitFor(() =>
      expect(canvas.getByTestId("floating-value")).toHaveTextContent("h")
    );

    // Escape (with a key focused) closes the panel.
    within(group).getByRole("button", { name: "h" }).focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvas.queryByRole("group")).not.toBeInTheDocument()
    );
  },
};

// ============================================================================
// Demo 4 — Docked bottom bar
// ============================================================================

function DockedDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  return (
    <div className="min-h-screen p-8">
      <div className={storyTheme.container}>
        <h2 className={storyTheme.title}>Docked variant</h2>
        <p className={storyTheme.subtitle}>
          A full-width keyboard bar fixed to the bottom of the viewport, bound to
          the input.
        </p>

        <label className={storyTheme.label} htmlFor="vk-docked">
          Message
        </label>
        <input
          id="vk-docked"
          ref={inputRef}
          className={storyTheme.input}
          placeholder="Type with the docked bar…"
          onChange={(e) => setValue(e.target.value)}
          data-testid="docked-input"
        />

        <div className={`${storyTheme.statBox} mt-4`}>
          <p className={storyTheme.statLabel}>
            value:{" "}
            <span className={storyTheme.statValue} data-testid="docked-value">
              {value || "—"}
            </span>
          </p>
        </div>
      </div>

      <VirtualKeyboard
        variant="docked"
        defaultOpen
        inputRef={inputRef}
        layouts={qwertyLayout}
        onChange={setValue}
      />
    </div>
  );
}

export const Docked: Story = {
  render: () => <DockedDemo />,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "A full-width keyboard bar fixed to the bottom of the viewport (`variant=\"docked\"`). With no trigger it defaults to open; honors `zIndex`.",
      },
      source: {
        language: "tsx",
        code: `import { useRef } from "react";
import { VirtualKeyboard, qwertyLayout } from "@usefy/virtual-keyboard";

function DockedComposer() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input ref={inputRef} placeholder="Type with the docked bar…" />
      <VirtualKeyboard
        variant="docked"
        defaultOpen
        inputRef={inputRef}
        layouts={qwertyLayout}
        zIndex={1000}
      />
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "On-screen keyboard" });
    await userEvent.click(within(group).getByRole("button", { name: "h" }));
    await userEvent.click(within(group).getByRole("button", { name: "i" }));
    await waitFor(() =>
      expect(canvas.getByTestId("docked-value")).toHaveTextContent("hi")
    );
  },
};

// ============================================================================
// Demo 5 — Accent variants (long-press / right-click)
// ============================================================================

function AccentVariantsDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Accent variants</h2>
      <p className={storyTheme.subtitle}>
        Keys with a corner dot have accents. <strong>Long-press</strong> or{" "}
        <strong>right-click</strong> a vowel (e.g. <code>a</code>, <code>e</code>
        , <code>o</code>) to pick à, é, ö… A normal click types the base letter.
      </p>

      <input
        ref={inputRef}
        className={`${storyTheme.input} mb-4`}
        placeholder="Long-press a vowel…"
        onChange={(e) => setValue(e.target.value)}
        data-testid="accent-input"
      />

      <VirtualKeyboard
        inputRef={inputRef}
        layouts={qwertyLayout}
        enableVariants
        onChange={setValue}
      />

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>
          value:{" "}
          <span className={storyTheme.statValue} data-testid="accent-value">
            {value || "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

export const AccentVariants: Story = {
  render: () => <AccentVariantsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "With `enableVariants`, keys that declare `variants` show a corner dot and open an accent chooser on long-press or right-click. Selecting a glyph inserts it through the normal edit path (caret / maxLength / keyFilter all apply).",
      },
      source: {
        language: "tsx",
        code: `import { useRef } from "react";
import { VirtualKeyboard, qwertyLayout } from "@usefy/virtual-keyboard";

function AccentInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input ref={inputRef} placeholder="Long-press a vowel…" />
      {/* Keys with a \`variants\` array (a, e, i, o, u, n, c…) show a dot and
          open an accent popup on long-press or right-click. */}
      <VirtualKeyboard inputRef={inputRef} layouts={qwertyLayout} enableVariants />
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "On-screen keyboard" });

    // Right-click a vowel to open the accent popup, then pick one.
    const oKey = within(group).getByRole("button", { name: "o" });
    await userEvent.pointer({ keys: "[MouseRight]", target: oKey });
    const menu = await waitFor(() => canvas.getByRole("menu"));
    await userEvent.click(within(menu).getByRole("menuitem", { name: "ö" }));

    await waitFor(() =>
      expect(canvas.getByTestId("accent-value")).toHaveTextContent("ö")
    );
  },
};

// ============================================================================
// Demo 6 — Secure PIN pad (randomize + auto-repeat)
// ============================================================================

function SecurePinDemo() {
  const [pin, setPin] = useState("");

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Secure PIN pad</h2>
      <p className={storyTheme.subtitle}>
        Key positions are shuffled on each mount, and Backspace auto-repeats when
        held.
      </p>

      <div className="flex justify-center gap-3 mb-5" data-testid="secure-dots">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              i < pin.length
                ? "bg-indigo-500 border-indigo-500"
                : "border-gray-300"
            }`}
          />
        ))}
      </div>

      <div className="max-w-[260px] mx-auto">
        <VirtualKeyboard
          layouts={numericLayout}
          value={pin}
          onChange={setPin}
          maxLength={4}
          keyFilter={(key) => /^[0-9]$/.test(key)}
          ariaLabel="Secure PIN pad"
          randomize
          enableKeyRepeat
        />
      </div>
    </div>
  );
}

export const SecurePinPad: Story = {
  render: () => <SecurePinDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A hardened PIN pad. `randomize` shuffles key **positions** on each mount (values are unchanged) to frustrate positional shoulder-surfing and keyloggers (SPEC §10); `enableKeyRepeat` lets Backspace auto-repeat when held. Because positions differ every mount, this pad is not muscle-memory friendly by design.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { VirtualKeyboard, numericLayout } from "@usefy/virtual-keyboard";

function SecurePin() {
  const [pin, setPin] = useState("");

  return (
    <VirtualKeyboard
      layouts={numericLayout}
      value={pin}
      onChange={setPin}
      maxLength={4}
      keyFilter={(key) => /^[0-9]$/.test(key)}
      ariaLabel="Secure PIN pad"
      randomize        // shuffle key positions each mount (secure)
      enableKeyRepeat  // hold Backspace to delete repeatedly
    />
  );
}

// Author your own custom shuffle deterministically with the pure helper:
// import { randomizeLayout } from "@usefy/virtual-keyboard";
// const shuffled = randomizeLayout(numericLayout, () => myRng());`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Secure PIN pad" });
    // Positions are shuffled, but every digit is still present and typeable.
    await userEvent.click(within(group).getByRole("button", { name: "1" }));
    await userEvent.click(within(group).getByRole("button", { name: "2" }));
    await userEvent.click(within(group).getByRole("button", { name: "3" }));
    await waitFor(() => {
      const filled = canvas
        .getByTestId("secure-dots")
        .querySelectorAll(".bg-indigo-500");
      expect(filled.length).toBe(3);
    });
  },
};

// ============================================================================
// Demo 7 — RTL (right-to-left, mirrored)
// ============================================================================

function RtlDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Right-to-left (RTL)</h2>
      <p className={storyTheme.subtitle}>
        An RTL layout (Arabic subset) renders mirrored, and Arrow-key navigation
        mirrors with it — <strong>ArrowLeft</strong> moves to the visually-left
        key. Rows are not reversed in the data; only the visual direction flips.
      </p>

      <input
        ref={inputRef}
        dir="rtl"
        className={`${storyTheme.input} mb-4`}
        placeholder="اكتب هنا…"
        onChange={(e) => setValue(e.target.value)}
        data-testid="rtl-input"
      />

      <VirtualKeyboard inputRef={inputRef} layouts={arabicLayout} onChange={setValue} />

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>
          value:{" "}
          <span className={storyTheme.statValue} data-testid="rtl-value">
            {value || "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

export const RTL: Story = {
  render: () => <RtlDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A `direction: \"rtl\"` layout sets `dir=\"rtl\"` on the keyboard root, so rows render mirrored via CSS (the data order is unchanged). Arrow-key roving nav mirrors too: ArrowLeft moves to the visually-left (next logical) key. Home/End and Up/Down stay logical.",
      },
      source: {
        language: "tsx",
        code: `import { useRef } from "react";
import { VirtualKeyboard, createLayout } from "@usefy/virtual-keyboard";

// Mark the layout RTL — the component mirrors rendering + arrow nav.
const arabic = createLayout({
  name: "arabic",
  direction: "rtl",
  rows: [
    ["ا", "ب", "ت", "ث", "ج", "ح", "خ"],
    ["د", "ذ", "ر", "ز", "س", "ش", "ص"],
    // …plus Shift / Backspace / Space / Enter rows
  ],
});

function ArabicInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} dir="rtl" placeholder="اكتب هنا…" />
      <VirtualKeyboard inputRef={inputRef} layouts={arabic} />
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "On-screen keyboard" });
    await expect(group).toHaveAttribute("dir", "rtl");

    // Arrow mirroring: from the first key, ArrowLeft moves to the NEXT logical key.
    const first = within(group).getByRole("button", { name: "ا" });
    first.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(within(group).getByRole("button", { name: "ب" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(within(group).getByRole("button", { name: "ا" })).toHaveFocus();
  },
};

// ============================================================================
// Demo 8 — Sound + haptics
// ============================================================================

function SoundHapticsDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Sound &amp; haptics</h2>
      <p className={storyTheme.subtitle}>
        Optional press feedback: a synthesized Web Audio click and a short
        vibration (where supported). Audio can only start after a user gesture —
        click a key to hear it.
      </p>

      <div className={`${storyTheme.buttonGroup} mb-4`}>
        <button
          className={sound ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
          onClick={() => setSound((s) => !s)}
          data-testid="toggle-sound"
        >
          Sound: {sound ? "on" : "off"}
        </button>
        <button
          className={haptics ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
          onClick={() => setHaptics((h) => !h)}
          data-testid="toggle-haptics"
        >
          Haptics: {haptics ? "on" : "off"}
        </button>
      </div>

      <input
        ref={inputRef}
        className={`${storyTheme.input} mb-4`}
        placeholder="Click keys to feel/hear feedback…"
        onChange={(e) => setValue(e.target.value)}
        data-testid="sh-input"
      />

      <VirtualKeyboard
        inputRef={inputRef}
        layouts={qwertyLayout}
        sound={sound}
        haptics={haptics}
        onChange={setValue}
      />

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>
          value:{" "}
          <span className={storyTheme.statValue} data-testid="sh-value">
            {value || "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

export const SoundAndHaptics: Story = {
  render: () => <SoundHapticsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Opt-in `sound` (synthesized Web Audio click — no bundled asset, CSP-friendly) and `haptics` (`navigator.vibrate`). The AudioContext is created lazily on the first key press (browsers block audio before a user gesture); both no-op where unsupported.",
      },
      source: {
        language: "tsx",
        code: `import { useRef } from "react";
import { VirtualKeyboard, qwertyLayout } from "@usefy/virtual-keyboard";

function FeedbackKeyboard() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} />
      <VirtualKeyboard
        inputRef={inputRef}
        layouts={qwertyLayout}
        sound      // synthesized Web Audio click on each press
        haptics    // navigator.vibrate(10) where supported
      />
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Audio/haptics can't be asserted headlessly — just verify typing works.
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "On-screen keyboard" });
    await userEvent.click(within(group).getByRole("button", { name: "h" }));
    await userEvent.click(within(group).getByRole("button", { name: "i" }));
    await waitFor(() =>
      expect(canvas.getByTestId("sh-value")).toHaveTextContent("hi")
    );
  },
};
