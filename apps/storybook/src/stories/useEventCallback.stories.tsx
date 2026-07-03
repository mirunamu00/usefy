import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useEventCallback } from "@usefy/use-event-callback";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const [count, setCount] = useState(0);
  const [logged, setLogged] = useState<number | null>(null);

  // Stable identity, but always reads the latest count.
  const logCount = useEventCallback(() => setLogged(count));

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useEventCallback</h2>
      <p className={storyTheme.subtitle}>Stable identity, always sees the latest state</p>
      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          count: <span className={storyTheme.statValue} data-testid="count">{count}</span>
        </p>
        <p className={storyTheme.statLabel}>
          logged: <span className={storyTheme.statValue} data-testid="logged">{logged ?? "—"}</span>
        </p>
      </div>
      <div className={`${storyTheme.buttonGroup} justify-center mt-6`}>
        <button className={storyTheme.buttonPrimary} data-testid="inc" onClick={() => setCount((c) => c + 1)}>
          Increment
        </button>
        <button className={storyTheme.buttonNeutral} data-testid="log" onClick={logCount}>
          Log latest
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useEventCallback",
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
    await userEvent.click(canvas.getByTestId("inc"));
    await userEvent.click(canvas.getByTestId("inc"));
    await userEvent.click(canvas.getByTestId("log"));
    await waitFor(() => expect(canvas.getByTestId("logged")).toHaveTextContent("2"));
  },
};
