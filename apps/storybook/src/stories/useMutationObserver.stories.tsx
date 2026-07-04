import React, { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useMutationObserver } from "@usefy/use-mutation-observer";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * childList demo — add/remove DOM children and watch the observer report the
 * added/removed nodes in real time.
 */
function ChildListDemo() {
  const [items, setItems] = useState<string[]>(["Alpha", "Beta"]);
  const [log, setLog] = useState<string[]>([]);
  const [count, setCount] = useState(0);

  const onMutation = useCallback((mutations: MutationRecord[]) => {
    setCount((c) => c + mutations.length);
    setLog((prev) =>
      mutations
        .map(
          (m) =>
            `${m.type}: +${m.addedNodes.length} / -${m.removedNodes.length}`
        )
        .concat(prev)
        .slice(0, 4)
    );
  }, []);

  const { ref, isObserving } = useMutationObserver<HTMLUListElement>({
    childList: true,
    onMutation,
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>useMutationObserver</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Add or remove list items — the observer reports each child mutation
      </p>

      <div className={storyTheme.buttonGroup + " justify-center mb-5"}>
        <button
          data-testid="add-item"
          className={storyTheme.buttonPrimary}
          onClick={() =>
            setItems((prev) => [...prev, `Item ${prev.length + 1}`])
          }
        >
          Add item
        </button>
        <button
          data-testid="remove-item"
          className={storyTheme.buttonNeutral}
          onClick={() => setItems((prev) => prev.slice(0, -1))}
        >
          Remove item
        </button>
      </div>

      <ul
        ref={ref}
        data-testid="list"
        className="mb-5 grid gap-2 list-none p-0 m-0"
      >
        {items.map((item, i) => (
          <li key={`${item}-${i}`} className={storyTheme.listItem}>
            {item}
          </li>
        ))}
      </ul>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Total mutations:{" "}
          <span className={storyTheme.statValue} data-testid="mutation-count">
            {count}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          Observing:{" "}
          <span className={storyTheme.statValue} data-testid="observing">
            {isObserving ? "Yes" : "No"}
          </span>
        </p>
        <ul className="mt-3 grid gap-1 list-none p-0 m-0" data-testid="log">
          {log.length === 0 ? (
            <li className={storyTheme.statTextSecondary}>No mutations yet</li>
          ) : (
            log.map((entry, i) => (
              <li key={i} className={storyTheme.statText + " font-mono text-sm"}>
                {entry}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

/**
 * attributes demo — watch only the `class` attribute (with old value) using
 * `attributeFilter`, so unrelated DOM changes are ignored.
 */
function AttributeDemo() {
  const [active, setActive] = useState(false);
  const [lastChange, setLastChange] = useState<string>("—");
  const [count, setCount] = useState(0);

  const onMutation = useCallback((mutations: MutationRecord[]) => {
    setCount((c) => c + mutations.length);
    const last = mutations[mutations.length - 1];
    if (last) {
      setLastChange(`${last.attributeName}: "${last.oldValue ?? ""}"`);
    }
  }, []);

  const { ref } = useMutationObserver<HTMLDivElement>({
    attributeFilter: ["class"],
    attributeOldValue: true,
    onMutation,
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>Attribute watching</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Only the <code>class</code> attribute is observed (with its old value)
      </p>

      <div
        ref={ref}
        data-testid="attr-box"
        className={
          active
            ? "mx-auto mb-5 grid place-items-center text-white font-semibold rounded-xl h-28 bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl"
            : "mx-auto mb-5 grid place-items-center text-white font-semibold rounded-xl h-28 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl"
        }
      >
        {active ? "active" : "idle"}
      </div>

      <div className={storyTheme.buttonGroup + " justify-center mb-5"}>
        <button
          data-testid="toggle-class"
          className={storyTheme.buttonPrimary}
          onClick={() => setActive((a) => !a)}
        >
          Toggle class
        </button>
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          Attribute mutations:{" "}
          <span className={storyTheme.statValue} data-testid="attr-count">
            {count}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          Last change (name: oldValue):{" "}
          <span
            className={storyTheme.statValue + " font-mono"}
            data-testid="attr-last"
          >
            {lastChange}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof ChildListDemo> = {
  title: "Hooks/useMutationObserver",
  component: ChildListDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Watch an element for DOM mutations — child additions/removals, attribute changes, and character-data changes — via the browser's \`MutationObserver\`.

\`useMutationObserver\` is the low-level observer primitive, a sibling to [\`useResizeObserver\`](?path=/docs/hooks-useresizeobserver--docs) and \`useIntersectionObserver\`. Attach the returned \`ref\` to a node; react to mutations through the \`onMutation\` callback, the reactive \`records\` state, or both.

## Features
- **Callback ref** - \`const { ref } = useMutationObserver()\`, attach and go
- **Standard config knobs** - \`childList\`, \`attributes\`, \`attributeFilter\`, \`subtree\`, \`characterData\`, and old-value variants
- **Sensible default** - defaults to \`childList: true\` so \`observe()\` never throws
- **Stable callback** - \`onMutation\` is stored in a ref; changing it never re-registers the observer
- **enabled / updateState** - pause observation, or go callback-only for zero re-renders
- **SSR-safe & StrictMode-safe** - no DOM access on the server, clean connect/disconnect

## Basic Usage
\`\`\`tsx
const { ref, records } = useMutationObserver<HTMLDivElement>({
  childList: true,
  subtree: true,
  onMutation: (mutations) => console.log(mutations),
});

return <div ref={ref}>{records.length} recent mutations</div>;
\`\`\`
`,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ChildListDemo>;

export const ChildList: Story = {
  render: () => <ChildListDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Observe child additions/removals with `childList: true` and log each record's added/removed node counts.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { useMutationObserver } from "@usefy/use-mutation-observer";

function List() {
  const [items, setItems] = useState(["Alpha", "Beta"]);

  const { ref, records } = useMutationObserver<HTMLUListElement>({
    childList: true,
    onMutation: (mutations) => {
      for (const m of mutations) {
        console.log(\`+\${m.addedNodes.length} / -\${m.removedNodes.length}\`);
      }
    },
  });

  return (
    <>
      <button onClick={() => setItems((p) => [...p, \`Item \${p.length + 1}\`])}>
        Add item
      </button>
      <ul ref={ref}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <p>{records.length} records in the latest batch</p>
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Start with no reported mutations.
    expect(canvas.getByTestId("mutation-count")).toHaveTextContent("0");

    await userEvent.click(canvas.getByTestId("add-item"));

    // MutationObserver delivers asynchronously — wait for the batch.
    await waitFor(() => {
      const count = Number(
        canvas.getByTestId("mutation-count").textContent
      );
      expect(count).toBeGreaterThan(0);
    });

    expect(canvas.getByTestId("observing")).toHaveTextContent("Yes");
  },
};

export const AttributeFilter: Story = {
  render: () => <AttributeDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Watch only the `class` attribute with `attributeFilter` + `attributeOldValue`, ignoring every other mutation.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { useMutationObserver } from "@usefy/use-mutation-observer";

function Box() {
  const [active, setActive] = useState(false);

  const { ref } = useMutationObserver<HTMLDivElement>({
    attributeFilter: ["class"],
    attributeOldValue: true,
    onMutation: (mutations) => {
      const last = mutations[mutations.length - 1];
      console.log(last?.attributeName, "was", last?.oldValue);
    },
  });

  return (
    <div ref={ref} className={active ? "active" : "idle"}>
      <button onClick={() => setActive((a) => !a)}>Toggle class</button>
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByTestId("attr-count")).toHaveTextContent("0");

    await userEvent.click(canvas.getByTestId("toggle-class"));

    await waitFor(() => {
      const count = Number(canvas.getByTestId("attr-count").textContent);
      expect(count).toBeGreaterThan(0);
    });

    // The reported mutation is for the class attribute.
    expect(canvas.getByTestId("attr-last")).toHaveTextContent("class");
  },
};
