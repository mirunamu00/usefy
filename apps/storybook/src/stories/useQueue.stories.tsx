import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useQueue } from "@usefy/use-queue";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

interface Task {
  id: number;
  label: string;
}

/**
 * A task runner that enqueues work and drains it front-to-front (the ROADMAP
 * example): `add` to the back, `remove` returns the processed item.
 */
function TaskQueueDemo() {
  const [queue, { add, remove, peek, clear, reset }] = useQueue<Task>([
    { id: 1, label: "Compile" },
    { id: 2, label: "Test" },
  ]);
  const [log, setLog] = React.useState<string[]>([]);
  const nextId = React.useRef(3);

  const enqueue = () => {
    const id = nextId.current++;
    add({ id, label: `Job ${id}` });
  };

  const processNext = () => {
    const task = remove();
    if (task) setLog((prev) => [...prev, task.label]);
  };

  const next = peek();

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useQueue</h2>
      <p className={storyTheme.subtitle}>
        FIFO queue — <code>add</code> to the back, <code>remove</code> from the
        front
      </p>

      <div className={`${storyTheme.statBox} mb-4`}>
        <p className={storyTheme.statLabel}>
          Pending:{" "}
          <span className={storyTheme.statValue} data-testid="size">
            {queue.length}
          </span>{" "}
          <span className="text-zinc-500 text-sm" data-testid="next">
            {next ? `next → ${next.label}` : "empty"}
          </span>
        </p>
        <ol className="mt-2 space-y-1" data-testid="queue">
          {queue.map((task, i) => (
            <li
              key={task.id}
              className={`px-3 py-2 rounded-md text-sm border ${
                i === 0
                  ? "border-violet-500 bg-violet-50 text-violet-700 font-medium"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
              data-testid={`item-${task.id}`}
            >
              {i === 0 && <span className={storyTheme.badgeAccent + " mr-2"}>Next</span>}
              {task.label}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={storyTheme.buttonPrimary}
          onClick={enqueue}
          data-testid="add-btn"
        >
          Enqueue
        </button>
        <button
          className={storyTheme.buttonSuccess}
          onClick={processNext}
          disabled={queue.length === 0}
          data-testid="process-btn"
        >
          Process next
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
          Processed:{" "}
          <span className="text-zinc-600 text-sm" data-testid="log">
            {log.length ? log.join(" → ") : "nothing yet"}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * A print-job style queue driven purely by numbers, showing batch enqueue.
 */
function PrintQueueDemo() {
  const [queue, { add, remove }] = useQueue<number>([]);
  const nextJob = React.useRef(1);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Print Queue</h2>
      <p className={storyTheme.subtitle}>Batch enqueue, drain from the front</p>

      <div className="flex gap-2 mb-4">
        <button
          className={storyTheme.buttonPrimary}
          onClick={() => add(nextJob.current++)}
          data-testid="add-one"
        >
          Add job
        </button>
        <button
          className={storyTheme.buttonSecondary}
          onClick={() => add(nextJob.current++, nextJob.current++, nextJob.current++)}
          data-testid="add-batch"
        >
          Add 3
        </button>
        <button
          className={storyTheme.buttonSuccess}
          onClick={() => remove()}
          disabled={queue.length === 0}
          data-testid="print-btn"
        >
          Print next
        </button>
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Jobs waiting:{" "}
          <span className={storyTheme.statValue} data-testid="count">
            {queue.length}
          </span>{" "}
          <span className="text-zinc-500 text-sm" data-testid="ids">
            [{queue.join(", ")}]
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof TaskQueueDemo> = {
  title: "Hooks/useQueue",
  component: TaskQueueDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `A hook for managing a FIFO (first-in, first-out) queue as React state with immutable, ergonomic updates.

## Features
- **Immutable updates** - Every change produces a new array; the returned queue is \`readonly T[]\`
- **FIFO semantics** - \`add\` enqueues to the back, \`remove\` dequeues from the front
- **\`remove\` returns the item** - Dequeue and read the value in one call (\`undefined\` when empty)
- **\`peek\`** - Read the front item without mutating; stable and always current
- **Stable actions** - Action identities never change, safe as effect dependencies
- **Lazy init** - Accepts an array, an iterable, or a factory (like \`useState\`)
- **No wasted renders** - No-op updates (empty add, empty remove/clear) are skipped
- **TypeScript generics** - Full \`<T>\` type inference

## Basic Usage
\`\`\`tsx
const [queue, { add, remove, peek }] = useQueue<Task>([]);
add(task);              // enqueue
const next = remove();  // dequeue + get the item
\`\`\`

> Read \`first\` / \`last\` / \`size\` directly from the returned queue:
> \`queue[0]\`, \`queue[queue.length - 1]\`, \`queue.length\`.
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TaskQueueDemo>;

export const Default: Story = {
  render: () => <TaskQueueDemo />,
  parameters: {
    docs: {
      description: {
        story: "Enqueue jobs and process them one at a time in FIFO order.",
      },
      source: {
        code: `import { useQueue } from "@usefy/use-queue";

function TaskRunner() {
  const [queue, { add, remove, peek }] = useQueue<Task>([]);

  const processNext = () => {
    const task = remove(); // dequeue + get the item
    if (task) runTask(task);
  };

  return (
    <>
      <button onClick={() => add(newTask)}>Add task</button>
      <button onClick={processNext} disabled={queue.length === 0}>
        Process next {peek()?.label}
      </button>
      <p>Pending: {queue.length}</p>
    </>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Seeded with two tasks; "Compile" is the front.
    await expect(canvas.getByTestId("size")).toHaveTextContent("2");
    await expect(canvas.getByTestId("next")).toHaveTextContent("Compile");

    // Enqueue a job -> size 3.
    await userEvent.click(canvas.getByTestId("add-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("3");
    });

    // Process the front (Compile) -> logged, front becomes Test.
    await userEvent.click(canvas.getByTestId("process-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("2");
      expect(canvas.getByTestId("next")).toHaveTextContent("Test");
      expect(canvas.getByTestId("log")).toHaveTextContent("Compile");
    });

    // Reset back to the initial two tasks.
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("2");
      expect(canvas.getByTestId("next")).toHaveTextContent("Compile");
    });

    // Clear empties it.
    await userEvent.click(canvas.getByTestId("clear-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("0");
      expect(canvas.getByTestId("next")).toHaveTextContent("empty");
    });
  },
};

export const PrintQueue: Story = {
  render: () => <PrintQueueDemo />,
  parameters: {
    docs: {
      description: {
        story: "Batch enqueue with the variadic `add`, then drain from the front.",
      },
      source: {
        code: `import { useQueue } from "@usefy/use-queue";

function PrintQueue() {
  const [queue, { add, remove }] = useQueue<number>([]);

  return (
    <>
      <button onClick={() => add(1, 2, 3)}>Add 3</button>
      <button onClick={() => remove()}>Print next</button>
      <p>Waiting: {queue.length}</p>
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

    // Batch-add three jobs.
    await userEvent.click(canvas.getByTestId("add-batch"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("3");
      expect(canvas.getByTestId("ids")).toHaveTextContent("[1, 2, 3]");
    });

    // Print the front (job 1).
    await userEvent.click(canvas.getByTestId("print-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("2");
      expect(canvas.getByTestId("ids")).toHaveTextContent("[2, 3]");
    });
  },
};
