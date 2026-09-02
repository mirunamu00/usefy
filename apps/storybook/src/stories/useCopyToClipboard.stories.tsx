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
      <h2 className={storyTheme.title + " text-center mb-8 text-3xl font-semibold tracking-tight text-zinc-900"}>
        useCopyToClipboard Demo
      </h2>

      {/* Input Field */}
      <div className="mb-6 bg-white p-1 rounded-md shadow-sm border border-zinc-200 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={storyTheme.input + " w-full border-none focus:ring-0 rounded-md bg-transparent px-4 py-3 text-zinc-700 placeholder:text-zinc-400 font-medium"}
          data-testid="copy-input"
          placeholder="Type text to copy..."
        />
      </div>

      {/* Copy Button */}
      <button
        onClick={() => copy(inputText)}
        data-testid="copy-button"
        aria-label="Copy text to clipboard"
        className={`w-full py-4 px-6 text-lg font-bold border-none rounded-md cursor-pointer transition-all duration-200 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2 ${
          isCopied
            ? "bg-emerald-500 text-white"
            : "bg-violet-600 text-white"
        }`}
      >
        {isCopied ? "Copied!" : "Copy to Clipboard"}
      </button>

      {/* Status Display */}
      <div className="mt-8">
        <div
          data-testid="status-display"
          role="status"
          aria-live="polite"
          className={storyTheme.statBox + " bg-white rounded-md p-6 shadow-sm border border-zinc-100"}
        >
          <div className="flex justify-between items-center mb-4">
             <span className="text-xs font-bold text-zinc-400">Copied Text</span>
             <span className="text-xs font-bold text-zinc-400">Status</span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className="font-mono text-sm bg-zinc-50 px-3 py-1.5 rounded-lg text-zinc-700 border border-zinc-200 max-w-[200px] truncate"
              data-testid="copied-text-value"
            >
              {copiedText ?? "(none)"}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${isCopied ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}
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
      <div className={storyTheme.infoBox + " mt-6 bg-zinc-50 border border-zinc-200 rounded-md p-5"}>
        <p className={storyTheme.infoText + " text-zinc-600 text-center text-sm"}>
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
      <h2 className={storyTheme.title + " mb-8 text-3xl font-semibold tracking-tight text-zinc-900"}>Multiple Copy Targets</h2>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-md shadow-sm hover:shadow-sm transition-all duration-200"
          >
            <div>
              <span className="text-sm text-zinc-500">{item.label}</span>
              <p
                className="font-mono text-zinc-800"
                data-testid={`value-${item.label.toLowerCase()}`}
              >
                {item.value}
              </p>
            </div>
            <button
              onClick={() => copy(item.value)}
              data-testid={`copy-${item.label.toLowerCase()}`}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 ${
                copiedText === item.value
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200"
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
        component: `Copy text to the clipboard with the async **Clipboard API**, falling back to a hidden \`textarea\` + \`document.execCommand("copy")\` for older browsers. Tracks the most recently copied text so you can flip a button to a "Copied!" state, and auto-resets it after a configurable timeout.

Returns a tuple \`[copiedText, copy]\`: \`copiedText\` is the last successfully copied string (or \`null\`), and \`copy(text)\` returns a \`Promise<boolean>\` that resolves to whether the copy succeeded. It's SSR-safe (\`copy\` reports failure instead of throwing when no \`window\` is present) and cleans up its reset timer on unmount.

## Features
- **Tuple API** — \`const [copiedText, copy] = useCopyToClipboard()\`; \`copiedText\` doubles as your "just copied" flag
- **Async \`copy\`** — returns \`Promise<boolean>\` so you can await the result and branch on success/failure
- **Graceful fallback** — uses \`navigator.clipboard\` when available, otherwise a hidden-\`textarea\` \`execCommand\` fallback
- **\`timeout\`** — auto-resets \`copiedText\` to \`null\` after N ms (default \`2000\`); set \`0\` to keep it until the next copy
- **\`onSuccess\` / \`onError\`** — callbacks fired with the copied text or the thrown \`Error\`
- **StrictMode & unmount safe** — post-await state updates and the reset timer are guarded once unmounted; the latest copy always wins

## Basic Usage
\`\`\`tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function CopyButton() {
  const [copiedText, copy] = useCopyToClipboard({ timeout: 2000 });

  return (
    <button onClick={() => copy("Hello, World!")}>
      {copiedText ? "Copied!" : "Copy"}
    </button>
  );
}
\`\`\``,
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
      description: {
        story:
          "Default usage: click Copy to write the input text to the clipboard, and `copiedText` flips the button to the copied state until it auto-resets after 2000ms.",
      },
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
      description: {
        story:
          "Wires up the `onSuccess` and `onError` callbacks to surface a status message whenever a copy succeeds or fails.",
      },
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
      description: {
        story:
          "With `timeout: 0` the copied state never auto-resets — `copiedText` stays set until the next copy, so you control when to clear it.",
      },
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
      description: {
        story:
          "A longer `timeout: 5000` keeps the copied state visible for 5 seconds before it auto-resets to null.",
      },
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
      description: {
        story:
          "A single hook instance drives several copy buttons: comparing `copiedText` against each value shows which item was most recently copied.",
      },
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
      description: {
        story:
          "Copies whatever the user types into the input, showing that `copy()` works with any dynamic string, not just static values.",
      },
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
