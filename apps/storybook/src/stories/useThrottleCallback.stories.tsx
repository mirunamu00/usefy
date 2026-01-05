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
 * 7. Both Edges Demo (Default)
 */
function BothEdgesDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [lastAction, setLastAction] = useState<string>("");

  const throttledClick = useThrottleCallback(
    () => {
      setProcessedCount((prev) => prev + 1);
      setLastAction(new Date().toLocaleTimeString());
    },
    1000,
    { leading: true, trailing: true }
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Both Edges (Default)</h2>
      <p className={storyTheme.subtitle}>
        Default behavior: fires <strong>immediately</strong> on first click
        (leading edge), then <strong>once more</strong> after the interval if
        there were additional clicks (trailing edge).
      </p>

      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          throttledClick();
        }}
        className={storyTheme.buttonFull + " mb-5"}
      >
        Click (Both Edges)
      </button>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Total Clicks:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{clickCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Processed:</strong>{" "}
          <span className={storyTheme.statValue}>{processedCount}</span>
        </div>
        {lastAction && (
          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>Last Processed:</strong>{" "}
            <span className={storyTheme.statTextSecondary}>{lastAction}</span>
          </div>
        )}
      </div>

      <div className={storyTheme.infoBox + " mt-4"}>
        <p className={storyTheme.infoText}>
          💡 <strong>Both edges</strong>: Best balance for most use cases.
          Provides immediate feedback AND ensures the final state is captured.
        </p>
      </div>
    </div>
  );
}

/**
 * 8. Both Disabled Demo
 */
function BothDisabledDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  const throttledClick = useThrottleCallback(
    () => {
      setProcessedCount((prev) => prev + 1);
    },
    1000,
    { leading: false, trailing: false }
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Both Edges Disabled</h2>
      <p className={storyTheme.subtitle}>
        Both leading and trailing disabled. The callback{" "}
        <strong>never executes</strong>. This is generally not useful but
        demonstrates the behavior.
      </p>

      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          throttledClick();
        }}
        className="w-full py-6 px-8 text-xl bg-gradient-to-br from-gray-400 to-gray-500 text-white border-none rounded-xl cursor-pointer mb-5 transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.2)] font-semibold"
      >
        Click (Nothing Happens)
      </button>

      <div className="p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Total Clicks:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{clickCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Processed:</strong>{" "}
          <span className="text-gray-500 font-bold text-[1.1rem]">
            {processedCount}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Status:</strong>{" "}
          <span className="text-red-600 font-bold">
            Callback never executes! 🚫
          </span>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-4 bg-red-50 border-red-200"}>
        <p className={storyTheme.infoText + " text-red-900"}>
          ⚠️ <strong>Both edges disabled</strong>: This configuration completely
          disables the callback. Matches Lodash behavior where{" "}
          <code className="bg-red-100 px-1 py-0.5 rounded">
            {"{leading: false, trailing: false}"}
          </code>{" "}
          means "nothing happens".
        </p>
      </div>
    </div>
  );
}

/**
 * 9. API Rate Limiter Demo
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
      source: {
        code: `import { useThrottleCallback } from "@usefy/use-throttle-callback";
import { useState } from "react";

function ButtonClickExample() {
  const [clickCount, setClickCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [lastProcessedTime, setLastProcessedTime] = useState<string>("");

  const throttledClick = useThrottleCallback(() => {
    setProcessedCount((prev) => prev + 1);
    setLastProcessedTime(new Date().toLocaleTimeString());
  }, 1000);

  return (
    <div>
      <h2>Throttled Button Click</h2>
      <p>Click rapidly! The callback executes at most once per second, with the first click firing immediately (leading edge).</p>
      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          throttledClick();
        }}
      >
        Click Me Rapidly!
      </button>
      <div>
        <button onClick={throttledClick.cancel}>Cancel</button>
        <button onClick={throttledClick.flush}>Flush Now</button>
      </div>
      <div>
        <p>Total Clicks: {clickCount}</p>
        <p>Processed (Throttled): {processedCount}</p>
        {lastProcessedTime && <p>Last Processed: {lastProcessedTime}</p>}
      </div>
      <p>💡 Throttle limits execution rate. Unlike debounce, the first click fires immediately and subsequent clicks are blocked for 1 second.</p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
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
      source: {
        code: `import { useThrottleCallback } from "@usefy/use-throttle-callback";
import { useState, useRef } from "react";

function MouseMoveExample() {
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
    <div>
      <h2>Throttled Mouse Move</h2>
      <p>Move your mouse inside the box. Position updates are throttled to 100ms intervals.</p>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        style={{
          width: "100%",
          height: "200px",
          background: "#eef2ff",
          borderRadius: "0.5rem",
          border: "2px dashed #a5b4fc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: "crosshair",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: position.x - 10,
            top: position.y - 10,
            width: "20px",
            height: "20px",
            background: "#6366f1",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        <span>Move mouse here</span>
      </div>
      <div>
        <p>Position: ({Math.round(position.x)}, {Math.round(position.y)})</p>
        <p>Raw Move Events: {rawMoveCount}</p>
        <p>Throttled Updates: {updateCount}</p>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
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
      source: {
        code: `import { useThrottleCallback } from "@usefy/use-throttle-callback";
import { useState, useRef } from "react";

function ScrollTrackerExample() {
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
    <div>
      <h2>Throttled Scroll Tracker</h2>
      <p>Scroll inside the box. Position updates are throttled to 150ms intervals, reducing performance overhead.</p>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          width: "100%",
          height: "200px",
          overflowY: "scroll",
          background: "#eef2ff",
          borderRadius: "0.5rem",
          border: "2px solid #a5b4fc",
        }}
      >
        <div style={{ height: "800px", padding: "1rem" }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} style={{ padding: "0.75rem", marginBottom: "0.5rem", borderRadius: "0.5rem", background: i % 2 === 0 ? "#c7d2fe" : "#a5b4fc" }}>
              Scroll Item {i + 1}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p>Scroll Position: {scrollPosition}px</p>
        <p>Raw Scroll Events: {rawScrollCount}</p>
        <p>Throttled Updates: {updateCount}</p>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
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
      source: {
        code: `import { useThrottleCallback } from "@usefy/use-throttle-callback";
import { useState } from "react";

function LeadingOnlyExample() {
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
    <div>
      <h2>Leading Edge Only</h2>
      <p>Only the first click fires immediately. Subsequent clicks within 1 second are completely ignored (no trailing execution).</p>
      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          throttledClick();
        }}
      >
        Click (Leading Only)
      </button>
      <div>
        <p>Total Clicks: {clickCount}</p>
        <p>Processed: {processedCount}</p>
      </div>
      <p>💡 Leading only: Perfect for immediate feedback actions like button clicks where you don't want any delayed execution.</p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
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
      source: {
        code: `import { useThrottleCallback } from "@usefy/use-throttle-callback";
import { useState } from "react";

function TrailingOnlyExample() {
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
    <div>
      <h2>Trailing Edge Only</h2>
      <p>Type continuously. The value is processed every 500ms, but only at the end of each interval (no immediate execution).</p>
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          throttledProcess(e.target.value);
        }}
        placeholder="Type continuously..."
      />
      <div>
        <p>Current Input: {input || "(empty)"}</p>
        <p>Last Processed: {processedValue || "(none)"}</p>
        <p>Process Count: {processedCount}</p>
      </div>
      <p>💡 Trailing only: The callback waits 500ms after the first call before executing, then fires at regular intervals.</p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
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
      source: {
        code: `import { useThrottleCallback } from "@usefy/use-throttle-callback";
import { useState, useEffect } from "react";

function ControlMethodsExample() {
  const [input, setInput] = useState("");
  const [processedValue, setProcessedValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const addLog = (action: string) => {
    const time = new Date().toLocaleTimeString();
    setActionLog((prev) => [\`[\${time}] \${action}\`, ...prev.slice(0, 4)]);
  };

  const throttledProcess = useThrottleCallback((value: string) => {
    setProcessedValue(value);
    addLog(\`Processed: "\${value}"\`);
  }, 2000);

  // Update pending state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPending(throttledProcess.pending());
    }, 100);
    return () => clearInterval(interval);
  }, [throttledProcess]);

  return (
    <div>
      <h2>Control Methods</h2>
      <p>Test cancel, flush, and pending methods. Throttle interval is 2 seconds.</p>
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          throttledProcess(e.target.value);
        }}
        placeholder="Type something..."
      />
      <div>
        <button
          onClick={() => {
            throttledProcess.cancel();
            addLog("Cancelled pending");
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            throttledProcess.flush();
            addLog("Flushed");
          }}
        >
          Flush
        </button>
      </div>
      <div>
        <p>Status: {isPending ? "⏳ Pending" : "✅ Idle"}</p>
      </div>
      <div>
        <p>Last Processed: {processedValue || "(none)"}</p>
        <p>Action Log:</p>
        <ul>
          {actionLog.length === 0 ? (
            <li>No actions yet</li>
          ) : (
            actionLog.map((log, i) => <li key={i}>{log}</li>)
          )}
        </ul>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
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

export const BothEdges: Story = {
  render: () => <BothEdgesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Default behavior with both leading and trailing edges enabled. Fires immediately on first call (leading), then once more after the interval if additional calls occurred (trailing). Best balance for most use cases.",
      },
      source: {
        code: `import { useThrottleCallback } from "@usefy/use-throttle-callback";
import { useState } from "react";

function BothEdgesExample() {
  const [clickCount, setClickCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  const throttledClick = useThrottleCallback(
    () => {
      setProcessedCount((prev) => prev + 1);
    },
    1000,
    { leading: true, trailing: true }
  );

  return (
    <div>
      <h2>Both Edges (Default)</h2>
      <p>Default behavior: fires immediately on first click (leading edge), then once more after the interval if there were additional clicks (trailing edge).</p>
      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          throttledClick();
        }}
      >
        Click (Both Edges)
      </button>
      <div>
        <p>Total Clicks: {clickCount}</p>
        <p>Processed: {processedCount}</p>
      </div>
      <p>💡 Both edges: Best balance for most use cases. Provides immediate feedback AND ensures the final state is captured.</p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", {
      name: /Click \(Both Edges\)/i,
    });

    // Helper to get processed count - use exact match to avoid "Last Processed:"
    const getProcessedCount = () => {
      const labels = canvas.getAllByText(/^Processed:$/);
      const label = labels[0];
      const parent = label.closest("div");
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

    // Click rapidly within interval
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    // Still 1 (throttled)
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

export const BothDisabled: Story = {
  render: () => <BothDisabledDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Both edges disabled - demonstrates what NOT to do. The callback never executes. This configuration completely disables throttling and matches Lodash behavior.",
      },
      source: {
        code: `import { useThrottleCallback } from "@usefy/use-throttle-callback";
import { useState } from "react";

function BothDisabledExample() {
  const [clickCount, setClickCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  const throttledClick = useThrottleCallback(
    () => {
      setProcessedCount((prev) => prev + 1);
    },
    1000,
    { leading: false, trailing: false }
  );

  return (
    <div>
      <h2>Both Edges Disabled</h2>
      <p>Both leading and trailing disabled. The callback never executes.</p>
      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          throttledClick();
        }}
      >
        Click (Nothing Happens)
      </button>
      <div>
        <p>Total Clicks: {clickCount}</p>
        <p>Processed: {processedCount}</p>
        <p>Status: Callback never executes! 🚫</p>
      </div>
      <p>⚠️ Both edges disabled: This configuration completely disables the callback. Matches Lodash behavior where {leading: false, trailing: false} means "nothing happens".</p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", {
      name: /Click \(Nothing Happens\)/i,
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

    // Click multiple times
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    // Wait past throttle interval
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Still 0 - callback never executes
    expect(getProcessedCount()).toBe(0);

    // Click more
    await userEvent.click(button);
    await userEvent.click(button);

    // Wait again
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Still 0
    expect(getProcessedCount()).toBe(0);
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
      source: {
        code: `import { useThrottleCallback } from "@usefy/use-throttle-callback";
import { useState } from "react";

function ApiRateLimiterExample() {
  const [query, setQuery] = useState("");
  const [apiCalls, setApiCalls] = useState<string[]>([]);
  const [callCount, setCallCount] = useState(0);

  const throttledApiCall = useThrottleCallback((searchQuery: string) => {
    const time = new Date().toLocaleTimeString();
    setApiCalls((prev) => [
      \`[\${time}] API call: "\${searchQuery}"\`,
      ...prev.slice(0, 4),
    ]);
    setCallCount((prev) => prev + 1);
    // Simulate API call
    console.log("API call:", searchQuery);
  }, 1000);

  return (
    <div>
      <h2>API Rate Limiter</h2>
      <p>
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
      />
      <div>
        <p>Total API Calls: {callCount}</p>
        <p>API Log:</p>
        <ul>
          {apiCalls.length === 0 ? (
            <li>No calls yet</li>
          ) : (
            apiCalls.map((call, i) => <li key={i}>{call}</li>)
          )}
        </ul>
      </div>
      <p>
        💡 Use case: Prevent hitting API rate limits while still providing responsive
        search as the user types.
      </p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
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
