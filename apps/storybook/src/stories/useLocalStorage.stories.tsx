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
      <div className={storyTheme.card + " mb-6"}>
        <label className={storyTheme.label}>Stored Value:</label>
        <div
          data-testid="stored-value"
          className="text-lg font-mono bg-white p-3 rounded-lg border border-gray-200"
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
          className={storyTheme.input}
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
      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
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
      <div className={storyTheme.cardInfo + " mb-6"}>
        <h3 className="font-semibold text-gray-800 mb-4">Current Settings:</h3>
        <pre
          className="font-mono text-sm bg-white/50 p-4 rounded-lg overflow-auto"
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
      <div className={storyTheme.gradientBox + " mb-8"}>
        <div
          className="text-6xl font-bold text-white text-center"
          data-testid="counter-value"
        >
          {count}
        </div>
      </div>

      {/* Counter Controls */}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => setCount((c) => c - 1)}
          className={storyTheme.buttonSecondary}
          data-testid="decrement"
        >
          - Decrement
        </button>
        <button
          onClick={() => setCount((c) => c + 1)}
          className={storyTheme.buttonPrimary}
          data-testid="increment"
        >
          + Increment
        </button>
        <button
          onClick={resetCount}
          className={storyTheme.buttonNeutral}
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
            className={storyTheme.input}
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
            className={storyTheme.input}
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
            className={storyTheme.input}
            data-testid="email-input"
          />
        </div>
      </div>

      {/* Summary Card */}
      <div className={storyTheme.cardInfo}>
        <h3 className="font-semibold text-gray-800 mb-2">Saved Profile:</h3>
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
      <div className={storyTheme.card + " mb-6"}>
        <label className={storyTheme.label}>Current Message:</label>
        <div
          className="text-lg font-mono bg-white p-4 rounded-lg border border-gray-200 min-h-[60px]"
          data-testid="sync-message"
        >
          {message || "(empty)"}
        </div>
        {lastUpdate && (
          <p className="text-sm text-gray-500 mt-2">
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
      <div className={storyTheme.infoBox}>
        <p className={storyTheme.infoText}>
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
      <div className={storyTheme.card + " mb-6"}>
        <label className={storyTheme.label}>Current Value:</label>
        <div
          className="font-mono bg-white p-3 rounded-lg border border-gray-200 truncate"
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
      <div className={storyTheme.card}>
        <label className={storyTheme.label}>Error Log:</label>
        <div
          className="font-mono text-sm bg-red-50 p-3 rounded-lg border border-red-200 min-h-[100px] max-h-[200px] overflow-auto"
          data-testid="error-log"
        >
          {errorLog.length === 0 ? (
            <span className="text-gray-400">No errors yet</span>
          ) : (
            errorLog.map((log, i) => (
              <div key={i} className="text-red-600">
                {log}
              </div>
            ))
          )}
        </div>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check initial value is displayed
    await expect(canvas.getByTestId("stored-value")).toHaveTextContent(
      "Hello, World!"
    );

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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check initial settings
    const settingsDisplay = canvas.getByTestId("settings-display");
    await expect(settingsDisplay).toHaveTextContent('"theme": "light"');
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
