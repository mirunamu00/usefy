import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useDocumentTitle } from "@usefy/use-document-title";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function Demo() {
  const [count, setCount] = useState(0);
  useDocumentTitle(count > 0 ? `(${count}) usefy` : "usefy");

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>useDocumentTitle</h2>
      <p className={storyTheme.subtitle}>Watch the browser tab title update</p>

      <div className={storyTheme.statBox}>
        <p className={storyTheme.statLabel}>
          document.title →{" "}
          <span className={storyTheme.statValue} data-testid="title">
            {count > 0 ? `(${count}) usefy` : "usefy"}
          </span>
        </p>
      </div>

      <button
        className={`${storyTheme.buttonPrimary} mt-6`}
        data-testid="inc"
        onClick={() => setCount((c) => c + 1)}
      >
        Add notification
      </button>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useDocumentTitle",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Sets \`document.title\` and keeps it in sync as the value changes, with an optional restore-on-unmount. SSR-safe.

## Features
- **Reactive** — updates the tab title whenever the value changes
- **Restore on unmount** — optionally put the previous title back
- **SSR-safe** — no-op when \`document\` is unavailable

## Basic Usage
\`\`\`tsx
useDocumentTitle(\`Inbox (\${unread})\`);
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
        story: "Incrementing the counter updates the browser tab's title live.",
      },
      source: {
        language: "tsx",
        code: `import { useDocumentTitle } from "@usefy/use-document-title";

function Inbox({ unread }: { unread: number }) {
  useDocumentTitle(unread > 0 ? \`(\${unread}) Inbox\` : "Inbox");
  return <div>…</div>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId("inc"));
    await waitFor(() => {
      expect(canvas.getByTestId("title")).toHaveTextContent("(1) usefy");
      expect(document.title).toBe("(1) usefy");
    });
  },
};
