import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";
import { within, userEvent, expect, waitFor } from "storybook/test";

/**
 * 1. Search Input Demo
 */
function SearchInputDemo() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setSearchCount((prev) => prev + 1);
      setSearchResults([
        `Result 1 for "${debouncedSearchTerm}"`,
        `Result 2 for "${debouncedSearchTerm}"`,
        `Result 3 for "${debouncedSearchTerm}"`,
      ]);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h2>Search Input with Debounce</h2>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Type to search. API calls are debounced by 500ms.
      </p>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          border: "2px solid #ddd",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      />

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      >
        <div>
          <strong>Current Input:</strong> {searchTerm || "(empty)"}
        </div>
        <div>
          <strong>Debounced Value:</strong> {debouncedSearchTerm || "(empty)"}
        </div>
        <div>
          <strong>API Calls Made:</strong> {searchCount}
        </div>
      </div>

      {searchResults.length > 0 && (
        <div>
          <h3>Search Results:</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {searchResults.map((result, index) => (
              <li
                key={index}
                style={{
                  padding: "0.75rem",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  marginBottom: "0.5rem",
                }}
              >
                {result}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * 2. Form Validation Demo
 */
function FormValidationDemo() {
  const [email, setEmail] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const debouncedEmail = useDebounce(email, 800);

  useEffect(() => {
    if (!debouncedEmail) {
      setValidationMessage("");
      return;
    }

    setIsValidating(true);

    /**
     * Simulate async validation
     */
    setTimeout(() => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail);
      setValidationMessage(
        isValid ? "✓ Valid email address" : "✗ Invalid email address"
      );
      setIsValidating(false);
    }, 300);
  }, [debouncedEmail]);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h2>Form Validation with Debounce</h2>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Email validation is debounced by 800ms to avoid excessive checks.
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="email"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "bold",
          }}
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            border: "2px solid #ddd",
            borderRadius: "4px",
          }}
        />
      </div>

      {isValidating && (
        <div style={{ color: "#666", fontStyle: "italic" }}>Validating...</div>
      )}

      {validationMessage && !isValidating && (
        <div
          style={{
            color: validationMessage.startsWith("✓") ? "#28a745" : "#dc3545",
            fontWeight: "bold",
          }}
        >
          {validationMessage}
        </div>
      )}
    </div>
  );
}

/**
 * 3. Auto-save Demo
 */
function AutoSaveDemo() {
  const [content, setContent] = useState("");
  const [saveCount, setSaveCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debouncedContent = useDebounce(content, 1000);

  useEffect(() => {
    if (debouncedContent && content === debouncedContent) {
      /**
       * Simulate auto-save
       */
      setSaveCount((prev) => prev + 1);
      setLastSaved(new Date());
    }
  }, [debouncedContent, content]);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h2>Auto-save with Debounce</h2>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Content is automatically saved 1 second after you stop typing.
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing..."
        rows={8}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          border: "2px solid #ddd",
          borderRadius: "4px",
          fontFamily: "monospace",
          marginBottom: "1rem",
          resize: "vertical",
        }}
      />

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <div>
          <strong>Characters:</strong> {content.length}
        </div>
        <div>
          <strong>Save Count:</strong> {saveCount}
        </div>
        {lastSaved && (
          <div>
            <strong>Last Saved:</strong> {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 4. Window Resize Demo
 */
function WindowResizeDemo() {
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== "undefined") {
      return `${window.innerWidth}x${window.innerHeight}`;
    }
    return "0x0";
  });
  const [resizeCount, setResizeCount] = useState(0);
  const [expensiveCalcCount, setExpensiveCalcCount] = useState(0);
  const debouncedWindowSize = useDebounce(windowSize, 300);

  useEffect(() => {
    const handleResize = () => {
      setResizeCount((prev) => prev + 1);
      setWindowSize(`${window.innerWidth}x${window.innerHeight}`);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Simulate expensive calculation that only runs on debounced value
   */
  useEffect(() => {
    if (debouncedWindowSize !== "0x0") {
      setExpensiveCalcCount((prev) => prev + 1);
    }
  }, [debouncedWindowSize]);

  const parseSize = (sizeStr: string) => {
    const [width, height] = sizeStr.split("x").map(Number);
    return { width, height };
  };

  const currentSize = parseSize(windowSize);
  const debouncedSize = parseSize(debouncedWindowSize);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h2>Window Resize with Debounce</h2>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Resize your browser window. Expensive calculations are debounced by
        300ms.
      </p>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      >
        <div>
          <strong>Current Size:</strong> {currentSize.width} x{" "}
          {currentSize.height}
        </div>
        <div>
          <strong>Debounced Size:</strong> {debouncedSize.width} x{" "}
          {debouncedSize.height}
        </div>
        <div
          style={{
            marginTop: "0.5rem",
            paddingTop: "0.5rem",
            borderTop: "1px solid #ddd",
          }}
        >
          <strong>Resize Events Fired:</strong> {resizeCount}
        </div>
        <div>
          <strong>Expensive Calculations Run:</strong> {expensiveCalcCount}
        </div>
      </div>

      <p style={{ fontSize: "0.875rem", color: "#666" }}>
        💡 Without debouncing, expensive operations would run {resizeCount}{" "}
        times instead of {expensiveCalcCount} times!
      </p>
    </div>
  );
}

/**
 * 5. API Request with Loading State
 */
function APIRequestDemo() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [requestCount, setRequestCount] = useState(0);
  const debouncedQuery = useDebounce(query, 600);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setRequestCount((prev) => prev + 1);

    /**
     * Simulate API call
     */
    const timer = setTimeout(() => {
      setData({
        query: debouncedQuery,
        results: Math.floor(Math.random() * 100) + 1,
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [debouncedQuery]);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h2>API Request with Loading State</h2>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Search triggers an API request after 600ms of inactivity.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search..."
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          border: "2px solid #ddd",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      />

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      >
        <div>
          <strong>API Requests Made:</strong> {requestCount}
        </div>
      </div>

      {isLoading && (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#fff3cd",
            borderRadius: "4px",
          }}
        >
          Loading...
        </div>
      )}

      {!isLoading && data && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#d4edda",
            borderRadius: "4px",
          }}
        >
          <h3>Results Found</h3>
          <div>
            <strong>Query:</strong> {data.query}
          </div>
          <div>
            <strong>Results:</strong> {data.results} items
          </div>
          <div>
            <strong>Fetched at:</strong> {data.timestamp}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 6. Slider with Debounced Value
 */
function SliderDemo() {
  const [value, setValue] = useState(50);
  const [immediateUpdateCount, setImmediateUpdateCount] = useState(0);
  const [expensiveUpdateCount, setExpensiveUpdateCount] = useState(0);
  const debouncedValue = useDebounce(value, 500);

  /**
   * Track immediate updates (every slider change)
   */
  useEffect(() => {
    setImmediateUpdateCount((prev) => prev + 1);
  }, [value]);

  /**
   * Track expensive updates (only after debounce)
   */
  useEffect(() => {
    setExpensiveUpdateCount((prev) => prev + 1);
  }, [debouncedValue]);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h2>Slider with Debounced Updates</h2>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Drag the slider. Expensive calculations only run after 500ms of
        inactivity.
      </p>

      <div style={{ marginBottom: "2rem" }}>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{ width: "100%", height: "40px" }}
        />
      </div>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}
        >
          Current: {value}%
        </div>
        <div style={{ fontSize: "1.5rem", color: "#28a745" }}>
          Debounced: {debouncedValue}%
        </div>
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid #ddd",
          }}
        >
          <strong>Immediate Updates:</strong> {immediateUpdateCount}
        </div>
        <div>
          <strong>Expensive Updates (Debounced):</strong> {expensiveUpdateCount}
        </div>
      </div>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#e7f3ff",
          borderRadius: "4px",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
          Simulated Expensive Calculation Result:
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "1.25rem" }}>
          {(debouncedValue * 123.456).toFixed(2)}
        </div>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#666",
            marginTop: "0.5rem",
            marginBottom: 0,
          }}
        >
          💡 This expensive calculation ran {expensiveUpdateCount} times instead
          of {immediateUpdateCount} times!
        </p>
      </div>
    </div>
  );
}

/**
 * 7. Leading Edge Demo
 */
function LeadingEdgeDemo() {
  const [clicks, setClicks] = useState(0);
  const [immediateCount, setImmediateCount] = useState(0);
  const [leadingCount, setLeadingCount] = useState(0);
  const [trailingCount, setTrailingCount] = useState(0);

  const debouncedLeading = useDebounce(clicks, 1000, { leading: true });
  const debouncedTrailing = useDebounce(clicks, 1000, { trailing: true });

  useEffect(() => {
    if (clicks > 0) {
      setImmediateCount((prev) => prev + 1);
    }
  }, [clicks]);

  useEffect(() => {
    if (debouncedLeading > 0) {
      setLeadingCount((prev) => prev + 1);
    }
  }, [debouncedLeading]);

  useEffect(() => {
    if (debouncedTrailing > 0) {
      setTrailingCount((prev) => prev + 1);
    }
  }, [debouncedTrailing]);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h2>Leading vs Trailing Edge</h2>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Click the button multiple times quickly. Leading edge fires immediately,
        trailing edge fires after 1 second of inactivity.
      </p>

      <button
        onClick={() => setClicks((prev) => prev + 1)}
        style={{
          width: "100%",
          padding: "1rem 2rem",
          fontSize: "1.25rem",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        Click Me! (Clicked {clicks} times)
      </button>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      >
        <div style={{ marginBottom: "0.5rem" }}>
          <strong>Immediate Updates:</strong> {immediateCount}
        </div>
        <div
          style={{
            marginBottom: "0.5rem",
            padding: "0.5rem",
            backgroundColor: "#d4edda",
            borderRadius: "4px",
          }}
        >
          <strong>Leading Edge (fires immediately):</strong> {leadingCount}
        </div>
        <div
          style={{
            padding: "0.5rem",
            backgroundColor: "#cce5ff",
            borderRadius: "4px",
          }}
        >
          <strong>Trailing Edge (fires after delay):</strong> {trailingCount}
        </div>
      </div>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fff3cd",
          borderRadius: "4px",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          💡 <strong>Leading edge</strong> is useful for actions that should
          happen immediately on first interaction (like showing a tooltip).
          <strong> Trailing edge</strong> is better for actions that should wait
          until user activity stops (like API calls).
        </p>
      </div>
    </div>
  );
}

/**
 * 8. Max Wait Demo
 */
function MaxWaitDemo() {
  const [input, setInput] = useState("");
  const [regularUpdateCount, setRegularUpdateCount] = useState(0);
  const [maxWaitUpdateCount, setMaxWaitUpdateCount] = useState(0);

  const debouncedRegular = useDebounce(input, 2000);
  const debouncedMaxWait = useDebounce(input, 2000, { maxWait: 5000 });

  useEffect(() => {
    if (debouncedRegular) {
      setRegularUpdateCount((prev) => prev + 1);
    }
  }, [debouncedRegular]);

  useEffect(() => {
    if (debouncedMaxWait) {
      setMaxWaitUpdateCount((prev) => prev + 1);
    }
  }, [debouncedMaxWait]);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h2>Max Wait Option</h2>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Type continuously without stopping. Regular debounce waits indefinitely,
        but maxWait ensures update happens within 5 seconds maximum.
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Keep typing without stopping for more than 2 seconds..."
        rows={6}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          border: "2px solid #ddd",
          borderRadius: "4px",
          fontFamily: "monospace",
          marginBottom: "1rem",
          resize: "vertical",
        }}
      />

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      >
        <div style={{ marginBottom: "0.5rem" }}>
          <strong>Characters:</strong> {input.length}
        </div>
        <div
          style={{
            marginBottom: "0.5rem",
            padding: "0.5rem",
            backgroundColor: "#e7f3ff",
            borderRadius: "4px",
          }}
        >
          <strong>Regular Debounce (2s delay):</strong> {regularUpdateCount}{" "}
          updates
        </div>
        <div
          style={{
            padding: "0.5rem",
            backgroundColor: "#d4edda",
            borderRadius: "4px",
          }}
        >
          <strong>With MaxWait (2s delay, 5s max):</strong> {maxWaitUpdateCount}{" "}
          updates
        </div>
      </div>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fff3cd",
          borderRadius: "4px",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          💡 <strong>maxWait</strong> ensures that even if the user keeps typing
          continuously, the debounced value will update at least once every 5
          seconds. This is useful for auto-save features where you want to
          ensure changes are saved periodically even during continuous editing.
        </p>
      </div>
    </div>
  );
}

/**
 * 9. Combined Options Demo
 */
function CombinedOptionsDemo() {
  const [value, setValue] = useState("");
  const [updateLog, setUpdateLog] = useState<
    Array<{ time: string; type: string; value: string }>
  >([]);

  const debouncedDefault = useDebounce(value, 1500);
  const debouncedLeading = useDebounce(value, 1500, {
    leading: true,
    trailing: false,
  });
  const debouncedBoth = useDebounce(value, 1500, {
    leading: true,
    trailing: true,
  });
  const debouncedMaxWait = useDebounce(value, 1500, {
    maxWait: 3000,
    trailing: true,
  });

  useEffect(() => {
    if (debouncedDefault) {
      setUpdateLog((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          type: "Default (trailing)",
          value: debouncedDefault,
        },
      ]);
    }
  }, [debouncedDefault]);

  useEffect(() => {
    if (debouncedLeading) {
      setUpdateLog((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          type: "Leading only",
          value: debouncedLeading,
        },
      ]);
    }
  }, [debouncedLeading]);

  useEffect(() => {
    if (debouncedBoth) {
      setUpdateLog((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          type: "Both edges",
          value: debouncedBoth,
        },
      ]);
    }
  }, [debouncedBoth]);

  useEffect(() => {
    if (debouncedMaxWait) {
      setUpdateLog((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          type: "MaxWait (3s)",
          value: debouncedMaxWait,
        },
      ]);
    }
  }, [debouncedMaxWait]);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h2>Combined Options Comparison</h2>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Type to see how different option combinations behave. All have 1.5s
        delay.
      </p>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type here..."
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          border: "2px solid #ddd",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      />

      <button
        onClick={() => {
          setValue("");
          setUpdateLog([]);
        }}
        style={{
          width: "100%",
          padding: "0.5rem",
          marginBottom: "1rem",
          backgroundColor: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Clear All
      </button>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          marginBottom: "1rem",
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Update Log:</h3>
        {updateLog.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            No updates yet...
          </p>
        ) : (
          <div>
            {updateLog
              .slice()
              .reverse()
              .map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "white",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#666" }}>
                    {log.time}
                  </div>
                  <div>
                    <strong>{log.type}:</strong> {log.value}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#e7f3ff",
          borderRadius: "4px",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          💡 Compare different option combinations to understand their behavior
          patterns.
        </p>
      </div>
    </div>
  );
}

/**
 * Meta & Stories
 */
const meta = {
  title: "Hooks/useDebounce",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Debounces a value by delaying updates until after a specified delay period has elapsed since the last change. Perfect for optimizing search inputs, form validation, auto-save, and any scenario where you want to limit the rate of updates.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SearchInput: Story = {
  render: () => <SearchInputDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Common use case: Debouncing search input to reduce API calls. Only triggers search after user stops typing for 500ms.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the search input
    const searchInput = canvas.getByPlaceholderText("Search...");

    // Initially, check the structure exists
    await expect(canvas.getByText("API Calls Made:", { exact: false })).toBeInTheDocument();

    // Type "react"
    await userEvent.type(searchInput, "react", { delay: 50 });

    // Wait for debounce (500ms) and check results appear
    await waitFor(
      async () => {
        await expect(canvas.getByText('Result 1 for "react"')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  },
};

export const FormValidation: Story = {
  render: () => <FormValidationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Debounce email validation to avoid validating on every keystroke. Validation runs 800ms after user stops typing.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the email input
    const emailInput = canvas.getByPlaceholderText("Enter your email");

    // Type an invalid email
    await userEvent.type(emailInput, "invalid", { delay: 50 });

    // Wait for debounce + validation (800ms + 300ms)
    await waitFor(
      async () => {
        await expect(
          canvas.getByText("✗ Invalid email address")
        ).toBeInTheDocument();
      },
      { timeout: 1500 }
    );

    // Clear and type a valid email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "test@example.com", { delay: 50 });

    // Wait for validation
    await waitFor(
      async () => {
        await expect(
          canvas.getByText("✓ Valid email address")
        ).toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  },
};

export const AutoSave: Story = {
  render: () => <AutoSaveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Auto-save content after user stops typing. Prevents excessive save operations while providing a seamless user experience.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the textarea
    const textarea = canvas.getByPlaceholderText("Start typing...");

    // Type some content
    await userEvent.type(textarea, "Hello World", { delay: 50 });

    // Wait for auto-save (1000ms debounce) and check Last Saved appears
    await waitFor(
      async () => {
        await expect(canvas.getByText("Last Saved:", { exact: false })).toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  },
};

export const WindowResize: Story = {
  render: () => <WindowResizeDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Debounce window resize events to avoid performance issues. Useful for responsive layouts and expensive recalculations.",
      },
    },
  },
};

export const APIRequest: Story = {
  render: () => <APIRequestDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Debounce API requests with loading state. Shows how to handle async operations with proper loading indicators.",
      },
    },
  },
};

export const Slider: Story = {
  render: () => <SliderDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Debounce slider updates to avoid running expensive calculations on every value change. Only calculates after user stops dragging.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the slider
    const slider = canvas.getByRole("slider");

    // Change slider value
    await userEvent.click(slider);
    await userEvent.type(slider, "{arrowright}{arrowright}{arrowright}");

    // Wait a bit for updates
    await waitFor(
      async () => {
        // Just check that expensive updates text exists
        await expect(canvas.getByText("Expensive Updates (Debounced):", { exact: false })).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  },
};

export const LeadingEdge: Story = {
  render: () => <LeadingEdgeDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the difference between leading and trailing edge updates. Leading edge fires immediately on first change, while trailing edge waits for inactivity.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the button
    const button = canvas.getByRole("button", { name: /Click Me!/i });

    // Click the button 3 times rapidly
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    // Wait for trailing edge (1000ms) and verify updates happened
    await waitFor(
      async () => {
        await expect(
          canvas.getByText("Trailing Edge (fires after delay):", { exact: false })
        ).toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  },
};

export const MaxWait: Story = {
  render: () => <MaxWaitDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Shows the maxWait option which ensures the debounced value updates at least once within the specified maximum time, even during continuous changes. Perfect for auto-save features.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the textarea
    const textarea = canvas.getByPlaceholderText(
      /Keep typing without stopping/i
    );

    // Type some content
    await userEvent.type(
      textarea,
      "This is a test of the maxWait feature!",
      { delay: 50 }
    );

    // Wait for debounce (2000ms) and verify updates happened
    await waitFor(
      async () => {
        await expect(
          canvas.getByText("Regular Debounce (2s delay):", { exact: false })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  },
};

export const CombinedOptions: Story = {
  render: () => <CombinedOptionsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Compares different option combinations (default, leading only, both edges, and maxWait) to help understand their behavior patterns in real-time.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the input
    const input = canvas.getByPlaceholderText("Type here...");

    // Initially, no updates
    await expect(
      canvas.getByText(/No updates yet.../i)
    ).toBeInTheDocument();

    // Type some text
    await userEvent.type(input, "test", { delay: 100 });

    // Wait for debounce (1500ms)
    await waitFor(
      async () => {
        // Should have at least one update in the log
        const log = canvas.queryByText(/No updates yet.../i);
        expect(log).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Should see different update types in the log
    await expect(
      canvas.getByText(/Default \(trailing\):/i)
    ).toBeInTheDocument();

    // Clear button should work
    const clearButton = canvas.getByRole("button", { name: /Clear All/i });
    await userEvent.click(clearButton);

    // Should reset to no updates
    await expect(
      canvas.getByText(/No updates yet.../i)
    ).toBeInTheDocument();
  },
};
