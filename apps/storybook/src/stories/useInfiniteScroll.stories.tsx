import React, { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useInfiniteScroll } from "@usefy/use-infinite-scroll";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Shared helpers ============

const PAGE_SIZE = 6;
const MAX_ITEMS = 24;

/** Fake paged API: resolves the next slice of items after a short delay. */
function fetchPage(offset: number): Promise<number[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const next = Array.from(
        { length: PAGE_SIZE },
        (_, i) => offset + i + 1
      ).filter((n) => n <= MAX_ITEMS);
      resolve(next);
    }, 300);
  });
}

function Row({ n }: { n: number }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        marginBottom: "8px",
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span
        style={{
          width: "30px",
          height: "30px",
          flexShrink: 0,
          background: "#7c3aed",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: "0.8rem",
        }}
      >
        {n}
      </span>
      <span className="text-zinc-700">Item #{n}</span>
    </div>
  );
}

// ============ 1. Default — automatic infinite feed ============

function FeedDemo() {
  const [items, setItems] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setMounted] = useState(false);

  // Force one re-render after mount so the observer roots on the container.
  useEffect(() => setMounted(true), []);

  const loadMore = async () => {
    setLoading(true);
    const page = await fetchPage(items.length);
    setItems((prev) => [...prev, ...page]);
    setHasMore(items.length + page.length < MAX_ITEMS);
    setLoading(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, {
    hasMore,
    loading,
    root: containerRef.current,
    rootMargin: "80px",
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useInfiniteScroll</h2>
      <p className={storyTheme.subtitle}>
        Scroll to the bottom and the next page loads automatically — no scroll
        listeners, no manual math.
      </p>

      <div className={`${storyTheme.statBox} mb-4 flex justify-between`}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Loaded:</strong>{" "}
          <span className={storyTheme.statValue} data-testid="count">
            {items.length}
          </span>{" "}
          / {MAX_ITEMS}
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Status:</strong>{" "}
          <span
            className={loading ? "text-amber-600 font-bold" : "text-zinc-500"}
            data-testid="status"
          >
            {loading ? "loading…" : hasMore ? "idle" : "done"}
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        data-testid="scroll"
        style={{
          height: "300px",
          overflowY: "auto",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          padding: "16px",
          background: "#f8fafc",
        }}
      >
        {items.map((n) => (
          <Row key={n} n={n} />
        ))}

        {hasMore ? (
          <div
            ref={sentinelRef}
            data-testid="sentinel"
            style={{ padding: "16px", textAlign: "center", color: "#9ca3af" }}
          >
            {loading ? "Loading more…" : "Scroll to load more"}
          </div>
        ) : (
          <div
            data-testid="end"
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#16a34a",
              fontWeight: 600,
            }}
          >
            You're all caught up
          </div>
        )}
      </div>
    </div>
  );
}

// ============ 2. Enabled gate — pause auto-loading ============

function PausableDemo() {
  const [items, setItems] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const loadMore = async () => {
    setLoading(true);
    const page = await fetchPage(items.length);
    setItems((prev) => [...prev, ...page]);
    setLoading(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, {
    loading,
    enabled,
    hasMore: items.length < MAX_ITEMS,
    root: containerRef.current,
    rootMargin: "80px",
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Pause with `enabled`</h2>
      <p className={storyTheme.subtitle}>
        Flip <code>enabled</code> to <code>false</code> and the sentinel is no
        longer observed — scrolling to the bottom loads nothing.
      </p>

      <div className={`${storyTheme.buttonGroupFull}`}>
        <button
          data-testid="toggle"
          onClick={() => setEnabled((e) => !e)}
          className={enabled ? storyTheme.buttonSuccess : storyTheme.buttonDanger}
        >
          {enabled ? "Auto-loading (click to pause)" : "Paused (click to resume)"}
        </button>
      </div>

      <div className={`${storyTheme.statBox} mb-4 flex justify-between`}>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>Loaded:</strong>{" "}
          <span className={storyTheme.statValue} data-testid="count">
            {items.length}
          </span>
        </div>
        <div className={storyTheme.statLabel}>
          <strong className={storyTheme.statText}>enabled:</strong>{" "}
          <span className={storyTheme.statValue} data-testid="enabled">
            {String(enabled)}
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        data-testid="scroll"
        style={{
          height: "260px",
          overflowY: "auto",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          padding: "16px",
          background: "#f8fafc",
          opacity: enabled ? 1 : 0.6,
        }}
      >
        {items.map((n) => (
          <Row key={n} n={n} />
        ))}
        <div
          ref={sentinelRef}
          data-testid="sentinel"
          style={{ padding: "16px", textAlign: "center", color: "#9ca3af" }}
        >
          {loading ? "Loading more…" : enabled ? "Scroll to load" : "Paused"}
        </div>
      </div>
    </div>
  );
}

/** Scroll a container to the bottom to bring the sentinel into view. */
function scrollToBottom(el: HTMLElement) {
  el.scrollTop = el.scrollHeight;
  el.dispatchEvent(new Event("scroll", { bubbles: true }));
}

// ============ Meta & Stories ============

const meta: Meta<typeof FeedDemo> = {
  title: "Hooks/useInfiniteScroll",
  component: FeedDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `Sentinel-driven infinite loading built on \`IntersectionObserver\`. Attach the returned callback ref to a small element at the end of your list; when it scrolls into view, \`loadMore\` fires — once per intersection.

## Features
- **One-liner** - \`const ref = useInfiniteScroll(loadMore, { hasMore, loading })\`; attach \`ref\` to a sentinel
- **Fires once per intersection** - no re-fire while the sentinel stays in view
- **Respects \`hasMore\` / \`loading\` / \`enabled\`** - stops observing when exhausted or paused
- **No double-fire** - honours the \`loading\` flag *and* an internal in-flight guard for async \`loadMore\`
- **Latest-callback** - changing \`loadMore\` never re-subscribes the observer
- **SSR-safe & StrictMode-safe** - inherits the guards of \`useIntersectionObserver\`

## Basic Usage
\`\`\`tsx
const sentinelRef = useInfiniteScroll(loadMore, { hasMore, loading });
return <div ref={sentinelRef} />;
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FeedDemo>;

export const Default: Story = {
  render: () => <FeedDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "An auto-loading feed: scrolling the sentinel into view fetches the next page, stopping once `hasMore` becomes false.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { useInfiniteScroll } from "@usefy/use-infinite-scroll";

function Feed() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    setLoading(true);
    const { data, done } = await fetchNextPage(items.length);
    setItems((prev) => [...prev, ...data]);
    setHasMore(!done);
    setLoading(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, { hasMore, loading });

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
      {hasMore && <li ref={sentinelRef} aria-hidden />}
    </ul>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scroll = canvas.getByTestId<HTMLDivElement>("scroll");

    await expect(canvas.getByTestId("count")).toHaveTextContent("6");

    // Scrolling the sentinel into view loads the next page.
    scrollToBottom(scroll);
    await waitFor(
      () => expect(canvas.getByTestId("count")).toHaveTextContent("12"),
      { timeout: 4000 }
    );
  },
};

export const PausableWithEnabled: Story = {
  render: () => <PausableDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "The `enabled` flag gates auto-loading: while `false`, the sentinel is unobserved and scrolling loads nothing.",
      },
      source: {
        language: "tsx",
        code: `import { useState } from "react";
import { useInfiniteScroll } from "@usefy/use-infinite-scroll";

function PausableFeed() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const loadMore = async () => {
    setLoading(true);
    setItems((prev) => [...prev, ...(await fetchNextPage(prev.length))]);
    setLoading(false);
  };

  // While enabled is false, the sentinel is not observed and loadMore never fires.
  const sentinelRef = useInfiniteScroll(loadMore, { loading, enabled });

  return (
    <>
      <button onClick={() => setEnabled((e) => !e)}>
        {enabled ? "Pause" : "Resume"}
      </button>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
        <li ref={sentinelRef} aria-hidden />
      </ul>
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scroll = canvas.getByTestId<HTMLDivElement>("scroll");

    // Pause, then scrolling to the bottom must NOT load more.
    await userEvent.click(canvas.getByTestId("toggle"));
    await expect(canvas.getByTestId("enabled")).toHaveTextContent("false");

    scrollToBottom(scroll);
    await new Promise((r) => setTimeout(r, 600));
    await expect(canvas.getByTestId("count")).toHaveTextContent("6");

    // Resume, then a scroll loads the next page.
    await userEvent.click(canvas.getByTestId("toggle"));
    await expect(canvas.getByTestId("enabled")).toHaveTextContent("true");

    scrollToBottom(scroll);
    await waitFor(
      () => expect(canvas.getByTestId("count")).toHaveTextContent("12"),
      { timeout: 4000 }
    );
  },
};
