import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useMap } from "@usefy/use-map";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Basic key/value editor.
 */
function BasicDemo() {
  const [map, { set, remove, clear, reset }] = useMap<string, string>([
    ["name", "Alice"],
    ["role", "Admin"],
  ]);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const handleAdd = () => {
    if (!key.trim()) return;
    set(key.trim(), value);
    setKey("");
    setValue("");
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useMap</h2>
      <p className={storyTheme.subtitle}>
        Immutable Map state with <code>set</code>, <code>remove</code>,{" "}
        <code>reset</code>, <code>clear</code>
      </p>

      <div className="flex gap-2 mb-4">
        <input
          className={storyTheme.input}
          placeholder="key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          data-testid="key-input"
        />
        <input
          className={storyTheme.input}
          placeholder="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="value-input"
        />
        <button
          className={storyTheme.buttonPrimary}
          onClick={handleAdd}
          data-testid="add-btn"
        >
          Set
        </button>
      </div>

      <div className={`${storyTheme.statBox} mb-4`}>
        <p className={storyTheme.statLabel}>
          Size:{" "}
          <span className={storyTheme.statValue} data-testid="size">
            {map.size}
          </span>
        </p>
      </div>

      <ul className="space-y-2" data-testid="entries">
        {[...map.entries()].map(([k, v]) => (
          <li
            key={k}
            className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg"
            data-testid={`entry-${k}`}
          >
            <span>
              <strong className="text-indigo-600">{k}</strong>: {v}
            </span>
            <button
              className="text-red-500 hover:text-red-700 text-sm font-medium"
              onClick={() => remove(k)}
              data-testid={`remove-${k}`}
            >
              Remove
            </button>
          </li>
        ))}
        {map.size === 0 && (
          <li className="text-gray-400 italic text-sm">Map is empty</li>
        )}
      </ul>

      <div className="flex gap-2 mt-4">
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
    </div>
  );
}

/**
 * User directory (ROADMAP example) — Map<string, User>.
 */
interface User {
  id: string;
  name: string;
}

function UserDirectoryDemo() {
  const [users, { set, remove, get }] = useMap<string, User>([
    ["1", { id: "1", name: "Alice" }],
    ["2", { id: "2", name: "Bob" }],
  ]);
  const [nextId, setNextId] = useState(3);

  const addUser = () => {
    const id = String(nextId);
    set(id, { id, name: `User ${id}` });
    setNextId((n) => n + 1);
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>User Directory</h2>
      <p className={storyTheme.subtitle}>
        <code>useMap&lt;string, User&gt;</code> keyed by id
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="users">
        {[...users.values()].map((user) => (
          <div
            key={user.id}
            className={storyTheme.card}
            data-testid={`user-${user.id}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 m-0">{user.name}</p>
                <p className="text-gray-400 text-sm m-0">id: {user.id}</p>
              </div>
              <button
                className="text-red-500 hover:text-red-700 text-sm font-medium"
                onClick={() => remove(user.id)}
                data-testid={`remove-user-${user.id}`}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className={`${storyTheme.buttonPrimary} mt-4`}
        onClick={addUser}
        data-testid="add-user-btn"
      >
        Add User
      </button>

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>
          Total users:{" "}
          <span className={storyTheme.statValue} data-testid="user-count">
            {users.size}
          </span>{" "}
          | Has &quot;1&quot;:{" "}
          <span className={storyTheme.statValue} data-testid="has-1">
            {get("1") ? "yes" : "no"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof BasicDemo> = {
  title: "Hooks/useMap",
  component: BasicDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `A hook for managing \`Map\` state with immutable, ergonomic updates.

## Features
- **Immutable updates** - Every change produces a new \`Map\`; the returned map is \`ReadonlyMap\`
- **Complete action set** - \`set\`, \`setAll\`, \`remove\`, \`reset\`, \`clear\`, \`get\`
- **Stable actions** - Action identities never change, safe as effect dependencies
- **Lazy init** - Accepts a \`Map\`, tuples, or a factory (like \`useState\`)
- **No wasted renders** - No-op updates (absent key, empty clear, same value) are skipped
- **TypeScript generics** - Full \`<K, V>\` type inference

## Basic Usage
\`\`\`tsx
const [map, { set, remove, reset, clear }] = useMap<string, User>();
set("1", { id: "1", name: "Alice" });
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BasicDemo>;

export const Default: Story = {
  render: () => <BasicDemo />,
  parameters: {
    docs: {
      description: {
        story: "Add, remove, reset, and clear entries in a Map.",
      },
      source: {
        code: `import { useMap } from "@usefy/use-map";

function Component() {
  const [map, { set, remove, reset, clear }] = useMap<string, string>([
    ["name", "Alice"],
  ]);

  return (
    <div>
      <button onClick={() => set("role", "Admin")}>Set role</button>
      <p>Size: {map.size}</p>
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Seeded with 2 entries.
    await expect(canvas.getByTestId("size")).toHaveTextContent("2");

    // Add an entry.
    await userEvent.type(canvas.getByTestId("key-input"), "team");
    await userEvent.type(canvas.getByTestId("value-input"), "Platform");
    await userEvent.click(canvas.getByTestId("add-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("3");
      expect(canvas.getByTestId("entry-team")).toHaveTextContent("Platform");
    });

    // Remove an entry.
    await userEvent.click(canvas.getByTestId("remove-name"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("2");
    });

    // Reset back to the initial 2 entries.
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("2");
      expect(canvas.getByTestId("entry-name")).toBeInTheDocument();
    });

    // Clear everything.
    await userEvent.click(canvas.getByTestId("clear-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("size")).toHaveTextContent("0");
    });
  },
};

export const UserDirectory: Story = {
  render: () => <UserDirectoryDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Managing a collection of objects keyed by id — a common real-world use of Map state.",
      },
      source: {
        code: `import { useMap } from "@usefy/use-map";

function UserDirectory() {
  const [users, { set, remove }] = useMap<string, User>([
    ["1", { id: "1", name: "Alice" }],
    ["2", { id: "2", name: "Bob" }],
  ]);

  const addUser = (user: User) => set(user.id, user);
  const removeUser = (id: string) => remove(id);

  return [...users.values()].map((u) => <UserRow key={u.id} user={u} />);
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("user-count")).toHaveTextContent("2");
    await expect(canvas.getByTestId("has-1")).toHaveTextContent("yes");

    await userEvent.click(canvas.getByTestId("add-user-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("user-count")).toHaveTextContent("3");
    });

    await userEvent.click(canvas.getByTestId("remove-user-1"));
    await waitFor(() => {
      expect(canvas.getByTestId("user-count")).toHaveTextContent("2");
      expect(canvas.getByTestId("has-1")).toHaveTextContent("no");
    });
  },
};
