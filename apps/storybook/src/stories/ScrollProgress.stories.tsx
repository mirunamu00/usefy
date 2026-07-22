import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "@storybook/test";
import { ScrollProgress } from "@usefy/scroll-progress";
import { storyTheme } from "../styles/storyTheme";

// ============================================================================
// Demo content
// ============================================================================

function LoremSection({ index }: { index: number }) {
  return (
    <section className={storyTheme.card} style={{ marginBottom: 16 }}>
      <p className={storyTheme.statLabel}>Section {index + 1}</p>
      <p className={storyTheme.statTextSecondary}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur.
      </p>
    </section>
  );
}

function LongArticle({ sections = 12 }: { sections?: number }) {
  return (
    <>
      {Array.from({ length: sections }, (_, i) => (
        <LoremSection key={i} index={i} />
      ))}
    </>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof ScrollProgress> = {
  title: "scroll-progress",
  component: ScrollProgress,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `A drop-in reading-progress bar — mount \`<ScrollProgress />\` once and a thin, fixed, non-interactive bar pinned to the top (or bottom) of the viewport fills as the user scrolls: \`scrollTop / (scrollHeight - clientHeight)\`, clamped to 0–1. When the content is shorter than the viewport there is nothing to scroll and the bar stays empty. Built on \`@usefy/use-scroll-position\` (passive, throttleable, SSR-safe, StrictMode-safe).

## Features
- **Zero-config** — inline styles, sensible defaults; no CSS import
- **\`position\`** — pin the bar to the \`"top"\` (default) or \`"bottom"\` edge
- **\`color\` / \`height\` / \`zIndex\`** — restyle the bar without CSS
- **\`target\`** — pass a ref to measure a scrollable container instead of the window
- **\`throttleMs\`** — forwarded to \`useScrollPosition\` (default \`0\` — every scroll event; the fill is a GPU-composited transform, so it stays cheap)
- **\`render\`** — escape hatch receiving the current progress (0–1) to fully own the UI
- **Accessible** — \`role="progressbar"\` with \`aria-valuenow/min/max\` and an overridable \`aria-label\`; \`pointer-events: none\`
- **SSR-safe** — no \`window\` access at render; servers render the bar at 0

## Basic Usage
\`\`\`tsx
import { ScrollProgress } from "@usefy/scroll-progress";

function App() {
  return (
    <>
      <ScrollProgress />
      <YourApp />
    </>
  );
}
\`\`\``,
      },
    },
  },
  argTypes: {
    position: {
      control: "select",
      options: ["top", "bottom"],
      description: "Which viewport edge the fixed bar is pinned to",
      table: {
        type: { summary: "'top' | 'bottom'" },
        defaultValue: { summary: "'top'" },
      },
    },
    color: {
      control: "color",
      description: "Bar fill color (any CSS color)",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "'#3b82f6'" },
      },
    },
    height: {
      control: { type: "number", min: 1, step: 1 },
      description: "Bar thickness — a number is pixels, a string any CSS length",
      table: {
        type: { summary: "number | string" },
        defaultValue: { summary: "3" },
      },
    },
    zIndex: {
      control: { type: "number", min: 0, step: 1 },
      description: "Stacking order of the fixed bar",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "9999" },
      },
    },
    target: {
      description:
        "Ref to the scrollable container to measure; omit to track the window",
      table: { type: { summary: "RefObject<HTMLElement | null>" } },
    },
    throttleMs: {
      control: { type: "number", min: 0, step: 50 },
      description:
        "Throttle interval (ms) for scroll updates; 0 updates on every scroll event",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0" },
      },
    },
    "aria-label": {
      control: "text",
      description: "Accessible name of the progressbar",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "'Scroll progress'" },
      },
    },
    render: {
      description:
        "Escape hatch — fully own the UI; receives the current progress (0–1)",
      table: { type: { summary: "(progress: number) => ReactNode" } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollProgress>;

// ============================================================================
// Overview
// ============================================================================

const OVERVIEW_CODE = `import { ScrollProgress } from "@usefy/scroll-progress";

function App() {
  return (
    <>
      {/* A thin fixed bar at the top of the viewport that fills as you
          scroll — progress = scrollTop / (scrollHeight - clientHeight) */}
      <ScrollProgress />
      <YourArticle />
    </>
  );
}`;

export const Overview: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The default bar pinned to the top of the viewport, filling left → right as the page scrolls. Scroll the canvas to see it move — the bar is a progressbar for assistive tech and never intercepts clicks.",
      },
      source: { language: "tsx", code: OVERVIEW_CODE },
    },
  },
  render: (args) => (
    <div className={storyTheme.container}>
      <ScrollProgress {...args} />
      <h2 className={storyTheme.title}>ScrollProgress</h2>
      <p className={storyTheme.subtitle}>
        Scroll this page — the blue bar fixed to the top of the viewport tracks
        how far through the content you are.
      </p>
      <LongArticle />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const view = canvasElement.ownerDocument.defaultView!;

    const bar = canvas.getByRole("progressbar");
    await expect(bar).toHaveAttribute("aria-label", "Scroll progress");
    await expect(bar).toHaveAttribute("aria-valuemin", "0");
    await expect(bar).toHaveAttribute("aria-valuemax", "100");
    await expect(bar).toHaveAttribute("data-position", "top");

    // Scroll to the very bottom → the bar fills completely.
    view.scrollTo(0, view.document.documentElement.scrollHeight);
    await waitFor(() => expect(bar).toHaveAttribute("aria-valuenow", "100"));

    // And back to the top → empty again.
    view.scrollTo(0, 0);
    await waitFor(() => expect(bar).toHaveAttribute("aria-valuenow", "0"));
  },
};

// ============================================================================
// Custom appearance
// ============================================================================

const CUSTOM_APPEARANCE_CODE = `import { ScrollProgress } from "@usefy/scroll-progress";

<ScrollProgress
  position="bottom"
  color="#10b981"
  height={6}
  zIndex={50}
  aria-label="Reading progress"
  style={{ borderRadius: 3 }}
/>`;

export const CustomAppearance: Story = {
  args: {
    position: "bottom",
    color: "#10b981",
    height: 6,
    zIndex: 50,
    "aria-label": "Reading progress",
    style: { borderRadius: 3 },
  },
  parameters: {
    docs: {
      description: {
        story:
          "A thicker green bar pinned to the bottom edge with a custom z-index, accessible name, and style overrides merged over the defaults.",
      },
      source: { language: "tsx", code: CUSTOM_APPEARANCE_CODE },
    },
  },
  render: (args) => (
    <div className={storyTheme.container}>
      <ScrollProgress {...args} />
      <h2 className={storyTheme.title}>Custom appearance</h2>
      <p className={storyTheme.subtitle}>
        The bar is pinned to the bottom edge — 6px tall, green, and announced
        as "Reading progress".
      </p>
      <LongArticle />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("progressbar");

    await expect(bar).toHaveAttribute("data-position", "bottom");
    await expect(bar).toHaveAttribute("aria-label", "Reading progress");
    await expect(bar).toHaveStyle({ backgroundColor: "#10b981", height: "6px" });
  },
};

// ============================================================================
// Container target
// ============================================================================

const CONTAINER_TARGET_CODE = `import { useRef } from "react";
import { ScrollProgress } from "@usefy/scroll-progress";

function Article() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Measures the container's scroll, not the window's */}
      <ScrollProgress target={ref} color="#8b5cf6" />
      <div ref={ref} style={{ height: 320, overflowY: "auto" }}>
        <LongContent />
      </div>
    </>
  );
}`;

function ContainerTargetDemo() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className={storyTheme.container}>
      <ScrollProgress target={ref} color="#8b5cf6" height={4} />
      <h2 className={storyTheme.title}>Container target</h2>
      <p className={storyTheme.subtitle}>
        The purple bar at the top of the viewport tracks the scrollable box
        below — not the page.
      </p>
      <div
        ref={ref}
        data-testid="scroll-container"
        className={storyTheme.card}
        style={{ height: 320, overflowY: "auto" }}
      >
        <LongArticle sections={10} />
      </div>
    </div>
  );
}

export const ContainerTarget: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Pass a ref as target to measure a scrollable container instead of the window — the bar still pins to the viewport edge, but its fill reflects the container's own scroll position.",
      },
      source: { language: "tsx", code: CONTAINER_TARGET_CODE },
    },
  },
  render: () => <ContainerTargetDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("progressbar");
    const container = canvas.getByTestId("scroll-container");

    await expect(bar).toHaveAttribute("aria-valuenow", "0");

    // Scroll the container (not the window) to the bottom → bar fills.
    container.scrollTop = container.scrollHeight;
    container.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(bar).toHaveAttribute("aria-valuenow", "100"));
  },
};

// ============================================================================
// Render prop (headless)
// ============================================================================

const RENDER_PROP_CODE = `import { ScrollProgress } from "@usefy/scroll-progress";

// Fully own the UI — the scroll tracking still runs.
<ScrollProgress
  render={(progress) => (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        padding: "10px 16px",
        borderRadius: 999,
        color: "#fff",
        background: "#334155",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {Math.round(progress * 100)}% read
    </div>
  )}
/>`;

function RenderPropDemo() {
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Render prop</h2>
      <p className={storyTheme.subtitle}>
        A fully custom floating "percent read" pill — the component only
        supplies the current progress (0–1).
      </p>
      <LongArticle />
      <ScrollProgress
        render={(value) => (
          <div
            data-testid="custom-pill"
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              padding: "10px 16px",
              borderRadius: 999,
              color: "#fff",
              background: "#334155",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(value * 100)}% read
          </div>
        )}
      />
    </div>
  );
}

export const RenderProp: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The render escape hatch replaces the default bar with a custom floating pill while the component keeps measuring scroll progress and hands you the 0–1 value.",
      },
      source: { language: "tsx", code: RENDER_PROP_CODE },
    },
  },
  render: () => <RenderPropDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The default bar never renders alongside the render prop.
    await expect(canvas.queryByRole("progressbar")).not.toBeInTheDocument();
    await expect(canvas.getByTestId("custom-pill")).toHaveTextContent("% read");
  },
};
