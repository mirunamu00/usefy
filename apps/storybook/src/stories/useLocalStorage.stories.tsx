import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useLocalStorage } from "@usefy/use-local-storage";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Demo component for basic useLocalStorage usage
 */
function LocalStorageDemo({
  storageKey = "demo-value",
  initialValue = "Hello, World!",
}: {
  storageKey?: string;
  initialValue?: string;
}) {
  const [value, setValue, removeValue] = useLocalStorage(
    storageKey,
    initialValue
  );
  const [inputValue, setInputValue] = useState("");

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useLocalStorage Demo</h2>
      <p className={storyTheme.subtitle}>
        Values persist across page refreshes. Try it!
      </p>

      {/* Current Value Display */}
      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <label className={storyTheme.statLabel + " mb-2"}>Stored Value:</label>
        <div
          data-testid="stored-value"
          className="text-lg font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800"
        >
          {value}
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <label className={storyTheme.label}>New Value:</label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter new value..."
          className={storyTheme.input + " w-full p-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"}
          data-testid="value-input"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => {
            setValue(inputValue);
            setInputValue("");
          }}
          className={storyTheme.buttonPrimary}
          data-testid="save-button"
        >
          Save to Storage
        </button>
        <button
          onClick={removeValue}
          className={storyTheme.buttonDanger}
          data-testid="remove-button"
        >
          Remove Value
        </button>
      </div>

      {/* Info Box */}
      <div className={storyTheme.infoBox + " mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          Storage Key: <code className="font-mono">{storageKey}</code>
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for object storage
 */
interface UserSettings {
  theme: "light" | "dark";
  notifications: boolean;
  language: string;
}

function ObjectStorageDemo() {
  const [settings, setSettings, resetSettings] = useLocalStorage<UserSettings>(
    "user-settings",
    {
      theme: "light",
      notifications: true,
      language: "en",
    }
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Object Storage Demo</h2>
      <p className={storyTheme.subtitle}>
        Store complex objects with type safety
      </p>

      {/* Settings Display */}
      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <h3 className="font-semibold text-slate-800 mb-4">Current Settings:</h3>
        <pre
          className="font-mono text-sm bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-auto text-slate-700"
          data-testid="settings-display"
        >
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>

      {/* Theme Toggle */}
      <div className="mb-4">
        <label className={storyTheme.label}>Theme:</label>
        <div className={storyTheme.buttonGroup}>
          <button
            onClick={() => setSettings((s) => ({ ...s, theme: "light" }))}
            className={
              settings.theme === "light"
                ? storyTheme.buttonPrimary
                : storyTheme.buttonNeutral
            }
            data-testid="theme-light"
          >
            Light
          </button>
          <button
            onClick={() => setSettings((s) => ({ ...s, theme: "dark" }))}
            className={
              settings.theme === "dark"
                ? storyTheme.buttonPrimary
                : storyTheme.buttonNeutral
            }
            data-testid="theme-dark"
          >
            Dark
          </button>
        </div>
      </div>

      {/* Notifications Toggle */}
      <div className="mb-4">
        <label className={storyTheme.label}>Notifications:</label>
        <button
          onClick={() =>
            setSettings((s) => ({ ...s, notifications: !s.notifications }))
          }
          className={
            settings.notifications
              ? storyTheme.buttonSuccess
              : storyTheme.buttonNeutral
          }
          data-testid="notifications-toggle"
        >
          {settings.notifications ? "Enabled" : "Disabled"}
        </button>
      </div>

      {/* Language Select */}
      <div className="mb-6">
        <label className={storyTheme.label}>Language:</label>
        <select
          value={settings.language}
          onChange={(e) =>
            setSettings((s) => ({ ...s, language: e.target.value }))
          }
          className={storyTheme.input}
          data-testid="language-select"
        >
          <option value="en">English</option>
          <option value="ko">Korean</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
        </select>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetSettings}
        className={storyTheme.buttonDanger}
        data-testid="reset-settings"
      >
        Reset to Defaults
      </button>
    </div>
  );
}

/**
 * Demo component for counter with persistence
 */
function CounterDemo() {
  const [count, setCount, resetCount] = useLocalStorage("counter", 0);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Persistent Counter</h2>
      <p className={storyTheme.subtitle}>
        This counter persists across page refreshes
      </p>

      {/* Counter Display */}
      <div className={storyTheme.gradientBox + " mb-8 p-10 rounded-3xl shadow-2xl text-center"}>
        <div
          className="text-8xl font-black text-white m-0 drop-shadow-sm"
          data-testid="counter-value"
        >
          {count}
        </div>
      </div>

      {/* Counter Controls */}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => setCount((c) => c - 1)}
          className={storyTheme.buttonSecondary + " flex-1 py-3 rounded-xl font-bold"}
          data-testid="decrement"
        >
          - Decrement
        </button>
        <button
          onClick={() => setCount((c) => c + 1)}
          className={storyTheme.buttonPrimary + " flex-1 py-3 rounded-xl font-bold shadow-lg"}
          data-testid="increment"
        >
          + Increment
        </button>
        <button
          onClick={resetCount}
          className={storyTheme.buttonNeutral + " px-6 py-3 rounded-xl font-bold"}
          data-testid="reset-counter"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/**
 * Demo component for multiple keys
 */
function MultipleKeysDemo() {
  const [firstName, setFirstName] = useLocalStorage("user-firstName", "");
  const [lastName, setLastName] = useLocalStorage("user-lastName", "");
  const [email, setEmail] = useLocalStorage("user-email", "");

  const fullName =
    firstName || lastName ? `${firstName} ${lastName}`.trim() : "Not set";

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Multiple Keys Demo</h2>
      <p className={storyTheme.subtitle}>
        Each field uses a separate localStorage key
      </p>

      {/* Form Fields */}
      <div className="space-y-4 mb-6">
        <div>
          <label className={storyTheme.label}>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            className={storyTheme.input + " w-full p-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"}
            data-testid="first-name-input"
          />
        </div>
        <div>
          <label className={storyTheme.label}>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            className={storyTheme.input + " w-full p-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"}
            data-testid="last-name-input"
          />
        </div>
        <div>
          <label className={storyTheme.label}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className={storyTheme.input + " w-full p-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"}
            data-testid="email-input"
          />
        </div>
      </div>

      {/* Summary Card */}
      <div className={storyTheme.statBox + " bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <h3 className="font-semibold text-slate-800 mb-4">Saved Profile:</h3>
        <p data-testid="full-name">
          <span className={storyTheme.statLabel}>Name:</span>{" "}
          <span className={storyTheme.statValue}>{fullName}</span>
        </p>
        <p data-testid="saved-email">
          <span className={storyTheme.statLabel}>Email:</span>{" "}
          <span className={storyTheme.statValue}>{email || "Not set"}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for cross-tab sync info
 */
function CrossTabSyncDemo() {
  const [message, setMessage] = useLocalStorage("sync-message", "");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const updateMessage = (newMessage: string) => {
    setMessage(newMessage);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Cross-Tab Sync Demo</h2>
      <p className={storyTheme.subtitle}>
        Open this page in multiple tabs to see synchronization
      </p>

      {/* Message Display */}
      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <label className={storyTheme.statLabel + " mb-2"}>Current Message:</label>
        <div
          className="text-lg font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[60px] text-slate-800"
          data-testid="sync-message"
        >
          {message || "(empty)"}
        </div>
        {lastUpdate && (
          <p className="text-sm text-slate-500 mt-3 text-right italic">
            Last local update: {lastUpdate}
          </p>
        )}
      </div>

      {/* Quick Messages */}
      <div className="mb-6">
        <label className={storyTheme.label}>Quick Messages:</label>
        <div className="flex gap-2 flex-wrap">
          {["Hello!", "Updated from Tab 1", "Sync test", ""].map((msg, i) => (
            <button
              key={i}
              onClick={() => updateMessage(msg)}
              className={storyTheme.buttonNeutral}
              data-testid={`quick-msg-${i}`}
            >
              {msg || "Clear"}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className={storyTheme.infoBox + " bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          <strong>How to test:</strong>
          <br />
          1. Open this page in another browser tab
          <br />
          2. Click a quick message button in one tab
          <br />
          3. Watch the other tab update automatically
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for same-tab component synchronization
 * Shows how multiple components using the same key stay in sync
 */
function ComponentSyncDemo() {
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Component Sync Demo</h2>
      <p className={storyTheme.subtitle}>
        Multiple components using the same localStorage key automatically stay
        in sync
      </p>

      {/* Two synchronized components side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <SyncedComponent name="Component A" color="blue" />
        <SyncedComponent name="Component B" color="green" />
      </div>

      {/* Third component */}
      <div className="mb-6">
        <SyncedComponent name="Component C" color="purple" />
      </div>

      {/* Info Box */}
      <div className={storyTheme.infoBox + " bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          <strong>How it works:</strong>
          <br />
          All three components use{" "}
          <code>useLocalStorage("shared-count", 0)</code>
          <br />
          When any component updates the value, all others update instantly!
          <br />
          <br />
          <strong>Technical Details:</strong>
          <br />• Uses <code>useSyncExternalStore</code> for React 18+
          compatibility
          <br />
          • Internal store manager notifies all subscribers on change
          <br />• No prop drilling or context needed
        </p>
      </div>
    </div>
  );
}

/**
 * Individual synced component for the demo
 */
function SyncedComponent({ name, color }: { name: string; color: string }) {
  const [count, setCount, resetCount] = useLocalStorage("shared-count", 0);

  const colorClasses = {
    blue: "bg-blue-500 hover:bg-blue-600 border-blue-600",
    green: "bg-green-500 hover:bg-green-600 border-green-600",
    purple: "bg-purple-500 hover:bg-purple-600 border-purple-600",
  };

  const borderColors = {
    blue: "border-blue-300",
    green: "border-green-300",
    purple: "border-purple-300",
  };

  const bgColors = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
  };

  return (
    <div
      className={`p-8 rounded-2xl border-2 ${
        borderColors[color as keyof typeof borderColors]
      } ${bgColors[color as keyof typeof bgColors]}`}
      data-testid={`sync-component-${name.toLowerCase().replace(" ", "-")}`}
    >
      <h3 className="font-semibold text-gray-800 mb-3 text-center">{name}</h3>

      {/* Count Display */}
      <div
        className="text-4xl font-bold text-center mb-4 py-3 bg-white rounded-lg shadow-sm"
        data-testid={`sync-value-${name.toLowerCase().replace(" ", "-")}`}
      >
        {count}
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center flex-wrap">
        <button
          onClick={() => setCount((c) => c - 1)}
          className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
          data-testid={`sync-decrement-${name.toLowerCase().replace(" ", "-")}`}
        >
          -1
        </button>
        <button
          onClick={() => setCount((c) => c + 1)}
          className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
          data-testid={`sync-increment-${name.toLowerCase().replace(" ", "-")}`}
        >
          +1
        </button>
        <button
          onClick={() => setCount((c) => c + 10)}
          className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
          data-testid={`sync-add10-${name.toLowerCase().replace(" ", "-")}`}
        >
          +10
        </button>
        <button
          onClick={resetCount}
          className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
          data-testid={`sync-reset-${name.toLowerCase().replace(" ", "-")}`}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/**
 * Demo component for error handling
 */
function ErrorHandlingDemo() {
  const [errorLog, setErrorLog] = useState<string[]>([]);

  const handleError = (error: Error) => {
    setErrorLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${error.message}`,
    ]);
  };

  const [value, setValue] = useLocalStorage("error-demo", "Normal value", {
    onError: handleError,
  });

  // Simulate storage with very large value (for quota error demo)
  const simulateLargeValue = () => {
    try {
      // Create a very large string (may trigger quota error in some browsers)
      const largeValue = "x".repeat(5 * 1024 * 1024); // 5MB
      setValue(largeValue);
    } catch {
      // Error will be handled by onError callback
    }
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Error Handling Demo</h2>
      <p className={storyTheme.subtitle}>
        Demonstrates error handling with onError callback
      </p>

      {/* Current Value */}
      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <label className={storyTheme.label}>Current Value:</label>
        <div
          className="font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 truncate text-slate-800"
          data-testid="error-demo-value"
        >
          {value.length > 100 ? `${value.slice(0, 100)}...` : value}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap mb-6">
        <button
          onClick={() => setValue("Normal value")}
          className={storyTheme.buttonPrimary}
          data-testid="set-normal"
        >
          Set Normal Value
        </button>
        <button
          onClick={simulateLargeValue}
          className={storyTheme.buttonDanger}
          data-testid="trigger-error"
        >
          Try Large Value (May Error)
        </button>
      </div>

      {/* Error Log */}
      <div className={storyTheme.card + " bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-800"}>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">🚨 Error Log:</h3>
        <div
          className="font-mono text-sm bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500 min-h-[100px] max-h-[200px] overflow-auto"
          data-testid="error-log"
        >
          {errorLog.length === 0 ? (
            <span className="text-slate-500 italic">No errors yet</span>
          ) : (
            errorLog.map((log, i) => (
              <div key={i} className="text-red-400">
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
 * Demo component for custom serializer/deserializer
 * Shows how to store Date objects and other custom types
 */
function CustomSerializerDemo() {
  const [lastVisit, setLastVisit, removeLastVisit] = useLocalStorage<Date>(
    "last-visit-date",
    new Date(),
    {
      serializer: (date: Date) => date.toISOString(),
      deserializer: (str: string) => new Date(str),
    }
  );

  const [favoriteColors, setFavoriteColors, removeColors] = useLocalStorage<
    string[]
  >("favorite-colors", [], {
    serializer: (colors: string[]) => colors.join(","),
    deserializer: (str: string) => (str ? str.split(",") : []),
  });

  const [colorInput, setColorInput] = useState("");

  const updateLastVisit = () => {
    setLastVisit(new Date());
  };

  const addColor = () => {
    if (colorInput.trim()) {
      setFavoriteColors((prev) => [...prev, colorInput.trim()]);
      setColorInput("");
    }
  };

  const removeColor = (index: number) => {
    setFavoriteColors((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Custom Serializer/Deserializer</h2>
      <p className={storyTheme.subtitle}>
        Store Date objects and custom types with custom serialization
      </p>

      {/* Date Storage Example */}
      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <h3 className="font-semibold text-gray-800 mb-4">
          📅 Date Object Storage
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Stores Date objects as ISO strings and restores them as Date objects
        </p>

        <div className="mb-4">
          <label className={storyTheme.label}>Last Visit Date:</label>
          <div
            className="font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 mb-3"
            data-testid="last-visit-display"
          >
            <div className="text-lg font-semibold mb-1">
              {lastVisit.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="text-sm text-gray-500">
              {lastVisit.toLocaleTimeString("en-US")}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              ISO String: {lastVisit.toISOString()}
            </div>
          </div>
        </div>

        <button
          onClick={updateLastVisit}
          className={storyTheme.buttonPrimary}
          data-testid="update-visit-date"
        >
          Update to Now
        </button>
      </div>

      {/* Custom Array Storage Example */}
      <div className={storyTheme.statBox + " bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <h3 className="font-semibold text-gray-800 mb-4">
          🎨 Custom Array Storage (Comma-separated)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Stores arrays as comma-separated strings
        </p>

        <div className="mb-4">
          <label className={storyTheme.label}>Favorite Colors:</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="Enter color name..."
              className={storyTheme.input + " w-full p-3 rounded-xl border border-slate-300"}
              data-testid="color-input"
              onKeyPress={(e) => {
                if (e.key === "Enter") addColor();
              }}
            />
            <button
              onClick={addColor}
              className={storyTheme.buttonPrimary}
              data-testid="add-color"
            >
              Add
            </button>
          </div>

          <div
            className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-slate-50 rounded-xl border border-slate-200"
            data-testid="colors-list"
          >
            {favoriteColors.length === 0 ? (
              <span className="text-gray-400 text-sm">No colors added yet</span>
            ) : (
              favoriteColors.map((color, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {color}
                  <button
                    onClick={() => removeColor(index)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                    data-testid={`remove-color-${index}`}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={removeColors}
            className={storyTheme.buttonDanger}
            data-testid="clear-colors"
          >
            Clear All Colors
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className={storyTheme.infoBox + " mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          <strong>How it works:</strong>
          <br />• <code>serializer</code>: Function that converts values to
          strings when storing in localStorage
          <br />• <code>deserializer</code>: Function that converts strings back
          to original types when reading from localStorage
          <br />• Default is <code>JSON.stringify</code> /{" "}
          <code>JSON.parse</code>
          <br />• Useful for storing types that can't be serialized with JSON,
          such as Date, Map, Set, etc.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for syncTabs option
 * Shows the difference between syncTabs: true and syncTabs: false
 */
function SyncTabsOptionDemo() {
  const [syncedValue, setSyncedValue] = useLocalStorage(
    "sync-tabs-enabled",
    "Tab sync ON",
    {
      syncTabs: true,
    }
  );

  const [nonSyncedValue, setNonSyncedValue] = useLocalStorage(
    "sync-tabs-disabled",
    "Tab sync OFF",
    {
      syncTabs: false,
    }
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>syncTabs Option Demo</h2>
      <p className={storyTheme.subtitle}>
        Compare: How the syncTabs option affects cross-tab synchronization
      </p>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Sync Enabled */}
        <div className={storyTheme.card + " bg-white rounded-2xl p-6 shadow-sm border-2 border-green-300"}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">✅</span>
            <h3 className="font-semibold text-gray-800">
              syncTabs: true (default)
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Automatically syncs when changed in other tabs
          </p>

          <div className="mb-4">
            <label className={storyTheme.label}>Value:</label>
            <div
              className="font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 text-lg"
              data-testid="synced-value"
            >
              {syncedValue}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSyncedValue("Updated from Tab 1")}
              className={storyTheme.buttonPrimary}
              data-testid="synced-update-1"
            >
              Update 1
            </button>
            <button
              onClick={() => setSyncedValue("Updated from Tab 2")}
              className={storyTheme.buttonPrimary}
              data-testid="synced-update-2"
            >
              Update 2
            </button>
            <button
              onClick={() => setSyncedValue("Tab sync ON")}
              className={storyTheme.buttonNeutral}
              data-testid="synced-reset"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Sync Disabled */}
        <div className={storyTheme.card + " bg-white rounded-2xl p-6 shadow-sm border-2 border-orange-300"}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">❌</span>
            <h3 className="font-semibold text-gray-800">syncTabs: false</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Changes from other tabs are not reflected
          </p>

          <div className="mb-4">
            <label className={storyTheme.label}>Value:</label>
            <div
              className="font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 text-lg"
              data-testid="non-synced-value"
            >
              {nonSyncedValue}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setNonSyncedValue("Updated from Tab 1")}
              className={storyTheme.buttonPrimary}
              data-testid="non-synced-update-1"
            >
              Update 1
            </button>
            <button
              onClick={() => setNonSyncedValue("Updated from Tab 2")}
              className={storyTheme.buttonPrimary}
              data-testid="non-synced-update-2"
            >
              Update 2
            </button>
            <button
              onClick={() => setNonSyncedValue("Tab sync OFF")}
              className={storyTheme.buttonNeutral}
              data-testid="non-synced-reset"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className={storyTheme.infoBox}>
        <p className={storyTheme.infoText}>
          <strong>How to test:</strong>
          <br />
          1. Open this page in another browser tab
          <br />
          2. Click buttons on the left (syncTabs: true) → Updates automatically
          in other tabs
          <br />
          3. Click buttons on the right (syncTabs: false) → Does not update in
          other tabs
          <br />
          <br />
          <strong>Use cases:</strong>
          <br />• <code>syncTabs: true</code>: Data that should be shared across
          tabs, such as user settings, theme, etc.
          <br />• <code>syncTabs: false</code>: Tab-specific independent data,
          when performance optimization is needed
        </p>
      </div>
    </div>
  );
}

// Meta configuration
const meta: Meta<typeof LocalStorageDemo> = {
  title: "Hooks/useLocalStorage",
  component: LocalStorageDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A hook for persisting state in localStorage with automatic synchronization. Works like useState but values persist across page refreshes and sync across browser tabs.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    storageKey: {
      control: "text",
      description: "The localStorage key to store the value under",
      table: {
        type: { summary: "string" },
      },
    },
    initialValue: {
      control: "text",
      description: "Initial value when localStorage is empty",
      table: {
        type: { summary: "T | (() => T)" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocalStorageDemo>;

/**
 * Basic string storage demo
 */
export const Default: Story = {
  args: {
    storageKey: "demo-value",
    initialValue: "Hello, World!",
  },
  parameters: {
    docs: {
      source: {
        code: `import { useLocalStorage } from "@usefy/use-local-storage";
import { useState } from "react";

function LocalStorageExample() {
  const [value, setValue, removeValue] = useLocalStorage("demo-value", "Hello, World!");
  const [inputValue, setInputValue] = useState("");

  return (
    <div>
      <div>
        <label>Stored Value:</label>
        <div>{value}</div>
      </div>
      <div>
        <label>New Value:</label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter new value..."
        />
      </div>
      <div>
        <button onClick={() => { setValue(inputValue); setInputValue(""); }}>
          Save to Storage
        </button>
        <button onClick={removeValue}>Remove Value</button>
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

    // First, reset to initial state by clicking remove button
    await userEvent.click(canvas.getByTestId("remove-button"));

    // Wait for component to show initial value after removal
    await waitFor(() => {
      expect(canvas.getByTestId("stored-value")).toHaveTextContent(
        "Hello, World!"
      );
    });

    // Type new value
    const input = canvas.getByTestId("value-input");
    await userEvent.clear(input);
    await userEvent.type(input, "New Value");

    // Save the value
    await userEvent.click(canvas.getByTestId("save-button"));

    // Check the value is updated
    await waitFor(() => {
      expect(canvas.getByTestId("stored-value")).toHaveTextContent("New Value");
    });

    // Check input is cleared
    await expect(input).toHaveValue("");
  },
};

/**
 * Object storage with type safety
 */
export const WithObject: Story = {
  render: () => <ObjectStorageDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useLocalStorage } from "@usefy/use-local-storage";

interface UserSettings {
  theme: "light" | "dark";
  notifications: boolean;
  language: string;
}

function SettingsComponent() {
  const [settings, setSettings, resetSettings] = useLocalStorage<UserSettings>(
    "user-settings",
    {
      theme: "light",
      notifications: true,
      language: "en",
    }
  );

  return (
    <div>
      <div>
        <pre>{JSON.stringify(settings, null, 2)}</pre>
      </div>
      <div>
        <label>Theme:</label>
        <button onClick={() => setSettings((s) => ({ ...s, theme: "light" }))}>
          Light
        </button>
        <button onClick={() => setSettings((s) => ({ ...s, theme: "dark" }))}>
          Dark
        </button>
      </div>
      <div>
        <label>Notifications:</label>
        <button onClick={() => setSettings((s) => ({ ...s, notifications: !s.notifications }))}>
          {settings.notifications ? "Enabled" : "Disabled"}
        </button>
      </div>
      <div>
        <label>Language:</label>
        <select
          value={settings.language}
          onChange={(e) => setSettings((s) => ({ ...s, language: e.target.value }))}
        >
          <option value="en">English</option>
          <option value="ko">Korean</option>
        </select>
      </div>
      <button onClick={resetSettings}>Reset to Defaults</button>
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

    // First, reset to initial state by clicking reset button
    await userEvent.click(canvas.getByTestId("reset-settings"));

    // Wait for component to show initial values after reset
    const settingsDisplay = canvas.getByTestId("settings-display");
    await waitFor(() => {
      expect(settingsDisplay).toHaveTextContent('"theme": "light"');
    });
    await expect(settingsDisplay).toHaveTextContent('"notifications": true');

    // Change theme to dark
    await userEvent.click(canvas.getByTestId("theme-dark"));
    await waitFor(() => {
      expect(settingsDisplay).toHaveTextContent('"theme": "dark"');
    });

    // Toggle notifications off
    await userEvent.click(canvas.getByTestId("notifications-toggle"));
    await waitFor(() => {
      expect(settingsDisplay).toHaveTextContent('"notifications": false');
    });

    // Change language
    await userEvent.selectOptions(canvas.getByTestId("language-select"), "ko");
    await waitFor(() => {
      expect(settingsDisplay).toHaveTextContent('"language": "ko"');
    });
  },
};

/**
 * Persistent counter demo
 */
export const WithCounter: Story = {
  render: () => <CounterDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useLocalStorage } from "@usefy/use-local-storage";

function PersistentCounter() {
  const [count, setCount, resetCount] = useLocalStorage("counter", 0);

  return (
    <div>
      <h2>Persistent Counter</h2>
      <div>{count}</div>
      <div>
        <button onClick={() => setCount((c) => c - 1)}>- Decrement</button>
        <button onClick={() => setCount((c) => c + 1)}>+ Increment</button>
        <button onClick={resetCount}>Reset</button>
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

    // Get initial value
    const counterValue = canvas.getByTestId("counter-value");
    const initialValue = parseInt(counterValue.textContent || "0");

    // Increment
    await userEvent.click(canvas.getByTestId("increment"));
    await waitFor(() => {
      expect(counterValue).toHaveTextContent(String(initialValue + 1));
    });

    // Increment again
    await userEvent.click(canvas.getByTestId("increment"));
    await waitFor(() => {
      expect(counterValue).toHaveTextContent(String(initialValue + 2));
    });

    // Decrement
    await userEvent.click(canvas.getByTestId("decrement"));
    await waitFor(() => {
      expect(counterValue).toHaveTextContent(String(initialValue + 1));
    });

    // Reset
    await userEvent.click(canvas.getByTestId("reset-counter"));
    await waitFor(() => {
      expect(counterValue).toHaveTextContent("0");
    });
  },
};

/**
 * Multiple keys demo
 */
export const MultipleKeys: Story = {
  render: () => <MultipleKeysDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useLocalStorage } from "@usefy/use-local-storage";

function UserProfile() {
  const [firstName, setFirstName] = useLocalStorage("user-firstName", "");
  const [lastName, setLastName] = useLocalStorage("user-lastName", "");
  const [email, setEmail] = useLocalStorage("user-email", "");

  const fullName = firstName || lastName ? \`\${firstName} \${lastName}\`.trim() : "Not set";

  return (
    <div>
      <div>
        <label>First Name:</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="John"
        />
      </div>
      <div>
        <label>Last Name:</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Doe"
        />
      </div>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
        />
      </div>
      <div>
        <p>Name: {fullName}</p>
        <p>Email: {email || "Not set"}</p>
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

    // Type in first name
    await userEvent.type(canvas.getByTestId("first-name-input"), "John");
    await waitFor(() => {
      expect(canvas.getByTestId("full-name")).toHaveTextContent("John");
    });

    // Type in last name
    await userEvent.type(canvas.getByTestId("last-name-input"), "Doe");
    await waitFor(() => {
      expect(canvas.getByTestId("full-name")).toHaveTextContent("John Doe");
    });

    // Type in email
    await userEvent.type(canvas.getByTestId("email-input"), "john@example.com");
    await waitFor(() => {
      expect(canvas.getByTestId("saved-email")).toHaveTextContent(
        "john@example.com"
      );
    });
  },
};

/**
 * Cross-tab synchronization demo
 */
export const CrossTabSync: Story = {
  render: () => <CrossTabSyncDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useLocalStorage } from "@usefy/use-local-storage";
import { useState } from "react";

function CrossTabSyncExample() {
  const [message, setMessage] = useLocalStorage("sync-message", "");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const updateMessage = (newMessage: string) => {
    setMessage(newMessage);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  return (
    <div>
      <h2>Cross-Tab Sync Demo</h2>
      <div>
        <label>Current Message:</label>
        <div>{message || "(empty)"}</div>
        {lastUpdate && <p>Last local update: {lastUpdate}</p>}
      </div>
      <div>
        <button onClick={() => updateMessage("Hello!")}>Hello!</button>
        <button onClick={() => updateMessage("Updated from Tab 1")}>Update 1</button>
        <button onClick={() => updateMessage("Sync test")}>Sync test</button>
        <button onClick={() => updateMessage("")}>Clear</button>
      </div>
      <p>Open this page in multiple tabs to see synchronization</p>
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

    // Click first quick message
    await userEvent.click(canvas.getByTestId("quick-msg-0"));
    await waitFor(() => {
      expect(canvas.getByTestId("sync-message")).toHaveTextContent("Hello!");
    });

    // Click second quick message
    await userEvent.click(canvas.getByTestId("quick-msg-1"));
    await waitFor(() => {
      expect(canvas.getByTestId("sync-message")).toHaveTextContent(
        "Updated from Tab 1"
      );
    });

    // Clear message
    await userEvent.click(canvas.getByTestId("quick-msg-3"));
    await waitFor(() => {
      expect(canvas.getByTestId("sync-message")).toHaveTextContent("(empty)");
    });
  },
};

/**
 * Error handling demo
 */
export const ErrorHandling: Story = {
  render: () => <ErrorHandlingDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useLocalStorage } from "@usefy/use-local-storage";
import { useState } from "react";

function ErrorHandlingExample() {
  const [errorLog, setErrorLog] = useState<string[]>([]);

  const handleError = (error: Error) => {
    setErrorLog((prev) => [
      ...prev,
      \`\${new Date().toLocaleTimeString()}: \${error.message}\`,
    ]);
  };

  const [value, setValue] = useLocalStorage("error-demo", "Normal value", {
    onError: handleError,
  });

  const simulateLargeValue = () => {
    try {
      const largeValue = "x".repeat(5 * 1024 * 1024); // 5MB
      setValue(largeValue);
    } catch {
      // Error will be handled by onError callback
    }
  };

  return (
    <div>
      <div>
        <label>Current Value:</label>
        <div>{value.length > 100 ? \`\${value.slice(0, 100)}...\` : value}</div>
      </div>
      <div>
        <button onClick={() => setValue("Normal value")}>Set Normal Value</button>
        <button onClick={simulateLargeValue}>Try Large Value (May Error)</button>
      </div>
      <div>
        <label>Error Log:</label>
        <div>
          {errorLog.length === 0 ? (
            <span>No errors yet</span>
          ) : (
            errorLog.map((log, i) => <div key={i}>{log}</div>)
          )}
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check initial state
    await expect(canvas.getByTestId("error-demo-value")).toHaveTextContent(
      "Normal value"
    );

    // Set normal value (should work)
    await userEvent.click(canvas.getByTestId("set-normal"));
    await waitFor(() => {
      expect(canvas.getByTestId("error-demo-value")).toHaveTextContent(
        "Normal value"
      );
    });
  },
};

/**
 * Same-tab component synchronization demo
 * Demonstrates how multiple components using the same key stay in sync
 */
export const ComponentSync: Story = {
  render: () => <ComponentSyncDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useLocalStorage } from "@usefy/use-local-storage";

function SyncedComponent({ name }: { name: string }) {
  const [count, setCount, resetCount] = useLocalStorage("shared-count", 0);

  return (
    <div>
      <h3>{name}</h3>
      <div>{count}</div>
      <div>
        <button onClick={() => setCount((c) => c - 1)}>-1</button>
        <button onClick={() => setCount((c) => c + 1)}>+1</button>
        <button onClick={() => setCount((c) => c + 10)}>+10</button>
        <button onClick={resetCount}>Reset</button>
      </div>
    </div>
  );
}

function ComponentSyncExample() {
  return (
    <div>
      <h2>Component Sync Demo</h2>
      <p>Multiple components using the same localStorage key automatically stay in sync</p>
      <SyncedComponent name="Component A" />
      <SyncedComponent name="Component B" />
      <SyncedComponent name="Component C" />
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

    // Get all value displays
    const valueA = canvas.getByTestId("sync-value-component-a");
    const valueB = canvas.getByTestId("sync-value-component-b");
    const valueC = canvas.getByTestId("sync-value-component-c");

    // First reset all to 0
    await userEvent.click(canvas.getByTestId("sync-reset-component-a"));
    await waitFor(() => {
      expect(valueA).toHaveTextContent("0");
      expect(valueB).toHaveTextContent("0");
      expect(valueC).toHaveTextContent("0");
    });

    // Click increment on Component A
    await userEvent.click(canvas.getByTestId("sync-increment-component-a"));
    await waitFor(() => {
      // All components should show 1
      expect(valueA).toHaveTextContent("1");
      expect(valueB).toHaveTextContent("1");
      expect(valueC).toHaveTextContent("1");
    });

    // Click +10 on Component B
    await userEvent.click(canvas.getByTestId("sync-add10-component-b"));
    await waitFor(() => {
      // All components should show 11
      expect(valueA).toHaveTextContent("11");
      expect(valueB).toHaveTextContent("11");
      expect(valueC).toHaveTextContent("11");
    });

    // Click decrement on Component C
    await userEvent.click(canvas.getByTestId("sync-decrement-component-c"));
    await waitFor(() => {
      // All components should show 10
      expect(valueA).toHaveTextContent("10");
      expect(valueB).toHaveTextContent("10");
      expect(valueC).toHaveTextContent("10");
    });

    // Reset from Component B
    await userEvent.click(canvas.getByTestId("sync-reset-component-b"));
    await waitFor(() => {
      // All components should show 0
      expect(valueA).toHaveTextContent("0");
      expect(valueB).toHaveTextContent("0");
      expect(valueC).toHaveTextContent("0");
    });
  },
};

/**
 * Custom serializer/deserializer demo
 * Shows how to store Date objects and custom types
 */
export const WithCustomSerializer: Story = {
  render: () => <CustomSerializerDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useLocalStorage } from "@usefy/use-local-storage";
import { useState } from "react";

function CustomSerializerExample() {
  // Date object storage with custom serializer/deserializer
  const [lastVisit, setLastVisit, removeLastVisit] = useLocalStorage<Date>(
    "last-visit-date",
    new Date(),
    {
      serializer: (date: Date) => date.toISOString(),
      deserializer: (str: string) => new Date(str),
    }
  );

  // Array storage with custom serializer/deserializer
  const [favoriteColors, setFavoriteColors, removeColors] = useLocalStorage<string[]>(
    "favorite-colors",
    [],
    {
      serializer: (colors: string[]) => colors.join(","),
      deserializer: (str: string) => (str ? str.split(",") : []),
    }
  );

  const [colorInput, setColorInput] = useState("");

  const addColor = () => {
    if (colorInput.trim()) {
      setFavoriteColors((prev) => [...prev, colorInput.trim()]);
      setColorInput("");
    }
  };

  const removeColor = (index: number) => {
    setFavoriteColors((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div>
        <h3>Date Object Storage</h3>
        <div>
          <p>Last Visit: {lastVisit.toLocaleDateString()}</p>
          <p>Time: {lastVisit.toLocaleTimeString()}</p>
          <p>ISO: {lastVisit.toISOString()}</p>
        </div>
        <button onClick={() => setLastVisit(new Date())}>Update to Now</button>
      </div>
      <div>
        <h3>Custom Array Storage (Comma-separated)</h3>
        <div>
          <input
            type="text"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            placeholder="Enter color name..."
            onKeyPress={(e) => {
              if (e.key === "Enter") addColor();
            }}
          />
          <button onClick={addColor}>Add</button>
        </div>
        <div>
          {favoriteColors.length === 0 ? (
            <span>No colors added yet</span>
          ) : (
            favoriteColors.map((color, index) => (
              <span key={index}>
                {color}
                <button onClick={() => removeColor(index)}>×</button>
              </span>
            ))
          )}
        </div>
        <button onClick={removeColors}>Clear All Colors</button>
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

    // Clear localStorage to ensure clean state
    localStorage.removeItem("last-visit-date");
    localStorage.removeItem("favorite-colors");

    // Update visit date
    await userEvent.click(canvas.getByTestId("update-visit-date"));
    await waitFor(() => {
      const display = canvas.getByTestId("last-visit-display");
      expect(display).toBeInTheDocument();
    });

    // First clear any existing colors
    const clearBtn = canvas.getByTestId("clear-colors");
    await userEvent.click(clearBtn);
    await waitFor(() => {
      expect(canvas.getByTestId("colors-list")).toHaveTextContent("No colors added yet");
    });

    // Add colors
    const colorInput = canvas.getByTestId("color-input");
    await userEvent.type(colorInput, "Red");
    await userEvent.click(canvas.getByTestId("add-color"));
    await waitFor(() => {
      expect(canvas.getByTestId("colors-list")).toHaveTextContent("Red");
    });

    await userEvent.type(colorInput, "Blue");
    await userEvent.click(canvas.getByTestId("add-color"));
    await waitFor(() => {
      expect(canvas.getByTestId("colors-list")).toHaveTextContent("Blue");
    });

    // Remove the first color (Red)
    await userEvent.click(canvas.getByTestId("remove-color-0"));
    await waitFor(() => {
      const colorsList = canvas.getByTestId("colors-list");
      // After removing Red, only Blue should remain
      expect(colorsList).toHaveTextContent("Blue");
      expect(colorsList).not.toHaveTextContent("Red×");
    });
  },
};

/**
 * syncTabs option demo
 * Shows the difference between syncTabs: true and syncTabs: false
 */
export const SyncTabsOption: Story = {
  render: () => <SyncTabsOptionDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useLocalStorage } from "@usefy/use-local-storage";

function SyncTabsOptionExample() {
  // syncTabs: true (default) - automatically syncs across tabs
  const [syncedValue, setSyncedValue] = useLocalStorage(
    "sync-tabs-enabled",
    "Tab sync ON",
    {
      syncTabs: true,
    }
  );

  // syncTabs: false - does not sync across tabs
  const [nonSyncedValue, setNonSyncedValue] = useLocalStorage(
    "sync-tabs-disabled",
    "Tab sync OFF",
    {
      syncTabs: false,
    }
  );

  return (
    <div>
      <h2>syncTabs Option Demo</h2>
      <div>
        <div>
          <h3>syncTabs: true (default)</h3>
          <p>Automatically syncs when changed in other tabs</p>
          <div>Value: {syncedValue}</div>
          <div>
            <button onClick={() => setSyncedValue("Updated from Tab 1")}>
              Update 1
            </button>
            <button onClick={() => setSyncedValue("Updated from Tab 2")}>
              Update 2
            </button>
            <button onClick={() => setSyncedValue("Tab sync ON")}>Reset</button>
          </div>
        </div>
        <div>
          <h3>syncTabs: false</h3>
          <p>Changes from other tabs are not reflected</p>
          <div>Value: {nonSyncedValue}</div>
          <div>
            <button onClick={() => setNonSyncedValue("Updated from Tab 1")}>
              Update 1
            </button>
            <button onClick={() => setNonSyncedValue("Updated from Tab 2")}>
              Update 2
            </button>
            <button onClick={() => setNonSyncedValue("Tab sync OFF")}>Reset</button>
          </div>
        </div>
      </div>
      <p>Open this page in multiple tabs to test the difference</p>
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

    // Test synced value
    await userEvent.click(canvas.getByTestId("synced-update-1"));
    await waitFor(() => {
      expect(canvas.getByTestId("synced-value")).toHaveTextContent(
        "Updated from Tab 1"
      );
    });

    // Test non-synced value
    await userEvent.click(canvas.getByTestId("non-synced-update-2"));
    await waitFor(() => {
      expect(canvas.getByTestId("non-synced-value")).toHaveTextContent(
        "Updated from Tab 2"
      );
    });

    // Reset both
    await userEvent.click(canvas.getByTestId("synced-reset"));
    await userEvent.click(canvas.getByTestId("non-synced-reset"));
    await waitFor(() => {
      expect(canvas.getByTestId("synced-value")).toHaveTextContent(
        "Tab sync ON"
      );
      expect(canvas.getByTestId("non-synced-value")).toHaveTextContent(
        "Tab sync OFF"
      );
    });
  },
};
