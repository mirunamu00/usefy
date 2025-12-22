import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { useCounter } from "./useCounter";
import { within, userEvent, expect } from "storybook/test";

function CounterDemo({ initialValue = 0 }: { initialValue?: number }) {
  const { count, increment, decrement, reset } = useCounter(initialValue);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>useCounter Hook Demo</h2>
      <p data-testid="count" style={{ fontSize: "3rem", margin: "1rem 0" }}>
        {count}
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <button data-testid="decrement-btn" onClick={decrement}>
          Decrement
        </button>
        <button data-testid="reset-btn" onClick={reset}>
          Reset
        </button>
        <button data-testid="increment-btn" onClick={increment}>
          Increment
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

export const LargeInitialValue: Story = {
  args: {
    initialValue: 100,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("count")).toHaveTextContent("100");

    // Test operations with large numbers
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("101");

    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("99");
  },
};

export const RapidClicks: Story = {
  args: {
    initialValue: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test rapid increment clicks
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("5");

    // Test rapid decrement clicks
    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("2");

    // Test reset after rapid changes
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("0");
  },
};

export const CrossingZero: Story = {
  args: {
    initialValue: 2,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Start at 2
    await expect(canvas.getByTestId("count")).toHaveTextContent("2");

    // Go through zero to negative
    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("1");

    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("0");

    await userEvent.click(canvas.getByTestId("decrement-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("-1");

    // Come back through zero to positive
    await userEvent.click(canvas.getByTestId("increment-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("0");

    await userEvent.click(canvas.getByTestId("increment-btn"));
    await expect(canvas.getByTestId("count")).toHaveTextContent("1");
  },
};
