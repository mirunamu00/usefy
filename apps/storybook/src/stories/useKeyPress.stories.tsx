import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useKeyPress } from "@usefy/use-key-press";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Single-key detection with a keycap that lights up while held.
 */
function SingleKeyDemo() {
  const pressed = useKeyPress("a");

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useKeyPress</h2>
      <p className={storyTheme.subtitle}>
        Press the <code>A</code> key on your keyboard
      </p>

      <div
        className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl text-4xl font-bold transition-all duration-150 ${
          pressed
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl scale-110"
            : "bg-gray-100 text-gray-400 shadow"
        }`}
        data-testid="keycap"
      >
        A
      </div>

      <div className={`${storyTheme.statBox} mt-6`}>
        <p className={storyTheme.statLabel}>
          State:{" "}
          <span className={storyTheme.statValue} data-testid="key-status">
            {pressed ? "Pressed" : "Not Pressed"}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Command palette toggled by `mod+k` (Ctrl on Win/Linux, Cmd on macOS).
 */
function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);

  useKeyPress("mod+k", {
    preventDefault: true,
    onPress: () => setOpen((prev) => !prev),
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Command Palette</h2>
      <p className={storyTheme.subtitle}>
        Press <code>Ctrl/Cmd + K</code> to toggle
      </p>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Palette:{" "}
          <span className={storyTheme.statValue} data-testid="palette-status">
            {open ? "Open" : "Closed"}
          </span>
        </p>
      </div>

      {open && (
        <div
          className="mt-6 p-4 bg-white rounded-xl border border-gray-200 shadow-xl text-left"
          data-testid="palette"
        >
          <input
            className={storyTheme.input}
            placeholder="Type a command..."
            autoFocus
          />
          <ul className="mt-3 space-y-1">
            {["New File", "Open Settings", "Toggle Theme"].map((item) => (
              <li
                key={item}
                className="px-3 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Cross-platform save shortcut: `ctrl+s` OR `meta+s`, with the browser's
 * default save dialog suppressed.
 */
function SaveShortcutDemo() {
  const [saves, setSaves] = useState(0);

  useKeyPress(["ctrl+s", "meta+s"], {
    preventDefault: true,
    onPress: () => setSaves((count) => count + 1),
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Save Shortcut</h2>
      <p className={storyTheme.subtitle}>
        Press <code>Ctrl + S</code> / <code>Cmd + S</code> — the browser dialog
        is prevented
      </p>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Saves triggered:{" "}
          <span className={storyTheme.statValue} data-testid="save-count">
            {saves}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * WASD-style movement using physical-key matching (`matchBy: "code"`), so it
 * works regardless of keyboard layout.
 */
function MovementDemo() {
  const up = useKeyPress("w", { matchBy: "code" });
  const down = useKeyPress("s", { matchBy: "code" });
  const left = useKeyPress("a", { matchBy: "code" });
  const right = useKeyPress("d", { matchBy: "code" });

  const keyClass = (active: boolean) =>
    `inline-flex items-center justify-center w-14 h-14 rounded-lg text-lg font-bold uppercase transition-all duration-100 ${
      active
        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg scale-105"
        : "bg-gray-100 text-gray-500"
    }`;

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>WASD Movement</h2>
      <p className={storyTheme.subtitle}>
        Hold <code>W A S D</code> — matched by physical key
      </p>

      <div className="inline-grid grid-cols-3 grid-rows-2 gap-2">
        <div />
        <div className={keyClass(up)} data-testid="key-w">
          W
        </div>
        <div />
        <div className={keyClass(left)} data-testid="key-a">
          A
        </div>
        <div className={keyClass(down)} data-testid="key-s">
          S
        </div>
        <div className={keyClass(right)} data-testid="key-d">
          D
        </div>
      </div>
    </div>
  );
}

/**
 * Demonstrates `ignoreInputElements`: the `f` shortcut fires globally but not
 * while the user is typing in the input.
 */
function IgnoreInputDemo() {
  const [count, setCount] = useState(0);

  useKeyPress("f", {
    ignoreInputElements: true,
    onPress: () => setCount((c) => c + 1),
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Ignore While Typing</h2>
      <p className={storyTheme.subtitle}>
        Press <code>F</code> to count — but typing <code>f</code> in the field
        does nothing
      </p>

      <input
        className={storyTheme.input}
        placeholder="Type here (f is ignored)..."
        data-testid="text-field"
      />

      <div className={`${storyTheme.statBox} mt-6`}>
        <p className={storyTheme.statLabel}>
          Global &quot;F&quot; count:{" "}
          <span className={storyTheme.statValue} data-testid="f-count">
            {count}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof SingleKeyDemo> = {
  title: "Hooks/useKeyPress",
  component: SingleKeyDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `A hook for detecting keyboard key presses, shortcuts, and combinations.

## Features
- **Single keys & combinations** - \`"Escape"\`, \`"ctrl+s"\`, \`"mod+shift+k"\`
- **Alternative bindings** - Array is OR: \`["ctrl+s", "meta+s"]\`
- **Cross-platform \`mod\`** - Ctrl on Windows/Linux, Cmd on macOS
- **Predicate targets** - Full control: \`(e) => /[0-9]/.test(e.key)\`
- **Match by key or code** - Layout-aware or physical-key matching
- **onPress / onRelease** - Callbacks with the raw event for \`preventDefault\`
- **Robust** - Ignores auto-repeat & typing in inputs (opt-in), resets on blur
- **SSR compatible** - Safe listener setup and cleanup

## Basic Usage
\`\`\`tsx
const isPressed = useKeyPress("Escape");

useKeyPress("mod+k", {
  preventDefault: true,
  onPress: () => openCommandPalette(),
});
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SingleKeyDemo>;

export const Default: Story = {
  render: () => <SingleKeyDemo />,
  parameters: {
    docs: {
      description: {
        story: "Detects whether a single key is currently held down.",
      },
      source: {
        code: `import { useKeyPress } from "@usefy/use-key-press";

function Component() {
  const pressed = useKeyPress("a");
  return <div>{pressed ? "Pressed" : "Not Pressed"}</div>;
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("key-status")).toHaveTextContent(
      "Not Pressed"
    );

    // Press and hold "a".
    await userEvent.keyboard("{a>}");
    await waitFor(() => {
      expect(canvas.getByTestId("key-status")).toHaveTextContent("Pressed");
    });

    // Release "a".
    await userEvent.keyboard("{/a}");
    await waitFor(() => {
      expect(canvas.getByTestId("key-status")).toHaveTextContent("Not Pressed");
    });
  },
};

export const CommandPalette: Story = {
  render: () => <CommandPaletteDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Toggle a command palette with `mod+k`. `preventDefault` stops the browser's default handling.",
      },
      source: {
        code: `import { useKeyPress } from "@usefy/use-key-press";
import { useState } from "react";

function App() {
  const [open, setOpen] = useState(false);
  useKeyPress("mod+k", {
    preventDefault: true,
    onPress: () => setOpen((prev) => !prev),
  });
  return open ? <CommandPalette /> : null;
}`,
        language: "tsx",
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
    });
  },
};

export const SaveShortcut: Story = {
  render: () => <SaveShortcutDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Cross-platform save via `['ctrl+s', 'meta+s']` (array = OR). Repeats are ignored so holding the keys counts once.",
      },
      source: {
        code: `import { useKeyPress } from "@usefy/use-key-press";

function Editor({ onSave }: { onSave: () => void }) {
  useKeyPress(["ctrl+s", "meta+s"], {
    preventDefault: true,
    onPress: () => onSave(),
  });
  return <textarea />;
}`,
        language: "tsx",
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

export const Movement: Story = {
  render: () => <MovementDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Physical-key matching with `matchBy: 'code'` for layout-independent game controls.",
      },
      source: {
        code: `import { useKeyPress } from "@usefy/use-key-press";

function Game() {
  const up = useKeyPress("w", { matchBy: "code" });
  const left = useKeyPress("a", { matchBy: "code" });
  const down = useKeyPress("s", { matchBy: "code" });
  const right = useKeyPress("d", { matchBy: "code" });
  return <Player up={up} left={left} down={down} right={right} />;
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.keyboard("{w>}");
    await waitFor(() => {
      expect(canvas.getByTestId("key-w")).toHaveClass("scale-105");
    });
    await userEvent.keyboard("{/w}");
  },
};

export const IgnoreWhileTyping: Story = {
  render: () => <IgnoreInputDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "With `ignoreInputElements: true`, the global shortcut does not fire while the user types in an input, textarea, select, or contenteditable element.",
      },
      source: {
        code: `import { useKeyPress } from "@usefy/use-key-press";

function App() {
  useKeyPress("f", {
    ignoreInputElements: true,
    onPress: () => openFilter(),
  });
  return <input placeholder="Typing 'f' here does nothing" />;
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByTestId("text-field");

    await expect(canvas.getByTestId("f-count")).toHaveTextContent("0");

    // Typing "f" in the input must NOT increment the counter.
    await userEvent.type(field, "coffee");
    await expect(canvas.getByTestId("f-count")).toHaveTextContent("0");

    // Pressing "f" outside the field DOES increment.
    field.blur();
    await userEvent.keyboard("f");
    await waitFor(() => {
      expect(canvas.getByTestId("f-count")).toHaveTextContent("1");
    });
  },
};
