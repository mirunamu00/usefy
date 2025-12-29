import type { Meta, StoryObj } from "@storybook/react";
import { useState, useEffect, useRef } from "react";
import { useThrottleCallback } from "@usefy/use-throttle-callback";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * 1. Button Click Throttle Demo
 */
function ButtonClickDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [lastProcessedTime, setLastProcessedTime] = useState<string>("");

  const throttledClick = useThrottleCallback(() => {
    setProcessedCount((prev) => prev + 1);
    setLastProcessedTime(new Date().toLocaleTimeString());
  }, 1000);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Throttled Button Click</h2>
      <p className={storyTheme.subtitle}>
        Click rapidly! The callback executes at most once per second, with the
        first click firing immediately (leading edge).
      </p>

      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          throttledClick();
        }}
        className={storyTheme.buttonFull + " mb-5"}
      >
        Click Me Rapidly!
      </button>

      <div className={storyTheme.buttonGroupFull}>
        <button
          onClick={throttledClick.cancel}
          aria-label="Cancel throttle"
          className={storyTheme.buttonDanger + " flex-1"}
        >
          Cancel
        </button>
        <button
          onClick={throttledClick.flush}
          aria-label="Flush throttle"
          className={storyTheme.buttonSuccess + " flex-1"}
        >
          Flush Now
        </button>
      </div>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Total Clicks:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{clickCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>
            Processed (Throttled):
          </strong>{" "}
          <span className={storyTheme.statValue}>{processedCount}</span>
        </div>
        {lastProcessedTime && (
          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>Last Processed:</strong>{" "}
            <span className={storyTheme.statTextSecondary}>
              {lastProcessedTime}
            </span>
          </div>
        )}
      </div>

      <div className={storyTheme.infoBox + " mt-4"}>
        <p className={storyTheme.infoText}>
          💡 <strong>Throttle</strong> limits execution rate. Unlike debounce,
          the first click fires immediately and subsequent clicks are blocked
          for 1 second.
        </p>
      </div>
    </div>
  );
}

/**
 * 2. Mouse Move Tracker Demo
 */
function MouseMoveDemo() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [updateCount, setUpdateCount] = useState(0);
  const [rawMoveCount, setRawMoveCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const throttledMove = useThrottleCallback((x: number, y: number) => {
    setPosition({ x, y });
    setUpdateCount((prev) => prev + 1);
  }, 100);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setRawMoveCount((prev) => prev + 1);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      throttledMove(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Throttled Mouse Move</h2>
      <p className={storyTheme.subtitle}>
        Move your mouse inside the box. Position updates are throttled to 100ms
        intervals.
      </p>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        data-testid="mouse-area"
        className="w-full h-[200px] bg-indigo-50 rounded-xl border-2 border-dashed border-indigo-300 flex items-center justify-center mb-5 relative overflow-hidden cursor-crosshair"
      >
        <div
          style={{
            position: "absolute",
            left: position.x - 10,
            top: position.y - 10,
          }}
          className="w-5 h-5 bg-indigo-500 rounded-full pointer-events-none transition-all duration-[50ms] shadow-[0_2px_8px_rgba(99,102,241,0.4)]"
        />
        <span className="text-indigo-900 text-sm opacity-70 pointer-events-none">
          Move mouse here
        </span>
      </div>

      <div className={storyTheme.statBox}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Position:</strong>{" "}
          <span className={storyTheme.statTextSecondary + " font-mono"}>
            ({Math.round(position.x)}, {Math.round(position.y)})
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Raw Move Events:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{rawMoveCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Throttled Updates:</strong>{" "}
          <span className={storyTheme.statValue}>{updateCount}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Scroll Tracker Demo (Simulated)
 */
function ScrollTrackerDemo() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);
  const [rawScrollCount, setRawScrollCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const throttledScroll = useThrottleCallback((position: number) => {
    setScrollPosition(position);
    setUpdateCount((prev) => prev + 1);
  }, 150);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setRawScrollCount((prev) => prev + 1);
    throttledScroll(e.currentTarget.scrollTop);
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Throttled Scroll Tracker</h2>
      <p className={storyTheme.subtitle}>
        Scroll inside the box. Position updates are throttled to 150ms
        intervals, reducing performance overhead.
      </p>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        data-testid="scroll-area"
        className="w-full h-[200px] overflow-y-scroll bg-indigo-50 rounded-xl border-2 border-indigo-300 mb-5"
      >
        <div className="h-[800px] p-4">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className={`p-3 mb-2 rounded-lg font-medium text-indigo-900 ${
                i % 2 === 0 ? "bg-indigo-200" : "bg-indigo-300"
              }`}
            >
              Scroll Item {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className={storyTheme.statBox}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Scroll Position:</strong>{" "}
          <span className={storyTheme.statTextSecondary + " font-mono"}>
            {scrollPosition}px
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Raw Scroll Events:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{rawScrollCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Throttled Updates:</strong>{" "}
          <span className={storyTheme.statValue}>{updateCount}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Leading Only Demo
 */
function LeadingOnlyDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  const throttledClick = useThrottleCallback(
    () => {
      setProcessedCount((prev) => prev + 1);
    },
    1000,
    { leading: true, trailing: false }
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Leading Edge Only</h2>
      <p className={storyTheme.subtitle}>
        Only the first click fires immediately. Subsequent clicks within 1
        second are completely ignored (no trailing execution).
      </p>

      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          throttledClick();
        }}
        className="w-full py-6 px-8 text-xl bg-gradient-to-br from-red-500 to-red-600 text-white border-none rounded-xl cursor-pointer mb-5 transition-all duration-200 shadow-[0_4px_12px_rgba(239,68,68,0.3)] font-semibold hover:from-red-600 hover:to-red-700 hover:shadow-[0_6px_16px_rgba(239,68,68,0.4)]"
      >
        Click (Leading Only)
      </button>

      <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Total Clicks:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{clickCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Processed:</strong>{" "}
          <span className="text-red-500 font-bold text-[1.1rem]">
            {processedCount}
          </span>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-4 bg-red-50 border-red-200"}>
        <p className={storyTheme.infoText + " text-red-900"}>
          💡 <strong>Leading only</strong>: Perfect for immediate feedback
          actions like button clicks where you don't want any delayed execution.
        </p>
      </div>
    </div>
  );
}

/**
 * 5. Trailing Only Demo
 */
function TrailingOnlyDemo() {
  const [input, setInput] = useState("");
  const [processedValue, setProcessedValue] = useState("");
  const [processedCount, setProcessedCount] = useState(0);

  const throttledProcess = useThrottleCallback(
    (value: string) => {
      setProcessedValue(value);
      setProcessedCount((prev) => prev + 1);
    },
    500,
    { leading: false, trailing: true }
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Trailing Edge Only</h2>
      <p className={storyTheme.subtitle}>
        Type continuously. The value is processed every 500ms, but only at the
        end of each interval (no immediate execution).
      </p>

      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          throttledProcess(e.target.value);
        }}
        placeholder="Type continuously..."
        className={storyTheme.input + " mb-5"}
      />

      <div className={storyTheme.statBox}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Current Input:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {input || "(empty)"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Last Processed:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {processedValue || "(none)"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Process Count:</strong>{" "}
          <span className={storyTheme.statValue}>{processedCount}</span>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-4"}>
        <p className={storyTheme.infoText}>
          💡 <strong>Trailing only</strong>: The callback waits 500ms after the
          first call before executing, then fires at regular intervals.
        </p>
      </div>
    </div>
  );
}

/**
 * 6. Control Methods Demo (Cancel, Flush, Pending)
 */
function ControlMethodsDemo() {
  const [input, setInput] = useState("");
  const [processedValue, setProcessedValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const addLog = (action: string) => {
    const time = new Date().toLocaleTimeString();
    setActionLog((prev) => [`[${time}] ${action}`, ...prev.slice(0, 4)]);
  };

  const throttledProcess = useThrottleCallback((value: string) => {
    setProcessedValue(value);
    addLog(`Processed: "${value}"`);
  }, 2000);

  // Update pending state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPending(throttledProcess.pending());
    }, 100);
    return () => clearInterval(interval);
  }, [throttledProcess]);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Control Methods</h2>
      <p className={storyTheme.subtitle}>
        Test cancel, flush, and pending methods. Throttle interval is 2 seconds.
      </p>

      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          throttledProcess(e.target.value);
        }}
        placeholder="Type something..."
        className={storyTheme.input + " mb-4"}
      />

      <div className={storyTheme.buttonGroup + " mb-4"}>
        <button
          onClick={() => {
            throttledProcess.cancel();
            addLog("Cancelled pending");
          }}
          aria-label="Cancel"
          className={storyTheme.buttonDanger + " flex-1"}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            throttledProcess.flush();
            addLog("Flushed");
          }}
          aria-label="Flush"
          className={storyTheme.buttonSuccess + " flex-1"}
        >
          Flush
        </button>
      </div>

      <div
        className={`p-4 rounded-xl mb-4 transition-all duration-200 ${
          isPending
            ? storyTheme.infoBox + " border-2 border-yellow-400"
            : "bg-green-50 border-2 border-green-500"
        }`}
      >
        <div className="text-[0.95rem] font-semibold">
          Status:{" "}
          <span className={isPending ? "text-yellow-700" : "text-green-600"}>
            {isPending ? "⏳ Pending" : "✅ Idle"}
          </span>
        </div>
      </div>

      <div className={storyTheme.statBox}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Last Processed:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {processedValue || "(none)"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Action Log:</strong>
          <ul className="mt-2 mb-0 pl-0 list-none text-sm font-mono">
            {actionLog.length === 0 ? (
              <li className="text-gray-400">No actions yet</li>
            ) : (
              actionLog.map((log, i) => (
                <li key={i} className="text-gray-500 mb-1">
                  {log}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * 7. API Rate Limiter Demo
 */
function ApiRateLimiterDemo() {
  const [query, setQuery] = useState("");
  const [apiCalls, setApiCalls] = useState<string[]>([]);
  const [callCount, setCallCount] = useState(0);

  const throttledApiCall = useThrottleCallback((searchQuery: string) => {
    const time = new Date().toLocaleTimeString();
    setApiCalls((prev) => [
      `[${time}] API call: "${searchQuery}"`,
      ...prev.slice(0, 4),
    ]);
    setCallCount((prev) => prev + 1);
  }, 1000);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>API Rate Limiter</h2>
      <p className={storyTheme.subtitle}>
        Type to search. API calls are throttled to maximum 1 request per second,
        preventing rate limit issues.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value) {
            throttledApiCall(e.target.value);
          }
        }}
        placeholder="Search API..."
        className={storyTheme.input + " mb-5"}
      />

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Total API Calls:</strong>{" "}
          <span className={storyTheme.statValue}>{callCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>API Log:</strong>
          <ul className="mt-2 mb-0 pl-0 list-none text-sm font-mono">
            {apiCalls.length === 0 ? (
              <li className={storyTheme.statTextSecondary + " opacity-60"}>
                No calls yet
              </li>
            ) : (
              apiCalls.map((call, i) => (
                <li key={i} className={storyTheme.statTextSecondary + " mb-1"}>
                  {call}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className={storyTheme.infoBox}>
        <p className={storyTheme.infoText}>
          💡 <strong>Use case</strong>: Prevent hitting API rate limits while
          still providing responsive search as the user types.
        </p>
      </div>
    </div>
  );
}

/**
 * Meta & Stories
 */
const meta = {
  title: "Hooks/useThrottleCallback",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Creates a throttled version of a callback function that limits invocations to at most once per specified interval. Perfect for scroll handlers, resize events, mouse tracking, and any scenario requiring rate limiting with immediate feedback.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonClick: Story = {
  render: () => <ButtonClickDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Throttle button clicks with cancel and flush methods. The first click fires immediately, then subsequent clicks are blocked for 1 second.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /Click Me Rapidly!/i });

    // Helper to get processed count
    const getProcessedCount = () => {
      const text = canvas.getByText("Processed (Throttled):", { exact: false });
      const parent = text.closest("div");
      const match = parent?.textContent?.match(
        /Processed \(Throttled\):\s*(\d+)/
      );
      return match ? parseInt(match[1], 10) : 0;
    };

    // Initially no processing
    expect(getProcessedCount()).toBe(0);

    // First click - should execute immediately (leading edge)
    await userEvent.click(button);

    await waitFor(
      () => {
        expect(getProcessedCount()).toBe(1);
      },
      { timeout: 100 }
    );

    // Click rapidly within 1 second (should be blocked)
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    // Still 1 (blocked by throttle, trailing not yet fired)
    expect(getProcessedCount()).toBe(1);

    // Wait for trailing edge (1000ms + buffer)
    await waitFor(
      () => {
        expect(getProcessedCount()).toBe(2); // trailing edge fires
      },
      { timeout: 1200 }
    );
  },
};

export const MouseMove: Story = {
  render: () => <MouseMoveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Track mouse movement with throttled updates every 100ms. Reduces the number of state updates while maintaining smooth visual feedback.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mouseArea = canvas.getByTestId("mouse-area");

    // Helper to get update count
    const getUpdateCount = () => {
      const text = canvas.getByText("Throttled Updates:", { exact: false });
      const parent = text.closest("div");
      const match = parent?.textContent?.match(/Throttled Updates:\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Initially no updates
    expect(getUpdateCount()).toBe(0);

    // Simulate mouse movement
    const rect = mouseArea.getBoundingClientRect();

    // Move mouse multiple times rapidly
    for (let i = 0; i < 5; i++) {
      await userEvent.pointer({
        target: mouseArea,
        coords: { x: rect.left + 50 + i * 20, y: rect.top + 50 },
      });
    }

    // Wait for throttled updates
    await waitFor(
      () => {
        expect(getUpdateCount()).toBeGreaterThanOrEqual(1);
      },
      { timeout: 300 }
    );
  },
};

export const ScrollTracker: Story = {
  render: () => <ScrollTrackerDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Track scroll position with throttled updates every 150ms. Essential for scroll-based animations and lazy loading without performance degradation.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scrollArea = canvas.getByTestId("scroll-area");

    // Helper to get update count
    const getUpdateCount = () => {
      const text = canvas.getByText("Throttled Updates:", { exact: false });
      const parent = text.closest("div");
      const match = parent?.textContent?.match(/Throttled Updates:\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Initially no updates
    expect(getUpdateCount()).toBe(0);

    // Scroll down
    scrollArea.scrollTop = 100;
    scrollArea.dispatchEvent(new Event("scroll", { bubbles: true }));

    // Wait for throttled update
    await waitFor(
      () => {
        expect(getUpdateCount()).toBeGreaterThanOrEqual(1);
      },
      { timeout: 300 }
    );

    // Scroll more
    scrollArea.scrollTop = 300;
    scrollArea.dispatchEvent(new Event("scroll", { bubbles: true }));

    await waitFor(
      () => {
        expect(getUpdateCount()).toBeGreaterThanOrEqual(1);
      },
      { timeout: 500 }
    );
  },
};

export const LeadingOnly: Story = {
  render: () => <LeadingOnlyDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Leading edge only throttle: the first call executes immediately, then all subsequent calls within the interval are completely ignored. No trailing execution.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", {
      name: /Click \(Leading Only\)/i,
    });

    // Helper to get processed count
    const getProcessedCount = () => {
      const text = canvas.getByText("Processed:", { exact: false });
      const parent = text.closest("div");
      const match = parent?.textContent?.match(/Processed:\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Initially no processing
    expect(getProcessedCount()).toBe(0);

    // First click - leading edge executes immediately
    await userEvent.click(button);

    await waitFor(
      () => {
        expect(getProcessedCount()).toBe(1);
      },
      { timeout: 100 }
    );

    // Click rapidly (should be ignored - no trailing)
    await userEvent.click(button);
    await userEvent.click(button);

    // Wait past throttle interval
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Still 1 (no trailing edge with trailing: false)
    expect(getProcessedCount()).toBe(1);

    // New click after interval - should work (new leading edge)
    await userEvent.click(button);

    await waitFor(
      () => {
        expect(getProcessedCount()).toBe(2);
      },
      { timeout: 100 }
    );
  },
};

export const TrailingOnly: Story = {
  render: () => <TrailingOnlyDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Trailing edge only throttle: the callback waits for the interval to complete before executing. No immediate execution on the first call.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Type continuously...");

    // Helper to get process count
    const getProcessCount = () => {
      const text = canvas.getByText("Process Count:", { exact: false });
      const parent = text.closest("div");
      const match = parent?.textContent?.match(/Process Count:\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Initially no processing
    expect(getProcessCount()).toBe(0);

    // Type rapidly
    await userEvent.type(input, "hello", { delay: 50 });

    // Immediately after typing - no processing yet (trailing only)
    expect(getProcessCount()).toBe(0);

    // Wait for trailing edge (500ms + buffer)
    await waitFor(
      () => {
        expect(getProcessCount()).toBeGreaterThanOrEqual(1);
      },
      { timeout: 700 }
    );
  },
};

export const ControlMethods: Story = {
  render: () => <ControlMethodsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates cancel, flush, and pending methods. Cancel aborts pending callbacks, flush executes immediately, and pending checks if there's a waiting callback.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Type something...");
    const cancelButton = canvas.getByLabelText("Cancel");
    const flushButton = canvas.getByLabelText("Flush");

    // Type something - first character triggers leading edge with "t"
    await userEvent.type(input, "test");

    // First call executes immediately (leading edge) with first character
    await waitFor(
      () => {
        expect(canvas.getByText(/Processed: "t"/)).toBeInTheDocument();
      },
      { timeout: 100 }
    );

    // Flush to process the full "test" value
    await userEvent.click(flushButton);

    await waitFor(
      () => {
        expect(canvas.getByText(/Processed: "test"/)).toBeInTheDocument();
      },
      { timeout: 200 }
    );

    // Type more
    await userEvent.type(input, "123");

    // Flush immediately
    await userEvent.click(flushButton);

    await waitFor(
      () => {
        expect(canvas.getByText(/Processed: "test123"/)).toBeInTheDocument();
      },
      { timeout: 200 }
    );

    // Type more and cancel
    await userEvent.type(input, "abc");
    await userEvent.click(cancelButton);

    // Wait to ensure cancelled
    await new Promise((resolve) => setTimeout(resolve, 2200));

    // Should not have processed "test123abc" due to cancel
    expect(
      canvas.queryByText(/Processed: "test123abc"/)
    ).not.toBeInTheDocument();
  },
};

export const ApiRateLimiter: Story = {
  render: () => <ApiRateLimiterDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Rate limit API calls to maximum 1 request per second. Prevents hitting API rate limits while providing responsive search experience.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Search API...");

    // Helper to get call count
    const getCallCount = () => {
      const text = canvas.getByText("Total API Calls:", { exact: false });
      const parent = text.closest("div");
      const match = parent?.textContent?.match(/Total API Calls:\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Initially no calls
    expect(getCallCount()).toBe(0);

    // Type rapidly
    await userEvent.type(input, "react hooks", { delay: 50 });

    // Should have limited calls due to throttle
    await waitFor(
      () => {
        const count = getCallCount();
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThan(11); // 11 chars typed, but throttled
      },
      { timeout: 200 }
    );

    // Wait for trailing
    await waitFor(
      () => {
        expect(getCallCount()).toBeGreaterThanOrEqual(1);
      },
      { timeout: 1200 }
    );
  },
};
