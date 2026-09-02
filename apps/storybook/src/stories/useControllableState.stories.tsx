import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useControllableState } from "@usefy/use-controllable-state";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * A reusable switch built on `useControllableState`. It accepts an optional
 * `on`/`onChange` (controlled) *or* falls back to its own state seeded from
 * `defaultOn` (uncontrolled) — the exact pattern component libraries ship.
 */
function Switch({
  on,
  defaultOn,
  onChange,
  testid,
}: {
  on?: boolean;
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
  testid?: string;
}) {
  const [value, setValue] = useControllableState({
    value: on,
    defaultValue: defaultOn ?? false,
    onChange,
  });

  return (
    <button
      role="switch"
      aria-checked={value}
      data-testid={testid}
      onClick={() => setValue((prev) => !prev)}
      className={value ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
    >
      {value ? "On" : "Off"}
    </button>
  );
}

function Demo() {
  // The parent owns this state — it drives the controlled switch.
  const [controlled, setControlled] = useState(false);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useControllableState</h2>
      <p className={storyTheme.subtitle}>
        One component, two modes — controlled by a parent or self-managed
      </p>

      <div className={`${storyTheme.card} mb-5`}>
        <p className={storyTheme.label}>Uncontrolled</p>
        <p className={`${storyTheme.statTextSecondary} text-sm mb-3`}>
          Owns its own state from <code>defaultValue</code>. The parent never
          touches it.
        </p>
        <Switch defaultOn testid="uncontrolled" />
      </div>

      <div className={storyTheme.cardInfo}>
        <p className={storyTheme.label}>Controlled</p>
        <p className={`${storyTheme.statTextSecondary} text-sm mb-3`}>
          The parent holds the value; the switch reflects it and reports changes
          through <code>onChange</code>.
        </p>
        <div className={`${storyTheme.buttonGroup} items-center`}>
          <Switch
            on={controlled}
            onChange={setControlled}
            testid="controlled"
          />
          <button
            className={storyTheme.buttonNeutral}
            data-testid="parent-flip"
            onClick={() => setControlled((p) => !p)}
          >
            Flip from parent
          </button>
        </div>
        <div className={`${storyTheme.statBox} mt-4`}>
          <p className={storyTheme.statLabel}>
            parent state:{" "}
            <span className={storyTheme.statValue} data-testid="parent-value">
              {String(controlled)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useControllableState",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `A state primitive that works in both **controlled** and **uncontrolled** modes — the building block every component library needs. A component can accept \`value\`/\`onChange\` (parent-controlled) *or* manage its own state from \`defaultValue\`, with one hook and no branching at the call site.

## Features
- **Controlled** — when \`value\` is defined, the returned value mirrors it and the setter only calls \`onChange\`
- **Uncontrolled** — when \`value\` is \`undefined\`, the hook owns state seeded from \`defaultValue\`
- **\`useState\` ergonomics** — the setter accepts a value *or* an updater \`(prev) => next\`
- **Stable + StrictMode-safe** — the setter identity is stable; \`onChange\` never double-fires

## Basic Usage
\`\`\`tsx
const [value, setValue] = useControllableState({ value, defaultValue, onChange });
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {
  render: () => <Demo />,
  parameters: {
    docs: {
      description: {
        story:
          "The same `Switch` component rendered twice — once uncontrolled (self-managed) and once controlled by the parent. Note the controlled switch also flips from the parent's own button, because the parent owns the value.",
      },
      source: {
        language: "tsx",
        code: `import { useControllableState } from "@usefy/use-controllable-state";

// A switch that is controllable but works standalone.
function Switch({ on, defaultOn, onChange }: {
  on?: boolean;
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
}) {
  const [value, setValue] = useControllableState({
    value: on,
    defaultValue: defaultOn ?? false,
    onChange,
  });

  return (
    <button role="switch" aria-checked={value} onClick={() => setValue((p) => !p)}>
      {value ? "On" : "Off"}
    </button>
  );
}

// Uncontrolled — manages its own state:
<Switch defaultOn />

// Controlled — the parent owns the value:
const [on, setOn] = useState(false);
<Switch on={on} onChange={setOn} />`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Uncontrolled starts "on" (defaultOn) and flips itself.
    const uncontrolled = canvas.getByTestId("uncontrolled");
    await expect(uncontrolled).toHaveAttribute("aria-checked", "true");
    await userEvent.click(uncontrolled);
    await waitFor(() =>
      expect(uncontrolled).toHaveAttribute("aria-checked", "false")
    );

    // Controlled reflects and reports parent state.
    const controlled = canvas.getByTestId("controlled");
    await expect(controlled).toHaveAttribute("aria-checked", "false");
    await userEvent.click(controlled);
    await waitFor(() => {
      expect(controlled).toHaveAttribute("aria-checked", "true");
      expect(canvas.getByTestId("parent-value")).toHaveTextContent("true");
    });

    // The parent can drive it directly.
    await userEvent.click(canvas.getByTestId("parent-flip"));
    await waitFor(() =>
      expect(controlled).toHaveAttribute("aria-checked", "false")
    );
  },
};
