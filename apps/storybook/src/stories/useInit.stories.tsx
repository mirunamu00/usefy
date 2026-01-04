import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { useInit } from "@usefy/use-init";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * 1. Basic Sync Initialization Demo
 */
function BasicSyncDemo() {
  const [logs, setLogs] = useState<string[]>([]);

  const { isInitialized, isInitializing } = useInit(() => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Component initialized!`,
    ]);
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Basic Sync Initialization</h2>
      <p className={storyTheme.subtitle}>
        The callback runs once when the component mounts.
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Status:</strong>{" "}
          <span
            data-testid="status"
            className={
              isInitialized
                ? "text-green-600 font-bold"
                : isInitializing
                  ? "text-yellow-600 font-bold"
                  : "text-gray-500"
            }
          >
            {isInitializing
              ? "Initializing..."
              : isInitialized
                ? "Initialized"
                : "Not Started"}
          </span>
        </div>
      </div>

      <div className={storyTheme.card}>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Initialization Logs:
        </h3>
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">No logs yet...</p>
        ) : (
          <ul className="list-none p-0 m-0">
            {logs.map((log, index) => (
              <li key={index} className="font-mono text-sm text-gray-600 mb-1">
                {log}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * 2. Async Initialization Demo
 */
function AsyncInitDemo() {
  const [data, setData] = useState<{ message: string } | null>(null);

  const { isInitialized, isInitializing, error } = useInit(async () => {
    // Simulate async data loading
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setData({ message: "Data loaded successfully!" });
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Async Initialization</h2>
      <p className={storyTheme.subtitle}>
        Shows loading state during async initialization.
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>isInitializing:</strong>{" "}
          <span
            data-testid="is-initializing"
            className={storyTheme.statValue}
          >
            {isInitializing ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>isInitialized:</strong>{" "}
          <span
            data-testid="is-initialized"
            className={storyTheme.statValue}
          >
            {isInitialized ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>error:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {error ? error.message : "null"}
          </span>
        </div>
      </div>

      {isInitializing && (
        <div className={storyTheme.cardInfo + " text-center"}>
          <p className="text-indigo-600 font-semibold m-0">Loading data...</p>
        </div>
      )}

      {isInitialized && data && (
        <div className={storyTheme.messageSuccess}>
          <p className="m-0">{data.message}</p>
        </div>
      )}
    </div>
  );
}

/**
 * 3. Conditional Initialization Demo
 */
function ConditionalInitDemo() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [initCount, setInitCount] = useState(0);

  const { isInitialized, isInitializing } = useInit(
    () => {
      setInitCount((prev) => prev + 1);
    },
    { when: isEnabled }
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Conditional Initialization</h2>
      <p className={storyTheme.subtitle}>
        Initialization only runs when the condition is true. Toggle to enable.
      </p>

      <button
        data-testid="toggle-btn"
        onClick={() => setIsEnabled((prev) => !prev)}
        className={isEnabled ? storyTheme.buttonSuccess : storyTheme.buttonDanger}
      >
        {isEnabled ? "Enabled" : "Disabled"}
      </button>

      <div className={storyTheme.statBox + " mt-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>when:</strong>{" "}
          <span data-testid="when-value" className={storyTheme.statValue}>
            {isEnabled ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>isInitialized:</strong>{" "}
          <span data-testid="is-initialized" className={storyTheme.statValue}>
            {isInitialized ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>isInitializing:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {isInitializing ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Init Count:</strong>{" "}
          <span data-testid="init-count" className={storyTheme.statValue}>
            {initCount}
          </span>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-5"}>
        <p className={storyTheme.infoText}>
          The initialization will run when you enable the toggle. It won't run
          again on subsequent toggles since it has already been initialized.
        </p>
      </div>
    </div>
  );
}

/**
 * 4. Retry Demo
 */
function RetryDemo() {
  const [attemptCount, setAttemptCount] = useState(0);
  const [shouldFail, setShouldFail] = useState(true);

  const { isInitialized, isInitializing, error, reinitialize } = useInit(
    async () => {
      setAttemptCount((prev) => prev + 1);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (shouldFail && attemptCount < 2) {
        throw new Error(`Attempt ${attemptCount + 1} failed!`);
      }
    },
    { retry: 2, retryDelay: 1000 }
  );

  const handleReset = () => {
    setAttemptCount(0);
    setShouldFail(true);
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Retry on Failure</h2>
      <p className={storyTheme.subtitle}>
        Automatically retries initialization on failure. This demo fails the
        first 2 attempts then succeeds.
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Attempt:</strong>{" "}
          <span data-testid="attempt-count" className={storyTheme.statValue}>
            {attemptCount}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>isInitializing:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {isInitializing ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>isInitialized:</strong>{" "}
          <span data-testid="is-initialized" className={storyTheme.statValue}>
            {isInitialized ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>error:</strong>{" "}
          <span
            data-testid="error-message"
            className={error ? "text-red-500" : "text-gray-500"}
          >
            {error ? error.message : "null"}
          </span>
        </div>
      </div>

      {isInitialized && (
        <div className={storyTheme.messageSuccess + " mb-5"}>
          Initialization succeeded after {attemptCount} attempts!
        </div>
      )}

      <div className={storyTheme.buttonGroup}>
        <button
          data-testid="reset-btn"
          onClick={handleReset}
          className={storyTheme.buttonNeutral}
        >
          Reset
        </button>
        <button
          data-testid="reinit-btn"
          onClick={reinitialize}
          className={storyTheme.buttonPrimary}
        >
          Reinitialize
        </button>
      </div>
    </div>
  );
}

/**
 * 5. Timeout Demo
 */
function TimeoutDemo() {
  const [duration, setDuration] = useState(2000);
  const [key, setKey] = useState(0);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Timeout</h2>
      <p className={storyTheme.subtitle}>
        Set a timeout for initialization. If it takes too long, an error is
        thrown.
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Operation Duration:</strong>{" "}
          <span className={storyTheme.statValue}>{duration}ms</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Timeout:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>1000ms</span>
        </div>
      </div>

      <div className={storyTheme.buttonGroupFull}>
        <button
          data-testid="fast-btn"
          onClick={() => {
            setDuration(500);
            setKey((k) => k + 1);
          }}
          className={storyTheme.buttonSuccess}
        >
          Fast (500ms)
        </button>
        <button
          data-testid="slow-btn"
          onClick={() => {
            setDuration(2000);
            setKey((k) => k + 1);
          }}
          className={storyTheme.buttonDanger}
        >
          Slow (2000ms)
        </button>
      </div>

      <TimeoutChild key={key} duration={duration} />
    </div>
  );
}

function TimeoutChild({ duration }: { duration: number }) {
  const { isInitialized, isInitializing, error } = useInit(
    async () => {
      await new Promise((resolve) => setTimeout(resolve, duration));
    },
    { timeout: 1000 }
  );

  return (
    <div className={storyTheme.card}>
      <div className={storyTheme.statLabel}>
        <strong className={storyTheme.statText}>isInitializing:</strong>{" "}
        <span data-testid="is-initializing" className={storyTheme.statValue}>
          {isInitializing ? "true" : "false"}
        </span>
      </div>
      <div className={storyTheme.statLabel}>
        <strong className={storyTheme.statText}>isInitialized:</strong>{" "}
        <span data-testid="is-initialized" className={storyTheme.statValue}>
          {isInitialized ? "true" : "false"}
        </span>
      </div>
      <div className={storyTheme.statLabel}>
        <strong className={storyTheme.statText}>error:</strong>{" "}
        <span
          data-testid="error-message"
          className={error ? "text-red-500" : "text-gray-500"}
        >
          {error ? error.message : "null"}
        </span>
      </div>

      {isInitialized && (
        <div className={storyTheme.messageSuccess + " mt-3"}>
          Completed within timeout!
        </div>
      )}

      {error && (
        <div className={storyTheme.messageError + " mt-3"}>
          Operation timed out!
        </div>
      )}
    </div>
  );
}

/**
 * 6. Reinitialize Demo
 */
function ReinitializeDemo() {
  const [initCount, setInitCount] = useState(0);
  const [lastInitTime, setLastInitTime] = useState<Date | null>(null);

  const { isInitialized, isInitializing, reinitialize } = useInit(() => {
    setInitCount((prev) => prev + 1);
    setLastInitTime(new Date());
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Manual Reinitialize</h2>
      <p className={storyTheme.subtitle}>
        Use the reinitialize function to manually trigger initialization again.
      </p>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Init Count:</strong>{" "}
          <span data-testid="init-count" className={storyTheme.statValue}>
            {initCount}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Last Init:</strong>{" "}
          <span
            data-testid="last-init-time"
            className={storyTheme.statTextSecondary}
          >
            {lastInitTime ? lastInitTime.toLocaleTimeString() : "Never"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>isInitialized:</strong>{" "}
          <span data-testid="is-initialized" className={storyTheme.statValue}>
            {isInitialized ? "true" : "false"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>isInitializing:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {isInitializing ? "true" : "false"}
          </span>
        </div>
      </div>

      <button
        data-testid="reinit-btn"
        onClick={reinitialize}
        className={storyTheme.buttonPrimary}
      >
        Reinitialize
      </button>
    </div>
  );
}

/**
 * 7. Cleanup Demo
 */
function CleanupDemo() {
  const [mounted, setMounted] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Cleanup Function</h2>
      <p className={storyTheme.subtitle}>
        The cleanup function is called when the component unmounts.
      </p>

      <button
        data-testid="toggle-mount-btn"
        onClick={() => setMounted((prev) => !prev)}
        className={mounted ? storyTheme.buttonDanger : storyTheme.buttonSuccess}
      >
        {mounted ? "Unmount Component" : "Mount Component"}
      </button>

      <div className={storyTheme.card + " mt-5"}>
        {mounted && <CleanupChild addLog={addLog} />}
        {!mounted && (
          <p className="text-gray-500 italic m-0">Component is unmounted</p>
        )}
      </div>

      <div className={storyTheme.statBox + " mt-5"}>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500 italic m-0">No logs yet...</p>
        ) : (
          <ul className="list-none p-0 m-0 max-h-40 overflow-auto">
            {logs.map((log, index) => (
              <li
                key={index}
                data-testid={`log-${index}`}
                className="font-mono text-sm text-gray-600 mb-1"
              >
                {log}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CleanupChild({ addLog }: { addLog: (message: string) => void }) {
  useInit(() => {
    addLog("Component initialized - subscription started");

    return () => {
      addLog("Cleanup called - subscription stopped");
    };
  });

  return (
    <div className={storyTheme.messageSuccess}>
      <p className="m-0">Component is mounted and initialized</p>
    </div>
  );
}

/**
 * Meta & Stories
 */
const meta = {
  title: "Hooks/useInit",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A React hook for one-time initialization with async support, retry, timeout, and conditional execution. Perfect for component setup, data fetching on mount, and resource initialization.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicSync: Story = {
  render: () => <BasicSyncDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Basic synchronous initialization that runs once when the component mounts.",
      },
      source: {
        code: `import { useInit } from "@usefy/use-init";

function MyComponent() {
  const { isInitialized, isInitializing } = useInit(() => {
    console.log("Component initialized!");
  });

  return (
    <div>
      {isInitializing && <p>Initializing...</p>}
      {isInitialized && <p>Ready!</p>}
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

    // Wait for initialization to complete
    await waitFor(
      async () => {
        await expect(canvas.getByTestId("status")).toHaveTextContent(
          "Initialized"
        );
      },
      { timeout: 1000 }
    );
  },
};

export const AsyncInit: Story = {
  render: () => <AsyncInitDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Async initialization with loading state tracking. The hook provides isInitializing to show loading UI.",
      },
      source: {
        code: `import { useInit } from "@usefy/use-init";

function MyComponent() {
  const [data, setData] = useState(null);

  const { isInitialized, isInitializing, error } = useInit(async () => {
    const response = await fetch('/api/data');
    const result = await response.json();
    setData(result);
  });

  if (isInitializing) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (isInitialized) return <div>{JSON.stringify(data)}</div>;

  return null;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially should be initializing
    await expect(canvas.getByTestId("is-initializing")).toHaveTextContent(
      "true"
    );

    // Wait for initialization to complete
    await waitFor(
      async () => {
        await expect(canvas.getByTestId("is-initialized")).toHaveTextContent(
          "true"
        );
      },
      { timeout: 2000 }
    );

    await expect(canvas.getByTestId("is-initializing")).toHaveTextContent(
      "false"
    );
  },
};

export const ConditionalInit: Story = {
  render: () => <ConditionalInitDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Conditional initialization with the `when` option. Initialization only runs when the condition is true.",
      },
      source: {
        code: `import { useInit } from "@usefy/use-init";

function MyComponent({ isProduction }) {
  const { isInitialized } = useInit(
    () => {
      initializeAnalytics();
    },
    { when: isProduction }
  );

  return <div>Analytics: {isInitialized ? 'Active' : 'Inactive'}</div>;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially should not be initialized
    await expect(canvas.getByTestId("is-initialized")).toHaveTextContent(
      "false"
    );
    await expect(canvas.getByTestId("init-count")).toHaveTextContent("0");

    // Toggle to enable
    await userEvent.click(canvas.getByTestId("toggle-btn"));

    // Should now be initialized
    await waitFor(async () => {
      await expect(canvas.getByTestId("is-initialized")).toHaveTextContent(
        "true"
      );
      await expect(canvas.getByTestId("init-count")).toHaveTextContent("1");
    });

    // Toggle again - should not increment
    await userEvent.click(canvas.getByTestId("toggle-btn"));
    await userEvent.click(canvas.getByTestId("toggle-btn"));

    await expect(canvas.getByTestId("init-count")).toHaveTextContent("1");
  },
};

export const RetryOnFailure: Story = {
  render: () => <RetryDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Automatic retry on failure with configurable retry count and delay.",
      },
      source: {
        code: `import { useInit } from "@usefy/use-init";

function MyComponent() {
  const { isInitialized, error, reinitialize } = useInit(
    async () => {
      const response = await fetch('/api/connect');
      if (!response.ok) throw new Error('Connection failed');
    },
    { retry: 3, retryDelay: 1000 }
  );

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={reinitialize}>Try Again</button>
      </div>
    );
  }

  return <div>{isInitialized ? 'Connected' : 'Connecting...'}</div>;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for all retries to complete (3 attempts, 2 fails + 1 success)
    await waitFor(
      async () => {
        await expect(canvas.getByTestId("is-initialized")).toHaveTextContent(
          "true"
        );
      },
      { timeout: 5000 }
    );

    // Should have made 3 attempts
    await expect(canvas.getByTestId("attempt-count")).toHaveTextContent("3");
  },
};

export const Timeout: Story = {
  render: () => <TimeoutDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Set a timeout for initialization. If the operation takes too long, an error is thrown.",
      },
      source: {
        code: `import { useInit } from "@usefy/use-init";

function MyComponent() {
  const { isInitialized, error } = useInit(
    async () => {
      await heavyOperation();
    },
    { timeout: 5000 }
  );

  if (error) return <p>Operation timed out!</p>;
  return <div>{isInitialized ? 'Ready' : 'Loading...'}</div>;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Default is slow (2000ms) which should timeout (1000ms timeout)
    await waitFor(
      async () => {
        await expect(canvas.getByTestId("error-message")).not.toHaveTextContent(
          "null"
        );
      },
      { timeout: 2000 }
    );

    // Click fast button
    await userEvent.click(canvas.getByTestId("fast-btn"));

    // Should succeed this time
    await waitFor(
      async () => {
        await expect(canvas.getByTestId("is-initialized")).toHaveTextContent(
          "true"
        );
      },
      { timeout: 1500 }
    );
  },
};

export const Reinitialize: Story = {
  render: () => <ReinitializeDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Use the reinitialize function to manually trigger initialization again.",
      },
      source: {
        code: `import { useInit } from "@usefy/use-init";

function MyComponent() {
  const { isInitialized, reinitialize } = useInit(() => {
    refreshData();
  });

  return (
    <div>
      <p>{isInitialized ? 'Data loaded' : 'Loading...'}</p>
      <button onClick={reinitialize}>Refresh</button>
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

    // Wait for initial initialization
    await waitFor(async () => {
      await expect(canvas.getByTestId("init-count")).toHaveTextContent("1");
    });

    // Click reinitialize
    await userEvent.click(canvas.getByTestId("reinit-btn"));

    // Should increment
    await waitFor(async () => {
      await expect(canvas.getByTestId("init-count")).toHaveTextContent("2");
    });

    // Click again
    await userEvent.click(canvas.getByTestId("reinit-btn"));

    await waitFor(async () => {
      await expect(canvas.getByTestId("init-count")).toHaveTextContent("3");
    });
  },
};

export const Cleanup: Story = {
  render: () => <CleanupDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Return a cleanup function from the init callback. It will be called when the component unmounts.",
      },
      source: {
        code: `import { useInit } from "@usefy/use-init";

function MyComponent() {
  useInit(() => {
    const subscription = eventBus.subscribe('event', handler);

    return () => {
      subscription.unsubscribe();
    };
  });

  return <div>Subscribed to events</div>;
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for initialization log
    await waitFor(async () => {
      await expect(canvas.getByTestId("log-0")).toBeInTheDocument();
    });

    // Unmount
    await userEvent.click(canvas.getByTestId("toggle-mount-btn"));

    // Wait for cleanup log
    await waitFor(async () => {
      await expect(canvas.getByTestId("log-1")).toHaveTextContent("Cleanup");
    });
  },
};
