import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useSet } from "@usefy/use-set";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

interface Item {
  id: string;
  name: string;
}

const ITEMS: Item[] = [
  { id: "1", name: "React" },
  { id: "2", name: "TypeScript" },
  { id: "3", name: "Vitest" },
  { id: "4", name: "Storybook" },
];

/**
 * Multi-select with toggle + has (the ROADMAP example).
 */
function MultiSelectDemo() {
  const [selected, { toggle, has, clear, reset }] = useSet<string>(["1"]);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useSet</h2>
      <p className={storyTheme.subtitle}>
        Multi-select with <code>toggle</code> and <code>has</code>
      </p>

      <ul className="space-y-2" data-testid="items">
        {ITEMS.map((item) => (
          <li key={item.id}>
            <label
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                has(item.id)
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
              data-testid={`row-${item.id}`}
            >
              <input
                type="checkbox"
                checked={has(item.id)}
                onChange={() => toggle(item.id)}
                data-testid={`checkbox-${item.id}`}
              />
              <span className="font-medium">{item.name}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className={`${storyTheme.statBox} mt-4`}>
        <p className={storyTheme.statLabel}>
          Selected:{" "}
          <span className={storyTheme.statValue} data-testid="count">
            {selected.size}
          </span>{" "}
          <span className="text-zinc-500 text-sm" data-testid="selected-ids">
            [{[...selected].join(", ")}]
          </span>
        </p>
      </div>

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
 * Tag filter using add/remove/toggle with force.
 */
function TagFilterDemo() {
  const allTags = ["frontend", "backend", "design", "devops", "mobile"];
  const [active, { toggle, has, clear }] = useSet<string>(["frontend"]);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Tag Filter</h2>
      <p className={storyTheme.subtitle}>Click tags to toggle them on/off</p>

      <div className="flex flex-wrap gap-2" data-testid="tags">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              has(tag)
                ? "bg-violet-600 text-white shadow"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
            data-testid={`tag-${tag}`}
          >
            #{tag}
          </button>
        ))}
      </div>

      <div className={`${storyTheme.statBox} mt-6`}>
        <p className={storyTheme.statLabel}>
          Active filters:{" "}
          <span className={storyTheme.statValue} data-testid="active-count">
            {active.size}
          </span>
        </p>
      </div>

      <button
        className={`${storyTheme.buttonNeutral} mt-4`}
        onClick={clear}
        data-testid="clear-filters"
      >
        Clear filters
      </button>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof MultiSelectDemo> = {
  title: "Hooks/useSet",
  component: MultiSelectDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `A hook for managing \`Set\` state with immutable, ergonomic updates.

## Features
- **Immutable updates** - Every change produces a new \`Set\`; the returned set is \`ReadonlySet\`
- **Complete action set** - \`add\`, \`remove\`, \`toggle\`, \`has\`, \`clear\`, \`reset\`
- **\`toggle(value, force?)\`** - Optional force argument, like \`DOMTokenList.toggle\`
- **Stable actions** - Action identities never change, safe as effect dependencies
- **Lazy init** - Accepts a \`Set\`, an iterable, or a factory (like \`useState\`)
- **No wasted renders** - No-op updates (existing add, absent remove, empty clear) are skipped
- **TypeScript generics** - Full \`<T>\` type inference

## Basic Usage
\`\`\`tsx
const [selected, { toggle, has }] = useSet<string>();
<input type="checkbox" checked={has(id)} onChange={() => toggle(id)} />
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MultiSelectDemo>;

export const Default: Story = {
  render: () => <MultiSelectDemo />,
  parameters: {
    docs: {
      description: {
        story: "Toggle items in and out of a selection Set.",
      },
      source: {
        code: `import { useSet } from "@usefy/use-set";

function ItemList({ items }) {
  const [selected, { toggle, has }] = useSet<string>();

  return items.map((item) => (
    <Checkbox
      key={item.id}
      checked={has(item.id)}
      onChange={() => toggle(item.id)}
    />
  ));
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Seeded with item "1".
    await expect(canvas.getByTestId("count")).toHaveTextContent("1");

    // Toggle item 2 on.
    await userEvent.click(canvas.getByTestId("checkbox-2"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("2");
    });

    // Toggle item 1 off.
    await userEvent.click(canvas.getByTestId("checkbox-1"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("1");
      expect(canvas.getByTestId("selected-ids")).toHaveTextContent("[2]");
    });

    // Reset back to the initial selection.
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("selected-ids")).toHaveTextContent("[1]");
    });

    // Clear.
    await userEvent.click(canvas.getByTestId("clear-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("count")).toHaveTextContent("0");
    });
  },
};

export const TagFilter: Story = {
  render: () => <TagFilterDemo />,
  parameters: {
    docs: {
      description: {
        story: "Toggling tag filters on and off — a common Set-backed UI.",
      },
      source: {
        code: `import { useSet } from "@usefy/use-set";

function TagFilter({ tags }) {
  const [active, { toggle, has }] = useSet<string>();

  return tags.map((tag) => (
    <button key={tag} onClick={() => toggle(tag)} data-active={has(tag)}>
      #{tag}
    </button>
  ));
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("active-count")).toHaveTextContent("1");

    await userEvent.click(canvas.getByTestId("tag-design"));
    await waitFor(() => {
      expect(canvas.getByTestId("active-count")).toHaveTextContent("2");
    });

    await userEvent.click(canvas.getByTestId("clear-filters"));
    await waitFor(() => {
      expect(canvas.getByTestId("active-count")).toHaveTextContent("0");
    });
  },
};
