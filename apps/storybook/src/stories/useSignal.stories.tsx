import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useSignal } from "@usefy/use-signal";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Demo component for basic useSignal usage
 */
function SignalDemo({
  signalName = "demo-signal",
  title = "useSignal Demo",
}: {
  signalName?: string;
  title?: string;
}) {
  const { signal, emit, info } = useSignal(signalName);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (signal > 0) {
      setLogs((prev) => [
        ...prev.slice(-4),
        `Signal received: ${signal} at ${new Date().toLocaleTimeString()}`,
      ]);
    }
  }, [signal]);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>{title}</h2>
      <p className={storyTheme.subtitle}>
        Event-driven communication between components
      </p>

      {/* Signal Value Display */}
      <div className={storyTheme.gradientBox + " mb-6"}>
        <div
          className="text-6xl font-bold text-white text-center"
          data-testid="signal-value"
        >
          {signal}
        </div>
        <p className="text-white/80 text-center mt-2">Current Signal</p>
      </div>

      {/* Emit Button */}
      <div className="mb-6">
        <button
          onClick={emit}
          className={storyTheme.buttonPrimary + " w-full"}
          data-testid="emit-button"
        >
          Emit Signal
        </button>
      </div>

      {/* Info Display */}
      <div className={storyTheme.card + " mb-6"}>
        <h3 className="font-semibold text-gray-800 mb-3">Signal Info</h3>
        <div className="space-y-2 font-mono text-sm">
          <p>
            <span className={storyTheme.statLabel}>Name:</span>{" "}
            <span className={storyTheme.statValue} data-testid="info-name">
              {info.name}
            </span>
          </p>
          <p>
            <span className={storyTheme.statLabel}>Subscribers:</span>{" "}
            <span
              className={storyTheme.statValue}
              data-testid="info-subscribers"
            >
              {info.subscriberCount}
            </span>
          </p>
          <p>
            <span className={storyTheme.statLabel}>Emit Count:</span>{" "}
            <span className={storyTheme.statValue} data-testid="info-emitcount">
              {info.emitCount}
            </span>
          </p>
          <p>
            <span className={storyTheme.statLabel}>Last Emit:</span>{" "}
            <span className={storyTheme.statValue} data-testid="info-timestamp">
              {info.timestamp > 0
                ? new Date(info.timestamp).toLocaleTimeString()
                : "Never"}
            </span>
          </p>
        </div>
      </div>

      {/* Event Log */}
      <div className={storyTheme.cardInfo}>
        <h3 className="font-semibold text-gray-800 mb-2">Event Log</h3>
        <div
          className="font-mono text-sm bg-white/50 p-3 rounded-lg min-h-[100px]"
          data-testid="event-log"
        >
          {logs.length === 0 ? (
            <span className="text-gray-400">No events yet</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-indigo-700">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Demo component for multi-component synchronization
 */
function MultiSubscriberDemo() {
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Multi-Subscriber Demo</h2>
      <p className={storyTheme.subtitle}>
        Multiple components subscribing to the same signal
      </p>

      {/* Emitter Component */}
      <div className="mb-6">
        <SignalEmitter signalName="shared-signal" />
      </div>

      {/* Subscriber Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SignalSubscriber name="Subscriber A" signalName="shared-signal" />
        <SignalSubscriber name="Subscriber B" signalName="shared-signal" />
      </div>

      {/* Info Box */}
      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          <strong>How it works:</strong>
          <br />
          All components subscribe to the same signal name. When the emitter
          sends a signal, all subscribers receive it simultaneously.
        </p>
      </div>
    </div>
  );
}

function SignalEmitter({ signalName }: { signalName: string }) {
  const { emit, info } = useSignal(signalName);

  return (
    <div className={storyTheme.gradientBox}>
      <h3 className="text-white font-semibold text-center mb-4">
        Signal Emitter
      </h3>
      <button
        onClick={emit}
        className="w-full py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        data-testid="multi-emit-button"
      >
        Emit to {info.subscriberCount} subscribers
      </button>
    </div>
  );
}

function SignalSubscriber({
  name,
  signalName,
}: {
  name: string;
  signalName: string;
}) {
  const { signal } = useSignal(signalName);
  const [received, setReceived] = useState(0);

  useEffect(() => {
    if (signal > 0) {
      setReceived((prev) => prev + 1);
    }
  }, [signal]);

  return (
    <div
      className={storyTheme.card}
      data-testid={`subscriber-${name.toLowerCase().replace(" ", "-")}`}
    >
      <h4 className="font-semibold text-gray-800 mb-2">{name}</h4>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Signal:</span>
        <span
          className="text-2xl font-bold text-indigo-600"
          data-testid={`signal-${name.toLowerCase().replace(" ", "-")}`}
        >
          {signal}
        </span>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-gray-600">Received:</span>
        <span className="text-lg font-semibold text-green-600">{received}</span>
      </div>
    </div>
  );
}

/**
 * Demo component for options
 */
function OptionsDemo() {
  const [emitOnMountEnabled, setEmitOnMountEnabled] = useState(false);
  const [debounceEnabled, setDebounceEnabled] = useState(false);
  const [onEmitCallback, setOnEmitCallback] = useState<string[]>([]);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Options Demo</h2>
      <p className={storyTheme.subtitle}>
        Explore different useSignal options
      </p>

      {/* emitOnMount Option */}
      <div className={storyTheme.card + " mb-6"}>
        <h3 className="font-semibold text-gray-800 mb-3">emitOnMount Option</h3>
        <p className="text-sm text-gray-600 mb-4">
          Automatically emit when component mounts
        </p>
        <button
          onClick={() => setEmitOnMountEnabled((prev) => !prev)}
          className={
            emitOnMountEnabled
              ? storyTheme.buttonSuccess
              : storyTheme.buttonNeutral
          }
          data-testid="toggle-emit-on-mount"
        >
          {emitOnMountEnabled ? "Hide Component" : "Show Component"}
        </button>
        {emitOnMountEnabled && (
          <div className="mt-4">
            <EmitOnMountComponent />
          </div>
        )}
      </div>

      {/* onEmit Callback */}
      <div className={storyTheme.card + " mb-6"}>
        <h3 className="font-semibold text-gray-800 mb-3">onEmit Callback</h3>
        <p className="text-sm text-gray-600 mb-4">
          Execute callback when emit is called
        </p>
        <OnEmitCallbackComponent
          onLog={(msg) => setOnEmitCallback((prev) => [...prev.slice(-4), msg])}
        />
        <div
          className="mt-4 font-mono text-sm bg-white p-3 rounded-lg"
          data-testid="callback-log"
        >
          {onEmitCallback.length === 0 ? (
            <span className="text-gray-400">No callbacks yet</span>
          ) : (
            onEmitCallback.map((log, i) => (
              <div key={i} className="text-green-700">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* debounce Option */}
      <div className={storyTheme.card}>
        <h3 className="font-semibold text-gray-800 mb-3">debounce Option</h3>
        <p className="text-sm text-gray-600 mb-4">
          Debounce rapid emit calls (500ms)
        </p>
        <button
          onClick={() => setDebounceEnabled((prev) => !prev)}
          className={
            debounceEnabled
              ? storyTheme.buttonSuccess
              : storyTheme.buttonNeutral
          }
          data-testid="toggle-debounce"
        >
          {debounceEnabled ? "Debounce: ON" : "Debounce: OFF"}
        </button>
        <div className="mt-4">
          <DebounceComponent enabled={debounceEnabled} />
        </div>
      </div>
    </div>
  );
}

function EmitOnMountComponent() {
  const { signal, info } = useSignal("emit-on-mount-signal", {
    emitOnMount: true,
  });

  return (
    <div
      className="p-4 bg-green-50 rounded-lg border border-green-200"
      data-testid="emit-on-mount-component"
    >
      <p className="text-green-800">
        Component mounted and emitted! Signal: <strong>{signal}</strong>
      </p>
      <p className="text-sm text-green-600 mt-1">
        Emit count: {info.emitCount}
      </p>
    </div>
  );
}

function OnEmitCallbackComponent({ onLog }: { onLog: (msg: string) => void }) {
  const { emit } = useSignal("callback-signal", {
    onEmit: () => onLog(`Callback fired at ${new Date().toLocaleTimeString()}`),
  });

  return (
    <button
      onClick={emit}
      className={storyTheme.buttonPrimary}
      data-testid="callback-emit-button"
    >
      Emit with Callback
    </button>
  );
}

function DebounceComponent({ enabled }: { enabled: boolean }) {
  const { signal, emit, info } = useSignal("debounce-signal", {
    debounce: enabled ? 500 : undefined,
  });

  return (
    <div className="space-y-3">
      <button
        onClick={emit}
        className={storyTheme.buttonPrimary + " w-full"}
        data-testid="debounce-emit-button"
      >
        Emit (Click rapidly!)
      </button>
      <div className="flex justify-between text-sm">
        <span>Signal: {signal}</span>
        <span>Emit Count: {info.emitCount}</span>
      </div>
    </div>
  );
}

/**
 * Demo component for independent signals
 */
function IndependentSignalsDemo() {
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Independent Signals</h2>
      <p className={storyTheme.subtitle}>
        Different signal names are completely independent
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IndependentSignalCard
          name="Signal Alpha"
          signalName="alpha"
          color="blue"
        />
        <IndependentSignalCard
          name="Signal Beta"
          signalName="beta"
          color="green"
        />
      </div>

      {/* Info Box */}
      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          <strong>Note:</strong> Each signal name creates an independent
          channel. Emitting "alpha" doesn't affect "beta" and vice versa.
        </p>
      </div>
    </div>
  );
}

function IndependentSignalCard({
  name,
  signalName,
  color,
}: {
  name: string;
  signalName: string;
  color: "blue" | "green";
}) {
  const { signal, emit, info } = useSignal(signalName);

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      button: "bg-blue-500 hover:bg-blue-600",
      text: "text-blue-600",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-300",
      button: "bg-green-500 hover:bg-green-600",
      text: "text-green-600",
    },
  };

  const classes = colorClasses[color];

  return (
    <div
      className={`p-5 rounded-xl border-2 ${classes.bg} ${classes.border}`}
      data-testid={`independent-${signalName}`}
    >
      <h3 className="font-semibold text-gray-800 mb-3">{name}</h3>

      <div
        className={`text-4xl font-bold text-center mb-4 ${classes.text}`}
        data-testid={`independent-value-${signalName}`}
      >
        {signal}
      </div>

      <button
        onClick={emit}
        className={`w-full py-2 text-white font-semibold rounded-lg ${classes.button} transition-colors`}
        data-testid={`independent-emit-${signalName}`}
      >
        Emit "{signalName}"
      </button>

      <p className="text-sm text-gray-500 mt-3 text-center">
        Subscribers: {info.subscriberCount}
      </p>
    </div>
  );
}

/**
 * Demo component for real-world use case - Dashboard Refresh
 */
function DashboardRefreshDemo() {
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Dashboard Refresh Pattern</h2>
      <p className={storyTheme.subtitle}>
        Real-world use case: Refresh multiple widgets simultaneously
      </p>

      {/* Refresh Button */}
      <RefreshButton />

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <DashboardWidget name="Sales Chart" />
        <DashboardWidget name="User Stats" />
        <DashboardWidget name="Recent Orders" />
        <DashboardWidget name="Inventory" />
      </div>
    </div>
  );
}

function RefreshButton() {
  const { emit, info } = useSignal("dashboard-refresh");

  return (
    <button
      onClick={emit}
      className={storyTheme.buttonPrimary + " w-full"}
      data-testid="refresh-dashboard"
    >
      Refresh Dashboard ({info.subscriberCount} widgets)
    </button>
  );
}

function DashboardWidget({ name }: { name: string }) {
  const { signal } = useSignal("dashboard-refresh");
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  useEffect(() => {
    if (signal > 0) {
      setLoading(true);
      // Simulate API call
      const timer = setTimeout(() => {
        setLoading(false);
        setLastRefresh(new Date().toLocaleTimeString());
      }, 500 + Math.random() * 500);
      return () => clearTimeout(timer);
    }
  }, [signal]);

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        loading
          ? "border-indigo-400 bg-indigo-50"
          : "border-gray-200 bg-white"
      }`}
      data-testid={`widget-${name.toLowerCase().replace(" ", "-")}`}
    >
      <h4 className="font-semibold text-gray-800 mb-2">{name}</h4>
      {loading ? (
        <div className="text-indigo-600 animate-pulse">Loading...</div>
      ) : (
        <div className="text-sm text-gray-500">
          {lastRefresh ? `Last refresh: ${lastRefresh}` : "Not refreshed yet"}
        </div>
      )}
    </div>
  );
}

/**
 * Demo component for enabled option
 */
function EnabledOptionDemo() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Enabled Option</h2>
      <p className={storyTheme.subtitle}>
        Conditionally enable/disable signal subscription
      </p>

      {/* Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setEnabled((prev) => !prev)}
          className={enabled ? storyTheme.buttonSuccess : storyTheme.buttonDanger}
          data-testid="toggle-enabled"
        >
          Subscription: {enabled ? "ENABLED" : "DISABLED"}
        </button>
      </div>

      {/* Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnabledSubscriber name="Controlled" enabled={enabled} />
        <EnabledSubscriber name="Always On" enabled={true} />
      </div>

      {/* Emitter */}
      <div className="mt-6">
        <EnabledEmitter />
      </div>

      {/* Info */}
      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          <strong>Use case:</strong> Disable subscription when component is
          hidden or when you want to temporarily pause updates.
        </p>
      </div>
    </div>
  );
}

function EnabledSubscriber({
  name,
  enabled,
}: {
  name: string;
  enabled: boolean;
}) {
  const { signal, info } = useSignal("enabled-signal", { enabled });

  return (
    <div
      className={`p-4 rounded-xl border-2 ${
        enabled
          ? "border-green-300 bg-green-50"
          : "border-gray-300 bg-gray-100"
      }`}
      data-testid={`enabled-${name.toLowerCase()}`}
    >
      <h4 className="font-semibold text-gray-800 mb-2">{name}</h4>
      <div className="text-2xl font-bold text-center mb-2">
        Signal: {signal}
      </div>
      <div className="text-sm text-center text-gray-500">
        {enabled ? "Subscribed" : "Not subscribed"}
      </div>
    </div>
  );
}

function EnabledEmitter() {
  const { emit, info } = useSignal("enabled-signal");

  return (
    <button
      onClick={() => emit()}
      className={storyTheme.buttonPrimary + " w-full"}
      data-testid="enabled-emit"
    >
      Emit Signal ({info.subscriberCount} subscribers)
    </button>
  );
}

/**
 * Demo component for data payload feature
 */
interface NotificationData {
  type: "success" | "warning" | "error" | "info";
  message: string;
  timestamp: number;
}

function DataPayloadDemo() {
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Data Payload Demo</h2>
      <p className={storyTheme.subtitle}>
        Pass data with emit() and access it via info.data
      </p>

      {/* Emitter with different data types */}
      <div className="mb-6">
        <NotificationEmitter />
      </div>

      {/* Receiver */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NotificationReceiver name="Receiver A" />
        <NotificationReceiver name="Receiver B" />
      </div>

      {/* Info Box */}
      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          <strong>How it works:</strong>
          <br />
          emit(data) sets info.data BEFORE incrementing the signal.
          <br />
          This guarantees info.data is always up-to-date in useEffect callbacks.
        </p>
      </div>
    </div>
  );
}

function NotificationEmitter() {
  const { emit, info } = useSignal<NotificationData>("notification");

  const sendNotification = (type: NotificationData["type"], message: string) => {
    emit({
      type,
      message,
      timestamp: Date.now(),
    });
  };

  return (
    <div className={storyTheme.gradientBox}>
      <h3 className="text-white font-semibold text-center mb-4">
        Send Notification
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => sendNotification("success", "Operation completed!")}
          className="py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
          data-testid="emit-success"
        >
          Success
        </button>
        <button
          onClick={() => sendNotification("warning", "Please review this.")}
          className="py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
          data-testid="emit-warning"
        >
          Warning
        </button>
        <button
          onClick={() => sendNotification("error", "Something went wrong!")}
          className="py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          data-testid="emit-error"
        >
          Error
        </button>
        <button
          onClick={() => sendNotification("info", "New updates available.")}
          className="py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          data-testid="emit-info"
        >
          Info
        </button>
      </div>
      <p className="text-white/80 text-center text-sm mt-3">
        Emit count: {info.emitCount} | Subscribers: {info.subscriberCount}
      </p>
    </div>
  );
}

function NotificationReceiver({ name }: { name: string }) {
  const { signal, info } = useSignal<NotificationData>("notification");
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (signal > 0 && info.data) {
      setNotifications((prev) => [...prev.slice(-2), info.data!]);
    }
  }, [signal, info]);

  const typeColors = {
    success: "bg-green-100 border-green-300 text-green-800",
    warning: "bg-yellow-100 border-yellow-300 text-yellow-800",
    error: "bg-red-100 border-red-300 text-red-800",
    info: "bg-blue-100 border-blue-300 text-blue-800",
  };

  return (
    <div className={storyTheme.card} data-testid={`receiver-${name.toLowerCase().replace(" ", "-")}`}>
      <h4 className="font-semibold text-gray-800 mb-3">{name}</h4>
      <div className="space-y-2 min-h-[120px]">
        {notifications.length === 0 ? (
          <p className="text-gray-400 text-sm">Waiting for notifications...</p>
        ) : (
          notifications.map((notif, i) => (
            <div
              key={i}
              className={`p-2 rounded border text-sm ${typeColors[notif.type]}`}
            >
              <div className="font-semibold capitalize">{notif.type}</div>
              <div>{notif.message}</div>
              <div className="text-xs opacity-70">
                {new Date(notif.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Signal: {signal} | Last data type:{" "}
        <span data-testid={`last-type-${name.toLowerCase().replace(" ", "-")}`}>
          {info.data?.type ?? "none"}
        </span>
      </div>
    </div>
  );
}

/**
 * Demo component for typed data communication
 */
interface CounterAction {
  action: "increment" | "decrement" | "reset";
  value?: number;
}

function TypedDataDemo() {
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Typed Data Communication</h2>
      <p className={storyTheme.subtitle}>
        Type-safe data sharing with TypeScript generics
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CounterController />
        <CounterDisplay />
      </div>

      {/* Code Example */}
      <div className={storyTheme.cardInfo + " mt-6"}>
        <h4 className="font-semibold text-gray-800 mb-2">Usage Example</h4>
        <pre className="text-xs bg-white/50 p-3 rounded-lg overflow-x-auto">
{`interface CounterAction {
  action: "increment" | "decrement" | "reset";
  value?: number;
}

// Emitter - typed emit
const { emit } = useSignal<CounterAction>("counter");
emit({ action: "increment", value: 5 });

// Receiver - typed info.data
const { signal, info } = useSignal<CounterAction>("counter");
useEffect(() => {
  if (info.data?.action === "increment") {
    setCount(c => c + (info.data?.value ?? 1));
  }
}, [signal]);`}
        </pre>
      </div>
    </div>
  );
}

function CounterController() {
  const { emit, info } = useSignal<CounterAction>("counter-action");

  return (
    <div className={storyTheme.gradientBox}>
      <h3 className="text-white font-semibold text-center mb-4">Controller</h3>
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => emit({ action: "decrement", value: 1 })}
            className="flex-1 py-2 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors"
            data-testid="counter-dec"
          >
            - 1
          </button>
          <button
            onClick={() => emit({ action: "increment", value: 1 })}
            className="flex-1 py-2 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors"
            data-testid="counter-inc"
          >
            + 1
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => emit({ action: "decrement", value: 10 })}
            className="flex-1 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
            data-testid="counter-dec-10"
          >
            - 10
          </button>
          <button
            onClick={() => emit({ action: "increment", value: 10 })}
            className="flex-1 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
            data-testid="counter-inc-10"
          >
            + 10
          </button>
        </div>
        <button
          onClick={() => emit({ action: "reset" })}
          className="w-full py-2 bg-red-400/80 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
          data-testid="counter-reset"
        >
          Reset
        </button>
      </div>
      <p className="text-white/70 text-xs text-center mt-3">
        Last action: {info.data?.action ?? "none"}
      </p>
    </div>
  );
}

function CounterDisplay() {
  const { signal, info } = useSignal<CounterAction>("counter-action");
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (signal > 0 && info.data) {
      const { action, value = 1 } = info.data;

      switch (action) {
        case "increment":
          setCount((c) => c + value);
          setHistory((h) => [...h.slice(-4), `+${value}`]);
          break;
        case "decrement":
          setCount((c) => c - value);
          setHistory((h) => [...h.slice(-4), `-${value}`]);
          break;
        case "reset":
          setCount(0);
          setHistory((h) => [...h.slice(-4), "reset"]);
          break;
      }
    }
  }, [signal, info]);

  return (
    <div className={storyTheme.card}>
      <h3 className="font-semibold text-gray-800 text-center mb-4">Display</h3>
      <div
        className="text-6xl font-bold text-center text-indigo-600 mb-4"
        data-testid="counter-value"
      >
        {count}
      </div>
      <div className="flex justify-center gap-1 mb-4">
        {history.map((h, i) => (
          <span
            key={i}
            className={`px-2 py-1 text-xs rounded ${
              h.startsWith("+")
                ? "bg-green-100 text-green-700"
                : h.startsWith("-")
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {h}
          </span>
        ))}
      </div>
      <div className="text-sm text-center text-gray-500">
        Signal version: {signal}
      </div>
    </div>
  );
}

// Meta configuration
const meta: Meta<typeof SignalDemo> = {
  title: "Hooks/useSignal",
  component: SignalDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A lightweight React hook for event-driven communication between components. Uses a name-based subscription pattern to synchronize state changes across deeply nested or sibling components without prop drilling.\n\n" +
          "⚠️ **What This Hook Is NOT**\n\n" +
          "`useSignal` is NOT a global state management solution. " +
          "This hook is designed for lightweight event-driven communication—sharing simple \"signals\" between components without the overhead of complex state management setup.\n\n" +
          "If you need complex shared state with derived values, persistent state across page navigation, or state that drives business logic, " +
          "use dedicated state management tools like **React Context**, **Zustand**, **Jotai**, **Recoil**, or **Redux**.\n\n" +
          "**About `info.data`:** The data payload feature exists for cases where you need to pass contextual information along with a signal (e.g., which item was clicked, what action was performed). " +
          "It's meant for event metadata, not as a global state container.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    signalName: {
      control: "text",
      description: "Unique identifier for the signal channel",
      table: {
        type: { summary: "string" },
      },
    },
    title: {
      control: "text",
      description: "Title displayed in the demo",
      table: {
        type: { summary: "string" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SignalDemo>;

/**
 * Basic usage - emit and subscribe to signals
 */
export const Default: Story = {
  args: {
    signalName: "demo-signal",
    title: "Basic Signal Demo",
  },
  parameters: {
    docs: {
      source: {
        code: `import { useSignal } from "@usefy/use-signal";
import { useEffect } from "react";

function SignalExample() {
  const { signal, emit, info } = useSignal("my-signal");

  useEffect(() => {
    // React to signal changes
    console.log("Signal received:", signal);
  }, [signal]);

  return (
    <div>
      <p>Signal: {signal}</p>
      <p>Subscribers: {info.subscriberCount}</p>
      <button onClick={emit}>Emit Signal</button>
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

    // Check initial state
    await expect(canvas.getByTestId("signal-value")).toHaveTextContent("0");
    await expect(canvas.getByTestId("info-subscribers")).toHaveTextContent("1");

    // Emit signal
    await userEvent.click(canvas.getByTestId("emit-button"));
    await waitFor(() => {
      expect(canvas.getByTestId("signal-value")).toHaveTextContent("1");
      expect(canvas.getByTestId("info-emitcount")).toHaveTextContent("1");
    });

    // Emit again
    await userEvent.click(canvas.getByTestId("emit-button"));
    await waitFor(() => {
      expect(canvas.getByTestId("signal-value")).toHaveTextContent("2");
      expect(canvas.getByTestId("info-emitcount")).toHaveTextContent("2");
    });
  },
};

/**
 * Multiple components subscribing to the same signal
 */
export const MultiSubscriber: Story = {
  render: () => <MultiSubscriberDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSignal } from "@usefy/use-signal";

// Emitter component
function Emitter() {
  const { emit, info } = useSignal("shared-signal");
  return (
    <button onClick={emit}>
      Emit to {info.subscriberCount} subscribers
    </button>
  );
}

// Subscriber component
function Subscriber({ name }: { name: string }) {
  const { signal } = useSignal("shared-signal");
  return (
    <div>
      <h4>{name}</h4>
      <p>Signal: {signal}</p>
    </div>
  );
}

function App() {
  return (
    <div>
      <Emitter />
      <Subscriber name="Subscriber A" />
      <Subscriber name="Subscriber B" />
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

    // Check initial state - all subscribers show 0
    await expect(
      canvas.getByTestId("signal-subscriber-a")
    ).toHaveTextContent("0");
    await expect(
      canvas.getByTestId("signal-subscriber-b")
    ).toHaveTextContent("0");

    // Emit signal
    await userEvent.click(canvas.getByTestId("multi-emit-button"));

    // All subscribers should update
    await waitFor(() => {
      expect(canvas.getByTestId("signal-subscriber-a")).toHaveTextContent("1");
      expect(canvas.getByTestId("signal-subscriber-b")).toHaveTextContent("1");
    });

    // Emit again
    await userEvent.click(canvas.getByTestId("multi-emit-button"));
    await waitFor(() => {
      expect(canvas.getByTestId("signal-subscriber-a")).toHaveTextContent("2");
      expect(canvas.getByTestId("signal-subscriber-b")).toHaveTextContent("2");
    });
  },
};

/**
 * Independent signals with different names
 */
export const IndependentSignals: Story = {
  render: () => <IndependentSignalsDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSignal } from "@usefy/use-signal";

function AlphaComponent() {
  const { signal, emit } = useSignal("alpha");
  return (
    <div>
      <p>Alpha Signal: {signal}</p>
      <button onClick={emit}>Emit Alpha</button>
    </div>
  );
}

function BetaComponent() {
  const { signal, emit } = useSignal("beta");
  return (
    <div>
      <p>Beta Signal: {signal}</p>
      <button onClick={emit}>Emit Beta</button>
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

    // Initial state
    await expect(
      canvas.getByTestId("independent-value-alpha")
    ).toHaveTextContent("0");
    await expect(
      canvas.getByTestId("independent-value-beta")
    ).toHaveTextContent("0");

    // Emit alpha only
    await userEvent.click(canvas.getByTestId("independent-emit-alpha"));
    await waitFor(() => {
      expect(canvas.getByTestId("independent-value-alpha")).toHaveTextContent(
        "1"
      );
      expect(canvas.getByTestId("independent-value-beta")).toHaveTextContent(
        "0"
      ); // Beta unchanged
    });

    // Emit beta only
    await userEvent.click(canvas.getByTestId("independent-emit-beta"));
    await waitFor(() => {
      expect(canvas.getByTestId("independent-value-alpha")).toHaveTextContent(
        "1"
      ); // Alpha unchanged
      expect(canvas.getByTestId("independent-value-beta")).toHaveTextContent(
        "1"
      );
    });
  },
};

/**
 * Options: emitOnMount, onEmit, debounce
 */
export const WithOptions: Story = {
  render: () => <OptionsDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSignal } from "@usefy/use-signal";

// emitOnMount - automatically emit when component mounts
function EmitOnMountExample() {
  const { signal } = useSignal("mount-signal", {
    emitOnMount: true,
  });
  return <p>Signal: {signal}</p>;
}

// onEmit - callback when emit is called
function OnEmitExample() {
  const { emit } = useSignal("callback-signal", {
    onEmit: () => console.log("Signal emitted!"),
  });
  return <button onClick={emit}>Emit with Callback</button>;
}

// debounce - debounce rapid emit calls
function DebounceExample() {
  const { signal, emit } = useSignal("debounce-signal", {
    debounce: 500, // 500ms
  });
  return (
    <div>
      <p>Signal: {signal}</p>
      <button onClick={emit}>Emit (debounced)</button>
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

    // Test onEmit callback
    await userEvent.click(canvas.getByTestId("callback-emit-button"));
    await waitFor(() => {
      expect(canvas.getByTestId("callback-log")).toHaveTextContent(
        "Callback fired"
      );
    });

    // Test emitOnMount
    await userEvent.click(canvas.getByTestId("toggle-emit-on-mount"));
    await waitFor(() => {
      expect(canvas.getByTestId("emit-on-mount-component")).toBeInTheDocument();
    });
  },
};

/**
 * Dashboard refresh pattern - real-world use case
 */
export const DashboardRefresh: Story = {
  render: () => <DashboardRefreshDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSignal } from "@usefy/use-signal";
import { useEffect, useState } from "react";

function RefreshButton() {
  const { emit, info } = useSignal("dashboard-refresh");
  return (
    <button onClick={emit}>
      Refresh Dashboard ({info.subscriberCount} widgets)
    </button>
  );
}

function DashboardWidget({ name }: { name: string }) {
  const { signal } = useSignal("dashboard-refresh");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (signal > 0) {
      setLoading(true);
      // Simulate API call
      fetchData().then(() => setLoading(false));
    }
  }, [signal]);

  return (
    <div>
      <h4>{name}</h4>
      {loading ? <p>Loading...</p> : <p>Data loaded</p>}
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <RefreshButton />
      <DashboardWidget name="Sales Chart" />
      <DashboardWidget name="User Stats" />
      <DashboardWidget name="Recent Orders" />
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

    // Click refresh
    await userEvent.click(canvas.getByTestId("refresh-dashboard"));

    // Widgets should show loading
    await waitFor(() => {
      const widgets = canvasElement.querySelectorAll('[data-testid^="widget-"]');
      expect(widgets.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Enabled option - conditionally subscribe
 */
export const EnabledOption: Story = {
  render: () => <EnabledOptionDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSignal } from "@usefy/use-signal";
import { useState } from "react";

function ConditionalSubscriber() {
  const [enabled, setEnabled] = useState(true);
  const { signal } = useSignal("my-signal", { enabled });

  return (
    <div>
      <button onClick={() => setEnabled(!enabled)}>
        {enabled ? "Disable" : "Enable"} Subscription
      </button>
      <p>Signal: {signal}</p>
      <p>Status: {enabled ? "Subscribed" : "Not subscribed"}</p>
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

    // Initial state - controlled is enabled
    await userEvent.click(canvas.getByTestId("enabled-emit"));

    // Both should receive
    await waitFor(() => {
      expect(
        canvas.getByTestId("enabled-controlled").textContent
      ).toContain("1");
    });

    // Disable controlled
    await userEvent.click(canvas.getByTestId("toggle-enabled"));

    // Emit again
    await userEvent.click(canvas.getByTestId("enabled-emit"));

    // Only "Always On" should update
    await waitFor(() => {
      expect(
        canvas.getByTestId("enabled-always on").textContent
      ).toContain("2");
    });
  },
};

/**
 * Data payload - pass data with emit()
 */
export const DataPayload: Story = {
  render: () => <DataPayloadDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSignal } from "@usefy/use-signal";
import { useEffect, useState } from "react";

interface NotificationData {
  type: "success" | "warning" | "error" | "info";
  message: string;
  timestamp: number;
}

// Emitter - send data with emit
function NotificationEmitter() {
  const { emit } = useSignal<NotificationData>("notification");

  const sendNotification = (type: NotificationData["type"], message: string) => {
    emit({
      type,
      message,
      timestamp: Date.now(),
    });
  };

  return (
    <button onClick={() => sendNotification("success", "Done!")}>
      Send Success
    </button>
  );
}

// Receiver - access data via info.data
function NotificationReceiver() {
  const { signal, info } = useSignal<NotificationData>("notification");

  useEffect(() => {
    if (signal > 0 && info.data) {
      // info.data is guaranteed to be the latest when useEffect runs
      console.log("Received:", info.data.type, info.data.message);
    }
  }, [signal]);

  return (
    <div>
      Last notification: {info.data?.message ?? "None"}
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

    // Send different notification types
    await userEvent.click(canvas.getByTestId("emit-success"));
    await waitFor(() => {
      expect(canvas.getByTestId("last-type-receiver-a")).toHaveTextContent(
        "success"
      );
    });

    await userEvent.click(canvas.getByTestId("emit-error"));
    await waitFor(() => {
      expect(canvas.getByTestId("last-type-receiver-a")).toHaveTextContent(
        "error"
      );
      expect(canvas.getByTestId("last-type-receiver-b")).toHaveTextContent(
        "error"
      );
    });
  },
};

/**
 * Typed data communication - type-safe actions
 */
export const TypedData: Story = {
  render: () => <TypedDataDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSignal } from "@usefy/use-signal";
import { useEffect, useState } from "react";

interface CounterAction {
  action: "increment" | "decrement" | "reset";
  value?: number;
}

// Controller - emit typed actions
function CounterController() {
  const { emit } = useSignal<CounterAction>("counter-action");

  return (
    <div>
      <button onClick={() => emit({ action: "increment", value: 1 })}>+1</button>
      <button onClick={() => emit({ action: "decrement", value: 1 })}>-1</button>
      <button onClick={() => emit({ action: "reset" })}>Reset</button>
    </div>
  );
}

// Display - react to typed actions
function CounterDisplay() {
  const { signal, info } = useSignal<CounterAction>("counter-action");
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (signal > 0 && info.data) {
      const { action, value = 1 } = info.data;
      switch (action) {
        case "increment":
          setCount((c) => c + value);
          break;
        case "decrement":
          setCount((c) => c - value);
          break;
        case "reset":
          setCount(0);
          break;
      }
    }
  }, [signal]);

  return <div>Count: {count}</div>;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test increment
    await userEvent.click(canvas.getByTestId("counter-inc"));
    await waitFor(() => {
      expect(canvas.getByTestId("counter-value")).toHaveTextContent("1");
    });

    // Test increment by 10
    await userEvent.click(canvas.getByTestId("counter-inc-10"));
    await waitFor(() => {
      expect(canvas.getByTestId("counter-value")).toHaveTextContent("11");
    });

    // Test decrement
    await userEvent.click(canvas.getByTestId("counter-dec"));
    await waitFor(() => {
      expect(canvas.getByTestId("counter-value")).toHaveTextContent("10");
    });

    // Test reset
    await userEvent.click(canvas.getByTestId("counter-reset"));
    await waitFor(() => {
      expect(canvas.getByTestId("counter-value")).toHaveTextContent("0");
    });
  },
};
