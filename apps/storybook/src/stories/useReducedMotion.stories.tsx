import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useReducedMotion } from "@usefy/use-reduced-motion";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const reduced = useReducedMotion();
  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useReducedMotion</h2>
      <p className={storyTheme.subtitle}>
        Respects the <code>prefers-reduced-motion</code> accessibility setting
      </p>

      <div className="flex justify-center my-8">
        <div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"
          style={{
            animation: reduced ? "none" : "usefy-spin 1.2s linear infinite",
          }}
          data-testid="spinner"
        />
        <style>{`@keyframes usefy-spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          prefers-reduced-motion:{" "}
          <span className={storyTheme.statValue} data-testid="flag">
            {String(reduced)}
          </span>
        </p>
        <p className="text-gray-500 text-sm mt-2">
          {reduced ? "Animation disabled" : "Animation running"}
        </p>
      </div>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useReducedMotion",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Returns \`true\` when the user has requested reduced motion (\`prefers-reduced-motion\`), updating live. Use it to disable or tone down animations — a baseline accessibility requirement.

## Features
- **A11y-first** — honor motion sensitivity
- **Live** — reflects setting changes immediately
- **SSR-safe** — configurable default

## Basic Usage
\`\`\`tsx
const reduced = useReducedMotion();
<div style={{ transition: reduced ? "none" : "transform 300ms" }} />;
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
        story: "The spinner animates only when the user has not requested reduced motion.",
      },
      source: {
        language: "tsx",
        code: `import { useReducedMotion } from "@usefy/use-reduced-motion";

function Spinner() {
  const reduced = useReducedMotion();
  return (
    <div
      style={{ animation: reduced ? "none" : "spin 1s linear infinite" }}
    />
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const expected = String(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    await waitFor(() => expect(canvas.getByTestId("flag")).toHaveTextContent(expected));
  },
};
