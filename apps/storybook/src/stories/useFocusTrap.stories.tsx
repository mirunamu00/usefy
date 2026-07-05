import React, { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useFocusTrap } from "@usefy/use-focus-trap";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/**
 * Modal demo — focus is trapped inside the dialog while it's open. Tab and
 * Shift+Tab cycle only through the dialog's fields/buttons, Escape closes it,
 * and focus returns to the "Open dialog" trigger on close.
 */
function ModalTrapDemo() {
  const [open, setOpen] = useState(false);
  const ref = useFocusTrap<HTMLDivElement>(open, {
    onEscape: () => setOpen(false),
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>useFocusTrap</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Open the dialog — <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> cycle
        only inside it, <kbd>Esc</kbd> closes, and focus returns to the trigger
      </p>

      <button
        type="button"
        data-testid="open"
        className={`${storyTheme.buttonPrimary} w-full`}
        onClick={() => setOpen(true)}
      >
        Open dialog
      </button>

      <p className={`${storyTheme.subtitle} mt-4 text-center`}>
        Focus can't leave the dialog while it's open — try tabbing past the last
        button.
      </p>

      {open && (
        <div
          data-testid="overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
        >
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label="Sign up"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Sign up</h3>

            <label className={storyTheme.label} htmlFor="ft-name">
              Name
            </label>
            <input
              id="ft-name"
              data-testid="field-name"
              className={`${storyTheme.input} mb-3`}
              placeholder="Ada Lovelace"
            />

            <label className={storyTheme.label} htmlFor="ft-email">
              Email
            </label>
            <input
              id="ft-email"
              data-testid="field-email"
              className={`${storyTheme.input} mb-5`}
              placeholder="ada@example.com"
            />

            <div className={storyTheme.buttonGroup}>
              <button
                type="button"
                data-testid="cancel"
                className={`${storyTheme.buttonNeutral} flex-1`}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="save"
                className={`${storyTheme.buttonPrimary} flex-1`}
                onClick={() => setOpen(false)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Custom initial focus — instead of the first field, focus lands on the element
 * you point `initialFocus` at (here, the "Email" input). Return focus still goes
 * back to the trigger on close.
 */
function CustomInitialFocusDemo() {
  const [open, setOpen] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const ref = useFocusTrap<HTMLDivElement>(open, {
    initialFocus: emailRef,
    onEscape: () => setOpen(false),
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>initialFocus</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Focus starts on the <strong>Email</strong> field, not the first one
      </p>

      <button
        type="button"
        data-testid="open"
        className={`${storyTheme.buttonPrimary} w-full`}
        onClick={() => setOpen(true)}
      >
        Open dialog
      </button>

      {open && (
        <div
          data-testid="overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
        >
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label="Edit profile"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Edit profile
            </h3>

            <label className={storyTheme.label} htmlFor="ci-name">
              Name
            </label>
            <input
              id="ci-name"
              data-testid="field-name"
              className={`${storyTheme.input} mb-3`}
              defaultValue="Ada Lovelace"
            />

            <label className={storyTheme.label} htmlFor="ci-email">
              Email
            </label>
            <input
              id="ci-email"
              ref={emailRef}
              data-testid="field-email"
              className={`${storyTheme.input} mb-5`}
              defaultValue="ada@example.com"
            />

            <button
              type="button"
              data-testid="close"
              className={`${storyTheme.buttonNeutral} w-full`}
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof ModalTrapDemo> = {
  title: "Hooks/useFocusTrap",
  component: ModalTrapDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Trap keyboard focus inside a subtree — the accessibility primitive behind modals, dialogs, drawers, and popovers. While active, \`Tab\` / \`Shift+Tab\` cycle only through the container's focusable elements, focus is moved in on activation, and restored to wherever it was when the trap deactivates or unmounts.

It does **one** thing — trapping focus. It doesn't lock body scroll (that's \`@usefy/use-scroll-lock\`) and renders nothing; you attach the returned ref to your own container.

## Features
- **Wrap-around Tab** - \`Tab\` on the last element wraps to the first; \`Shift+Tab\` on the first wraps to the last (focusable set computed live on every keypress)
- **Robust focusable selector** - excludes \`disabled\`, \`hidden\`, \`inert\`, \`tabindex="-1"\`, and invisible elements
- **Initial focus** - configurable via \`initialFocus\` (defaults to the first focusable element, or the container)
- **Return focus** - restores focus to the trigger on close via \`returnFocus\` (default), overridable or disablable
- **Escape** - surfaces \`onEscape\` so you close the dialog from your own state; the hook never owns open/close
- **SSR-safe & StrictMode-safe** - no server DOM access; cleanup always removes the listener and restores focus

## Basic Usage
\`\`\`tsx
const [open, setOpen] = useState(false);
const ref = useFocusTrap<HTMLDivElement>(open, {
  onEscape: () => setOpen(false),
});

return open ? (
  <div ref={ref} role="dialog" aria-modal="true">
    <input placeholder="Name" />
    <button onClick={() => setOpen(false)}>Close</button>
  </div>
) : null;
\`\`\`
`,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ModalTrapDemo>;

export const ModalTrap: Story = {
  render: () => <ModalTrapDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A modal dialog with focus trapped inside it — Tab cycles through the fields and buttons, Escape closes it, and focus returns to the trigger on close.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { useFocusTrap } from "@usefy/use-focus-trap";

function Dialog() {
  const [open, setOpen] = useState(false);
  // Focus is trapped while \`open\`, moved to the first field on open, and
  // restored to the trigger on close. Escape is surfaced so you own the state.
  const ref = useFocusTrap<HTMLDivElement>(open, {
    onEscape: () => setOpen(false),
  });

  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      {open && (
        <div className="overlay">
          <div ref={ref} role="dialog" aria-modal="true" aria-label="Sign up">
            <input placeholder="Name" />
            <input placeholder="Email" />
            <button onClick={() => setOpen(false)}>Cancel</button>
            <button onClick={() => setOpen(false)}>Save</button>
          </div>
        </div>
      )}
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId("open"));

    // The dialog opens and focus moves onto the first field.
    await waitFor(() => {
      expect(canvas.getByTestId("overlay")).toBeInTheDocument();
      expect(canvas.getByTestId("field-name")).toHaveFocus();
    });

    // Escape closes the dialog (surfaced via onEscape) and returns focus.
    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(canvas.queryByTestId("overlay")).not.toBeInTheDocument();
      expect(canvas.getByTestId("open")).toHaveFocus();
    });
  },
};

export const CustomInitialFocus: Story = {
  render: () => <CustomInitialFocusDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Point `initialFocus` at a specific element (a ref, element, or getter) to choose where focus lands — here the Email field instead of the first field.",
      },
      source: {
        language: "tsx",
        code: `import { useRef, useState } from "react";
import { useFocusTrap } from "@usefy/use-focus-trap";

function EditProfile() {
  const [open, setOpen] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Focus the Email field on open instead of the first field.
  const ref = useFocusTrap<HTMLDivElement>(open, {
    initialFocus: emailRef,
    onEscape: () => setOpen(false),
  });

  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      {open && (
        <div ref={ref} role="dialog" aria-modal="true" aria-label="Edit profile">
          <input defaultValue="Ada Lovelace" />
          <input ref={emailRef} defaultValue="ada@example.com" />
          <button onClick={() => setOpen(false)}>Done</button>
        </div>
      )}
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId("open"));

    // Focus lands on the Email field, not the first (Name) field.
    await waitFor(() => {
      expect(canvas.getByTestId("field-email")).toHaveFocus();
    });
    expect(canvas.getByTestId("field-name")).not.toHaveFocus();
  },
};
