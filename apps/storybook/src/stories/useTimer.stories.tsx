import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTimer, ms } from "@usefy/use-timer";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Demo component for useTimer
 */
function TimerDemo({
  initialTimeMs = 60000,
  title = "Timer Demo",
  autoStart = false,
  loop = false,
  format = "MM:SS" as const,
}: {
  initialTimeMs?: number;
  title?: string;
  autoStart?: boolean;
  loop?: boolean;
  format?: "HH:MM:SS" | "MM:SS" | "SS" | "mm:ss.SSS";
}) {
  const timer = useTimer(initialTimeMs, {
    autoStart,
    loop,
    format,
    interval: 1,
  });

  // Calculate gradient based on progress
  const progressColor =
    timer.progress < 50
      ? "from-emerald-500 to-teal-500"
      : timer.progress < 80
      ? "from-amber-500 to-orange-500"
      : "from-red-500 to-rose-500";

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-2"}>{title}</h2>
      <p className={storyTheme.subtitle}>
        {loop ? "🔄 Loop enabled" : "Countdown Timer"}
      </p>

      {/* Timer Display */}
      <div
        data-testid="timer-display"
        className={`p-8 mb-6 rounded-2xl text-center transition-all duration-300 ${
          timer.isFinished
            ? "bg-gradient-to-br from-gray-100 to-gray-200"
            : "bg-gradient-to-br from-slate-900 to-slate-800"
        }`}
      >
        <div
          data-testid="formatted-time"
          className={`text-5xl font-mono font-bold tracking-wider ${
            timer.isFinished ? "text-gray-500" : "text-white"
          }`}
        >
          {timer.time}
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex justify-center gap-2">
          <span
            data-testid="status-badge"
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
              timer.isRunning
                ? "bg-green-500/20 text-green-400"
                : timer.isPaused
                ? "bg-yellow-500/20 text-yellow-400"
                : timer.isFinished
                ? "bg-gray-500/20 text-gray-500"
                : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {timer.status}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Progress</span>
          <span data-testid="progress-value">
            {Math.round(timer.progress)}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            data-testid="progress-bar"
            className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-100 rounded-full`}
            style={{ width: `${timer.progress}%` }}
          />
        </div>
      </div>


      {/* Control Buttons */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          {!timer.isRunning ? (
            <button
              onClick={timer.start}
              disabled={timer.isFinished}
              aria-label="Start timer"
              type="button"
              className={`flex-1 py-3.5 px-6 text-base font-semibold text-white bg-gradient-to-br from-green-500 to-emerald-600 border-none rounded-xl cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              ▶ Start
            </button>
          ) : (
            <button
              onClick={timer.pause}
              aria-label="Pause timer"
              type="button"
              className={`flex-1 py-3.5 px-6 text-base font-semibold text-white bg-gradient-to-br from-amber-500 to-orange-600 border-none rounded-xl cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(245,158,11,0.4)]`}
            >
              ⏸ Pause
            </button>
          )}
          <button
            onClick={timer.reset}
            aria-label="Reset timer"
            type="button"
            className={storyTheme.buttonNeutral}
          >
            ↺ Reset
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => timer.addTime(ms.seconds(10))}
            aria-label="Add 10 seconds"
            type="button"
            className={storyTheme.buttonPrimary + " flex-1"}
          >
            +10s
          </button>
          <button
            onClick={() => timer.subtractTime(ms.seconds(10))}
            aria-label="Subtract 10 seconds"
            type="button"
            className={storyTheme.buttonSecondary + " flex-1"}
          >
            -10s
          </button>
        </div>

        <button
          onClick={timer.restart}
          aria-label="Restart timer"
          type="button"
          className={storyTheme.buttonFull}
        >
          🔄 Restart
        </button>
      </div>
    </div>
  );
}

/**
 * Kitchen Timer Demo
 */
function KitchenTimerDemo() {
  const [presetMinutes, setPresetMinutes] = React.useState(5);
  const timer = useTimer(ms.minutes(presetMinutes), {
    format: "MM:SS",
    interval: 100,
    onComplete: () => {
      // Would play a sound in real app
    },
  });

  const presets = [1, 3, 5, 10, 15, 30];

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-2"}>
        ⏲️ Kitchen Timer
      </h2>
      <p className={storyTheme.subtitle}>Set your cooking timer</p>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {presets.map((min) => (
          <button
            key={min}
            onClick={() => {
              setPresetMinutes(min);
              timer.setTime(ms.minutes(min));
            }}
            type="button"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              presetMinutes === min
                ? "bg-indigo-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {min}m
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div
        className={`p-12 mb-6 rounded-full aspect-square max-w-[280px] mx-auto flex items-center justify-center ${
          timer.isFinished
            ? "bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse"
            : "bg-gradient-to-br from-slate-800 to-slate-900"
        }`}
      >
        <div
          className={`text-5xl font-mono font-bold ${
            timer.isFinished ? "text-white" : "text-white"
          }`}
        >
          {timer.isFinished ? "Done!" : timer.time}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={timer.toggle}
          disabled={timer.isFinished}
          type="button"
          className={`${storyTheme.buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {timer.isRunning ? "⏸ Pause" : "▶ Start"}
        </button>
        <button
          onClick={timer.reset}
          type="button"
          className={storyTheme.buttonNeutral}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof TimerDemo> = {
  title: "Hooks/useTimer",
  component: TimerDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A powerful countdown timer hook with comprehensive controls, multiple formats, and time manipulation features. Perfect for countdowns, pomodoro timers, cooking timers, and more.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    initialTimeMs: {
      control: { type: "number", min: 0, step: 1000 },
      description: "Initial time in milliseconds",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "60000" },
      },
    },
    title: {
      control: "text",
      description: "Title displayed in the demo",
      table: {
        type: { summary: "string" },
      },
    },
    autoStart: {
      control: "boolean",
      description: "Whether to start automatically",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    loop: {
      control: "boolean",
      description: "Whether to loop when completed",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    format: {
      control: "select",
      options: ["HH:MM:SS", "MM:SS", "SS", "mm:ss.SSS"],
      description: "Time format",
      table: {
        type: { summary: "TimeFormat" },
        defaultValue: { summary: "MM:SS" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimerDemo>;

/**
 * Default 1-minute timer
 */
export const Default: Story = {
  args: {
    initialTimeMs: 60000,
    title: "1 Minute Timer",
    autoStart: false,
    loop: false,
    format: "MM:SS",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state should show 01:00
    await expect(canvas.getByTestId("formatted-time")).toHaveTextContent(
      "01:00"
    );
    await expect(canvas.getByTestId("status-badge")).toHaveTextContent("idle");
    await expect(canvas.getByTestId("progress-value")).toHaveTextContent("0%");

    // Click Start button (exact match to avoid matching "Restart timer")
    await userEvent.click(
      canvas.getByRole("button", { name: /^start timer$/i })
    );
    await expect(canvas.getByTestId("status-badge")).toHaveTextContent(
      "running"
    );

    // Click Pause button
    await userEvent.click(
      canvas.getByRole("button", { name: /^pause timer$/i })
    );
    await expect(canvas.getByTestId("status-badge")).toHaveTextContent(
      "paused"
    );

    // Click Reset button
    await userEvent.click(
      canvas.getByRole("button", { name: /^reset timer$/i })
    );
    await expect(canvas.getByTestId("formatted-time")).toHaveTextContent(
      "01:00"
    );
    await expect(canvas.getByTestId("status-badge")).toHaveTextContent("idle");
  },
};

/**
 * 5-minute timer with different format
 */
export const FiveMinuteTimer: Story = {
  args: {
    initialTimeMs: 300000,
    title: "5 Minute Timer",
    autoStart: false,
    loop: false,
    format: "MM:SS",
  },
};

/**
 * Timer with HH:MM:SS format
 */
export const LongTimer: Story = {
  args: {
    initialTimeMs: 3661000, // 1h 1m 1s
    title: "Long Timer",
    format: "HH:MM:SS",
  },
};

/**
 * Precision timer with milliseconds
 */
export const PrecisionTimer: Story = {
  args: {
    initialTimeMs: 10000,
    title: "Precision Timer",
    format: "mm:ss.SSS",
  },
};

/**
 * Auto-starting timer
 */
export const AutoStart: Story = {
  args: {
    initialTimeMs: 30000,
    title: "Auto-Start Timer",
    autoStart: true,
    format: "MM:SS",
  },
};

/**
 * Looping timer
 */
export const LoopingTimer: Story = {
  args: {
    initialTimeMs: 5000,
    title: "Looping Timer",
    loop: true,
    format: "SS",
  },
};

/**
 * Time manipulation demo
 */
export const TimeManipulation: Story = {
  args: {
    initialTimeMs: 60000,
    title: "Time Manipulation",
    format: "MM:SS",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state
    await expect(canvas.getByTestId("formatted-time")).toHaveTextContent(
      "01:00"
    );

    // Add 10 seconds
    await userEvent.click(
      canvas.getByRole("button", { name: /add 10 seconds/i })
    );
    await waitFor(() => {
      expect(canvas.getByTestId("formatted-time")).toHaveTextContent("01:10");
    });

    // Subtract 10 seconds
    await userEvent.click(
      canvas.getByRole("button", { name: /subtract 10 seconds/i })
    );
    await waitFor(() => {
      expect(canvas.getByTestId("formatted-time")).toHaveTextContent("01:00");
    });
  },
};

/**
 * Kitchen Timer - practical example
 */
export const KitchenTimer: StoryObj<typeof KitchenTimerDemo> = {
  render: () => <KitchenTimerDemo />,
  parameters: {
    docs: {
      description: {
        story: "A kitchen timer with preset buttons for common cooking times.",
      },
    },
  },
};
