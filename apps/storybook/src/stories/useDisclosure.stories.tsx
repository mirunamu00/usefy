import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useDisclosure } from "@usefy/use-disclosure";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  // A log of transitions, driven by the onOpen/onClose callbacks.
  const [log, setLog] = useState<string[]>([]);
  const [opened, { open, close, toggle }] = useDisclosure(false, {
    onOpen: () => setLog((l) => [...l, "opened"]),
    onClose: () => setLog((l) => [...l, "closed"]),
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useDisclosure</h2>
      <p className={storyTheme.subtitle}>
        open / close / toggle state for modals, drawers &amp; popovers
      </p>

      <div className={`${storyTheme.buttonGroup} mb-5`}>
        <button className={storyTheme.buttonPrimary} data-testid="open" onClick={open}>
          Open
        </button>
        <button className={storyTheme.buttonSecondary} data-testid="toggle" onClick={toggle}>
          Toggle
        </button>
      </div>

      {opened && (
        <div className={`${storyTheme.cardInfo} mb-5`} role="dialog" data-testid="dialog">
          <p className="font-semibold mb-3">Dialog is open</p>
          <button className={storyTheme.buttonNeutral} data-testid="close" onClick={close}>
            Close
          </button>
        </div>
      )}

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          opened:{" "}
          <span className={storyTheme.statValue} data-testid="opened">
            {String(opened)}
          </span>
        </p>
        <p className={storyTheme.statLabel}>
          transitions:{" "}
          <span className={storyTheme.statText} data-testid="log">
            {log.length ? log.join(" → ") : "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useDisclosure",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Manage a boolean "open" state with \`open\` / \`close\` / \`toggle\` handlers — the ergonomic primitive for modals, drawers, popovers, dropdowns, and accordions. Returns a \`[opened, handlers]\` tuple (the Mantine shape).

## Features
- **\`open\` / \`close\` / \`toggle\`** — with stable identities (safe as props / effect deps)
- **Transition callbacks** — optional \`onOpen\` / \`onClose\`, fired only on a real change
- **No-op safe** — \`open()\` while open (and \`close()\` while closed) does nothing
- **StrictMode-safe** — callbacks never fire from inside a \`setState\` updater

## Basic Usage
\`\`\`tsx
const [opened, { open, close, toggle }] = useDisclosure(false);
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {
  render: () => <Demo />,
  parameters: {
    docs: {
      description: {
        story:
          "Open, toggle, and close a dialog. The transition log is driven by the `onOpen` / `onClose` callbacks, which fire only on real state changes.",
      },
      source: {
        language: "tsx",
        code: `import { useDisclosure } from "@usefy/use-disclosure";

function Example() {
  const [opened, { open, close, toggle }] = useDisclosure(false);

  return (
    <>
      <button onClick={open}>Open</button>
      <button onClick={toggle}>Toggle</button>
      {opened && (
        <div role="dialog">
          Modal content
          <button onClick={close}>Close</button>
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

    await expect(canvas.getByTestId("opened")).toHaveTextContent("false");

    // Open via the button, then close from inside the dialog.
    await userEvent.click(canvas.getByTestId("open"));
    await waitFor(() => expect(canvas.getByTestId("dialog")).toBeInTheDocument());
    await expect(canvas.getByTestId("opened")).toHaveTextContent("true");

    await userEvent.click(canvas.getByTestId("close"));
    await waitFor(() =>
      expect(canvas.queryByTestId("dialog")).not.toBeInTheDocument()
    );

    // The transition log recorded exactly one open and one close.
    await expect(canvas.getByTestId("log")).toHaveTextContent("opened → closed");
  },
};
