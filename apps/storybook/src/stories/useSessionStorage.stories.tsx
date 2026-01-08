import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useSessionStorage } from "@usefy/use-session-storage";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Demo component for basic useSessionStorage usage
 */
function SessionStorageDemo({
  storageKey = "session-demo-value",
  initialValue = "Hello, Session!",
}: {
  storageKey?: string;
  initialValue?: string;
}) {
  const [value, setValue, removeValue] = useSessionStorage(
    storageKey,
    initialValue
  );
  const [inputValue, setInputValue] = useState("");

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useSessionStorage Demo</h2>
      <p className={storyTheme.subtitle}>
        Values persist during the browser session (cleared when tab closes)
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
          Save to Session
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
interface FormData {
  name: string;
  email: string;
  step: number;
}

function FormPersistenceDemo() {
  const [formData, setFormData, clearForm] = useSessionStorage<FormData>(
    "checkout-form",
    {
      name: "",
      email: "",
      step: 1,
    }
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Form Persistence Demo</h2>
      <p className={storyTheme.subtitle}>
        Form data persists during your session - refresh won't lose your
        progress!
      </p>

      {/* Progress Indicator */}
      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <div className="flex justify-between items-center">
          <span className={storyTheme.statText}>Current Step:</span>
          <span className={storyTheme.statValue + " font-bold"}>{formData.step} / 3</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(formData.step / 3) * 100}%` }}
            data-testid="progress-bar"
          />
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 mb-6">
        <div>
          <label className={storyTheme.label}>Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Your name"
            className={storyTheme.input + " w-full p-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"}
            data-testid="name-input"
          />
        </div>
        <div>
          <label className={storyTheme.label}>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="your@email.com"
            className={storyTheme.input + " w-full p-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"}
            data-testid="email-input"
          />
        </div>
      </div>

      {/* Step Controls */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              step: Math.max(1, prev.step - 1),
            }))
          }
          className={storyTheme.buttonNeutral}
          disabled={formData.step <= 1}
          data-testid="prev-step"
        >
          Previous Step
        </button>
        <button
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              step: Math.min(3, prev.step + 1),
            }))
          }
          className={storyTheme.buttonPrimary}
          disabled={formData.step >= 3}
          data-testid="next-step"
        >
          Next Step
        </button>
      </div>

      {/* Clear Button */}
      <button
        onClick={clearForm}
        className={storyTheme.buttonDanger}
        data-testid="clear-form"
      >
        Clear Form & Reset
      </button>

      {/* Current Data Display */}
      <div className={storyTheme.card + " mt-6 bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-800"}>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">📦 Session Data:</h3>
        <pre
          className="font-mono text-sm bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 overflow-auto text-slate-300"
          data-testid="form-data"
        >
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
}

/**
 * Demo component for counter
 */
function CounterDemo() {
  const [count, setCount, resetCount] = useSessionStorage("session-counter", 0);

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>Session Counter</h2>
      <p className={storyTheme.subtitle}>
        Counter persists during session, resets when tab closes
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
 * Demo explaining session behavior
 */
function SessionBehaviorDemo() {
  const [viewCount, setViewCount] = useSessionStorage("page-views", 0);

  // Increment on mount (simulating page view)
  React.useEffect(() => {
    setViewCount((c) => c + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Session Behavior</h2>
      <p className={storyTheme.subtitle}>
        Understanding the difference between localStorage and sessionStorage
      </p>

      {/* View Count */}
      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <div className="text-center">
          <div className={storyTheme.statText}>Story Views This Session</div>
          <div
            className="text-4xl font-bold text-indigo-600 mt-2"
            data-testid="view-count"
          >
            {viewCount}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className={storyTheme.card + " bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <h3 className="font-semibold text-slate-800 mb-4">
          localStorage vs sessionStorage
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium">Feature</th>
              <th className="text-left py-2 font-medium">localStorage</th>
              <th className="text-left py-2 font-medium">sessionStorage</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2">Persistence</td>
              <td className="py-2 text-green-600">Permanent</td>
              <td className="py-2 text-amber-600">Until tab closes</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2">Tab sharing</td>
              <td className="py-2 text-green-600">Shared across tabs</td>
              <td className="py-2 text-amber-600">Per-tab only</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2">Refresh survives</td>
              <td className="py-2 text-green-600">Yes</td>
              <td className="py-2 text-green-600">Yes</td>
            </tr>
            <tr>
              <td className="py-2">Use case</td>
              <td className="py-2">User preferences, themes</td>
              <td className="py-2">Form drafts, wizard steps</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tips */}
      <div className={storyTheme.infoBox + " mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          <strong>Tip:</strong> Use sessionStorage for temporary data that
          should be cleared when the user closes the tab, like form drafts or
          multi-step wizard progress.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for tab isolation info
 * Shows that sessionStorage is NOT shared across tabs
 */
function TabIsolationDemo() {
  const [message, setMessage] = useSessionStorage("tab-message", "");
  const [tabId] = useState(() => Math.random().toString(36).substring(2, 8));

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Tab Isolation Demo</h2>
      <p className={storyTheme.subtitle}>
        Unlike localStorage, sessionStorage is NOT shared between tabs
      </p>

      {/* Tab ID Display */}
      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <div className="text-center">
          <div className={storyTheme.statText}>This Tab's ID</div>
          <div
            className="text-2xl font-mono font-bold text-indigo-600 mt-2"
            data-testid="tab-id"
          >
            {tabId}
          </div>
        </div>
      </div>

      {/* Message Display */}
      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <label className={storyTheme.statLabel + " mb-2"}>Session Message:</label>
        <div
          className="text-lg font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[60px] text-slate-800"
          data-testid="tab-message"
        >
          {message || "(empty)"}
        </div>
      </div>

      {/* Quick Messages */}
      <div className="mb-6">
        <label className={storyTheme.label}>Set Message:</label>
        <div className="flex gap-2 flex-wrap">
          {[`Hello from ${tabId}`, "Tab-specific data", "Session only", ""].map(
            (msg, i) => (
              <button
                key={i}
                onClick={() => setMessage(msg)}
                className={storyTheme.buttonNeutral}
                data-testid={`tab-msg-${i}`}
              >
                {msg || "Clear"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Warning Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <p className="text-amber-800 text-sm leading-relaxed">
          <strong>⚠️ Important:</strong> Each browser tab has its own separate
          sessionStorage. Changes made here will NOT appear in other tabs!
        </p>
      </div>

      {/* Instructions */}
      <div className={storyTheme.infoBox + " bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          <strong>How to verify:</strong>
          <br />
          1. Open this page in another browser tab
          <br />
          2. Notice each tab has a different Tab ID
          <br />
          3. Set a message in one tab
          <br />
          4. The other tab will NOT see the change
          <br />
          <br />
          <strong>Use case:</strong> Perfect for form drafts, wizard steps, or
          any data that should be unique to each tab.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for same-tab component synchronization
 * Shows how multiple components using the same key stay in sync within the same tab
 */
function ComponentSyncDemo() {
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Component Sync Demo</h2>
      <p className={storyTheme.subtitle}>
        Multiple components using the same sessionStorage key automatically stay
        in sync within the same tab
      </p>

      {/* Two synchronized components side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <SyncedSessionComponent name="Component A" color="teal" />
        <SyncedSessionComponent name="Component B" color="orange" />
      </div>

      {/* Third component */}
      <div className="mb-6">
        <SyncedSessionComponent name="Component C" color="pink" />
      </div>

      {/* Info Box */}
      <div className={storyTheme.infoBox + " bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          <strong>How it works:</strong>
          <br />
          All three components use{" "}
          <code>useSessionStorage("session-shared-count", 0)</code>
          <br />
          When any component updates the value, all others update instantly!
          <br />
          <br />
          <strong>Note:</strong>
          <br />
          • Sync works within the same tab only
          <br />
          • Other tabs have their own separate sessionStorage
          <br />• Data is cleared when the tab is closed
        </p>
      </div>
    </div>
  );
}

/**
 * Individual synced component for the session storage demo
 */
function SyncedSessionComponent({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  const [count, setCount, resetCount] = useSessionStorage(
    "session-shared-count",
    0
  );

  const colorClasses = {
    teal: "bg-teal-500 hover:bg-teal-600 border-teal-600",
    orange: "bg-orange-500 hover:bg-orange-600 border-orange-600",
    pink: "bg-pink-500 hover:bg-pink-600 border-pink-600",
  };

  const borderColors = {
    teal: "border-teal-300",
    orange: "border-orange-300",
    pink: "border-pink-300",
  };

  const bgColors = {
    teal: "bg-teal-50",
    orange: "bg-orange-50",
    pink: "bg-pink-50",
  };

  return (
    <div
      className={`p-8 rounded-2xl border-2 ${
        borderColors[color as keyof typeof borderColors]
      } ${bgColors[color as keyof typeof bgColors]}`}
      data-testid={`session-sync-component-${name
        .toLowerCase()
        .replace(" ", "-")}`}
    >
      <h3 className="font-semibold text-slate-800 mb-4 text-center">{name}</h3>

      {/* Count Display */}
      <div
        className="text-4xl font-bold text-center mb-4 py-3 bg-white rounded-lg shadow-sm"
        data-testid={`session-sync-value-${name
          .toLowerCase()
          .replace(" ", "-")}`}
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
          data-testid={`session-sync-decrement-${name
            .toLowerCase()
            .replace(" ", "-")}`}
        >
          -1
        </button>
        <button
          onClick={() => setCount((c) => c + 1)}
          className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
          data-testid={`session-sync-increment-${name
            .toLowerCase()
            .replace(" ", "-")}`}
        >
          +1
        </button>
        <button
          onClick={() => setCount((c) => c + 10)}
          className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
          data-testid={`session-sync-add10-${name
            .toLowerCase()
            .replace(" ", "-")}`}
        >
          +10
        </button>
        <button
          onClick={resetCount}
          className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors"
          data-testid={`session-sync-reset-${name
            .toLowerCase()
            .replace(" ", "-")}`}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// Meta configuration
const meta: Meta<typeof SessionStorageDemo> = {
  title: "Hooks/useSessionStorage",
  component: SessionStorageDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A hook for persisting state in sessionStorage. Works like useState but values persist during the browser session and are cleared when the tab/window is closed.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    storageKey: {
      control: "text",
      description: "The sessionStorage key to store the value under",
      table: {
        type: { summary: "string" },
      },
    },
    initialValue: {
      control: "text",
      description: "Initial value when sessionStorage is empty",
      table: {
        type: { summary: "T | (() => T)" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SessionStorageDemo>;

/**
 * Basic string storage demo
 */
export const Default: Story = {
  args: {
    storageKey: "session-demo-value",
    initialValue: "Hello, Session!",
  },
  parameters: {
    docs: {
      source: {
        code: `import { useSessionStorage } from "@usefy/use-session-storage";
import { useState } from "react";

function SessionStorageExample() {
  const [value, setValue, removeValue] = useSessionStorage("session-demo-value", "Hello, Session!");
  const [inputValue, setInputValue] = useState("");

  return (
    <div>
      <h2>useSessionStorage Demo</h2>
      <p>Values persist during the browser session (cleared when tab closes)</p>
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
          Save to Session
        </button>
        <button onClick={removeValue}>Remove Value</button>
      </div>
      <p>Storage Key: session-demo-value</p>
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

    // Type new value
    const input = canvas.getByTestId("value-input");
    await userEvent.clear(input);
    await userEvent.type(input, "Session Value");

    // Save the value
    await userEvent.click(canvas.getByTestId("save-button"));

    // Check the value is updated
    await waitFor(() => {
      expect(canvas.getByTestId("stored-value")).toHaveTextContent(
        "Session Value"
      );
    });

    // Check input is cleared
    await expect(input).toHaveValue("");
  },
};

/**
 * Form persistence demo
 */
export const FormPersistence: Story = {
  render: () => <FormPersistenceDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSessionStorage } from "@usefy/use-session-storage";

interface FormData {
  name: string;
  email: string;
  step: number;
}

function FormPersistenceExample() {
  const [formData, setFormData, clearForm] = useSessionStorage<FormData>(
    "checkout-form",
    {
      name: "",
      email: "",
      step: 1,
    }
  );

  return (
    <div>
      <h2>Form Persistence Demo</h2>
      <p>Form data persists during your session - refresh won't lose your progress!</p>
      <div>
        <p>Current Step: {formData.step} / 3</p>
        <div style={{ width: "100%", background: "#e5e7eb", height: "8px", borderRadius: "9999px" }}>
          <div
            style={{
              background: "#4f46e5",
              height: "8px",
              borderRadius: "9999px",
              width: \`\${(formData.step / 3) * 100}%\`,
            }}
          />
        </div>
      </div>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Your name"
        />
      </div>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="your@email.com"
        />
      </div>
      <div>
        <button
          onClick={() => setFormData((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }))}
          disabled={formData.step <= 1}
        >
          Previous Step
        </button>
        <button
          onClick={() => setFormData((prev) => ({ ...prev, step: Math.min(3, prev.step + 1) }))}
          disabled={formData.step >= 3}
        >
          Next Step
        </button>
      </div>
      <button onClick={clearForm}>Clear Form & Reset</button>
      <div>
        <label>Session Data:</label>
        <pre>{JSON.stringify(formData, null, 2)}</pre>
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

    // First, reset form to initial state
    await userEvent.click(canvas.getByTestId("clear-form"));
    await waitFor(() => {
      expect(canvas.getByTestId("form-data")).toHaveTextContent('"step": 1');
      expect(canvas.getByTestId("form-data")).toHaveTextContent('"name": ""');
    });

    // Fill in form
    await userEvent.type(canvas.getByTestId("name-input"), "John Doe");
    await userEvent.type(canvas.getByTestId("email-input"), "john@example.com");

    // Check form data is updated
    await waitFor(() => {
      expect(canvas.getByTestId("form-data")).toHaveTextContent("John Doe");
      expect(canvas.getByTestId("form-data")).toHaveTextContent(
        "john@example.com"
      );
    });

    // Navigate steps
    await userEvent.click(canvas.getByTestId("next-step"));
    await waitFor(() => {
      expect(canvas.getByTestId("form-data")).toHaveTextContent('"step": 2');
    });
  },
};

/**
 * Counter demo
 */
export const WithCounter: Story = {
  render: () => <CounterDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSessionStorage } from "@usefy/use-session-storage";

function SessionCounter() {
  const [count, setCount, resetCount] = useSessionStorage("session-counter", 0);

  return (
    <div>
      <h2>Session Counter</h2>
      <p>Counter persists during session, resets when tab closes</p>
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

    const counterValue = canvas.getByTestId("counter-value");
    const initialValue = parseInt(counterValue.textContent || "0");

    // Increment
    await userEvent.click(canvas.getByTestId("increment"));
    await waitFor(() => {
      expect(counterValue).toHaveTextContent(String(initialValue + 1));
    });

    // Decrement
    await userEvent.click(canvas.getByTestId("decrement"));
    await waitFor(() => {
      expect(counterValue).toHaveTextContent(String(initialValue));
    });

    // Reset
    await userEvent.click(canvas.getByTestId("reset-counter"));
    await waitFor(() => {
      expect(counterValue).toHaveTextContent("0");
    });
  },
};

/**
 * Session behavior explanation
 */
export const SessionBehavior: Story = {
  render: () => <SessionBehaviorDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSessionStorage } from "@usefy/use-session-storage";
import { useEffect } from "react";

function SessionBehaviorExample() {
  const [viewCount, setViewCount] = useSessionStorage("page-views", 0);

  // Increment on mount (simulating page view)
  useEffect(() => {
    setViewCount((c) => c + 1);
  }, []);

  return (
    <div>
      <h2>Session Behavior</h2>
      <p>Understanding the difference between localStorage and sessionStorage</p>
      <div>
        <p>Story Views This Session</p>
        <div>{viewCount}</div>
      </div>
      <div>
        <h3>localStorage vs sessionStorage</h3>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>localStorage</th>
              <th>sessionStorage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Persistence</td>
              <td>Permanent</td>
              <td>Until tab closes</td>
            </tr>
            <tr>
              <td>Tab sharing</td>
              <td>Shared across tabs</td>
              <td>Per-tab only</td>
            </tr>
            <tr>
              <td>Refresh survives</td>
              <td>Yes</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Use case</td>
              <td>User preferences, themes</td>
              <td>Form drafts, wizard steps</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <strong>Tip:</strong> Use sessionStorage for temporary data that should be cleared
        when the user closes the tab, like form drafts or multi-step wizard progress.
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

    // Check view count is displayed
    await waitFor(() => {
      const viewCount = canvas.getByTestId("view-count");
      expect(parseInt(viewCount.textContent || "0")).toBeGreaterThan(0);
    });
  },
};

/**
 * Tab isolation demo - shows that sessionStorage is NOT shared across tabs
 */
export const TabIsolation: Story = {
  render: () => <TabIsolationDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useSessionStorage } from "@usefy/use-session-storage";
import { useState } from "react";

function TabIsolationExample() {
  const [message, setMessage] = useSessionStorage("tab-message", "");
  const [tabId] = useState(() => Math.random().toString(36).substring(2, 8));

  return (
    <div>
      <h2>Tab Isolation Demo</h2>
      <p>Unlike localStorage, sessionStorage is NOT shared between tabs</p>
      <div>
        <p>This Tab's ID</p>
        <div>{tabId}</div>
      </div>
      <div>
        <label>Session Message:</label>
        <div>{message || "(empty)"}</div>
      </div>
      <div>
        <label>Set Message:</label>
        <div>
          <button onClick={() => setMessage(\`Hello from \${tabId}\`)}>
            Hello from {tabId}
          </button>
          <button onClick={() => setMessage("Tab-specific data")}>
            Tab-specific data
          </button>
          <button onClick={() => setMessage("Session only")}>Session only</button>
          <button onClick={() => setMessage("")}>Clear</button>
        </div>
      </div>
      <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "1rem", borderRadius: "0.5rem" }}>
        <p>
          <strong>⚠️ Important:</strong> Each browser tab has its own separate sessionStorage.
          Changes made here will NOT appear in other tabs!
        </p>
      </div>
      <p>
        <strong>How to verify:</strong>
        <br />
        1. Open this page in another browser tab
        <br />
        2. Notice each tab has a different Tab ID
        <br />
        3. Set a message in one tab
        <br />
        4. The other tab will NOT see the change
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

    // Check tab ID is displayed
    await expect(canvas.getByTestId("tab-id")).toBeInTheDocument();

    // Click first message button
    await userEvent.click(canvas.getByTestId("tab-msg-0"));
    await waitFor(() => {
      const message = canvas.getByTestId("tab-message");
      expect(message.textContent).toContain("Hello from");
    });

    // Click clear button
    await userEvent.click(canvas.getByTestId("tab-msg-3"));
    await waitFor(() => {
      expect(canvas.getByTestId("tab-message")).toHaveTextContent("(empty)");
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
        code: `import { useSessionStorage } from "@usefy/use-session-storage";

function SyncedSessionComponent({ name }: { name: string }) {
  const [count, setCount, resetCount] = useSessionStorage("session-shared-count", 0);

  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: "2px solid #14b8a6", background: "#f0fdfa" }}>
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
      <p>
        Multiple components using the same sessionStorage key automatically stay
        in sync within the same tab
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <SyncedSessionComponent name="Component A" />
        <SyncedSessionComponent name="Component B" />
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <SyncedSessionComponent name="Component C" />
      </div>
      <p>
        <strong>How it works:</strong>
        <br />
        All three components use useSessionStorage("session-shared-count", 0)
        <br />
        When any component updates the value, all others update instantly!
        <br />
        <br />
        <strong>Note:</strong>
        <br />
        • Sync works within the same tab only
        <br />
        • Other tabs have their own separate sessionStorage
        <br />
        • Data is cleared when the tab is closed
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

    // Get all value displays
    const valueA = canvas.getByTestId("session-sync-value-component-a");
    const valueB = canvas.getByTestId("session-sync-value-component-b");
    const valueC = canvas.getByTestId("session-sync-value-component-c");

    // First reset all to 0
    await userEvent.click(canvas.getByTestId("session-sync-reset-component-a"));
    await waitFor(() => {
      expect(valueA).toHaveTextContent("0");
      expect(valueB).toHaveTextContent("0");
      expect(valueC).toHaveTextContent("0");
    });

    // Click increment on Component A
    await userEvent.click(
      canvas.getByTestId("session-sync-increment-component-a")
    );
    await waitFor(() => {
      // All components should show 1
      expect(valueA).toHaveTextContent("1");
      expect(valueB).toHaveTextContent("1");
      expect(valueC).toHaveTextContent("1");
    });

    // Click +10 on Component B
    await userEvent.click(canvas.getByTestId("session-sync-add10-component-b"));
    await waitFor(() => {
      // All components should show 11
      expect(valueA).toHaveTextContent("11");
      expect(valueB).toHaveTextContent("11");
      expect(valueC).toHaveTextContent("11");
    });

    // Click decrement on Component C
    await userEvent.click(
      canvas.getByTestId("session-sync-decrement-component-c")
    );
    await waitFor(() => {
      // All components should show 10
      expect(valueA).toHaveTextContent("10");
      expect(valueB).toHaveTextContent("10");
      expect(valueC).toHaveTextContent("10");
    });

    // Reset from Component B
    await userEvent.click(canvas.getByTestId("session-sync-reset-component-b"));
    await waitFor(() => {
      // All components should show 0
      expect(valueA).toHaveTextContent("0");
      expect(valueB).toHaveTextContent("0");
      expect(valueC).toHaveTextContent("0");
    });
  },
};
