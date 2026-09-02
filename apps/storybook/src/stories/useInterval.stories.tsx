import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useInterval } from "@usefy/use-interval";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Counter demo for useInterval — auto-increments every `delay` ms and exposes
 * pause/resume controls.
 */
function IntervalDemo({
  delay = 1000,
  title = "useInterval Demo",
}: {
  delay?: number | null;
  title?: string;
}) {
  const [count, setCount] = useState(0);

  const { start, stop, toggle, isRunning } = useInterval(() => {
    setCount((c) => c + 1);
  }, delay);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-2"}>{title}</h2>
      <p className={storyTheme.subtitle}>
        {delay !== null ? `Increments every ${delay}ms` : "Interval disabled"}
      </p>

      <div
        data-testid="count-display"
        className="p-8 mb-8 rounded-md text-center text-4xl font-bold bg-violet-50 text-violet-800 shadow-sm"
      >
        <span data-testid="count">{count}</span>
      </div>

      <div className="mb-6 text-center">
        <span
          data-testid="running-badge"
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isRunning
              ? "bg-emerald-100 text-emerald-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {isRunning ? "Running" : "Stopped"}
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={toggle}
          type="button"
          data-testid="toggle-button"
          className={storyTheme.buttonPrimary + " flex-1"}
        >
          {isRunning ? "Pause" : "Resume"}
        </button>
        <button
          onClick={start}
          type="button"
          data-testid="start-button"
          disabled={isRunning}
          className={`${storyTheme.buttonSecondary} flex-1 disabled:opacity-50`}
        >
          Start
        </button>
        <button
          onClick={stop}
          type="button"
          data-testid="stop-button"
          disabled={!isRunning}
          className={`${storyTheme.buttonSecondary} flex-1 disabled:opacity-50`}
        >
          Stop
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof IntervalDemo> = {
  title: "Hooks/useInterval",
  component: IntervalDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Declarative, SSR-safe \`setInterval\` for React — run a callback every \`delay\` ms with automatic cleanup, a latest-callback ref, and \`start\`/\`stop\`/\`toggle\` controls. Perfect for polling, clocks, countdowns, and pause/resume timers.

Changing the callback never restarts the interval; changing the delay restarts it with the new value; a \`null\`/\`undefined\` delay disables it. Returns \`{ start, stop, toggle, isRunning }\`.

## Features
- **Latest callback ref** — the newest \`callback\` runs each tick without re-subscribing, so inline functions never go stale
- **Nullable delay** — \`null\`/\`undefined\` disables the interval; changing the delay restarts it (a negative delay is treated as \`0\`)
- **start / stop / toggle** — identity-stable controls to pause and resume on demand
- **\`isRunning\`** — \`true\` only when started **and** a valid delay is set
- **\`autoStart\`** (default \`true\`) — start on mount, or set \`false\` to begin stopped and call \`start()\` yourself
- **\`immediate\`** (default \`false\`) — fire the callback once right when the interval (re)starts, then on every tick (StrictMode-safe on auto-start)
- **Automatic cleanup** — the interval is cleared on unmount and re-established correctly across StrictMode double-invokes

## Basic Usage
\`\`\`tsx
import { useState } from "react";
import { useInterval } from "@usefy/use-interval";

function Counter() {
  const [count, setCount] = useState(0);

  const { toggle, isRunning } = useInterval(() => {
    setCount((c) => c + 1);
  }, 1000);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={toggle}>{isRunning ? "Pause" : "Resume"}</button>
    </div>
  );
}
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    delay: {
      control: { type: "number", min: 0, step: 100 },
      description: "Interval in milliseconds (null to disable)",
      table: {
        type: { summary: "number | null" },
        defaultValue: { summary: "1000" },
      },
    },
    title: {
      control: "text",
      description: "Title displayed in the demo",
      table: { type: { summary: "string" } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof IntervalDemo>;

/**
 * Default — a counter incrementing once per second with pause/resume.
 */
export const Default: Story = {
  args: { delay: 1000, title: "Basic Interval" },
  parameters: {
    docs: {
      description: {
        story:
          "A counter that auto-increments once per second, with pause/resume via toggle and explicit start/stop.",
      },
      source: {
        code: `import { useState } from "react";
import { useInterval } from "@usefy/use-interval";

function Counter() {
  const [count, setCount] = useState(0);

  const { toggle, isRunning } = useInterval(() => {
    setCount((c) => c + 1);
  }, 1000);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={toggle}>{isRunning ? "Pause" : "Resume"}</button>
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

    await expect(canvas.getByTestId("count")).toHaveTextContent("0");
    await expect(canvas.getByTestId("running-badge")).toHaveTextContent(
      "Running"
    );

    // Pause and confirm the count stops advancing.
    await userEvent.click(canvas.getByTestId("toggle-button"));
    await expect(canvas.getByTestId("running-badge")).toHaveTextContent(
      "Stopped"
    );
    const paused = canvas.getByTestId("count").textContent;
    await new Promise((r) => setTimeout(r, 1200));
    await expect(canvas.getByTestId("count")).toHaveTextContent(paused ?? "0");

    // Resume and confirm it advances again.
    await userEvent.click(canvas.getByTestId("toggle-button"));
    await waitFor(
      () =>
        expect(canvas.getByTestId("count").textContent).not.toBe(paused ?? "0"),
      { timeout: 2500 }
    );
  },
};

/**
 * Manual control with `autoStart: false` — starts stopped.
 */
export const ManualControl: Story = {
  args: { delay: 1000, title: "Manual Control (autoStart: false)" },
  render: (args) => <ManualControlDemo {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "With autoStart: false the interval begins stopped — nothing ticks until you call start().",
      },
      source: {
        code: `import { useState } from "react";
import { useInterval } from "@usefy/use-interval";

function AutoRefresh() {
  const [count, setCount] = useState(0);

  const { start, stop, isRunning } = useInterval(
    () => setCount((c) => c + 1),
    3000,
    { autoStart: false }
  );

  return (
    <div>
      <p>Refreshed {count} times</p>
      <button onClick={start} disabled={isRunning}>Start</button>
      <button onClick={stop} disabled={!isRunning}>Stop</button>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};

function ManualControlDemo({
  delay = 1000,
  title = "Manual Control",
}: {
  delay?: number | null;
  title?: string;
}) {
  const [count, setCount] = useState(0);
  const { start, stop, isRunning } = useInterval(
    () => setCount((c) => c + 1),
    delay,
    { autoStart: false }
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-2"}>{title}</h2>
      <p className={storyTheme.subtitle}>Starts stopped — click Start</p>
      <div
        data-testid="count-display"
        className="p-8 mb-8 rounded-md text-center text-4xl font-bold bg-violet-50 text-violet-800 shadow-sm"
      >
        <span data-testid="count">{count}</span>
      </div>
      <div className="mb-6 text-center">
        <span
          data-testid="running-badge"
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isRunning
              ? "bg-emerald-100 text-emerald-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {isRunning ? "Running" : "Stopped"}
        </span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={start}
          type="button"
          data-testid="start-button"
          disabled={isRunning}
          className={`${storyTheme.buttonPrimary} flex-1 disabled:opacity-50`}
        >
          Start
        </button>
        <button
          onClick={stop}
          type="button"
          data-testid="stop-button"
          disabled={!isRunning}
          className={`${storyTheme.buttonSecondary} flex-1 disabled:opacity-50`}
        >
          Stop
        </button>
      </div>
    </div>
  );
}
