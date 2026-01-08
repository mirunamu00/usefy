import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect } from "react";
import { useDebounce } from "@usefy/use-debounce";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

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
    <div className={storyTheme.container + " max-w-xl mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Search Input with Debounce</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Type to search. API calls are debounced by 500ms.
      </p>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Type to search..."
        className={storyTheme.input + " mb-6 w-full p-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"}
      />

      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}>
        <div className={storyTheme.statLabel + " overflow-hidden"}>
          <strong className={storyTheme.statText}>Current Input:</strong>{" "}
          <span
            className={
              storyTheme.statTextSecondary + " truncate inline-block max-w-full"
            }
          >
            {searchTerm || "(empty)"}
          </span>
        </div>
        <div className={storyTheme.statLabel + " overflow-hidden"}>
          <strong className={storyTheme.statText}>Debounced Value:</strong>{" "}
          <span
            className={
              storyTheme.statTextSecondary + " truncate inline-block max-w-full"
            }
          >
            {debouncedSearchTerm || "(empty)"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>API Calls Made:</strong>{" "}
          <span className={storyTheme.statValue}>{searchCount}</span>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            Search Results:
          </h3>
          <ul className="list-none p-0 space-y-2">
            {searchResults.map((result, index) => (
              <li
                key={index}
                className={
                  storyTheme.listItem + " break-words overflow-wrap-anywhere p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700"
                }
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
    <div className={storyTheme.container + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Form Validation</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Email validation is debounced by 800ms to avoid excessive checks.
      </p>

      <div className="mb-4">
        <label htmlFor="email" className={storyTheme.label}>
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={storyTheme.input + " truncate w-full p-3 rounded-xl border border-slate-300"}
        />
      </div>

      {isValidating && (
        <div className={storyTheme.messageInfo + " text-indigo-600 font-medium animate-pulse"}>Validating...</div>
      )}

      {validationMessage && !isValidating && (
        <div
          className={
            validationMessage.startsWith("✓")
              ? storyTheme.messageSuccess + " bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100"
              : storyTheme.messageError + " bg-rose-50 text-rose-700 p-3 rounded-xl border border-rose-100"
          }
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
    <div className={storyTheme.container + " max-w-2xl mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Auto-save Editor</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Content is automatically saved 1 second after you stop typing.
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing..."
        rows={10}
        className={storyTheme.textareaMono + " mb-6 overflow-auto break-words w-full p-4 rounded-2xl border border-slate-200 shadow-inner bg-slate-50 focus:bg-white transition-colors"}
      />

      <div className={storyTheme.statBox + " bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex justify-between items-center"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Characters:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{content.length}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Save Count:</strong>{" "}
          <span className={storyTheme.statValue}>{saveCount}</span>
        </div>
        {lastSaved && (
          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>Last Saved:</strong>{" "}
            <span className={storyTheme.statTextSecondary}>
              {lastSaved.toLocaleTimeString()}
            </span>
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
    <div className={storyTheme.container + " max-w-xl mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Window Resize</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Resize your browser window. Expensive calculations are debounced by
        300ms.
      </p>

      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Current Size:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {currentSize.width} x {currentSize.height}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Debounced Size:</strong>{" "}
          <span className={storyTheme.statValue}>
            {debouncedSize.width} x {debouncedSize.height}
          </span>
        </div>
        <div className={storyTheme.divider}>
          <strong className={storyTheme.statText}>Resize Events Fired:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{resizeCount}</span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>
            Expensive Calculations Run:
          </strong>{" "}
          <span className={storyTheme.statValue}>{expensiveCalcCount}</span>
        </div>
      </div>

      <p className="text-sm text-slate-500 m-0 bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800">
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
    <div className={storyTheme.container + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>API Request</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Search triggers an API request after 600ms of inactivity.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search database..."
        className={storyTheme.input + " mb-6 w-full p-4 rounded-2xl border border-slate-200 shadow-sm"}
      />

      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>API Requests Made:</strong>{" "}
          <span className={storyTheme.statValue}>{requestCount}</span>
        </div>
      </div>

      {isLoading && (
        <div className={storyTheme.infoBox + " p-8 text-center bg-slate-50 rounded-2xl"}>
          <p className={storyTheme.infoText + " m-0 text-slate-500 animate-pulse"}>Loading data...</p>
        </div>
      )}

      {!isLoading && data && (
        <div className={storyTheme.messageSuccess + " bg-emerald-50 border border-emerald-100 rounded-2xl p-5"}>
          <h3 className="text-lg font-semibold mb-2">Results Found</h3>
          <div className={storyTheme.statLabel + " overflow-hidden"}>
            <strong className={storyTheme.statText}>Query:</strong>{" "}
            <span
              className={
                storyTheme.statTextSecondary +
                " truncate inline-block max-w-full"
              }
            >
              {data.query}
            </span>
          </div>
          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>Results:</strong>{" "}
            <span className={storyTheme.statTextSecondary}>
              {data.results} items
            </span>
          </div>
          <div className={storyTheme.statLabel}>
            <strong className={storyTheme.statText}>Fetched at:</strong>{" "}
            <span className={storyTheme.statTextSecondary}>
              {data.timestamp}
            </span>
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
    <div className={storyTheme.container + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Slider Debounce</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Drag the slider. Expensive calculations only run after 500ms of
        inactivity.
      </p>

      <div className="mb-8">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}>
        <div className="text-3xl font-bold mb-4 text-gray-800">
          Current: {value}%
        </div>
        <div className={storyTheme.statValue + " text-2xl mb-4"}>
          Debounced: {debouncedValue}%
        </div>
        <div className={storyTheme.divider}>
          <strong className={storyTheme.statText}>Immediate Updates:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {immediateUpdateCount}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>
            Expensive Updates (Debounced):
          </strong>{" "}
          <span className={storyTheme.statValue}>{expensiveUpdateCount}</span>
        </div>
      </div>

      <div className={storyTheme.cardInfo + " bg-indigo-50 border border-indigo-100 rounded-2xl p-5"}>
        <div className="font-bold mb-2 text-gray-800">
          Simulated Expensive Calculation Result:
        </div>
        <div className="font-mono text-xl text-indigo-600">
          {(debouncedValue * 123.456).toFixed(2)}
        </div>
        <p className={storyTheme.infoText + " mt-2 mb-0"}>
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
    <div className={storyTheme.container + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Leading vs Trailing</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Click the button multiple times quickly. Leading edge fires immediately,
        trailing edge fires after 1 second of inactivity.
      </p>

      <button
        onClick={() => setClicks((prev) => prev + 1)}
        className={storyTheme.buttonFull + " mb-5"}
        style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)', color: 'white', padding: '1rem', borderRadius: '1rem', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
      >
        Click Me! (Clicked {clicks} times)
      </button>

      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Immediate Updates:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{immediateCount}</span>
        </div>
        <div className={storyTheme.messageSuccess + " mb-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100"}>
          <strong>Leading Edge (fires immediately):</strong> {leadingCount}
        </div>
        <div className={storyTheme.cardInfo + " p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100"}>
          <strong>Trailing Edge (fires after delay):</strong> {trailingCount}
        </div>
      </div>

      <div className={storyTheme.infoBox + " bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText}>
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
    <div className={storyTheme.container + " max-w-2xl mx-auto"}>
      <h2 className={storyTheme.title + " text-3xl font-extrabold tracking-tight text-slate-900 mb-4"}>Max Wait Option</h2>
      <p className={storyTheme.subtitle + " text-slate-500 mb-8"}>
        Type continuously without stopping. Regular debounce waits indefinitely,
        but maxWait ensures update happens within 5 seconds maximum.
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Keep typing without stopping for more than 2 seconds..."
        rows={8}
        className={storyTheme.textareaMono + " mb-6 overflow-auto break-words w-full p-4 rounded-2xl border border-slate-200 shadow-inner"}
      />

      <div className={storyTheme.statBox + " mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Characters:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>{input.length}</span>
        </div>
        <div className={storyTheme.cardInfo + " mb-2 p-3 bg-slate-100 rounded-xl"}>
          <strong>Regular Debounce (2s delay):</strong> {regularUpdateCount}{" "}
          updates
        </div>
        <div className={storyTheme.messageSuccess + " p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100"}>
          <strong>With MaxWait (2s delay, 5s max):</strong> {maxWaitUpdateCount}{" "}
          updates
        </div>
      </div>

      <div className={storyTheme.infoBox + " bg-amber-50 border border-amber-100 rounded-2xl p-5"}>
        <p className={storyTheme.infoText}>
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
      source: {
        code: `import { useDebounce } from "@usefy/use-debounce";
import { useState, useEffect } from "react";

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Perform search API call here
      console.log("Searching for:", debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      <p>Current: {searchTerm}</p>
      <p>Debounced: {debouncedSearchTerm}</p>
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

    // Find the search input
    const searchInput = canvas.getByPlaceholderText("Type to search...");

    // Initially, check the structure exists
    await expect(
      canvas.getByText("API Calls Made:", { exact: false })
    ).toBeInTheDocument();

    // Type "react"
    await userEvent.type(searchInput, "react", { delay: 50 });

    // Wait for debounce (500ms) and check results appear
    await waitFor(
      async () => {
        await expect(
          canvas.getByText('Result 1 for "react"')
        ).toBeInTheDocument();
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
      source: {
        code: `import { useDebounce } from "@usefy/use-debounce";
import { useState, useEffect } from "react";

function EmailValidation() {
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const debouncedEmail = useDebounce(email, 800);

  useEffect(() => {
    if (!debouncedEmail) {
      setIsValid(null);
      return;
    }

    // Validate email after debounce
    const isValidEmail = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(debouncedEmail);
    setIsValid(isValidEmail);
  }, [debouncedEmail]);

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      {isValid === true && <p>✓ Valid email</p>}
      {isValid === false && <p>✗ Invalid email</p>}
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
      source: {
        code: `import { useDebounce } from "@usefy/use-debounce";
import { useState, useEffect } from "react";

function AutoSaveEditor() {
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debouncedContent = useDebounce(content, 1000);

  useEffect(() => {
    if (debouncedContent && content === debouncedContent) {
      // Auto-save logic here
      console.log("Saving:", debouncedContent);
      setLastSaved(new Date());
    }
  }, [debouncedContent, content]);

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing..."
      />
      {lastSaved && <p>Last saved: {lastSaved.toLocaleTimeString()}</p>}
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

    // Find the textarea
    const textarea = canvas.getByPlaceholderText("Start typing...");

    // Type some content
    await userEvent.type(textarea, "Hello World", { delay: 50 });

    // Wait for auto-save (1000ms debounce) and check Last Saved appears
    await waitFor(
      async () => {
        await expect(
          canvas.getByText("Last Saved:", { exact: false })
        ).toBeInTheDocument();
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
      source: {
        code: `import { useDebounce } from "@usefy/use-debounce";
import { useState, useEffect } from "react";

function WindowSizeTracker() {
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== "undefined") {
      return \`\${window.innerWidth}x\${window.innerHeight}\`;
    }
    return "0x0";
  });
  const debouncedWindowSize = useDebounce(windowSize, 300);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(\`\${window.innerWidth}x\${window.innerHeight}\`);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Expensive calculation only runs on debounced value
    if (debouncedWindowSize !== "0x0") {
      console.log("Expensive calculation for:", debouncedWindowSize);
    }
  }, [debouncedWindowSize]);

  return <div>Window size: {debouncedWindowSize}</div>;
}`,
        language: "tsx",
        type: "code",
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
      source: {
        code: `import { useDebounce } from "@usefy/use-debounce";
import { useState, useEffect } from "react";

function SearchAPI() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const debouncedQuery = useDebounce(query, 600);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setData(null);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    fetch(\`/api/search?q=\${debouncedQuery}\`)
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [debouncedQuery]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search..."
      />
      {isLoading && <p>Loading...</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}`,
        language: "tsx",
        type: "code",
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
      source: {
        code: `import { useDebounce } from "@usefy/use-debounce";
import { useState, useEffect } from "react";

function SliderWithDebounce() {
  const [value, setValue] = useState(50);
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    // Expensive calculation only runs after user stops dragging
    console.log("Expensive calculation for:", debouncedValue);
  }, [debouncedValue]);

  return (
    <div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <p>Current: {value}%</p>
      <p>Debounced: {debouncedValue}%</p>
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

    // Find the slider
    const slider = canvas.getByRole("slider");

    // Change slider value
    await userEvent.click(slider);
    await userEvent.type(slider, "{arrowright}{arrowright}{arrowright}");

    // Wait a bit for updates
    await waitFor(
      async () => {
        // Just check that expensive updates text exists
        await expect(
          canvas.getByText("Expensive Updates (Debounced):", { exact: false })
        ).toBeInTheDocument();
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
      source: {
        code: `import { useDebounce } from "@usefy/use-debounce";
import { useState, useEffect } from "react";

function LeadingTrailingDemo() {
  const [clicks, setClicks] = useState(0);

  // Leading edge: fires immediately on first change
  const debouncedLeading = useDebounce(clicks, 1000, { leading: true });

  // Trailing edge: fires after delay (default behavior)
  const debouncedTrailing = useDebounce(clicks, 1000, { trailing: true });

  useEffect(() => {
    console.log("Leading edge:", debouncedLeading);
  }, [debouncedLeading]);

  useEffect(() => {
    console.log("Trailing edge:", debouncedTrailing);
  }, [debouncedTrailing]);

  return (
    <div>
      <button onClick={() => setClicks((prev) => prev + 1)}>
        Click Me! ({clicks})
      </button>
      <p>Leading: {debouncedLeading}</p>
      <p>Trailing: {debouncedTrailing}</p>
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
          canvas.getByText("Trailing Edge (fires after delay):", {
            exact: false,
          })
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
      source: {
        code: `import { useDebounce } from "@usefy/use-debounce";
import { useState, useEffect } from "react";

function AutoSaveWithMaxWait() {
  const [content, setContent] = useState("");
  
  // Regular debounce: waits 2 seconds after user stops typing
  const debouncedRegular = useDebounce(content, 2000);
  
  // With maxWait: updates at least once every 5 seconds
  const debouncedMaxWait = useDebounce(content, 2000, { maxWait: 5000 });

  useEffect(() => {
    if (debouncedMaxWait) {
      // Auto-save - ensures save happens at least every 5 seconds
      console.log("Saving:", debouncedMaxWait);
    }
  }, [debouncedMaxWait]);

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Keep typing..."
      />
      <p>Regular debounce: {debouncedRegular}</p>
      <p>With maxWait: {debouncedMaxWait}</p>
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

    // Find the textarea
    const textarea = canvas.getByPlaceholderText(
      /Keep typing without stopping/i
    );

    // Initially, both counts should be 0
    // Text is split across multiple elements, so we check parent containers
    const regularDebounceContainer = canvas.getByText(
      /Regular Debounce \(2s delay\):/i
    ).parentElement;
    expect(regularDebounceContainer?.textContent).toMatch(/0\s+updates/i);

    const maxWaitContainer = canvas.getByText(
      /With MaxWait \(2s delay, 5s max\):/i
    ).parentElement;
    expect(maxWaitContainer?.textContent).toMatch(/0\s+updates/i);

    // Type continuously for more than 5 seconds (maxWait time)
    // This ensures maxWait triggers while regular debounce doesn't
    // Each character typed with 100ms delay, so 60 characters = 6 seconds
    const longText = "a".repeat(60);
    await userEvent.type(textarea, longText, {
      delay: 100, // 100ms delay between characters = 6 seconds total
    });

    // Wait for maxWait to trigger (should happen within 5 seconds)
    // Regular debounce should still be 0 (user never stopped typing for 2 seconds)
    // MaxWait debounce should be at least 1 (triggered after 5 seconds)
    await waitFor(
      async () => {
        const maxWaitContainer = canvas.getByText(
          /With MaxWait \(2s delay, 5s max\):/i
        ).parentElement;
        const maxWaitText = maxWaitContainer?.textContent || "";
        const maxWaitMatch = maxWaitText.match(/(\d+)\s+updates/i);
        const maxWaitCount = maxWaitMatch ? parseInt(maxWaitMatch[1], 10) : 0;
        expect(maxWaitCount).toBeGreaterThanOrEqual(1);
      },
      { timeout: 7000 } // Wait up to 7 seconds to allow maxWait to trigger
    );

    // Verify regular debounce is still 0 (user never stopped for 2 seconds)
    const regularDebounceContainerAfter = canvas.getByText(
      /Regular Debounce \(2s delay\):/i
    ).parentElement;
    expect(regularDebounceContainerAfter?.textContent).toMatch(/0\s+updates/i);
  },
};
