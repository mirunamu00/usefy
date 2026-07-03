import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useReducedMotion } from "@usefy/use-reduced-motion";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

type Override = "auto" | "reduce" | "allow";

function Demo() {
  // The real hook reads the OS setting (read-only — it can't be changed from JS).
  const systemReduced = useReducedMotion();

  // Demo-only override so you can preview both states without touching OS settings.
  const [override, setOverride] = useState<Override>("auto");
  const reduced = override === "auto" ? systemReduced : override === "reduce";

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useReducedMotion</h2>
      <p className={storyTheme.subtitle}>
        Respects the <code>prefers-reduced-motion</code> accessibility setting
      </p>

      <div className="flex justify-center my-8">
        <div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"
          style={{ animation: reduced ? "none" : "usefy-spin 1.2s linear infinite" }}
          data-testid="spinner"
        />
        <style>{`@keyframes usefy-spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <div className={`${storyTheme.buttonGroup} justify-center mb-4`}>
        <button
          className={override === "auto" ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
          data-testid="ov-auto"
          onClick={() => setOverride("auto")}
        >
          Auto (system)
        </button>
        <button
          className={override === "reduce" ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
          data-testid="ov-reduce"
          onClick={() => setOverride("reduce")}
        >
          Force reduce
        </button>
        <button
          className={override === "allow" ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
          data-testid="ov-allow"
          onClick={() => setOverride("allow")}
        >
          Force allow
        </button>
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          System (real hook value):{" "}
          <span className={storyTheme.statValue} data-testid="system">{String(systemReduced)}</span>
        </p>
        <p className={storyTheme.statLabel}>
          Effective:{" "}
          <span className={storyTheme.statValue} data-testid="flag">{String(reduced)}</span>{" "}
          — {reduced ? "animation disabled" : "animation running"}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          The buttons simulate the setting for this demo. In a real app the value
          comes from the OS — change it via DevTools → Rendering → “Emulate CSS
          prefers-reduced-motion”, or your OS accessibility settings.
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

Note: \`prefers-reduced-motion\` is an OS-level setting, so the hook is **read-only** — it can't be toggled from JS. The demo below adds simulate buttons so you can preview both states.

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
        story:
          "Use the simulate buttons to preview reduced vs. full motion; the spinner stops when motion is reduced.",
      },
      source: {
        language: "tsx",
        code: `import { useReducedMotion } from "@usefy/use-reduced-motion";

function Spinner() {
  const reduced = useReducedMotion();
  return (
    <div style={{ animation: reduced ? "none" : "spin 1s linear infinite" }} />
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("ov-reduce"));
    await waitFor(() => {
      expect(canvas.getByTestId("flag")).toHaveTextContent("true");
      expect(canvas.getByTestId("spinner").style.animation).toBe("none");
    });
    await userEvent.click(canvas.getByTestId("ov-allow"));
    await waitFor(() => expect(canvas.getByTestId("flag")).toHaveTextContent("false"));
  },
};
