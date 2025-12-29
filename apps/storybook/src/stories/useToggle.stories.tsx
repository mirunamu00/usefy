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
        component:
          "A hook for managing boolean state with helpful utilities. Perfect for modals, dropdowns, and any on/off state management.",
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
