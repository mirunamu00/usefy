import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";
import { useCounter } from "@usefy/use-counter";

function CounterDemo({ initialValue = 0 }: { initialValue?: number }) {
  const { count, increment, decrement, reset } = useCounter(initialValue);

  return (
    <div className={storyTheme.containerCentered + " max-w-md mx-auto"}>
      <h2 className={storyTheme.titleLarge + " text-center mb-8 text-3xl font-extrabold tracking-tight text-slate-900"}>useCounter Hook Demo</h2>
      <div className={storyTheme.gradientBox + " mb-8 p-10 rounded-3xl shadow-2xl text-center"}>
        <p
          data-testid="count"
          className="text-8xl font-black text-white m-0 drop-shadow-sm"
        >
          {count}
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <button
          data-testid="decrement-btn"
          onClick={decrement}
          className={storyTheme.buttonSecondary + " flex-1 py-3 rounded-xl font-bold"}
        >
          - Decrement
        </button>
        <button
          data-testid="reset-btn"
          onClick={reset}
          className={storyTheme.buttonNeutral + " px-6 py-3 rounded-xl font-bold"}
        >
          Reset
        </button>
        <button
          data-testid="increment-btn"
          onClick={increment}
          className={storyTheme.buttonPrimary + " flex-1 py-3 rounded-xl font-bold shadow-lg"}
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
  parameters: {
    docs: {
      source: {
        code: `import { useCounter } from "@usefy/use-counter";

function Counter() {
  const { count, increment, decrement, reset } = useCounter(0);

  return (
    <div>
      <h2>Counter: {count}</h2>
      <button onClick={increment}>+ Increment</button>
      <button onClick={decrement}>- Decrement</button>
      <button onClick={reset}>Reset</button>
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
  parameters: {
    docs: {
      source: {
        code: `import { useCounter } from "@usefy/use-counter";

function Counter() {
  const { count, increment, decrement, reset } = useCounter(10);

  return (
    <div>
      <h2>Counter: {count}</h2>
      <button onClick={increment}>+ Increment</button>
      <button onClick={decrement}>- Decrement</button>
      <button onClick={reset}>Reset</button>
      {/* Reset returns to initial value (10) */}
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
  parameters: {
    docs: {
      source: {
        code: `import { useCounter } from "@usefy/use-counter";

function Counter() {
  const { count, increment, decrement, reset } = useCounter(-5);

  return (
    <div>
      <h2>Counter: {count}</h2>
      <button onClick={increment}>+ Increment</button>
      <button onClick={decrement}>- Decrement</button>
      <button onClick={reset}>Reset</button>
      {/* Works with negative values too! */}
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
