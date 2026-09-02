import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useHover } from "@usefy/use-hover";
import { within, userEvent, expect, waitFor, fireEvent } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Basic hover demo
 */
function BasicHoverDemo() {
  const { ref, isHovered } = useHover<HTMLDivElement>();

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useHover Basic Demo</h2>
      <p className={storyTheme.subtitle}>Hover over the box below</p>

      <div
        ref={ref}
        className={`p-8 rounded-md transition-all duration-200 cursor-pointer ${
          isHovered
            ? "bg-violet-600 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-105"
            : "bg-zinc-100 text-zinc-700"
        }`}
        data-testid="hover-box"
      >
        <p className="text-lg font-semibold m-0">
          {isHovered ? "Hovering!" : "Hover me"}
        </p>
      </div>

      <div className={`${storyTheme.statBox} mt-6`}>
        <p className={storyTheme.statLabel}>
          Status:{" "}
          <span
            className={storyTheme.statValue}
            data-testid="hover-status"
          >
            {isHovered ? "Hovered" : "Not Hovered"}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Tuple destructuring demo
 */
function TupleDestructuringDemo() {
  const [ref, isHovered] = useHover<HTMLDivElement>();

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Tuple Destructuring</h2>
      <p className={storyTheme.subtitle}>
        Using <code>[ref, isHovered] = useHover()</code> syntax
      </p>

      <div
        ref={ref}
        className={`p-8 rounded-md transition-all duration-200 cursor-pointer ${
          isHovered
            ? "bg-violet-600 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            : "bg-zinc-100 text-zinc-700"
        }`}
        data-testid="tuple-box"
      >
        <p className="text-lg font-semibold m-0">
          {isHovered ? "Works with tuples!" : "Hover me"}
        </p>
      </div>
    </div>
  );
}

/**
 * Delayed hover demo
 */
function DelayedHoverDemo() {
  const { ref, isHovered } = useHover<HTMLDivElement>({
    delay: { enter: 300, leave: 500 },
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Delayed Hover</h2>
      <p className={storyTheme.subtitle}>
        Enter delay: 300ms, Leave delay: 500ms
      </p>

      <div
        ref={ref}
        className={`p-8 rounded-md transition-all duration-200 cursor-pointer ${
          isHovered
            ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            : "bg-zinc-100 text-zinc-700"
        }`}
        data-testid="delayed-box"
      >
        <p className="text-lg font-semibold m-0">
          {isHovered ? "Delayed hover active!" : "Hover and wait..."}
        </p>
      </div>

      <div className={`${storyTheme.statBox} mt-6`}>
        <p className={storyTheme.statLabel}>
          Status:{" "}
          <span className={storyTheme.statValue} data-testid="delayed-status">
            {isHovered ? "Hovered" : "Not Hovered"}
          </span>
        </p>
        <p className="text-zinc-500 text-sm mt-2">
          Notice the delay when hovering and leaving
        </p>
      </div>
    </div>
  );
}

/**
 * Tooltip demo
 */
function TooltipDemo() {
  const { ref, isHovered } = useHover<HTMLButtonElement>({
    delay: { enter: 500, leave: 100 },
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Tooltip Pattern</h2>
      <p className={storyTheme.subtitle}>
        Hover over the button to see the tooltip (500ms delay)
      </p>

      <div className="relative inline-block">
        <button
          ref={ref}
          className={storyTheme.buttonPrimary}
          data-testid="tooltip-trigger"
        >
          Hover for tooltip
        </button>
        {isHovered && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg whitespace-nowrap shadow-sm"
            data-testid="tooltip"
          >
            This is a helpful tooltip!
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Dropdown menu demo
 */
function DropdownDemo() {
  const { ref, isHovered } = useHover<HTMLDivElement>({
    delay: { leave: 300 },
  });
  const menuItems = ["Profile", "Settings", "Notifications", "Help", "Logout"];

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Dropdown Menu</h2>
      <p className={storyTheme.subtitle}>
        Hover over the button to show the dropdown (300ms leave delay)
      </p>

      <div ref={ref} className="relative inline-block" data-testid="dropdown-container">
        <button
          className={storyTheme.buttonPrimary}
          data-testid="dropdown-trigger"
        >
          Menu
          <span className="ml-2">{isHovered ? "▲" : "▼"}</span>
        </button>
        {isHovered && (
          <div
            className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-zinc-200 py-2 z-10"
            data-testid="dropdown-menu"
          >
            {menuItems.map((item, index) => (
              <button
                key={item}
                className="w-full text-left px-4 py-2 text-zinc-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                data-testid={`menu-item-${index}`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Card preview demo
 */
function CardPreviewDemo() {
  const cards = [
    {
      id: 1,
      title: "React Hooks",
      description: "Learn about React hooks and state management",
      color: "bg-violet-600",
    },
    {
      id: 2,
      title: "TypeScript",
      description: "Type-safe development with TypeScript",
      color: "bg-violet-600",
    },
    {
      id: 3,
      title: "Testing",
      description: "Write robust tests for your applications",
      color: "bg-violet-600",
    },
  ];

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>Card Preview</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Hover over cards to reveal more details
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <HoverCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  );
}

function HoverCard({
  title,
  description,
  color,
}: {
  title: string;
  description: string;
  color: string;
}) {
  const { ref, isHovered } = useHover<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`p-6 rounded-md border transition-all duration-200 cursor-pointer ${
        isHovered
          ? `border-transparent ${color} text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] -translate-y-2`
          : "border-zinc-200 bg-white text-zinc-700"
      }`}
      data-testid={`card-${title.toLowerCase().replace(" ", "-")}`}
    >
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p
        className={`text-sm transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-60"
        }`}
      >
        {description}
      </p>
      {isHovered && (
        <button
          className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Learn More
        </button>
      )}
    </div>
  );
}

/**
 * Conditional enable demo
 */
function ConditionalDemo() {
  const [enabled, setEnabled] = useState(true);
  const { ref, isHovered } = useHover<HTMLDivElement>({ enabled });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Conditional Hover</h2>
      <p className={storyTheme.subtitle}>
        Toggle hover detection on/off
      </p>

      <div className="mb-6">
        <label className="flex items-center justify-center gap-3 cursor-pointer">
          <span className="text-zinc-700 font-medium">Hover Detection:</span>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
              enabled ? "bg-violet-600" : "bg-zinc-300"
            }`}
            data-testid="toggle-enabled"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow ${
                enabled ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-zinc-500 text-sm">
            ({enabled ? "Enabled" : "Disabled"})
          </span>
        </label>
      </div>

      <div
        ref={ref}
        className={`p-8 rounded-md transition-all duration-200 cursor-pointer ${
          !enabled
            ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            : isHovered
            ? "bg-amber-500 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-105"
            : "bg-zinc-100 text-zinc-700"
        }`}
        data-testid="conditional-box"
      >
        <p className="text-lg font-semibold m-0">
          {!enabled
            ? "Hover disabled"
            : isHovered
            ? "Hovering!"
            : "Hover me"}
        </p>
      </div>

      <div className={`${storyTheme.statBox} mt-6`}>
        <p className={storyTheme.statLabel}>
          Enabled: <span className={storyTheme.statValue}>{enabled.toString()}</span>
        </p>
        <p className={storyTheme.statLabel}>
          isHovered: <span className={storyTheme.statValue} data-testid="conditional-status">{isHovered.toString()}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * onChange callback demo
 */
function CallbackDemo() {
  const [events, setEvents] = useState<string[]>([]);
  const { ref, isHovered } = useHover<HTMLDivElement>({
    onChange: (hovered, event) => {
      const time = new Date().toLocaleTimeString();
      const position = event
        ? `(${(event as MouseEvent).clientX}, ${(event as MouseEvent).clientY})`
        : "";
      setEvents((prev) =>
        [
          `${time}: ${hovered ? "Entered" : "Left"} ${position}`,
          ...prev.slice(0, 9),
        ]
      );
    },
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>onChange Callback</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Track hover events with callback
      </p>

      <div className="flex gap-6">
        <div className="flex-1">
          <div
            ref={ref}
            className={`p-8 rounded-md transition-all duration-200 cursor-pointer text-center ${
              isHovered
                ? "bg-violet-600 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                : "bg-zinc-100 text-zinc-700"
            }`}
            data-testid="callback-box"
          >
            <p className="text-lg font-semibold m-0">
              {isHovered ? "Hovering!" : "Hover me"}
            </p>
          </div>
        </div>

        <div className="flex-1">
          <div className={storyTheme.card}>
            <h3 className="font-semibold text-zinc-700 mb-3">Event Log:</h3>
            <div className="h-48 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-zinc-400 text-sm italic">
                  Hover over the box to see events...
                </p>
              ) : (
                <ul className="text-sm space-y-1">
                  {events.map((event, index) => (
                    <li
                      key={index}
                      className={`py-1 px-2 rounded ${
                        event.includes("Entered")
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                      data-testid={`event-${index}`}
                    >
                      {event}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Touch support demo (detectTouch)
 */
function MobileTouchDemo() {
  const { ref, isHovered } = useHover<HTMLButtonElement>({
    detectTouch: true,
    delay: { enter: 0, leave: 1500 },
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Touch Support</h2>
      <p className={storyTheme.subtitle}>
        Tap or hover the button — <code>detectTouch: true</code>
      </p>

      <button
        ref={ref}
        className={`px-8 py-4 rounded-md font-semibold transition-all duration-200 cursor-pointer ${
          isHovered
            ? "bg-violet-600 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-105"
            : "bg-zinc-100 text-zinc-700"
        }`}
        data-testid="touch-button"
      >
        {isHovered ? "Tapped / Hovered!" : "Tap or hover"}
      </button>

      <div className={`${storyTheme.statBox} mt-6`}>
        <p className={storyTheme.statLabel}>
          Status:{" "}
          <span className={storyTheme.statValue} data-testid="touch-status">
            {isHovered ? "Active" : "Inactive"}
          </span>
        </p>
        <p className="text-zinc-500 text-sm mt-2">
          Stays active for 1.5s after the touch ends
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof BasicHoverDemo> = {
  title: "Hooks/useHover",
  component: BasicHoverDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `A hook for detecting hover state on elements with support for delays, touch events, and conditional activation.

## Features
- **mouseenter/mouseleave detection** - Efficient event handling
- **Configurable delays** - Separate enter/leave delays for tooltips and dropdowns
- **Conditional enabling** - Dynamically enable/disable hover detection
- **Touch support** - Optional touch event detection for hybrid devices
- **SSR compatible** - Safe to use in server-side rendering
- **TypeScript support** - Full type inference with generics
- **Flexible API** - Both object and tuple destructuring

## Basic Usage
\`\`\`tsx
const { ref, isHovered } = useHover<HTMLDivElement>();
// or with tuple destructuring
const [ref, isHovered] = useHover<HTMLDivElement>();
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BasicHoverDemo>;

export const Default: Story = {
  render: () => <BasicHoverDemo />,
  parameters: {
    docs: {
      description: {
        story: "Basic hover detection with visual feedback.",
      },
      source: {
        code: `import { useHover } from "@usefy/use-hover";

function Component() {
  const { ref, isHovered } = useHover<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ background: isHovered ? "lightblue" : "white" }}
    >
      {isHovered ? "Hovering!" : "Hover me"}
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hoverBox = canvas.getByTestId("hover-box");

    // Initial state
    await expect(canvas.getByTestId("hover-status")).toHaveTextContent(
      "Not Hovered"
    );

    // Hover
    await userEvent.hover(hoverBox);
    await waitFor(() => {
      expect(canvas.getByTestId("hover-status")).toHaveTextContent("Hovered");
    });

    // Unhover
    await userEvent.unhover(hoverBox);
    await waitFor(() => {
      expect(canvas.getByTestId("hover-status")).toHaveTextContent(
        "Not Hovered"
      );
    });
  },
};

export const TupleDestructuring: Story = {
  render: () => <TupleDestructuringDemo />,
  parameters: {
    docs: {
      description: {
        story: "Using tuple destructuring syntax for a more concise API.",
      },
      source: {
        code: `import { useHover } from "@usefy/use-hover";

function Component() {
  const [ref, isHovered] = useHover<HTMLDivElement>();

  return (
    <div ref={ref}>
      {isHovered ? "Hovering!" : "Hover me"}
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
};

export const WithDelay: Story = {
  render: () => <DelayedHoverDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Configurable enter and leave delays to prevent flickering on quick movements.",
      },
      source: {
        code: `import { useHover } from "@usefy/use-hover";

function Component() {
  const { ref, isHovered } = useHover<HTMLDivElement>({
    delay: { enter: 300, leave: 500 }
  });

  return (
    <div ref={ref}>
      {isHovered ? "Delayed hover!" : "Hover and wait..."}
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const delayedBox = canvas.getByTestId("delayed-box");

    // Initial state
    await expect(canvas.getByTestId("delayed-status")).toHaveTextContent(
      "Not Hovered"
    );

    // Hover and wait for delay
    await userEvent.hover(delayedBox);

    // Should not be hovered immediately
    await expect(canvas.getByTestId("delayed-status")).toHaveTextContent(
      "Not Hovered"
    );

    // Wait for enter delay
    await waitFor(
      () => {
        expect(canvas.getByTestId("delayed-status")).toHaveTextContent(
          "Hovered"
        );
      },
      { timeout: 500 }
    );
  },
};

export const Tooltip: Story = {
  render: () => <TooltipDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Tooltip pattern with enter delay to prevent accidental tooltips on quick mouse movements.",
      },
      source: {
        code: `import { useHover } from "@usefy/use-hover";

function TooltipButton() {
  const { ref, isHovered } = useHover<HTMLButtonElement>({
    delay: { enter: 500, leave: 100 }
  });

  return (
    <div className="relative">
      <button ref={ref}>Hover for tooltip</button>
      {isHovered && (
        <div className="tooltip">
          Helpful tooltip content!
        </div>
      )}
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Tooltip should not be visible initially
    expect(canvas.queryByTestId("tooltip")).not.toBeInTheDocument();

    // Hover and wait for delay
    await userEvent.hover(canvas.getByTestId("tooltip-trigger"));
    await waitFor(
      () => {
        expect(canvas.getByTestId("tooltip")).toBeInTheDocument();
      },
      { timeout: 700 }
    );

    // Unhover - tooltip should disappear quickly
    await userEvent.unhover(canvas.getByTestId("tooltip-trigger"));
    await waitFor(() => {
      expect(canvas.queryByTestId("tooltip")).not.toBeInTheDocument();
    });
  },
};

export const Dropdown: Story = {
  render: () => <DropdownDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Dropdown menu pattern with leave delay to allow users to move their cursor to the menu.",
      },
      source: {
        code: `import { useHover } from "@usefy/use-hover";

function DropdownMenu() {
  const { ref, isHovered } = useHover<HTMLDivElement>({
    delay: { leave: 300 }
  });

  return (
    <div ref={ref} className="relative">
      <button>Menu</button>
      {isHovered && (
        <div className="dropdown">
          <button>Profile</button>
          <button>Settings</button>
          <button>Logout</button>
        </div>
      )}
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Menu should not be visible initially
    expect(canvas.queryByTestId("dropdown-menu")).not.toBeInTheDocument();

    // Hover to show menu
    await userEvent.hover(canvas.getByTestId("dropdown-trigger"));
    await waitFor(() => {
      expect(canvas.getByTestId("dropdown-menu")).toBeInTheDocument();
    });

    // Check menu items
    expect(canvas.getByTestId("menu-item-0")).toHaveTextContent("Profile");
  },
};

export const CardPreview: Story = {
  render: () => <CardPreviewDemo />,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "Interactive card previews that reveal more content on hover. Each card owns its own `useHover` instance, so hovering one card never affects the others.",
      },
      source: {
        code: `import { useHover } from "@usefy/use-hover";

function CardGrid() {
  const cards = [
    { id: 1, title: "React Hooks", description: "Learn about React hooks" },
    { id: 2, title: "TypeScript", description: "Type-safe development" },
    { id: 3, title: "Testing", description: "Write robust tests" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <HoverCard key={card.id} {...card} />
      ))}
    </div>
  );
}

// Each card owns its own hover state.
function HoverCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { ref, isHovered } = useHover<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{
        transform: isHovered ? "translateY(-8px)" : "none",
        boxShadow: isHovered ? "0 12px 24px rgba(0,0,0,0.15)" : "none",
        transition: "all 0.3s",
      }}
    >
      <h3>{title}</h3>
      <p>{description}</p>
      {isHovered && <button>Learn More</button>}
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
};

export const Conditional: Story = {
  render: () => <ConditionalDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Dynamically enable/disable hover detection using the `enabled` option.",
      },
      source: {
        code: `import { useHover } from "@usefy/use-hover";
import { useState } from "react";

function ConditionalHover() {
  const [enabled, setEnabled] = useState(true);
  const { ref, isHovered } = useHover<HTMLDivElement>({ enabled });

  return (
    <div>
      <button onClick={() => setEnabled(!enabled)}>
        Toggle: {enabled ? "On" : "Off"}
      </button>
      <div ref={ref}>
        {isHovered ? "Hovering!" : "Hover me"}
      </div>
    </div>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const conditionalBox = canvas.getByTestId("conditional-box");
    const toggleButton = canvas.getByTestId("toggle-enabled");

    // Initially enabled, hover should work
    await userEvent.hover(conditionalBox);
    await waitFor(() => {
      expect(canvas.getByTestId("conditional-status")).toHaveTextContent("true");
    });

    await userEvent.unhover(conditionalBox);
    await waitFor(() => {
      expect(canvas.getByTestId("conditional-status")).toHaveTextContent("false");
    });

    // Disable hover
    await userEvent.click(toggleButton);

    // Hover should not work when disabled
    await userEvent.hover(conditionalBox);
    await waitFor(() => {
      expect(canvas.getByTestId("conditional-status")).toHaveTextContent("false");
    });
  },
};

export const WithCallback: Story = {
  render: () => <CallbackDemo />,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "Using the `onChange` callback to track hover events and mouse positions.",
      },
      source: {
        code: `import { useHover } from "@usefy/use-hover";

function TrackedElement() {
  const { ref, isHovered } = useHover<HTMLDivElement>({
    onChange: (hovered, event) => {
      console.log('Hover:', hovered);
      if (event) {
        console.log('Position:', event.clientX, event.clientY);
      }
    }
  });

  return <div ref={ref}>Tracked element</div>;
}`,
        language: "tsx",
      },
    },
  },
};

export const MobileTouch: Story = {
  render: () => <MobileTouchDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Enable `detectTouch` so `touchstart`/`touchend` also drive hover state on hybrid and mobile devices. A touch and its synthesized mouse event count as a single transition, so `onChange` fires exactly once per tap.",
      },
      source: {
        code: `import { useHover } from "@usefy/use-hover";

function MobileTooltip() {
  const { ref, isHovered } = useHover<HTMLButtonElement>({
    detectTouch: true,
    delay: { enter: 0, leave: 1500 }, // stay visible for 1.5s after touch ends
  });

  return (
    <button ref={ref}>
      {isHovered ? "Tapped/Hovered!" : "Tap or hover"}
    </button>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId("touch-button");

    // Initial state
    await expect(canvas.getByTestId("touch-status")).toHaveTextContent(
      "Inactive"
    );

    // Simulate a touch tap — activates immediately (enter delay 0)
    fireEvent.touchStart(button);
    await waitFor(() => {
      expect(canvas.getByTestId("touch-status")).toHaveTextContent("Active");
    });

    // Touch end — deactivates after the 1.5s leave delay
    fireEvent.touchEnd(button);
    await waitFor(
      () => {
        expect(canvas.getByTestId("touch-status")).toHaveTextContent(
          "Inactive"
        );
      },
      { timeout: 2500 }
    );
  },
};
