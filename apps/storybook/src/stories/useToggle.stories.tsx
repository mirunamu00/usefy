import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useToggle } from "@usefy/use-toggle";
import { within, userEvent, expect } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Demo component for useToggle
 */
function ToggleDemo({
  initialValue = false,
  title = "useToggle Demo",
}: {
  initialValue?: boolean;
  title?: string;
}) {
  const { value, toggle, setTrue, setFalse, setValue } =
    useToggle(initialValue);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>{title}</h2>

      {/* Current State Display */}
      <div
        data-testid="state-display"
        role="status"
        aria-live="polite"
        className={`p-8 mb-8 rounded-2xl text-center text-3xl font-bold transition-all duration-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] ${
          value
            ? "bg-gradient-to-br from-green-50 to-green-100 text-green-800 shadow-[0_10px_25px_rgba(16,185,129,0.3)]"
            : "bg-gradient-to-br from-red-50 to-red-100 text-red-800 shadow-[0_10px_25px_rgba(239,68,68,0.3)]"
        }`}
      >
        State: {value ? "TRUE" : "FALSE"}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={toggle}
          aria-label="Toggle the current state"
          type="button"
          className={storyTheme.buttonPrimary + " w-full"}
        >
          ⇄ Toggle
        </button>

        <button
          onClick={setTrue}
          aria-label="Set state to true"
          type="button"
          className="w-full py-3.5 px-6 text-base font-semibold text-white bg-gradient-to-br from-green-500 to-green-600 border-none rounded-xl cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.4)]"
        >
          ✓ Set True
        </button>

        <button
          onClick={setFalse}
          aria-label="Set state to false"
          type="button"
          className="w-full py-3.5 px-6 text-base font-semibold text-white bg-gradient-to-br from-red-500 to-red-600 border-none rounded-xl cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(239,68,68,0.4)]"
        >
          ✕ Set False
        </button>

        <button
          onClick={() => setValue(!value)}
          aria-label="Set state to opposite value"
          type="button"
          className="w-full py-3.5 px-6 text-base font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
        >
          ⟲ Set Value (opposite)
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof ToggleDemo> = {
  title: "Hooks/useToggle",
  component: ToggleDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Manage a single **boolean** state with a small set of purpose-built helpers instead of hand-rolling \`useState(false)\` plus setter closures. Perfect for modals, dropdowns, accordions, and any on/off UI state.

Pass an optional \`initialValue\` (defaults to \`false\`). Returns \`{ value, toggle, setTrue, setFalse, setValue }\` — every function is memoized with \`useCallback\` for a stable identity across renders.

## Features
- **\`toggle\`** — flips the current value (uses the functional updater, so it is always correct)
- **\`setTrue\` / \`setFalse\`** — idempotent setters for the explicit on/off cases (great as direct \`onClick\` handlers)
- **\`setValue\`** — set the state to any boolean directly for controlled/computed cases
- **Stable references** — all four functions keep a constant identity, safe to pass to memoized children or effect deps
- **Zero config** — no options object; supports React 18 and 19

## Basic Usage
\`\`\`tsx
import { useToggle } from "@usefy/use-toggle";

function Modal() {
  const { value: isOpen, toggle, setTrue, setFalse } = useToggle(false);

  return (
    <>
      <button onClick={setTrue}>Open</button>
      <button onClick={toggle}>Toggle</button>
      {isOpen && (
        <div role="dialog">
          Modal content
          <button onClick={setFalse}>Close</button>
        </div>
      )}
    </>
  );
}
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    initialValue: {
      control: "boolean",
      description: "Initial boolean value",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    title: {
      control: "text",
      description: "Title displayed in the demo",
      table: {
        type: { summary: "string" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleDemo>;

/**
 * Default story starting with false
 */
export const Default: Story = {
  args: {
    initialValue: false,
    title: "Basic Toggle",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Starts at false and shows every helper — toggle flips the value, while setTrue and setFalse jump straight to a known state.",
      },
      source: {
        code: `import { useToggle } from "@usefy/use-toggle";

function ToggleExample() {
  const { value, toggle, setTrue, setFalse } = useToggle(false);

  return (
    <div>
      <h2>Basic Toggle</h2>
      <div>State: {value ? "TRUE" : "FALSE"}</div>
      <div>
        <button onClick={toggle}>⇄ Toggle</button>
        <button onClick={setTrue}>✓ Set True</button>
        <button onClick={setFalse}>✕ Set False</button>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state should be FALSE
    await expect(canvas.getByTestId("state-display")).toHaveTextContent(
      "FALSE"
    );

    // Click Toggle button - should become TRUE
    await userEvent.click(
      canvas.getByRole("button", { name: /toggle the current state/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent("TRUE");

    // Click Toggle again - should become FALSE
    await userEvent.click(
      canvas.getByRole("button", { name: /toggle the current state/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent(
      "FALSE"
    );

    // Click Set True - should be TRUE
    await userEvent.click(
      canvas.getByRole("button", { name: /set state to true/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent("TRUE");

    // Click Set False - should be FALSE
    await userEvent.click(
      canvas.getByRole("button", { name: /set state to false/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent(
      "FALSE"
    );
  },
};

/**
 * Story starting with true
 */
export const StartingTrue: Story = {
  args: {
    initialValue: true,
    title: "Starting with True",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Seeds the hook with an initialValue of true, so the state renders on from the first paint.",
      },
      source: {
        code: `import { useToggle } from "@usefy/use-toggle";

function StartingTrueExample() {
  const { value, toggle, setTrue, setFalse } = useToggle(true);

  return (
    <div>
      <h2>Starting with True</h2>
      <div>State: {value ? "TRUE" : "FALSE"}</div>
      <div>
        <button onClick={toggle}>⇄ Toggle</button>
        <button onClick={setTrue}>✓ Set True</button>
        <button onClick={setFalse}>✕ Set False</button>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state should be TRUE
    await expect(canvas.getByTestId("state-display")).toHaveTextContent("TRUE");

    // Click Toggle - should become FALSE
    await userEvent.click(
      canvas.getByRole("button", { name: /toggle the current state/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent(
      "FALSE"
    );
  },
};

/**
 * Testing setValue function
 */
export const SetValueFunction: Story = {
  args: {
    initialValue: false,
    title: "Set Value Function",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Uses setValue to drive the state to any boolean directly — ideal when the next value is computed rather than a fixed on or off.",
      },
      source: {
        code: `import { useToggle } from "@usefy/use-toggle";

function SetValueExample() {
  const { value, setValue } = useToggle(false);

  return (
    <div>
      <h2>Set Value Function</h2>
      <div>State: {value ? "TRUE" : "FALSE"}</div>
      <div>
        <button onClick={() => setValue(!value)}>
          Set Value (opposite)
        </button>
        <button onClick={() => setValue(true)}>Set to True</button>
        <button onClick={() => setValue(false)}>Set to False</button>
      </div>
      <p>💡 Use setValue() to set the state to any boolean value directly.</p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state should be FALSE
    await expect(canvas.getByTestId("state-display")).toHaveTextContent(
      "FALSE"
    );

    // Click "Set Value (opposite)" - should become TRUE
    await userEvent.click(
      canvas.getByRole("button", { name: /set state to opposite value/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent("TRUE");

    // Click "Set Value (opposite)" again - should become FALSE
    await userEvent.click(
      canvas.getByRole("button", { name: /set state to opposite value/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent(
      "FALSE"
    );
  },
};

/**
 * Idempotent operations - calling setTrue/setFalse multiple times
 */
export const IdempotentOperations: Story = {
  args: {
    initialValue: false,
    title: "Idempotent Operations",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates that setTrue and setFalse are idempotent — calling either repeatedly settles on the same state as calling it once.",
      },
      source: {
        code: `import { useToggle } from "@usefy/use-toggle";

function IdempotentExample() {
  const { value, setTrue, setFalse } = useToggle(false);

  return (
    <div>
      <h2>Idempotent Operations</h2>
      <div>State: {value ? "TRUE" : "FALSE"}</div>
      <div>
        <button onClick={setTrue}>✓ Set True</button>
        <button onClick={setFalse}>✕ Set False</button>
      </div>
      <p>
        💡 Calling setTrue() or setFalse() multiple times has the same effect
        as calling it once. These operations are idempotent.
      </p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click Set True multiple times - should stay TRUE
    await userEvent.click(
      canvas.getByRole("button", { name: /set state to true/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent("TRUE");

    await userEvent.click(
      canvas.getByRole("button", { name: /set state to true/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent("TRUE");

    // Click Set False multiple times - should stay FALSE
    await userEvent.click(
      canvas.getByRole("button", { name: /set state to false/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent(
      "FALSE"
    );

    await userEvent.click(
      canvas.getByRole("button", { name: /set state to false/i })
    );
    await expect(canvas.getByTestId("state-display")).toHaveTextContent(
      "FALSE"
    );
  },
};
