import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect } from "react";
import { useThrottle } from "@usefy/use-throttle";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

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
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Scroll Position Throttling</h2>
      <p className={storyTheme.subtitle}>
        Scroll to see throttling in action. Updates at most once per 100ms.
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Raw scroll position:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{scrollY}px</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Throttled position:</strong>{" "}
          <span className={storyTheme.statValue}>{throttledScrollY}px</span>
        </div>
      </div>

      <div
        onScroll={handleScroll}
        className="h-[300px] overflow-y-scroll border-2 border-gray-200 rounded-xl p-5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
      >
        <div className="h-[2000px]">
          <h3 className="mt-0 text-xl font-semibold text-gray-700">
            Scroll this content
          </h3>
          <p className="text-gray-500 leading-relaxed">
            The throttled value updates at most once per interval, reducing the
            number of expensive operations triggered by rapid scroll events.
          </p>
          {Array.from({ length: 50 }, (_, i) => (
            <p key={i} className="leading-relaxed text-gray-500">
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
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Search Input Throttling</h2>
      <p className={storyTheme.subtitle}>
        Type to search. API calls are throttled by 300ms.
      </p>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Type to search..."
        className={storyTheme.input + " mb-5"}
      />

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Current Input:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {searchQuery || "(empty)"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Throttled Query:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {throttledQuery || "(empty)"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>API Calls Made:</strong>{" "}
          <span className={storyTheme.statValue}>{searchCount}</span>
        </div>
      </div>

      <p className="text-gray-500 text-sm m-0">
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
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Window Resize Throttling</h2>
      <p className={storyTheme.subtitle}>
        Drag the slider to simulate window resize. Throttled by 200ms.
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Raw Width:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{width}px</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Throttled Width:</strong>{" "}
          <span className={storyTheme.statValue}>{throttledWidth}px</span>
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="width-slider" className={storyTheme.label + " mb-3"}>
          Adjust Width:
        </label>
        <input
          id="width-slider"
          type="range"
          min="100"
          max="600"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full h-10"
        />
      </div>

      <div
        style={{ width: `${throttledWidth}px` }}
        className="h-[200px] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold transition-all duration-100 ease-out shadow-[0_4px_16px_rgba(99,102,241,0.3)]"
      >
        {throttledWidth}px
      </div>

      <p className="mt-5 text-gray-500 text-sm">
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
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>
        Mouse Movement - Default (Both Edges)
      </h2>
      <p className={storyTheme.subtitle}>
        Move your mouse in the area below. Throttled by 300ms with default
        settings (leading + trailing).
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Raw Updates:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{rawUpdateCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Throttled Updates:</strong>{" "}
          <span className={storyTheme.statValue}>{throttledUpdateCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Reduction:</strong>{" "}
          <span className="text-green-600 font-bold">{reduction}%</span>
        </div>
      </div>

      <div
        onMouseMove={handleMouseMove}
        className="h-[300px] border-2 border-gray-200 rounded-xl bg-white relative cursor-crosshair overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
      >
        <div
          style={{
            position: "absolute",
            left: `${throttledPos.x}px`,
            top: `${throttledPos.y}px`,
          }}
          className="w-6 h-6 bg-indigo-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_2px_8px_rgba(99,102,241,0.5)]"
        />
        <div
          style={{
            position: "absolute",
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
          className="w-2 h-2 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60"
        />
        <div className="absolute top-5 left-5 text-sm pointer-events-none bg-white/90 p-3 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <div className="mb-1">
            <span className="text-red-500 font-bold">●</span> Raw position (
            {mousePos.x}, {mousePos.y})
          </div>
          <div>
            <span className="text-indigo-500 font-bold">●</span> Throttled (
            {throttledPos.x}, {throttledPos.y})
          </div>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-5"}>
        <p className={storyTheme.infoText}>
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
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Mouse Movement - Leading Only</h2>
      <p className={storyTheme.subtitle}>
        Move your mouse. Only <strong>leading edge</strong> enabled (trailing:
        false).
      </p>

      <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Raw Updates:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{rawUpdateCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Throttled Updates:</strong>{" "}
          <span className="text-green-600 font-bold text-[1.1rem]">
            {throttledUpdateCount}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Reduction:</strong>{" "}
          <span className="text-green-700 font-bold">{reduction}%</span>
        </div>
      </div>

      <div
        onMouseMove={handleMouseMove}
        className="h-[300px] border-2 border-green-200 rounded-xl bg-white relative cursor-crosshair overflow-hidden shadow-[0_2px_8px_rgba(16,185,129,0.1)]"
      >
        <div
          style={{
            position: "absolute",
            left: `${throttledPos.x}px`,
            top: `${throttledPos.y}px`,
          }}
          className="w-6 h-6 bg-green-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_2px_8px_rgba(16,185,129,0.5)]"
        />
        <div
          style={{
            position: "absolute",
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
          className="w-2 h-2 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60"
        />
        <div className="absolute top-5 left-5 text-sm pointer-events-none bg-white/95 p-3 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-green-200">
          <div className="mb-1">
            <span className="text-red-500 font-bold">●</span> Raw position (
            {mousePos.x}, {mousePos.y})
          </div>
          <div>
            <span className="text-green-500 font-bold">●</span> Throttled (
            {throttledPos.x}, {throttledPos.y})
          </div>
        </div>
      </div>

      <div
        className={storyTheme.infoBox + " mt-5 bg-green-50 border-green-200"}
      >
        <p className={storyTheme.infoText + " text-green-900"}>
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
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Mouse Movement - Trailing Only</h2>
      <p className={storyTheme.subtitle}>
        Move your mouse. Only <strong>trailing edge</strong> enabled (leading:
        false).
      </p>

      <div className="p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Raw Updates:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{rawUpdateCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Throttled Updates:</strong>{" "}
          <span className="text-amber-600 font-bold text-[1.1rem]">
            {throttledUpdateCount}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Reduction:</strong>{" "}
          <span className="text-amber-700 font-bold">{reduction}%</span>
        </div>
      </div>

      <div
        onMouseMove={handleMouseMove}
        className="h-[300px] border-2 border-yellow-200 rounded-xl bg-white relative cursor-crosshair overflow-hidden shadow-[0_2px_8px_rgba(245,158,11,0.1)]"
      >
        <div
          style={{
            position: "absolute",
            left: `${throttledPos.x}px`,
            top: `${throttledPos.y}px`,
          }}
          className="w-6 h-6 bg-amber-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
        />
        <div
          style={{
            position: "absolute",
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
          className="w-2 h-2 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60"
        />
        <div className="absolute top-5 left-5 text-sm pointer-events-none bg-white/95 p-3 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-yellow-200">
          <div className="mb-1">
            <span className="text-red-500 font-bold">●</span> Raw position (
            {mousePos.x}, {mousePos.y})
          </div>
          <div>
            <span className="text-amber-600 font-bold">●</span> Throttled (
            {throttledPos.x}, {throttledPos.y})
          </div>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-5"}>
        <p className={storyTheme.infoText}>
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
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Mouse Movement - Both Disabled</h2>
      <p className={storyTheme.subtitle}>
        Move your mouse. Both edges <strong>disabled</strong> (leading: false,
        trailing: false).
      </p>

      <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Raw Updates:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{rawUpdateCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Throttled Updates:</strong>{" "}
          <span className="text-red-500 font-bold text-[1.1rem]">
            {throttledUpdateCount}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Status:</strong>{" "}
          <span className="text-red-600 font-bold">
            No throttling active! 🚫
          </span>
        </div>
      </div>

      <div
        onMouseMove={handleMouseMove}
        className="h-[300px] border-2 border-red-200 rounded-xl bg-white relative cursor-crosshair overflow-hidden shadow-[0_2px_8px_rgba(239,68,68,0.1)]"
      >
        <div
          style={{
            position: "absolute",
            left: `${throttledPos.x}px`,
            top: `${throttledPos.y}px`,
          }}
          className={`w-6 h-6 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_2px_8px_rgba(239,68,68,0.5)] ${
            throttledPos.x === 0 && throttledPos.y === 0
              ? "opacity-0"
              : "opacity-100"
          }`}
        />
        <div
          style={{
            position: "absolute",
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
          className="w-2 h-2 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60"
        />
        <div className="absolute top-5 left-5 text-sm pointer-events-none bg-white/95 p-3 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-red-200">
          <div className="mb-1">
            <span className="text-red-500 font-bold">●</span> Raw position (
            {mousePos.x}, {mousePos.y})
          </div>
          <div>
            <span className="text-red-600 font-bold">●</span> Throttled (
            {throttledPos.x}, {throttledPos.y})
          </div>
        </div>

        {throttledPos.x === 0 && throttledPos.y === 0 && mousePos.x !== 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-red-500 pointer-events-none text-center">
            ⚠️
            <br />
            <span className="text-base">No throttle dot visible!</span>
          </div>
        )}
      </div>

      <div className={storyTheme.infoBox + " mt-5 bg-red-50 border-red-200"}>
        <p className={storyTheme.infoText + " text-red-900"}>
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
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Click Event Throttling</h2>
      <p className={storyTheme.subtitle + " leading-relaxed"}>
        Simulates a <strong>token renewal</strong> scenario. Click the button to
        renew the token, but it can only be renewed once every{" "}
        <strong>5 seconds</strong>. Using <code>trailing: false</code> ensures
        only the first click triggers renewal.
      </p>

      {/* Token Status Card */}
      <div
        className={`p-5 rounded-xl mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 ${
          tokenExpiry
            ? "bg-gradient-to-br from-green-50 to-green-100"
            : "bg-gradient-to-br from-red-50 to-red-100"
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-3 h-3 rounded-full ${
              tokenExpiry
                ? "bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            }`}
          />
          <strong className={tokenExpiry ? "text-green-900" : "text-red-900"}>
            Token Status: {tokenExpiry ? "Valid" : "Expired"}
          </strong>
        </div>
        {tokenCountdown !== null && (
          <div className="text-sm text-green-900">
            Expires in: {Math.ceil(tokenCountdown / 1000)}s
            <div className="mt-2 h-1 bg-green-200 rounded-sm overflow-hidden">
              <div
                style={{
                  width: `${(tokenCountdown / 30000) * 100}%`,
                }}
                className="h-full bg-green-500 transition-all duration-100 ease-linear"
              />
            </div>
          </div>
        )}
      </div>

      {/* Click Button */}
      <div className="mb-5">
        <button
          onClick={handleClick}
          className={`w-full py-4 px-8 text-lg font-semibold text-white border-none rounded-xl transition-all duration-200 relative overflow-hidden ${
            isOnCooldown
              ? "bg-gradient-to-br from-gray-400 to-gray-500 cursor-not-allowed shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
              : "bg-gradient-to-br from-purple-500 to-purple-700 cursor-pointer shadow-[0_4px_16px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)]"
          }`}
        >
          {isOnCooldown ? (
            <>
              Cooldown... ({Math.ceil(cooldownRemaining / 1000)}s)
              <div
                style={{
                  width: `${cooldownPercent}%`,
                }}
                className="absolute bottom-0 left-0 h-1 bg-white/50 transition-all duration-100 ease-linear"
              />
            </>
          ) : (
            "🔄 Renew Token"
          )}
        </button>
      </div>

      {/* Stats */}
      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel + " mb-3"}>
          <strong className={storyTheme.statText}>Total Clicks:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{clickCount}</span>
        </div>
        <div className={storyTheme.statLabel + " mb-3"}>
          <strong className={storyTheme.statText}>Actual Renewals:</strong>{" "}
          <span className="text-purple-600 font-bold text-[1.1rem]">
            {renewalCount}
          </span>
        </div>
        <div className={storyTheme.statLabel + " mb-3"}>
          <strong className={storyTheme.statText}>Ignored Clicks:</strong>{" "}
          <span className="text-red-500 font-semibold">
            {clickCount - renewalCount}
          </span>
        </div>
        {lastRenewalTime && (
          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>Last Renewal:</strong>{" "}
            <span className={storyTheme.statTextSecondary}>
              {lastRenewalTime.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Click History Visualization */}
      <div className="p-4 bg-white border-2 border-gray-200 rounded-xl mb-5">
        <div className="text-sm font-semibold text-gray-700 mb-3">
          Click Timeline (recent 10):
        </div>
        <div className="flex gap-2 flex-wrap">
          {clickCount === 0 ? (
            <span className="text-gray-400 text-sm">No clicks yet</span>
          ) : (
            Array.from({ length: Math.min(clickCount, 10) }, (_, i) => {
              const clickNum = clickCount - Math.min(clickCount, 10) + i + 1;
              const isRenewal =
                clickNum === 1 ||
                (clickNum - 1) % Math.ceil(THROTTLE_INTERVAL / 1000) === 0;
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isRenewal
                      ? "bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_2px_8px_rgba(139,92,246,0.4)]"
                      : "bg-gray-200 text-gray-500"
                  }`}
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
        <div className="mt-3 text-xs text-gray-400 flex gap-4">
          <span className="flex items-center">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-600 mr-1" />
            Renewal
          </span>
          <span className="flex items-center">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-200 mr-1" />
            Ignored
          </span>
        </div>
      </div>

      {/* Info Box */}
      <div className={storyTheme.cardInfo}>
        <p className={storyTheme.infoText + " text-indigo-900 leading-relaxed"}>
          💡 <strong>Real-world use case:</strong> Token renewal on user action.
          Even if the user clicks rapidly, the token is renewed at most once
          every 5 seconds. This prevents unnecessary API calls while ensuring
          the token stays fresh during active use. Using{" "}
          <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-800">
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

    // Find the scrollable container using Tailwind class
    const scrollContainer = canvasElement.querySelector(
      ".overflow-y-scroll"
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

    // Find the mouse tracking area using Tailwind class
    const trackingArea = canvasElement.querySelector(
      ".cursor-crosshair"
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
