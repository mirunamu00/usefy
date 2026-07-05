import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useObjectState } from "@usefy/use-object-state";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Settings panel — patch individual fields immutably, reset back to defaults.
 */
interface Settings {
  username: string;
  theme: "light" | "dark";
  fontSize: number;
  notifications: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  username: "alice",
  theme: "light",
  fontSize: 14,
  notifications: true,
};

function SettingsDemo() {
  const [settings, patch, reset] = useObjectState<Settings>(DEFAULT_SETTINGS);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useObjectState</h2>
      <p className={storyTheme.subtitle}>
        Object state with immutable <code>patch</code> (partial merge) and{" "}
        <code>reset</code>
      </p>

      <div className="space-y-4">
        <div>
          <label className={storyTheme.label}>Username</label>
          <input
            className={storyTheme.input}
            value={settings.username}
            onChange={(e) => patch({ username: e.target.value })}
            data-testid="username-input"
          />
        </div>

        <div>
          <label className={storyTheme.label}>Theme</label>
          <select
            className={storyTheme.input}
            value={settings.theme}
            onChange={(e) =>
              patch({ theme: e.target.value as Settings["theme"] })
            }
            data-testid="theme-select"
          >
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </div>

        <div>
          <label className={storyTheme.label}>
            Font size: {settings.fontSize}px
          </label>
          <input
            type="range"
            min={10}
            max={28}
            className="w-full"
            value={settings.fontSize}
            onChange={(e) => patch({ fontSize: Number(e.target.value) })}
            data-testid="fontsize-range"
          />
        </div>

        <label className="flex items-center gap-2 font-medium text-gray-700">
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => patch({ notifications: e.target.checked })}
            data-testid="notifications-checkbox"
          />
          Enable notifications
        </label>
      </div>

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>Current state:</p>
        <pre
          className="text-[0.8rem] text-gray-700 m-0 whitespace-pre-wrap"
          data-testid="state-json"
        >
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          className={storyTheme.buttonNeutral}
          onClick={() => reset()}
          data-testid="reset-btn"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

/**
 * Functional patch + reset(next) — compute the next patch from the previous
 * state, and reset to a brand-new object.
 */
interface Cart {
  items: number;
  total: number;
  coupon: string;
}

function CartDemo() {
  const [cart, patch, reset] = useObjectState<Cart>({
    items: 0,
    total: 0,
    coupon: "none",
  });

  const addItem = () =>
    // Functional updater — next value derived from the previous state.
    patch((prev) => ({ items: prev.items + 1, total: prev.total + 9.99 }));

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Functional patch + reset(next)</h2>
      <p className={storyTheme.subtitle}>
        <code>patch(prev =&gt; ...)</code> derives from the current state;{" "}
        <code>reset(next)</code> swaps in a provided object
      </p>

      <div className={`${storyTheme.statBox} mb-4`}>
        <p className={storyTheme.statLabel}>
          Items:{" "}
          <span className={storyTheme.statValue} data-testid="items">
            {cart.items}
          </span>{" "}
          | Total:{" "}
          <span className={storyTheme.statValue} data-testid="total">
            ${cart.total.toFixed(2)}
          </span>{" "}
          | Coupon:{" "}
          <span className={storyTheme.statValue} data-testid="coupon">
            {cart.coupon}
          </span>
        </p>
      </div>

      <div className="flex gap-2">
        <button
          className={storyTheme.buttonPrimary}
          onClick={addItem}
          data-testid="add-btn"
        >
          Add item
        </button>
        <button
          className={storyTheme.buttonSuccess}
          onClick={() => patch({ coupon: "SAVE10" })}
          data-testid="coupon-btn"
        >
          Apply coupon
        </button>
        <button
          className={storyTheme.buttonNeutral}
          onClick={() => reset({ items: 3, total: 29.97, coupon: "PRESET" })}
          data-testid="preset-btn"
        >
          Reset to preset
        </button>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof SettingsDemo> = {
  title: "Hooks/useObjectState",
  component: SettingsDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `A hook for managing object state with immutable partial updates (patch/merge) and reset — the ergonomic middle ground between \`useState\` (replace the whole value) and \`useReducer\` (write a reducer).

## Features
- **Partial merge** - \`patch({ field })\` shallow-merges immutably (\`{ ...prev, ...partial }\`); untouched keys are preserved
- **Functional updater** - \`patch(prev => ({ ... }))\` computes the next patch from the current state
- **Reset** - \`reset()\` restores the captured initial value; \`reset(next)\` swaps in a provided object
- **Stable actions** - \`patch\` and \`reset\` keep a stable identity (safe as effect deps)
- **Lazy init** - accepts a factory (run once), just like \`useState\`; cached for \`reset()\`
- **SSR- & StrictMode-safe** - pure state logic, no side effects

> Shallow merge only — a nested object in the patch replaces the previous one wholesale, it is not deep-merged. For array state use \`useList\`.

## Basic Usage
\`\`\`tsx
const [state, patch, reset] = useObjectState({ name: "", age: 0 });
patch({ name: "Alice" });                 // merge a partial
patch((prev) => ({ age: prev.age + 1 })); // functional form
reset();                                   // back to initial
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SettingsDemo>;

export const Default: Story = {
  render: () => <SettingsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A settings panel: each field calls patch with just its own key, and Reset restores the defaults.",
      },
      source: {
        code: `import { useObjectState } from "@usefy/use-object-state";

interface Settings {
  username: string;
  theme: "light" | "dark";
  fontSize: number;
  notifications: boolean;
}

function SettingsPanel() {
  const [settings, patch, reset] = useObjectState<Settings>({
    username: "alice",
    theme: "light",
    fontSize: 14,
    notifications: true,
  });

  return (
    <form>
      <input
        value={settings.username}
        onChange={(e) => patch({ username: e.target.value })}
      />
      <select
        value={settings.theme}
        onChange={(e) => patch({ theme: e.target.value as Settings["theme"] })}
      >
        <option value="light">light</option>
        <option value="dark">dark</option>
      </select>
      <input
        type="checkbox"
        checked={settings.notifications}
        onChange={(e) => patch({ notifications: e.target.checked })}
      />
      <button type="button" onClick={() => reset()}>
        Reset to defaults
      </button>
    </form>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Seeded with defaults.
    await expect(canvas.getByTestId("username-input")).toHaveValue("alice");

    // Patch a single field — others are untouched.
    await userEvent.clear(canvas.getByTestId("username-input"));
    await userEvent.type(canvas.getByTestId("username-input"), "bob");
    await waitFor(() => {
      expect(canvas.getByTestId("username-input")).toHaveValue("bob");
      expect(canvas.getByTestId("state-json")).toHaveTextContent('"username": "bob"');
      // Untouched key preserved.
      expect(canvas.getByTestId("state-json")).toHaveTextContent('"fontSize": 14');
    });

    // Toggle a different field.
    await userEvent.click(canvas.getByTestId("notifications-checkbox"));
    await waitFor(() => {
      expect(canvas.getByTestId("state-json")).toHaveTextContent(
        '"notifications": false'
      );
      // Earlier patch is preserved.
      expect(canvas.getByTestId("username-input")).toHaveValue("bob");
    });

    // Reset restores every default.
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("username-input")).toHaveValue("alice");
      expect(canvas.getByTestId("state-json")).toHaveTextContent(
        '"notifications": true'
      );
    });
  },
};

export const FunctionalPatchAndResetTo: Story = {
  render: () => <CartDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Using the functional updater form of patch to derive the next value from the previous state, plus reset(next) to swap in a provided object.",
      },
      source: {
        code: `import { useObjectState } from "@usefy/use-object-state";

function Cart() {
  const [cart, patch, reset] = useObjectState({
    items: 0,
    total: 0,
    coupon: "none",
  });

  return (
    <div>
      <button
        onClick={() =>
          patch((prev) => ({ items: prev.items + 1, total: prev.total + 9.99 }))
        }
      >
        Add item
      </button>
      <button onClick={() => patch({ coupon: "SAVE10" })}>Apply coupon</button>
      <button
        onClick={() => reset({ items: 3, total: 29.97, coupon: "PRESET" })}
      >
        Reset to preset
      </button>
      <p>{cart.items} items — \${cart.total.toFixed(2)}</p>
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("items")).toHaveTextContent("0");

    // Functional patches accumulate from the previous state.
    await userEvent.click(canvas.getByTestId("add-btn"));
    await userEvent.click(canvas.getByTestId("add-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("items")).toHaveTextContent("2");
      expect(canvas.getByTestId("total")).toHaveTextContent("$19.98");
    });

    // Object patch merges a single field.
    await userEvent.click(canvas.getByTestId("coupon-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("coupon")).toHaveTextContent("SAVE10");
      expect(canvas.getByTestId("items")).toHaveTextContent("2");
    });

    // reset(next) swaps in the provided object wholesale.
    await userEvent.click(canvas.getByTestId("preset-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("items")).toHaveTextContent("3");
      expect(canvas.getByTestId("total")).toHaveTextContent("$29.97");
      expect(canvas.getByTestId("coupon")).toHaveTextContent("PRESET");
    });
  },
};
