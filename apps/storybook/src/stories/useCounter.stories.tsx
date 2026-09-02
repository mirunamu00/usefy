import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";
import { useCounter } from "@usefy/use-counter";

function CounterDemo({ initialValue = 0 }: { initialValue?: number }) {
  const { count, increment, decrement, reset } = useCounter(initialValue);

  return (
    <div className={storyTheme.containerCentered + " max-w-md mx-auto"}>
      <h2 className={storyTheme.titleLarge + " text-center mb-8 text-3xl font-semibold tracking-tight text-zinc-900"}>useCounter Hook Demo</h2>
      <div className={storyTheme.gradientBox + " mb-8 p-10 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-center"}>
        <p
          data-testid="count"
          className="text-8xl font-semibold text-white m-0"
        >
          {count}
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <button
          data-testid="decrement-btn"
          onClick={decrement}
          className={storyTheme.buttonSecondary + " flex-1 py-3 rounded-md font-bold"}
        >
          - Decrement
        </button>
        <button
          data-testid="reset-btn"
          onClick={reset}
          className={storyTheme.buttonNeutral + " px-6 py-3 rounded-md font-bold"}
        >
          Reset
        </button>
        <button
          data-testid="increment-btn"
          onClick={increment}
          className={storyTheme.buttonPrimary + " flex-1 py-3 rounded-md font-bold shadow-sm"}
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
    docs: {
      description: {
        component: `Manage a numeric **counter** with ready-made \`increment\`, \`decrement\`, and \`reset\` actions. Ideal for quantity selectors, pagination controls, scoreboards, and step wizards.

Pass an optional \`initialValue\` (defaults to \`0\`). Returns \`{ count, increment, decrement, reset }\` — every action is memoized with \`useCallback\` for a stable identity across renders.

## Features
- **\`increment\` / \`decrement\`** — adjust the count by 1 using the functional updater, so rapid clicks batch correctly
- **\`reset\`** — returns the count to the \`initialValue\` it was created with
- **Any starting point** — accepts positive, zero, or negative \`initialValue\`; the count is unbounded in both directions
- **Stable references** — all three actions keep a constant identity, safe to pass to memoized children or effect deps
- **Zero config** — no options object; supports React 18 and 19

## Basic Usage
\`\`\`tsx
import { useCounter } from "@usefy/use-counter";

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
}
\`\`\``,
      },
    },
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
      description: {
        story:
          "Starts at 0 and exercises every action — increment, decrement, and reset back to the initial value.",
      },
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
      description: {
        story:
          "Seeds the counter with an initialValue of 10 and shows that reset returns to that starting value, not to 0.",
      },
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
      description: {
        story:
          "Starts at -5 to show the counter is unbounded — it works with negative values and can decrement below zero.",
      },
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
