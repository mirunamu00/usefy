import React, { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { usePolling } from "@usefy/use-polling";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/** Sleep that rejects with an AbortError when its signal is aborted. */
function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

/**
 * Polls a fake "server tick" every second — shows the live value, the loop
 * status, and lets you Pause/Resume. The poll count only advances while
 * `isPolling` is true, proving the loop is genuinely halted on pause.
 */
function LivePollingDemo() {
  const tick = useRef(0);

  const { data, status, isPolling, pause, resume } = usePolling(
    async (signal: AbortSignal) => {
      await sleep(250, signal); // simulated latency, honours the signal
      tick.current += 1;
      return { count: tick.current, at: new Date().toLocaleTimeString() };
    },
    { interval: 1000, immediate: true },
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>usePolling</h2>
      <p className={storyTheme.subtitle}>
        polls every 1s — non-overlapping, pausable, resumable
      </p>

      <div className={storyTheme.buttonGroup}>
        <button
          className={storyTheme.buttonPrimary}
          data-testid="pause"
          disabled={!isPolling}
          onClick={pause}
        >
          Pause
        </button>
        <button
          className={storyTheme.buttonSecondary}
          data-testid="resume"
          disabled={isPolling}
          onClick={resume}
        >
          Resume
        </button>
      </div>

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          isPolling:{" "}
          <span className={storyTheme.statValue} data-testid="is-polling">
            {String(isPolling)}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          status:{" "}
          <span className={storyTheme.statText} data-testid="status">
            {status}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          poll #:{" "}
          <span className={storyTheme.statValue} data-testid="count">
            {data?.count ?? 0}
          </span>
        </p>
        {data && (
          <p className={storyTheme.statLabel}>
            last tick at{" "}
            <span className={storyTheme.statTextSecondary}>{data.at}</span>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The same loop, but you can force the poll to fail. With `backoff` on, each
 * consecutive failure waits longer before retrying; the first success resets the
 * delay back to the base interval.
 */
function BackoffDemo() {
  const [shouldFail, setShouldFail] = useState(false);
  const failRef = useRef(shouldFail);
  failRef.current = shouldFail;

  const { status, error, isPolling } = usePolling(
    async (signal: AbortSignal) => {
      await sleep(200, signal);
      if (failRef.current) throw new Error("Endpoint unavailable (503)");
      return "ok";
    },
    { interval: 800, immediate: true, backoff: { factor: 2, maxInterval: 6400 } },
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Backoff on failure</h2>
      <p className={storyTheme.subtitle}>
        consecutive failures back off exponentially; a success resets the delay
      </p>

      <label className="flex items-center gap-2 mb-4 text-sm text-gray-700">
        <input
          type="checkbox"
          data-testid="fail-toggle"
          checked={shouldFail}
          onChange={(e) => setShouldFail(e.target.checked)}
        />
        Make the polls fail
      </label>

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          isPolling:{" "}
          <span className={storyTheme.statValue}>{String(isPolling)}</span>
        </p>
        <p className={storyTheme.statLabel}>
          status:{" "}
          <span className={storyTheme.statValue} data-testid="backoff-status">
            {status}
          </span>
        </p>
      </div>

      {status === "error" && (
        <div className={storyTheme.messageError} data-testid="backoff-error">
          ❌ {error?.message} — retrying with a growing delay…
        </div>
      )}
      {status === "success" && (
        <div className={storyTheme.messageSuccess} data-testid="backoff-ok">
          ✅ Healthy — polling at the base interval
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof LivePollingDemo> = {
  title: "Hooks/usePolling",
  component: LivePollingDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Poll an async function on an interval — with **non-overlapping** self-scheduling ticks, imperative \`pause\`/\`resume\` (plus \`start\`/\`stop\` aliases), a declarative \`enabled\` gate, and optional **exponential backoff** on consecutive failures.

Reuses the shared async-state shape of \`useAsyncFn\` / \`useAsync\`: the latest poll is \`{ data, error, status, isLoading }\` (\`status\` is the source of truth; \`data\` retained on error), plus \`isPolling\` and the controls. Your function receives an \`AbortSignal\` first — wire it into \`fetch\` so a paused/stopped poll is truly cancelled.

The next tick is scheduled **only after** the current poll settles (self-rescheduling \`setTimeout\`, never a stacking \`setInterval\`), so a slow \`fn\` can never overlap requests.

## Features
- **No overlapping polls** — at most one poll in flight; the next is scheduled after the current settles
- **pause / resume** (and \`start\` / \`stop\` aliases) — imperative control; \`isPolling\` reflects the loop
- **enabled** — declarative master gate; while \`false\`, \`resume()\` can't start polling
- **immediate** — first poll fires right away by default (\`immediate: false\` waits one interval)
- **backoff** — grow the delay on consecutive failures (\`true\`, \`{ factor, maxInterval }\`, or a custom fn); resets on success
- **AbortController** — the in-flight poll is aborted on pause/stop/\`enabled:false\`/unmount
- SSR-safe & StrictMode-safe — exactly one self-scheduling loop, no runaway timers

## Basic Usage
\`\`\`tsx
const { data, isPolling, pause, resume } = usePolling(
  async (signal: AbortSignal) => {
    const res = await fetch("/api/status", { signal });
    return res.json();
  },
  { interval: 5000, backoff: true },
);
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof LivePollingDemo>;

export const Default: Story = {
  render: () => <LivePollingDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Polls every second (the count only advances while running). Pause halts the loop and aborts the in-flight poll; Resume restarts it.",
      },
      source: {
        language: "tsx",
        code: `import { usePolling } from "@usefy/use-polling";

function LiveStatus() {
  const { data, status, isPolling, pause, resume } = usePolling(
    async (signal: AbortSignal) => {
      const res = await fetch("/api/status", { signal });
      return (await res.json()) as { online: number };
    },
    { interval: 1000, immediate: true },
  );

  return (
    <div>
      <p>{data ? \`\${data.online} online\` : "…"} ({status})</p>
      <button onClick={isPolling ? pause : resume}>
        {isPolling ? "Pause" : "Resume"}
      </button>
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("is-polling")).toHaveTextContent("true");

    // Wait for at least one poll to land.
    await waitFor(
      () => expect(canvas.getByTestId("status")).toHaveTextContent("success"),
      { timeout: 3000 },
    );
    const first = Number(canvas.getByTestId("count").textContent);

    // The count keeps advancing while polling.
    await waitFor(
      () =>
        expect(
          Number(canvas.getByTestId("count").textContent),
        ).toBeGreaterThan(first),
      { timeout: 3000 },
    );

    // Pause halts the loop.
    await userEvent.click(canvas.getByTestId("pause"));
    await expect(canvas.getByTestId("is-polling")).toHaveTextContent("false");
    const paused = Number(canvas.getByTestId("count").textContent);

    // No new polls while paused.
    await new Promise((r) => setTimeout(r, 1500));
    await expect(canvas.getByTestId("count")).toHaveTextContent(String(paused));

    // Resume restarts it.
    await userEvent.click(canvas.getByTestId("resume"));
    await expect(canvas.getByTestId("is-polling")).toHaveTextContent("true");
    await waitFor(
      () =>
        expect(
          Number(canvas.getByTestId("count").textContent),
        ).toBeGreaterThan(paused),
      { timeout: 3000 },
    );
  },
};

export const Backoff: Story = {
  render: () => <BackoffDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Toggle failures on: each consecutive failure waits longer (exponential backoff, capped at maxInterval). Toggle back off and the next success resets the delay.",
      },
      source: {
        language: "tsx",
        code: `import { usePolling } from "@usefy/use-polling";

function HealthCheck() {
  const { status, error } = usePolling(
    async (signal: AbortSignal) => {
      const res = await fetch("/api/health", { signal });
      if (!res.ok) throw new Error("unhealthy");
      return res.json();
    },
    {
      interval: 800,
      // Grow the retry delay on repeated failures, reset on success.
      backoff: { factor: 2, maxInterval: 30_000 },
    },
  );

  if (status === "error") return <p>Down: {error?.message} — backing off…</p>;
  return <p>Status: {status}</p>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Healthy to start.
    await waitFor(
      () =>
        expect(canvas.getByTestId("backoff-status")).toHaveTextContent(
          "success",
        ),
      { timeout: 3000 },
    );

    // Force failures -> error path (and the delay starts backing off).
    await userEvent.click(canvas.getByTestId("fail-toggle"));
    await waitFor(
      () =>
        expect(canvas.getByTestId("backoff-status")).toHaveTextContent("error"),
      { timeout: 3000 },
    );
    await expect(canvas.getByTestId("backoff-error")).toBeInTheDocument();

    // Recover -> back to success, delay resets.
    await userEvent.click(canvas.getByTestId("fail-toggle"));
    await waitFor(
      () =>
        expect(canvas.getByTestId("backoff-status")).toHaveTextContent(
          "success",
        ),
      { timeout: 8000 },
    );
  },
};
