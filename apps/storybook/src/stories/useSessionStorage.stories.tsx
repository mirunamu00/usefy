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
      <div className={storyTheme.cardInfo + " mb-6"}>
        <div className="flex justify-between items-center">
          <span className={storyTheme.statLabel}>Current Step:</span>
          <span className={storyTheme.statValue}>{formData.step} / 3</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
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
            className={storyTheme.input}
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
            className={storyTheme.input}
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
      <div className={storyTheme.card + " mt-6"}>
        <label className={storyTheme.label}>Session Data:</label>
        <pre
          className="font-mono text-sm bg-white/50 p-3 rounded-lg overflow-auto"
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
      <div className={storyTheme.cardInfo + " mb-6"}>
        <div className="text-center">
          <div className={storyTheme.statLabel}>Story Views This Session</div>
          <div
            className="text-4xl font-bold text-indigo-600 mt-2"
            data-testid="view-count"
          >
            {viewCount}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className={storyTheme.card}>
        <h3 className="font-semibold text-gray-800 mb-4">
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
      <div className={storyTheme.infoBox + " mt-6"}>
        <p className={storyTheme.infoText}>
          <strong>Tip:</strong> Use sessionStorage for temporary data that
          should be cleared when the user closes the tab, like form drafts or
          multi-step wizard progress.
        </p>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check view count is displayed
    await waitFor(() => {
      const viewCount = canvas.getByTestId("view-count");
      expect(parseInt(viewCount.textContent || "0")).toBeGreaterThan(0);
    });
  },
};
