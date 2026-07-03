import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useIsFirstRender } from "@usefy/use-is-first-render";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const isFirst = useIsFirstRender();
  const [, force] = useState(0);
  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useIsFirstRender</h2>
      <p className={storyTheme.subtitle}>True only on the very first render</p>
      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          isFirstRender:{" "}
          <span className={storyTheme.statValue} data-testid="flag">
            {String(isFirst)}
          </span>
        </p>
      </div>
      <button className={`${storyTheme.buttonPrimary} mt-6`} data-testid="rerender" onClick={() => force((n) => n + 1)}>
        Re-render
      </button>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useIsFirstRender",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Returns \`true\` on the component's first render and \`false\` on every render thereafter. Useful for skipping initial-render logic — an \`onChange\` you don't want firing on mount, or gating an animation to updates only.

## Features
- **Ref-based** — flips during render, no extra re-render
- **Per-instance** — each component instance tracks its own first render

## Basic Usage
\`\`\`tsx
const isFirst = useIsFirstRender();
if (!isFirst) runUpdateLogic();
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
        story: "The flag reads true on first paint, then false after any re-render.",
      },
      source: {
        language: "tsx",
        code: `import { useEffect } from "react";
import { useIsFirstRender } from "@usefy/use-is-first-render";

function OnChange({ value }: { value: string }) {
  const isFirst = useIsFirstRender();

  useEffect(() => {
    if (isFirst) return; // skip the initial render
    onValueChange(value);
  }, [value]);

  return null;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("rerender"));
    await waitFor(() => expect(canvas.getByTestId("flag")).toHaveTextContent("false"));
  },
};
