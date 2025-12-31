import React, { useState, useRef, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useEventListener } from "@usefy/use-event-listener";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Demo component for window resize event
 */
function WindowResizeDemo() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  const [resizeCount, setResizeCount] = useState(0);

  useEventListener("resize", () => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    setResizeCount((prev) => prev + 1);
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Window Resize Listener
      </h2>

      <div className={storyTheme.gradientBox + " text-center mb-6"}>
        <p className="text-white/80 text-sm mb-2">Window Size</p>
        <p className="text-3xl font-bold text-white" data-testid="window-size">
          {windowSize.width} × {windowSize.height}
        </p>
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Resize Count: </span>
          <span data-testid="resize-count">{resizeCount}</span>
        </p>
      </div>

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Resize the browser window to see the dimensions update.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for keyboard events
 */
function KeyboardEventsDemo() {
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [modifiers, setModifiers] = useState({
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
  });
  const [keyHistory, setKeyHistory] = useState<
    Array<{ key: string; id: number }>
  >([]);

  useEventListener(
    "keydown",
    (event) => {
      setLastKey(event.key);
      setModifiers({
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      });
      setKeyHistory((prev) => [
        { key: event.key, id: Date.now() },
        ...prev.slice(0, 4),
      ]);
    },
    document
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Keyboard Event Listener
      </h2>

      <div className={storyTheme.gradientBox + " text-center mb-6"}>
        {lastKey ? (
          <>
            <p className="text-white/80 text-sm mb-2">Last Key Pressed</p>
            <p className="text-4xl font-bold text-white" data-testid="last-key">
              {lastKey === " " ? "Space" : lastKey}
            </p>
          </>
        ) : (
          <p className="text-white/80 text-lg" data-testid="no-key-message">
            Press any key
          </p>
        )}
      </div>

      <div className={storyTheme.statBox + " mb-4"}>
        <p className={storyTheme.statLabel + " mb-3"}>Modifier Keys:</p>
        <div className="flex gap-2 flex-wrap justify-center">
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              modifiers.ctrl
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            Ctrl
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              modifiers.shift
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            Shift
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              modifiers.alt
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            Alt
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              modifiers.meta
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            Meta
          </span>
        </div>
      </div>

      {keyHistory.length > 0 && (
        <div className={storyTheme.statBox}>
          <p className={storyTheme.statLabel + " mb-3"}>Key History:</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {keyHistory.map(({ key, id }) => (
              <span
                key={id}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
              >
                {key === " " ? "Space" : key}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Press any key to see the key name and modifier states.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for element-specific mouse events
 */
function ElementMouseEventsDemo() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isInside, setIsInside] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEventListener(
    "mousemove",
    (event) => {
      if (boxRef.current) {
        const rect = boxRef.current.getBoundingClientRect();
        setPosition({
          x: Math.round(event.clientX - rect.left),
          y: Math.round(event.clientY - rect.top),
        });
      }
    },
    boxRef
  );

  useEventListener(
    "mouseenter",
    () => {
      setIsInside(true);
    },
    boxRef
  );

  useEventListener(
    "mouseleave",
    () => {
      setIsInside(false);
      setPosition(null);
    },
    boxRef
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Element Mouse Tracking
      </h2>

      <div
        ref={boxRef}
        className={`w-80 h-48 rounded-xl border-2 border-dashed flex items-center justify-center mb-6 transition-colors ${
          isInside
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 bg-gray-50"
        }`}
        data-testid="tracking-box"
      >
        {position ? (
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-1">Mouse Position</p>
            <p
              className="text-2xl font-bold text-indigo-600"
              data-testid="mouse-position"
            >
              ({position.x}, {position.y})
            </p>
          </div>
        ) : (
          <p className="text-gray-400" data-testid="hover-message">
            Hover over this area
          </p>
        )}
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Mouse Status: </span>
          <span
            className={isInside ? "text-green-600" : "text-gray-400"}
            data-testid="inside-status"
          >
            {isInside ? "Inside" : "Outside"}
          </span>
        </p>
      </div>

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Move your mouse over the box to track position relative to the
          element.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for scroll events with passive option
 */
function ScrollEventsDemo() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEventListener(
    "scroll",
    () => {
      if (scrollContainerRef.current) {
        setScrollPosition(scrollContainerRef.current.scrollTop);
        setScrollCount((prev) => prev + 1);
      }
    },
    scrollContainerRef,
    { passive: true }
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Scroll Event (Passive)
      </h2>

      <div
        ref={scrollContainerRef}
        className="w-80 h-48 overflow-y-auto border border-gray-200 rounded-xl mb-6 bg-white"
        data-testid="scroll-container"
      >
        <div className="p-4 space-y-4">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg"
            >
              <p className="text-gray-600">Scroll Item {i + 1}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={storyTheme.statBox}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={storyTheme.statTextSecondary}>Scroll Position</p>
            <p className="text-xl font-bold text-gray-800" data-testid="scroll-position">
              {Math.round(scrollPosition)}px
            </p>
          </div>
          <div>
            <p className={storyTheme.statTextSecondary}>Scroll Events</p>
            <p className="text-xl font-bold text-gray-800" data-testid="scroll-count">
              {scrollCount}
            </p>
          </div>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Scroll the container above. Using passive: true for optimal
          performance.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for conditional event listening
 */
function ConditionalListenerDemo() {
  const [isListening, setIsListening] = useState(true);
  const [clickCount, setClickCount] = useState(0);

  useEventListener(
    "click",
    () => {
      setClickCount((prev) => prev + 1);
    },
    document,
    { enabled: isListening }
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Conditional Listener
      </h2>

      <div className={storyTheme.gradientBox + " text-center mb-6"}>
        <p className="text-white/80 text-sm mb-2">Click Count</p>
        <p className="text-6xl font-bold text-white" data-testid="click-count">
          {clickCount}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsListening((prev) => !prev);
        }}
        className={
          isListening ? storyTheme.buttonDanger : storyTheme.buttonPrimary
        }
        data-testid="toggle-button"
      >
        {isListening ? "Disable Listener" : "Enable Listener"}
      </button>

      <div className={storyTheme.statBox + " mt-6"}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Status: </span>
          <span
            className={isListening ? "text-green-600" : "text-red-500"}
            data-testid="listener-status"
          >
            {isListening ? "Listening" : "Disabled"}
          </span>
        </p>
      </div>

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Toggle the listener on/off. Clicks are only counted when enabled.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for online/offline detection
 */
function NetworkStatusDemo() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [statusHistory, setStatusHistory] = useState<
    Array<{ online: boolean; time: string; id: number }>
  >([]);

  useEventListener("online", () => {
    setIsOnline(true);
    setStatusHistory((prev) => [
      { online: true, time: new Date().toLocaleTimeString(), id: Date.now() },
      ...prev.slice(0, 4),
    ]);
  });

  useEventListener("offline", () => {
    setIsOnline(false);
    setStatusHistory((prev) => [
      { online: false, time: new Date().toLocaleTimeString(), id: Date.now() },
      ...prev.slice(0, 4),
    ]);
  });

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Network Status Listener
      </h2>

      <div
        className={`${storyTheme.gradientBox} text-center mb-6 ${
          isOnline
            ? "from-green-500 to-emerald-600"
            : "from-red-500 to-rose-600"
        }`}
      >
        <p className="text-white/80 text-sm mb-2">Network Status</p>
        <p className="text-4xl font-bold text-white" data-testid="network-status">
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>

      {statusHistory.length > 0 && (
        <div className={storyTheme.statBox}>
          <p className={storyTheme.statLabel + " mb-3"}>Status History:</p>
          <div className="space-y-2">
            {statusHistory.map(({ online, time, id }) => (
              <div
                key={id}
                className="flex justify-between items-center text-sm"
              >
                <span
                  className={online ? "text-green-600" : "text-red-500"}
                >
                  {online ? "Online" : "Offline"}
                </span>
                <span className="text-gray-400">{time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Toggle your network connection to see status changes. (Use DevTools
          Network tab to simulate)
        </p>
      </div>
    </div>
  );
}

const meta: Meta<typeof WindowResizeDemo> = {
  title: "Hooks/useEventListener",
  component: WindowResizeDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A React hook for adding event listeners to DOM elements with automatic cleanup.

## Features
- Type-safe event handling with TypeScript inference
- Support for window, document, HTMLElement, and RefObject
- Automatic cleanup on unmount
- Handler stability (no re-registration on handler change)
- SSR compatible
- Options: enabled, capture, passive, once
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof WindowResizeDemo>;

export const Default: Story = {
  render: () => <WindowResizeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("window-size")).toBeInTheDocument();
    await expect(canvas.getByTestId("resize-count")).toHaveTextContent("0");
  },
};

export const KeyboardEvents: StoryObj<typeof KeyboardEventsDemo> = {
  render: () => <KeyboardEventsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("no-key-message")).toBeInTheDocument();
  },
};

export const ElementMouseEvents: StoryObj<typeof ElementMouseEventsDemo> = {
  render: () => <ElementMouseEventsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("tracking-box");

    await expect(canvas.getByTestId("hover-message")).toBeInTheDocument();
    await expect(canvas.getByTestId("inside-status")).toHaveTextContent("Outside");

    // Simulate mouse enter
    await userEvent.hover(box);

    await waitFor(() => {
      expect(canvas.getByTestId("inside-status")).toHaveTextContent("Inside");
    });
  },
};

export const ScrollEvents: StoryObj<typeof ScrollEventsDemo> = {
  render: () => <ScrollEventsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("scroll-position")).toHaveTextContent("0px");
    await expect(canvas.getByTestId("scroll-count")).toHaveTextContent("0");
  },
};

export const ConditionalListener: StoryObj<typeof ConditionalListenerDemo> = {
  render: () => <ConditionalListenerDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("listener-status")).toHaveTextContent("Listening");
    await expect(canvas.getByTestId("click-count")).toHaveTextContent("0");

    // Click to increment
    await userEvent.click(canvasElement);

    await waitFor(() => {
      expect(canvas.getByTestId("click-count")).toHaveTextContent("1");
    });

    // Disable listener
    const toggleButton = canvas.getByTestId("toggle-button");
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(canvas.getByTestId("listener-status")).toHaveTextContent("Disabled");
    });
  },
};

export const NetworkStatus: StoryObj<typeof NetworkStatusDemo> = {
  render: () => <NetworkStatusDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("network-status")).toBeInTheDocument();
  },
};
