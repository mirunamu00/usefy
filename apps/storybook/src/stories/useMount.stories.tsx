import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useMount } from "@usefy/use-mount";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const [log, setLog] = useState<string[]>([]);
  useMount(() => {
    setLog((l) => [...l, "mounted"]);
  });
  const [, force] = useState(0);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useMount</h2>
      <p className={storyTheme.subtitle}>Runs a callback exactly once on mount</p>
      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          mount calls: <span className={storyTheme.statValue} data-testid="calls">{log.length}</span>
        </p>
      </div>
      <button className={`${storyTheme.buttonNeutral} mt-6`} data-testid="rerender" onClick={() => force((n) => n + 1)}>
        Re-render (should not re-run)
      </button>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useMount",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Runs a callback exactly once when the component mounts — a readable alias for \`useEffect(fn, [])\` that makes mount-only intent explicit. The callback may return a cleanup function that runs on unmount.

## Features
- **Mount-only** — clear intent, runs once
- **Optional cleanup** — return a function to run on unmount
- **StrictMode aware** — in dev, effects run twice by design (expected)

## Basic Usage
\`\`\`tsx
useMount(() => {
  init();
});
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
        story: "The mount counter reaches 1 and re-rendering does not run the callback again.",
      },
      source: {
        language: "tsx",
        code: `import { useMount } from "@usefy/use-mount";

function Page() {
  useMount(() => {
    analytics.page();
    return () => cleanup(); // optional unmount cleanup
  });

  return <main>…</main>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByTestId("calls")).toHaveTextContent("1"));
  },
};
