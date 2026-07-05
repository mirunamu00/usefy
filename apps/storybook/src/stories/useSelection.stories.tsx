import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useSelection } from "@usefy/use-selection";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

interface User {
  id: number;
  name: string;
  role: string;
}

const USERS: User[] = [
  { id: 1, name: "Ada Lovelace", role: "Engineer" },
  { id: 2, name: "Linus Torvalds", role: "Maintainer" },
  { id: 3, name: "Grace Hopper", role: "Admiral" },
  { id: 4, name: "Alan Turing", role: "Researcher" },
];

/**
 * A multi-select table with a header "select all" checkbox that shows the
 * indeterminate (partial) state, plus per-row checkboxes.
 */
function TableDemo() {
  const {
    selected,
    isSelected,
    toggle,
    selectAll,
    clear,
    isAllSelected,
    isPartiallySelected,
  } = useSelection(USERS, { getKey: (u) => u.id });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useSelection</h2>
      <p className={storyTheme.subtitle}>
        Multi-select table with an indeterminate header checkbox
      </p>

      <table className="w-full border-collapse" data-testid="table">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="w-10 px-3 py-2 text-left">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isPartiallySelected;
                }}
                onChange={() => (isAllSelected ? clear() : selectAll())}
                data-testid="select-all"
                aria-label="Select all rows"
              />
            </th>
            <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">
              Name
            </th>
            <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">
              Role
            </th>
          </tr>
        </thead>
        <tbody>
          {USERS.map((user) => (
            <tr
              key={user.id}
              className={`border-b border-gray-100 transition-colors ${
                isSelected(user) ? "bg-indigo-50" : "bg-white"
              }`}
              data-testid={`row-${user.id}`}
            >
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={isSelected(user)}
                  onChange={() => toggle(user)}
                  data-testid={`checkbox-${user.id}`}
                  aria-label={`Select ${user.name}`}
                />
              </td>
              <td className="px-3 py-2 font-medium text-gray-800">
                {user.name}
              </td>
              <td className="px-3 py-2 text-gray-500">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>
          Selected:{" "}
          <span className={storyTheme.statValue} data-testid="count">
            {selected.length}
          </span>{" "}
          <span className="text-gray-500 text-sm" data-testid="selected-names">
            [{selected.map((u) => u.name).join(", ")}]
          </span>
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          className={storyTheme.buttonPrimary}
          onClick={selectAll}
          data-testid="select-all-btn"
        >
          Select all
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
 * Single-selection mode (`multiple: false`) — selecting a row replaces the
 * previous choice, like a set of radio buttons.
 */
function SingleSelectDemo() {
  const { selected, isSelected, select } = useSelection(USERS, {
    getKey: (u) => u.id,
    multiple: false,
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Single Selection</h2>
      <p className={storyTheme.subtitle}>
        <code>multiple: false</code> — selecting replaces the previous choice
      </p>

      <ul className="space-y-2" data-testid="single-list">
        {USERS.map((user) => (
          <li key={user.id}>
            <label
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                isSelected(user)
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
              data-testid={`single-row-${user.id}`}
            >
              <input
                type="radio"
                name="single-select"
                checked={isSelected(user)}
                onChange={() => select(user)}
                data-testid={`radio-${user.id}`}
              />
              <span className="font-medium">{user.name}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>
          Current choice:{" "}
          <span className={storyTheme.statValue} data-testid="single-choice">
            {selected[0]?.name ?? "none"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof TableDemo> = {
  title: "Hooks/useSelection",
  component: TableDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `Multi/single selection state for lists and tables, backed by a \`Set\` of keys.

## Features
- **Set-backed** - stores keys (via \`getKey\`, default identity), so selection survives new item identities across renders
- **Ergonomic surface** - \`selected\` items, \`isSelected\`, \`toggle\`, \`select\`, \`deselect\`, \`selectAll\`, \`clear\`
- **Header-checkbox ready** - \`isAllSelected\` / \`isPartiallySelected\` / \`isNoneSelected\` for indeterminate state
- **Single-selection mode** - \`multiple: false\` replaces the selection on select
- **Auto-reconciled** - item-facing values derive from the current \`items\`; removed rows drop out automatically
- **Stable actions** - action identities never change; no-op \`selectAll\`/\`clear\` skip re-renders

## Basic Usage
\`\`\`tsx
const { selected, isSelected, toggle, selectAll, clear, isAllSelected } =
  useSelection(users, { getKey: (u) => u.id });
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TableDemo>;

export const Table: Story = {
  render: () => <TableDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A checkbox table with a header 'select all' that shows the indeterminate state when only some rows are selected.",
      },
      source: {
        language: "tsx",
        code: `import { useSelection } from "@usefy/use-selection";

type User = { id: number; name: string };

function UserTable({ users }: { users: User[] }) {
  const {
    selected,
    isSelected,
    toggle,
    selectAll,
    clear,
    isAllSelected,
    isPartiallySelected,
  } = useSelection(users, { getKey: (u) => u.id });

  return (
    <table>
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isPartiallySelected;
              }}
              onChange={() => (isAllSelected ? clear() : selectAll())}
            />
          </th>
          <th>Name ({selected.length} selected)</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>
              <input
                type="checkbox"
                checked={isSelected(user)}
                onChange={() => toggle(user)}
              />
            </td>
            <td>{user.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("count")).toHaveTextContent("0");

    // Select one row → partial (header checkbox indeterminate).
    await userEvent.click(canvas.getByTestId("checkbox-1"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("1");
    });
    const header = canvas.getByTestId<HTMLInputElement>("select-all");
    await waitFor(() => {
      expect(header.indeterminate).toBe(true);
      expect(header.checked).toBe(false);
    });

    // Select all via the header checkbox → checked, not indeterminate.
    await userEvent.click(header);
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("4");
      expect(header.checked).toBe(true);
      expect(header.indeterminate).toBe(false);
    });

    // Header again clears everything.
    await userEvent.click(header);
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("0");
      expect(header.checked).toBe(false);
    });
  },
};

export const SingleSelect: Story = {
  render: () => <SingleSelectDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Single-selection mode (`multiple: false`): selecting a new item replaces the previous one, like radio buttons.",
      },
      source: {
        language: "tsx",
        code: `import { useSelection } from "@usefy/use-selection";

function SinglePicker({ options }) {
  const { selected, isSelected, select } = useSelection(options, {
    getKey: (o) => o.id,
    multiple: false,
  });

  return options.map((option) => (
    <label key={option.id}>
      <input
        type="radio"
        name="picker"
        checked={isSelected(option)}
        onChange={() => select(option)}
      />
      {option.name}
    </label>
  ));
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("single-choice")).toHaveTextContent("none");

    await userEvent.click(canvas.getByTestId("radio-1"));
    await waitFor(() => {
      expect(canvas.getByTestId("single-choice")).toHaveTextContent(
        "Ada Lovelace"
      );
    });

    // Selecting another replaces the previous choice.
    await userEvent.click(canvas.getByTestId("radio-3"));
    await waitFor(() => {
      expect(canvas.getByTestId("single-choice")).toHaveTextContent(
        "Grace Hopper"
      );
    });
  },
};
