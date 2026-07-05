import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useAsync } from "@usefy/use-async";
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
 * A fetch-like task that auto-runs on mount (`immediate`), can be re-run with
 * `execute`, and cancelled/cleared with `reset`.
 */
function ImmediateDemo() {
  const [shouldFail, setShouldFail] = useState(false);

  const { data, error, status, isLoading, execute, reset } = useAsync(
    async (signal: AbortSignal) => {
      // Simulated network latency — honours the AbortSignal.
      await sleep(1200, signal);
      if (shouldFail) throw new Error("Network request failed");
      return { name: "Ada Lovelace", id: Math.floor(Math.random() * 1000) };
    },
    // immediate defaults to true — this loads on mount.
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useAsync</h2>
      <p className={storyTheme.subtitle}>
        full async lifecycle — auto-runs on mount, abortable, resettable
      </p>

      <label className="flex items-center gap-2 mb-4 text-sm text-gray-700">
        <input
          type="checkbox"
          data-testid="fail-toggle"
          checked={shouldFail}
          onChange={(e) => setShouldFail(e.target.checked)}
        />
        Make the next request fail
      </label>

      <div className={storyTheme.buttonGroup}>
        <button
          className={storyTheme.buttonPrimary}
          data-testid="reload"
          disabled={isLoading}
          onClick={() => execute()}
        >
          {isLoading ? "Loading…" : "Reload"}
        </button>
        <button
          className={storyTheme.buttonSecondary}
          data-testid="cancel"
          onClick={reset}
        >
          Cancel / Reset
        </button>
      </div>

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          status:{" "}
          <span className={storyTheme.statValue} data-testid="status">
            {status}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          isLoading:{" "}
          <span className={storyTheme.statText} data-testid="loading">
            {String(isLoading)}
          </span>
        </p>
      </div>

      {status === "success" && (
        <div className={storyTheme.messageSuccess} data-testid="result">
          ✅ Loaded {data?.name} (#{data?.id})
        </div>
      )}
      {status === "error" && (
        <div className={storyTheme.messageError} data-testid="error">
          ❌ {error?.message}
        </div>
      )}
    </div>
  );
}

/**
 * A long request you can cancel mid-flight. `reset()` aborts the in-flight
 * `AbortController` and returns to idle — the request never lands.
 */
function CancellationDemo() {
  const { status, isLoading, execute, reset } = useAsync(
    async (signal: AbortSignal) => {
      await sleep(2000, signal); // long enough to cancel by hand
      return "done";
    },
    { immediate: false },
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Abortable</h2>
      <p className={storyTheme.subtitle}>
        start a slow request, then cancel it — the signal is aborted and state
        returns to idle
      </p>

      <div className={storyTheme.buttonGroup}>
        <button
          className={storyTheme.buttonPrimary}
          data-testid="start"
          disabled={isLoading}
          onClick={() => execute()}
        >
          {isLoading ? "Running…" : "Start slow request"}
        </button>
        <button
          className={storyTheme.buttonSecondary}
          data-testid="abort"
          disabled={!isLoading}
          onClick={reset}
        >
          Cancel
        </button>
      </div>

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          status:{" "}
          <span className={storyTheme.statValue} data-testid="abort-status">
            {status}
          </span>
        </p>
      </div>
    </div>
  );
}

const meta: Meta<typeof ImmediateDemo> = {
  title: "Hooks/useAsync",
  component: ImmediateDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Manage the full lifecycle of a single async task (\`idle → pending → success | error\`) with an **object-style** return, **\`AbortController\` cancellation**, and an **\`immediate\` auto-run** on mount. The abortable, self-running sibling of \`useAsyncFn\`.

Deliberately **not** a query cache (no keys, no cross-component dedupe, no revalidation) — for that use TanStack Query. \`useAsync\` is a focused local-async primitive.

Returns \`{ data, error, status, isLoading, execute, reset }\`. Your function receives an \`AbortSignal\` as its **first argument** — wire it into \`fetch\` so obsolete requests are truly cancelled.

## Features
- **Object-style state** — \`{ data, error, status, isLoading }\` (\`status\` is the source of truth; \`data\` retained on error)
- **AbortController** — each \`execute\` gets a fresh signal; the previous request is aborted when a new one starts, on \`reset()\`, and on unmount
- **immediate** — auto-runs once on mount by default (pass \`immediate: false\` to opt out); never runs during SSR
- **Race-safe** — a superseded call can never update state even if it resolves late
- **Stable \`execute\` / \`reset\`** — memoized identity; pass an inline \`fn\` each render without stale closures

## Basic Usage
\`\`\`tsx
const { data, error, isLoading, execute, reset } = useAsync(
  async (signal: AbortSignal, id: string) => {
    const res = await fetch(\`/api/user/\${id}\`, { signal });
    return res.json();
  },
  { immediate: true, args: ["42"] },
);
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof ImmediateDemo>;

export const Default: Story = {
  render: () => <ImmediateDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Auto-loads on mount (immediate), then lets you Reload or Cancel/Reset. Tick the checkbox before reloading to see the error path.",
      },
      source: {
        language: "tsx",
        code: `import { useAsync } from "@usefy/use-async";

function UserProfile({ id }: { id: string }) {
  const { data, error, isLoading, execute, reset } = useAsync(
    async (signal: AbortSignal, userId: string) => {
      const res = await fetch(\`/api/user/\${userId}\`, { signal });
      if (!res.ok) throw new Error("Failed to load user");
      return (await res.json()) as { name: string };
    },
    { immediate: true, args: [id] }, // auto-load on mount with \`id\`
  );

  if (isLoading) return <p>Loading…</p>;
  if (error) return <button onClick={() => execute(id)}>Retry</button>;
  return (
    <div>
      <h1>{data?.name}</h1>
      <button onClick={reset}>Clear</button>
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Immediate auto-run: already pending on mount, then success.
    await expect(canvas.getByTestId("status")).toHaveTextContent("pending");
    await waitFor(
      () => expect(canvas.getByTestId("status")).toHaveTextContent("success"),
      { timeout: 3000 },
    );
    await expect(canvas.getByTestId("result")).toBeInTheDocument();

    // Reset returns to idle.
    await userEvent.click(canvas.getByTestId("cancel"));
    await expect(canvas.getByTestId("status")).toHaveTextContent("idle");

    // Error path via Reload.
    await userEvent.click(canvas.getByTestId("fail-toggle"));
    await userEvent.click(canvas.getByTestId("reload"));
    await waitFor(
      () => expect(canvas.getByTestId("status")).toHaveTextContent("error"),
      { timeout: 3000 },
    );
    await expect(canvas.getByTestId("error")).toBeInTheDocument();
  },
};

export const Cancellation: Story = {
  render: () => <CancellationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Start a slow request and cancel it mid-flight. reset() aborts the AbortSignal and returns to idle — the response is discarded.",
      },
      source: {
        language: "tsx",
        code: `import { useAsync } from "@usefy/use-async";

function SearchResults({ query }: { query: string }) {
  const { data, status, execute, reset } = useAsync(
    async (signal: AbortSignal, q: string) => {
      const res = await fetch(\`/api/search?q=\${q}\`, { signal });
      return res.json();
    },
    { immediate: false },
  );

  return (
    <div>
      <button onClick={() => execute(query)} disabled={status === "pending"}>
        Search
      </button>
      {/* Cancel aborts the fetch (signal) and resets to idle. */}
      <button onClick={reset} disabled={status !== "pending"}>
        Cancel
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("abort-status")).toHaveTextContent("idle");

    await userEvent.click(canvas.getByTestId("start"));
    await expect(canvas.getByTestId("abort-status")).toHaveTextContent(
      "pending",
    );

    // Cancel mid-flight — back to idle, no success/error.
    await userEvent.click(canvas.getByTestId("abort"));
    await expect(canvas.getByTestId("abort-status")).toHaveTextContent("idle");

    // Confirm it stays idle (the aborted request must not land).
    await new Promise((r) => setTimeout(r, 300));
    await expect(canvas.getByTestId("abort-status")).toHaveTextContent("idle");
  },
};
