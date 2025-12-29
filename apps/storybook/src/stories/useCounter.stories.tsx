import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useCounter } from "@usefy/use-counter";
import { within, userEvent, expect } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function CounterDemo({ initialValue = 0 }: { initialValue?: number }) {
  const { count, increment, decrement, reset } = useCounter(initialValue);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.titleLarge}>useCounter Hook Demo</h2>
      <div className={storyTheme.gradientBox + " mb-8"}>
        <p
          data-testid="count"
          className="text-6xl font-bold text-white m-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
        >
          {count}
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <button
          data-testid="decrement-btn"
          onClick={decrement}
          className={storyTheme.buttonSecondary}
        >
          - Decrement
        </button>
        <button
          data-testid="reset-btn"
          onClick={reset}
          className={storyTheme.buttonNeutral}
        >
          Reset
        </button>
        <button
          data-testid="increment-btn"
          onClick={increment}
          className={storyTheme.buttonPrimary}
        >
          + Increment
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof CounterDemo> = {
  title: "Hooks/useCounter",
  component: CounterDemo,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    initialValue: {
      control: { type: "number" },
      description: "Initial count value",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CounterDemo>;

export const Default: Story = {
  args: {
    initialValue: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state
    await expect(canvas.getByTestId("count")).toHaveTextContent("0");

    // Test increment
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("1");

    // Test multiple increments
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("3");

    // Test decrement
    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("2");

    // Test reset
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("0");
  },
};

export const WithInitialValue: Story = {
  args: {
    initialValue: 10,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify initial value
    await expect(canvas.getByTestId("count")).toHaveTextContent("10");

    // Test increment from initial value
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("11");

    // Test decrement
    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("9");

    // Test reset returns to initial value
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("10");
  },
};

export const WithNegativeInitialValue: Story = {
  args: {
    initialValue: -5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify negative initial value
    await expect(canvas.getByTestId("count")).toHaveTextContent("-5");

    // Test increment from negative
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("-4");

    // Test decrement to more negative
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("-6");
  },
};
