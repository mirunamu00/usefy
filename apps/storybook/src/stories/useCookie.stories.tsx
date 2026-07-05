import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useCookie } from "@usefy/use-cookie";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Basic string-cookie demo: read/write a cookie and see the raw `document.cookie`.
 */
function CookieDemo({
  cookieKey = "demo-cookie",
  initialValue = "Hello!",
}: {
  cookieKey?: string;
  initialValue?: string;
}) {
  const [value, setValue, remove] = useCookie<string>(cookieKey, {
    initialValue,
  });
  const [inputValue, setInputValue] = useState("");

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useCookie Demo</h2>
      <p className={storyTheme.subtitle}>
        Read and write a browser cookie as React state.
      </p>

      <div className={storyTheme.statBox + " mb-6"}>
        <label className={storyTheme.statLabel}>Cookie value:</label>
        <div
          data-testid="cookie-value"
          className="text-lg font-mono bg-white p-4 rounded-xl border border-slate-200 text-slate-800"
        >
          {value ?? "(none)"}
        </div>
      </div>

      <div className="mb-6">
        <label className={storyTheme.label}>New value:</label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter new value..."
          className={storyTheme.input}
          data-testid="value-input"
        />
      </div>

      <div className="flex gap-3 flex-wrap mb-6">
        <button
          onClick={() => {
            setValue(inputValue);
            setInputValue("");
          }}
          className={storyTheme.buttonPrimary}
          data-testid="set-button"
        >
          Set Cookie
        </button>
        <button
          onClick={remove}
          className={storyTheme.buttonDanger}
          data-testid="remove-button"
        >
          Remove Cookie
        </button>
      </div>

      <div className={storyTheme.card}>
        <label className={storyTheme.statLabel}>Raw document.cookie:</label>
        <pre
          className="font-mono text-xs bg-white p-3 rounded-lg border border-slate-200 overflow-auto text-slate-600 whitespace-pre-wrap break-all"
          data-testid="raw-cookie"
        >
          {typeof document !== "undefined" ? document.cookie || "(empty)" : ""}
        </pre>
        <p className={storyTheme.infoText + " mt-3 text-slate-500"}>
          Cookie key: <code className="font-mono">{cookieKey}</code>
        </p>
      </div>
    </div>
  );
}

/**
 * Object-cookie demo: values are JSON-serialized automatically.
 */
interface Prefs {
  theme: "light" | "dark";
  compact: boolean;
}

function ObjectCookieDemo() {
  const [prefs, setPrefs, reset] = useCookie<Prefs>("prefs-cookie", {
    initialValue: { theme: "light", compact: false },
    maxAge: 60 * 60 * 24 * 7, // one week
  });

  const current = prefs ?? { theme: "light", compact: false };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Object Cookie</h2>
      <p className={storyTheme.subtitle}>
        Objects are JSON-serialized into the cookie automatically.
      </p>

      <div className={storyTheme.statBox + " mb-6"}>
        <pre
          className="font-mono text-sm bg-white p-4 rounded-xl border border-slate-200 overflow-auto text-slate-700"
          data-testid="prefs-display"
        >
          {JSON.stringify(current, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <label className={storyTheme.label}>Theme:</label>
        <div className={storyTheme.buttonGroup}>
          <button
            onClick={() => setPrefs((p) => ({ ...p!, theme: "light" }))}
            className={
              current.theme === "light"
                ? storyTheme.buttonPrimary
                : storyTheme.buttonNeutral
            }
            data-testid="theme-light"
          >
            Light
          </button>
          <button
            onClick={() => setPrefs((p) => ({ ...p!, theme: "dark" }))}
            className={
              current.theme === "dark"
                ? storyTheme.buttonPrimary
                : storyTheme.buttonNeutral
            }
            data-testid="theme-dark"
          >
            Dark
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className={storyTheme.label}>Compact:</label>
        <button
          onClick={() => setPrefs((p) => ({ ...p!, compact: !p!.compact }))}
          className={
            current.compact ? storyTheme.buttonSuccess : storyTheme.buttonNeutral
          }
          data-testid="compact-toggle"
        >
          {current.compact ? "On" : "Off"}
        </button>
      </div>

      <button
        onClick={reset}
        className={storyTheme.buttonDanger}
        data-testid="reset-prefs"
      >
        Reset to Defaults
      </button>
    </div>
  );
}

/**
 * Same-document sync demo: two components share a cookie key and stay in sync.
 */
function SyncDemo() {
  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Same-Document Sync</h2>
      <p className={storyTheme.subtitle}>
        Both panels use <code>useCookie("shared-count")</code> — updating one
        updates the other instantly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <SyncPanel name="A" />
        <SyncPanel name="B" />
      </div>

      <div className={storyTheme.infoBox}>
        <p className={storyTheme.infoText}>
          <strong>Note:</strong> cookies have no <code>storage</code> event, so
          writes from <em>other tabs</em> are not observed without polling.
          Same-document instances always sync.
        </p>
      </div>
    </div>
  );
}

function SyncPanel({ name }: { name: string }) {
  const [count, setCount, reset] = useCookie<number>("shared-count", {
    initialValue: 0,
  });

  return (
    <div className={storyTheme.card} data-testid={`panel-${name}`}>
      <h3 className="font-semibold text-gray-800 mb-3 text-center">
        Panel {name}
      </h3>
      <div
        className="text-4xl font-bold text-center mb-4 py-3 bg-white rounded-lg"
        data-testid={`count-${name}`}
      >
        {count ?? 0}
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        <button
          onClick={() => setCount((c) => (c ?? 0) - 1)}
          className={storyTheme.buttonNeutral}
          data-testid={`dec-${name}`}
        >
          -1
        </button>
        <button
          onClick={() => setCount((c) => (c ?? 0) + 1)}
          className={storyTheme.buttonPrimary}
          data-testid={`inc-${name}`}
        >
          +1
        </button>
        <button
          onClick={reset}
          className={storyTheme.buttonNeutral}
          data-testid={`reset-${name}`}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof CookieDemo> = {
  title: "Hooks/useCookie",
  component: CookieDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "Read and write a browser **cookie** as React state — the cookie sibling of `useLocalStorage` / `useSessionStorage`.",
          "",
          "## Features",
          "- `useState`-like tuple: `[value, setValue, remove]`",
          "- Cookie write attributes: `expires`, `maxAge`, `path`, `domain`, `secure`, `sameSite`",
          "- JSON (de)serialization by default, with a safe fallback to the raw string for plain cookies",
          "- Same-document synchronization across instances sharing a key",
          "- SSR-safe: guards `document` and returns `initialValue` on the server",
          "",
          "## Basic Usage",
          "```tsx",
          'import { useCookie } from "@usefy/use-cookie";',
          "",
          "function ThemeToggle() {",
          '  const [theme, setTheme, removeTheme] = useCookie("theme", {',
          '    initialValue: "light",',
          "  });",
          "",
          "  return (",
          "    <div>",
          "      <p>{theme}</p>",
          '      <button onClick={() => setTheme("dark")}>Dark</button>',
          "      <button onClick={removeTheme}>Reset</button>",
          "    </div>",
          "  );",
          "}",
          "```",
        ].join("\n"),
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    cookieKey: {
      control: "text",
      description: "The cookie name",
      table: { type: { summary: "string" } },
    },
    initialValue: {
      control: "text",
      description: "Value used when the cookie is absent",
      table: { type: { summary: "T | (() => T)" } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CookieDemo>;

/**
 * Basic string cookie — set a value, remove it, and watch `document.cookie`.
 */
export const Default: Story = {
  args: {
    cookieKey: "demo-cookie",
    initialValue: "Hello!",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Set and remove a plain string cookie, showing the raw document.cookie.",
      },
      source: {
        language: "tsx",
        code: `import { useCookie } from "@usefy/use-cookie";
import { useState } from "react";

function CookieExample() {
  const [value, setValue, remove] = useCookie("demo-cookie", {
    initialValue: "Hello!",
  });
  const [input, setInput] = useState("");

  return (
    <div>
      <div>Cookie value: {value ?? "(none)"}</div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={() => { setValue(input); setInput(""); }}>
        Set Cookie
      </button>
      <button onClick={remove}>Remove Cookie</button>
      <pre>{document.cookie}</pre>
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Start from a known state.
    await userEvent.click(canvas.getByTestId("remove-button"));
    await waitFor(() => {
      expect(canvas.getByTestId("cookie-value")).toHaveTextContent("Hello!");
    });

    const input = canvas.getByTestId("value-input");
    await userEvent.clear(input);
    await userEvent.type(input, "chocolate-chip");
    await userEvent.click(canvas.getByTestId("set-button"));

    await waitFor(() => {
      expect(canvas.getByTestId("cookie-value")).toHaveTextContent(
        "chocolate-chip"
      );
    });
    await expect(input).toHaveValue("");
  },
};

/**
 * Object cookie — values are JSON serialized into the cookie.
 */
export const ObjectValue: Story = {
  render: () => <ObjectCookieDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Store a typed object; it is JSON-serialized and persisted for a week via maxAge.",
      },
      source: {
        language: "tsx",
        code: `import { useCookie } from "@usefy/use-cookie";

interface Prefs {
  theme: "light" | "dark";
  compact: boolean;
}

function PrefsCookie() {
  const [prefs, setPrefs, reset] = useCookie<Prefs>("prefs-cookie", {
    initialValue: { theme: "light", compact: false },
    maxAge: 60 * 60 * 24 * 7, // one week
  });

  return (
    <div>
      <pre>{JSON.stringify(prefs, null, 2)}</pre>
      <button onClick={() => setPrefs((p) => ({ ...p!, theme: "dark" }))}>
        Dark
      </button>
      <button onClick={() => setPrefs((p) => ({ ...p!, compact: !p!.compact }))}>
        Toggle compact
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId("reset-prefs"));
    const display = canvas.getByTestId("prefs-display");
    await waitFor(() => {
      expect(display).toHaveTextContent('"theme": "light"');
    });

    await userEvent.click(canvas.getByTestId("theme-dark"));
    await waitFor(() => {
      expect(display).toHaveTextContent('"theme": "dark"');
    });

    await userEvent.click(canvas.getByTestId("compact-toggle"));
    await waitFor(() => {
      expect(display).toHaveTextContent('"compact": true');
    });
  },
};

/**
 * Same-document sync — two components sharing a key stay in sync.
 */
export const SameDocumentSync: Story = {
  render: () => <SyncDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Two components using the same cookie key sync within the document on set/remove.",
      },
      source: {
        language: "tsx",
        code: `import { useCookie } from "@usefy/use-cookie";

function Panel({ name }: { name: string }) {
  const [count, setCount, reset] = useCookie<number>("shared-count", {
    initialValue: 0,
  });

  return (
    <div>
      <h3>Panel {name}</h3>
      <div>{count ?? 0}</div>
      <button onClick={() => setCount((c) => (c ?? 0) + 1)}>+1</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

function SyncExample() {
  // Both panels read/write the same cookie and stay in sync.
  return (
    <div>
      <Panel name="A" />
      <Panel name="B" />
    </div>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId("reset-A"));
    await waitFor(() => {
      expect(canvas.getByTestId("count-A")).toHaveTextContent("0");
      expect(canvas.getByTestId("count-B")).toHaveTextContent("0");
    });

    await userEvent.click(canvas.getByTestId("inc-A"));
    await waitFor(() => {
      // Both panels reflect the update.
      expect(canvas.getByTestId("count-A")).toHaveTextContent("1");
      expect(canvas.getByTestId("count-B")).toHaveTextContent("1");
    });

    await userEvent.click(canvas.getByTestId("inc-B"));
    await waitFor(() => {
      expect(canvas.getByTestId("count-A")).toHaveTextContent("2");
      expect(canvas.getByTestId("count-B")).toHaveTextContent("2");
    });
  },
};
