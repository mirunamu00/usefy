import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect } from "react";
import { useThrottle } from "./useThrottle";
import { within, userEvent, expect, waitFor } from "storybook/test";

/**
 * 1. Scroll Position Demo
 */
function ScrollPositionDemo() {
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 100);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Scroll Position Throttling
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Scroll to see throttling in action. Updates at most once per 100ms.
      </p>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Raw scroll position:</strong>{" "}
          <span style={{ color: "#6b7280" }}>{scrollY}px</span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Throttled position:</strong>{" "}
          <span
            style={{
              color: "#667eea",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {throttledScrollY}px
          </span>
        </div>
      </div>

      <div
        onScroll={handleScroll}
        style={{
          height: "300px",
          overflowY: "scroll",
          border: "2px solid #e5e7eb",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          background: "white",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ height: "2000px" }}>
          <h3
            style={{
              marginTop: 0,
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Scroll this content
          </h3>
          <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
            The throttled value updates at most once per interval, reducing the
            number of expensive operations triggered by rapid scroll events.
          </p>
          {Array.from({ length: 50 }, (_, i) => (
            <p key={i} style={{ lineHeight: "1.6", color: "#6b7280" }}>
              Line {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing
              elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
              aliqua.
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Search Input Demo
 */
function SearchInputDemo() {
  const [searchQuery, setSearchQuery] = useState("");
  const throttledQuery = useThrottle(searchQuery, 300, {
    leading: false,
    trailing: true,
  });
  const [searchCount, setSearchCount] = useState(0);

  useEffect(() => {
    if (throttledQuery) {
      setSearchCount((prev) => prev + 1);
    }
  }, [throttledQuery]);

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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Search Input Throttling
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Type to search. API calls are throttled by 300ms.
      </p>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Type to search..."
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
          e.currentTarget.style.borderColor = "#667eea";
          e.currentTarget.style.boxShadow =
            "0 0 0 3px rgba(102, 126, 234, 0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
        }}
      />

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Current Input:</strong>{" "}
          <span style={{ color: "#6b7280" }}>{searchQuery || "(empty)"}</span>
        </div>
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Throttled Query:</strong>{" "}
          <span style={{ color: "#6b7280" }}>
            {throttledQuery || "(empty)"}
          </span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>API Calls Made:</strong>{" "}
          <span
            style={{
              color: "#667eea",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {searchCount}
          </span>
        </div>
      </div>

      <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
        💡 Try typing quickly. The throttled query (simulating API calls) only
        updates according to the interval setting, saving unnecessary network
        requests.
      </p>
    </div>
  );
}

/**
 * 3. Window Resize Demo
 */
function WindowResizeDemo() {
  const [width, setWidth] = useState(300);
  const throttledWidth = useThrottle(width, 200);

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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Window Resize Throttling
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Drag the slider to simulate window resize. Throttled by 200ms.
      </p>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Raw Width:</strong>{" "}
          <span style={{ color: "#6b7280" }}>{width}px</span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Throttled Width:</strong>{" "}
          <span
            style={{
              color: "#667eea",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {throttledWidth}px
          </span>
        </div>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label
          htmlFor="width-slider"
          style={{
            display: "block",
            marginBottom: "0.75rem",
            fontWeight: "600",
            color: "#374151",
            fontSize: "0.95rem",
          }}
        >
          Adjust Width:
        </label>
        <input
          id="width-slider"
          type="range"
          min="100"
          max="600"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          style={{ width: "100%", height: "40px" }}
        />
      </div>

      <div
        style={{
          width: `${throttledWidth}px`,
          height: "200px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "2rem",
          fontWeight: "bold",
          transition: "width 0.1s ease-out",
          boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
        }}
      >
        {throttledWidth}px
      </div>

      <p
        style={{
          marginTop: "1.25rem",
          color: "#6b7280",
          fontSize: "0.875rem",
        }}
      >
        💡 The throttled width only updates according to the interval,
        preventing expensive layout recalculations.
      </p>
    </div>
  );
}

/**
 * 4. Mouse Movement Demo - Default (Both Edges)
 */
function MouseMovementDemo() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const throttledPos = useThrottle(mousePos, 300);
  const [rawUpdateCount, setRawUpdateCount] = useState(0);
  const [throttledUpdateCount, setThrottledUpdateCount] = useState(0);

  useEffect(() => {
    setRawUpdateCount((prev) => prev + 1);
  }, [mousePos]);

  useEffect(() => {
    setThrottledUpdateCount((prev) => prev + 1);
  }, [throttledPos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    });
  };

  const reduction =
    rawUpdateCount > 0
      ? Math.round(
          ((rawUpdateCount - throttledUpdateCount) / rawUpdateCount) * 100
        )
      : 0;

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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Mouse Movement - Default (Both Edges)
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Move your mouse in the area below. Throttled by 300ms with default
        settings (leading + trailing).
      </p>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Raw Updates:</strong>{" "}
          <span style={{ color: "#6b7280" }}>{rawUpdateCount}</span>
        </div>
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Throttled Updates:</strong>{" "}
          <span
            style={{
              color: "#667eea",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {throttledUpdateCount}
          </span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Reduction:</strong>{" "}
          <span style={{ color: "#10b981", fontWeight: "700" }}>
            {reduction}%
          </span>
        </div>
      </div>

      <div
        onMouseMove={handleMouseMove}
        style={{
          height: "300px",
          border: "2px solid #e5e7eb",
          borderRadius: "0.75rem",
          background: "white",
          position: "relative",
          cursor: "crosshair",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${throttledPos.x}px`,
            top: `${throttledPos.y}px`,
            width: "24px",
            height: "24px",
            background: "#667eea",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(102, 126, 234, 0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            width: "8px",
            height: "8px",
            background: "#ff6b6b",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            fontSize: "0.875rem",
            pointerEvents: "none",
            background: "rgba(255, 255, 255, 0.9)",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ marginBottom: "0.25rem" }}>
            <span style={{ color: "#ff6b6b", fontWeight: "700" }}>●</span> Raw
            position ({mousePos.x}, {mousePos.y})
          </div>
          <div>
            <span style={{ color: "#667eea", fontWeight: "700" }}>●</span>{" "}
            Throttled ({throttledPos.x}, {throttledPos.y})
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "1.25rem",
          padding: "1rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#78350f" }}>
          💡 <strong>Default behavior (both edges):</strong> Updates{" "}
          <strong>immediately</strong> when you start moving (leading edge),
          then throttles updates during movement, and updates one{" "}
          <strong>final time</strong> when you stop moving (trailing edge).
        </p>
      </div>
    </div>
  );
}

/**
 * 4-1. Mouse Movement Demo - Leading Edge Only
 */
function MouseMovementLeadingOnlyDemo() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const throttledPos = useThrottle(mousePos, 300, {
    leading: true,
    trailing: false,
  });
  const [rawUpdateCount, setRawUpdateCount] = useState(0);
  const [throttledUpdateCount, setThrottledUpdateCount] = useState(0);

  useEffect(() => {
    setRawUpdateCount((prev) => prev + 1);
  }, [mousePos]);

  useEffect(() => {
    setThrottledUpdateCount((prev) => prev + 1);
  }, [throttledPos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    });
  };

  const reduction =
    rawUpdateCount > 0
      ? Math.round(
          ((rawUpdateCount - throttledUpdateCount) / rawUpdateCount) * 100
        )
      : 0;

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
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Mouse Movement - Leading Only
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Move your mouse. Only <strong>leading edge</strong> enabled (trailing:
        false).
      </p>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#065f46" }}>Raw Updates:</strong>{" "}
          <span style={{ color: "#047857" }}>{rawUpdateCount}</span>
        </div>
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#065f46" }}>Throttled Updates:</strong>{" "}
          <span
            style={{
              color: "#10b981",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {throttledUpdateCount}
          </span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#065f46" }}>Reduction:</strong>{" "}
          <span style={{ color: "#059669", fontWeight: "700" }}>
            {reduction}%
          </span>
        </div>
      </div>

      <div
        onMouseMove={handleMouseMove}
        style={{
          height: "300px",
          border: "2px solid #a7f3d0",
          borderRadius: "0.75rem",
          background: "white",
          position: "relative",
          cursor: "crosshair",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${throttledPos.x}px`,
            top: `${throttledPos.y}px`,
            width: "24px",
            height: "24px",
            background: "#10b981",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            width: "8px",
            height: "8px",
            background: "#ff6b6b",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            fontSize: "0.875rem",
            pointerEvents: "none",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #a7f3d0",
          }}
        >
          <div style={{ marginBottom: "0.25rem" }}>
            <span style={{ color: "#ff6b6b", fontWeight: "700" }}>●</span> Raw
            position ({mousePos.x}, {mousePos.y})
          </div>
          <div>
            <span style={{ color: "#10b981", fontWeight: "700" }}>●</span>{" "}
            Throttled ({throttledPos.x}, {throttledPos.y})
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "1.25rem",
          padding: "1rem",
          background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#065f46" }}>
          💡 <strong>Leading edge only:</strong> Updates{" "}
          <strong>immediately</strong> when you start moving, then throttles. No
          final update when you stop! The green dot may{" "}
          <strong>lag behind</strong> when you stop moving.
        </p>
      </div>
    </div>
  );
}

/**
 * 4-2. Mouse Movement Demo - Trailing Edge Only
 */
function MouseMovementTrailingOnlyDemo() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const throttledPos = useThrottle(mousePos, 300, {
    leading: false,
    trailing: true,
  });
  const [rawUpdateCount, setRawUpdateCount] = useState(0);
  const [throttledUpdateCount, setThrottledUpdateCount] = useState(0);

  useEffect(() => {
    if (mousePos.x !== 0 || mousePos.y !== 0) {
      setRawUpdateCount((prev) => prev + 1);
    }
  }, [mousePos]);

  useEffect(() => {
    if (throttledPos.x !== 0 || throttledPos.y !== 0) {
      setThrottledUpdateCount((prev) => prev + 1);
    }
  }, [throttledPos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    });
  };

  const reduction =
    rawUpdateCount > 0
      ? Math.round(
          ((rawUpdateCount - throttledUpdateCount) / rawUpdateCount) * 100
        )
      : 0;

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
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Mouse Movement - Trailing Only
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Move your mouse. Only <strong>trailing edge</strong> enabled (leading:
        false).
      </p>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Raw Updates:</strong>{" "}
          <span style={{ color: "#b45309" }}>{rawUpdateCount}</span>
        </div>
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Throttled Updates:</strong>{" "}
          <span
            style={{
              color: "#f59e0b",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {throttledUpdateCount}
          </span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#92400e" }}>Reduction:</strong>{" "}
          <span style={{ color: "#d97706", fontWeight: "700" }}>
            {reduction}%
          </span>
        </div>
      </div>

      <div
        onMouseMove={handleMouseMove}
        style={{
          height: "300px",
          border: "2px solid #fde68a",
          borderRadius: "0.75rem",
          background: "white",
          position: "relative",
          cursor: "crosshair",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(245, 158, 11, 0.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${throttledPos.x}px`,
            top: `${throttledPos.y}px`,
            width: "24px",
            height: "24px",
            background: "#f59e0b",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            width: "8px",
            height: "8px",
            background: "#ff6b6b",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            fontSize: "0.875rem",
            pointerEvents: "none",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #fde68a",
          }}
        >
          <div style={{ marginBottom: "0.25rem" }}>
            <span style={{ color: "#ff6b6b", fontWeight: "700" }}>●</span> Raw
            position ({mousePos.x}, {mousePos.y})
          </div>
          <div>
            <span style={{ color: "#f59e0b", fontWeight: "700" }}>●</span>{" "}
            Throttled ({throttledPos.x}, {throttledPos.y})
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "1.25rem",
          padding: "1rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#92400e" }}>
          💡 <strong>Trailing edge only:</strong> No immediate update when you
          start moving. Updates occur during throttle intervals and{" "}
          <strong>catches up</strong> when you stop. The orange dot{" "}
          <strong>lags at the start</strong> but catches up at the end.
        </p>
      </div>
    </div>
  );
}

/**
 * 4-3. Mouse Movement Demo - No Throttling (Both Disabled)
 */
function MouseMovementNoThrottleDemo() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const throttledPos = useThrottle(mousePos, 300, {
    leading: false,
    trailing: false,
  });
  const [rawUpdateCount, setRawUpdateCount] = useState(0);
  const [throttledUpdateCount, setThrottledUpdateCount] = useState(0);

  useEffect(() => {
    setRawUpdateCount((prev) => prev + 1);
  }, [mousePos]);

  useEffect(() => {
    setThrottledUpdateCount((prev) => prev + 1);
  }, [throttledPos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    });
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
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Mouse Movement - Both Disabled
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}
      >
        Move your mouse. Both edges <strong>disabled</strong> (leading: false,
        trailing: false).
      </p>

      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#991b1b" }}>Raw Updates:</strong>{" "}
          <span style={{ color: "#b91c1c" }}>{rawUpdateCount}</span>
        </div>
        <div style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#991b1b" }}>Throttled Updates:</strong>{" "}
          <span
            style={{
              color: "#ef4444",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {throttledUpdateCount}
          </span>
        </div>
        <div style={{ fontSize: "0.95rem" }}>
          <strong style={{ color: "#991b1b" }}>Status:</strong>{" "}
          <span style={{ color: "#dc2626", fontWeight: "700" }}>
            No throttling active! 🚫
          </span>
        </div>
      </div>

      <div
        onMouseMove={handleMouseMove}
        style={{
          height: "300px",
          border: "2px solid #fecaca",
          borderRadius: "0.75rem",
          background: "white",
          position: "relative",
          cursor: "crosshair",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(239, 68, 68, 0.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${throttledPos.x}px`,
            top: `${throttledPos.y}px`,
            width: "24px",
            height: "24px",
            background: "#ef4444",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.5)",
            opacity: throttledPos.x === 0 && throttledPos.y === 0 ? 0 : 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            width: "8px",
            height: "8px",
            background: "#ff6b6b",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            fontSize: "0.875rem",
            pointerEvents: "none",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #fecaca",
          }}
        >
          <div style={{ marginBottom: "0.25rem" }}>
            <span style={{ color: "#ff6b6b", fontWeight: "700" }}>●</span> Raw
            position ({mousePos.x}, {mousePos.y})
          </div>
          <div>
            <span style={{ color: "#ef4444", fontWeight: "700" }}>●</span>{" "}
            Throttled ({throttledPos.x}, {throttledPos.y})
          </div>
        </div>

        {throttledPos.x === 0 && throttledPos.y === 0 && mousePos.x !== 0 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#ef4444",
              pointerEvents: "none",
              textAlign: "center",
            }}
          >
            ⚠️
            <br />
            <span style={{ fontSize: "1rem" }}>No throttle dot visible!</span>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "1.25rem",
          padding: "1rem",
          background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#991b1b" }}>
          ⚠️ <strong>Both edges disabled:</strong> The throttle value{" "}
          <strong>stays at initial value</strong> and never updates! This
          configuration is <strong>not useful</strong> - it completely disables
          throttling.
        </p>
      </div>
    </div>
  );
}

/**
 * 5. Click Event Throttle Demo (Token Renewal Pattern)
 */
function ClickEventThrottleDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [renewalCount, setRenewalCount] = useState(0);
  const [lastRenewalTime, setLastRenewalTime] = useState<Date | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);

  const THROTTLE_INTERVAL = 5000; // 5 seconds (simulating 5 minutes in real scenario)

  // Throttle the click count - only leading edge, no trailing
  // This means: execute immediately on first click, ignore subsequent clicks until interval passes
  const throttledClickCount = useThrottle(clickCount, THROTTLE_INTERVAL, {
    leading: true,
    trailing: false,
  });

  // When throttled value changes, simulate token renewal
  useEffect(() => {
    if (throttledClickCount > 0) {
      setRenewalCount((prev) => prev + 1);
      const now = new Date();
      setLastRenewalTime(now);
      setTokenExpiry(new Date(now.getTime() + 30000)); // Token expires in 30 seconds
      setCooldownRemaining(THROTTLE_INTERVAL);
    }
  }, [throttledClickCount]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 100));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [cooldownRemaining > 0]);

  // Token expiry countdown
  const [tokenCountdown, setTokenCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (tokenExpiry) {
      const timer = setInterval(() => {
        const remaining = tokenExpiry.getTime() - Date.now();
        setTokenCountdown(remaining > 0 ? remaining : null);
        if (remaining <= 0) {
          setTokenExpiry(null);
        }
      }, 100);
      return () => clearInterval(timer);
    } else {
      setTokenCountdown(null);
    }
  }, [tokenExpiry]);

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
  };

  const isOnCooldown = cooldownRemaining > 0;
  const cooldownPercent = (cooldownRemaining / THROTTLE_INTERVAL) * 100;

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
          background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}
      >
        Click Event Throttling
      </h2>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
          lineHeight: "1.6",
        }}
      >
        Simulates a <strong>token renewal</strong> scenario. Click the button to
        renew the token, but it can only be renewed once every{" "}
        <strong>5 seconds</strong>. Using <code>trailing: false</code> ensures
        only the first click triggers renewal.
      </p>

      {/* Token Status Card */}
      <div
        style={{
          padding: "1.25rem",
          background: tokenExpiry
            ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
            : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
          transition: "background 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: tokenExpiry ? "#10b981" : "#ef4444",
              boxShadow: tokenExpiry
                ? "0 0 8px rgba(16, 185, 129, 0.5)"
                : "0 0 8px rgba(239, 68, 68, 0.5)",
            }}
          />
          <strong style={{ color: tokenExpiry ? "#065f46" : "#991b1b" }}>
            Token Status: {tokenExpiry ? "Valid" : "Expired"}
          </strong>
        </div>
        {tokenCountdown !== null && (
          <div style={{ fontSize: "0.875rem", color: "#065f46" }}>
            Expires in: {Math.ceil(tokenCountdown / 1000)}s
            <div
              style={{
                marginTop: "0.5rem",
                height: "4px",
                background: "rgba(16, 185, 129, 0.2)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(tokenCountdown / 30000) * 100}%`,
                  background: "#10b981",
                  transition: "width 0.1s linear",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Click Button */}
      <div style={{ marginBottom: "1.25rem" }}>
        <button
          onClick={handleClick}
          style={{
            width: "100%",
            padding: "1rem 2rem",
            fontSize: "1.1rem",
            fontWeight: "600",
            color: "white",
            background: isOnCooldown
              ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
              : "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
            border: "none",
            borderRadius: "0.75rem",
            cursor: isOnCooldown ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: isOnCooldown
              ? "0 2px 8px rgba(0, 0, 0, 0.1)"
              : "0 4px 16px rgba(139, 92, 246, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {isOnCooldown ? (
            <>
              Cooldown... ({Math.ceil(cooldownRemaining / 1000)}s)
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: "4px",
                  width: `${cooldownPercent}%`,
                  background: "rgba(255, 255, 255, 0.5)",
                  transition: "width 0.1s linear",
                }}
              />
            </>
          ) : (
            "🔄 Renew Token"
          )}
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          padding: "1.25rem",
          background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Total Clicks:</strong>{" "}
          <span style={{ color: "#6b7280" }}>{clickCount}</span>
        </div>
        <div style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Actual Renewals:</strong>{" "}
          <span
            style={{
              color: "#8b5cf6",
              fontWeight: "700",
              fontSize: "1.1rem",
            }}
          >
            {renewalCount}
          </span>
        </div>
        <div style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>
          <strong style={{ color: "#374151" }}>Ignored Clicks:</strong>{" "}
          <span style={{ color: "#ef4444", fontWeight: "600" }}>
            {clickCount - renewalCount}
          </span>
        </div>
        {lastRenewalTime && (
          <div style={{ fontSize: "0.95rem" }}>
            <strong style={{ color: "#374151" }}>Last Renewal:</strong>{" "}
            <span style={{ color: "#6b7280" }}>
              {lastRenewalTime.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Click History Visualization */}
      <div
        style={{
          padding: "1rem",
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "0.75rem",
          }}
        >
          Click Timeline (recent 10):
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {clickCount === 0 ? (
            <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
              No clicks yet
            </span>
          ) : (
            Array.from({ length: Math.min(clickCount, 10) }, (_, i) => {
              const clickNum = clickCount - Math.min(clickCount, 10) + i + 1;
              const isRenewal =
                clickNum === 1 ||
                (clickNum - 1) % Math.ceil(THROTTLE_INTERVAL / 1000) === 0;
              return (
                <div
                  key={i}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: isRenewal
                      ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                      : "#e5e7eb",
                    color: isRenewal ? "white" : "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    boxShadow: isRenewal
                      ? "0 2px 8px rgba(139, 92, 246, 0.4)"
                      : "none",
                  }}
                  title={
                    isRenewal ? "Renewal triggered" : "Ignored (throttled)"
                  }
                >
                  {clickNum}
                </div>
              );
            })
          )}
        </div>
        <div
          style={{
            marginTop: "0.75rem",
            fontSize: "0.75rem",
            color: "#9ca3af",
            display: "flex",
            gap: "1rem",
          }}
        >
          <span>
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#8b5cf6",
                marginRight: "4px",
              }}
            />
            Renewal
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#e5e7eb",
                marginRight: "4px",
              }}
            />
            Ignored
          </span>
        </div>
      </div>

      {/* Info Box */}
      <div
        style={{
          padding: "1rem",
          background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            color: "#5b21b6",
            lineHeight: "1.6",
          }}
        >
          💡 <strong>Real-world use case:</strong> Token renewal on user action.
          Even if the user clicks rapidly, the token is renewed at most once
          every 5 seconds. This prevents unnecessary API calls while ensuring
          the token stays fresh during active use. Using{" "}
          <code
            style={{
              background: "rgba(139, 92, 246, 0.2)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            trailing: false
          </code>{" "}
          means only the first click triggers the renewal—subsequent clicks
          during cooldown are completely ignored.
        </p>
      </div>
    </div>
  );
}

/**
 * Meta & Stories
 */
const meta = {
  title: "Hooks/useThrottle",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Throttles a rapidly changing value to update at most once per specified interval. Useful for optimizing performance with high-frequency events like scroll, resize, or mousemove by limiting how often a value propagates through your component tree.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ScrollPosition: Story = {
  render: () => <ScrollPositionDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Common use case: Throttling scroll position updates to reduce expensive operations. Only updates at most once per 100ms.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the scrollable container
    const scrollContainer = canvasElement.querySelector(
      '[style*="overflow-y: scroll"]'
    ) as HTMLElement;
    expect(scrollContainer).toBeInTheDocument();

    // Initially, scroll position should be 0
    await expect(
      canvas.getByText("Raw scroll position:", { exact: false })
    ).toBeInTheDocument();

    // Simulate scroll by changing scrollTop
    if (scrollContainer) {
      scrollContainer.scrollTop = 100;
      scrollContainer.dispatchEvent(new Event("scroll"));
    }

    // Wait for throttled update
    await waitFor(
      async () => {
        const throttledText = canvas.getByText("Throttled position:", {
          exact: false,
        });
        expect(throttledText).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  },
};

export const SearchInput: Story = {
  render: () => <SearchInputDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Throttle search input to reduce API calls. Uses trailing edge only to wait for user to finish typing before making the call.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the search input
    const searchInput = canvas.getByPlaceholderText("Type to search...");

    // Initially, API calls should be 0
    await expect(
      canvas.getByText("API Calls Made:", { exact: false })
    ).toBeInTheDocument();

    // Type quickly
    await userEvent.type(searchInput, "react hooks", { delay: 50 });

    // Wait for throttle (300ms) and check API call count
    await waitFor(
      async () => {
        const apiCallsText = canvas.getByText("API Calls Made:", {
          exact: false,
        }).parentElement;
        expect(apiCallsText?.textContent).toMatch(/API Calls Made:\s*\d+/);
      },
      { timeout: 1000 }
    );

    // Verify throttled query is updated
    await waitFor(
      async () => {
        const throttledQueryText = canvas.getByText("Throttled Query:", {
          exact: false,
        });
        expect(throttledQueryText).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  },
};

export const WindowResize: Story = {
  render: () => <WindowResizeDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Throttle slider updates to avoid running expensive calculations on every value change. Only recalculates after the throttle interval.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the slider
    const slider = canvas.getByRole("slider");

    // Initially, check structure exists
    await expect(
      canvas.getByText("Raw Width:", { exact: false })
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Throttled Width:", { exact: false })
    ).toBeInTheDocument();

    // Change slider value
    await userEvent.click(slider);
    await userEvent.type(
      slider,
      "{arrowright}{arrowright}{arrowright}{arrowright}{arrowright}"
    );

    // Wait for throttled update
    await waitFor(
      async () => {
        const throttledText = canvas.getByText("Throttled Width:", {
          exact: false,
        });
        expect(throttledText).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  },
};

export const MouseMovementBothEdges: Story = {
  render: () => <MouseMovementDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Default behavior with both leading and trailing edges enabled. Updates immediately when movement starts (leading), throttles during movement, and updates one final time when movement stops (trailing). Best balance for most use cases.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check structure exists
    await expect(
      canvas.getByText("Raw Updates:", { exact: false })
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Throttled Updates:", { exact: false })
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Reduction:", { exact: false })
    ).toBeInTheDocument();

    // Find the mouse tracking area
    const trackingArea = canvasElement.querySelector(
      '[style*="cursor: crosshair"]'
    ) as HTMLElement;
    expect(trackingArea).toBeInTheDocument();
  },
};

export const MouseMovementLeadingOnly: Story = {
  render: () => <MouseMovementLeadingOnlyDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Only leading edge enabled. Updates immediately when movement starts, then throttles. No final update when movement stops - the throttled value may lag behind the actual position. Useful when you want instant feedback but don't care about the final position.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check structure exists
    await expect(
      canvas.getByText("Raw Updates:", { exact: false })
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Throttled Updates:", { exact: false })
    ).toBeInTheDocument();

    // Check leading only info box
    await expect(
      canvas.getByText(/Leading edge only:/i, { exact: false })
    ).toBeInTheDocument();
  },
};

export const MouseMovementTrailingOnly: Story = {
  render: () => <MouseMovementTrailingOnlyDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Only trailing edge enabled. No immediate update when movement starts - the throttled value lags at first. Updates during throttle intervals and catches up when movement stops. Useful when you only care about the final settled position.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check structure exists
    await expect(
      canvas.getByText("Raw Updates:", { exact: false })
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Throttled Updates:", { exact: false })
    ).toBeInTheDocument();

    // Check trailing only info box
    await expect(
      canvas.getByText(/Trailing edge only:/i, { exact: false })
    ).toBeInTheDocument();
  },
};

export const MouseMovementBothDisabled: Story = {
  render: () => <MouseMovementNoThrottleDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Both edges disabled - demonstrates what NOT to do. The throttled value never updates and stays at its initial value. This configuration completely disables throttling and is not useful in practice.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check structure exists
    await expect(
      canvas.getByText("Raw Updates:", { exact: false })
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Throttled Updates:", { exact: false })
    ).toBeInTheDocument();

    // Check warning info box
    await expect(
      canvas.getByText(/Both edges disabled:/i, { exact: false })
    ).toBeInTheDocument();
  },
};

export const ClickEventThrottle: Story = {
  render: () => <ClickEventThrottleDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates throttling click events for token renewal. Using `trailing: false` ensures only the first click triggers the action, and subsequent clicks during the cooldown period are ignored. This pattern is useful for preventing duplicate API calls on rapid button clicks.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the button
    const button = canvas.getByRole("button", { name: /Renew Token/i });

    // Initially, counts should be 0
    await expect(
      canvas.getByText("Total Clicks:", { exact: false })
    ).toBeInTheDocument();
    const renewalsContainer = canvas.getByText("Actual Renewals:", {
      exact: false,
    }).parentElement;
    expect(renewalsContainer?.textContent).toMatch(/0/);

    // Click the button - first click should trigger renewal immediately
    await userEvent.click(button);

    // Wait for renewal to be triggered
    await waitFor(
      async () => {
        const renewalsContainer = canvas.getByText("Actual Renewals:", {
          exact: false,
        }).parentElement;
        expect(renewalsContainer?.textContent).toMatch(/1/);
      },
      { timeout: 1000 }
    );

    // Click rapidly multiple times during cooldown
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    // Renewals should still be 1 (clicks during cooldown are ignored)
    await waitFor(
      async () => {
        const totalClicksContainer = canvas.getByText("Total Clicks:", {
          exact: false,
        }).parentElement;
        expect(totalClicksContainer?.textContent).toMatch(/4/);

        const renewalsContainer = canvas.getByText("Actual Renewals:", {
          exact: false,
        }).parentElement;
        expect(renewalsContainer?.textContent).toMatch(/1/);

        const ignoredContainer = canvas.getByText("Ignored Clicks:", {
          exact: false,
        }).parentElement;
        expect(ignoredContainer?.textContent).toMatch(/3/);
      },
      { timeout: 500 }
    );

    // Token should be valid
    await expect(canvas.getByText("Token Status: Valid")).toBeInTheDocument();
  },
};
