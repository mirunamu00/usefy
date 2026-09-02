import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useWindowSize } from "@usefy/use-window-size";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Helpers ============

function getBreakpoint(width: number): {
  label: string;
  color: string;
} {
  if (width < 640) return { label: "Mobile", color: "bg-red-600" };
  if (width < 1024)
    return { label: "Tablet", color: "bg-amber-600" };
  return { label: "Desktop", color: "bg-violet-600" };
}

// ============ Demo Components ============

/**
 * Basic live window size readout
 */
function BasicDemo() {
  const { width, height } = useWindowSize();

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useWindowSize</h2>
      <p className={storyTheme.subtitle}>
        Resize the browser window to see live updates
      </p>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Width:{" "}
          <span className={storyTheme.statValue} data-testid="width">
            {width}
          </span>
          px
        </p>
        <p className={storyTheme.statLabel}>
          Height:{" "}
          <span className={storyTheme.statValue} data-testid="height">
            {height}
          </span>
          px
        </p>
      </div>
    </div>
  );
}

/**
 * Responsive breakpoint indicator
 */
function BreakpointDemo() {
  const { width } = useWindowSize();
  const breakpoint = getBreakpoint(width);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Responsive Breakpoints</h2>
      <p className={storyTheme.subtitle}>
        The active breakpoint follows the window width
      </p>

      <div
        className={`p-8 rounded-md ${breakpoint.color} text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200`}
        data-testid="breakpoint-box"
      >
        <p className="text-3xl font-bold m-0" data-testid="breakpoint-label">
          {breakpoint.label}
        </p>
        <p className="text-white/80 mt-2 m-0">
          {width}px wide
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-6 text-sm text-zinc-600">
        <div>Mobile &lt; 640</div>
        <div>Tablet &lt; 1024</div>
        <div>Desktop ≥ 1024</div>
      </div>
    </div>
  );
}

/**
 * Debounced vs immediate comparison
 */
function DebouncedDemo() {
  const immediate = useWindowSize();
  const debounced = useWindowSize({ debounceMs: 300 });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Debounced Updates</h2>
      <p className={storyTheme.subtitle}>
        The debounced value settles 300ms after you stop resizing
      </p>

      <div className="flex gap-4">
        <div className={`${storyTheme.statBox} flex-1`}>
          <p className={storyTheme.statLabel}>Immediate</p>
          <p className={storyTheme.statValue} data-testid="immediate-width">
            {immediate.width} × {immediate.height}
          </p>
        </div>
        <div className={`${storyTheme.cardInfo} flex-1`}>
          <p className={storyTheme.statLabel}>Debounced (300ms)</p>
          <p className={storyTheme.statValue} data-testid="debounced-width">
            {debounced.width} × {debounced.height}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Enable / disable tracking
 */
function ToggleDemo() {
  const [enabled, setEnabled] = useState(true);
  const { width, height } = useWindowSize({ enabled });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Enable / Disable</h2>
      <p className={storyTheme.subtitle}>
        Freeze the readout by disabling tracking
      </p>

      <div className="mb-6">
        <button
          onClick={() => setEnabled((e) => !e)}
          className={enabled ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
          data-testid="toggle-enabled"
        >
          Tracking: {enabled ? "On" : "Off (frozen)"}
        </button>
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Size:{" "}
          <span className={storyTheme.statValue} data-testid="toggle-size">
            {width} × {height}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof BasicDemo> = {
  title: "Hooks/useWindowSize",
  component: BasicDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `A hook for tracking the browser window size, with debounce/throttle, SSR safety, and an optional change callback.

## Features
- **Live width/height** - Updates on every window resize
- **Debounce / throttle** - Limit how often updates fire during rapid resizes
- **SSR compatible** - Configurable initial size avoids hydration mismatches
- **No wasted renders** - Skips updates when the size hasn't actually changed
- **Scrollbar control** - Include or exclude the scrollbar in the measurement
- **onChange callback** - React to size changes imperatively

## Basic Usage
\`\`\`tsx
const { width, height } = useWindowSize();
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BasicDemo>;

export const Default: Story = {
  render: () => <BasicDemo />,
  parameters: {
    docs: {
      description: {
        story: "Live window size readout that updates as you resize.",
      },
      source: {
        code: `import { useWindowSize } from "@usefy/use-window-size";

function Component() {
  const { width, height } = useWindowSize();

  return (
    <div>
      {width} × {height}
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The displayed width should match the live window width.
    await waitFor(() => {
      expect(canvas.getByTestId("width")).toHaveTextContent(
        String(window.innerWidth)
      );
      expect(canvas.getByTestId("height")).toHaveTextContent(
        String(window.innerHeight)
      );
    });
  },
};

export const Breakpoints: Story = {
  render: () => <BreakpointDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Derive responsive breakpoints from the window width.",
      },
      source: {
        code: `import { useWindowSize } from "@usefy/use-window-size";

function Layout() {
  const { width } = useWindowSize();

  if (width < 640) return <MobileView />;
  if (width < 1024) return <TabletView />;
  return <DesktopView />;
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const expected = getBreakpoint(window.innerWidth).label;
    await waitFor(() => {
      expect(canvas.getByTestId("breakpoint-label")).toHaveTextContent(expected);
    });
  },
};

export const Debounced: Story = {
  render: () => <DebouncedDemo />,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "Compare an immediate readout against a debounced one (300ms).",
      },
      source: {
        code: `import { useWindowSize } from "@usefy/use-window-size";

function Component() {
  const debounced = useWindowSize({ debounceMs: 300 });
  return <div>{debounced.width} × {debounced.height}</div>;
}`,
        language: "tsx",
      },
    },
  },
};

export const ToggleTracking: Story = {
  render: () => <ToggleDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Disable tracking with the `enabled` option to freeze the last known size.",
      },
      source: {
        code: `import { useWindowSize } from "@usefy/use-window-size";
import { useState } from "react";

function Component() {
  const [enabled, setEnabled] = useState(true);
  const { width, height } = useWindowSize({ enabled });

  return (
    <div>
      <button onClick={() => setEnabled((e) => !e)}>
        {enabled ? "On" : "Off"}
      </button>
      {width} × {height}
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("toggle-size")).toHaveTextContent(
        `${window.innerWidth} × ${window.innerHeight}`
      );
    });
  },
};
