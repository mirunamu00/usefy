import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useIdle } from "@usefy/use-idle";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Live idle indicator with a short 3s timeout so it is easy to demo — stop
 * moving the mouse / typing for three seconds and watch it flip to "idle".
 */
function IndicatorDemo() {
  const idle = useIdle(3000);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useIdle</h2>
      <p className={storyTheme.subtitle}>
        Stop moving your mouse and typing for <strong>3 seconds</strong> and this
        will flip to <code>idle</code>. Any activity (move, click, key, scroll)
        instantly wakes it back up.
      </p>

      <div
        className={idle ? storyTheme.cardWarning : storyTheme.cardSuccess}
        data-testid="status-card"
      >
        <p className={storyTheme.statLabel}>
          The user is currently{" "}
          <span className={storyTheme.statValue} data-testid="status-value">
            {idle ? "idle" : "active"}
          </span>
        </p>
      </div>

      <p className={`${storyTheme.statTextSecondary} mt-4 text-sm`}>
        Activity listeners are throttled to reset the timer at most once every
        ~200ms, so high-frequency events don&apos;t thrash React state.
      </p>
    </div>
  );
}

/**
 * Auto-away pattern: track how long the user has been idle and surface an
 * "away" banner, the classic chat/presence use case.
 */
function AutoAwayDemo() {
  const idle = useIdle(2000);
  const [awaySince, setAwaySince] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (idle) {
      setAwaySince(new Date().toLocaleTimeString());
    } else {
      setAwaySince(null);
    }
  }, [idle]);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Auto-Away Presence</h2>
      <p className={storyTheme.subtitle}>
        After <strong>2 seconds</strong> of inactivity the user is marked away —
        exactly how chat apps flip your status to 🌙. Move the mouse to come
        back online.
      </p>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Status:{" "}
          <span className={storyTheme.statValue} data-testid="presence-value">
            {idle ? "🌙 Away" : "🟢 Online"}
          </span>
        </p>
        <p className={`${storyTheme.statLabel} mt-2`}>
          Away since:{" "}
          <span className={storyTheme.statValue} data-testid="away-since">
            {awaySince ?? "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Custom events: only keyboard activity resets the timer. Moving the mouse does
 * nothing; pressing a key wakes the user.
 */
function KeyboardOnlyDemo() {
  const idle = useIdle(3000, { events: ["keydown"] });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Keyboard-Only Activity</h2>
      <p className={storyTheme.subtitle}>
        This instance passes <code>{`{ events: ["keydown"] }`}</code>, so only
        typing counts as activity. Moving the mouse will let it fall idle after
        3 seconds; press any key to wake it.
      </p>

      <input
        className={storyTheme.input}
        placeholder="Type here to stay active…"
        data-testid="keyboard-input"
      />

      <div
        className={`${idle ? storyTheme.cardWarning : storyTheme.cardSuccess} mt-4`}
      >
        <p className={storyTheme.statLabel}>
          Status:{" "}
          <span className={storyTheme.statValue} data-testid="keyboard-status">
            {idle ? "idle" : "active"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof IndicatorDemo> = {
  title: "Hooks/useIdle",
  component: IndicatorDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Report whether the user has gone **inactive** after a timeout. \`const idle = useIdle(60_000)\` returns \`false\` while the user is active and flips to \`true\` once no activity has occurred for the given number of milliseconds. The next activity flips it back to \`false\`.

## Features
- **Boolean-first** — \`const idle = useIdle(60_000)\` returns a plain \`boolean\`
- **Throttled activity** — high-frequency events (\`mousemove\`, \`wheel\`, \`resize\`) reset the timer at most once every ~200ms, so React state never thrashes
- **Visibility-aware** — returning to a backgrounded tab counts as activity; backgrounding does not reset the timer, so the user is allowed to fall idle
- **Configurable** — custom \`events\`, \`initialState\`, and a target \`element\`
- **SSR-safe & concurrent-safe** — no listeners on the server, returns \`initialState\` inertly; every listener + timer is cleaned up on unmount

## Basic Usage
\`\`\`tsx
const idle = useIdle(60_000);
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof IndicatorDemo>;

export const Default: Story = {
  render: () => <IndicatorDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A live indicator with a short 3-second timeout. Stop interacting to see it flip to `idle`, then move the mouse to wake it.",
      },
      source: {
        language: "tsx",
        code: `import { useIdle } from "@usefy/use-idle";

function AwayBadge() {
  const idle = useIdle(60_000); // one minute

  return <span>{idle ? "💤 Away" : "🟢 Active"}</span>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      // The story just mounted with recent activity, so the user is active.
      expect(canvas.getByTestId("status-value")).toHaveTextContent("active");
    });
  },
};

export const AutoAway: Story = {
  render: () => <AutoAwayDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Drive presence state from `idle` — flip the user to 🌙 Away after a period of inactivity, the classic chat/collaboration pattern.",
      },
      source: {
        language: "tsx",
        code: `import { useIdle } from "@usefy/use-idle";
import { useEffect } from "react";

function Presence({ setStatus }) {
  const idle = useIdle(5 * 60_000); // 5 minutes

  useEffect(() => {
    setStatus(idle ? "away" : "online");
  }, [idle, setStatus]);

  return null;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("presence-value")).toHaveTextContent("Online");
    });
  },
};

export const KeyboardOnly: Story = {
  render: () => <KeyboardOnlyDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Restrict which events count as activity via the `events` option — here only `keydown` resets the timer, so mouse movement is ignored.",
      },
      source: {
        language: "tsx",
        code: `import { useIdle } from "@usefy/use-idle";

function TypingGuard() {
  // Only typing counts as activity; mouse movement is ignored.
  const idle = useIdle(3000, { events: ["keydown"] });

  return <span>{idle ? "Stopped typing" : "Typing…"}</span>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("keyboard-status")).toBeInTheDocument();
    });
  },
};
