import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useList } from "@usefy/use-list";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

/**
 * Todo app (the ROADMAP example): push + updateAt toggle + removeAt.
 */
function TodoDemo() {
  const [todos, { push, removeAt, updateAt, clear }] = useList<Todo>([
    { id: 1, text: "Learn useList", completed: true },
    { id: 2, text: "Ship the hook", completed: false },
  ]);
  const [text, setText] = useState("");
  const [nextId, setNextId] = useState(3);

  const addTodo = () => {
    if (!text.trim()) return;
    push({ id: nextId, text: text.trim(), completed: false });
    setNextId((n) => n + 1);
    setText("");
  };

  const toggle = (index: number) => {
    const todo = todos[index];
    updateAt(index, { ...todo, completed: !todo.completed });
  };

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useList</h2>
      <p className={storyTheme.subtitle}>
        Array state with <code>push</code>, <code>updateAt</code>,{" "}
        <code>removeAt</code>
      </p>

      <div className="flex gap-2 mb-4">
        <input
          className={storyTheme.input}
          placeholder="New todo..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          data-testid="todo-input"
        />
        <button
          className={storyTheme.buttonPrimary}
          onClick={addTodo}
          data-testid="add-btn"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2" data-testid="todos">
        {todos.map((todo, i) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg"
            data-testid={`todo-${todo.id}`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggle(i)}
              data-testid={`toggle-${todo.id}`}
            />
            <span
              className={`flex-1 ${
                todo.completed ? "line-through text-gray-400" : "text-gray-700"
              }`}
            >
              {todo.text}
            </span>
            <button
              className="text-red-500 hover:text-red-700 text-sm font-medium"
              onClick={() => removeAt(i)}
              data-testid={`remove-${todo.id}`}
            >
              ×
            </button>
          </li>
        ))}
        {todos.length === 0 && (
          <li className="text-gray-400 italic text-sm">No todos yet</li>
        )}
      </ul>

      <div className={`${storyTheme.statBox} mt-4 flex items-center justify-between`}>
        <p className={storyTheme.statLabel}>
          Remaining:{" "}
          <span className={storyTheme.statValue} data-testid="remaining">
            {remaining}
          </span>{" "}
          / {todos.length}
        </p>
        <button
          className="text-sm text-gray-500 hover:text-gray-700"
          onClick={clear}
          data-testid="clear-btn"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

/**
 * Sortable / filterable number list.
 */
function NumberListDemo() {
  const [nums, { push, sort, filter, reset }] = useList<number>([5, 3, 8, 1, 9, 2]);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Sort & Filter</h2>
      <p className={storyTheme.subtitle}>Immutable sort and filter operations</p>

      <div
        className="flex flex-wrap gap-2 mb-4 min-h-[3rem]"
        data-testid="nums"
      >
        {nums.map((n, i) => (
          <span
            key={`${n}-${i}`}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold"
          >
            {n}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={storyTheme.buttonNeutral}
          onClick={() => sort((a, b) => a - b)}
          data-testid="sort-asc"
        >
          Sort ↑
        </button>
        <button
          className={storyTheme.buttonNeutral}
          onClick={() => sort((a, b) => b - a)}
          data-testid="sort-desc"
        >
          Sort ↓
        </button>
        <button
          className={storyTheme.buttonNeutral}
          onClick={() => filter((n) => n % 2 === 0)}
          data-testid="filter-even"
        >
          Evens only
        </button>
        <button
          className={storyTheme.buttonNeutral}
          onClick={() => push(Math.floor(Math.random() * 9) + 1)}
          data-testid="push-btn"
        >
          Add random
        </button>
        <button
          className={storyTheme.buttonNeutral}
          onClick={reset}
          data-testid="reset-btn"
        >
          Reset
        </button>
      </div>

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>
          Count:{" "}
          <span className={storyTheme.statValue} data-testid="num-count">
            {nums.length}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof TodoDemo> = {
  title: "Hooks/useList",
  component: TodoDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `A hook for managing array state with immutable, ergonomic updates.

## Features
- **Immutable updates** - Every change produces a new array; the returned list is \`readonly T[]\`
- **Rich action set** - \`set\`, \`push\`, \`filter\`, \`sort\`, \`clear\`, \`removeAt\`, \`insertAt\`, \`updateAt\`, \`reset\`
- **\`set\` accepts a value or updater** - \`set(prev => [...prev, x])\`
- **Stable actions** - Action identities never change, safe as effect dependencies
- **Lazy init** - Accepts an array/iterable or a factory (like \`useState\`)
- **No wasted renders** - No-op updates (out-of-range index, empty clear, same value) are skipped
- **TypeScript generics** - Full \`<T>\` type inference

## Basic Usage
\`\`\`tsx
const [todos, { push, removeAt, updateAt }] = useList<Todo>([]);
push({ id: 1, text: "Hello", completed: false });
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TodoDemo>;

export const Default: Story = {
  render: () => <TodoDemo />,
  parameters: {
    docs: {
      description: {
        story: "A todo list built on push / updateAt / removeAt.",
      },
      source: {
        code: `import { useList } from "@usefy/use-list";

function TodoApp() {
  const [todos, { push, removeAt, updateAt }] = useList<Todo>([]);

  const addTodo = (text: string) =>
    push({ id: Date.now(), text, completed: false });

  const toggleTodo = (index: number) => {
    const todo = todos[index];
    updateAt(index, { ...todo, completed: !todo.completed });
  };

  return todos.map((t, i) => <TodoRow key={t.id} todo={t} onToggle={() => toggleTodo(i)} />);
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Seeded with 2 todos, 1 remaining.
    await expect(canvas.getByTestId("remaining")).toHaveTextContent("1");

    // Add a todo.
    await userEvent.type(canvas.getByTestId("todo-input"), "Write docs");
    await userEvent.click(canvas.getByTestId("add-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("remaining")).toHaveTextContent("2");
    });

    // Toggle it complete.
    await userEvent.click(canvas.getByTestId("toggle-2"));
    await waitFor(() => {
      expect(canvas.getByTestId("remaining")).toHaveTextContent("1");
    });

    // Remove a todo.
    await userEvent.click(canvas.getByTestId("remove-1"));
    await waitFor(() => {
      expect(canvas.queryByTestId("todo-1")).not.toBeInTheDocument();
    });
  },
};

export const SortAndFilter: Story = {
  render: () => <NumberListDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Immutable `sort` and `filter`, plus `push` and `reset`.",
      },
      source: {
        code: `import { useList } from "@usefy/use-list";

function NumberList() {
  const [nums, { sort, filter, push, reset }] = useList([5, 3, 8, 1]);

  return (
    <div>
      <button onClick={() => sort((a, b) => a - b)}>Sort</button>
      <button onClick={() => filter((n) => n % 2 === 0)}>Evens</button>
      <button onClick={() => push(Math.random())}>Add</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("num-count")).toHaveTextContent("6");

    // Filter to evens: [8, 2] from [5,3,8,1,9,2].
    await userEvent.click(canvas.getByTestId("filter-even"));
    await waitFor(() => {
      expect(canvas.getByTestId("num-count")).toHaveTextContent("2");
    });

    // Reset restores all 6.
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("num-count")).toHaveTextContent("6");
    });
  },
};
