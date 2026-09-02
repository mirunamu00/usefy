import React, { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useScrollPosition } from "@usefy/use-scroll-position";
import { within, fireEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Element demo — track a scrollable panel's own offset via a ref. Throttled to
 * the default 100ms; the leading edge updates immediately as you scroll.
 */
function ElementScrollDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y } = useScrollPosition({ element: ref });

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>useScrollPosition</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Scroll the panel — its <code>x</code> / <code>y</code> offset is tracked
        (throttled to 100ms)
      </p>

      <div
        ref={ref}
        data-testid="pane"
        className="mb-5 h-48 overflow-auto rounded-md border border-zinc-200 shadow-inner"
      >
        <div className="relative h-[900px] w-[900px] bg-violet-50">
          <div className="sticky top-2 left-2 inline-block rounded-lg bg-white/80 px-3 py-1 text-sm text-zinc-500 shadow">
            Scroll me in both directions 
          </div>
        </div>
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          scrollLeft (x):{" "}
          <span className={storyTheme.statValue} data-testid="pos-x">
            {x}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          scrollTop (y):{" "}
          <span className={storyTheme.statValue} data-testid="pos-y">
            {y}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * No-throttle demo — `throttleMs: 0` commits on every scroll event for the
 * smoothest possible read-out (at the cost of more re-renders).
 */
function NoThrottleDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const { y } = useScrollPosition({ element: ref, throttleMs: 0 });

  const height = 900;
  const progress = Math.min(100, Math.round((y / (height - 192)) * 100));

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>Unthrottled tracking</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        With <code>throttleMs: 0</code> the progress bar follows every frame
      </p>

      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          data-testid="progress"
          className="h-full bg-violet-600 transition-[width] duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        ref={ref}
        data-testid="pane"
        className="h-48 overflow-auto rounded-md border border-zinc-200 shadow-inner"
      >
        <div style={{ height }} className="bg-white" />
      </div>

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          Scrolled:{" "}
          <span className={storyTheme.statValue} data-testid="pos-y">
            {y}
          </span>
          px ({progress}%)
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof ElementScrollDemo> = {
  title: "Hooks/useScrollPosition",
  component: ElementScrollDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Track the throttled scroll offset (\`{ x, y }\`) of the window or a given element.

By default \`useScrollPosition\` tracks the window/document scroll. Pass an \`element\` (a raw \`HTMLElement\` or a \`RefObject<HTMLElement>\`) to track that element's own scroll instead. The listener is registered with \`{ passive: true }\` and the handler is throttled with a **leading + trailing** edge, so the settled resting position is never dropped.

## Features
- **Window or element** - omit \`element\` for the page scroll, or pass an element / ref
- **Throttled** - \`throttleMs\` (default \`100\`) with leading + trailing edges; \`0\` disables it
- **Synchronous initial read** - the real offset is read on mount, not \`0, 0\`
- **Passive listener** - attached with \`{ passive: true }\` for smooth scrolling
- **SSR-safe & StrictMode-safe** - returns \`{ x: 0, y: 0 }\` on the server, no leaked listeners/timers

## Basic Usage
\`\`\`tsx
const { x, y } = useScrollPosition();

return <div>Scrolled to {x}, {y}</div>;
\`\`\`
`,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ElementScrollDemo>;

export const ElementScroll: Story = {
  render: () => <ElementScrollDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Track a scrollable element's own offset by passing a ref as `element` (throttled to the default 100ms).",
      },
      source: {
        language: "tsx",
        code: `import { useRef } from "react";
import { useScrollPosition } from "@usefy/use-scroll-position";

function Pane() {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y } = useScrollPosition({ element: ref });

  return (
    <div ref={ref} style={{ overflow: "auto", height: 200 }}>
      <p>Offset: {x}, {y}</p>
      <div style={{ width: 900, height: 900 }} />
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pane = canvas.getByTestId("pane");

    expect(canvas.getByTestId("pos-y")).toHaveTextContent("0");

    pane.scrollTop = 150;
    pane.scrollLeft = 60;
    fireEvent.scroll(pane);

    // Leading edge commits immediately.
    await waitFor(() => {
      expect(canvas.getByTestId("pos-y")).toHaveTextContent("150");
      expect(canvas.getByTestId("pos-x")).toHaveTextContent("60");
    });
  },
};

export const NoThrottle: Story = {
  render: () => <NoThrottleDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Set `throttleMs: 0` to commit on every scroll event — the progress bar follows the scroll with no delay.",
      },
      source: {
        language: "tsx",
        code: `import { useRef } from "react";
import { useScrollPosition } from "@usefy/use-scroll-position";

function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const { y } = useScrollPosition({ element: ref, throttleMs: 0 });
  const progress = Math.round((y / 708) * 100);

  return (
    <>
      <div style={{ width: \`\${progress}%\`, height: 4, background: "indigo" }} />
      <div ref={ref} style={{ overflow: "auto", height: 200 }}>
        <div style={{ height: 900 }} />
      </div>
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pane = canvas.getByTestId("pane");

    expect(canvas.getByTestId("pos-y")).toHaveTextContent("0");

    pane.scrollTop = 354;
    fireEvent.scroll(pane);

    await waitFor(() => {
      expect(canvas.getByTestId("pos-y")).toHaveTextContent("354");
    });
  },
};
