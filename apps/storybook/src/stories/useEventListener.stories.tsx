import React, { useState, useRef } from "react";
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
        className="w-80 border border-gray-200 rounded-xl mb-6 bg-white"
        style={{ height: "200px", overflowY: "scroll" }}
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

/**
 * Demo component for focus/blur events
 */
function FocusBlurDemo() {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const [focusHistory, setFocusHistory] = useState<
    Array<{ element: string; type: "focus" | "blur"; id: number }>
  >([]);
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEventListener(
    "focus",
    () => {
      setFocusedElement("Input 1");
      setFocusHistory((prev) => [
        { element: "Input 1", type: "focus", id: Date.now() },
        ...prev.slice(0, 4),
      ]);
    },
    input1Ref
  );

  useEventListener(
    "blur",
    () => {
      setFocusHistory((prev) => [
        { element: "Input 1", type: "blur", id: Date.now() },
        ...prev.slice(0, 4),
      ]);
    },
    input1Ref
  );

  useEventListener(
    "focus",
    () => {
      setFocusedElement("Input 2");
      setFocusHistory((prev) => [
        { element: "Input 2", type: "focus", id: Date.now() },
        ...prev.slice(0, 4),
      ]);
    },
    input2Ref
  );

  useEventListener(
    "blur",
    () => {
      setFocusHistory((prev) => [
        { element: "Input 2", type: "blur", id: Date.now() },
        ...prev.slice(0, 4),
      ]);
    },
    input2Ref
  );

  useEventListener(
    "focus",
    () => {
      setFocusedElement("Button");
      setFocusHistory((prev) => [
        { element: "Button", type: "focus", id: Date.now() },
        ...prev.slice(0, 4),
      ]);
    },
    buttonRef
  );

  useEventListener(
    "blur",
    () => {
      setFocusHistory((prev) => [
        { element: "Button", type: "blur", id: Date.now() },
        ...prev.slice(0, 4),
      ]);
    },
    buttonRef
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Focus & Blur Events
      </h2>

      <div className="space-y-4 mb-6 w-80">
        <input
          ref={input1Ref}
          type="text"
          placeholder="Input 1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
          data-testid="input-1"
        />
        <input
          ref={input2Ref}
          type="text"
          placeholder="Input 2"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
          data-testid="input-2"
        />
        <button
          ref={buttonRef}
          className={storyTheme.buttonPrimary + " w-full"}
          data-testid="focus-button"
        >
          Focusable Button
        </button>
      </div>

      <div className={storyTheme.statBox + " mb-4"}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Currently Focused: </span>
          <span className="text-indigo-600 font-semibold" data-testid="focused-element">
            {focusedElement || "None"}
          </span>
        </p>
      </div>

      {focusHistory.length > 0 && (
        <div className={storyTheme.statBox}>
          <p className={storyTheme.statLabel + " mb-3"}>Focus History:</p>
          <div className="space-y-2">
            {focusHistory.map(({ element, type, id }) => (
              <div
                key={id}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-600">{element}</span>
                <span
                  className={
                    type === "focus" ? "text-green-600" : "text-orange-500"
                  }
                >
                  {type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Click or tab between elements to see focus/blur events.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for touch events
 */
function TouchEventsDemo() {
  const [touchInfo, setTouchInfo] = useState<{
    type: string;
    x: number;
    y: number;
  } | null>(null);
  const [touchCount, setTouchCount] = useState(0);
  const touchAreaRef = useRef<HTMLDivElement>(null);

  useEventListener(
    "touchstart",
    (e) => {
      const touch = e.touches[0];
      if (touch && touchAreaRef.current) {
        const rect = touchAreaRef.current.getBoundingClientRect();
        setTouchInfo({
          type: "touchstart",
          x: Math.round(touch.clientX - rect.left),
          y: Math.round(touch.clientY - rect.top),
        });
        setTouchCount((prev) => prev + 1);
      }
    },
    touchAreaRef
  );

  useEventListener(
    "touchmove",
    (e) => {
      const touch = e.touches[0];
      if (touch && touchAreaRef.current) {
        const rect = touchAreaRef.current.getBoundingClientRect();
        setTouchInfo({
          type: "touchmove",
          x: Math.round(touch.clientX - rect.left),
          y: Math.round(touch.clientY - rect.top),
        });
      }
    },
    touchAreaRef,
    { passive: true }
  );

  useEventListener(
    "touchend",
    () => {
      setTouchInfo((prev) =>
        prev ? { ...prev, type: "touchend" } : null
      );
    },
    touchAreaRef
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>Touch Events</h2>

      <div
        ref={touchAreaRef}
        className="w-80 h-48 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 flex items-center justify-center mb-6"
        data-testid="touch-area"
      >
        {touchInfo ? (
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-1">{touchInfo.type}</p>
            <p
              className="text-2xl font-bold text-indigo-600"
              data-testid="touch-position"
            >
              ({touchInfo.x}, {touchInfo.y})
            </p>
          </div>
        ) : (
          <p className="text-gray-400" data-testid="touch-message">
            Touch this area (mobile)
          </p>
        )}
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Touch Count: </span>
          <span data-testid="touch-count">{touchCount}</span>
        </p>
      </div>

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Touch the area above on a touch-enabled device.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for clipboard events (copy/paste)
 */
function ClipboardEventsDemo() {
  const [clipboardAction, setClipboardAction] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string>("");
  const [pastedText, setPastedText] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEventListener(
    "copy",
    () => {
      setClipboardAction("copy");
      const selection = window.getSelection()?.toString() || "";
      setCopiedText(selection);
      setTimeout(() => setClipboardAction(null), 1500);
    },
    document
  );

  useEventListener(
    "paste",
    (e) => {
      setClipboardAction("paste");
      const text = e.clipboardData?.getData("text") || "";
      setPastedText(text);
      setTimeout(() => setClipboardAction(null), 1500);
    },
    inputRef
  );

  useEventListener(
    "cut",
    () => {
      setClipboardAction("cut");
      const selection = window.getSelection()?.toString() || "";
      setCopiedText(selection);
      setTimeout(() => setClipboardAction(null), 1500);
    },
    document
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Clipboard Events
      </h2>

      <div className="w-80 space-y-4 mb-6">
        <div className="p-4 bg-gray-100 rounded-lg select-all">
          <p className="text-gray-600 text-sm mb-1">Select and copy this text:</p>
          <p className="font-mono text-indigo-600" data-testid="copyable-text">
            Hello, useEventListener!
          </p>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="Paste here..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
          data-testid="paste-input"
        />
      </div>

      <div
        className={`${storyTheme.gradientBox} text-center mb-6 transition-all ${
          clipboardAction
            ? clipboardAction === "copy"
              ? "from-blue-500 to-indigo-600"
              : clipboardAction === "paste"
              ? "from-green-500 to-emerald-600"
              : "from-orange-500 to-red-600"
            : ""
        }`}
      >
        <p className="text-white/80 text-sm mb-2">Last Action</p>
        <p className="text-2xl font-bold text-white" data-testid="clipboard-action">
          {clipboardAction?.toUpperCase() || "None"}
        </p>
      </div>

      <div className={storyTheme.statBox}>
        <div className="space-y-2 text-sm">
          <p>
            <span className={storyTheme.statTextSecondary}>Copied/Cut: </span>
            <span className="text-gray-800" data-testid="copied-text">
              {copiedText || "-"}
            </span>
          </p>
          <p>
            <span className={storyTheme.statTextSecondary}>Pasted: </span>
            <span className="text-gray-800" data-testid="pasted-text">
              {pastedText || "-"}
            </span>
          </p>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Try copy (Ctrl+C), cut (Ctrl+X), and paste (Ctrl+V) operations.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for visibility change
 */
function VisibilityChangeDemo() {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [visibilityHistory, setVisibilityHistory] = useState<
    Array<{ visible: boolean; time: string; id: number }>
  >([]);
  const [hiddenDuration, setHiddenDuration] = useState(0);
  const hiddenStartRef = useRef<number | null>(null);

  useEventListener(
    "visibilitychange",
    () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      if (!visible) {
        hiddenStartRef.current = Date.now();
      } else if (hiddenStartRef.current) {
        const duration = Math.round((Date.now() - hiddenStartRef.current) / 1000);
        setHiddenDuration((prev) => prev + duration);
        hiddenStartRef.current = null;
      }

      setVisibilityHistory((prev) => [
        {
          visible,
          time: new Date().toLocaleTimeString(),
          id: Date.now(),
        },
        ...prev.slice(0, 4),
      ]);
    },
    document
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Visibility Change
      </h2>

      <div
        className={`${storyTheme.gradientBox} text-center mb-6 ${
          isVisible ? "from-green-500 to-emerald-600" : "from-gray-500 to-gray-600"
        }`}
      >
        <p className="text-white/80 text-sm mb-2">Page Status</p>
        <p className="text-4xl font-bold text-white" data-testid="visibility-status">
          {isVisible ? "Visible" : "Hidden"}
        </p>
      </div>

      <div className={storyTheme.statBox + " mb-4"}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>
            Total Hidden Duration:{" "}
          </span>
          <span data-testid="hidden-duration">{hiddenDuration}s</span>
        </p>
      </div>

      {visibilityHistory.length > 0 && (
        <div className={storyTheme.statBox}>
          <p className={storyTheme.statLabel + " mb-3"}>Visibility History:</p>
          <div className="space-y-2">
            {visibilityHistory.map(({ visible, time, id }) => (
              <div
                key={id}
                className="flex justify-between items-center text-sm"
              >
                <span className={visible ? "text-green-600" : "text-gray-500"}>
                  {visible ? "Visible" : "Hidden"}
                </span>
                <span className="text-gray-400">{time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Switch to another tab and come back to see visibility changes.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for mouse double-click and context menu
 */
function MouseEventsAdvancedDemo() {
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [eventCounts, setEventCounts] = useState({
    click: 0,
    dblclick: 0,
    contextmenu: 0,
  });
  const boxRef = useRef<HTMLDivElement>(null);

  useEventListener(
    "click",
    () => {
      setLastEvent("click");
      setEventCounts((prev) => ({ ...prev, click: prev.click + 1 }));
    },
    boxRef
  );

  useEventListener(
    "dblclick",
    () => {
      setLastEvent("dblclick");
      setEventCounts((prev) => ({ ...prev, dblclick: prev.dblclick + 1 }));
    },
    boxRef
  );

  useEventListener(
    "contextmenu",
    (e) => {
      e.preventDefault();
      setLastEvent("contextmenu");
      setEventCounts((prev) => ({ ...prev, contextmenu: prev.contextmenu + 1 }));
    },
    boxRef
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Advanced Mouse Events
      </h2>

      <div
        ref={boxRef}
        style={{
          width: "320px",
          height: "128px",
          borderRadius: "12px",
          background: "linear-gradient(to right, #6366f1, #9333ea)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          cursor: "pointer",
          userSelect: "none",
        }}
        data-testid="mouse-box"
      >
        <p style={{ color: "white", fontSize: "18px", fontWeight: 500 }}>
          Click, Double-click, or Right-click
        </p>
      </div>

      <div className={storyTheme.gradientBox + " text-center mb-6"}>
        <p className="text-white/80 text-sm mb-2">Last Event</p>
        <p className="text-2xl font-bold text-white" data-testid="last-mouse-event">
          {lastEvent || "None"}
        </p>
      </div>

      <div className={storyTheme.statBox}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className={storyTheme.statTextSecondary}>Click</p>
            <p className="text-xl font-bold text-gray-800" data-testid="click-count">
              {eventCounts.click}
            </p>
          </div>
          <div>
            <p className={storyTheme.statTextSecondary}>Double</p>
            <p className="text-xl font-bold text-gray-800" data-testid="dblclick-count">
              {eventCounts.dblclick}
            </p>
          </div>
          <div>
            <p className={storyTheme.statTextSecondary}>Right</p>
            <p className="text-xl font-bold text-gray-800" data-testid="contextmenu-count">
              {eventCounts.contextmenu}
            </p>
          </div>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Try single click, double click, and right click on the box.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for form events (input, change, submit)
 */
function FormEventsDemo() {
  const [inputValue, setInputValue] = useState("");
  const [inputEventCount, setInputEventCount] = useState(0);
  const [changeEventCount, setChangeEventCount] = useState(0);
  const [submitCount, setSubmitCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEventListener(
    "input",
    (e) => {
      const target = e.target as HTMLInputElement;
      setInputValue(target.value);
      setInputEventCount((prev) => prev + 1);
    },
    inputRef
  );

  useEventListener(
    "change",
    () => {
      setChangeEventCount((prev) => prev + 1);
    },
    inputRef
  );

  useEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      setSubmitCount((prev) => prev + 1);
    },
    formRef
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>Form Events</h2>

      <form ref={formRef} className="w-80 space-y-4 mb-6">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type something..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
          data-testid="form-input"
        />
        <button
          type="submit"
          className={storyTheme.buttonPrimary + " w-full"}
          data-testid="submit-button"
        >
          Submit
        </button>
      </form>

      <div className={storyTheme.statBox + " mb-4"}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Current Value: </span>
          <span className="text-indigo-600" data-testid="input-value">
            {inputValue || "(empty)"}
          </span>
        </p>
      </div>

      <div className={storyTheme.statBox}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className={storyTheme.statTextSecondary}>Input</p>
            <p className="text-xl font-bold text-gray-800" data-testid="input-event-count">
              {inputEventCount}
            </p>
          </div>
          <div>
            <p className={storyTheme.statTextSecondary}>Change</p>
            <p className="text-xl font-bold text-gray-800" data-testid="change-event-count">
              {changeEventCount}
            </p>
          </div>
          <div>
            <p className={storyTheme.statTextSecondary}>Submit</p>
            <p className="text-xl font-bold text-gray-800" data-testid="submit-count">
              {submitCount}
            </p>
          </div>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Input fires on every keystroke, Change fires when focus leaves.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for drag and drop events
 */
function DragDropDemo() {
  const [dragStatus, setDragStatus] = useState<string>("idle");
  const [droppedItems, setDroppedItems] = useState<string[]>([]);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  useEventListener(
    "dragstart",
    (e) => {
      setDragStatus("dragging");
      e.dataTransfer?.setData("text/plain", "Dragged Item");
    },
    draggableRef
  );

  useEventListener(
    "dragend",
    () => {
      setDragStatus("idle");
    },
    draggableRef
  );

  useEventListener(
    "dragover",
    (e) => {
      e.preventDefault();
      setDragStatus("over");
    },
    dropZoneRef
  );

  useEventListener(
    "dragleave",
    () => {
      setDragStatus("dragging");
    },
    dropZoneRef
  );

  useEventListener(
    "drop",
    (e) => {
      e.preventDefault();
      const data = e.dataTransfer?.getData("text/plain");
      if (data) {
        setDroppedItems((prev) => [...prev, `${data} #${prev.length + 1}`]);
      }
      setDragStatus("dropped");
      setTimeout(() => setDragStatus("idle"), 1000);
    },
    dropZoneRef
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Drag & Drop Events
      </h2>

      <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
        <div
          ref={draggableRef}
          draggable
          style={{
            width: "128px",
            height: "128px",
            borderRadius: "12px",
            background: "linear-gradient(to right, #6366f1, #9333ea)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            transform: dragStatus === "dragging" ? "scale(0.95)" : "scale(1)",
            opacity: dragStatus === "dragging" ? 0.5 : 1,
            transition: "transform 0.2s, opacity 0.2s",
          }}
          data-testid="draggable"
        >
          <p style={{ color: "white", fontWeight: 500, textAlign: "center" }}>Drag me</p>
        </div>

        <div
          ref={dropZoneRef}
          style={{
            width: "200px",
            height: "160px",
            borderRadius: "12px",
            border: `2px dashed ${
              dragStatus === "over"
                ? "#22c55e"
                : dragStatus === "dropped"
                ? "#16a34a"
                : "#d1d5db"
            }`,
            backgroundColor:
              dragStatus === "over"
                ? "#f0fdf4"
                : dragStatus === "dropped"
                ? "#dcfce7"
                : "#f9fafb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          data-testid="drop-zone"
        >
          <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center" }}>
            {dragStatus === "over" ? "Release to drop" : "Drop here"}
          </p>
        </div>
      </div>

      <div className={storyTheme.statBox + " mb-4"}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Status: </span>
          <span
            className={
              dragStatus === "dropped"
                ? "text-green-600"
                : dragStatus === "over"
                ? "text-blue-600"
                : dragStatus === "dragging"
                ? "text-orange-600"
                : "text-gray-600"
            }
            data-testid="drag-status"
          >
            {dragStatus}
          </span>
        </p>
      </div>

      {droppedItems.length > 0 && (
        <div className={storyTheme.statBox}>
          <p className={storyTheme.statLabel + " mb-3"}>Dropped Items:</p>
          <div className="flex flex-wrap gap-2">
            {droppedItems.map((item, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Drag the purple box and drop it in the drop zone.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for pointer events
 */
function PointerEventsDemo() {
  const [pointerInfo, setPointerInfo] = useState<{
    type: string;
    pointerType: string;
    pressure: number;
    x: number;
    y: number;
  } | null>(null);
  const [pointerCount, setPointerCount] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  useEventListener(
    "pointerdown",
    (e) => {
      if (areaRef.current) {
        const rect = areaRef.current.getBoundingClientRect();
        setPointerInfo({
          type: "pointerdown",
          pointerType: e.pointerType,
          pressure: Math.round(e.pressure * 100) / 100,
          x: Math.round(e.clientX - rect.left),
          y: Math.round(e.clientY - rect.top),
        });
        setPointerCount((prev) => prev + 1);
      }
    },
    areaRef
  );

  useEventListener(
    "pointermove",
    (e) => {
      if (areaRef.current && e.buttons > 0) {
        const rect = areaRef.current.getBoundingClientRect();
        setPointerInfo({
          type: "pointermove",
          pointerType: e.pointerType,
          pressure: Math.round(e.pressure * 100) / 100,
          x: Math.round(e.clientX - rect.left),
          y: Math.round(e.clientY - rect.top),
        });
      }
    },
    areaRef
  );

  useEventListener(
    "pointerup",
    (e) => {
      setPointerInfo((prev) =>
        prev
          ? { ...prev, type: "pointerup", pressure: 0 }
          : null
      );
    },
    areaRef
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>Pointer Events</h2>

      <div
        ref={areaRef}
        style={{
          width: "400px",
          height: "280px",
          borderRadius: "12px",
          border: "2px dashed #d8b4fe",
          backgroundColor: "#faf5ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          touchAction: "none",
        }}
        data-testid="pointer-area"
      >
        {pointerInfo ? (
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-1">{pointerInfo.type}</p>
            <p className="text-2xl font-bold text-purple-600" data-testid="pointer-position">
              ({pointerInfo.x}, {pointerInfo.y})
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {pointerInfo.pointerType} • pressure: {pointerInfo.pressure}
            </p>
          </div>
        ) : (
          <p className="text-gray-400" data-testid="pointer-message">
            Click or touch this area
          </p>
        )}
      </div>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Pointer Events: </span>
          <span data-testid="pointer-count">{pointerCount}</span>
        </p>
      </div>

      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          Works with mouse, touch, and pen input. Shows pointer type and
          pressure.
        </p>
      </div>
    </div>
  );
}

export const FocusBlur: StoryObj<typeof FocusBlurDemo> = {
  render: () => <FocusBlurDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("focused-element")).toHaveTextContent("None");

    const input1 = canvas.getByTestId("input-1");
    await userEvent.click(input1);

    await waitFor(() => {
      expect(canvas.getByTestId("focused-element")).toHaveTextContent("Input 1");
    });

    const input2 = canvas.getByTestId("input-2");
    await userEvent.click(input2);

    await waitFor(() => {
      expect(canvas.getByTestId("focused-element")).toHaveTextContent("Input 2");
    });
  },
};

export const TouchEvents: StoryObj<typeof TouchEventsDemo> = {
  render: () => <TouchEventsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("touch-message")).toBeInTheDocument();
    await expect(canvas.getByTestId("touch-count")).toHaveTextContent("0");
  },
};

export const ClipboardEvents: StoryObj<typeof ClipboardEventsDemo> = {
  render: () => <ClipboardEventsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("clipboard-action")).toHaveTextContent("None");
    await expect(canvas.getByTestId("copyable-text")).toBeInTheDocument();
  },
};

export const VisibilityChange: StoryObj<typeof VisibilityChangeDemo> = {
  render: () => <VisibilityChangeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("visibility-status")).toHaveTextContent("Visible");
  },
};

export const MouseEventsAdvanced: StoryObj<typeof MouseEventsAdvancedDemo> = {
  render: () => <MouseEventsAdvancedDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("mouse-box");

    await expect(canvas.getByTestId("click-count")).toHaveTextContent("0");

    await userEvent.click(box);

    await waitFor(() => {
      expect(canvas.getByTestId("click-count")).toHaveTextContent("1");
    });

    await userEvent.dblClick(box);

    await waitFor(() => {
      expect(canvas.getByTestId("dblclick-count")).toHaveTextContent("1");
    });
  },
};

export const FormEvents: StoryObj<typeof FormEventsDemo> = {
  render: () => <FormEventsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("form-input");

    await expect(canvas.getByTestId("input-event-count")).toHaveTextContent("0");

    await userEvent.type(input, "test");

    await waitFor(() => {
      expect(canvas.getByTestId("input-value")).toHaveTextContent("test");
      expect(canvas.getByTestId("input-event-count")).toHaveTextContent("4");
    });

    const submitButton = canvas.getByTestId("submit-button");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(canvas.getByTestId("submit-count")).toHaveTextContent("1");
    });
  },
};

export const DragDrop: StoryObj<typeof DragDropDemo> = {
  render: () => <DragDropDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("drag-status")).toHaveTextContent("idle");
    await expect(canvas.getByTestId("draggable")).toBeInTheDocument();
    await expect(canvas.getByTestId("drop-zone")).toBeInTheDocument();
  },
};

export const PointerEvents: StoryObj<typeof PointerEventsDemo> = {
  render: () => <PointerEventsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("pointer-message")).toBeInTheDocument();
    await expect(canvas.getByTestId("pointer-count")).toHaveTextContent("0");

    const area = canvas.getByTestId("pointer-area");
    await userEvent.click(area);

    await waitFor(() => {
      expect(canvas.getByTestId("pointer-count")).toHaveTextContent("1");
    });
  },
};
