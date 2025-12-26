import type { Meta, StoryObj } from "@storybook/react";
import { useState, useEffect, useRef } from "react";
import { useThrottleCallback } from "./useThrottleCallback";
import { within, userEvent, expect, waitFor } from "storybook/test";

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
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Throttled Button Click
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Click rapidly! The callback executes at most once per second, with the
        first click firing immediately (leading edge).
      </p>

      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          throttledClick();
        }}
        style={{
          width: "100%",
          padding: "1.5rem 2rem",
          fontSize: "1.25rem",
          backgroundColor: "#f59e0b",
          color: "white",
          border: "none",
          borderRadius: "0.75rem",
          cursor: "pointer",
          marginBottom: "1.25rem",
          transition: "all 0.2s ease",
          boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
          fontWeight: "600",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#d97706")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#f59e0b")
        }
      >
        Click Me Rapidly!
      </button>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <button
          onClick={throttledClick.cancel}
          aria-label="Cancel throttle"
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            fontSize: "0.95rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Cancel
        </button>
        <button
          onClick={throttledClick.flush}
          aria-label="Flush throttle"
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            fontSize: "0.95rem",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Flush Now
        </button>
      </div>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Total Clicks:</strong>{" "}
          <span style={{ color: "#78350f" }}>{clickCount}</span>
        </div>
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Processed (Throttled):</strong>{" "}
          <span
            style={{
              color: "#f59e0b",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {processedCount}
          </span>
        </div>
        {lastProcessedTime && (
          <div style={{ fontSize: "0.95rem" }}>
            <strong style={{ color: "#92400e" }}>Last Processed:</strong>{" "}
            <span style={{ color: "#78350f" }}>{lastProcessedTime}</span>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#fef3c7",
          borderRadius: "0.5rem",
          border: "1px solid #fcd34d",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#92400e" }}>
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
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Throttled Mouse Move
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Move your mouse inside the box. Position updates are throttled to 100ms
        intervals.
      </p>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        data-testid="mouse-area"
        style={{
          width: "100%",
          height: "200px",
          backgroundColor: "#fef3c7",
          borderRadius: "0.75rem",
          border: "2px dashed #f59e0b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.25rem",
          position: "relative",
          overflow: "hidden",
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
            backgroundColor: "#f59e0b",
            borderRadius: "50%",
            pointerEvents: "none",
            transition: "left 0.05s, top 0.05s",
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.4)",
          }}
        />
        <span
          style={{
            color: "#92400e",
            fontSize: "0.9rem",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        >
          Move mouse here
        </span>
      </div>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Position:</strong>{" "}
          <span style={{ color: "#78350f", fontFamily: "monospace" }}>
            ({Math.round(position.x)}, {Math.round(position.y)})
          </span>
        </div>
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Raw Move Events:</strong>{" "}
          <span style={{ color: "#78350f" }}>{rawMoveCount}</span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Throttled Updates:</strong>{" "}
          <span
            style={{
              color: "#f59e0b",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {updateCount}
          </span>
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
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Throttled Scroll Tracker
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Scroll inside the box. Position updates are throttled to 150ms
        intervals, reducing performance overhead.
      </p>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        data-testid="scroll-area"
        style={{
          width: "100%",
          height: "200px",
          overflowY: "scroll",
          backgroundColor: "#fef3c7",
          borderRadius: "0.75rem",
          border: "2px solid #f59e0b",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ height: "800px", padding: "1rem" }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              style={{
                padding: "0.75rem",
                marginBottom: "0.5rem",
                backgroundColor: i % 2 === 0 ? "#fde68a" : "#fcd34d",
                borderRadius: "0.5rem",
                color: "#92400e",
                fontWeight: "500",
              }}
            >
              Scroll Item {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Scroll Position:</strong>{" "}
          <span
            style={{
              color: "#78350f",
              fontFamily: "monospace",
            }}
          >
            {scrollPosition}px
          </span>
        </div>
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Raw Scroll Events:</strong>{" "}
          <span style={{ color: "#78350f" }}>{rawScrollCount}</span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Throttled Updates:</strong>{" "}
          <span
            style={{
              color: "#f59e0b",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {updateCount}
          </span>
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
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Leading Edge Only
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Only the first click fires immediately. Subsequent clicks within 1
        second are completely ignored (no trailing execution).
      </p>

      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          throttledClick();
        }}
        style={{
          width: "100%",
          padding: "1.5rem 2rem",
          fontSize: "1.25rem",
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "0.75rem",
          cursor: "pointer",
          marginBottom: "1.25rem",
          transition: "all 0.2s ease",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
          fontWeight: "600",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#dc2626")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#ef4444")
        }
      >
        Click (Leading Only)
      </button>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#991b1b" }}>Total Clicks:</strong>{" "}
          <span style={{ color: "#7f1d1d" }}>{clickCount}</span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#991b1b" }}>Processed:</strong>{" "}
          <span
            style={{
              color: "#ef4444",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {processedCount}
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#fee2e2",
          borderRadius: "0.5rem",
          border: "1px solid #fca5a5",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#991b1b" }}>
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
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Trailing Edge Only
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
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
        style={{
          width: "100%",
          padding: "0.875rem 1rem",
          fontSize: "1rem",
          border: "2px solid #e5e7eb",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          outline: "none",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#f59e0b";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
        }}
      />

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Current Input:</strong>{" "}
          <span style={{ color: "#78350f" }}>{input || "(empty)"}</span>
        </div>
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Last Processed:</strong>{" "}
          <span style={{ color: "#78350f" }}>{processedValue || "(none)"}</span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Process Count:</strong>{" "}
          <span
            style={{
              color: "#f59e0b",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {processedCount}
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#fef3c7",
          borderRadius: "0.5rem",
          border: "1px solid #fcd34d",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#92400e" }}>
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
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Control Methods
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
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
        style={{
          width: "100%",
          padding: "0.875rem 1rem",
          fontSize: "1rem",
          border: "2px solid #e5e7eb",
          borderRadius: "0.75rem",
          marginBottom: "1rem",
          outline: "none",
        }}
      />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          onClick={() => {
            throttledProcess.cancel();
            addLog("Cancelled pending");
          }}
          aria-label="Cancel"
          style={{
            flex: 1,
            padding: "0.75rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            throttledProcess.flush();
            addLog("Flushed");
          }}
          aria-label="Flush"
          style={{
            flex: 1,
            padding: "0.75rem",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Flush
        </button>
      </div>

      <div
        style={{
          padding: "1rem",
          backgroundColor: isPending ? "#fef3c7" : "#d1fae5",
          borderRadius: "0.75rem",
          marginBottom: "1rem",
          border: `2px solid ${isPending ? "#f59e0b" : "#10b981"}`,
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ fontSize: "0.95rem", fontWeight: "600" }}>
          Status:{" "}
          <span style={{ color: isPending ? "#f59e0b" : "#10b981" }}>
            {isPending ? "⏳ Pending" : "✅ Idle"}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
          borderRadius: "0.75rem",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Last Processed:</strong>{" "}
          <span style={{ color: "#6b7280" }}>{processedValue || "(none)"}</span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Action Log:</strong>
          <ul
            style={{
              margin: "0.5rem 0 0",
              padding: "0",
              listStyle: "none",
              fontSize: "0.85rem",
              fontFamily: "monospace",
            }}
          >
            {actionLog.length === 0 ? (
              <li style={{ color: "#9ca3af" }}>No actions yet</li>
            ) : (
              actionLog.map((log, i) => (
                <li
                  key={i}
                  style={{ color: "#6b7280", marginBottom: "0.25rem" }}
                >
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
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        API Rate Limiter
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
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
        style={{
          width: "100%",
          padding: "0.875rem 1rem",
          fontSize: "1rem",
          border: "2px solid #e5e7eb",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          outline: "none",
        }}
      />

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Total API Calls:</strong>{" "}
          <span
            style={{
              color: "#f59e0b",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {callCount}
          </span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>API Log:</strong>
          <ul
            style={{
              margin: "0.5rem 0 0",
              padding: "0",
              listStyle: "none",
              fontSize: "0.85rem",
              fontFamily: "monospace",
            }}
          >
            {apiCalls.length === 0 ? (
              <li style={{ color: "#92400e", opacity: 0.6 }}>No calls yet</li>
            ) : (
              apiCalls.map((call, i) => (
                <li
                  key={i}
                  style={{ color: "#78350f", marginBottom: "0.25rem" }}
                >
                  {call}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fef3c7",
          borderRadius: "0.5rem",
          border: "1px solid #fcd34d",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#92400e" }}>
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
