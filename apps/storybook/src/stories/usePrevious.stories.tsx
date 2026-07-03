import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { usePrevious } from "@usefy/use-previous";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const [count, setCount] = useState(0);
  const prev = usePrevious(count);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>usePrevious</h2>
      <p className={storyTheme.subtitle}>Compare the current value with the previous render</p>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Previous:{" "}
          <span className={storyTheme.statValue} data-testid="prev">
            {prev === undefined ? "—" : prev}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          Current:{" "}
          <span className={storyTheme.statValue} data-testid="current">
            {count}
          </span>
        </p>
        <p className="text-gray-500 text-sm mt-2" data-testid="trend">
          {prev === undefined ? "First render" : count > prev ? "↑ increased" : "↓ decreased"}
        </p>
      </div>

      <div className={`${storyTheme.buttonGroup} justify-center mt-6`}>
        <button className={storyTheme.buttonPrimary} data-testid="inc" onClick={() => setCount((c) => c + 1)}>
          +1
        </button>
        <button className={storyTheme.buttonNeutral} data-testid="dec" onClick={() => setCount((c) => c - 1)}>
          -1
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/usePrevious",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Returns the value from the previous render. \`undefined\` on the first render, then the previous distinct value — ideal for change detection, transition/animation triggers, and "before → after" comparisons.

## Features
- **Ref-based** — no extra re-render to track the previous value
- **Distinct tracking** — a value that never changes keeps \`undefined\` as its previous
- **Optional comparator** — ignore new-but-equal values (defaults to \`Object.is\`)

## Basic Usage
\`\`\`tsx
const prev = usePrevious(count);
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {
  render: () => <Demo />,
  parameters: {
    docs: {
      description: {
        story: "Increment/decrement and watch the previous value trail the current one by one render.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { usePrevious } from "@usefy/use-previous";

function Counter() {
  const [count, setCount] = useState(0);
  const prev = usePrevious(count);

  return (
    <div>
      <p>Before: {prev ?? "—"} → Now: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("prev")).toHaveTextContent("—");
    await userEvent.click(canvas.getByTestId("inc"));
    await waitFor(() => expect(canvas.getByTestId("prev")).toHaveTextContent("0"));
    await expect(canvas.getByTestId("current")).toHaveTextContent("1");
    await userEvent.click(canvas.getByTestId("inc"));
    await waitFor(() => expect(canvas.getByTestId("prev")).toHaveTextContent("1"));
  },
};
