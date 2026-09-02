import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useHotkeys } from "@usefy/use-hotkeys";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Command palette toggled by `mod+k` (Ctrl on Win/Linux, Cmd on macOS), with a
 * live "last fired" indicator.
 */
function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  const [lastFired, setLastFired] = useState("—");

  useHotkeys(
    "mod+k",
    (_event, match) => {
      setOpen((prev) => !prev);
      setLastFired(match.hotkey);
    },
    { preventDefault: true }
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useHotkeys</h2>
      <p className={storyTheme.subtitle}>
        Press <code>Ctrl/Cmd + K</code> to toggle the palette
      </p>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Palette:{" "}
          <span className={storyTheme.statValue} data-testid="palette-status">
            {open ? "Open" : "Closed"}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          Last fired:{" "}
          <span className={storyTheme.statValue} data-testid="last-fired">
            {lastFired}
          </span>
        </p>
      </div>

      {open && (
        <div
          className="mt-6 p-4 bg-white rounded-md border border-zinc-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-left"
          data-testid="palette"
        >
          <input
            className={storyTheme.input}
            placeholder="Type a command..."
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

/**
 * A two-step sequence: press `g` then `i` (like Gmail's "go to inbox"), shown
 * with the last matched sequence.
 */
function SequenceDemo() {
  const [route, setRoute] = useState("/");

  useHotkeys("g i", () => setRoute("/inbox"));
  useHotkeys("g s", () => setRoute("/settings"));

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Key Sequences</h2>
      <p className={storyTheme.subtitle}>
        Press <code>g</code> then <code>i</code> (inbox) or <code>g</code> then{" "}
        <code>s</code> (settings)
      </p>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Current route:{" "}
          <span className={storyTheme.statValue} data-testid="route">
            {route}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * One handler bound to several combos — an array is matched as OR.
 */
function MultipleBindingsDemo() {
  const [saves, setSaves] = useState(0);

  useHotkeys(["mod+s", "ctrl+enter"], () => setSaves((count) => count + 1), {
    preventDefault: true,
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Multiple Bindings</h2>
      <p className={storyTheme.subtitle}>
        Save with <code>Ctrl/Cmd + S</code> or <code>Ctrl + Enter</code>
      </p>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Saves:{" "}
          <span className={storyTheme.statValue} data-testid="save-count">
            {saves}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * The input-field guard: the `n` shortcut fires globally but not while the user
 * is typing in the field.
 */
function InputGuardDemo() {
  const [count, setCount] = useState(0);

  useHotkeys("n", () => setCount((c) => c + 1));

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Input-Field Guard</h2>
      <p className={storyTheme.subtitle}>
        Press <code>N</code> to count — typing <code>n</code> in the field does
        nothing
      </p>

      <input
        className={storyTheme.input}
        placeholder="Type here (n is ignored)..."
        data-testid="text-field"
      />

      <div className={`${storyTheme.statBox} mt-6`}>
        <p className={storyTheme.statLabel}>
          Global &quot;N&quot; count:{" "}
          <span className={storyTheme.statValue} data-testid="n-count">
            {count}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof CommandPaletteDemo> = {
  title: "Hooks/useHotkeys",
  component: CommandPaletteDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `A hook for high-level keyboard shortcuts — combos, sequences, the cross-platform \`mod\` alias, scoping, and an input-field guard.

## Features
- **Combos** — \`"mod+k"\`, \`"ctrl+shift+p"\`, \`"shift+?"\`, \`"Escape"\`
- **Sequences** - space-separated combos like \`"g i"\` or \`"g g"\` (Gmail-style)
- **Multiple bindings** - an array binds many hotkeys to one handler
- **Cross-platform \`mod\`** - Cmd on macOS, Ctrl on Windows/Linux
- **Exact modifiers** - \`"a"\` never fires on \`Ctrl+A\`
- **Input-field guard** - ignores editable targets by default (\`enableOnFormTags\` opts out)
- **Scoping** - bind to \`document\` (default), \`window\`, an element, or a ref
- **SSR & StrictMode safe** - no duplicate listeners, no leaked sequence timers

## Basic Usage
\`\`\`tsx
useHotkeys("mod+k", () => openCommandPalette(), { preventDefault: true });

// multiple bindings for one handler
useHotkeys(["mod+s", "ctrl+enter"], save);

// a sequence
useHotkeys("g i", () => navigate("/inbox"));
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CommandPaletteDemo>;

export const CommandPalette: Story = {
  render: () => <CommandPaletteDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Toggle a command palette with `mod+k`. `preventDefault` stops the browser's default handling, and the handler's second argument reports which binding matched.",
      },
      source: {
        language: "tsx",
        code: `import { useHotkeys } from "@usefy/use-hotkeys";
import { useState } from "react";

function App() {
  const [open, setOpen] = useState(false);
  useHotkeys("mod+k", () => setOpen((o) => !o), { preventDefault: true });
  return open ? <CommandPalette /> : null;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("palette-status")).toHaveTextContent(
      "Closed"
    );

    // mod resolves to Control on non-Apple CI platforms.
    await userEvent.keyboard("{Control>}k{/Control}");
    await waitFor(() => {
      expect(canvas.getByTestId("palette-status")).toHaveTextContent("Open");
      expect(canvas.getByTestId("last-fired")).toHaveTextContent("mod+k");
    });
  },
};

export const Sequences: Story = {
  render: () => <SequenceDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Space-separated combos are matched as an ordered sequence. Press `g` then `i` within the timeout window to navigate.",
      },
      source: {
        language: "tsx",
        code: `import { useHotkeys } from "@usefy/use-hotkeys";

function App() {
  useHotkeys("g i", () => navigate("/inbox"));
  useHotkeys("g s", () => navigate("/settings"));
  return <Routes />;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("route")).toHaveTextContent("/");

    await userEvent.keyboard("g");
    await userEvent.keyboard("i");
    await waitFor(() => {
      expect(canvas.getByTestId("route")).toHaveTextContent("/inbox");
    });
  },
};

export const MultipleBindings: Story = {
  render: () => <MultipleBindingsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Pass an array to bind several hotkeys to a single handler (matched as OR).",
      },
      source: {
        language: "tsx",
        code: `import { useHotkeys } from "@usefy/use-hotkeys";

function Editor({ onSave }: { onSave: () => void }) {
  useHotkeys(["mod+s", "ctrl+enter"], onSave, { preventDefault: true });
  return <textarea />;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("save-count")).toHaveTextContent("0");

    await userEvent.keyboard("{Control>}s{/Control}");
    await waitFor(() => {
      expect(canvas.getByTestId("save-count")).toHaveTextContent("1");
    });
  },
};

export const InputFieldGuard: Story = {
  render: () => <InputGuardDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "By default hotkeys do not fire while an editable element is focused, so typing in a form never triggers shortcuts. Set `enableOnFormTags: true` to opt out.",
      },
      source: {
        language: "tsx",
        code: `import { useHotkeys } from "@usefy/use-hotkeys";

function App() {
  useHotkeys("n", () => createNew()); // guarded by default
  // to also fire inside inputs:
  // useHotkeys("n", createNew, { enableOnFormTags: true });
  return <input placeholder="Typing 'n' here does nothing" />;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByTestId("text-field");

    await expect(canvas.getByTestId("n-count")).toHaveTextContent("0");

    // Typing "n" in the input must NOT increment the counter.
    await userEvent.type(field, "notes");
    await expect(canvas.getByTestId("n-count")).toHaveTextContent("0");

    // Pressing "n" outside the field DOES increment.
    field.blur();
    await userEvent.keyboard("n");
    await waitFor(() => {
      expect(canvas.getByTestId("n-count")).toHaveTextContent("1");
    });
  },
};
