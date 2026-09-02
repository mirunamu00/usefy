import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useMediaQuery } from "@usefy/use-media-query";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

const QUERIES = [
  "(min-width: 640px)",
  "(min-width: 768px)",
  "(min-width: 1024px)",
  "(orientation: landscape)",
  "(prefers-color-scheme: dark)",
];

function Demo() {
  const isTablet = useMediaQuery("(min-width: 768px)");
  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useMediaQuery</h2>
      <p className={storyTheme.subtitle}>Resize the window — the match updates live</p>

      <div
        className={`p-8 rounded-md text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
          isTablet ? "bg-violet-600" : "bg-red-600"
        }`}
        data-testid="match"
      >
        <p className="text-xl font-bold m-0">
          (min-width: 768px) → {isTablet ? "matches ✓" : "no match ✗"}
        </p>
      </div>

      <div className={`${storyTheme.statBox} mt-6 text-left`}>
        {QUERIES.map((q) => (
          <Row key={q} query={q} />
        ))}
      </div>
    </div>
  );
}

function Row({ query }: { query: string }) {
  const matches = useMediaQuery(query);
  return (
    <p className={storyTheme.statLabel}>
      <code>{query}</code> →{" "}
      <span className={storyTheme.statValue}>{matches ? "true" : "false"}</span>
    </p>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useMediaQuery",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Tracks whether a CSS media query matches, updating live on change. Built on \`window.matchMedia\` and SSR-safe.

## Features
- **Live updates** — re-renders when the query starts/stops matching
- **SSR-safe** — configurable default + optional deferred initialization
- **Any query** — breakpoints, orientation, \`prefers-*\`, etc.

## Basic Usage
\`\`\`tsx
const isDesktop = useMediaQuery("(min-width: 1024px)");
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
        story: "Common queries evaluated against the current viewport; resize to see them flip.",
      },
      source: {
        language: "tsx",
        code: `import { useMediaQuery } from "@usefy/use-media-query";

function Nav() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return isDesktop ? <DesktopNav /> : <MobileNav />;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const expected = window.matchMedia("(min-width: 768px)").matches
      ? "matches"
      : "no match";
    await waitFor(() =>
      expect(canvas.getByTestId("match")).toHaveTextContent(expected)
    );
  },
};
