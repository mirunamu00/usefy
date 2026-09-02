import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { NetworkIndicator } from "@usefy/network-indicator";
import { storyTheme } from "../styles/storyTheme";

// ============================================================================
// Connectivity simulation
// ============================================================================
// Browsers don't let a page really go offline on demand, but `NetworkIndicator`
// (via @usefy/use-network-state) reads `navigator.onLine` and listens to the
// window `online`/`offline` events — so overriding the getter and dispatching
// the matching event reproduces the exact signals a real drop produces.

function simulateConnectivity(online: boolean): void {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => online,
  });
  window.dispatchEvent(new Event(online ? "online" : "offline"));
}

function SimulationButtons() {
  return (
    <div className={storyTheme.buttonGroupFull}>
      <button
        type="button"
        data-testid="go-offline"
        className={storyTheme.buttonDanger}
        onClick={() => simulateConnectivity(false)}
      >
        Simulate offline
      </button>
      <button
        type="button"
        data-testid="go-online"
        className={storyTheme.buttonSuccess}
        onClick={() => simulateConnectivity(true)}
      >
        Simulate online
      </button>
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof NetworkIndicator> = {
  title: "network-indicator",
  component: NetworkIndicator,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `A drop-in online/offline status banner — mount \`<NetworkIndicator />\` once at your app root. It renders nothing while online, shows a fixed offline banner the moment connectivity is lost, and swaps to a brief auto-dismissing **"Back online"** confirmation when it returns. It never flashes "Back online" on first mount, and is built on \`@usefy/use-network-state\` (SSR-safe, StrictMode-safe).

## Features
- **Zero-config** — sensible default messages and inline styling; no CSS import
- **\`position\`** — pin the fixed banner to the \`"top"\` (default) or \`"bottom"\` edge
- **\`offlineMessage\` / \`onlineMessage\`** — any ReactNode content
- **\`onlineDuration\`** — how long the "back online" confirmation stays (default 3000ms); \`0\` disables it
- **\`render\`** — escape hatch receiving \`{ online, reconnected }\` to fully own the UI while keeping the state machine
- **\`onStatusChange(online)\`** — fired on every connectivity transition (never on mount)
- **Accessible** — non-interactive banner; offline is an assertive \`role="alert"\`, reconnected a polite \`role="status"\`
- **SSR-safe** — no \`window\` access at render; servers render nothing

## Basic Usage
\`\`\`tsx
import { NetworkIndicator } from "@usefy/network-indicator";

function App() {
  return (
    <>
      <YourApp />
      {/* Mount once at the root */}
      <NetworkIndicator />
    </>
  );
}
\`\`\``,
      },
    },
  },
  argTypes: {
    position: {
      control: "select",
      options: ["top", "bottom"],
      description: "Which screen edge the fixed banner is pinned to",
      table: {
        type: { summary: "'top' | 'bottom'" },
        defaultValue: { summary: "'top'" },
      },
    },
    offlineMessage: {
      control: "text",
      description: "Content of the offline banner (any ReactNode)",
      table: {
        type: { summary: "ReactNode" },
        defaultValue: { summary: "\"You're offline. Some features may not work.\"" },
      },
    },
    onlineMessage: {
      control: "text",
      description: "Content of the 'back online' confirmation (any ReactNode)",
      table: {
        type: { summary: "ReactNode" },
        defaultValue: { summary: "'Back online'" },
      },
    },
    onlineDuration: {
      control: { type: "number", min: 0, step: 500 },
      description:
        "How long (ms) the confirmation stays before auto-dismissing; 0 or negative disables it",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "3000" },
      },
    },
    onStatusChange: {
      description: "Called after each online/offline transition (never on mount)",
      table: { type: { summary: "(online: boolean) => void" } },
    },
    render: {
      description:
        "Escape hatch — fully own the UI; receives { online, reconnected }",
      table: {
        type: { summary: "(state: NetworkIndicatorState) => ReactNode" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkIndicator>;

// ============================================================================
// Overview
// ============================================================================

const OVERVIEW_CODE = `import { NetworkIndicator } from "@usefy/network-indicator";

function App() {
  return (
    <>
      <YourApp />
      {/* Renders nothing while online; offline banner on connection loss;
          brief "Back online" confirmation on reconnect (auto-dismisses) */}
      <NetworkIndicator
        position="top"
        onlineDuration={3000}
        onStatusChange={(online) => console.log("online:", online)}
      />
    </>
  );
}`;

function OverviewDemo(props: React.ComponentProps<typeof NetworkIndicator>) {
  const [log, setLog] = useState<string[]>([]);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>NetworkIndicator</h2>
      <p className={storyTheme.subtitle}>
        Use the buttons to simulate losing and regaining connectivity — the
        banner overlays the screen edge, and "Back online" auto-dismisses.
      </p>

      <SimulationButtons />

      <div className={storyTheme.card}>
        <p className={storyTheme.statLabel}>onStatusChange log</p>
        {log.length === 0 ? (
          <p className={storyTheme.statTextSecondary} data-testid="log-empty">
            No transitions yet — you're online.
          </p>
        ) : (
          <ul data-testid="status-log">
            {log.map((entry, i) => (
              <li key={i} className={storyTheme.statText}>
                {entry}
              </li>
            ))}
          </ul>
        )}
      </div>

      <NetworkIndicator
        {...props}
        onStatusChange={(online) =>
          setLog((prev) => [
            `${new Date().toLocaleTimeString()} — ${online ? "back online" : "went offline"}`,
            ...prev,
          ])
        }
      />
    </div>
  );
}

export const Overview: Story = {
  args: {
    position: "top",
    onlineDuration: 3000,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The default banner driven by simulated connectivity: nothing while online, a red offline banner on loss, and a green auto-dismissing confirmation on reconnect — with every transition reported through onStatusChange.",
      },
      source: { language: "tsx", code: OVERVIEW_CODE },
    },
  },
  render: (args) => <OverviewDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Steady-state online: no banner.
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("status")).not.toBeInTheDocument();

    // Lose the connection → offline banner appears (assertive role="alert").
    await userEvent.click(canvas.getByTestId("go-offline"));
    const offlineBanner = await canvas.findByRole("alert");
    await expect(offlineBanner).toHaveAttribute("data-status", "offline");
    await expect(offlineBanner).toHaveTextContent(
      "You're offline. Some features may not work."
    );

    // Reconnect → confirmation flash.
    await userEvent.click(canvas.getByTestId("go-online"));
    const onlineBanner = await canvas.findByRole("status");
    await expect(onlineBanner).toHaveAttribute("data-status", "reconnected");
    await expect(onlineBanner).toHaveTextContent("Back online");
  },
};

// ============================================================================
// Custom appearance
// ============================================================================

const CUSTOM_APPEARANCE_CODE = `import { NetworkIndicator } from "@usefy/network-indicator";

<NetworkIndicator
  position="bottom"
  offlineMessage={
    <span>
      Connection lost — changes will sync when you're back.
    </span>
  }
  onlineMessage={<span>Connection restored</span>}
  onlineDuration={5000}
  style={{ fontSize: 16, letterSpacing: 0.2 }}
/>`;

export const CustomAppearance: Story = {
  args: {
    position: "bottom",
    offlineMessage: (
      <span>Connection lost — changes will sync when you're back.</span>
    ),
    onlineMessage: <span>Connection restored</span>,
    onlineDuration: 5000,
    style: { fontSize: 16, letterSpacing: 0.2 },
  },
  parameters: {
    docs: {
      description: {
        story:
          "A bottom-pinned banner with ReactNode messages, a longer 5s confirmation, and style overrides merged over the defaults.",
      },
      source: { language: "tsx", code: CUSTOM_APPEARANCE_CODE },
    },
  },
  render: (args) => (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Custom appearance</h2>
      <p className={storyTheme.subtitle}>
        The banner is pinned to the bottom edge with custom messages and a 5s
        confirmation.
      </p>
      <SimulationButtons />
      <NetworkIndicator {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId("go-offline"));
    const banner = await canvas.findByRole("alert");
    await expect(banner).toHaveAttribute("data-position", "bottom");
    await expect(banner).toHaveTextContent("Connection lost");

    // Leave the page back online for the next story.
    await userEvent.click(canvas.getByTestId("go-online"));
    await expect(await canvas.findByRole("status")).toHaveTextContent(
      "Connection restored"
    );
  },
};

// ============================================================================
// Render prop (headless)
// ============================================================================

const RENDER_PROP_CODE = `import { NetworkIndicator } from "@usefy/network-indicator";

// Fully own the UI — the offline/reconnected state machine still runs.
<NetworkIndicator
  onlineDuration={4000}
  render={({ online, reconnected }) => {
    if (online && !reconnected) return null; // steady state: nothing
    return (
      <div
        role="status"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          padding: "12px 20px",
          borderRadius: 999,
          color: "#fff",
          background: online ? "#059669" : "#334155",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        }}
      >
        {online ? "Reconnected" : "Offline — retrying…"}
      </div>
    );
  }}
/>`;

export const RenderProp: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The render escape hatch replaces the default banner with a custom floating pill while the component keeps managing the offline/reconnected state machine.",
      },
      source: { language: "tsx", code: RENDER_PROP_CODE },
    },
  },
  render: () => (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Render prop</h2>
      <p className={storyTheme.subtitle}>
        A fully custom floating pill in the bottom-right corner — the component
        only supplies <code>{"{ online, reconnected }"}</code>.
      </p>
      <SimulationButtons />
      <NetworkIndicator
        onlineDuration={4000}
        render={({ online, reconnected }) => {
          if (online && !reconnected) return null;
          return (
            <div
              role="status"
              data-testid="custom-pill"
              style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                padding: "12px 20px",
                borderRadius: 999,
                color: "#fff",
                background: online ? "#059669" : "#334155",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              {online ? "Reconnected" : "Offline — retrying…"}
            </div>
          );
        }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId("go-offline"));
    await expect(await canvas.findByTestId("custom-pill")).toHaveTextContent(
      "Offline — retrying…"
    );

    await userEvent.click(canvas.getByTestId("go-online"));
    await expect(await canvas.findByTestId("custom-pill")).toHaveTextContent(
      "Reconnected"
    );
  },
};
