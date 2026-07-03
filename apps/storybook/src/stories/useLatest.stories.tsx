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
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Returns a ref whose \`.current\` always holds the latest value. Read fresh props/state inside stable callbacks, intervals, or event listeners without stale closures and without adding the value to a dependency array.

## Features
- **Stable ref identity** — safe as an effect dependency; only \`.current\` changes
- **No stale closures** — long-lived callbacks always see the newest value
- **Synchronous** — \`.current\` updates on every render

## Basic Usage
\`\`\`tsx
const latest = useLatest(value);
// read latest.current later, always fresh
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
        story: "The interval is set up once yet always logs the newest count via the latest ref.",
      },
      source: {
        language: "tsx",
        code: `import { useEffect } from "react";
import { useLatest } from "@usefy/use-latest";

function Poller({ value }: { value: number }) {
  const latest = useLatest(value);

  useEffect(() => {
    const id = setInterval(() => {
      // always reads the newest value, without re-subscribing
      console.log(latest.current);
    }, 1000);
    return () => clearInterval(id);
  }, [latest]);

  return null;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByTestId("seen")).toHaveTextContent("0"));
  },
};
