import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { usePreferredColorScheme } from "@usefy/use-preferred-color-scheme";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

type Override = "auto" | "light" | "dark";

function Demo() {
  // The real hook reads the OS setting (read-only from JS).
  const systemScheme = usePreferredColorScheme();

  // Demo-only override so you can preview both schemes without OS settings.
  const [override, setOverride] = useState<Override>("auto");
  const scheme = override === "auto" ? systemScheme : override;

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>usePreferredColorScheme</h2>
      <p className={storyTheme.subtitle}>
        Follows your OS <code>prefers-color-scheme</code> setting
      </p>

      <div
        className={`p-8 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6 ${
          scheme === "dark"
            ? "bg-zinc-900 text-zinc-100"
            : "bg-white text-zinc-900 border border-zinc-200"
        }`}
        data-testid="scheme-box"
      >
        <p className="text-2xl font-bold m-0" data-testid="scheme">
          {scheme === "dark" ? "dark" : "light"}
        </p>
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
          className={override === "light" ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
          data-testid="ov-light"
          onClick={() => setOverride("light")}
        >
          Light
        </button>
        <button
          className={override === "dark" ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
          data-testid="ov-dark"
          onClick={() => setOverride("dark")}
        >
          Dark
        </button>
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          System (real hook value):{" "}
          <span className={storyTheme.statValue} data-testid="system">{systemScheme}</span>
        </p>
        <p className="text-zinc-500 text-sm mt-2">
          The buttons simulate the preference for this demo. In a real app the
          value comes from the OS — change it via DevTools → Rendering → “Emulate
          CSS prefers-color-scheme”, or your OS appearance settings.
        </p>
      </div>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/usePreferredColorScheme",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Returns the user's OS color-scheme preference (\`"light"\` or \`"dark"\`) and updates live when it changes. The system-level primitive under \`useDarkMode\`.

Note: \`prefers-color-scheme\` is an OS-level setting, so the hook is **read-only** — it can't be toggled from JS. The demo below adds simulate buttons so you can preview both schemes.

## Features
- **Live** — reflects OS theme changes immediately
- **SSR-safe** — configurable default scheme
- **Primitive** — pair with your own persistence for a full theme

## Basic Usage
\`\`\`tsx
const scheme = usePreferredColorScheme(); // "light" | "dark"
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
        story: "Use the simulate buttons to preview light vs. dark; “Auto” reflects the real OS value.",
      },
      source: {
        language: "tsx",
        code: `import { usePreferredColorScheme } from "@usefy/use-preferred-color-scheme";

function Component() {
  const scheme = usePreferredColorScheme();
  return <div className={scheme === "dark" ? "theme-dark" : "theme-light"} />;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("ov-dark"));
    await waitFor(() => expect(canvas.getByTestId("scheme")).toHaveTextContent("dark"));
    await userEvent.click(canvas.getByTestId("ov-light"));
    await waitFor(() => expect(canvas.getByTestId("scheme")).toHaveTextContent("light"));
  },
};
