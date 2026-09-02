import React, { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTimeout } from "@usefy/use-timeout";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Demo component for useTimeout
 */
function TimeoutDemo({
  delay = 3000,
  title = "useTimeout Demo",
}: {
  delay?: number | null;
  title?: string;
}) {
  const [message, setMessage] = useState<string>("Waiting...");
  const [executed, setExecuted] = useState(false);

  const { reset, clear, isPending } = useTimeout(() => {
    setMessage("Timeout executed!");
    setExecuted(true);
  }, delay);

  const handleReset = () => {
    setMessage("Waiting...");
    setExecuted(false);
    reset();
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-2"}>{title}</h2>
      <p className={storyTheme.subtitle}>
        {delay !== null ? `Executes after ${delay}ms` : "Timer disabled"}
      </p>

      {/* Status Display */}
      <div
        data-testid="status-display"
        className={`p-8 mb-8 rounded-md text-center text-2xl font-bold transition-all duration-200 ${
          executed
            ? "bg-emerald-50 text-emerald-800 shadow-sm"
            : isPending
            ? "bg-amber-50 text-amber-800 shadow-sm"
            : "bg-zinc-50 text-zinc-600"
        }`}
      >
        <span data-testid="message">{message}</span>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span
          data-testid="pending-badge"
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isPending
              ? "bg-amber-100 text-amber-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {isPending ? "Pending..." : "Not Pending"}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleReset}
          aria-label="Reset timer"
          type="button"
          className={storyTheme.buttonPrimary + " w-full"}
        >
          Reset Timer
        </button>

        <button
          onClick={clear}
          disabled={!isPending}
          aria-label="Clear timer"
          type="button"
          className={`${storyTheme.buttonSecondary} w-full disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Clear Timer
        </button>
      </div>
    </div>
  );
}

/**
 * Auto-dismissing Toast Demo
 */
function ToastDemo() {
  const [show, setShow] = useState(true);

  const { isPending } = useTimeout(
    () => {
      setShow(false);
    },
    show ? 3000 : null
  );

  const handleShow = () => {
    setShow(true);
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-2"}>
        Auto-Dismiss Toast
      </h2>
      <p className={storyTheme.subtitle}>Toast disappears after 3 seconds</p>

      {show ? (
        <div
          data-testid="toast"
          className="p-6 mb-6 bg-violet-600 text-white rounded-md shadow-sm text-center"
        >
          This toast will disappear in 3 seconds!
        </div>
      ) : (
        <div
          data-testid="toast-dismissed"
          className="p-6 mb-6 bg-zinc-100 text-zinc-500 rounded-md text-center"
        >
          Toast dismissed
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-6">
        <span
          data-testid="toast-pending-badge"
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isPending
              ? "bg-amber-100 text-amber-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {isPending ? "Pending..." : "Not Pending"}
        </span>
      </div>

      <button
        onClick={handleShow}
        disabled={show}
        type="button"
        data-testid="show-toast-button"
        className={`${storyTheme.buttonPrimary} w-full disabled:opacity-50`}
      >
        Show Toast Again
      </button>
    </div>
  );
}

/**
 * Debounced Input Demo
 */
function DebouncedInputDemo() {
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { reset } = useTimeout(
    () => {
      setSavedValue(value);
      setIsSaving(false);
    },
    value ? 1000 : null
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setIsSaving(true);
    reset();
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-2"}>
        Debounced Auto-Save
      </h2>
      <p className={storyTheme.subtitle}>
        Saves 1 second after you stop typing
      </p>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Type something..."
        data-testid="debounced-input"
        className={storyTheme.input + " mb-4"}
      />

      <div className={storyTheme.statBox}>
        <div className="flex justify-between items-center">
          <span className="text-zinc-600">Status:</span>
          <span
            data-testid="save-status"
            className={isSaving ? "text-amber-600" : "text-emerald-600"}
          >
            {isSaving ? "Saving..." : "Saved"}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-zinc-200">
          <span className="text-zinc-600">Last saved: </span>
          <span data-testid="saved-value" className="font-mono">
            {savedValue || "(empty)"}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Delayed Redirect Demo
 */
function DelayedRedirectDemo() {
  const [countdown, setCountdown] = useState(5);
  const [redirected, setRedirected] = useState(false);

  const { clear, isPending } = useTimeout(
    () => {
      setRedirected(true);
    },
    redirected ? null : 5000
  );

  // Countdown effect using another timeout chain
  React.useEffect(() => {
    if (!isPending || redirected) return;

    const interval = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPending, redirected]);

  const handleCancel = () => {
    clear();
    setCountdown(5);
  };

  const handleReset = () => {
    setRedirected(false);
    setCountdown(5);
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-2"}>
        Delayed Redirect
      </h2>
      <p className={storyTheme.subtitle}>Simulates redirect after countdown</p>

      <div
        data-testid="redirect-status"
        className={`p-8 mb-8 rounded-md text-center transition-all duration-200 ${
          redirected
            ? "bg-emerald-50"
            : "bg-violet-50"
        }`}
      >
        {redirected ? (
          <>
            <div className="text-4xl mb-2">Redirected!</div>
            <div className="text-zinc-600">
              You would be on the dashboard now
            </div>
          </>
        ) : (
          <>
            <div
              data-testid="countdown"
              className="text-5xl font-bold text-violet-600 mb-2"
            >
              {countdown}
            </div>
            <div className="text-zinc-600">seconds until redirect</div>
          </>
        )}
      </div>

      {!redirected ? (
        <button
          onClick={handleCancel}
          disabled={!isPending}
          type="button"
          data-testid="cancel-redirect"
          className={`${storyTheme.buttonSecondary} w-full disabled:opacity-50`}
        >
          Cancel Redirect
        </button>
      ) : (
        <button
          onClick={handleReset}
          type="button"
          data-testid="reset-redirect"
          className={storyTheme.buttonPrimary + " w-full"}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Notification Queue Demo
 */
function NotificationDemo() {
  const [notification, setNotification] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const { reset, isPending } = useTimeout(
    () => {
      setNotification(null);
    },
    notification ? 3000 : null
  );

  const showNotification = useCallback(
    (message: string) => {
      setNotification(message);
      setCount((c) => c + 1);
      reset();
    },
    [reset]
  );

  const messages = [
    "New message received!",
    "File uploaded successfully!",
    "Settings saved!",
    "Connection established!",
  ];

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-2"}>
        Auto-Dismiss Notifications
      </h2>
      <p className={storyTheme.subtitle}>
        Notifications disappear after 3 seconds
      </p>

      {/* Notification Area */}
      <div className="h-24 mb-6 flex items-center justify-center">
        {notification ? (
          <div
            data-testid="notification"
            className="p-4 bg-violet-600 text-white rounded-md shadow-sm"
          >
            {notification}
          </div>
        ) : (
          <div className="text-zinc-400 italic">No notifications</div>
        )}
      </div>

      {/* Status */}
      <div className={storyTheme.statBox + " mb-6"}>
        <div className="flex justify-between items-center">
          <span className="text-zinc-600">Total shown:</span>
          <span data-testid="notification-count" className="font-bold">
            {count}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-zinc-600">Timer:</span>
          <span
            data-testid="notification-pending"
            className={isPending ? "text-amber-600" : "text-zinc-500"}
          >
            {isPending ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {messages.map((msg, idx) => (
          <button
            key={msg}
            onClick={() => showNotification(msg)}
            type="button"
            data-testid={`notify-button-${idx}`}
            className={storyTheme.buttonNeutral + " text-sm"}
          >
            Notify {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

const meta: Meta<typeof TimeoutDemo> = {
  title: "Hooks/useTimeout",
  component: TimeoutDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Declarative \`setTimeout\` for React — schedule a callback after a delay with automatic cleanup on unmount, a latest-callback ref (no stale closures), and \`reset\`/\`clear\` controls. Perfect for auto-dismiss toasts, debounced auto-save, delayed redirects, and conditional execution.

Pass a \`null\`/\`undefined\` delay to disable the timer, or a changing delay to auto-reset it. Returns \`{ reset, clear, isPending }\`.

## Features
- **Automatic cleanup** — the pending timeout is cleared on unmount, preventing "setState on unmounted component" leaks
- **Latest callback ref** — always fires the newest \`callback\` without re-scheduling the timer, so inline functions never go stale
- **Nullable delay** — \`null\`/\`undefined\` disables the timer; changing the delay auto-resets it (a negative delay is normalized to \`0\`)
- **\`reset()\`** — restart the countdown from the beginning (reads the current delay through a ref, so its identity stays stable)
- **\`clear()\`** — cancel the pending timeout so the callback never runs
- **\`isPending\`** — whether a timeout is currently scheduled (correct on the first committed render, SSR-safe)

## Basic Usage
\`\`\`tsx
import { useTimeout } from "@usefy/use-timeout";

function Toast({ message }: { message: string }) {
  const [show, setShow] = useState(true);

  // Auto-dismiss after 3s; reset() restarts it, clear() cancels it.
  const { reset, clear, isPending } = useTimeout(() => {
    setShow(false);
  }, show ? 3000 : null);

  return show ? <div className="toast">{message}</div> : null;
}
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    delay: {
      control: { type: "number", min: 0, step: 100 },
      description: "Delay in milliseconds (null to disable)",
      table: {
        type: { summary: "number | null" },
        defaultValue: { summary: "3000" },
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
type Story = StoryObj<typeof TimeoutDemo>;

/**
 * Default story with 3 second delay
 */
export const Default: Story = {
  args: {
    delay: 3000,
    title: "Basic Timeout",
  },
  parameters: {
    docs: {
      description: {
        story:
          "A 3-second timeout with live isPending status — clear it to cancel, or reset to restart the countdown.",
      },
      source: {
        code: `import { useTimeout } from "@usefy/use-timeout";

function TimeoutExample() {
  const [message, setMessage] = useState("Waiting...");

  const { reset, clear, isPending } = useTimeout(() => {
    setMessage("Timeout executed!");
  }, 3000);

  return (
    <div>
      <p>{message}</p>
      <p>Status: {isPending ? "Pending" : "Not Pending"}</p>
      <button onClick={reset}>Reset</button>
      <button onClick={clear} disabled={!isPending}>Clear</button>
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
    await expect(canvas.getByTestId("message")).toHaveTextContent("Waiting...");
    await expect(canvas.getByTestId("pending-badge")).toHaveTextContent(
      "Pending..."
    );

    // Clear the timer
    await userEvent.click(
      canvas.getByRole("button", { name: /clear timer/i })
    );
    await expect(canvas.getByTestId("pending-badge")).toHaveTextContent(
      "Not Pending"
    );

    // Reset the timer
    await userEvent.click(
      canvas.getByRole("button", { name: /reset timer/i })
    );
    await expect(canvas.getByTestId("pending-badge")).toHaveTextContent(
      "Pending..."
    );
    await expect(canvas.getByTestId("message")).toHaveTextContent("Waiting...");
  },
};

/**
 * Short timeout (1 second)
 */
export const ShortTimeout: Story = {
  args: {
    delay: 1000,
    title: "1 Second Timeout",
  },
  parameters: {
    docs: {
      description: {
        story:
          "A shorter 1-second delay for quick feedback — the callback fires almost immediately.",
      },
      source: {
        code: `import { useTimeout } from "@usefy/use-timeout";

function ShortTimeoutExample() {
  const [executed, setExecuted] = useState(false);

  useTimeout(() => {
    setExecuted(true);
  }, 1000); // 1 second

  return <div>{executed ? "Done!" : "Waiting..."}</div>;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};

/**
 * Disabled timer (null delay)
 */
export const DisabledTimer: Story = {
  args: {
    delay: null,
    title: "Disabled Timer",
  },
  parameters: {
    docs: {
      description: {
        story:
          "When delay is null, the timer is disabled and callback won't execute.",
      },
      source: {
        code: `import { useTimeout } from "@usefy/use-timeout";

function ConditionalTimeout({ isEnabled }: { isEnabled: boolean }) {
  useTimeout(() => {
    console.log("Executed!");
  }, isEnabled ? 3000 : null); // Disabled when null

  return <div>Timer is {isEnabled ? "enabled" : "disabled"}</div>;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Timer should not be pending when disabled
    await expect(canvas.getByTestId("pending-badge")).toHaveTextContent(
      "Not Pending"
    );
  },
};

/**
 * Auto-dismiss toast example
 */
export const AutoDismissToast: StoryObj<typeof ToastDemo> = {
  render: () => <ToastDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A toast notification that automatically disappears after 3 seconds.",
      },
      source: {
        code: `import { useTimeout } from "@usefy/use-timeout";

function Toast({ message }: { message: string }) {
  const [show, setShow] = useState(true);

  useTimeout(() => {
    setShow(false);
  }, show ? 3000 : null);

  return show ? <div className="toast">{message}</div> : null;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Toast should be visible initially
    await expect(canvas.getByTestId("toast")).toBeInTheDocument();
    await expect(canvas.getByTestId("toast-pending-badge")).toHaveTextContent(
      "Pending..."
    );
  },
};

/**
 * Debounced input example
 */
export const DebouncedInput: StoryObj<typeof DebouncedInputDemo> = {
  render: () => <DebouncedInputDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "An input field that auto-saves 1 second after you stop typing (debounced).",
      },
      source: {
        code: `import { useTimeout } from "@usefy/use-timeout";

function DebouncedInput() {
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState("");

  const { reset } = useTimeout(() => {
    saveToServer(value);
  }, value ? 1000 : null);

  const handleChange = (e) => {
    setValue(e.target.value);
    reset(); // Reset timer on every keystroke
  };

  return <input value={value} onChange={handleChange} />;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state
    await expect(canvas.getByTestId("save-status")).toHaveTextContent("Saved");
    await expect(canvas.getByTestId("saved-value")).toHaveTextContent(
      "(empty)"
    );

    // Type something
    const input = canvas.getByTestId("debounced-input");
    await userEvent.type(input, "Hello");

    // Should show saving status
    await expect(canvas.getByTestId("save-status")).toHaveTextContent(
      "Saving..."
    );

    // Wait for debounce to complete
    await waitFor(
      () => {
        expect(canvas.getByTestId("save-status")).toHaveTextContent("Saved");
      },
      { timeout: 2000 }
    );

    await expect(canvas.getByTestId("saved-value")).toHaveTextContent("Hello");
  },
};

/**
 * Delayed redirect example
 */
export const DelayedRedirect: StoryObj<typeof DelayedRedirectDemo> = {
  render: () => <DelayedRedirectDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Simulates a delayed redirect with countdown and cancel functionality.",
      },
      source: {
        code: `import { useTimeout } from "@usefy/use-timeout";
import { useNavigate } from "react-router-dom";

function DelayedRedirect() {
  const navigate = useNavigate();

  const { clear } = useTimeout(() => {
    navigate("/dashboard");
  }, 5000);

  return (
    <div>
      <p>Redirecting to dashboard in 5 seconds...</p>
      <button onClick={clear}>Cancel</button>
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

    // Initial state - should show countdown
    await expect(canvas.getByTestId("countdown")).toBeInTheDocument();

    // Cancel the redirect
    await userEvent.click(canvas.getByTestId("cancel-redirect"));

    // Countdown should stop (button becomes disabled)
    await expect(canvas.getByTestId("cancel-redirect")).toBeDisabled();
  },
};

/**
 * Notification queue example
 */
export const NotificationQueue: StoryObj<typeof NotificationDemo> = {
  render: () => <NotificationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Auto-dismissing notifications that can be triggered multiple times.",
      },
      source: {
        code: `import { useTimeout } from "@usefy/use-timeout";

function NotificationBanner() {
  const [notification, setNotification] = useState(null);

  const { reset } = useTimeout(() => {
    setNotification(null);
  }, notification ? 3000 : null);

  const showNotification = (message) => {
    setNotification(message);
    reset(); // Reset timer for new notification
  };

  return (
    <>
      {notification && <div>{notification}</div>}
      <button onClick={() => showNotification("Hello!")}>
        Show Notification
      </button>
    </>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state - no notification
    await expect(canvas.getByTestId("notification-count")).toHaveTextContent(
      "0"
    );
    await expect(canvas.getByTestId("notification-pending")).toHaveTextContent(
      "Inactive"
    );

    // Click first notify button
    await userEvent.click(canvas.getByTestId("notify-button-0"));

    // Should show notification
    await expect(canvas.getByTestId("notification")).toBeInTheDocument();
    await expect(canvas.getByTestId("notification-count")).toHaveTextContent(
      "1"
    );
    await expect(canvas.getByTestId("notification-pending")).toHaveTextContent(
      "Active"
    );

    // Click another notify button to replace notification
    await userEvent.click(canvas.getByTestId("notify-button-1"));
    await expect(canvas.getByTestId("notification-count")).toHaveTextContent(
      "2"
    );
  },
};

/**
 * Long timeout
 */
export const LongTimeout: Story = {
  args: {
    delay: 10000,
    title: "10 Second Timeout",
  },
  parameters: {
    docs: {
      description: {
        story: "A longer timeout demonstrating the clear functionality.",
      },
      source: {
        code: `import { useTimeout } from "@usefy/use-timeout";

function LongTimeoutExample() {
  const { clear, isPending } = useTimeout(() => {
    console.log("Finally executed after 10 seconds!");
  }, 10000);

  return (
    <div>
      <p>Status: {isPending ? "Waiting..." : "Done"}</p>
      <button onClick={clear} disabled={!isPending}>
        Cancel
      </button>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};
