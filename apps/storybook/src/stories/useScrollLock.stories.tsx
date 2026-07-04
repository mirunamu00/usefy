import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useScrollLock } from "@usefy/use-scroll-lock";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

/** Tall filler content that sits "behind" the overlay so the scroll lock is visible. */
function PageBackdrop() {
  return (
    <div className="mb-6 h-40 overflow-auto rounded-xl border-2 border-gray-200 shadow-inner">
      <div className="bg-gradient-to-b from-white to-indigo-50 p-4">
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i} className="py-1 text-sm text-gray-500">
            Background line {i + 1} — scroll me while the overlay is closed.
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * Imperative demo — lock the page scroll while a modal is open, then release it
 * on close. `lock` / `unlock` are stable, so the effect only runs when `open`
 * changes.
 */
function ModalScrollLockDemo() {
  const [open, setOpen] = useState(false);
  const { lock, unlock, isLocked } = useScrollLock();

  useEffect(() => {
    if (open) lock();
    else unlock();
  }, [open, lock, unlock]);

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>useScrollLock</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        Open the modal — the page (<code>document.body</code>) scroll is locked
        until you close it
      </p>

      <PageBackdrop />

      <button
        type="button"
        data-testid="open"
        className={`${storyTheme.buttonPrimary} w-full`}
        onClick={() => setOpen(true)}
      >
        Open modal
      </button>

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          This instance holds a lock:{" "}
          <span className={storyTheme.statValue} data-testid="is-locked">
            {String(isLocked)}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          <code>body.overflow</code>:{" "}
          <span className={storyTheme.statValue} data-testid="overflow">
            {isLocked ? "hidden" : "(default)"}
          </span>
        </p>
      </div>

      {open && (
        <div
          data-testid="overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Scroll is locked
            </h3>
            <p className="mb-5 text-sm text-gray-500">
              Try to scroll the page behind this dialog — it won't move.
            </p>
            <button
              type="button"
              data-testid="close"
              className={`${storyTheme.buttonNeutral} w-full`}
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Declarative demo — hand the lock's lifetime to the `enabled` option. It locks
 * on open and releases on close (or unmount) with no effect wiring of your own.
 */
function DrawerScrollLockDemo() {
  const [open, setOpen] = useState(false);
  const { isLocked } = useScrollLock({ enabled: open });

  return (
    <div className={storyTheme.container}>
      <h2 className={`${storyTheme.title} text-center`}>enabled convenience</h2>
      <p className={`${storyTheme.subtitle} text-center`}>
        <code>useScrollLock(&#123; enabled: open &#125;)</code> — the option owns
        the lock for the drawer's lifetime
      </p>

      <PageBackdrop />

      <button
        type="button"
        data-testid="toggle"
        className={`${storyTheme.buttonPrimary} w-full`}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close drawer" : "Open drawer"}
      </button>

      <div className={`${storyTheme.statBox} mt-5`}>
        <p className={storyTheme.statLabel}>
          Scroll locked:{" "}
          <span className={storyTheme.statValue} data-testid="is-locked">
            {String(isLocked)}
          </span>
        </p>
      </div>

      {open && (
        <aside
          data-testid="drawer"
          className="fixed inset-y-0 right-0 z-50 w-72 bg-white p-6 shadow-2xl"
        >
          <h3 className="mb-2 text-lg font-semibold text-gray-800">Drawer</h3>
          <p className="text-sm text-gray-500">
            The page scroll stays locked as long as this drawer is open.
          </p>
        </aside>
      )}
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof ModalScrollLockDemo> = {
  title: "Hooks/useScrollLock",
  component: ModalScrollLockDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Lock and unlock the page (\`document.body\`) scroll — the reliable way to keep the background from scrolling behind a modal, drawer, or menu.

Locking sets \`overflow: hidden\` on the body and adds \`padding-right\` equal to the scrollbar width so the content never jumps sideways. On iOS/Safari — where \`overflow: hidden\` doesn't stop touch scrolling — it instead pins the body with \`position: fixed\` and restores the scroll position with \`window.scrollTo\` on unlock.

## Features
- **Nested / reference-counted** - a shared counter means N stacked locks apply the body styles once and only restore on the last release
- **iOS-aware** - \`position: fixed\` body fix + scroll-position restore on Apple touch devices
- **No layout shift** - compensates for the vanished scrollbar with matching \`padding-right\`
- **Idempotent & StrictMode-safe** - per-instance locking never double-counts and unmount always releases
- **SSR-safe** - \`isLocked\` is \`false\` and \`lock\`/\`unlock\` are no-ops on the server

## Basic Usage
\`\`\`tsx
const { lock, unlock, isLocked } = useScrollLock();

useEffect(() => {
  if (open) lock();
  else unlock();
}, [open, lock, unlock]);
\`\`\`
`,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ModalScrollLockDemo>;

export const ModalLock: Story = {
  render: () => <ModalScrollLockDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Imperatively `lock()` on open and `unlock()` on close — the page behind the dialog can't scroll while it's open.",
      },
      source: {
        language: "tsx",
        code: `import { useEffect, useState } from "react";
import { useScrollLock } from "@usefy/use-scroll-lock";

function Modal() {
  const [open, setOpen] = useState(false);
  const { lock, unlock } = useScrollLock();

  useEffect(() => {
    if (open) lock();
    else unlock();
  }, [open, lock, unlock]);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open modal</button>
      {open && (
        <div role="dialog" aria-modal="true">
          <button onClick={() => setOpen(false)}>Close</button>
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

    expect(canvas.getByTestId("is-locked")).toHaveTextContent("false");
    expect(document.body.style.overflow).toBe("");

    await userEvent.click(canvas.getByTestId("open"));

    await waitFor(() => {
      expect(canvas.getByTestId("is-locked")).toHaveTextContent("true");
      expect(document.body.style.overflow).toBe("hidden");
    });

    await userEvent.click(canvas.getByTestId("close"));

    await waitFor(() => {
      expect(canvas.getByTestId("is-locked")).toHaveTextContent("false");
      expect(document.body.style.overflow).toBe("");
    });
  },
};

export const EnabledOption: Story = {
  render: () => <DrawerScrollLockDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Pass `enabled` to let the hook manage the lock declaratively — it locks while the drawer is open and releases on close or unmount.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { useScrollLock } from "@usefy/use-scroll-lock";

function Drawer() {
  const [open, setOpen] = useState(false);

  // The option owns the lock for the drawer's lifetime.
  useScrollLock({ enabled: open });

  return (
    <>
      <button onClick={() => setOpen((v) => !v)}>
        {open ? "Close" : "Open"} drawer
      </button>
      {open && <aside>Drawer content</aside>}
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByTestId("is-locked")).toHaveTextContent("false");
    expect(document.body.style.overflow).toBe("");

    await userEvent.click(canvas.getByTestId("toggle"));

    await waitFor(() => {
      expect(canvas.getByTestId("is-locked")).toHaveTextContent("true");
      expect(document.body.style.overflow).toBe("hidden");
    });

    await userEvent.click(canvas.getByTestId("toggle"));

    await waitFor(() => {
      expect(canvas.getByTestId("is-locked")).toHaveTextContent("false");
      expect(document.body.style.overflow).toBe("");
    });
  },
};
