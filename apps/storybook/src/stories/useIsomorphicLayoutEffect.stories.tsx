import React, { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Measured synchronously before paint on the client (no flicker), SSR-safe.
  useIsomorphicLayoutEffect(() => {
    if (ref.current) setWidth(Math.round(ref.current.getBoundingClientRect().width));
  }, []);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useIsomorphicLayoutEffect</h2>
      <p className={storyTheme.subtitle}>Synchronous layout measurement, safe under SSR</p>
      <div ref={ref} className={`${storyTheme.gradientBox} text-white`}>
        <p className="m-0 font-semibold">Measured box</p>
      </div>
      <div className={`${storyTheme.statBox} mt-6`}>
        <p className={storyTheme.statLabel}>
          measured width: <span className={storyTheme.statValue} data-testid="width">{width}</span>px
        </p>
      </div>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useIsomorphicLayoutEffect",
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
    await waitFor(() => {
      const w = Number(canvas.getByTestId("width").textContent);
      expect(w).toBeGreaterThan(0);
    });
  },
};
