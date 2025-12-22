import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";

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
};
