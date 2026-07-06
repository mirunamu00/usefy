import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useScript } from "@usefy/use-script";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Helpers ============

// A tiny inline (data:) script that executes and fires `load` immediately — so
// the demos reach the `ready` state offline and deterministically, no CDN needed.
const DEMO_SRC =
  "data:text/javascript,window.__usefyScriptDemo = (window.__usefyScriptDemo || 0) + 1;";

function cardClassForStatus(status: string): string {
  switch (status) {
    case "ready":
      return storyTheme.cardSuccess;
    case "error":
      return storyTheme.cardError;
    case "loading":
      return storyTheme.cardWarning;
    default:
      return storyTheme.statBox;
  }
}

// ============ Demo Components ============

/**
 * Load one script and show its status move through the lifecycle.
 */
function StatusDemo() {
  const status = useScript(DEMO_SRC, { attributes: { id: "usefy-demo-sdk" } });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useScript</h2>
      <p className={storyTheme.subtitle}>
        Inject an external script and track its{" "}
        <code>idle → loading → ready</code> (or <code>error</code>) status.
      </p>

      <div className={cardClassForStatus(status)} data-testid="status-card">
        <p className={storyTheme.statLabel}>
          Status:{" "}
          <span className={storyTheme.statValue} data-testid="status">
            {status}
          </span>
        </p>
      </div>

      <p className={`${storyTheme.statTextSecondary} mt-4 text-sm`}>
        The hook adds one <code>&lt;script&gt;</code> to{" "}
        <code>document.head</code> with a live <code>data-status</code> attribute.
      </p>
    </div>
  );
}

/**
 * Two independent components request the *same* src — the hook dedups them onto a
 * single shared <script> tag and one shared status.
 */
function DedupDemo() {
  const statusA = useScript(DEMO_SRC);
  const statusB = useScript(DEMO_SRC);
  const [tagCount, setTagCount] = React.useState(0);

  React.useEffect(() => {
    setTagCount(
      document.querySelectorAll(`script[src="${DEMO_SRC}"]`).length
    );
  }, [statusA, statusB]);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Deduplicated loading</h2>
      <p className={storyTheme.subtitle}>
        Both widgets below call <code>useScript(sameSrc)</code>. They share one
        tag and re-render together when it resolves.
      </p>

      <div className="flex flex-col gap-3 mt-2">
        <div className={cardClassForStatus(statusA)} data-testid="widget-a">
          Widget A status:{" "}
          <span className={storyTheme.statValue}>{statusA}</span>
        </div>
        <div className={cardClassForStatus(statusB)} data-testid="widget-b">
          Widget B status:{" "}
          <span className={storyTheme.statValue}>{statusB}</span>
        </div>
      </div>

      <p className={`${storyTheme.statText} mt-4`}>
        Matching <code>&lt;script&gt;</code> tags in the DOM:{" "}
        <strong data-testid="tag-count">{tagCount}</strong> (not 2)
      </p>
    </div>
  );
}

/**
 * Gate loading behind a toggle — pass `null` (or `shouldPreventLoad`) to stay idle.
 */
function ConditionalDemo() {
  const [enabled, setEnabled] = React.useState(false);
  const status = useScript(enabled ? DEMO_SRC : null);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Conditional loading</h2>
      <p className={storyTheme.subtitle}>
        The script loads only after you opt in. Until then, <code>src</code> is{" "}
        <code>null</code> and the status stays <code>idle</code>.
      </p>

      <button
        type="button"
        className={storyTheme.buttonPrimary}
        data-testid="toggle"
        onClick={() => setEnabled((v) => !v)}
      >
        {enabled ? "Loaded" : "Load the script"}
      </button>

      <div
        className={`${cardClassForStatus(status)} mt-5`}
        data-testid="cond-card"
      >
        Status: <span className={storyTheme.statValue} data-testid="cond-status">{status}</span>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof StatusDemo> = {
  title: "Hooks/useScript",
  component: StatusDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Load an external script (analytics SDK, payment widget, map library…) and track its loading status, with automatic \`<script>\` deduplication across components.

## Features
- **Lifecycle status** - returns a bare \`idle | loading | ready | error\` string, so \`const status = useScript(src)\` reads true
- **Deduplication** - a module-level registry keyed by \`src\` guarantees one shared \`<script>\` tag no matter how many components request the same source; all of them re-render when it resolves
- **Conditional loading** - pass \`null\`/\`undefined\` (or \`shouldPreventLoad\`) to stay \`idle\` and inject nothing
- **Adopts existing tags** - reuses a matching \`<script>\` already in the DOM (SSR'd or added by another library) instead of re-injecting
- **Ref-counted cleanup** - \`removeOnUnmount\` removes the tag only when the last subscriber unmounts
- **SSR-safe & StrictMode-safe** - built on \`useSyncExternalStore\`; returns \`idle\` on the server and a double-mount never injects two tags

## Basic Usage
\`\`\`tsx
const status = useScript("https://js.stripe.com/v3");
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StatusDemo>;

export const Default: Story = {
  render: () => <StatusDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Inject a script and watch the status resolve from loading to ready.",
      },
      source: {
        language: "tsx",
        code: `import { useScript } from "@usefy/use-script";

function StripeCheckout() {
  const status = useScript("https://js.stripe.com/v3", {
    attributes: { id: "stripe-js" },
  });

  if (status === "loading") return <span>Loading payment form…</span>;
  if (status === "error") return <span>Failed to load Stripe.</span>;
  if (status !== "ready") return null;

  return <PaymentForm stripe={window.Stripe(PUBLISHABLE_KEY)} />;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("status").textContent).toBe("ready");
    });
  },
};

export const Deduplication: Story = {
  render: () => <DedupDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Two components, one <script> tag — the hook shares a single load across all callers.",
      },
      source: {
        language: "tsx",
        code: `import { useScript } from "@usefy/use-script";

// Both components request the same src. Only ONE <script> is created;
// both observe the same status and re-render together when it loads.
function WidgetA() {
  const status = useScript("https://cdn.example.com/widget.js");
  return <div>A: {status}</div>;
}

function WidgetB() {
  const status = useScript("https://cdn.example.com/widget.js");
  return <div>B: {status}</div>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("tag-count").textContent).toBe("1");
    });
  },
};

export const ConditionalLoading: Story = {
  render: () => <ConditionalDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Pass null as the src to defer loading until the user opts in (e.g. after consent).",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { useScript } from "@usefy/use-script";

function OptInAnalytics() {
  const [consented, setConsented] = useState(false);
  // null src → stays "idle", injects nothing until the user consents.
  const status = useScript(consented ? "https://cdn.example.com/analytics.js" : null);

  return (
    <button onClick={() => setConsented(true)}>
      {status === "ready" ? "Analytics on" : "Enable analytics"}
    </button>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("cond-status").textContent).toBe("idle");

    await userEvent.click(canvas.getByTestId("toggle"));
    await waitFor(() => {
      expect(canvas.getByTestId("cond-status").textContent).toBe("ready");
    });
  },
};
