import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { usePagination } from "@usefy/use-pagination";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

const pageButton = (active: boolean) =>
  `min-w-[2.25rem] h-9 px-3 rounded-lg text-sm font-semibold border-2 transition-all duration-150 ${
    active
      ? "border-indigo-500 bg-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
      : "border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
  }`;

const navButton =
  "h-9 px-3 rounded-lg text-sm font-semibold border-2 border-gray-200 bg-white text-gray-700 transition-all duration-150 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700";

const ALL_USERS = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: `User #${i + 1}`,
}));

/**
 * A real table pager: slice a data array with `range`, render an ellipsis-aware
 * button row from `items`, and drive it with `next`/`prev`/`setPage`.
 */
function TablePagerDemo() {
  const {
    page,
    pageCount,
    range,
    items,
    setPage,
    next,
    prev,
    canNext,
    canPrev,
  } = usePagination({ total: ALL_USERS.length, pageSize: 6 });

  const visible = ALL_USERS.slice(range.start, range.end);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>usePagination</h2>
      <p className={storyTheme.subtitle}>
        Paginate a {ALL_USERS.length}-row list, 6 per page
      </p>

      <ul
        className="grid grid-cols-2 gap-2 mb-4 min-h-[184px]"
        data-testid="rows"
      >
        {visible.map((u) => (
          <li key={u.id} className={`${storyTheme.card} !p-3 text-sm`}>
            {u.name}
          </li>
        ))}
      </ul>

      <p className="text-sm text-gray-500 mb-4" data-testid="summary">
        Showing <strong>{range.start + 1}</strong>–<strong>{range.end}</strong>{" "}
        of <strong>{ALL_USERS.length}</strong> · Page{" "}
        <strong data-testid="page">{page}</strong> / {pageCount}
      </p>

      <nav className="flex flex-wrap items-center gap-1.5" data-testid="pager">
        <button
          className={navButton}
          onClick={prev}
          disabled={!canPrev}
          data-testid="prev-btn"
        >
          ‹ Prev
        </button>

        {items.map((item, i) =>
          item.type === "ellipsis" ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-gray-400 select-none"
              data-testid="ellipsis"
            >
              …
            </span>
          ) : (
            <button
              key={item.page}
              className={pageButton(item.selected)}
              aria-current={item.selected ? "page" : undefined}
              onClick={() => setPage(item.page!)}
              data-testid={`page-${item.page}`}
            >
              {item.page}
            </button>
          )
        )}

        <button
          className={navButton}
          onClick={next}
          disabled={!canNext}
          data-testid="next-btn"
        >
          Next ›
        </button>
      </nav>
    </div>
  );
}

/**
 * Shows how `siblingCount` / `boundaryCount` shape the ellipsis model on a large
 * page count — move around and watch the gaps collapse.
 */
function EllipsisDemo() {
  const { page, items, setPage, next, prev, canNext, canPrev } = usePagination({
    total: 500,
    pageSize: 10, // 50 pages
    defaultPage: 25,
    siblingCount: 1,
    boundaryCount: 1,
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Ellipsis model</h2>
      <p className={storyTheme.subtitle}>
        50 pages · always shows first/last + neighbors, collapses the rest
      </p>

      <nav
        className="flex flex-wrap items-center gap-1.5 mb-4"
        data-testid="pager"
      >
        <button
          className={navButton}
          onClick={prev}
          disabled={!canPrev}
          data-testid="prev-btn"
        >
          ‹
        </button>
        {items.map((item, i) =>
          item.type === "ellipsis" ? (
            <span key={`gap-${i}`} className="px-1 text-gray-400 select-none">
              …
            </span>
          ) : (
            <button
              key={item.page}
              className={pageButton(item.selected)}
              onClick={() => setPage(item.page!)}
              data-testid={`page-${item.page}`}
            >
              {item.page}
            </button>
          )
        )}
        <button
          className={navButton}
          onClick={next}
          disabled={!canNext}
          data-testid="next-btn"
        >
          ›
        </button>
      </nav>

      <div className={storyTheme.cardInfo}>
        <p className="text-sm text-gray-700">
          Current page: <strong data-testid="page">{page}</strong>
        </p>
      </div>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof TablePagerDemo> = {
  title: "Hooks/usePagination",
  component: TablePagerDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `A headless pagination state machine — current page, page count, a slice-ready range, and an ellipsis-aware page-number model. It owns state only; you render the pager however you like.

## Features
- **Controlled & uncontrolled** — pass \`page\`/\`onChange\`, or let it manage the page from \`defaultPage\` (built on \`useControllableState\`)
- **\`range\`** — a 0-based \`{ start, end }\` window (end exclusive, clamped to \`total\`) ready for \`array.slice(start, end)\`
- **\`items\`** — the ellipsis-aware page-number model (numbers + \`"ellipsis"\` tokens), MUI/Mantine-style, driven by \`siblingCount\`/\`boundaryCount\`
- **Clamped everywhere** — the page stays within \`[1, pageCount]\`; when the dataset shrinks the current page follows
- **Stable controls** — \`setPage\`/\`next\`/\`prev\`/\`first\`/\`last\` keep their identity and skip no-op moves (no wasted renders)

## Basic Usage
\`\`\`tsx
const { page, range, items, setPage, next, prev } = usePagination({
  total: users.length,
  pageSize: 10,
});
const visible = users.slice(range.start, range.end);
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TablePagerDemo>;

export const TablePager: Story = {
  render: () => <TablePagerDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A complete table pager: slice the data with `range` and render `items` as a button row.",
      },
      source: {
        language: "tsx",
        code: `import { usePagination } from "@usefy/use-pagination";

function UsersTable({ users }) {
  const { page, pageCount, range, items, setPage, next, prev, canNext, canPrev } =
    usePagination({ total: users.length, pageSize: 6 });

  const visible = users.slice(range.start, range.end);

  return (
    <>
      <ul>{visible.map((u) => <li key={u.id}>{u.name}</li>)}</ul>

      <nav>
        <button onClick={prev} disabled={!canPrev}>‹ Prev</button>
        {items.map((item, i) =>
          item.type === "ellipsis" ? (
            <span key={\`gap-\${i}\`}>…</span>
          ) : (
            <button
              key={item.page}
              aria-current={item.selected ? "page" : undefined}
              onClick={() => setPage(item.page)}
            >
              {item.page}
            </button>
          )
        )}
        <button onClick={next} disabled={!canNext}>Next ›</button>
      </nav>

      <p>Page {page} of {pageCount}</p>
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Starts on page 1 with Prev disabled and 6 rows visible.
    await expect(canvas.getByTestId("page")).toHaveTextContent("1");
    await expect(canvas.getByTestId("prev-btn")).toBeDisabled();
    await expect(canvas.getByTestId("summary")).toHaveTextContent(
      "Showing 1–6 of 47"
    );

    // Jump to the last page via its number button (47 items / 6 = 8 pages).
    await userEvent.click(canvas.getByTestId("page-8"));
    await waitFor(() => {
      expect(canvas.getByTestId("page")).toHaveTextContent("8");
      // Last page holds the remaining 5 rows: 43–47.
      expect(canvas.getByTestId("summary")).toHaveTextContent("Showing 43–47");
      expect(canvas.getByTestId("next-btn")).toBeDisabled();
    });

    // Step back one page with Prev.
    await userEvent.click(canvas.getByTestId("prev-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("page")).toHaveTextContent("7");
    });
  },
};

export const EllipsisModel: Story = {
  render: () => <EllipsisDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "How `siblingCount` / `boundaryCount` collapse a long page range into `\"ellipsis\"` gaps.",
      },
      source: {
        language: "tsx",
        code: `import { usePagination } from "@usefy/use-pagination";

function Pager() {
  const { items, setPage } = usePagination({
    total: 500,
    pageSize: 10,       // 50 pages
    defaultPage: 25,
    siblingCount: 1,    // pages either side of the current
    boundaryCount: 1,   // pages pinned at each end
  });

  // items -> [1, "ellipsis", 24, 25, 26, "ellipsis", 50]
  return (
    <nav>
      {items.map((item, i) =>
        item.type === "ellipsis" ? (
          <span key={\`gap-\${i}\`}>…</span>
        ) : (
          <button
            key={item.page}
            aria-current={item.selected ? "page" : undefined}
            onClick={() => setPage(item.page)}
          >
            {item.page}
          </button>
        )
      )}
    </nav>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Middle of a large range: first, last, and the neighbors are present.
    await expect(canvas.getByTestId("page")).toHaveTextContent("25");
    await expect(canvas.getByTestId("page-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("page-24")).toBeInTheDocument();
    await expect(canvas.getByTestId("page-26")).toBeInTheDocument();
    await expect(canvas.getByTestId("page-50")).toBeInTheDocument();

    // Jump to the first page and the leading ellipsis disappears.
    await userEvent.click(canvas.getByTestId("page-1"));
    await waitFor(() => {
      expect(canvas.getByTestId("page")).toHaveTextContent("1");
      expect(canvas.getByTestId("page-2")).toBeInTheDocument();
    });
  },
};
