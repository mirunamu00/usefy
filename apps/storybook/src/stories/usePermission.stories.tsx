import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { usePermission } from "@usefy/use-permission";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Helpers ============

const PERMISSION_NAMES = [
  "geolocation",
  "camera",
  "microphone",
  "notifications",
] as const;

function cardClassForStatus(status: string): string {
  switch (status) {
    case "granted":
      return storyTheme.cardSuccess;
    case "denied":
    case "error":
      return storyTheme.cardError;
    case "prompt":
      return storyTheme.cardWarning;
    case "unsupported":
      return storyTheme.cardInfo;
    default:
      return storyTheme.statBox;
  }
}

// ============ Demo Components ============

/**
 * One permission row — queries a single descriptor and shows its live state.
 */
function PermissionRow({ name }: { name: string }) {
  const { state, status, isSupported, error } = usePermission({ name });

  return (
    <div className={cardClassForStatus(status)} data-testid={`perm-${name}`}>
      <p className={storyTheme.statLabel}>
        {name}:{" "}
        <span className={storyTheme.statValue} data-testid={`status-${name}`}>
          {status}
        </span>
        {state ? ` (state: ${state})` : ""}
        {!isSupported ? " — API unavailable" : ""}
        {error ? ` — ${error.message}` : ""}
      </p>
    </div>
  );
}

/**
 * Dashboard: live status for several common permissions at once.
 */
function DashboardDemo() {
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>usePermission</h2>
      <p className={storyTheme.subtitle}>
        Live Permissions API status for common permissions. Change a permission
        in your browser&apos;s site settings and watch the matching row update
        without a reload.
      </p>

      <div className="flex flex-col gap-3 mt-2">
        {PERMISSION_NAMES.map((name) => (
          <PermissionRow key={name} name={name} />
        ))}
      </div>

      <p className={`${storyTheme.statTextSecondary} mt-4 text-sm`}>
        <code>status</code> is one of <code>idle</code> · <code>pending</code> ·{" "}
        <code>granted</code> · <code>denied</code> · <code>prompt</code> ·{" "}
        <code>unsupported</code> · <code>error</code>. Names like{" "}
        <code>camera</code>/<code>microphone</code> are unsupported in some
        browsers and resolve to <code>error</code> or <code>unsupported</code>.
      </p>
    </div>
  );
}

/**
 * Gated-feature pattern: only enable a capability when its permission is granted.
 */
function GatedFeatureDemo() {
  const { state, status, isSupported } = usePermission({ name: "geolocation" });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Permission-gated feature</h2>
      <p className={storyTheme.subtitle}>
        Drive UI from a single permission — here, a &ldquo;Share location&rdquo;
        button that reflects the geolocation permission.
      </p>

      <div className={cardClassForStatus(status)} data-testid="gate-card">
        {!isSupported ? (
          <p className={storyTheme.statLabel} data-testid="gate-text">
            Permissions API unavailable in this browser.
          </p>
        ) : status === "idle" || status === "pending" ? (
          <p className={storyTheme.statLabel} data-testid="gate-text">
            Checking location permission…
          </p>
        ) : state === "denied" ? (
          <p className={storyTheme.statLabel} data-testid="gate-text">
            Location blocked. Enable it in site settings to share your location.
          </p>
        ) : (
          <button
            type="button"
            className={storyTheme.buttonPrimary}
            data-testid="gate-text"
            disabled={state !== "granted"}
          >
            {state === "granted"
              ? "Share location"
              : "Share location (will prompt)"}
          </button>
        )}
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof DashboardDemo> = {
  title: "Hooks/usePermission",
  component: DashboardDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Read the [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) status of a permission, with live updates when the user grants or revokes it.

## Features
- **Live updates** - subscribes to the \`PermissionStatus\` \`change\` event, so \`state\` reflects grant/revoke without a re-mount
- **Rich status** - returns \`{ state, status, isSupported, error }\`; \`status\` is a coarse union (\`idle\` · \`pending\` · \`granted\` · \`denied\` · \`prompt\` · \`unsupported\` · \`error\`) that covers the async and unsupported/error edges a bare \`PermissionState\` can't
- **Any permission name** - accepts a superset of \`PermissionDescriptor\`, so \`camera\`/\`microphone\`/\`push\`/\`midi\` all typecheck
- **Stable descriptor identity** - the effect is keyed on the descriptor's serialized contents, so an inline \`{ name: 'camera' }\` literal does not re-query every render
- **SSR-safe & StrictMode-safe** - reports \`unsupported\` on the server; the async query is race-guarded and the listener is cleaned up on unmount

## Basic Usage
\`\`\`tsx
const { state } = usePermission({ name: "camera" });
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
          "Live status for several permissions at once. Each row re-renders when its permission changes in the browser.",
      },
      source: {
        language: "tsx",
        code: `import { usePermission } from "@usefy/use-permission";

function CameraStatus() {
  const { state, status } = usePermission({ name: "camera" });

  // Branch on \`status\` (deterministic "idle" first render) for hydration safety.
  if (status === "idle" || status === "pending") return <span>Checking…</span>;
  if (status === "unsupported") return <span>Permissions API unavailable</span>;
  if (status === "error") return <span>Could not read permission</span>;

  return <span>Camera: {state}</span>; // 'granted' | 'denied' | 'prompt'
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Geolocation is broadly supported, so it should resolve to a real state.
    await waitFor(() => {
      const status = canvas.getByTestId("status-geolocation");
      expect(status.textContent).toMatch(
        /granted|denied|prompt|unsupported|error/
      );
    });
  },
};

export const GatedFeature: Story = {
  render: () => <GatedFeatureDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Drive UI state from a single permission — enable the action only once it is granted.",
      },
      source: {
        language: "tsx",
        code: `import { usePermission } from "@usefy/use-permission";

function ShareLocationButton() {
  const { state, status } = usePermission({ name: "geolocation" });

  if (status === "idle" || status === "pending") return <span>Checking…</span>;
  if (state === "denied") return <span>Location blocked in settings.</span>;

  return (
    <button disabled={state !== "granted"}>
      {state === "granted" ? "Share location" : "Share location (will prompt)"}
    </button>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("gate-card")).toBeInTheDocument();
      expect(canvas.getByTestId("gate-text")).toBeInTheDocument();
    });
  },
};
