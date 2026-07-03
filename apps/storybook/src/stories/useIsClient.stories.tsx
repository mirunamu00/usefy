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
        className={`p-8 rounded-xl text-white shadow-xl bg-gradient-to-br ${
          isClient ? "from-emerald-500 to-teal-600" : "from-gray-400 to-gray-500"
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
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByTestId("env")).toHaveTextContent("Client (hydrated)"));
  },
};
