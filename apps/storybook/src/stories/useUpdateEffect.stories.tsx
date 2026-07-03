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
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Did not run on mount.
    await expect(canvas.getByTestId("runs")).toHaveTextContent("0");
    await userEvent.click(canvas.getByTestId("inc"));
    await waitFor(() => expect(canvas.getByTestId("runs")).toHaveTextContent("1"));
  },
};
