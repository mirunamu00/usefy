import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useClickAnyWhere } from "@usefy/use-click-any-where";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Demo component for useClickAnyWhere - Click Counter
 */
function ClickCounterDemo({ enabled = true }: { enabled?: boolean }) {
  const [clickCount, setClickCount] = useState(0);

  useClickAnyWhere(
    () => {
      setClickCount((prev) => prev + 1);
    },
    { enabled }
  );

  return (
    <div className={storyTheme.containerCentered + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-center mb-8 text-3xl font-extrabold tracking-tight text-slate-900"}>
        useClickAnyWhere Demo
      </h2>

      <div className={storyTheme.gradientBox + " text-center mb-8 p-10 rounded-3xl shadow-2xl transform transition-all hover:scale-[1.02] duration-300"}>
        <p className="text-white/90 text-sm font-medium uppercase tracking-widest mb-4">Total Clicks</p>
        <p className="text-8xl font-black text-white drop-shadow-sm" data-testid="click-count">
          {clickCount}
        </p>
      </div>

      <div className={storyTheme.statBox + " bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}>
        <p className={storyTheme.statLabel + " flex items-center justify-between"}>
          <span className={storyTheme.statTextSecondary + " text-slate-500 font-medium"}>Listener Status</span>
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${
              enabled 
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                : "bg-rose-100 text-rose-700 border border-rose-200"
            }`}
            data-testid="enabled-status"
          >
            {enabled ? "Listening" : "Disabled"}
          </span>
        </p>
      </div>

      <div className={storyTheme.infoBox + " mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600 text-center flex items-center justify-center gap-2"}>
          <span className="text-xl">👆</span> Click anywhere on the page to increment the counter.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for click position tracking
 */
function ClickPositionDemo() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [clickHistory, setClickHistory] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);

  useClickAnyWhere((event) => {
    const newPosition = { x: event.clientX, y: event.clientY };
    setPosition(newPosition);
    setClickHistory((prev) => [
      { ...newPosition, id: Date.now() },
      ...prev.slice(0, 4),
    ]);
  });

  return (
    <div className={storyTheme.containerCentered + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-center mb-8 text-3xl font-extrabold tracking-tight text-slate-900"}>
        Click Position Tracker
      </h2>

      <div className={storyTheme.gradientBox + " text-center mb-8 p-8 rounded-3xl shadow-xl min-h-[160px] flex flex-col justify-center items-center"}>
        {position ? (
          <>
            <p className="text-white/90 text-sm font-medium uppercase tracking-widest mb-3">Last Click Position</p>
            <p className="text-4xl font-black text-white font-mono tracking-tight" data-testid="position">
              ({position.x}, {position.y})
            </p>
          </>
        ) : (
          <p className="text-white/80 text-lg font-medium animate-pulse" data-testid="no-click-message">
            Click anywhere to see position
          </p>
        )}
      </div>

      {clickHistory.length > 0 && (
        <div className={storyTheme.statBox + " bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}>
          <p className={storyTheme.statLabel + " mb-4 text-slate-400 text-xs font-bold uppercase tracking-wider"}>Recent Clicks History</p>
          <div className="space-y-2">
            {clickHistory.map((click, index) => (
              <div
                key={click.id}
                className={`flex justify-between items-center p-3 rounded-xl transition-all ${
                  index === 0 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm transform scale-[1.02]" 
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="text-xs font-medium opacity-70">#{clickHistory.length - index}</span>
                <span className="font-mono font-semibold text-sm">({click.x}, {click.y})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Demo component for conditional activation
 */
function ConditionalDemo() {
  const [isActive, setIsActive] = useState(true);
  const [clickCount, setClickCount] = useState(0);

  useClickAnyWhere(
    () => {
      setClickCount((prev) => prev + 1);
    },
    { enabled: isActive }
  );

  return (
    <div className={storyTheme.containerCentered + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-center mb-8 text-3xl font-extrabold tracking-tight text-slate-900"}>
        Conditional Activation
      </h2>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsActive((prev) => !prev);
        }}
        data-testid="toggle-button"
        className={`w-full py-5 px-6 text-lg font-bold border-none rounded-2xl cursor-pointer transition-all duration-300 mb-8 flex items-center justify-between group shadow-lg hover:shadow-xl active:scale-[0.98] ${
          isActive
            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30"
            : "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/30"
        }`}
      >
        <span className="flex flex-col items-start">
            <span className="text-xs opacity-80 uppercase tracking-wider font-medium">Current State</span>
            <span>{isActive ? "Active Listener" : "Disabled Listener"}</span>
        </span>
        <span className={`px-3 py-1 rounded-lg text-sm font-semibold bg-white/20 group-hover:bg-white/30 transition-colors`}>
            {isActive ? "Click to Disable" : "Click to Enable"}
        </span>
      </button>

      <div className={storyTheme.statBox + " grid grid-cols-2 gap-4"}>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Clicks Detected</p>
            <span
                className="text-3xl font-black text-slate-800"
                data-testid="conditional-count"
            >
                {clickCount}
            </span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
          <span
            className={`text-lg font-bold ${isActive ? "text-emerald-600" : "text-rose-500"}`}
            data-testid="listener-status"
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-amber-800 text-sm leading-relaxed text-center"}>
          <span className="font-bold block mb-1">💡 How it works</span>
          Toggle the button to enable/disable click detection.
          Clicks are only counted when the listener is active.
        </p>
      </div>
    </div>
  );
}

const meta: Meta<typeof ClickCounterDemo> = {
  title: "Hooks/useClickAnyWhere",
  component: ClickCounterDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A hook for detecting document-wide click events. Useful for closing dropdowns, modals, or tracking user interactions.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    enabled: {
      control: "boolean",
      description: "Whether the click listener is active",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ClickCounterDemo>;

/**
 * Default click counter demo
 */
export const Default: Story = {
  args: {
    enabled: true,
  },
  parameters: {
    docs: {
      source: {
        code: `import { useClickAnyWhere } from "@usefy/use-click-any-where";
import { useState } from "react";

function ClickCounter() {
  const [clickCount, setClickCount] = useState(0);

  useClickAnyWhere(() => {
    setClickCount((prev) => prev + 1);
  });

  return (
    <div>
      <h2>Click Counter</h2>
      <p>Total Clicks: {clickCount}</p>
      <p>Click anywhere on the page to increment!</p>
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
    await expect(canvas.getByTestId("click-count")).toHaveTextContent("0");
    await expect(canvas.getByTestId("enabled-status")).toHaveTextContent(
      "Listening"
    );

    // Click on the canvas (simulates document click)
    await userEvent.click(canvasElement);

    // Count should increase
    await waitFor(() => {
      expect(canvas.getByTestId("click-count")).toHaveTextContent("1");
    });
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    enabled: false,
  },
  parameters: {
    docs: {
      source: {
        code: `import { useClickAnyWhere } from "@usefy/use-click-any-where";
import { useState } from "react";

function ClickCounter() {
  const [clickCount, setClickCount] = useState(0);

  useClickAnyWhere(
    () => {
      setClickCount((prev) => prev + 1);
    },
    { enabled: false } // Disabled - clicks won't be detected
  );

  return (
    <div>
      <h2>Click Counter (Disabled)</h2>
      <p>Total Clicks: {clickCount}</p>
      <p>Click listener is disabled</p>
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

    // Should show disabled status
    await expect(canvas.getByTestId("enabled-status")).toHaveTextContent(
      "Disabled"
    );
    await expect(canvas.getByTestId("click-count")).toHaveTextContent("0");

    // Click should not increment
    await userEvent.click(canvasElement);

    await expect(canvas.getByTestId("click-count")).toHaveTextContent("0");
  },
};

/**
 * Click position tracker
 */
export const ClickPosition: StoryObj<typeof ClickPositionDemo> = {
  render: () => <ClickPositionDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useClickAnyWhere } from "@usefy/use-click-any-where";
import { useState } from "react";

function ClickPositionTracker() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useClickAnyWhere((event) => {
    setPosition({ x: event.clientX, y: event.clientY });
  });

  return (
    <div>
      <h2>Click Position Tracker</h2>
      {position ? (
        <p>Last click: ({position.x}, {position.y})</p>
      ) : (
        <p>Click anywhere to see position</p>
      )}
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

    // Initial state - no position
    await expect(canvas.getByTestId("no-click-message")).toBeInTheDocument();

    // Click to track position
    await userEvent.click(canvasElement);

    // Should show position
    await waitFor(() => {
      expect(canvas.getByTestId("position")).toBeInTheDocument();
    });
  },
};

/**
 * Conditional activation demo
 */
export const ConditionalActivation: StoryObj<typeof ConditionalDemo> = {
  render: () => <ConditionalDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useClickAnyWhere } from "@usefy/use-click-any-where";
import { useState } from "react";

function ConditionalClickCounter() {
  const [isActive, setIsActive] = useState(true);
  const [clickCount, setClickCount] = useState(0);

  useClickAnyWhere(
    () => {
      setClickCount((prev) => prev + 1);
    },
    { enabled: isActive }
  );

  return (
    <div>
      <h2>Conditional Activation</h2>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsActive((prev) => !prev);
        }}
      >
        {isActive ? "Disable" : "Enable"}
      </button>
      <p>Clicks: {clickCount}</p>
      <p>Status: {isActive ? "Active" : "Inactive"}</p>
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

    // Initial state - active
    await expect(canvas.getByTestId("listener-status")).toHaveTextContent(
      "Active"
    );

    // Click to increment
    await userEvent.click(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("conditional-count")).toHaveTextContent("1");
    });

    // Toggle to disable
    await userEvent.click(canvas.getByTestId("toggle-button"));
    await expect(canvas.getByTestId("listener-status")).toHaveTextContent(
      "Inactive"
    );

    // Click should not increment when disabled
    await userEvent.click(canvasElement);
    await expect(canvas.getByTestId("conditional-count")).toHaveTextContent(
      "1"
    );
  },
};
