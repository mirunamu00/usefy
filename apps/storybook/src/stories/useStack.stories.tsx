import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useStack } from "@usefy/use-stack";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

interface Snapshot {
  id: number;
  label: string;
}

/**
 * An undo-history stack: `push` records a change onto the top, `pop` undoes the
 * most recent one (and returns it). The top of the stack is highlighted.
 */
function UndoStackDemo() {
  const [history, { push, pop, peek, clear, reset }] = useStack<Snapshot>([
    { id: 1, label: "Open document" },
    { id: 2, label: "Type heading" },
  ]);
  const [log, setLog] = React.useState<string[]>([]);
  const nextId = React.useRef(3);

  const record = () => {
    const id = nextId.current++;
    push({ id, label: `Edit ${id}` });
  };

  const undo = () => {
    const last = pop();
    if (last) setLog((prev) => [...prev, last.label]);
  };

  const top = peek();

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useStack</h2>
      <p className={storyTheme.subtitle}>
        LIFO stack — <code>push</code> and <code>pop</code> both act on the top
      </p>

      <div className={`${storyTheme.statBox} mb-4`}>
        <p className={storyTheme.statLabel}>
          Depth:{" "}
          <span className={storyTheme.statValue} data-testid="size">
            {history.length}
          </span>{" "}
          <span className="text-gray-500 text-sm" data-testid="top">
            {top ? `top → ${top.label}` : "empty"}
          </span>
        </p>
        {/* Rendered top-first so the top of the stack sits at the top visually. */}
        <ol className="mt-2 space-y-1" data-testid="stack">
          {[...history].reverse().map((snap, i) => (
            <li
              key={snap.id}
              className={`px-3 py-2 rounded-md text-sm border ${
                i === 0
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
              data-testid={`item-${snap.id}`}
            >
              {i === 0 ? "▶ " : ""}
              {snap.label}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={storyTheme.buttonPrimary}
          onClick={record}
          data-testid="push-btn"
        >
          Push edit
        </button>
        <button
          className={storyTheme.buttonSuccess}
          onClick={undo}
          disabled={history.length === 0}
          data-testid="pop-btn"
        >
          Undo (pop)
        </button>
        <button
          className={storyTheme.buttonNeutral}
          onClick={reset}
          data-testid="reset-btn"
        >
          Reset
        </button>
        <button
          className={storyTheme.buttonDanger}
          onClick={clear}
          data-testid="clear-btn"
        >
          Clear
        </button>
      </div>

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>
          Undone:{" "}
          <span className="text-gray-600 text-sm" data-testid="log">
            {log.length ? log.join(" → ") : "nothing yet"}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * A plain numeric stack showing batch push and LIFO drain order.
 */
function NumberStackDemo() {
  const [stack, { push, pop }] = useStack<number>([]);
  const nextValue = React.useRef(1);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Number Stack</h2>
      <p className={storyTheme.subtitle}>Batch push, then pop from the top</p>

      <div className="flex gap-2 mb-4">
        <button
          className={storyTheme.buttonPrimary}
          onClick={() => push(nextValue.current++)}
          data-testid="push-one"
        >
          Push
        </button>
        <button
          className={storyTheme.buttonSecondary}
          onClick={() =>
            push(nextValue.current++, nextValue.current++, nextValue.current++)
          }
          data-testid="push-batch"
        >
          Push 3
        </button>
        <button
          className={storyTheme.buttonSuccess}
          onClick={() => pop()}
          disabled={stack.length === 0}
          data-testid="pop-num-btn"
        >
          Pop top
        </button>
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Items:{" "}
          <span className={storyTheme.statValue} data-testid="count">
            {stack.length}
          </span>{" "}
          <span className="text-gray-500 text-sm" data-testid="values">
            [{stack.join(", ")}]
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof UndoStackDemo> = {
  title: "Hooks/useStack",
  component: UndoStackDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `A hook for managing a LIFO (last-in, first-out) stack as React state with immutable, ergonomic updates. The LIFO sibling of \`useQueue\`.

## Features
- **Immutable updates** - Every change produces a new array; the returned stack is \`readonly T[]\`
- **LIFO semantics** - \`push\` and \`pop\` both operate on the top (the array's end)
- **\`pop\` returns the item** - Remove and read the value in one call (\`undefined\` when empty)
- **\`peek\`** - Read the top item without mutating; stable and always current
- **Stable actions** - Action identities never change, safe as effect dependencies
- **Lazy init** - Accepts an array, an iterable, or a factory (like \`useState\`)
- **No wasted renders** - No-op updates (empty push, empty pop/clear) are skipped
- **TypeScript generics** - Full \`<T>\` type inference

## Basic Usage
\`\`\`tsx
const [stack, { push, pop, peek }] = useStack<Snapshot>([]);
push(snapshot);       // push onto the top
const last = pop();   // pop the top + get the item
\`\`\`

> Read \`top\` / \`bottom\` / \`size\` directly from the returned stack:
> \`stack[stack.length - 1]\`, \`stack[0]\`, \`stack.length\`.
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof UndoStackDemo>;

export const Default: Story = {
  render: () => <UndoStackDemo />,
  parameters: {
    docs: {
      description: {
        story: "Push edits onto the stack and undo them one at a time in LIFO order.",
      },
      source: {
        code: `import { useStack } from "@usefy/use-stack";

function Editor() {
  const [history, { push, pop, peek }] = useStack<Snapshot>([]);

  const undo = () => {
    const last = pop(); // pop the top + get the item
    if (last) restore(last);
  };

  return (
    <>
      <button onClick={() => push(newSnapshot)}>Record change</button>
      <button onClick={undo} disabled={history.length === 0}>
        Undo {peek()?.label}
      </button>
      <p>History depth: {history.length}</p>
    </>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Seeded with two snapshots; "Type heading" is the top.
    await expect(canvas.getByTestId("size")).toHaveTextContent("2");
    await expect(canvas.getByTestId("top")).toHaveTextContent("Type heading");

    // Push an edit -> depth 3, new top.
    await userEvent.click(canvas.getByTestId("push-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("3");
      expect(canvas.getByTestId("top")).toHaveTextContent("Edit 3");
    });

    // Undo pops the top (Edit 3) -> logged, top back to Type heading.
    await userEvent.click(canvas.getByTestId("pop-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("2");
      expect(canvas.getByTestId("top")).toHaveTextContent("Type heading");
      expect(canvas.getByTestId("log")).toHaveTextContent("Edit 3");
    });

    // Reset back to the initial two snapshots.
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("2");
      expect(canvas.getByTestId("top")).toHaveTextContent("Type heading");
    });

    // Clear empties it.
    await userEvent.click(canvas.getByTestId("clear-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("0");
      expect(canvas.getByTestId("top")).toHaveTextContent("empty");
    });
  },
};

export const NumberStack: Story = {
  render: () => <NumberStackDemo />,
  parameters: {
    docs: {
      description: {
        story: "Batch push with the variadic `push`, then pop from the top (LIFO).",
      },
      source: {
        code: `import { useStack } from "@usefy/use-stack";

function NumberStack() {
  const [stack, { push, pop }] = useStack<number>([]);

  return (
    <>
      <button onClick={() => push(1, 2, 3)}>Push 3</button>
      <button onClick={() => pop()}>Pop top</button>
      <p>Items: {stack.length}</p>
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

    // Batch-push three values.
    await userEvent.click(canvas.getByTestId("push-batch"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("3");
      expect(canvas.getByTestId("values")).toHaveTextContent("[1, 2, 3]");
    });

    // Pop the top (value 3) — LIFO.
    await userEvent.click(canvas.getByTestId("pop-num-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("2");
      expect(canvas.getByTestId("values")).toHaveTextContent("[1, 2]");
    });
  },
};
