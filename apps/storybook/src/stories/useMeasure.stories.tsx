import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useMeasure } from "@usefy/use-measure";
import { within, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Live bounds demo — drag the resize handle in the corner of the box and watch
 * every field of the bounds object update in real time.
 */
function BoundsDemo() {
  const [ref, bounds] = useMeasure<HTMLDivElement>();

  const fields: Array<[keyof typeof bounds, string]> = [
    ["width", "width"],
    ["height", "height"],
    ["x", "x"],
    ["y", "y"],
    ["top", "top"],
    ["right", "right"],
    ["bottom", "bottom"],
    ["left", "left"],
  ];

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>useMeasure</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Drag the bottom-right corner of the box to resize it
      </p>

      <div
        ref={ref}
        data-testid="measure-box"
        className="mx-auto mb-6 grid place-items-center text-white font-semibold bg-violet-600 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        style={{
          resize: "both",
          overflow: "auto",
          width: 260,
          height: 160,
          minWidth: 120,
          minHeight: 80,
        }}
      >
        Resize me ⤡
      </div>

      <div className="grid grid-cols-4 gap-3">
        {fields.map(([key, label]) => (
          <div key={key} className={`${storyTheme.statBox} text-center`}>
            <p className={storyTheme.statLabel}>{label}</p>
            <p
              className={storyTheme.statValue}
              data-testid={`bounds-${key}`}
            >
              {Math.round(bounds[key])}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Responsive-layout demo — a common real use for useMeasure: switch layout
 * based on the element's own measured width (container queries in userland).
 */
function ResponsiveDemo() {
  const [ref, bounds] = useMeasure<HTMLDivElement>();
  const isCompact = bounds.width > 0 && bounds.width < 400;

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>Container-aware layout</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Resize the box — below 400px it switches to a compact layout
      </p>

      <div
        ref={ref}
        data-testid="responsive-box"
        className="mx-auto p-6 bg-zinc-50 rounded-md shadow-inner"
        style={{ resize: "horizontal", overflow: "auto", width: 480, minWidth: 200 }}
      >
        <div
          className={`gap-4 ${isCompact ? "flex flex-col" : "flex flex-row items-center"}`}
        >
          <div className="flex-1 p-4 bg-white rounded-lg shadow text-center font-semibold text-zinc-700">
            Panel A
          </div>
          <div className="flex-1 p-4 bg-white rounded-lg shadow text-center font-semibold text-zinc-700">
            Panel B
          </div>
        </div>
      </div>

      <div className={`${storyTheme.statBox} mt-6 text-center`}>
        <p className={storyTheme.statLabel}>
          Measured width:{" "}
          <span className={storyTheme.statValue} data-testid="responsive-width">
            {Math.round(bounds.width)}px
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          Layout:{" "}
          <span className={storyTheme.statValue} data-testid="responsive-layout">
            {isCompact ? "Compact (stacked)" : "Wide (side-by-side)"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof BoundsDemo> = {
  title: "Hooks/useMeasure",
  component: BoundsDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Reactively measure an element's bounds — its size **and** viewport-relative position — via \`ResizeObserver\`.

\`useMeasure\` is the ergonomic "just give me the bounds" convenience layer over [\`useResizeObserver\`](?path=/docs/hooks-useresizeobserver--docs). Reach for \`useResizeObserver\` when you need the low-level knobs (box model, debounce/throttle, raw entries); reach for \`useMeasure\` when you just want the current \`{ x, y, width, height, top, right, bottom, left }\` rect.

## Features
- **Full bounds object** - position (x, y, top, right, bottom, left) and size (width, height)
- **Reactive** - updates whenever the element resizes, via ResizeObserver
- **Callback ref** - \`const [ref, bounds] = useMeasure()\`, no manual wiring
- **SSR-safe** - returns all-zero bounds on the server, measures on attach
- **StrictMode-safe** - equality-guarded updates, stable ref
- **TypeScript-first** - generic over the element type

## Basic Usage
\`\`\`tsx
const [ref, bounds] = useMeasure<HTMLDivElement>();

return <div ref={ref}>{bounds.width} × {bounds.height}</div>;
\`\`\`
`,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BoundsDemo>;

export const Default: Story = {
  render: () => <BoundsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Live view of every field in the bounds object as the element is resized.",
      },
      source: {
        language: "tsx",
        code: `import { useMeasure } from "@usefy/use-measure";

function Component() {
  const [ref, bounds] = useMeasure<HTMLDivElement>();

  return (
    <div ref={ref} style={{ resize: "both", overflow: "auto" }}>
      {Math.round(bounds.width)} × {Math.round(bounds.height)}
      <br />
      at ({Math.round(bounds.x)}, {Math.round(bounds.y)})
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The box is measured on attach, so width/height reflect the real element.
    await waitFor(() => {
      const width = Number(canvas.getByTestId("bounds-width").textContent);
      expect(width).toBeGreaterThan(0);
    });

    const height = Number(canvas.getByTestId("bounds-height").textContent);
    expect(height).toBeGreaterThan(0);
  },
};

export const ResponsiveLayout: Story = {
  render: () => <ResponsiveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Switch layout based on the element's own measured width — userland container queries.",
      },
      source: {
        language: "tsx",
        code: `import { useMeasure } from "@usefy/use-measure";

function Panel() {
  const [ref, bounds] = useMeasure<HTMLDivElement>();
  const isCompact = bounds.width > 0 && bounds.width < 400;

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: isCompact ? "column" : "row" }}>
      <div>Panel A</div>
      <div>Panel B</div>
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // At the initial 480px width the layout is "Wide".
    await waitFor(() => {
      expect(canvas.getByTestId("responsive-layout")).toHaveTextContent("Wide");
    });
  },
};
