import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useUpdateEffect } from "@usefy/use-update-effect";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const [count, setCount] = useState(0);
  const [runs, setRuns] = useState(0);

  useUpdateEffect(() => {
    setRuns((r) => r + 1);
  }, [count]);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useUpdateEffect</h2>
      <p className={storyTheme.subtitle}>Effect runs on updates, but not on mount</p>
      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          count: <span className={storyTheme.statValue} data-testid="count">{count}</span>
        </p>
        <p className={storyTheme.statLabel}>
          effect runs: <span className={storyTheme.statValue} data-testid="runs">{runs}</span>
        </p>
      </div>
      <button className={`${storyTheme.buttonPrimary} mt-6`} data-testid="inc" onClick={() => setCount((c) => c + 1)}>
        Increment
      </button>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useUpdateEffect",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `A drop-in \`useEffect\` that skips the initial render and only fires on subsequent dependency changes. Handy for reacting to changes without a spurious call on mount — syncing to storage, firing \`onChange\`, tracking analytics.

## Features
- **Skips mount** — no effect on the first render
- **Same signature** — \`(effect, deps)\` just like \`useEffect\`
- **Cleanup supported** — return a cleanup like any effect

## Basic Usage
\`\`\`tsx
useUpdateEffect(() => {
  save(value);
}, [value]);
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
        story: "The run counter stays at 0 on mount and only increments once you change the value.",
      },
      source: {
        language: "tsx",
        code: `import { useUpdateEffect } from "@usefy/use-update-effect";

function Search({ query }: { query: string }) {
  useUpdateEffect(() => {
    // runs when \`query\` changes, but NOT on the initial mount
    fetchResults(query);
  }, [query]);

  return null;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("runs")).toHaveTextContent("0");
    await userEvent.click(canvas.getByTestId("inc"));
    await waitFor(() => expect(canvas.getByTestId("runs")).toHaveTextContent("1"));
  },
};
