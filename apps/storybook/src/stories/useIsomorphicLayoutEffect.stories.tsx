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
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `An SSR-safe \`useLayoutEffect\`: it resolves to \`useLayoutEffect\` in the browser and \`useEffect\` on the server, silencing React's SSR warning while keeping synchronous, flicker-free layout work on the client.

## Features
- **No SSR warning** — falls back to \`useEffect\` on the server
- **Synchronous on client** — measure/mutate the DOM before paint
- **Same signature** — use exactly like \`useLayoutEffect\`

## Basic Usage
\`\`\`tsx
useIsomorphicLayoutEffect(() => {
  measure();
}, []);
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
        story: "The box's width is measured synchronously on mount and shown without a visible layout flash.",
      },
      source: {
        language: "tsx",
        code: `import { useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";

function Measured() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    setWidth(ref.current?.getBoundingClientRect().width ?? 0);
  }, []);

  return <div ref={ref}>Width: {width}px</div>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      const w = Number(canvas.getByTestId("width").textContent);
      expect(w).toBeGreaterThan(0);
    });
  },
};
