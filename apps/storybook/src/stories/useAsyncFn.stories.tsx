import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useAsyncFn } from "@usefy/use-async-fn";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A simulated API call that can be toggled to fail. */
function LifecycleDemo() {
  const [shouldFail, setShouldFail] = useState(false);

  const [state, run] = useAsyncFn(async (name: string) => {
    await sleep(500);
    if (shouldFail) throw new Error("Network request failed");
    return { name, id: Math.floor(Math.random() * 1000) };
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useAsyncFn</h2>
      <p className={storyTheme.subtitle}>
        run a manual-trigger async function &amp; track its lifecycle
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

      <button
        className={storyTheme.buttonPrimary}
        data-testid="run"
        disabled={state.isLoading}
        onClick={() => run("ada")}
      >
        {state.isLoading ? "Loading…" : "Fetch user"}
      </button>

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          status:{" "}
          <span className={storyTheme.statValue} data-testid="status">
            {state.status}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          isLoading:{" "}
          <span className={storyTheme.statText} data-testid="loading">
            {String(state.isLoading)}
          </span>
        </p>
      </div>

      {state.status === "success" && (
        <div className={`${storyTheme.messageSuccess}`} data-testid="result">
          ✅ Loaded {state.data?.name} (#{state.data?.id})
        </div>
      )}
      {state.status === "error" && (
        <div className={`${storyTheme.messageError}`} data-testid="error">
          ❌ {state.error?.message}
        </div>
      )}
    </div>
  );
}

/** Fires two runs back-to-back where the FIRST resolves last, proving the
 *  stale-response guard: only the latest call is allowed to win. */
function RaceGuardDemo() {
  const [state, run] = useAsyncFn(async (label: string, delay: number) => {
    await sleep(delay);
    return label;
  });

  const fireOutOfOrder = () => {
    // Older, slow call — its late resolution must be discarded.
    void run("STALE (slow)", 600);
    // Newer, fast call — this one must win.
    void run("LATEST (fast)", 150);
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Race-safe</h2>
      <p className={storyTheme.subtitle}>
        fire two runs; the slow earlier one resolves last but is ignored
      </p>

      <button
        className={storyTheme.buttonSecondary}
        data-testid="race"
        onClick={fireOutOfOrder}
      >
        Fire slow → fast
      </button>

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          winning result:{" "}
          <span className={storyTheme.statValue} data-testid="winner">
            {state.data ?? "—"}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          status:{" "}
          <span className={storyTheme.statText} data-testid="race-status">
            {state.status}
          </span>
        </p>
      </div>
    </div>
  );
}

const meta: Meta<typeof LifecycleDemo> = {
  title: "Hooks/useAsyncFn",
  component: LifecycleDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Run a single async function on demand and track its lifecycle (\`idle → pending → success | error\`). The manual-trigger core for event-driven work — button clicks and form submits — and the foundation \`useAsync\` builds on.

Returns a \`[state, run]\` tuple. \`state\` is \`{ data, error, status, isLoading }\`; \`run(...args)\` forwards its arguments to your function.

## Features
- **Lifecycle state** — \`status\` (\`idle\`/\`pending\`/\`success\`/\`error\`) with an \`isLoading\` mirror
- **Race-safe** — if you call \`run\` again before the last one settles, only the latest call updates state
- **Unmount-safe** — no state updates (or callbacks) after the component unmounts
- **Stable \`run\`** — memoized identity; pass an inline \`fn\` each render without stale closures
- **Never rejects** — \`run\` resolves with the value (or \`undefined\` on failure); errors surface via \`state.error\`

## Basic Usage
\`\`\`tsx
const [state, run] = useAsyncFn(async (id: string) => {
  const res = await fetch(\`/api/user/\${id}\`);
  return res.json();
});
// <button onClick={() => run("42")} disabled={state.isLoading}>Load</button>
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof LifecycleDemo>;

export const Default: Story = {
  render: () => <LifecycleDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Click to run a simulated request; watch it move through pending → success. Tick the checkbox first to see the error path.",
      },
      source: {
        language: "tsx",
        code: `import { useAsyncFn } from "@usefy/use-async-fn";

function UserLoader() {
  const [state, run] = useAsyncFn(async (id: string) => {
    const res = await fetch(\`/api/user/\${id}\`);
    if (!res.ok) throw new Error("Failed to load user");
    return res.json();
  });

  return (
    <div>
      <button onClick={() => run("42")} disabled={state.isLoading}>
        {state.isLoading ? "Loading…" : "Load user"}
      </button>
      {state.status === "success" && <p>Hello {state.data.name}</p>}
      {state.status === "error" && <p role="alert">{state.error?.message}</p>}
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("status")).toHaveTextContent("idle");

    // Success path.
    await userEvent.click(canvas.getByTestId("run"));
    await expect(canvas.getByTestId("status")).toHaveTextContent("pending");
    await waitFor(
      () => expect(canvas.getByTestId("status")).toHaveTextContent("success"),
      { timeout: 2000 },
    );
    await expect(canvas.getByTestId("result")).toBeInTheDocument();

    // Error path.
    await userEvent.click(canvas.getByTestId("fail-toggle"));
    await userEvent.click(canvas.getByTestId("run"));
    await waitFor(
      () => expect(canvas.getByTestId("status")).toHaveTextContent("error"),
      { timeout: 2000 },
    );
    await expect(canvas.getByTestId("error")).toBeInTheDocument();
  },
};

export const RaceSafe: Story = {
  render: () => <RaceGuardDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Fires a slow call immediately followed by a fast one. The slow (earlier) call resolves last, but the stale-guard discards it — only the latest call wins.",
      },
      source: {
        language: "tsx",
        code: `import { useAsyncFn } from "@usefy/use-async-fn";

function Search() {
  const [state, run] = useAsyncFn(async (query: string) => {
    const res = await fetch(\`/api/search?q=\${query}\`);
    return res.json();
  });

  // Typing quickly fires overlapping requests — useAsyncFn guarantees the
  // result shown always belongs to the most recent run(), never a slow
  // earlier one that resolves out of order.
  return (
    <input
      onChange={(e) => run(e.target.value)}
      placeholder="Search…"
    />
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId("race"));

    // The fast (latest) call lands first.
    await waitFor(
      () => expect(canvas.getByTestId("winner")).toHaveTextContent("LATEST"),
      { timeout: 2000 },
    );

    // Give the slow earlier call time to resolve — it must NOT overwrite.
    await new Promise((r) => setTimeout(r, 700));
    await expect(canvas.getByTestId("winner")).toHaveTextContent("LATEST");
  },
};
