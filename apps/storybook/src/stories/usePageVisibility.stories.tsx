import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { usePageVisibility } from "@usefy/use-page-visibility";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Live visibility indicator — switch to another tab and back to watch it flip.
 */
function IndicatorDemo() {
  const visible = usePageVisibility();

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>usePageVisibility</h2>
      <p className={storyTheme.subtitle}>
        Switch to another browser tab (or minimize the window) and come back to
        watch this update. The value flips on the document{" "}
        <code>visibilitychange</code> event.
      </p>

      <div
        className={visible ? storyTheme.cardSuccess : storyTheme.cardWarning}
        data-testid="status-card"
      >
        <p className={storyTheme.statLabel}>
          The tab is currently{" "}
          <span className={storyTheme.statValue} data-testid="status-value">
            {visible ? "visible" : "hidden"}
          </span>
        </p>
      </div>

      <p className={`${storyTheme.statTextSecondary} mt-4 text-sm`}>
        On the server (SSR) the hook returns <code>true</code> — the page is
        optimistically treated as visible, avoiding a hydration mismatch.
      </p>
    </div>
  );
}

/**
 * Pause-while-hidden pattern: a counter that only ticks while the tab is
 * visible, driven by the `visible` boolean in an effect dependency.
 */
function PauseWhileHiddenDemo() {
  const visible = usePageVisibility();
  const [ticks, setTicks] = React.useState(0);

  React.useEffect(() => {
    if (!visible) return; // don't run work in the background
    const id = window.setInterval(() => setTicks((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [visible]);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Pause While Hidden</h2>
      <p className={storyTheme.subtitle}>
        The counter ticks once per second, but only while the tab is visible.
        Switch away and the interval is torn down; return and it resumes.
      </p>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Ticks:{" "}
          <span className={storyTheme.statValue} data-testid="ticks-value">
            {ticks}
          </span>
        </p>
        <p className={`${storyTheme.statLabel} mt-2`}>
          Interval:{" "}
          <span className={storyTheme.statValue} data-testid="running-value">
            {visible ? "running" : "paused"}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * onChange callback pattern: log each transition as it happens.
 */
function OnChangeDemo() {
  const [log, setLog] = React.useState<string[]>([]);

  usePageVisibility((visible) => {
    setLog((prev) =>
      [
        `${new Date().toLocaleTimeString()} → ${visible ? "visible" : "hidden"}`,
        ...prev,
      ].slice(0, 6)
    );
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>onChange Callback</h2>
      <p className={storyTheme.subtitle}>
        Pass an <code>onChange</code> callback to react to each transition
        directly (pause a video, mute audio, stop polling). It fires from the
        event handler, never on mount.
      </p>

      <div className={storyTheme.statBox} data-testid="log">
        {log.length === 0 ? (
          <p className={storyTheme.statTextSecondary}>
            No transitions yet — switch tabs to log one.
          </p>
        ) : (
          log.map((line, i) => (
            <p key={i} className={storyTheme.statLabel}>
              {line}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof IndicatorDemo> = {
  title: "Hooks/usePageVisibility",
  component: IndicatorDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Track whether the page (tab/window) is currently visible to the user, via the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API). Returns \`true\` while the tab is in the foreground and \`false\` while it is hidden.

## Features
- **Boolean-first** - \`const visible = usePageVisibility()\` returns a plain \`boolean\`
- **onChange callback** - optional \`usePageVisibility((visible) => …)\` fires on each transition (latest-callback ref, never re-subscribes)
- **SSR-safe & concurrent-safe** - built on \`useSyncExternalStore\`; returns \`true\` on the server, no hydration mismatch
- **Leak-free** - the \`visibilitychange\` listener is cleaned up on unmount

## Basic Usage
\`\`\`tsx
const visible = usePageVisibility();
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
          "A live indicator of the current tab visibility. Switch tabs to see it flip between `visible` and `hidden`.",
      },
      source: {
        language: "tsx",
        code: `import { usePageVisibility } from "@usefy/use-page-visibility";

function TabStatus() {
  const visible = usePageVisibility();
  return <span>{visible ? "👀 Active" : "💤 Background"}</span>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      // The story tab is in the foreground, so the hook reports "visible".
      expect(canvas.getByTestId("status-value")).toHaveTextContent("visible");
    });
  },
};

export const PauseWhileHidden: Story = {
  render: () => <PauseWhileHiddenDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Gate expensive work behind visibility — the interval only runs while the tab is visible, using `visible` as an effect dependency.",
      },
      source: {
        language: "tsx",
        code: `import { usePageVisibility } from "@usefy/use-page-visibility";
import { useEffect, useState } from "react";

function LiveFeed() {
  const visible = usePageVisibility();
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (!visible) return; // don't poll in the background
    const id = setInterval(() => setTicks((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [visible]);

  return <span>{ticks}</span>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("running-value")).toHaveTextContent("running");
    });
  },
};

export const OnChangeCallback: Story = {
  render: () => <OnChangeDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Pass an `onChange` callback to run side effects on each transition — e.g. pause/resume a video player.",
      },
      source: {
        language: "tsx",
        code: `import { usePageVisibility } from "@usefy/use-page-visibility";

function Player({ videoRef }) {
  usePageVisibility((visible) => {
    if (visible) videoRef.current?.play();
    else videoRef.current?.pause();
  });

  return <video ref={videoRef} />;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("log")).toBeInTheDocument();
    });
  },
};
