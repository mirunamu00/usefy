import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Demo component for useCopyToClipboard
 */
function CopyToClipboardDemo({
  timeout = 2000,
  showCallbacks = false,
}: {
  timeout?: number;
  showCallbacks?: boolean;
}) {
  const [inputText, setInputText] = useState("Hello, World!");
  const [lastAction, setLastAction] = useState<string | null>(null);

  const [copiedText, copy] = useCopyToClipboard({
    timeout,
    onSuccess: showCallbacks
      ? (text) => setLastAction(`Success: Copied "${text}"`)
      : undefined,
    onError: showCallbacks
      ? (error) => setLastAction(`Error: ${error.message}`)
      : undefined,
  });

  const isCopied = copiedText !== null;

  return (
    <div className={storyTheme.containerCentered + " max-w-md mx-auto"}>
      <h2 className={storyTheme.title + " text-center mb-8 text-3xl font-extrabold tracking-tight text-slate-900"}>
        useCopyToClipboard Demo
      </h2>

      {/* Input Field */}
      <div className="mb-6 bg-white p-1 rounded-2xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={storyTheme.input + " w-full border-none focus:ring-0 rounded-xl bg-transparent px-4 py-3 text-slate-700 placeholder:text-slate-400 font-medium"}
          data-testid="copy-input"
          placeholder="Type text to copy..."
        />
      </div>

      {/* Copy Button */}
      <button
        onClick={() => copy(inputText)}
        data-testid="copy-button"
        aria-label="Copy text to clipboard"
        className={`w-full py-4 px-6 text-lg font-bold border-none rounded-2xl cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 ${
          isCopied
            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30"
            : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/30 hover:-translate-y-0.5"
        }`}
      >
        {isCopied ? <><span>✨</span> Copied!</> : <><span>📋</span> Copy to Clipboard</>}
      </button>

      {/* Status Display */}
      <div className="mt-8">
        <div
          data-testid="status-display"
          role="status"
          aria-live="polite"
          className={storyTheme.statBox + " bg-white rounded-2xl p-6 shadow-sm border border-slate-100"}
        >
          <div className="flex justify-between items-center mb-4">
             <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Copied Text</span>
             <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className="font-mono text-sm bg-slate-50 px-3 py-1.5 rounded-lg text-slate-700 border border-slate-200 max-w-[200px] truncate"
              data-testid="copied-text-value"
            >
              {copiedText ?? "(none)"}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isCopied ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
              data-testid="copy-status"
            >
              {isCopied ? "Copied" : "Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* Callback Messages */}
      {showCallbacks && lastAction && (
        <div
          className={
            lastAction.startsWith("Success")
              ? storyTheme.messageSuccess
              : storyTheme.messageError
          }
          data-testid="callback-message"
        >
          {lastAction}
        </div>
      )}

      {/* Info Box */}
      <div className={storyTheme.infoBox + " mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600 text-center text-sm"}>
          <span className="font-semibold">Timeout:</span> {timeout === 0 ? "No auto-reset" : `${timeout}ms`}
        </p>
      </div>
    </div>
  );
}

/**
 * Demo with multiple copy targets
 */
function MultipleInputsDemo() {
  const [copiedText, copy] = useCopyToClipboard({ timeout: 2000 });

  const items = [
    { label: "Email", value: "example@email.com" },
    { label: "Phone", value: "+1-234-567-8900" },
    { label: "Address", value: "123 Main St, City, Country" },
    { label: "Code", value: "ABC-123-XYZ" },
  ];

  return (
    <div className={storyTheme.container + " max-w-2xl mx-auto"}>
      <h2 className={storyTheme.title + " mb-8 text-3xl font-extrabold tracking-tight text-slate-900"}>Multiple Copy Targets</h2>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div>
              <span className="text-sm text-gray-500">{item.label}</span>
              <p
                className="font-mono text-gray-800"
                data-testid={`value-${item.label.toLowerCase()}`}
              >
                {item.value}
              </p>
            </div>
            <button
              onClick={() => copy(item.value)}
              data-testid={`copy-${item.label.toLowerCase()}`}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                copiedText === item.value
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
              }`}
            >
              {copiedText === item.value ? "Copied!" : "Copy"}
            </button>
          </div>
        ))}
      </div>

      {copiedText && (
        <div className={storyTheme.messageSuccess + " mt-4"}>
          Last copied: {copiedText}
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof CopyToClipboardDemo> = {
  title: "Hooks/useCopyToClipboard",
  component: CopyToClipboardDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A hook for copying text to the clipboard using the Clipboard API with fallback support for older browsers.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    timeout: {
      control: { type: "number" },
      description:
        "Time in milliseconds before copiedText resets to null. Set to 0 to disable auto-reset.",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "2000" },
      },
    },
    showCallbacks: {
      control: "boolean",
      description: "Show callback messages (onSuccess/onError)",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CopyToClipboardDemo>;

/**
 * Default usage with 2 second timeout
 */
export const Default: Story = {
  args: {
    timeout: 2000,
    showCallbacks: false,
  },
  parameters: {
    docs: {
      source: {
        code: `import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";
import { useState } from "react";

function CopyButton() {
  const [text, setText] = useState("Hello, World!");
  const [copiedText, copy] = useCopyToClipboard({ timeout: 2000 });

  const isCopied = copiedText !== null;

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => copy(text)}>
        {isCopied ? "Copied!" : "Copy to Clipboard"}
      </button>
      {copiedText && <p>Copied: {copiedText}</p>}
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
    await expect(canvas.getByTestId("copied-text-value")).toHaveTextContent(
      "(none)"
    );
    await expect(canvas.getByTestId("copy-status")).toHaveTextContent("Ready");

    // Click copy button
    await userEvent.click(canvas.getByTestId("copy-button"));

    // Should show copied state
    await waitFor(() => {
      expect(canvas.getByTestId("copy-button")).toHaveTextContent("Copied!");
    });
    await expect(canvas.getByTestId("copy-status")).toHaveTextContent("Copied");
  },
};

/**
 * With callback messages displayed
 */
export const WithCallbacks: Story = {
  args: {
    timeout: 2000,
    showCallbacks: true,
  },
  parameters: {
    docs: {
      source: {
        code: `import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";
import { useState } from "react";

function CopyWithCallbacks() {
  const [text, setText] = useState("Hello, World!");
  const [message, setMessage] = useState<string | null>(null);

  const [copiedText, copy] = useCopyToClipboard({
    timeout: 2000,
    onSuccess: (copied) => {
      setMessage(\`Success: Copied "\${copied}"\`);
    },
    onError: (error) => {
      setMessage(\`Error: \${error.message}\`);
    },
  });

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => copy(text)}>Copy</button>
      {message && <p>{message}</p>}
      {copiedText && <p>Copied: {copiedText}</p>}
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

    // Click copy button
    await userEvent.click(canvas.getByTestId("copy-button"));

    // Should show success callback message
    await waitFor(() => {
      expect(canvas.getByTestId("callback-message")).toBeInTheDocument();
    });
  },
};

/**
 * No auto-reset (timeout: 0)
 */
export const NoAutoReset: Story = {
  args: {
    timeout: 0,
    showCallbacks: false,
  },
  parameters: {
    docs: {
      source: {
        code: `import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";
import { useState } from "react";

function CopyNoReset() {
  const [text, setText] = useState("Hello, World!");
  const [copiedText, copy] = useCopyToClipboard({ timeout: 0 });

  // timeout: 0 means copiedText never auto-resets to null
  // You'll need to manually reset it if needed

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => copy(text)}>Copy</button>
      {copiedText && <p>Copied: {copiedText} (stays copied)</p>}
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

    // Click copy button
    await userEvent.click(canvas.getByTestId("copy-button"));

    // Should show copied state
    await waitFor(() => {
      expect(canvas.getByTestId("copy-status")).toHaveTextContent("Copied");
    });

    // Verify info shows no auto-reset
    await expect(canvas.getByText("Timeout:")).toBeInTheDocument();
    await expect(canvas.getByText("No auto-reset")).toBeInTheDocument();
  },
};

/**
 * Custom timeout (5 seconds)
 */
export const LongTimeout: Story = {
  args: {
    timeout: 5000,
    showCallbacks: false,
  },
  parameters: {
    docs: {
      source: {
        code: `import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";
import { useState } from "react";

function CopyLongTimeout() {
  const [text, setText] = useState("Hello, World!");
  const [copiedText, copy] = useCopyToClipboard({ timeout: 5000 });

  // copiedText will reset to null after 5 seconds

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => copy(text)}>Copy</button>
      {copiedText && <p>Copied: {copiedText}</p>}
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
};

/**
 * Multiple copy targets demo
 */
export const MultipleInputs: StoryObj<typeof MultipleInputsDemo> = {
  render: () => <MultipleInputsDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function MultipleCopyTargets() {
  const [copiedText, copy] = useCopyToClipboard({ timeout: 2000 });

  const items = [
    { label: "Email", value: "example@email.com" },
    { label: "Phone", value: "+1-234-567-8900" },
    { label: "Address", value: "123 Main St" },
  ];

  return (
    <div>
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}: {item.value}</span>
          <button onClick={() => copy(item.value)}>
            {copiedText === item.value ? "Copied!" : "Copy"}
          </button>
        </div>
      ))}
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

    // Copy email
    await userEvent.click(canvas.getByTestId("copy-email"));

    await waitFor(() => {
      expect(canvas.getByTestId("copy-email")).toHaveTextContent("Copied!");
    });

    // Copy phone (should switch the copied state)
    await userEvent.click(canvas.getByTestId("copy-phone"));

    await waitFor(() => {
      expect(canvas.getByTestId("copy-phone")).toHaveTextContent("Copied!");
      expect(canvas.getByTestId("copy-email")).toHaveTextContent("Copy");
    });
  },
};

/**
 * Custom text input
 */
export const CustomText: Story = {
  args: {
    timeout: 2000,
    showCallbacks: false,
  },
  parameters: {
    docs: {
      source: {
        code: `import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";
import { useState } from "react";

function CustomTextCopy() {
  const [inputText, setInputText] = useState("");
  const [copiedText, copy] = useCopyToClipboard({ timeout: 2000 });

  return (
    <div>
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text to copy..."
      />
      <button onClick={() => copy(inputText)}>
        Copy
      </button>
      {copiedText && <p>Copied: {copiedText}</p>}
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

    // Clear and type custom text
    const input = canvas.getByTestId("copy-input");
    await userEvent.clear(input);
    await userEvent.type(input, "Custom copied text!");

    // Copy the custom text
    await userEvent.click(canvas.getByTestId("copy-button"));

    // Verify the custom text was copied
    await waitFor(() => {
      expect(canvas.getByTestId("copied-text-value")).toHaveTextContent(
        "Custom copied text!"
      );
    });
  },
};
