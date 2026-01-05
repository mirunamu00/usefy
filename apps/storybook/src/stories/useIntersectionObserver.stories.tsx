import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useRef, useEffect } from "react";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";
import { within, expect, waitFor, userEvent } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// Helper function to simulate scroll
const scrollTo = (element: HTMLElement, scrollTop: number) => {
  element.scrollTop = scrollTop;
  element.dispatchEvent(new Event("scroll", { bubbles: true }));
};

// Helper to wait for intersection observer to process
const waitForIntersection = () => new Promise((r) => setTimeout(r, 100));

// ============ 1. Basic Usage Demo ============
function BasicUsageDemo() {
  const { ref, inView, entry } = useIntersectionObserver();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on mount to ensure target is out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Basic Usage</h2>
      <p className={storyTheme.subtitle}>
        Scroll down to see the element enter and exit the viewport.
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>inView:</strong>{" "}
          <span
            data-testid="in-view"
            className={
              inView ? "text-green-600 font-bold" : "text-red-500 font-bold"
            }
          >
            {inView ? "true ✓" : "false ✗"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>intersectionRatio:</strong>{" "}
          <span data-testid="ratio" className={storyTheme.statValue}>
            {entry ? `${Math.round(entry.intersectionRatio * 100)}%` : "N/A"}
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        data-testid="scroll-container"
        style={{
          height: "300px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <div
          style={{
            height: "350px",
            background: "#f3f4f6",
            borderRadius: "8px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p className="text-gray-500 p-4">⬇️ Scroll down</p>
        </div>

        <div
          ref={ref}
          data-testid="target-element"
          style={{
            height: "120px",
            background: inView
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "1.2rem",
            transition: "all 0.3s ease",
            boxShadow: inView
              ? "0 10px 25px rgba(16, 185, 129, 0.4)"
              : "0 10px 25px rgba(239, 68, 68, 0.4)",
          }}
        >
          {inView ? "👁️ Visible!" : "👻 Not Visible"}
        </div>

        <div
          style={{
            height: "200px",
            background: "#f3f4f6",
            borderRadius: "8px",
            marginTop: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p className="text-gray-500 p-4">⬆️ Scroll up</p>
        </div>
      </div>
    </div>
  );
}

// ============ 2. Threshold Demo ============
function ThresholdDemo() {
  const [currentThreshold, setCurrentThreshold] = useState(0);
  const thresholds = [0, 0.25, 0.5, 0.75, 1.0];
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { ref, entry, inView } = useIntersectionObserver({
    threshold: thresholds,
    onChange: (entry) => {
      setCurrentThreshold(entry.intersectionRatio);
    },
  });

  // Scroll to top on mount to ensure target is out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Threshold</h2>
      <p className={storyTheme.subtitle}>
        Set multiple threshold values to track element visibility ratio in
        detail.
        <br />
        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
          threshold: [0, 0.25, 0.5, 0.75, 1.0]
        </code>
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Current Visibility:</strong>{" "}
          <span data-testid="visibility" className={storyTheme.statValue}>
            {Math.round(currentThreshold * 100)}%
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: "24px",
            background: "#e5e7eb",
            borderRadius: "12px",
            overflow: "hidden",
            marginTop: "12px",
          }}
        >
          <div
            data-testid="progress-bar"
            style={{
              width: `${currentThreshold * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #6366f1, #a855f7)",
              transition: "width 0.2s ease",
              borderRadius: "12px",
            }}
          />
        </div>

        {/* Threshold markers */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "8px",
          }}
        >
          {thresholds.map((t) => (
            <span
              key={t}
              className={`text-xs ${
                currentThreshold >= t
                  ? "text-indigo-600 font-bold"
                  : "text-gray-400"
              }`}
            >
              {t * 100}%
            </span>
          ))}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        data-testid="threshold-scroll-container"
        style={{
          height: "250px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <div style={{ height: "300px" }} />

        <div
          ref={ref}
          data-testid="threshold-target"
          style={{
            height: "200px",
            background: `linear-gradient(135deg, 
              hsl(${260 + currentThreshold * 50}, 80%, 50%) 0%, 
              hsl(${280 + currentThreshold * 50}, 80%, 60%) 100%)`,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "2rem",
            transition: "all 0.3s ease",
          }}
        >
          {Math.round(currentThreshold * 100)}%
        </div>

        <div style={{ height: "150px" }} />
      </div>
    </div>
  );
}

// ============ 3. RootMargin Demo ============
function RootMarginDemo() {
  const [rootMargin, setRootMargin] = useState("0px");
  const [key, setKey] = useState(0);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Root Margin</h2>
      <p className={storyTheme.subtitle}>
        rootMargin adjusts the detection boundary around the scroll container.
        <br />
        <strong>+50px</strong> = detect 50px earlier (preload),{" "}
        <strong>-50px</strong> = detect 50px later (must scroll more)
      </p>

      <div className={storyTheme.buttonGroupFull}>
        <button
          data-testid="margin-0"
          onClick={() => {
            setRootMargin("0px");
            setKey((k) => k + 1);
          }}
          className={
            rootMargin === "0px"
              ? storyTheme.buttonPrimary
              : storyTheme.buttonNeutral
          }
        >
          0px (default)
        </button>
        <button
          data-testid="margin-50"
          onClick={() => {
            setRootMargin("50px");
            setKey((k) => k + 1);
          }}
          className={
            rootMargin === "50px"
              ? storyTheme.buttonPrimary
              : storyTheme.buttonNeutral
          }
        >
          +50px (expand)
        </button>
        <button
          data-testid="margin-minus50"
          onClick={() => {
            setRootMargin("-50px");
            setKey((k) => k + 1);
          }}
          className={
            rootMargin === "-50px"
              ? storyTheme.buttonPrimary
              : storyTheme.buttonNeutral
          }
        >
          -50px (shrink)
        </button>
      </div>

      <RootMarginChild key={key} rootMargin={rootMargin} />
    </div>
  );
}

function RootMarginChild({ rootMargin }: { rootMargin: string }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Mount flag for root ref
  useEffect(() => {
    setMounted(true);
  }, []);

  const { ref, inView } = useIntersectionObserver({
    root: scrollContainerRef.current,
    rootMargin,
  });

  // Scroll to top on mount to ensure target is out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <>
      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>rootMargin:</strong>{" "}
          <span className={storyTheme.statValue}>{rootMargin}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>inView:</strong>{" "}
          <span
            data-testid="in-view"
            className={
              inView ? "text-green-600 font-bold" : "text-red-500 font-bold"
            }
          >
            {inView ? "true" : "false"}
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        style={{
          height: "300px",
          overflowY: "auto",
          border: "3px solid #9ca3af",
          borderRadius: "12px",
          padding: "0",
          position: "relative",
          background: "#fafafa",
        }}
      >
        <div
          style={{
            height: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: "0.875rem",
            borderBottom: "1px dashed #d1d5db",
          }}
        >
          ⬇️ Scroll down slowly and watch when detection happens
        </div>

        <div
          ref={ref}
          data-testid="target"
          style={{
            height: "120px",
            background: inView
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            transition: "all 0.3s ease",
            boxShadow: inView
              ? "0 8px 24px rgba(16, 185, 129, 0.4)"
              : "0 8px 24px rgba(239, 68, 68, 0.4)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
            {inView ? "👁️ DETECTED!" : "👻 NOT DETECTED"}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              opacity: 0.9,
              textAlign: "center",
              padding: "0 16px",
            }}
          >
            {rootMargin === "0px" &&
              "Detects when element touches container edge"}
            {rootMargin === "50px" &&
              "Detects 50px BEFORE element enters container"}
            {rootMargin === "-50px" &&
              "Detects only after element is 50px INSIDE container"}
          </div>
        </div>

        <div
          style={{
            height: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: "0.875rem",
            borderTop: "1px dashed #d1d5db",
          }}
        >
          ⬆️ Scroll up to test again
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-4"}>
        <div className={storyTheme.infoText}>
          <p style={{ margin: 0 }}>
            💡 <strong>Understanding rootMargin:</strong>
          </p>
          <ul
            style={{
              listStyle: "none",
              paddingLeft: "1rem",
              margin: "0.5rem 0 0 0",
            }}
          >
            <li style={{ marginBottom: "0.5rem" }}>
              <strong>0px:</strong> Detects exactly when element enters the gray
              container border
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <strong>+50px:</strong> Detects 50px EARLIER - before element
              reaches the border (useful for preloading)
            </li>
            <li style={{ marginBottom: "0" }}>
              <strong>-50px:</strong> Detects 50px LATER - after element crosses
              the border (more conservative)
            </li>
          </ul>
          <p style={{ margin: "0.75rem 0 0 0" }}>
            💡 Scroll slowly to see exactly when the red→green color change
            happens!
          </p>
        </div>
      </div>
    </>
  );
}

// ============ 4. TriggerOnce Demo ============
function TriggerOnceDemo() {
  const [triggerOnce, setTriggerOnce] = useState(true);
  const [triggerCount, setTriggerCount] = useState(0);
  const [key, setKey] = useState(0);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Trigger Once</h2>
      <p className={storyTheme.subtitle}>
        When triggerOnce is true, the element stops being observed after
        entering view once.
        <br />
        Useful for lazy loading images or one-time animations.
      </p>

      <div className={storyTheme.buttonGroupFull}>
        <button
          data-testid="trigger-once-on"
          onClick={() => {
            setTriggerOnce(true);
            setTriggerCount(0);
            setKey((k) => k + 1);
          }}
          className={
            triggerOnce ? storyTheme.buttonPrimary : storyTheme.buttonNeutral
          }
        >
          triggerOnce: true
        </button>
        <button
          data-testid="trigger-once-off"
          onClick={() => {
            setTriggerOnce(false);
            setTriggerCount(0);
            setKey((k) => k + 1);
          }}
          className={
            !triggerOnce ? storyTheme.buttonPrimary : storyTheme.buttonNeutral
          }
        >
          triggerOnce: false
        </button>
      </div>

      <TriggerOnceChild
        key={key}
        triggerOnce={triggerOnce}
        onTrigger={() => setTriggerCount((c) => c + 1)}
        triggerCount={triggerCount}
      />
    </div>
  );
}

function TriggerOnceChild({
  triggerOnce,
  onTrigger,
  triggerCount,
}: {
  triggerOnce: boolean;
  onTrigger: () => void;
  triggerCount: number;
}) {
  const { ref, inView } = useIntersectionObserver({
    triggerOnce,
    onChange: (_, inView) => {
      if (inView) onTrigger();
    },
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on mount to ensure target is out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <>
      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>triggerOnce:</strong>{" "}
          <span
            data-testid="trigger-once-value"
            className={storyTheme.statValue}
          >
            {triggerOnce ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>inView Trigger Count:</strong>{" "}
          <span data-testid="trigger-count" className={storyTheme.statValue}>
            {triggerCount}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Current inView:</strong>{" "}
          <span
            data-testid="current-in-view"
            className={
              inView ? "text-green-600 font-bold" : "text-red-500 font-bold"
            }
          >
            {inView ? "true" : "false"}
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        data-testid="trigger-scroll-container"
        style={{
          height: "200px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <div
          style={{
            height: "250px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="text-gray-400">⬇️ Scroll down</span>
        </div>

        <div
          ref={ref}
          data-testid="trigger-target"
          style={{
            height: "80px",
            background: inView
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            transition: "all 0.3s ease",
          }}
        >
          {triggerOnce && triggerCount > 0
            ? "🔒 Locked (no longer tracked)"
            : inView
            ? "👁️ Visible!"
            : "Waiting..."}
        </div>

        <div style={{ height: "150px" }} />
      </div>
    </>
  );
}

// ============ 5. Enabled Demo ============
function EnabledDemo() {
  const [enabled, setEnabled] = useState(true);
  const { ref, inView, entry } = useIntersectionObserver({ enabled });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on mount to ensure target is out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Enabled</h2>
      <p className={storyTheme.subtitle}>
        Dynamically enable/disable the observer with the enabled option.
      </p>

      <button
        data-testid="toggle-enabled"
        onClick={() => setEnabled((prev) => !prev)}
        className={enabled ? storyTheme.buttonSuccess : storyTheme.buttonDanger}
      >
        {enabled
          ? "✅ Observing (click to disable)"
          : "⏸️ Paused (click to enable)"}
      </button>

      <div className={storyTheme.statBox + " mt-5 mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>enabled:</strong>{" "}
          <span data-testid="enabled-value" className={storyTheme.statValue}>
            {enabled ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>inView:</strong>{" "}
          <span
            data-testid="in-view"
            className={
              inView ? "text-green-600 font-bold" : "text-gray-500 font-bold"
            }
          >
            {inView ? "true" : "false"}
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        data-testid="enabled-scroll-container"
        style={{
          height: "200px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          opacity: enabled ? 1 : 0.5,
          transition: "opacity 0.3s ease",
        }}
      >
        <div style={{ height: "250px" }} />

        <div
          ref={ref}
          data-testid="enabled-target"
          style={{
            height: "80px",
            background: !enabled
              ? "#9ca3af"
              : inView
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            transition: "all 0.3s ease",
          }}
        >
          {!enabled
            ? "⏸️ Observation Disabled"
            : inView
            ? "👁️ Visible"
            : "Not Visible"}
        </div>

        <div style={{ height: "100px" }} />
      </div>
    </div>
  );
}

// ============ 6. InitialIsIntersecting Demo ============
function InitialIsIntersectingDemo() {
  const [initialIsIntersecting, setInitialIsIntersecting] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Initial Is Intersecting</h2>
      <p className={storyTheme.subtitle}>
        Set the initial intersection state for SSR/SSG environments.
        <br />
        Useful when you need to display above-the-fold content immediately.
      </p>

      <div className={storyTheme.buttonGroupFull}>
        <button
          data-testid="initial-false"
          onClick={() => {
            setInitialIsIntersecting(false);
            setKey((k) => k + 1);
          }}
          className={
            !initialIsIntersecting
              ? storyTheme.buttonPrimary
              : storyTheme.buttonNeutral
          }
        >
          Initial: false
        </button>
        <button
          data-testid="initial-true"
          onClick={() => {
            setInitialIsIntersecting(true);
            setKey((k) => k + 1);
          }}
          className={
            initialIsIntersecting
              ? storyTheme.buttonPrimary
              : storyTheme.buttonNeutral
          }
        >
          Initial: true
        </button>
      </div>

      <InitialIsIntersectingChild
        key={key}
        initialIsIntersecting={initialIsIntersecting}
      />
    </div>
  );
}

function InitialIsIntersectingChild({
  initialIsIntersecting,
}: {
  initialIsIntersecting: boolean;
}) {
  const { ref, inView, entry } = useIntersectionObserver({
    initialIsIntersecting,
  });
  const [hasObserved, setHasObserved] = useState(false);

  useEffect(() => {
    if (entry) {
      setHasObserved(true);
    }
  }, [entry]);

  return (
    <>
      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>
            initialIsIntersecting:
          </strong>{" "}
          <span data-testid="initial-value" className={storyTheme.statValue}>
            {initialIsIntersecting ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>inView:</strong>{" "}
          <span
            data-testid="in-view"
            className={
              inView ? "text-green-600 font-bold" : "text-red-500 font-bold"
            }
          >
            {inView ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Actually Observed:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {hasObserved ? "Yes" : "No (using initial value)"}
          </span>
        </div>
      </div>

      <div
        ref={ref}
        data-testid="initial-target"
        style={{
          height: "80px",
          background: inView
            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          transition: "all 0.3s ease",
        }}
      >
        {inView ? "👁️ In View" : "❌ Not In View"}
      </div>

      <div className={storyTheme.infoBox + " mt-4"}>
        <p className={storyTheme.infoText}>
          💡 When initialIsIntersecting is true, it displays "In View"
          immediately on first render. This is useful for controlling initial
          state in server-side rendering.
        </p>
      </div>
    </>
  );
}

// ============ 7. OnChange Callback Demo ============
function OnChangeDemo() {
  const [logs, setLogs] = useState<
    Array<{ time: string; inView: boolean; ratio: number }>
  >([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { ref, inView, entry } = useIntersectionObserver({
    threshold: [0, 0.5, 1.0],
    onChange: (entry, inView) => {
      setLogs((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          inView,
          ratio: Math.round(entry.intersectionRatio * 100),
        },
        ...prev.slice(0, 9), // Keep last 10 logs
      ]);
    },
  });

  // Scroll to top on mount to ensure target is out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>OnChange Callback</h2>
      <p className={storyTheme.subtitle}>
        Get notified whenever the intersection state changes via the onChange
        callback.
        <br />
        Useful for sending analytics events or state synchronization.
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Current State:</strong>{" "}
          <span
            data-testid="current-state"
            className={
              inView ? "text-green-600 font-bold" : "text-red-500 font-bold"
            }
          >
            {inView ? "In View" : "Out of View"}
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        data-testid="onchange-scroll-container"
        style={{
          height: "180px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <div style={{ height: "200px" }} />

        <div
          ref={ref}
          data-testid="onchange-target"
          style={{
            height: "80px",
            background: inView
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            transition: "all 0.3s ease",
          }}
        >
          Scroll to generate logs
        </div>

        <div style={{ height: "100px" }} />
      </div>

      {/* Event Log */}
      <div className={storyTheme.card + " mt-5"}>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          📋 Event Logs
        </h3>
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">No logs yet...</p>
        ) : (
          <ul className="list-none p-0 m-0 max-h-40 overflow-auto">
            {logs.map((log, index) => (
              <li
                key={index}
                data-testid={`log-${index}`}
                className={`font-mono text-sm mb-1 p-2 rounded ${
                  log.inView
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                [{log.time}] inView: {log.inView ? "true" : "false"}, ratio:{" "}
                {log.ratio}%
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============ 8. Delay Demo ============
function DelayDemo() {
  const [delay, setDelay] = useState(500);
  const [key, setKey] = useState(0);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Delay</h2>
      <p className={storyTheme.subtitle}>
        The <code>delay</code> option delays the{" "}
        <strong>creation of the IntersectionObserver</strong>, not individual
        intersection events.
        <br />
        Once the observer is created, all intersection changes are detected
        immediately.
      </p>

      <div
        className={storyTheme.infoBox}
        style={{ marginBottom: "16px", fontSize: "0.85rem" }}
      >
        <strong>💡 How delay works:</strong>
        <ul style={{ margin: "8px 0 0 16px", paddingLeft: "0" }}>
          <li>
            • <strong>Before delay:</strong> No observation occurs (observer not
            yet created)
          </li>
          <li>
            • <strong>After delay:</strong> Observer is created and starts
            watching immediately
          </li>
          <li>
            • <strong>Use case:</strong> Prevent premature observations during
            fast scrolling or page load
          </li>
        </ul>
      </div>

      <div className={storyTheme.buttonGroupFull}>
        <button
          data-testid="delay-0"
          onClick={() => {
            setDelay(0);
            setKey((k) => k + 1);
          }}
          className={
            delay === 0 ? storyTheme.buttonPrimary : storyTheme.buttonNeutral
          }
        >
          0ms (immediate)
        </button>
        <button
          data-testid="delay-500"
          onClick={() => {
            setDelay(500);
            setKey((k) => k + 1);
          }}
          className={
            delay === 500 ? storyTheme.buttonPrimary : storyTheme.buttonNeutral
          }
        >
          500ms
        </button>
        <button
          data-testid="delay-1000"
          onClick={() => {
            setDelay(1000);
            setKey((k) => k + 1);
          }}
          className={
            delay === 1000 ? storyTheme.buttonPrimary : storyTheme.buttonNeutral
          }
        >
          1000ms
        </button>
      </div>

      <p
        style={{
          fontSize: "0.8rem",
          color: "#6b7280",
          marginBottom: "12px",
          textAlign: "center",
        }}
      >
        Click a button to reset and see the delay in action
      </p>

      <DelayChild key={key} delay={delay} />
    </div>
  );
}

function DelayChild({ delay }: { delay: number }) {
  const [observerCreated, setObserverCreated] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  // Track elapsed time until observer is created
  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setObserverCreated(false);

    if (delay === 0) {
      // For 0ms delay, observer is created immediately
      setObserverCreated(true);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(Math.min(elapsed, delay));

      if (elapsed >= delay) {
        setObserverCreated(true);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [delay]);

  const { ref, inView } = useIntersectionObserver({
    delay,
  });

  const progressPercent =
    delay > 0 ? Math.min((elapsedTime / delay) * 100, 100) : 100;

  return (
    <>
      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>delay:</strong>{" "}
          <span data-testid="delay-value" className={storyTheme.statValue}>
            {delay}ms
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Observer Status:</strong>{" "}
          <span
            data-testid="observer-status"
            className={
              observerCreated
                ? "text-green-600 font-bold"
                : "text-yellow-600 font-bold"
            }
          >
            {observerCreated
              ? "✅ Created & Observing"
              : `⏳ Creating in ${delay - elapsedTime}ms...`}
          </span>
        </div>
        {delay > 0 && !observerCreated && (
          <div style={{ marginTop: "8px" }}>
            <div
              style={{
                height: "8px",
                background: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  background: "linear-gradient(90deg, #f59e0b, #d97706)",
                  transition: "width 0.1s ease",
                }}
              />
            </div>
          </div>
        )}
        <div className={storyTheme.statLabel} style={{ marginTop: "8px" }}>
          <strong className={storyTheme.statText}>inView:</strong>{" "}
          <span
            data-testid="in-view"
            className={
              inView ? "text-green-600 font-bold" : "text-gray-500 font-bold"
            }
          >
            {observerCreated
              ? inView
                ? "true"
                : "false"
              : "N/A (observer not created yet)"}
          </span>
        </div>
      </div>

      <div
        ref={ref}
        data-testid="delay-target"
        style={{
          height: "80px",
          background: !observerCreated
            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            : inView
            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          transition: "all 0.3s ease",
        }}
      >
        {!observerCreated
          ? `⏳ Observer creates in ${delay - elapsedTime}ms...`
          : inView
          ? "👁️ In View (observing)"
          : "Not in View (observing)"}
      </div>

      <p
        style={{
          fontSize: "0.75rem",
          color: "#9ca3af",
          marginTop: "12px",
          textAlign: "center",
        }}
      >
        {observerCreated
          ? "Observer is active. Intersection changes are now detected immediately."
          : "Observer not yet created. No intersection detection during this period."}
      </p>
    </>
  );
}

// ============ 9. Custom Root Container Demo ============
function CustomRootDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useCustomRoot, setUseCustomRoot] = useState(true);

  const { ref, inView, entry } = useIntersectionObserver({
    root: useCustomRoot ? containerRef.current : null,
    rootMargin: "0px",
  });

  // Scroll to top on mount to ensure target is out of view initially
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Custom Root Container</h2>
      <p className={storyTheme.subtitle}>
        Use a custom scroll container instead of the browser viewport with the
        root option.
      </p>

      <div className={storyTheme.buttonGroupFull}>
        <button
          data-testid="use-viewport"
          onClick={() => {
            setUseCustomRoot(false);
            if (containerRef.current) {
              containerRef.current.scrollTop = 0;
            }
          }}
          className={
            !useCustomRoot ? storyTheme.buttonPrimary : storyTheme.buttonNeutral
          }
        >
          Browser Viewport
        </button>
        <button
          data-testid="use-custom"
          onClick={() => {
            setUseCustomRoot(true);
            if (containerRef.current) {
              containerRef.current.scrollTop = 0;
            }
          }}
          className={
            useCustomRoot ? storyTheme.buttonPrimary : storyTheme.buttonNeutral
          }
        >
          Custom Container
        </button>
      </div>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>root:</strong>{" "}
          <span data-testid="root-type" className={storyTheme.statValue}>
            {useCustomRoot ? "Custom Container" : "Browser Viewport (null)"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>inView:</strong>{" "}
          <span
            data-testid="in-view"
            className={
              inView ? "text-green-600 font-bold" : "text-red-500 font-bold"
            }
          >
            {inView ? "true" : "false"}
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        data-testid="custom-container"
        style={{
          height: "200px",
          overflowY: "auto",
          border: useCustomRoot ? "3px solid #6366f1" : "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          transition: "border-color 0.3s ease",
        }}
      >
        <div
          style={{
            height: "250px",
            background: "#f3f4f6",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            border: "2px dashed #d1d5db",
          }}
        >
          ⬇️ Scroll down to see target element
        </div>

        <div
          ref={ref}
          data-testid="custom-root-target"
          style={{
            height: "120px",
            background: inView
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            transition: "all 0.3s ease",
          }}
        >
          {inView ? "👁️ Visible in Container!" : "👻 Not Visible in Container"}
        </div>

        <div
          style={{
            height: "200px",
            background: "#f3f4f6",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "16px",
            border: "2px dashed #d1d5db",
          }}
        >
          ⬆️ Scroll up
        </div>
      </div>

      {useCustomRoot && (
        <div className={storyTheme.infoBox + " mt-4"}>
          <p className={storyTheme.infoText}>
            💡 The purple border indicates the current root container.
            Intersection is detected only when scrolling within this container.
          </p>
        </div>
      )}
    </div>
  );
}

// ============ 10. Entry Details Demo ============
function EntryDetailsDemo() {
  const { ref, inView, entry } = useIntersectionObserver({
    threshold: [0, 0.25, 0.5, 0.75, 1.0],
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on mount to ensure target is out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Entry Details</h2>
      <p className={storyTheme.subtitle}>
        View all detailed information provided by the entry object.
      </p>

      <div
        ref={scrollContainerRef}
        style={{
          height: "200px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ height: "220px" }} />

        <div
          ref={ref}
          data-testid="entry-target"
          style={{
            height: "100px",
            background: inView
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "1.2rem",
            transition: "all 0.3s ease",
          }}
        >
          {entry
            ? `${Math.round(entry.intersectionRatio * 100)}% Visible`
            : "Waiting..."}
        </div>

        <div style={{ height: "120px" }} />
      </div>

      <div className={storyTheme.card}>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          📊 Entry Properties
        </h3>

        <div className="space-y-2">
          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>isIntersecting:</strong>{" "}
            <span
              data-testid="is-intersecting"
              className={
                entry?.isIntersecting
                  ? "text-green-600 font-bold"
                  : "text-red-500 font-bold"
              }
            >
              {entry?.isIntersecting ? "true" : "false"}
            </span>
          </div>

          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>intersectionRatio:</strong>{" "}
            <span
              data-testid="intersection-ratio"
              className={storyTheme.statValue}
            >
              {entry ? `${(entry.intersectionRatio * 100).toFixed(1)}%` : "N/A"}
            </span>
          </div>

          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>time:</strong>{" "}
            <span data-testid="time" className={storyTheme.statTextSecondary}>
              {entry ? `${entry.time.toFixed(2)}ms` : "N/A"}
            </span>
          </div>

          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>boundingClientRect:</strong>{" "}
            <span
              data-testid="bounding-rect"
              className="text-xs font-mono text-gray-600"
            >
              {entry
                ? `{top: ${Math.round(
                    entry.boundingClientRect.top
                  )}, left: ${Math.round(
                    entry.boundingClientRect.left
                  )}, width: ${Math.round(
                    entry.boundingClientRect.width
                  )}, height: ${Math.round(entry.boundingClientRect.height)}}`
                : "N/A"}
            </span>
          </div>

          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>intersectionRect:</strong>{" "}
            <span
              data-testid="intersection-rect"
              className="text-xs font-mono text-gray-600"
            >
              {entry
                ? `{width: ${Math.round(
                    entry.intersectionRect.width
                  )}, height: ${Math.round(entry.intersectionRect.height)}}`
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ REAL-WORLD EXAMPLES ============

// ============ 11. Lazy Loading Image Demo ============
function LazyLoadingDemo() {
  const images = [
    {
      id: 1,
      src: "https://picsum.photos/seed/1/400/300",
      alt: "Random image 1",
    },
    {
      id: 2,
      src: "https://picsum.photos/seed/2/400/300",
      alt: "Random image 2",
    },
    {
      id: 3,
      src: "https://picsum.photos/seed/3/400/300",
      alt: "Random image 3",
    },
    {
      id: 4,
      src: "https://picsum.photos/seed/4/400/300",
      alt: "Random image 4",
    },
    {
      id: 5,
      src: "https://picsum.photos/seed/5/400/300",
      alt: "Random image 5",
    },
  ];
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on mount to ensure images are out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>🖼️ Lazy Loading Images</h2>
      <p className={storyTheme.subtitle}>
        Images load only when they enter the viewport.
        <br />
        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
          triggerOnce: true
        </code>{" "}
        loads them only once.
      </p>

      <div
        ref={scrollContainerRef}
        style={{
          height: "400px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        {images.map((image) => (
          <LazyImage key={image.id} src={image.src} alt={image.alt} />
        ))}
      </div>
    </div>
  );
}

function LazyImage({ src, alt }: { src: string; alt: string }) {
  const { ref, inView } = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: "50px",
  });

  const [loaded, setLoaded] = useState(false);

  return (
    <div
      ref={ref}
      style={{
        minHeight: "200px",
        marginBottom: "16px",
        borderRadius: "12px",
        overflow: "hidden",
        background: loaded
          ? "transparent"
          : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
        position: "relative",
      }}
    >
      {!inView && !loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
          }}
        >
          <span>📷 Scroll to load</span>
        </div>
      )}

      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        />
      )}

      {inView && !loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #e5e7eb",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============ 12. Infinite Scroll Demo ============
function InfiniteScrollDemo() {
  const [items, setItems] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { ref, inView } = useIntersectionObserver({
    threshold: 1.0,
    rootMargin: "100px",
  });

  useEffect(() => {
    if (inView && !loading && items.length < 30) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setItems((prev) => [
          ...prev,
          ...Array.from({ length: 5 }, (_, i) => prev.length + i + 1),
        ]);
        setLoading(false);
      }, 800);
    }
  }, [inView, loading, items.length]);

  // Scroll to top on mount to ensure sentinel is out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>♾️ Infinite Scroll</h2>
      <p className={storyTheme.subtitle}>
        Automatically loads more items when the sentinel element becomes
        visible.
        <br />
        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
          rootMargin: "100px"
        </code>{" "}
        preloads ahead of time.
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Loaded Items:</strong>{" "}
          <span data-testid="item-count" className={storyTheme.statValue}>
            {items.length}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Sentinel Status:</strong>{" "}
          <span
            data-testid="sentinel-status"
            className={inView ? "text-green-600 font-bold" : "text-gray-500"}
          >
            {inView ? "Visible (loading triggered)" : "Not visible"}
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        data-testid="infinite-scroll-container"
        style={{
          height: "300px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        {items.map((item) => (
          <div
            key={item}
            style={{
              padding: "16px",
              marginBottom: "8px",
              background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.875rem",
              }}
            >
              {item}
            </span>
            <span className="text-gray-700">Item #{item}</span>
          </div>
        ))}

        {/* Sentinel Element */}
        <div
          ref={ref}
          data-testid="sentinel"
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#9ca3af",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "3px solid #e5e7eb",
                  borderTopColor: "#6366f1",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span>Loading...</span>
            </div>
          ) : items.length >= 30 ? (
            <span>✅ All items loaded!</span>
          ) : (
            <span>⬇️ Scroll more to load</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ 13. Scroll Animation Demo ============
function ScrollAnimationDemo() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on mount to ensure animations are out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>✨ Scroll Animations</h2>
      <p className={storyTheme.subtitle}>
        Trigger animations when elements enter the viewport.
        <br />
        Check out various animation effects.
      </p>

      <div
        ref={scrollContainerRef}
        style={{
          height: "400px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <div
          style={{
            height: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="text-gray-400">⬇️ Scroll to see animations</span>
        </div>

        <AnimatedCard animation="fadeIn" delay={0}>
          <h3>📥 Fade In</h3>
          <p>Smooth fade-in effect</p>
        </AnimatedCard>

        <AnimatedCard animation="slideLeft" delay={100}>
          <h3>⬅️ Slide from Left</h3>
          <p>Slides in from the left</p>
        </AnimatedCard>

        <AnimatedCard animation="slideRight" delay={200}>
          <h3>➡️ Slide from Right</h3>
          <p>Slides in from the right</p>
        </AnimatedCard>

        <AnimatedCard animation="scaleUp" delay={300}>
          <h3>📈 Scale Up</h3>
          <p>Grows from small to full size</p>
        </AnimatedCard>

        <AnimatedCard animation="slideUp" delay={400}>
          <h3>⬆️ Slide Up</h3>
          <p>Slides up from bottom</p>
        </AnimatedCard>

        <div style={{ height: "100px" }} />
      </div>
    </div>
  );
}

function AnimatedCard({
  animation,
  delay,
  children,
}: {
  animation: "fadeIn" | "slideLeft" | "slideRight" | "scaleUp" | "slideUp";
  delay: number;
  children: React.ReactNode;
}) {
  const { ref, inView } = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.3,
  });

  const getAnimationStyles = () => {
    const baseStyles = {
      opacity: inView ? 1 : 0,
      transition: `all 0.6s ease ${delay}ms`,
    };

    switch (animation) {
      case "fadeIn":
        return baseStyles;
      case "slideLeft":
        return {
          ...baseStyles,
          transform: inView ? "translateX(0)" : "translateX(-50px)",
        };
      case "slideRight":
        return {
          ...baseStyles,
          transform: inView ? "translateX(0)" : "translateX(50px)",
        };
      case "scaleUp":
        return { ...baseStyles, transform: inView ? "scale(1)" : "scale(0.8)" };
      case "slideUp":
        return {
          ...baseStyles,
          transform: inView ? "translateY(0)" : "translateY(30px)",
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div
      ref={ref}
      style={{
        padding: "20px",
        marginBottom: "16px",
        background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
        borderRadius: "12px",
        ...getAnimationStyles(),
      }}
    >
      {children}
    </div>
  );
}

// ============ 14. Scroll Progress Demo ============
function ScrollProgressDemo() {
  const [progress, setProgress] = useState(0);
  const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { ref, entry, inView } = useIntersectionObserver({
    threshold: thresholds,
    onChange: (entry) => {
      setProgress(Math.round(entry.intersectionRatio * 100));
    },
  });

  // Scroll to top on mount to ensure target is out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>📊 Scroll Progress Tracking</h2>
      <p className={storyTheme.subtitle}>
        Track scroll progress using multiple thresholds.
        <br />
        Useful for reading progress indicators, video autoplay, etc.
      </p>

      {/* Fixed progress bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          right: 0,
          height: "8px",
          background: "#e5e7eb",
          borderRadius: "4px",
          marginBottom: "20px",
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        <div
          data-testid="progress-bar"
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
            transition: "width 0.1s ease",
          }}
        />
      </div>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Progress:</strong>{" "}
          <span
            data-testid="progress-value"
            className={storyTheme.statValue}
            style={{ fontSize: "1.5rem" }}
          >
            {progress}%
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        style={{
          height: "300px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <div style={{ height: "300px" }} />

        <div
          ref={ref}
          data-testid="progress-target"
          style={{
            height: "400px",
            background: `linear-gradient(180deg, 
              hsl(260, 80%, ${50 + progress * 0.3}%) 0%, 
              hsl(${260 + progress}, 80%, 60%) 100%)`,
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            transition: "background 0.1s ease",
          }}
        >
          <span style={{ fontSize: "4rem", fontWeight: "bold" }}>
            {progress}%
          </span>
          <span style={{ fontSize: "1rem", opacity: 0.8, marginTop: "8px" }}>
            Element is {progress}% visible
          </span>
        </div>

        <div style={{ height: "200px" }} />
      </div>
    </div>
  );
}

// ============ 15. Section Navigation Demo ============
function SectionNavigationDemo() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sections = ["Intro", "Features", "Pricing", "FAQ", "Contact"];
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on mount to ensure sections are out of view initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>🧭 Section Navigation</h2>
      <p className={storyTheme.subtitle}>
        Automatically detect the visible section and highlight the navigation.
      </p>

      {/* Navigation */}
      <div
        style={{
          position: "sticky",
          top: 0,
          display: "flex",
          gap: "8px",
          padding: "12px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          zIndex: 10,
          flexWrap: "wrap",
        }}
      >
        {sections.map((section) => (
          <button
            key={section}
            data-testid={`nav-${section}`}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.2s ease",
              background:
                activeSection === section
                  ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                  : "#f3f4f6",
              color: activeSection === section ? "white" : "#6b7280",
            }}
          >
            {section}
          </button>
        ))}
      </div>

      <div
        ref={scrollContainerRef}
        style={{
          height: "300px",
          overflowY: "auto",
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        {sections.map((section, index) => (
          <SectionItem
            key={section}
            name={section}
            index={index}
            onVisible={() => setActiveSection(section)}
          />
        ))}
      </div>
    </div>
  );
}

function SectionItem({
  name,
  index,
  onVisible,
}: {
  name: string;
  index: number;
  onVisible: () => void;
}) {
  const { ref, inView } = useIntersectionObserver({
    threshold: 0.6,
    onChange: (_, inView) => {
      if (inView) onVisible();
    },
  });

  const colors = [
    ["#6366f1", "#a855f7"],
    ["#10b981", "#059669"],
    ["#f59e0b", "#d97706"],
    ["#ef4444", "#dc2626"],
    ["#ec4899", "#db2777"],
  ];

  return (
    <div
      ref={ref}
      data-testid={`section-${name}`}
      style={{
        height: "200px",
        marginBottom: "16px",
        background: `linear-gradient(135deg, ${colors[index][0]} 0%, ${colors[index][1]} 100%)`,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "1.5rem",
        fontWeight: "bold",
        opacity: inView ? 1 : 0.5,
        transform: inView ? "scale(1)" : "scale(0.98)",
        transition: "all 0.3s ease",
      }}
    >
      📌 {name} Section
    </div>
  );
}

// ============ Meta & Stories ============
const meta = {
  title: "Hooks/useIntersectionObserver",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
\`useIntersectionObserver\` is a React hook that efficiently detects element visibility in the viewport using the Intersection Observer API.
`,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============ Basic Props Stories ============
export const BasicUsage: Story = {
  render: () => <BasicUsageDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "The most basic usage. Connect the ref to an element to check visibility with the `inView` state.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function MyComponent() {
  const { ref, inView, entry } = useIntersectionObserver();
  
  return (
    <div ref={ref}>
      {inView ? 'Visible!' : 'Not visible'}
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

    // 1. Check initial state - element should not be in view
    const scrollContainer = canvas.getByTestId("scroll-container");
    const inViewIndicator = canvas.getByTestId("in-view");

    await waitFor(async () => {
      await expect(inViewIndicator).toHaveTextContent("false");
    });

    // 2. Scroll down to make element visible
    scrollTo(scrollContainer, 400);
    await waitForIntersection();

    await waitFor(async () => {
      await expect(inViewIndicator).toHaveTextContent("true");
    });

    // 3. Verify target element shows "Visible!" text
    const targetElement = canvas.getByTestId("target-element");
    await expect(targetElement).toHaveTextContent("Visible!");

    // 4. Scroll back up - element should be out of view
    scrollTo(scrollContainer, 0);
    await waitForIntersection();

    await waitFor(async () => {
      await expect(inViewIndicator).toHaveTextContent("false");
    });
  },
};

export const Threshold: Story = {
  render: () => <ThresholdDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Use the `threshold` option to set callbacks based on visibility ratio. Specify multiple values in an array to trigger callbacks at each value.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

// Single threshold
const { ref, inView } = useIntersectionObserver({
  threshold: 0.5 // Trigger when 50% visible
});

// Multiple thresholds
const { ref, entry } = useIntersectionObserver({
  threshold: [0, 0.25, 0.5, 0.75, 1.0],
  onChange: (entry) => {
    console.log(\`Visibility: \${entry.intersectionRatio * 100}%\`);
  }
});`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const scrollContainer = canvas.getByTestId("threshold-scroll-container");
    const visibility = canvas.getByTestId("visibility");
    const progressBar = canvas.getByTestId("progress-bar");

    // 1. Initial state - 0% visibility
    await waitFor(async () => {
      await expect(visibility).toHaveTextContent("0%");
    });

    // 2. Scroll to show partial visibility
    scrollTo(scrollContainer, 250);
    await waitForIntersection();

    await waitFor(async () => {
      // Should show some visibility percentage
      const text = visibility.textContent || "";
      const percentage = parseInt(text.replace("%", ""), 10);
      await expect(percentage).toBeGreaterThan(0);
    });

    // 3. Verify progress bar width changes
    await waitFor(async () => {
      const width = progressBar.style.width;
      await expect(width).not.toBe("0%");
    });

    // 4. Scroll more for higher visibility
    scrollTo(scrollContainer, 350);
    await waitForIntersection();

    await waitFor(async () => {
      const text = visibility.textContent || "";
      const percentage = parseInt(text.replace("%", ""), 10);
      await expect(percentage).toBeGreaterThan(50);
    });
  },
};

export const RootMargin: Story = {
  render: () => <RootMarginDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Use `rootMargin` to expand or shrink the root element's boundaries. The format follows CSS margin syntax (top right bottom left). Useful for preloading or creating stricter detection zones.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

// Positive rootMargin: Expand observation area
// "100px 0px" = expand 100px top/bottom, 0px left/right
// Triggers 100px BEFORE element enters viewport (useful for preloading)
const { ref } = useIntersectionObserver({
  rootMargin: "100px 0px"
});

// Negative rootMargin: Shrink observation area
// "-50px" = shrink 50px on all sides
// Element must be 50px MORE visible to trigger
const { ref } = useIntersectionObserver({
  rootMargin: "-50px"
});

// Examples with different formats:
// "50px" - all sides
// "50px 100px" - top/bottom left/right
// "10px 20px 30px 40px" - top right bottom left`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // 1. Verify initial rootMargin is 0px (default button selected)
    const defaultButton = canvas.getByTestId("margin-0");
    await expect(defaultButton).toHaveClass("from-indigo-500");

    // 2. Click +50px button and verify it's selected
    const expandButton = canvas.getByTestId("margin-50");
    await user.click(expandButton);

    await waitFor(async () => {
      await expect(expandButton).toHaveClass("from-indigo-500");
      await expect(defaultButton).not.toHaveClass("from-indigo-500");
    });

    // 3. Click -50px button and verify it's selected
    const shrinkButton = canvas.getByTestId("margin-minus50");
    await user.click(shrinkButton);

    await waitFor(async () => {
      await expect(shrinkButton).toHaveClass("from-indigo-500");
      await expect(expandButton).not.toHaveClass("from-indigo-500");
    });
  },
};

export const TriggerOnce: Story = {
  render: () => <TriggerOnceDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "When set to `triggerOnce: true`, the element stops being observed after being visible once. Perfect for lazy loading.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

// Trigger only once (suitable for lazy loading)
const { ref, inView } = useIntersectionObserver({
  triggerOnce: true,
  threshold: 0.1
});

return (
  <div ref={ref}>
    {inView && <img src={imageSrc} />}
  </div>
);`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    const scrollContainer = canvas.getByTestId("trigger-scroll-container");
    const triggerCount = canvas.getByTestId("trigger-count");

    // 1. Verify initial state - triggerOnce: true, count: 0
    await waitFor(async () => {
      await expect(triggerCount).toHaveTextContent("0");
    });

    // 2. Scroll down to trigger - count should become 1
    scrollTo(scrollContainer, 300);
    await waitForIntersection();

    await waitFor(async () => {
      await expect(triggerCount).toHaveTextContent("1");
    });

    // 3. Scroll back and forth - count should remain 1 (triggerOnce: true)
    scrollTo(scrollContainer, 0);
    await waitForIntersection();
    scrollTo(scrollContainer, 300);
    await waitForIntersection();

    await waitFor(async () => {
      await expect(triggerCount).toHaveTextContent("1");
    });

    // 4. Switch to triggerOnce: false and verify multiple triggers
    const triggerOffButton = canvas.getByTestId("trigger-once-off");
    await user.click(triggerOffButton);
    await waitForIntersection();

    const newScrollContainer = canvas.getByTestId("trigger-scroll-container");
    const newTriggerCount = canvas.getByTestId("trigger-count");

    // Scroll to trigger multiple times
    scrollTo(newScrollContainer, 300);
    await waitForIntersection();

    await waitFor(async () => {
      await expect(newTriggerCount).toHaveTextContent("1");
    });

    scrollTo(newScrollContainer, 0);
    await waitForIntersection();
    scrollTo(newScrollContainer, 300);
    await waitForIntersection();

    await waitFor(async () => {
      const count = parseInt(newTriggerCount.textContent || "0", 10);
      await expect(count).toBeGreaterThanOrEqual(2);
    });
  },
};

export const Enabled: Story = {
  render: () => <EnabledDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Dynamically enable/disable the observer with the `enabled` option.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

const [isLoading, setIsLoading] = useState(true);

// Disable observation while loading
const { ref, inView } = useIntersectionObserver({
  enabled: !isLoading
});`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    const scrollContainer = canvas.getByTestId("enabled-scroll-container");
    const inViewIndicator = canvas.getByTestId("in-view");
    const toggleButton = canvas.getByTestId("toggle-enabled");

    // 1. Initial state - enabled: true, scroll to make element visible
    scrollTo(scrollContainer, 300);
    await waitForIntersection();

    await waitFor(async () => {
      await expect(inViewIndicator).toHaveTextContent("true");
    });

    // 2. Scroll back - element should be out of view
    scrollTo(scrollContainer, 0);
    await waitForIntersection();

    await waitFor(async () => {
      await expect(inViewIndicator).toHaveTextContent("false");
    });

    // 3. Disable observation
    await user.click(toggleButton);
    await waitForIntersection();

    // 4. Scroll while disabled - inView should not change
    const currentInView = inViewIndicator.textContent;
    scrollTo(scrollContainer, 300);
    await waitForIntersection();

    // InView might remain same or change depending on implementation
    // The key test is that the button shows "Paused"
    await expect(toggleButton).toHaveTextContent("Paused");

    // 5. Re-enable and verify observation resumes
    await user.click(toggleButton);
    await waitForIntersection();

    await expect(toggleButton).toHaveTextContent("Observing");
  },
};

export const InitialIsIntersecting: Story = {
  render: () => <InitialIsIntersectingDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Set the initial intersection state for SSR/SSG environments with `initialIsIntersecting`.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

// Assume above-the-fold content is initially visible
const { ref, inView } = useIntersectionObserver({
  initialIsIntersecting: true
});

// On SSR, inView will be true on first render`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // 1. Default state - initialIsIntersecting: false
    const inViewIndicator = canvas.getByTestId("in-view");
    const initialValue = canvas.getByTestId("initial-value");

    await waitFor(async () => {
      await expect(initialValue).toHaveTextContent("false");
    });

    // 2. Click "Initial: true" button
    const initialTrueButton = canvas.getByTestId("initial-true");
    await user.click(initialTrueButton);
    await waitForIntersection();

    // 3. Verify initial value changed and inView reflects it
    await waitFor(async () => {
      const newInitialValue = canvas.getByTestId("initial-value");
      await expect(newInitialValue).toHaveTextContent("true");
    });

    await waitFor(async () => {
      const newInView = canvas.getByTestId("in-view");
      await expect(newInView).toHaveTextContent("true");
    });

    // 4. Switch back to false
    const initialFalseButton = canvas.getByTestId("initial-false");
    await user.click(initialFalseButton);
    await waitForIntersection();

    await waitFor(async () => {
      const finalInitialValue = canvas.getByTestId("initial-value");
      await expect(finalInitialValue).toHaveTextContent("false");
    });
  },
};

export const OnChange: Story = {
  render: () => <OnChangeDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Detect intersection state changes with the `onChange` callback, useful for analytics and more.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

const { ref } = useIntersectionObserver({
  threshold: [0, 0.5, 1.0],
  onChange: (entry, inView) => {
    if (inView) {
      analytics.track('element_viewed', {
        ratio: entry.intersectionRatio
      });
    }
  }
});`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const scrollContainer = canvas.getByTestId("onchange-scroll-container");

    // 1. Initial state - no logs
    await waitFor(async () => {
      const noLogs = canvas.queryByText("No logs yet...");
      // Might have logs from initial render, so just verify container exists
      await expect(scrollContainer).toBeInTheDocument();
    });

    // 2. Scroll to trigger onChange
    scrollTo(scrollContainer, 250);
    await waitForIntersection();

    // 3. Verify logs are created
    await waitFor(async () => {
      const firstLog = canvas.queryByTestId("log-0");
      await expect(firstLog).toBeInTheDocument();
    });

    // 4. Scroll out and back to generate more logs
    scrollTo(scrollContainer, 0);
    await waitForIntersection();
    scrollTo(scrollContainer, 250);
    await waitForIntersection();

    // 5. Verify multiple logs exist
    await waitFor(async () => {
      const logs = canvas.queryAllByTestId(/^log-/);
      await expect(logs.length).toBeGreaterThanOrEqual(2);
    });
  },
};

export const Delay: Story = {
  render: () => <DelayDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Delay the creation of IntersectionObserver with the `delay` option. Note: This delays when the observer is **created**, not individual intersection events. Once the observer is active, all intersection changes are detected immediately.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

// Delay observer CREATION by 500ms
// Use case: Prevent premature observations during fast scrolling
const { ref, inView } = useIntersectionObserver({
  delay: 500
});

// How it works:
// 1. Component mounts → observer NOT created yet
// 2. After 500ms → observer is created and starts observing
// 3. From this point on, all intersection changes are immediate

// This is useful for:
// - Preventing content flashing during fast page load
// - Debouncing initial observations
// - Waiting for layout to stabilize`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // 1. Click 0ms delay button - observer should be created immediately
    const delay0Button = canvas.getByTestId("delay-0");
    await user.click(delay0Button);

    await waitFor(async () => {
      const observerStatus = canvas.getByTestId("observer-status");
      await expect(observerStatus).toHaveTextContent("Created");
    });

    // 2. Click 1000ms delay button
    const delay1000Button = canvas.getByTestId("delay-1000");
    await user.click(delay1000Button);

    // Initially should show "Creating..."
    await waitFor(async () => {
      const observerStatus = canvas.getByTestId("observer-status");
      await expect(observerStatus).toHaveTextContent("Creating");
    });

    // Wait for delay to complete
    await new Promise((r) => setTimeout(r, 1100));

    // After delay, should show "Created"
    await waitFor(async () => {
      const observerStatus = canvas.getByTestId("observer-status");
      await expect(observerStatus).toHaveTextContent("Created");
    });
  },
};

export const CustomRootContainer: Story = {
  render: () => <CustomRootDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Use a custom scroll container instead of the browser viewport with the `root` option.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";
import { useRef } from "react";

function ScrollContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { ref, inView } = useIntersectionObserver({
    root: containerRef.current,
    rootMargin: "0px"
  });

  return (
    <div ref={containerRef} style={{ overflow: 'auto', height: 400 }}>
      <div style={{ height: 1000 }}>
        <div ref={ref}>
          {inView ? 'Visible in container' : 'Not visible'}
        </div>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};

export const EntryDetails: Story = {
  render: () => <EntryDetailsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "View all detailed information provided by the `entry` object. The entry only updates when threshold boundaries are crossed, not on every scroll event.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

const { ref, entry } = useIntersectionObserver({
  // Multiple thresholds = more granular updates
  threshold: [0, 0.25, 0.5, 0.75, 1.0]
});

// Entry object properties (only available after first intersection)
if (entry) {
  // Core properties for visibility detection
  entry.isIntersecting;     // boolean - is element visible?
  entry.intersectionRatio;  // 0-1 - how much is visible?
  
  // Geometry information
  entry.boundingClientRect; // target element's bounding box
  entry.intersectionRect;   // visible portion's bounding box
  entry.rootBounds;         // root element's bounding box
  
  // Metadata (rarely used in practice)
  entry.time;   // DOMHighResTimeStamp since page load
  entry.target; // the observed DOM element
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};

// ============ Real-World Example Stories ============
export const LazyLoadingImages: Story = {
  render: () => <LazyLoadingDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "**Real-world example:** Load images only when they enter the viewport to improve initial page load speed.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function LazyImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  
  const { ref, inView } = useIntersectionObserver({
    triggerOnce: true,  // Stop observing after load
    threshold: 0.1,     // Start loading when 10% visible
    rootMargin: "50px"  // Preload 50px ahead
  });

  return (
    <div ref={ref}>
      {inView ? (
        <img 
          src={src} 
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      ) : (
        <div className="placeholder" />
      )}
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};

export const InfiniteScroll: Story = {
  render: () => <InfiniteScrollDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "**Real-world example:** Automatically load the next page when the sentinel element becomes visible.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function InfiniteList() {
  const [items, setItems] = useState([...initialItems]);
  const [loading, setLoading] = useState(false);

  const { ref, inView } = useIntersectionObserver({
    threshold: 1.0,
    rootMargin: "100px"  // Preload 100px ahead
  });

  useEffect(() => {
    if (inView && !loading) {
      setLoading(true);
      fetchMoreItems().then(newItems => {
        setItems(prev => [...prev, ...newItems]);
        setLoading(false);
      });
    }
  }, [inView, loading]);

  return (
    <div>
      {items.map(item => <Item key={item.id} {...item} />)}
      
      {/* Sentinel Element */}
      <div ref={ref}>
        {loading && <Spinner />}
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

    const scrollContainer = canvas.getByTestId("infinite-scroll-container");
    const itemCount = canvas.getByTestId("item-count");

    // 1. Initial state - 5 items
    await waitFor(async () => {
      await expect(itemCount).toHaveTextContent("5");
    });

    // 2. Scroll to bottom to trigger loading
    scrollTo(scrollContainer, scrollContainer.scrollHeight);
    await waitForIntersection();

    // 3. Wait for loading to complete (800ms simulated API call)
    await new Promise((r) => setTimeout(r, 1000));

    // 4. Verify more items were loaded
    await waitFor(async () => {
      const count = parseInt(itemCount.textContent || "0", 10);
      await expect(count).toBeGreaterThan(5);
    });

    // 5. Scroll again to load more
    scrollTo(scrollContainer, scrollContainer.scrollHeight);
    await waitForIntersection();
    await new Promise((r) => setTimeout(r, 1000));

    await waitFor(async () => {
      const count = parseInt(itemCount.textContent || "0", 10);
      await expect(count).toBeGreaterThan(10);
    });
  },
};

export const ScrollAnimations: Story = {
  render: () => <ScrollAnimationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "**Real-world example:** Trigger various animations when elements enter the viewport.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function AnimatedCard({ children }) {
  const { ref, inView } = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.3
  });

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.6s ease"
      }}
    >
      {children}
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};

export const ScrollProgress: Story = {
  render: () => <ScrollProgressDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "**Real-world example:** Precisely track scroll progress using multiple thresholds.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function ProgressTracker() {
  const [progress, setProgress] = useState(0);
  
  // 101 thresholds (0%, 1%, 2%, ... 100%)
  const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);

  const { ref } = useIntersectionObserver({
    threshold: thresholds,
    onChange: (entry) => {
      setProgress(Math.round(entry.intersectionRatio * 100));
    }
  });

  return (
    <>
      <div className="progress-bar" style={{ width: \`\${progress}%\` }} />
      <article ref={ref}>
        {/* Long content */}
      </article>
    </>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};

export const SectionNavigation: Story = {
  render: () => <SectionNavigationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "**Real-world example:** Automatically detect the visible section and highlight the navigation.",
      },
      source: {
        code: `import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function SectionNavigation() {
  const [activeSection, setActiveSection] = useState(null);

  return (
    <>
      <nav>
        {sections.map(section => (
          <button
            key={section.id}
            className={activeSection === section.id ? "active" : ""}
          >
            {section.name}
          </button>
        ))}
      </nav>

      {sections.map(section => (
        <Section
          key={section.id}
          id={section.id}
          onVisible={() => setActiveSection(section.id)}
        />
      ))}
    </>
  );
}

function Section({ id, onVisible }) {
  const { ref } = useIntersectionObserver({
    threshold: 0.6,  // Activate when 60% visible
    onChange: (_, inView) => {
      if (inView) onVisible();
    }
  });

  return <section ref={ref} id={id}>...</section>;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};

// Add keyframes for loading spinner
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
if (
  typeof document !== "undefined" &&
  !document.getElementById("intersection-observer-styles")
) {
  style.id = "intersection-observer-styles";
  document.head.appendChild(style);
}
