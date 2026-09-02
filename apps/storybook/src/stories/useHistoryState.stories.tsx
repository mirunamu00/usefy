import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useHistoryState } from "@usefy/use-history-state";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * A counter with full undo/redo history (the canonical example).
 */
function CounterHistoryDemo() {
  const {
    state,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    history,
    currentIndex,
  } = useHistoryState(0, { limit: 20 });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useHistoryState</h2>
      <p className={storyTheme.subtitle}>
        State with built-in <code>undo</code> / <code>redo</code>
      </p>

      <div className={`${storyTheme.statBox} mb-4`}>
        <p className={storyTheme.statLabel}>
          Count:{" "}
          <span className={storyTheme.statValue} data-testid="count">
            {state}
          </span>{" "}
          <span className="text-zinc-500 text-sm" data-testid="position">
            (step {currentIndex + 1} / {history.length})
          </span>
        </p>
        <p className="mt-2 text-sm text-zinc-500" data-testid="timeline">
          [{history.join(", ")}]
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={storyTheme.buttonPrimary}
          onClick={() => set((c) => c + 1)}
          data-testid="inc-btn"
        >
          +1
        </button>
        <button
          className={storyTheme.buttonSecondary}
          onClick={() => set((c) => c - 1)}
          data-testid="dec-btn"
        >
          −1
        </button>
        <button
          className={storyTheme.buttonNeutral}
          onClick={undo}
          disabled={!canUndo}
          data-testid="undo-btn"
        >
          ⟲ Undo
        </button>
        <button
          className={storyTheme.buttonNeutral}
          onClick={redo}
          disabled={!canRedo}
          data-testid="redo-btn"
        >
          ⟳ Redo
        </button>
        <button
          className={storyTheme.buttonDanger}
          onClick={reset}
          data-testid="reset-btn"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/**
 * A text field with a history panel you can jump around with `goTo`.
 */
function TextHistoryDemo() {
  const { state, set, history, currentIndex, goTo } = useHistoryState("");

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>History Panel</h2>
      <p className={storyTheme.subtitle}>
        Type, then jump to any snapshot with <code>goTo</code>
      </p>

      <input
        className={storyTheme.input}
        value={state}
        onChange={(e) => set(e.target.value)}
        placeholder="Type something…"
        data-testid="field"
      />

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>Snapshots</p>
        <ol className="mt-2 space-y-1" data-testid="snapshots">
          {history.map((snapshot, i) => (
            <li key={i}>
              <button
                onClick={() => goTo(i)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm border ${
                  i === currentIndex
                    ? "border-violet-500 bg-violet-50 text-violet-700 font-medium"
                    : "border-zinc-200 bg-white text-zinc-600"
                }`}
                data-testid={`snapshot-${i}`}
              >
                {i}: {snapshot === "" ? "(empty)" : `"${snapshot}"`}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof CounterHistoryDemo> = {
  title: "Hooks/useHistoryState",
  component: CounterHistoryDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `A hook for state with built-in undo/redo history (time travel).

## Features
- **Undo / redo / goTo** - Step through or jump to any point on an immutable timeline
- **\`set(value | updater)\`** - Record a new state; accepts a value or a \`prev => next\` function
- **\`canUndo\` / \`canRedo\`** - Flags for disabling toolbar buttons
- **\`history\` + \`currentIndex\`** - The full timeline and your position in it
- **\`limit\`** - Bound memory; oldest entries drop off the front
- **\`clear\` / \`reset\`** - Collapse to the present, or return to the initial state
- **Stable controls** - Every function keeps its identity, safe as effect deps
- **No-op skipping** - Setting the current value again records nothing
- **TypeScript generics** - Full \`<T>\` type inference

## Basic Usage
\`\`\`tsx
const { state, set, undo, redo, canUndo, canRedo } = useHistoryState(initial, { limit: 50 });
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CounterHistoryDemo>;

export const Default: Story = {
  render: () => <CounterHistoryDemo />,
  parameters: {
    docs: {
      description: {
        story: "A counter that can undo and redo every change.",
      },
      source: {
        code: `import { useHistoryState } from "@usefy/use-history-state";

function Counter() {
  const { state, set, undo, redo, canUndo, canRedo } =
    useHistoryState(0, { limit: 50 });

  return (
    <>
      <span>{state}</span>
      <button onClick={() => set((c) => c + 1)}>+1</button>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("count")).toHaveTextContent("0");
    await expect(canvas.getByTestId("undo-btn")).toBeDisabled();

    // Increment twice.
    await userEvent.click(canvas.getByTestId("inc-btn"));
    await userEvent.click(canvas.getByTestId("inc-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("2");
      expect(canvas.getByTestId("timeline")).toHaveTextContent("[0, 1, 2]");
    });

    // Undo once -> 1, redo becomes available.
    await userEvent.click(canvas.getByTestId("undo-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("1");
      expect(canvas.getByTestId("redo-btn")).not.toBeDisabled();
    });

    // Redo -> back to 2.
    await userEvent.click(canvas.getByTestId("redo-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("2");
    });

    // Reset wipes back to the initial 0.
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("0");
      expect(canvas.getByTestId("undo-btn")).toBeDisabled();
    });
  },
};

export const HistoryPanel: Story = {
  render: () => <TextHistoryDemo />,
  parameters: {
    docs: {
      description: {
        story: "Jump to any past snapshot with `goTo`, driven by `history`.",
      },
      source: {
        code: `import { useHistoryState } from "@usefy/use-history-state";

function Editor() {
  const { state, set, history, currentIndex, goTo } = useHistoryState("");

  return (
    <>
      <input value={state} onChange={(e) => set(e.target.value)} />
      <ol>
        {history.map((snap, i) => (
          <li key={i} onClick={() => goTo(i)} aria-current={i === currentIndex}>
            {i}: {snap}
          </li>
        ))}
      </ol>
    </>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const field = canvas.getByTestId("field");
    await userEvent.type(field, "hi");
    await waitFor(() => {
      // Snapshots: "", "h", "hi"
      expect(canvas.getByTestId("snapshot-2")).toBeInTheDocument();
    });

    // Jump back to the empty snapshot.
    await userEvent.click(canvas.getByTestId("snapshot-0"));
    await waitFor(() => {
      expect(canvas.getByTestId("field")).toHaveValue("");
    });
  },
};
