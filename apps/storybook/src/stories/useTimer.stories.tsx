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
  });

  // Calculate gradient based on progress
  const progressColor =
    timer.progress < 50
      ? "bg-emerald-600"
      : timer.progress < 80
      ? "bg-amber-600"
      : "bg-red-600";

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-2"}>{title}</h2>
      <p className={storyTheme.subtitle}>
        {loop ? "Loop enabled" : "Countdown Timer"}
      </p>

      {/* Timer Display */}
      <div
        data-testid="timer-display"
        className={`p-10 mb-8 rounded-lg text-center transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
          timer.isFinished
            ? "bg-zinc-100 border border-zinc-200"
            : "bg-zinc-900 border border-zinc-800"
        }`}
      >
        <div
          data-testid="formatted-time"
          className={`text-5xl font-mono font-bold ${
            timer.isFinished ? "text-zinc-500" : "text-white"
          }`}
        >
          {timer.time}
        </div>

        {/* Status Badge */}
        <div className="mt-6 flex justify-center gap-2">
          <span
            data-testid="status-badge"
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              timer.isRunning
                ? "bg-emerald-500/20 text-emerald-400"
                : timer.isPaused
                ? "bg-amber-500/20 text-amber-400"
                : timer.isFinished
                ? "bg-zinc-500/20 text-zinc-500"
                : "bg-violet-600/20 text-violet-400"
            }`}
          >
            {timer.status}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={storyTheme.statBox + " mb-8 bg-white rounded-md p-6 shadow-sm border border-zinc-200"}>
        <div className="flex justify-between text-sm text-zinc-600 mb-3 font-medium">
          <span className=" text-xs">Progress</span>
          <span data-testid="progress-value" className="font-bold text-zinc-800">
            {Math.round(timer.progress)}%
          </span>
        </div>
        <div className="h-4 bg-zinc-100 rounded-full overflow-hidden border border-zinc-100">
          <div
            data-testid="progress-bar"
            className={`h-full ${progressColor} transition-all duration-100 rounded-full`}
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
              className={`flex-1 py-4 px-6 text-base font-bold text-white bg-emerald-500 border-none rounded-md cursor-pointer transition-all duration-200 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] disabled:opacity-50 disabled:cursor-not-allowed disabled:`}
            >
              Start
            </button>
          ) : (
            <button
              onClick={timer.pause}
              aria-label="Pause timer"
              type="button"
              className={`flex-1 py-4 px-6 text-base font-bold text-white bg-amber-500 border-none rounded-md cursor-pointer transition-all duration-200 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]`}
            >
              Pause
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
          Restart
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
        Kitchen Timer
      </h2>
      <p className={storyTheme.subtitle}>Set your cooking timer</p>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-8 bg-white p-4 rounded-md shadow-sm border border-zinc-200">
        {presets.map((min) => (
          <button
            key={min}
            onClick={() => {
              setPresetMinutes(min);
              timer.setTime(ms.minutes(min));
            }}
            type="button"
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              presetMinutes === min
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {min}m
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div
        className={`p-12 mb-8 rounded-full aspect-square max-w-[280px] mx-auto flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-2 ${
          timer.isFinished
            ? "bg-emerald-400 border-emerald-300"
            : "bg-zinc-800 border-zinc-700"
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
          {timer.isRunning ? "Pause" : "Start"}
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
        component: `A countdown timer hook that counts **down** from \`initialTimeMs\` to zero, with a formatted \`time\` string, a \`progress\` percentage, a four-state \`status\` machine (\`idle → running → paused → finished\`), full playback controls, and live time manipulation. Perfect for countdowns, pomodoro/cooking timers, and quiz clocks.

Only the *formatted* value triggers re-renders, so coarse formats (\`MM:SS\`) re-render at most once per second even with a small \`interval\`. Ships with an \`ms\` helper for building durations. Returns \`{ time, progress, status, isRunning, isPaused, isFinished, isIdle, start, pause, stop, reset, restart, toggle, addTime, subtractTime, setTime }\`.

## Features
- **Formatted output** — \`time\` renders via a preset (\`HH:MM:SS\`, \`MM:SS\`, \`SS\`, \`mm:ss.SSS\`, …) or a custom \`(ms) => string\` formatter
- **\`progress\`** — 0 → 100 completion percentage, handy for progress bars
- **Status machine** — \`status\` plus \`isRunning\` / \`isPaused\` / \`isFinished\` / \`isIdle\` derived booleans
- **Controls** — \`start\`, \`pause\`, \`stop\`, \`reset\` (back to initial), \`restart\` (reset + start), and \`toggle\`
- **Time manipulation** — \`addTime\`, \`subtractTime\`, and \`setTime\` adjust the remaining time on the fly (clamped at \`0\`)
- **\`autoStart\`** and **\`loop\`** — begin on mount and/or auto-restart on completion
- **Lifecycle callbacks** — \`onComplete\`, \`onTick\`, \`onStart\`, \`onPause\`, \`onReset\`, \`onStop\`
- **Accurate & efficient** — \`interval\` / \`useRAF\` control tick granularity, drift is corrected when the tab is backgrounded, and timers are cleared on unmount
- **\`ms\` helper** — \`ms.seconds\`, \`ms.minutes\`, \`ms.hours\` build millisecond durations

## Basic Usage
\`\`\`tsx
import { useTimer, ms } from "@usefy/use-timer";

function Countdown() {
  const timer = useTimer(ms.minutes(1), {
    format: "MM:SS",
    onComplete: () => alert("Time's up!"),
  });

  return (
    <div>
      <p>{timer.time}</p>
      <button onClick={timer.toggle}>
        {timer.isRunning ? "Pause" : "Start"}
      </button>
      <button onClick={timer.reset}>Reset</button>
    </div>
  );
}
\`\`\``,
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
  parameters: {
    docs: {
      description: {
        story:
          "A one-minute MM:SS countdown showing time, status, and progress with start/pause/reset/restart controls.",
      },
      source: {
        code: `import { useTimer } from "@usefy/use-timer";

function TimerExample() {
  const timer = useTimer(60000, {
    format: "MM:SS",
  });

  return (
    <div>
      <h2>1 Minute Timer</h2>
      <div>
        <div>{timer.time}</div>
        <div>Status: {timer.status}</div>
        <div>Progress: {Math.round(timer.progress)}%</div>
      </div>
      <div>
        {!timer.isRunning ? (
          <button onClick={timer.start} disabled={timer.isFinished}>
            Start
          </button>
        ) : (
          <button onClick={timer.pause}>Pause</button>
        )}
        <button onClick={timer.reset}>↺ Reset</button>
        <button onClick={timer.restart}>Restart</button>
      </div>
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
  parameters: {
    docs: {
      description: {
        story:
          "The same timer seeded with a longer five-minute (300000ms) duration.",
      },
      source: {
        code: `import { useTimer } from "@usefy/use-timer";

function FiveMinuteTimerExample() {
  const timer = useTimer(300000, { // 5 minutes = 300000ms
    format: "MM:SS",
  });

  return (
    <div>
      <h2>5 Minute Timer</h2>
      <div>{timer.time}</div>
      <div>Status: {timer.status}</div>
      <div>
        <button onClick={timer.start} disabled={timer.isFinished}>Start</button>
        <button onClick={timer.pause}>Pause</button>
        <button onClick={timer.reset}>Reset</button>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story:
          "Uses the HH:MM:SS format for durations over an hour (here 1h 1m 1s).",
      },
      source: {
        code: `import { useTimer } from "@usefy/use-timer";

function LongTimerExample() {
  const timer = useTimer(3661000, { // 1 hour 1 minute 1 second
    format: "HH:MM:SS",
  });

  return (
    <div>
      <h2>Long Timer</h2>
      <div>{timer.time}</div>
      <div>Status: {timer.status}</div>
      <div>
        <button onClick={timer.start} disabled={timer.isFinished}>Start</button>
        <button onClick={timer.pause}>Pause</button>
        <button onClick={timer.reset}>Reset</button>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story:
          "The mm:ss.SSS format surfaces millisecond precision for a fast-updating display.",
      },
      source: {
        code: `import { useTimer } from "@usefy/use-timer";

function PrecisionTimerExample() {
  const timer = useTimer(10000, { // 10 seconds
    format: "mm:ss.SSS", // Shows milliseconds
  });

  return (
    <div>
      <h2>Precision Timer</h2>
      <div>{timer.time}</div>
      <div>Status: {timer.status}</div>
      <div>
        <button onClick={timer.start} disabled={timer.isFinished}>Start</button>
        <button onClick={timer.pause}>Pause</button>
        <button onClick={timer.reset}>Reset</button>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story:
          "With autoStart: true the timer begins counting down the moment the component mounts.",
      },
      source: {
        code: `import { useTimer } from "@usefy/use-timer";

function AutoStartTimerExample() {
  const timer = useTimer(30000, { // 30 seconds
    autoStart: true, // Automatically starts when component mounts
    format: "MM:SS",
  });

  return (
    <div>
      <h2>Auto-Start Timer</h2>
      <div>{timer.time}</div>
      <div>Status: {timer.status}</div>
      <div>
        <button onClick={timer.pause}>Pause</button>
        <button onClick={timer.reset}>Reset</button>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story:
          "With loop: true the timer automatically restarts from the top each time it reaches zero.",
      },
      source: {
        code: `import { useTimer } from "@usefy/use-timer";

function LoopingTimerExample() {
  const timer = useTimer(5000, { // 5 seconds
    loop: true, // Automatically restarts when finished
    format: "SS", // Shows only seconds
  });

  return (
    <div>
      <h2>Looping Timer</h2>
      <div>{timer.time}</div>
      <div>Status: {timer.status}</div>
      <div>
        <button onClick={timer.start} disabled={timer.isFinished}>Start</button>
        <button onClick={timer.pause}>Pause</button>
        <button onClick={timer.reset}>Reset</button>
      </div>
      <p>This timer automatically restarts when it reaches 0!</p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
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
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates addTime and subtractTime adjusting the remaining time on the fly with the ms helper.",
      },
      source: {
        code: `import { useTimer, ms } from "@usefy/use-timer";

function TimeManipulationExample() {
  const timer = useTimer(60000, { // 1 minute
    format: "MM:SS",
  });

  return (
    <div>
      <h2>Time Manipulation</h2>
      <div>{timer.time}</div>
      <div>Status: {timer.status}</div>
      <div>
        <button onClick={timer.start} disabled={timer.isFinished}>Start</button>
        <button onClick={timer.pause}>Pause</button>
        <button onClick={timer.reset}>Reset</button>
      </div>
      <div>
        <button onClick={() => timer.addTime(ms.seconds(10))}>
          +10s
        </button>
        <button onClick={() => timer.subtractTime(ms.seconds(10))}>
          -10s
        </button>
      </div>
      <p>Use addTime() and subtractTime() to adjust the timer dynamically!</p>
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
      source: {
        code: `import { useTimer, ms } from "@usefy/use-timer";
import { useState } from "react";

function KitchenTimerExample() {
  const [presetMinutes, setPresetMinutes] = useState(5);
  const timer = useTimer(ms.minutes(presetMinutes), {
    format: "MM:SS",
    interval: 100,
    onComplete: () => {
      // Would play a sound in real app
      console.log("Timer finished!");
    },
  });

  const presets = [1, 3, 5, 10, 15, 30];

  return (
    <div>
      <h2>Kitchen Timer</h2>
      <p>Set your cooking timer</p>
      <div>
        {presets.map((min) => (
          <button
            key={min}
            onClick={() => {
              setPresetMinutes(min);
              timer.setTime(ms.minutes(min));
            }}
            style={{
              background: presetMinutes === min ? "#7c3aed" : "#f3f4f6",
              color: presetMinutes === min ? "white" : "#4b5563",
            }}
          >
            {min}m
          </button>
        ))}
      </div>
      <div>
        {timer.isFinished ? "Done!" : timer.time}
      </div>
      <div>
        <button onClick={timer.toggle} disabled={timer.isFinished}>
          {timer.isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={timer.reset}>↺ Reset</button>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};
