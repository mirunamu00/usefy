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
        className="p-8 mb-8 rounded-2xl text-center text-4xl font-bold bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-800 shadow-lg"
      >
        <span data-testid="count">{count}</span>
      </div>

      <div className="mb-6 text-center">
        <span
          data-testid="running-badge"
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isRunning
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
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
        component:
          "A hook for declarative setInterval with automatic cleanup, a latest-callback ref, and start/stop/toggle controls. Perfect for polling, clocks, countdowns, and pause/resume timers. Pass a null delay to disable it.",
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
        className="p-8 mb-8 rounded-2xl text-center text-4xl font-bold bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-800 shadow-lg"
      >
        <span data-testid="count">{count}</span>
      </div>
      <div className="mb-6 text-center">
        <span
          data-testid="running-badge"
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isRunning
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
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
