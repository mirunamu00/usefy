import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useFocusWithin } from "@usefy/use-focus-within";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Form-highlight demo — the whole card lights up whenever focus is anywhere
 * inside it (any field or button), and dims again once focus leaves entirely.
 * Tabbing between the fields keeps it lit; it never flickers on inner moves.
 */
function FormHighlightDemo() {
  const [ref, focused] = useFocusWithin<HTMLFormElement>();

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>useFocusWithin</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        The card is highlighted whenever focus is on <em>any</em> field inside —
        the reactive equivalent of CSS <code>:focus-within</code>
      </p>

      <form
        ref={ref}
        onSubmit={(e) => e.preventDefault()}
        data-testid="card"
        className={`rounded-2xl border-2 p-6 transition-all duration-200 ${
          focused
            ? "border-indigo-500 bg-indigo-50 shadow-[0_0_0_4px_rgba(99,102,241,0.15)]"
            : "border-gray-200 bg-white shadow-sm"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Contact</h3>
          <span
            data-testid="badge"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              focused
                ? "bg-indigo-500 text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {focused ? "focused" : "idle"}
          </span>
        </div>

        <label className={storyTheme.label} htmlFor="fw-name">
          Name
        </label>
        <input
          id="fw-name"
          data-testid="field-name"
          className={`${storyTheme.input} mb-3`}
          placeholder="Ada Lovelace"
        />

        <label className={storyTheme.label} htmlFor="fw-email">
          Email
        </label>
        <input
          id="fw-email"
          data-testid="field-email"
          className={`${storyTheme.input} mb-5`}
          placeholder="ada@example.com"
        />

        <button
          type="submit"
          data-testid="submit"
          className={`${storyTheme.buttonPrimary} w-full`}
        >
          Send
        </button>
      </form>

      <button
        type="button"
        data-testid="outside"
        className={`${storyTheme.buttonNeutral} mt-4 w-full`}
      >
        An element outside the card
      </button>
    </div>
  );
}

/**
 * Edge-callbacks demo — `onFocus` / `onBlur` fire only when focus *enters* or
 * *leaves* the subtree, never on moves between the inner fields. The log proves
 * it: tabbing across both inputs records a single "entered", and clicking out
 * records a single "left".
 */
function EdgeCallbacksDemo() {
  const [log, setLog] = useState<string[]>([]);
  const [ref, focused] = useFocusWithin<HTMLDivElement>({
    onFocus: () => setLog((l) => [...l, "entered"]),
    onBlur: () => setLog((l) => [...l, "left"]),
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>onFocus / onBlur</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Edge callbacks fire on the subtree's transitions only — not on every
        inner focus move
      </p>

      <div
        ref={ref}
        data-testid="group"
        className={`rounded-2xl border-2 p-6 transition-colors duration-200 ${
          focused ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className={storyTheme.buttonGroup}>
          <input
            data-testid="first"
            className={storyTheme.input}
            placeholder="First"
          />
          <input
            data-testid="second"
            className={storyTheme.input}
            placeholder="Second"
          />
        </div>
      </div>

      <button
        type="button"
        data-testid="outside"
        className={`${storyTheme.buttonNeutral} mt-4 w-full`}
      >
        Click here to leave the group
      </button>

      <div className={`${storyTheme.card} mt-4`}>
        <div className={storyTheme.statLabel}>Transition log</div>
        <div data-testid="log" className="font-mono text-sm text-gray-700">
          {log.length === 0 ? "—" : log.join(" → ")}
        </div>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof FormHighlightDemo> = {
  title: "Hooks/useFocusWithin",
  component: FormHighlightDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Track whether keyboard focus is currently anywhere within a subtree — the reactive, state-driven equivalent of the CSS \`:focus-within\` pseudo-class. Attach the returned callback ref to a container and \`focused\` is \`true\` whenever the active element is that container or any descendant.

It listens for the **bubbling** \`focusin\` / \`focusout\` events (the non-bubbling \`focus\` / \`blur\` can't see descendant focus), and correctly distinguishes focus *moving between descendants* (stays \`true\`, no flicker) from focus *leaving the subtree* (goes \`false\`).

## Features
- **\`[ref, focused]\` tuple** - attach the callback ref, read the boolean
- **No flicker** - focus moving between two children keeps \`focused\` true
- **Robust \`relatedTarget: null\` handling** - defers to \`document.activeElement\` on the next microtask when the browser reports an unreliable \`relatedTarget\`
- **Edge callbacks** - optional \`onFocus\` / \`onBlur\` fire only on the subtree's \`false ↔ true\` transitions
- **Callback ref** - listeners attach/detach exactly on mount/unmount; SSR-safe and StrictMode-safe

## Basic Usage
\`\`\`tsx
const [ref, focused] = useFocusWithin<HTMLFormElement>();

return (
  <form ref={ref} style={{ outline: focused ? "2px solid dodgerblue" : "none" }}>
    <input placeholder="Name" />
    <input placeholder="Email" />
  </form>
);
\`\`\`
`,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormHighlightDemo>;

export const FormHighlight: Story = {
  render: () => <FormHighlightDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A form card that highlights while focus is anywhere inside it. Tab across the fields — it stays lit (no flicker on inner moves) — then focus the element outside to dim it again.",
      },
      source: {
        language: "tsx",
        code: `import { useFocusWithin } from "@usefy/use-focus-within";

function ContactCard() {
  const [ref, focused] = useFocusWithin<HTMLFormElement>();

  return (
    <form
      ref={ref}
      className={focused ? "card card--focused" : "card"}
    >
      <span>{focused ? "focused" : "idle"}</span>
      <input placeholder="Name" />
      <input placeholder="Email" />
      <button type="submit">Send</button>
    </form>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const badge = canvas.getByTestId("badge");
    expect(badge).toHaveTextContent("idle");

    // Focus enters the card → highlighted.
    await userEvent.click(canvas.getByTestId("field-name"));
    await waitFor(() => expect(badge).toHaveTextContent("focused"));

    // Move to the second field — stays focused (no flicker on inner move).
    await userEvent.tab();
    expect(canvas.getByTestId("field-email")).toHaveFocus();
    expect(badge).toHaveTextContent("focused");

    // Focus leaves to the outside element → back to idle.
    await userEvent.click(canvas.getByTestId("outside"));
    await waitFor(() => expect(badge).toHaveTextContent("idle"));
  },
};

export const EdgeCallbacks: Story = {
  render: () => <EdgeCallbacksDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "`onFocus` and `onBlur` fire only on the subtree's transitions. Tabbing across both inputs logs a single `entered`; clicking outside logs a single `left`.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { useFocusWithin } from "@usefy/use-focus-within";

function Group() {
  const [log, setLog] = useState<string[]>([]);

  // onFocus fires when focus ENTERS the group; onBlur when it LEAVES entirely.
  // Neither fires when focus moves between the two inputs.
  const [ref, focused] = useFocusWithin<HTMLDivElement>({
    onFocus: () => setLog((l) => [...l, "entered"]),
    onBlur: () => setLog((l) => [...l, "left"]),
  });

  return (
    <>
      <div ref={ref} className={focused ? "group--active" : "group"}>
        <input placeholder="First" />
        <input placeholder="Second" />
      </div>
      <p>{log.join(" → ")}</p>
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = canvas.getByTestId("log");

    // Enter the group and tab across both inputs — a single "entered".
    await userEvent.click(canvas.getByTestId("first"));
    await waitFor(() => expect(log).toHaveTextContent("entered"));
    await userEvent.tab();
    expect(canvas.getByTestId("second")).toHaveFocus();
    expect(log).toHaveTextContent("entered");
    expect(log).not.toHaveTextContent("left");

    // Leave the group — a single "left" is appended.
    await userEvent.click(canvas.getByTestId("outside"));
    await waitFor(() => expect(log).toHaveTextContent("entered → left"));
  },
};
