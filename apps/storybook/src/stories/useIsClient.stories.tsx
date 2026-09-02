import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useIsClient } from "@usefy/use-is-client";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const isClient = useIsClient();
  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useIsClient</h2>
      <p className={storyTheme.subtitle}>
        Returns <code>false</code> on the server / first render, <code>true</code> after hydration
      </p>
      <div
        className={`p-8 rounded-md text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
          isClient ? "bg-emerald-600" : "bg-zinc-400"
        }`}
        data-testid="env"
      >
        <p className="text-2xl font-bold m-0">{isClient ? "Client (hydrated)" : "Server / pre-hydration"}</p>
      </div>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useIsClient",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Detects whether the component has hydrated on the client. Returns \`false\` during SSR and the first client render, then \`true\` — the canonical guard for rendering client-only UI without hydration mismatches.

## Features
- **SSR-safe** — the first render matches the server output
- **Zero config** — no arguments, returns a boolean
- **Hydration guard** — enable client-only UI only after mount

## Basic Usage
\`\`\`tsx
const isClient = useIsClient();
return isClient ? <ClientOnly /> : <ServerFallback />;
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
          "Shows the server / pre-hydration state first, then flips to the client state after mount.",
      },
      source: {
        language: "tsx",
        code: `import { useIsClient } from "@usefy/use-is-client";

function Component() {
  const isClient = useIsClient();

  // Render browser-only UI only after hydration to avoid mismatches
  return isClient ? <ClientOnlyWidget /> : <ServerFallback />;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByTestId("env")).toHaveTextContent("Client (hydrated)"));
  },
};
