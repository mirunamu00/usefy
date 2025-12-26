import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { useDebounceCallback } from "./useDebounceCallback";
import { within, userEvent, expect, waitFor } from "storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * 1. Search Input Demo
 */
function SearchInputDemo() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchCount, setSearchCount] = useState(0);

  const handleSearch = useDebounceCallback((term: string) => {
    if (term.trim()) {
      setSearchResults([
        `Result 1 for "${term}"`,
        `Result 2 for "${term}"`,
        `Result 3 for "${term}"`,
      ]);
    } else {
      setSearchResults([]);
    }
    setSearchCount((prev) => prev + 1);
  }, 500);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Search with Debounced Callback</h2>
      <p className={storyTheme.subtitle}>
        Type to search. The search function is debounced by 500ms.
      </p>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          handleSearch(e.target.value);
        }}
        placeholder="Search..."
        className={storyTheme.input + " mb-5"}
      />

      <div className={storyTheme.buttonGroupFull}>
        <button
          onClick={handleSearch.cancel}
          className={storyTheme.buttonDanger + " flex-1"}
        >
          Cancel
        </button>
        <button
          onClick={handleSearch.flush}
          className={storyTheme.buttonSuccess + " flex-1"}
        >
          Search Now
        </button>
      </div>

      <div className={storyTheme.statBox + " mb-5"}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Current Input:</strong>{" "}
          <span className={storyTheme.statTextSecondary}>
            {searchTerm || "(empty)"}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Search Calls:</strong>{" "}
          <span className={storyTheme.statValue}>{searchCount}</span>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            Search Results:
          </h3>
          <ul className="list-none p-0">
            {searchResults.map((result, index) => (
              <li key={index} className={storyTheme.listItem}>
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
 * 2. Auto-save Form Demo
 */
function AutoSaveFormDemo() {
  const [formData, setFormData] = useState({ name: "", email: "", bio: "" });
  const [saveCount, setSaveCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = useDebounceCallback((_data: typeof formData) => {
    setSaveCount((prev) => prev + 1);
    setLastSaved(new Date());
  }, 1000);

  const updateField = (field: keyof typeof formData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    handleSave(newData);
  };

  return (
    <div className="p-8 max-w-[600px] font-sans">
      <h2 className={storyTheme.title}>Auto-save Form</h2>
      <p className="text-gray-500 mb-6 text-[0.95rem]">
        Form auto-saves 1 second after you stop typing.
      </p>

      <div className="mb-4">
        <label
          htmlFor="name"
          className="block mb-2 font-semibold text-gray-700 text-[0.95rem]"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Enter your name"
          className={storyTheme.input}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="email"
          className="block mb-2 font-semibold text-gray-700 text-[0.95rem]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="Enter your email"
          className={storyTheme.input}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="bio"
          className="block mb-2 font-semibold text-gray-700 text-[0.95rem]"
        >
          Bio
        </label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => updateField("bio", e.target.value)}
          placeholder="Tell us about yourself"
          rows={4}
          className={storyTheme.textarea}
        />
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={handleSave.cancel}
          className="flex-1 py-3 px-4 text-[0.95rem] bg-red-600 text-white border-none rounded-lg cursor-pointer hover:bg-red-700 transition-colors"
        >
          Cancel Save
        </button>
        <button
          onClick={handleSave.flush}
          className="flex-1 py-3 px-4 text-[0.95rem] bg-green-600 text-white border-none rounded-lg cursor-pointer hover:bg-green-700 transition-colors"
        >
          Save Now
        </button>
      </div>

      <div className="p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="mb-2 text-[0.95rem]">
          <strong className="text-gray-700">Save Count:</strong>{" "}
          <span className={storyTheme.statValue}>{saveCount}</span>
        </div>
        {lastSaved && (
          <div className="text-[0.95rem]">
            <strong className="text-gray-700">Last Saved:</strong>{" "}
            <span className="text-gray-500">
              {lastSaved.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 3. Button Click with Leading Edge
 */
function LeadingEdgeDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  const handleClick = useDebounceCallback(
    () => {
      setProcessedCount((prev) => prev + 1);
    },
    500,
    { leading: true }
  );

  return (
    <div className="p-8 max-w-[600px] font-sans">
      <h2 className={storyTheme.title}>Leading Edge Callback</h2>
      <p className="text-gray-500 mb-6 text-[0.95rem]">
        Click rapidly. The callback fires immediately on the first click, then
        waits 500ms before allowing another.
      </p>

      <button
        onClick={() => {
          setClickCount((prev) => prev + 1);
          handleClick();
        }}
        className={storyTheme.buttonFull + " mb-5"}
      >
        Click Me!
      </button>

      <div className="p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="mb-2 text-[0.95rem]">
          <strong className="text-gray-700">Total Clicks:</strong>{" "}
          <span className="text-gray-500">{clickCount}</span>
        </div>
        <div className="text-[0.95rem]">
          <strong className="text-gray-700">Processed (Debounced):</strong>{" "}
          <span className={storyTheme.statValue}>{processedCount}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. MaxWait Demo
 */
function MaxWaitDemo() {
  const [input, setInput] = useState("");
  const [updateCount, setUpdateCount] = useState(0);

  const handleUpdate = useDebounceCallback(
    (_value: string) => {
      setUpdateCount((prev) => prev + 1);
    },
    2000,
    { maxWait: 5000 }
  );

  return (
    <div className="p-8 max-w-[600px] font-sans">
      <h2 className={storyTheme.title}>MaxWait Option</h2>
      <p className="text-gray-500 mb-6 text-[0.95rem]">
        Keep typing continuously. The callback will fire at most every 5 seconds
        (maxWait), even if you don't stop typing.
      </p>

      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          handleUpdate(e.target.value);
        }}
        placeholder="Keep typing without stopping..."
        rows={6}
        className="w-full py-3.5 px-4 text-base border-2 border-gray-200 rounded-xl mb-5 outline-none transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] font-mono resize-y focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
      />

      <div className="p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="mb-2 text-[0.95rem]">
          <strong className="text-gray-700">Characters:</strong>{" "}
          <span className="text-gray-500">{input.length}</span>
        </div>
        <div className="text-[0.95rem]">
          <strong className="text-gray-700">Callback Invocations:</strong>{" "}
          <span className={storyTheme.statValue}>{updateCount}</span>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
        <p className="m-0 text-sm text-yellow-800">
          💡 <strong>maxWait</strong> ensures the callback runs at least once
          every 5 seconds, preventing indefinite delays during continuous input.
        </p>
      </div>
    </div>
  );
}

/**
 * Meta & Stories
 */
const meta = {
  title: "Hooks/useDebounceCallback",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Creates a debounced version of a callback function that delays invoking until after a specified delay period has elapsed since the last call. Perfect for event handlers, API calls, and any scenario where you want to limit function execution rate.",
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
          "Debounce search API calls with cancel and flush methods. Search executes 500ms after typing stops, or can be cancelled/flushed manually.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByPlaceholderText("Search...");

    // Helper to get search count
    const getSearchCount = () => {
      const text = canvas.getByText("Search Calls:", { exact: false });
      const parent = text.closest("div");
      const match = parent?.textContent?.match(/Search Calls:\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Initially no searches
    expect(getSearchCount()).toBe(0);

    // Type rapidly (10ms interval, 5 chars = 50ms total - well under 500ms debounce)
    await userEvent.type(searchInput, "react", { delay: 10 });

    // Immediately after typing, no search yet (debouncing)
    expect(getSearchCount()).toBe(0);

    // Wait for debounce (500ms + buffer)
    await waitFor(
      () => {
        expect(getSearchCount()).toBe(1); // Only called once
        expect(canvas.getByText('Result 1 for "react"')).toBeInTheDocument();
      },
      { timeout: 700 }
    );
  },
};

export const AutoSaveForm: Story = {
  render: () => <AutoSaveFormDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Auto-save form data with debounced callback. Save executes 1 second after editing stops, with manual cancel and flush options.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameInput = canvas.getByPlaceholderText("Enter your name");

    // Helper to get save count
    const getSaveCount = () => {
      const text = canvas.getByText("Save Count:", { exact: false });
      const parent = text.closest("div");
      const match = parent?.textContent?.match(/Save Count:\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Initially no saves
    expect(getSaveCount()).toBe(0);

    // Type rapidly
    await userEvent.type(nameInput, "John Doe", { delay: 50 });

    // Immediately after typing, not saved yet (debouncing)
    expect(getSaveCount()).toBe(0);

    // Wait for auto-save (1000ms + buffer)
    await waitFor(
      () => {
        expect(getSaveCount()).toBe(1);
        expect(
          canvas.getByText("Last Saved:", { exact: false })
        ).toBeInTheDocument();
      },
      { timeout: 1200 }
    );
  },
};

export const LeadingEdge: Story = {
  render: () => <LeadingEdgeDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Leading edge callback fires immediately on first call, then blocks subsequent calls for the delay period. Useful for actions that should happen immediately but not too frequently.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /Click Me!/i });

    // Helper to get processed count
    const getProcessedCount = () => {
      const text = canvas.getByText("Processed (Debounced):", { exact: false });
      const parent = text.closest("div");
      const match = parent?.textContent?.match(
        /Processed \(Debounced\):\s*(\d+)/
      );
      return match ? parseInt(match[1], 10) : 0;
    };

    // Initially no processing
    expect(getProcessedCount()).toBe(0);

    // First click - leading edge should execute immediately
    await userEvent.click(button);

    // Immediately check (leading edge executes on first call)
    await waitFor(
      () => {
        expect(getProcessedCount()).toBe(1);
      },
      { timeout: 100 }
    );

    // Click rapidly within 500ms (should be blocked)
    await userEvent.click(button);
    await userEvent.click(button);

    // Still 1 (blocked by debounce - leading already fired)
    expect(getProcessedCount()).toBe(1);

    // Wait for trailing edge to complete (500ms + buffer)
    await waitFor(
      () => {
        expect(getProcessedCount()).toBe(2);
      },
      { timeout: 700 }
    );

    // Wait a bit more to ensure debounce cycle is fully reset
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Click again - should execute immediately (leading edge on new cycle)
    await userEvent.click(button);

    await waitFor(
      () => {
        expect(getProcessedCount()).toBe(3);
      },
      { timeout: 200 }
    );
  },
};

export const MaxWait: Story = {
  render: () => <MaxWaitDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "MaxWait ensures callback executes at least once within the specified maximum time, even during continuous input. Perfect for periodic auto-save during extended editing sessions.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const textarea = canvas.getByPlaceholderText(
      /Keep typing without stopping/i
    );

    // Initial invocation count should be 0
    const getInvocationCount = () => {
      const text = canvas.getByText("Callback Invocations:", { exact: false });
      const parent = text.closest("div");
      const match = parent?.textContent?.match(/Callback Invocations:\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    expect(getInvocationCount()).toBe(0);

    // Type continuously with 100ms delay between characters
    // Total typing time: ~4.5 seconds (45 chars * 100ms)
    // This is less than maxWait (5000ms), so callback should fire once at 5000ms
    await userEvent.type(
      textarea,
      "This is a long text to test maxWait feature...",
      { delay: 200 }
    );

    // Wait for maxWait to trigger (5000ms + buffer)
    await waitFor(
      () => {
        expect(getInvocationCount()).toBeGreaterThanOrEqual(1);
      },
      { timeout: 6000 }
    );
  },
};

// Cancel Demo
function CancelDemo() {
  const [input, setInput] = useState("");
  const [submitCount, setSubmitCount] = useState(0);
  const [cancelCount, setCancelCount] = useState(0);
  const [lastSubmitted, setLastSubmitted] = useState<string>("");

  const handleSubmit = useDebounceCallback((value: string) => {
    setSubmitCount((prev) => prev + 1);
    setLastSubmitted(value);
  }, 2000);

  return (
    <div className="p-8 max-w-[600px] font-sans">
      <h2 className={storyTheme.title}>Cancel Pending Callback</h2>
      <p className="text-gray-500 mb-6 text-[0.95rem]">
        Type and click cancel before 2 seconds to prevent submission. The cancel
        button clears any pending debounced callbacks.
      </p>

      <div className="mb-4">
        <label
          htmlFor="cancel-input"
          className="block mb-2 font-semibold text-gray-700 text-[0.95rem]"
        >
          Input Field
        </label>
        <input
          id="cancel-input"
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleSubmit(e.target.value);
          }}
          placeholder="Type something..."
          className={storyTheme.input}
        />
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => {
            handleSubmit.cancel();
            setCancelCount((prev) => prev + 1);
          }}
          aria-label="Cancel submission"
          className="flex-1 py-3 px-4 text-[0.95rem] bg-red-600 text-white border-none rounded-lg cursor-pointer transition-colors duration-200 font-semibold hover:bg-red-700"
        >
          Cancel Pending
        </button>
        <button
          onClick={() => {
            setInput("");
            setSubmitCount(0);
            setCancelCount(0);
            setLastSubmitted("");
          }}
          className="flex-1 py-3 px-4 text-[0.95rem] bg-gray-600 text-white border-none rounded-lg cursor-pointer transition-colors duration-200 font-semibold hover:bg-gray-700"
        >
          Reset
        </button>
      </div>

      <div className="p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="mb-2 text-[0.95rem]">
          <strong className="text-gray-700">Current Input:</strong>{" "}
          <span className="text-gray-500">{input || "(empty)"}</span>
        </div>
        <div className="mb-2 text-[0.95rem]">
          <strong className="text-gray-700">Last Submitted:</strong>{" "}
          <span className="text-gray-500">{lastSubmitted || "(none)"}</span>
        </div>
        <div className="mb-2 text-[0.95rem]">
          <strong className="text-gray-700">Submit Count:</strong>{" "}
          <span className={storyTheme.statValue}>{submitCount}</span>
        </div>
        <div className="text-[0.95rem]">
          <strong className="text-gray-700">Cancel Count:</strong>{" "}
          <span className="text-red-600 font-bold text-[1.1rem]">
            {cancelCount}
          </span>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
        <p className="m-0 text-sm text-yellow-800">
          💡 Try typing something and clicking <strong>Cancel Pending</strong>{" "}
          within 2 seconds. The submission will be prevented!
        </p>
      </div>
    </div>
  );
}

export const Cancel: Story = {
  render: () => <CancelDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Cancel method allows you to abort pending debounced callbacks. Useful for preventing unwanted API calls or actions when user changes their mind.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByPlaceholderText("Type something...");
    const cancelButton = canvas.getByLabelText("Cancel submission");

    // Type something
    await userEvent.type(input, "test input");

    // Immediately cancel
    await userEvent.click(cancelButton);

    // Wait to ensure no submission happens
    await new Promise((resolve) => setTimeout(resolve, 2100));

    // Verify submit count is still 0
    await waitFor(
      async () => {
        const submitText = canvas.getByText("Submit Count:", { exact: false });
        const parent = submitText.closest("div");
        expect(parent?.textContent).toContain("0");
      },
      { timeout: 500 }
    );

    // Verify cancel count increased
    await waitFor(
      async () => {
        const cancelText = canvas.getByText("Cancel Count:", { exact: false });
        const parent = cancelText.closest("div");
        expect(parent?.textContent).toContain("1");
      },
      { timeout: 500 }
    );
  },
};
