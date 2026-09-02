import React, { useState, useRef, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useResizeObserver } from "@usefy/use-resize-observer";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Basic usage demo - shows width and height tracking
 */
function BasicUsageDemo() {
  const { ref, width, height, isSupported, isObserving } = useResizeObserver();

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title + " text-center mb-4"}>
        useResizeObserver
      </h2>
      <p className={storyTheme.subtitle + " text-center"}>
        Resize the box below by dragging its corner
      </p>

      <div
        ref={ref}
        data-testid="resize-target"
        className="relative bg-violet-100 rounded-md border border-violet-300 p-6 min-h-[150px] overflow-auto resize"
        style={{ resize: "both" }}
      >
        <div className="text-center">
          <p className="text-3xl font-bold text-violet-600 mb-2">
            <span data-testid="width">{width ?? "-"}</span> x{" "}
            <span data-testid="height">{height ?? "-"}</span>
          </p>
          <p className="text-zinc-500 text-sm">pixels</p>
        </div>
      </div>

      <div className={storyTheme.statBox + " mt-4"}>
        <p className="text-sm">
          <span className="font-semibold">Supported:</span>{" "}
          <span data-testid="supported" className="text-violet-600">
            {isSupported ? "Yes" : "No"}
          </span>
        </p>
        <p className="text-sm mt-1">
          <span className="font-semibold">Observing:</span>{" "}
          <span data-testid="observing" className="text-violet-600">
            {isObserving ? "Yes" : "No"}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Box options demo - compare content-box vs border-box
 */
function BoxOptionsDemo() {
  const [boxOption, setBoxOption] = useState<
    "content-box" | "border-box" | "device-pixel-content-box"
  >("content-box");

  const { ref, width, height, borderBoxSize, contentBoxSize } =
    useResizeObserver({
      box: boxOption,
    });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title + " text-center mb-4"}>Box Options</h2>
      <p className={storyTheme.subtitle + " text-center"}>
        Compare different box sizing modes
      </p>

      <div className="flex gap-2 justify-center mb-4">
        {(
          ["content-box", "border-box", "device-pixel-content-box"] as const
        ).map((option) => (
          <button
            key={option}
            onClick={() => setBoxOption(option)}
            data-testid={`box-option-${option}`}
            className={
              boxOption === option
                ? storyTheme.buttonPrimary
                : storyTheme.buttonNeutral
            }
          >
            {option}
          </button>
        ))}
      </div>

      <div
        ref={ref}
        data-testid="box-target"
        className="bg-pink-100 rounded-md border-2 border-pink-300 p-8 resize overflow-auto"
        style={{ resize: "both", minHeight: "150px" }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-pink-600">
            <span data-testid="box-width">{width ?? "-"}</span> x{" "}
            <span data-testid="box-height">{height ?? "-"}</span>
          </p>
          <p className="text-zinc-500 text-sm">({boxOption})</p>
        </div>
      </div>

      <div className={storyTheme.statBox + " mt-4 grid grid-cols-2 gap-4"}>
        <div>
          <p className="font-semibold text-sm text-zinc-600">Content Box</p>
          <p className="text-violet-600" data-testid="content-size">
            {contentBoxSize
              ? `${Math.round(contentBoxSize.inlineSize)} x ${Math.round(contentBoxSize.blockSize)}`
              : "-"}
          </p>
        </div>
        <div>
          <p className="font-semibold text-sm text-zinc-600">Border Box</p>
          <p className="text-pink-600" data-testid="border-size">
            {borderBoxSize
              ? `${Math.round(borderBoxSize.inlineSize)} x ${Math.round(borderBoxSize.blockSize)}`
              : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Debounce demo - shows debounced resize updates
 */
function DebounceDemo() {
  const [debounceMs, setDebounceMs] = useState(200);
  const [resizeCount, setResizeCount] = useState(0);
  const [callbackCount, setCallbackCount] = useState(0);

  // Stabilize callback with useCallback to prevent infinite re-renders
  const handleResize = useCallback(() => {
    setCallbackCount((c) => c + 1);
  }, []);

  const { ref, width, height } = useResizeObserver({
    debounce: debounceMs,
    onResize: handleResize,
  });

  // Track raw resize events (without debounce)
  const rawRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!rawRef.current) return;
    const observer = new ResizeObserver(() => {
      setResizeCount((c) => c + 1);
    });
    observer.observe(rawRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title + " text-center mb-4"}>Debounce</h2>
      <p className={storyTheme.subtitle + " text-center"}>
        Debounce limits how often resize callbacks fire
      </p>

      <div className="mb-4">
        <label className={storyTheme.label}>
          Debounce: {debounceMs}ms
        </label>
        <input
          type="range"
          min="0"
          max="500"
          step="50"
          value={debounceMs}
          onChange={(e) => setDebounceMs(Number(e.target.value))}
          data-testid="debounce-slider"
          className="w-full"
        />
      </div>

      <div
        ref={(el) => {
          if (el) {
            ref(el);
            (rawRef as React.MutableRefObject<HTMLDivElement | null>).current =
              el;
          }
        }}
        data-testid="debounce-target"
        className="bg-amber-100 rounded-md border border-amber-300 p-6 resize overflow-auto"
        style={{ resize: "both", minHeight: "150px" }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">
            {width ?? "-"} x {height ?? "-"}
          </p>
        </div>
      </div>

      <div className={storyTheme.statBox + " mt-4 grid grid-cols-2 gap-4"}>
        <div>
          <p className="font-semibold text-sm text-zinc-600">Raw Events</p>
          <p className="text-red-600 text-xl" data-testid="raw-count">
            {resizeCount}
          </p>
        </div>
        <div>
          <p className="font-semibold text-sm text-zinc-600">
            Debounced Callbacks
          </p>
          <p className="text-emerald-600 text-xl" data-testid="debounced-count">
            {callbackCount}
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          setResizeCount(0);
          setCallbackCount(0);
        }}
        className={storyTheme.buttonNeutral + " mt-4 w-full"}
        data-testid="reset-counts"
      >
        Reset Counts
      </button>
    </div>
  );
}

/**
 * Callback mode demo - no state updates
 */
function CallbackModeDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const { ref } = useResizeObserver({
    updateState: false,
    onResize: (entry) => {
      const log = `${new Date().toLocaleTimeString()} - ${Math.round(entry.contentRect.width)} x ${Math.round(entry.contentRect.height)}`;
      setLogs((prev) => [...prev.slice(-9), log]);
    },
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title + " text-center mb-4"}>Callback Mode</h2>
      <p className={storyTheme.subtitle + " text-center"}>
        updateState: false for better performance
      </p>

      <div
        ref={ref}
        data-testid="callback-target"
        className="bg-emerald-100 rounded-md border border-emerald-300 p-6 resize overflow-auto"
        style={{ resize: "both", minHeight: "150px" }}
      >
        <p className="text-center text-emerald-600 font-semibold">
          Resize me - check the log below
        </p>
      </div>

      <div
        ref={logRef}
        className={storyTheme.statBox + " mt-4 h-[200px] overflow-y-auto"}
      >
        <p className="font-semibold text-sm text-zinc-600 mb-2">Resize Log:</p>
        {logs.length === 0 ? (
          <p className="text-zinc-400 text-sm" data-testid="no-logs">
            No resize events yet
          </p>
        ) : (
          <ul className="text-sm space-y-1">
            {logs.map((log, i) => (
              <li key={i} className="text-zinc-600" data-testid="log-entry">
                {log}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => setLogs([])}
        className={storyTheme.buttonNeutral + " mt-4 w-full"}
        data-testid="clear-logs"
      >
        Clear Logs
      </button>
    </div>
  );
}

/**
 * Responsive layout demo - adapts based on size
 */
function ResponsiveLayoutDemo() {
  const { ref, width } = useResizeObserver();

  const columns = width ? Math.max(1, Math.floor(width / 120)) : 1;
  const layoutType = width
    ? width < 300
      ? "Mobile"
      : width < 500
        ? "Tablet"
        : "Desktop"
    : "Unknown";

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title + " text-center mb-4"}>
        Responsive Layout
      </h2>
      <p className={storyTheme.subtitle + " text-center"}>
        Layout adapts based on container width
      </p>

      <div
        ref={ref}
        data-testid="responsive-target"
        className="bg-cyan-100 rounded-md border border-cyan-300 p-4 resize overflow-auto"
        style={{ resize: "horizontal", minHeight: "250px", minWidth: "150px" }}
      >
        <div className="mb-4 text-center">
          <span
            data-testid="layout-type"
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              layoutType === "Desktop"
                ? "bg-emerald-200 text-emerald-800"
                : layoutType === "Tablet"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-200 text-red-800"
            }`}
          >
            {layoutType}
          </span>
          <p className="text-zinc-500 text-sm mt-1">
            Width: <span data-testid="responsive-width">{width ?? "-"}</span>px
            | Columns: <span data-testid="columns">{columns}</span>
          </p>
        </div>

        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-3 shadow-sm text-center"
            >
              <div className="w-8 h-8 bg-cyan-200 rounded-full mx-auto mb-2" />
              <p className="text-xs text-zinc-600">Item {i + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Manual control demo - observe/unobserve/disconnect
 */
function ManualControlDemo() {
  const { ref, width, height, isObserving, observe, unobserve, disconnect } =
    useResizeObserver();
  const targetRef = useRef<HTMLDivElement>(null);

  const handleRef = useCallback(
    (el: HTMLDivElement | null) => {
      (targetRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      ref(el);
    },
    [ref]
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title + " text-center mb-4"}>Manual Control</h2>
      <p className={storyTheme.subtitle + " text-center"}>
        Control observation programmatically
      </p>

      <div className="flex gap-2 justify-center mb-4">
        <button
          onClick={() => targetRef.current && observe(targetRef.current)}
          className={storyTheme.buttonSuccess}
          data-testid="observe-btn"
        >
          Observe
        </button>
        <button
          onClick={() => targetRef.current && unobserve(targetRef.current)}
          className={storyTheme.buttonDanger}
          data-testid="unobserve-btn"
        >
          Unobserve
        </button>
        <button
          onClick={disconnect}
          className={storyTheme.buttonNeutral}
          data-testid="disconnect-btn"
        >
          Disconnect
        </button>
      </div>

      <div
        ref={handleRef}
        data-testid="manual-target"
        className={`rounded-md border p-6 resize overflow-auto transition-colors ${
          isObserving
            ? "bg-emerald-100 border-emerald-300"
            : "bg-zinc-100 border-zinc-300"
        }`}
        style={{ resize: "both", minHeight: "150px" }}
      >
        <div className="text-center">
          <p
            className={`text-2xl font-bold ${isObserving ? "text-emerald-600" : "text-zinc-400"}`}
          >
            {width ?? "-"} x {height ?? "-"}
          </p>
          <p className="text-sm mt-2">
            Status:{" "}
            <span
              data-testid="manual-status"
              className={`font-semibold ${isObserving ? "text-emerald-600" : "text-red-600"}`}
            >
              {isObserving ? "Observing" : "Not Observing"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Enable/Disable toggle demo
 */
function EnableDisableDemo() {
  const [enabled, setEnabled] = useState(true);
  const { ref, width, height, isObserving } = useResizeObserver({ enabled });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title + " text-center mb-4"}>
        Enable/Disable Toggle
      </h2>
      <p className={storyTheme.subtitle + " text-center"}>
        Toggle observation without unmounting
      </p>

      <div className="flex justify-center mb-4">
        <button
          onClick={() => setEnabled(!enabled)}
          data-testid="toggle-enabled"
          className={enabled ? storyTheme.buttonDanger : storyTheme.buttonSuccess}
        >
          {enabled ? "Disable" : "Enable"} Observation
        </button>
      </div>

      <div
        ref={ref}
        data-testid="enable-target"
        className={`rounded-md border p-6 resize overflow-auto transition-all ${
          enabled
            ? "bg-violet-100 border-violet-300"
            : "bg-zinc-100 border-zinc-300 opacity-50"
        }`}
        style={{ resize: "both", minHeight: "150px" }}
      >
        <div className="text-center">
          <p
            className={`text-2xl font-bold ${enabled ? "text-violet-600" : "text-zinc-400"}`}
          >
            {width ?? "-"} x {height ?? "-"}
          </p>
          <p className="text-sm mt-2">
            <span
              data-testid="enabled-status"
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                enabled
                  ? "bg-emerald-200 text-emerald-800"
                  : "bg-red-200 text-red-800"
              }`}
            >
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </p>
        </div>
      </div>

      <p className={storyTheme.infoBox + " mt-4"}>
        <span className={storyTheme.infoText}>
          When disabled, resize events are ignored but last known size is
          preserved.
        </span>
      </p>
    </div>
  );
}

/**
 * Custom rounding demo
 */
function CustomRoundingDemo() {
  const [roundMode, setRoundMode] = useState<"round" | "floor" | "ceil" | "none">(
    "round"
  );

  const roundFn =
    roundMode === "floor"
      ? Math.floor
      : roundMode === "ceil"
        ? Math.ceil
        : roundMode === "none"
          ? (v: number) => v
          : Math.round;

  const { ref, width, height } = useResizeObserver({ round: roundFn });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title + " text-center mb-4"}>Custom Rounding</h2>
      <p className={storyTheme.subtitle + " text-center"}>
        Choose how dimension values are rounded
      </p>

      <div className="flex gap-2 justify-center flex-wrap mb-4">
        {(["round", "floor", "ceil", "none"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setRoundMode(mode)}
            data-testid={`round-${mode}`}
            className={
              roundMode === mode
                ? storyTheme.buttonPrimary
                : storyTheme.buttonNeutral
            }
          >
            Math.{mode === "none" ? "identity" : mode}
          </button>
        ))}
      </div>

      <div
        ref={ref}
        data-testid="round-target"
        className="bg-orange-100 rounded-md border border-orange-300 p-6 resize overflow-auto"
        style={{ resize: "both", minHeight: "150px" }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            <span data-testid="round-width">{width ?? "-"}</span> x{" "}
            <span data-testid="round-height">{height ?? "-"}</span>
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            Rounding: <span className="font-semibold">{roundMode}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Multiple elements demo - Using individual hooks for each element (recommended pattern)
 */
function MultipleElementsDemo() {
  const [isEnabled, setIsEnabled] = useState(true);

  const boxA = useResizeObserver({ enabled: isEnabled });
  const boxB = useResizeObserver({ enabled: isEnabled });
  const boxC = useResizeObserver({ enabled: isEnabled });

  const boxes = [
    { id: "A", hook: boxA },
    { id: "B", hook: boxB },
    { id: "C", hook: boxC },
  ];

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title + " text-center mb-4"}>
        Multiple Elements
      </h2>
      <p className={storyTheme.subtitle + " text-center"}>
        Each element uses its own hook instance
      </p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {boxes.map(({ id, hook }) => (
          <div
            key={id}
            data-id={id}
            data-testid={`multi-${id}`}
            ref={hook.ref}
            className="bg-teal-100 rounded-md border border-teal-300 p-4 resize overflow-auto"
            style={{ resize: "both", minHeight: "100px" }}
          >
            <div className="text-center">
              <p className="font-bold text-teal-600 text-lg">{id}</p>
              <p className="text-sm text-zinc-600" data-testid={`size-${id}`}>
                {hook.width !== undefined && hook.height !== undefined
                  ? `${hook.width} x ${hook.height}`
                  : "- x -"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsEnabled(false)}
          disabled={!isEnabled}
          className={`${storyTheme.buttonDanger} flex-1 ${!isEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
          data-testid="disconnect-all"
        >
          Disconnect All
        </button>
        <button
          onClick={() => setIsEnabled(true)}
          disabled={isEnabled}
          className={`${storyTheme.buttonSuccess} flex-1 ${isEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
          data-testid="reconnect-all"
        >
          Reconnect All
        </button>
      </div>

      <p className={`text-center mt-2 text-sm ${isEnabled ? "text-emerald-600" : "text-red-600"}`}>
        Status: {isEnabled ? "Observing" : "Disconnected"}
      </p>
    </div>
  );
}

/**
 * Initial dimensions demo (SSR)
 */
function InitialDimensionsDemo() {
  const [mounted, setMounted] = useState(false);
  const { ref, width, height, entry } = useResizeObserver({
    initialWidth: 300,
    initialHeight: 200,
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title + " text-center mb-4"}>
        Initial Dimensions
      </h2>
      <p className={storyTheme.subtitle + " text-center"}>
        Pre-set dimensions for SSR hydration
      </p>

      <div className={storyTheme.statBox + " mb-4"}>
        <p className="text-sm">
          <span className="font-semibold">Initial:</span> 300 x 200
        </p>
        <p className="text-sm">
          <span className="font-semibold">Current:</span>{" "}
          <span data-testid="initial-width">{width ?? "-"}</span> x{" "}
          <span data-testid="initial-height">{height ?? "-"}</span>
        </p>
        <p className="text-sm">
          <span className="font-semibold">Has Entry:</span>{" "}
          <span data-testid="has-entry">{entry ? "Yes" : "No"}</span>
        </p>
      </div>

      {!mounted ? (
        <div className="text-center">
          <button
            onClick={() => setMounted(true)}
            className={storyTheme.buttonPrimary}
            data-testid="mount-btn"
          >
            Mount Element
          </button>
          <p className="text-zinc-500 text-sm mt-2">
            Values above are initial (SSR) values
          </p>
        </div>
      ) : (
        <div
          ref={ref}
          data-testid="initial-target"
          className="bg-zinc-100 rounded-md border border-zinc-300 p-6 resize overflow-auto"
          style={{ resize: "both", minHeight: "150px" }}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-600">
              {width ?? "-"} x {height ?? "-"}
            </p>
            <p className="text-zinc-500 text-sm mt-2">Actual dimensions</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Meta Configuration ============

const meta: Meta = {
  title: "Hooks/useResizeObserver",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A React hook for observing element size changes using the ResizeObserver API.

## Features
- Real-time element size tracking (width, height)
- Support for border-box, content-box, device-pixel-content-box
- Debounce/Throttle options for performance
- Custom rounding function for dimensions
- Callback-only mode (no state updates)
- SSR compatible with graceful degradation
- TypeScript support with full type inference

## Installation
\`\`\`bash
npm install @usefy/use-resize-observer
\`\`\`

## Basic Usage
\`\`\`tsx
import { useResizeObserver } from '@usefy/use-resize-observer';

function Component() {
  const { ref, width, height } = useResizeObserver();

  return (
    <div ref={ref}>
      Size: {width} x {height}
    </div>
  );
}
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj;

// ============ Stories ============

export const BasicUsage: Story = {
  render: () => <BasicUsageDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Basic usage showing real-time width and height tracking. Drag the corner of the box to resize.",
      },
      source: {
        code: `
const { ref, width, height } = useResizeObserver();

return (
  <div ref={ref} style={{ resize: 'both', overflow: 'auto' }}>
    Size: {width} x {height}
  </div>
);
        `,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check initial state
    await expect(canvas.getByTestId("supported")).toHaveTextContent("Yes");
    await expect(canvas.getByTestId("observing")).toHaveTextContent("Yes");
  },
};

export const BoxOptions: Story = {
  render: () => <BoxOptionsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Compare different box sizing modes: content-box, border-box, and device-pixel-content-box.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state should be content-box
    const contentBoxBtn = canvas.getByTestId("box-option-content-box");
    await expect(contentBoxBtn).toBeInTheDocument();

    // Click border-box button
    await userEvent.click(canvas.getByTestId("box-option-border-box"));

    // Verify UI updated (button should show selected state)
    await waitFor(() => {
      const borderBoxBtn = canvas.getByTestId("box-option-border-box");
      expect(borderBoxBtn.className).toContain("bg-violet-600");
    });
  },
};

export const Debounce: Story = {
  render: () => <DebounceDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Debouncing limits callback frequency during rapid resizing. Compare raw events vs debounced callbacks.",
      },
      source: {
        code: `
const { ref, width, height } = useResizeObserver({
  debounce: 200,
  onResize: (entry) => console.log('Resized:', entry),
});
        `,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check reset button exists
    await expect(canvas.getByTestId("reset-counts")).toBeInTheDocument();

    // Click reset
    await userEvent.click(canvas.getByTestId("reset-counts"));

    // Verify counts are 0
    await expect(canvas.getByTestId("raw-count")).toHaveTextContent("0");
    await expect(canvas.getByTestId("debounced-count")).toHaveTextContent("0");
  },
};

export const CallbackMode: Story = {
  render: () => <CallbackModeDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Callback-only mode (updateState: false) for better performance when you only need callbacks.",
      },
      source: {
        code: `
const { ref } = useResizeObserver({
  updateState: false,
  onResize: (entry) => {
    // Handle resize without triggering React re-renders
    console.log(entry.contentRect);
  },
});
        `,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check initial state - no logs
    await expect(canvas.getByTestId("no-logs")).toBeInTheDocument();

    // Clear logs button should exist
    await expect(canvas.getByTestId("clear-logs")).toBeInTheDocument();
  },
};

export const ResponsiveLayout: Story = {
  render: () => <ResponsiveLayoutDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Create responsive layouts that adapt based on container width, not viewport width.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check layout type is displayed
    await expect(canvas.getByTestId("layout-type")).toBeInTheDocument();

    // Check columns are displayed
    await expect(canvas.getByTestId("columns")).toBeInTheDocument();
  },
};

export const ManualControl: Story = {
  render: () => <ManualControlDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Manually control observation with observe(), unobserve(), and disconnect() methods.",
      },
      source: {
        code: `
const { ref, observe, unobserve, disconnect, isObserving } = useResizeObserver();

// Manual control
<button onClick={() => unobserve(element)}>Stop</button>
<button onClick={() => observe(element)}>Start</button>
<button onClick={disconnect}>Disconnect All</button>
        `,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state should be observing
    await expect(canvas.getByTestId("manual-status")).toHaveTextContent(
      "Observing"
    );

    // Click unobserve
    await userEvent.click(canvas.getByTestId("unobserve-btn"));

    await waitFor(() => {
      expect(canvas.getByTestId("manual-status")).toHaveTextContent(
        "Not Observing"
      );
    });

    // Click observe to restore
    await userEvent.click(canvas.getByTestId("observe-btn"));

    await waitFor(() => {
      expect(canvas.getByTestId("manual-status")).toHaveTextContent("Observing");
    });
  },
};

export const EnableDisable: Story = {
  render: () => <EnableDisableDemo />,
  parameters: {
    docs: {
      description: {
        story: "Toggle observation on/off using the enabled option.",
      },
      source: {
        code: `
const [enabled, setEnabled] = useState(true);
const { ref, width, height } = useResizeObserver({ enabled });

<button onClick={() => setEnabled(!enabled)}>
  {enabled ? 'Disable' : 'Enable'}
</button>
        `,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state should be enabled
    await expect(canvas.getByTestId("enabled-status")).toHaveTextContent(
      "Enabled"
    );

    // Toggle off
    await userEvent.click(canvas.getByTestId("toggle-enabled"));

    await waitFor(() => {
      expect(canvas.getByTestId("enabled-status")).toHaveTextContent("Disabled");
    });

    // Toggle back on
    await userEvent.click(canvas.getByTestId("toggle-enabled"));

    await waitFor(() => {
      expect(canvas.getByTestId("enabled-status")).toHaveTextContent("Enabled");
    });
  },
};

export const CustomRounding: Story = {
  render: () => <CustomRoundingDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Customize how dimension values are rounded (Math.round, Math.floor, Math.ceil, or none).",
      },
      source: {
        code: `
const { ref, width, height } = useResizeObserver({
  round: Math.floor, // or Math.ceil, Math.round, (v) => v
});
        `,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test clicking different round options
    await userEvent.click(canvas.getByTestId("round-floor"));
    await userEvent.click(canvas.getByTestId("round-ceil"));
    await userEvent.click(canvas.getByTestId("round-round"));
  },
};

export const MultipleElements: Story = {
  render: () => <MultipleElementsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Track several elements independently by giving each its own useResizeObserver instance and ref. Every hook manages its own width/height state, and a shared enabled flag can pause/resume them all at once.",
      },
      source: {
        code: `
function MultipleElements() {
  const [enabled, setEnabled] = useState(true);

  // One independent hook instance per element.
  const boxA = useResizeObserver({ enabled });
  const boxB = useResizeObserver({ enabled });
  const boxC = useResizeObserver({ enabled });

  const boxes = [
    { id: "A", hook: boxA },
    { id: "B", hook: boxB },
    { id: "C", hook: boxC },
  ];

  return (
    <>
      {boxes.map(({ id, hook }) => (
        <div key={id} ref={hook.ref} style={{ resize: "both", overflow: "auto" }}>
          {id}: {hook.width ?? "-"} x {hook.height ?? "-"}
        </div>
      ))}

      <button onClick={() => setEnabled(false)} disabled={!enabled}>
        Disconnect All
      </button>
      <button onClick={() => setEnabled(true)} disabled={enabled}>
        Reconnect All
      </button>
    </>
  );
}
        `,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check all elements are present
    await expect(canvas.getByTestId("multi-A")).toBeInTheDocument();
    await expect(canvas.getByTestId("multi-B")).toBeInTheDocument();
    await expect(canvas.getByTestId("multi-C")).toBeInTheDocument();

    // Check disconnect button
    await expect(canvas.getByTestId("disconnect-all")).toBeInTheDocument();
  },
};

export const InitialDimensions: Story = {
  render: () => <InitialDimensionsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Set initial dimensions for SSR hydration. Values are used before element is mounted.",
      },
      source: {
        code: `
const { ref, width, height } = useResizeObserver({
  initialWidth: 300,
  initialHeight: 200,
});

// width and height will be 300x200 until element is observed
        `,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check initial values before mounting
    await expect(canvas.getByTestId("initial-width")).toHaveTextContent("300");
    await expect(canvas.getByTestId("initial-height")).toHaveTextContent("200");
    await expect(canvas.getByTestId("has-entry")).toHaveTextContent("Yes");

    // Mount the element
    await userEvent.click(canvas.getByTestId("mount-btn"));

    // After mounting, values should update
    await waitFor(() => {
      expect(canvas.getByTestId("initial-target")).toBeInTheDocument();
    });
  },
};
