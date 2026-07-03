import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { usePreferredColorScheme } from "@usefy/use-preferred-color-scheme";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const scheme = usePreferredColorScheme();
  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>usePreferredColorScheme</h2>
      <p className={storyTheme.subtitle}>
        Follows your OS <code>prefers-color-scheme</code> setting
      </p>
      <div
        className={`p-8 rounded-xl shadow-xl ${
          scheme === "dark" ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900 border-2 border-gray-200"
        }`}
        data-testid="scheme"
      >
        <p className="text-2xl font-bold m-0">
          {scheme === "dark" ? "🌙 dark" : "☀️ light"}
        </p>
      </div>
      <p className="text-gray-500 text-sm mt-4">
        Change your system theme to see this update in real time.
      </p>
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
      description: { story: "Reflects the current OS color-scheme preference." },
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
    const expected = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    await waitFor(() => expect(canvas.getByTestId("scheme")).toHaveTextContent(expected));
  },
};
