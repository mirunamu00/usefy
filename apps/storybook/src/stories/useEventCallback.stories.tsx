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
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Returns a stable callback that always invokes the latest version of the function — the community equivalent of React's experimental \`useEffectEvent\`. The identity never changes, so it is safe as an effect dependency, yet it always sees the newest props and state.

## Features
- **Stable identity** — pass to effects / listeners without re-subscribing
- **Always fresh** — reads the latest props and state when called
- **Argument-forwarding** — proxies all arguments to the latest function

## Basic Usage
\`\`\`tsx
const onEvent = useEventCallback(() => doSomethingWith(state));
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
        story: "Increment a few times, then \"Log latest\" — the stable callback logs the current count, not a stale one.",
      },
      source: {
        language: "tsx",
        code: `import { useState, useEffect } from "react";
import { useEventCallback } from "@usefy/use-event-callback";

function Widget() {
  const [count, setCount] = useState(0);

  // stable identity, always sees the latest count
  const onResize = useEventCallback(() => console.log(count));

  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [onResize]); // never re-subscribes

  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("inc"));
    await userEvent.click(canvas.getByTestId("inc"));
    await userEvent.click(canvas.getByTestId("log"));
    await waitFor(() => expect(canvas.getByTestId("logged")).toHaveTextContent("2"));
  },
};
