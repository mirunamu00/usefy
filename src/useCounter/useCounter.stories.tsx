import type { Meta, StoryObj } from "@storybook/react";
import { useCounter } from "./useCounter";

function CounterDemo({ initialValue = 0 }: { initialValue?: number }) {
  const { count, increment, decrement, reset } = useCounter(initialValue);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>useCounter Hook Demo</h2>
      <div style={{ fontSize: "48px", fontWeight: "bold", margin: "20px 0" }}>
        Count: {count}
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={increment}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Increment (+1)
        </button>
        <button
          onClick={decrement}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Decrement (-1)
        </button>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Reset
        </button>
      </div>
      <div style={{ marginTop: "20px", color: "#666" }}>
        Initial value: {initialValue}
      </div>
    </div>
  );
}

const meta = {
  title: "useCounter",
  component: CounterDemo,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    initialValue: {
      control: { type: "number" },
      description: "The initial value for the counter",
    },
  },
} satisfies Meta<typeof CounterDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialValue: 0,
  },
};

export const StartingAtTen: Story = {
  args: {
    initialValue: 10,
  },
};

export const StartingAtNegative: Story = {
  args: {
    initialValue: -5,
  },
};

export const StartingAtHundred: Story = {
  args: {
    initialValue: 100,
  },
};
