import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useLatest } from "@usefy/use-latest";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const [count, setCount] = useState(0);
  const latest = useLatest(count);
  const [seen, setSeen] = useState<number | null>(null);

  // A stable interval that reads the latest count without re-subscribing.
  useEffect(() => {
    const id = setInterval(() => setSeen(latest.current), 300);
    return () => clearInterval(id);
  }, [latest]);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useLatest</h2>
      <p className={storyTheme.subtitle}>A stable interval reads the latest value with no stale closure</p>
      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          count: <span className={storyTheme.statValue} data-testid="count">{count}</span>
        </p>
        <p className={storyTheme.statLabel}>
          interval sees: <span className={storyTheme.statValue} data-testid="seen">{seen ?? "—"}</span>
        </p>
      </div>
      <button className={`${storyTheme.buttonPrimary} mt-6`} data-testid="inc" onClick={() => setCount((c) => c + 1)}>
        Increment
      </button>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useLatest",
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
    await waitFor(() => expect(canvas.getByTestId("seen")).toHaveTextContent("0"));
  },
};
