import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useNetworkState } from "@usefy/use-network-state";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Helpers ============

function formatValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value instanceof Date) return value.toLocaleTimeString();
  return String(value);
}

// ============ Demo Components ============

/**
 * Full network status dashboard: online flag + every Network Information field.
 */
function DashboardDemo() {
  const state = useNetworkState();

  const rows: Array<[string, unknown]> = [
    ["online", state.online],
    ["since", state.since],
    ["effectiveType", state.effectiveType],
    ["downlink", state.downlink],
    ["downlinkMax", state.downlinkMax],
    ["rtt", state.rtt],
    ["saveData", state.saveData],
    ["type", state.type],
  ];

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useNetworkState</h2>
      <p className={storyTheme.subtitle}>
        Live snapshot of connectivity and the Network Information API. Toggle
        your device&apos;s network (or DevTools &rarr; Network throttling) to
        watch it update.
      </p>

      <div
        className={state.online ? storyTheme.cardSuccess : storyTheme.cardError}
        data-testid="online-card"
      >
        <p className={storyTheme.statLabel}>
          Status:{" "}
          <span className={storyTheme.statValue} data-testid="online-value">
            {state.online ? "Online" : "Offline"}
          </span>
        </p>
      </div>

      <div className={`${storyTheme.statBox} mt-4`}>
        {rows.map(([label, value]) => (
          <p key={label} className={storyTheme.statLabel}>
            {label}:{" "}
            <span
              className={storyTheme.statValue}
              data-testid={`field-${label}`}
            >
              {formatValue(value)}
            </span>
          </p>
        ))}
      </div>

      <p className={`${storyTheme.statTextSecondary} mt-4 text-sm`}>
        Fields other than <code>online</code> are <code>undefined</code> in
        browsers without the Network Information API (Firefox, Safari).
      </p>
    </div>
  );
}

/**
 * Offline banner pattern — render a warning only when connectivity is lost.
 */
function OfflineBannerDemo() {
  const { online, since } = useNetworkState();

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Offline Banner</h2>
      <p className={storyTheme.subtitle}>
        A common pattern: show a banner only while the user is offline.
      </p>

      {online ? (
        <div className={storyTheme.cardSuccess} data-testid="banner">
          <p className={storyTheme.statLabel}>
            You&apos;re connected. Nothing to see here.
          </p>
        </div>
      ) : (
        <div className={storyTheme.cardError} data-testid="banner" role="alert">
          <p className={storyTheme.statLabel}>
            You are offline. Changes will sync when you reconnect
            {since ? ` (since ${since.toLocaleTimeString()})` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Adaptive quality — choose asset quality from effectiveType / saveData.
 */
function AdaptiveMediaDemo() {
  const { effectiveType, saveData } = useNetworkState();

  const lowData =
    saveData === true ||
    effectiveType === "slow-2g" ||
    effectiveType === "2g";

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Adaptive Loading</h2>
      <p className={storyTheme.subtitle}>
        Serve lighter assets on slow or data-saver connections.
      </p>

      <div
        className={lowData ? storyTheme.cardWarning : storyTheme.cardInfo}
        data-testid="quality-card"
      >
        <p className={storyTheme.statValue} data-testid="quality-value">
          {lowData ? "Low-res / data-saving mode" : "High-res mode"}
        </p>
        <p className={`${storyTheme.statLabel} mt-2`}>
          effectiveType: {formatValue(effectiveType)} · saveData:{" "}
          {formatValue(saveData)}
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof DashboardDemo> = {
  title: "Hooks/useNetworkState",
  component: DashboardDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Track the device's network status: online/offline connectivity plus the Network Information API (\`effectiveType\`, \`downlink\`, \`rtt\`, \`saveData\`, \`type\`).

## Features
- **Online / offline** - \`navigator.onLine\`, updated on the window \`online\`/\`offline\` events
- **Network Information** - \`effectiveType\`, \`downlink\`, \`downlinkMax\`, \`rtt\`, \`saveData\`, \`type\` from \`navigator.connection\` (with \`mozConnection\`/\`webkitConnection\` fallback)
- **\`since\` timestamp** - When the last online/offline transition happened
- **Graceful degradation** - Every Network Information field is \`undefined\` where unsupported (Firefox, Safari); \`online\` always works
- **SSR-safe & concurrent-safe** - Built on \`useSyncExternalStore\`; returns \`{ online: true }\` on the server, no hydration mismatch

## Basic Usage
\`\`\`tsx
const { online, effectiveType } = useNetworkState();
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DashboardDemo>;

export const Default: Story = {
  render: () => <DashboardDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Full readout of the network state object, live-updating on connectivity and connection changes.",
      },
      source: {
        language: "tsx",
        code: `import { useNetworkState } from "@usefy/use-network-state";

function NetworkInfo() {
  const { online, since, downlink, effectiveType, rtt, saveData, type } =
    useNetworkState();

  return (
    <ul>
      <li>online: {String(online)}</li>
      <li>effectiveType: {effectiveType ?? "unsupported"}</li>
      <li>downlink: {downlink ?? "—"} Mb/s</li>
      <li>rtt: {rtt ?? "—"} ms</li>
      <li>saveData: {String(saveData ?? false)}</li>
      <li>type: {type ?? "unsupported"}</li>
    </ul>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("online-value")).toHaveTextContent(
        navigator.onLine ? "Online" : "Offline"
      );
    });
  },
};

export const OfflineBanner: Story = {
  render: () => <OfflineBannerDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Render a warning banner only while the user is offline, using the `online` flag.",
      },
      source: {
        language: "tsx",
        code: `import { useNetworkState } from "@usefy/use-network-state";

function OfflineBanner() {
  const { online } = useNetworkState();
  if (online) return null;

  return (
    <div role="alert">
      You are offline. Changes will sync when you reconnect.
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // In the story browser we are online, so the success banner shows.
    await waitFor(() => {
      const banner = canvas.getByTestId("banner");
      if (navigator.onLine) {
        expect(banner).toHaveTextContent("connected");
      } else {
        expect(banner).toHaveTextContent("offline");
      }
    });
  },
};

export const AdaptiveLoading: Story = {
  render: () => <AdaptiveMediaDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Pick asset quality from `effectiveType` and `saveData` to respect slow or metered connections.",
      },
      source: {
        language: "tsx",
        code: `import { useNetworkState } from "@usefy/use-network-state";

function Hero() {
  const { effectiveType, saveData } = useNetworkState();
  const lowData =
    saveData || effectiveType === "slow-2g" || effectiveType === "2g";

  return lowData ? <LowResImage /> : <HighResImage />;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("quality-card")).toBeInTheDocument();
    });
  },
};
