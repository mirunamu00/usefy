import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useDarkMode, type DarkModeMode } from "@usefy/use-dark-mode";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

const MODES: DarkModeMode[] = ["system", "light", "dark"];

function Demo() {
  // Scope DOM application to a harmless attribute so the Storybook chrome
  // isn't recolored; real apps use the default `dark` class on <html>.
  const { mode, isDark, setMode, toggle } = useDarkMode({
    storageKey: "usefy-storybook-dark-mode",
    attribute: "data-usefy-demo-theme",
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useDarkMode</h2>
      <p className={storyTheme.subtitle}>System / light / dark, persisted and synced across tabs</p>

      <div
        className={`p-8 rounded-xl shadow-xl mb-6 ${
          isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900 border-2 border-gray-200"
        }`}
        data-testid="preview"
      >
        <p className="text-2xl font-bold m-0">{isDark ? "🌙 Dark" : "☀️ Light"}</p>
      </div>

      <div className={`${storyTheme.buttonGroup} justify-center mb-4`}>
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={mode === m ? storyTheme.buttonPrimary : storyTheme.buttonNeutral}
            data-testid={`mode-${m}`}
          >
            {m}
          </button>
        ))}
      </div>

      <button className={storyTheme.buttonSecondary} data-testid="toggle" onClick={toggle}>
        Toggle
      </button>

      <div className={`${storyTheme.statBox} mt-6`}>
        <p className={storyTheme.statLabel}>
          mode: <span className={storyTheme.statValue} data-testid="mode">{mode}</span>
        </p>
        <p className={storyTheme.statLabel}>
          isDark: <span className={storyTheme.statValue} data-testid="isDark">{String(isDark)}</span>
        </p>
      </div>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useDarkMode",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Dark mode with three modes (\`system\` / \`light\` / \`dark\`), OS detection, \`localStorage\` persistence, cross-tab sync, and automatic DOM application (a \`dark\` class on \`<html>\` by default, or a custom attribute).

## Features
- **Three modes** — \`system\` follows the OS; \`light\`/\`dark\` override
- **Persisted + synced** — saved to \`localStorage\`, kept in sync across tabs
- **DOM application** — toggles a class or writes an attribute for you
- **\`isDark\`** — the resolved theme, including \`system\`

## Basic Usage
\`\`\`tsx
const { isDark, toggle } = useDarkMode();
<button onClick={toggle}>{isDark ? "🌙" : "☀️"}</button>;
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
        story: "Switch between system/light/dark or toggle; the resolved theme drives the preview.",
      },
      source: {
        language: "tsx",
        code: `import { useDarkMode } from "@usefy/use-dark-mode";

function ThemeToggle() {
  const { mode, isDark, setMode, toggle } = useDarkMode();

  return (
    <div>
      <button onClick={toggle}>{isDark ? "🌙" : "☀️"}</button>
      <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("mode-dark"));
    await waitFor(() => expect(canvas.getByTestId("isDark")).toHaveTextContent("true"));
    await userEvent.click(canvas.getByTestId("toggle"));
    await waitFor(() => {
      expect(canvas.getByTestId("mode")).toHaveTextContent("light");
      expect(canvas.getByTestId("isDark")).toHaveTextContent("false");
    });
  },
};
