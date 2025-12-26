import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useCounter } from "./useCounter";
import { within, userEvent, expect } from "storybook/test";

function CounterDemo({ initialValue = 0 }: { initialValue?: number }) {
  const { count, increment, decrement, reset } = useCounter(initialValue);

  return (
    <div className="p-12 text-center font-sans max-w-[500px] mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-8">
        useCounter Hook Demo
      </h2>
      <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl p-8 mb-8 shadow-[0_10px_25px_rgba(102,126,234,0.3)]">
        <p
          data-testid="count"
          className="text-6xl font-bold text-white m-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
        >
          {count}
        </p>
      </div>
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          data-testid="decrement-btn"
          onClick={decrement}
          className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-br from-[#f093fb] to-[#f5576c] border-none rounded-lg cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(245,87,108,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(245,87,108,0.4)]"
        >
          − Decrement
        </button>
        <button
          data-testid="reset-btn"
          onClick={reset}
          className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 border-2 border-gray-200 rounded-lg cursor-pointer transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:bg-gray-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
        >
          ↻ Reset
        </button>
        <button
          data-testid="increment-btn"
          onClick={increment}
          className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-br from-[#667eea] to-[#764ba2] border-none rounded-lg cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(102,126,234,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(102,126,234,0.4)]"
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
