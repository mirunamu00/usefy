import { StrictMode, useRef } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JsonViewer } from "./JsonViewer";
import type { JsonViewerController } from "./JsonViewer";

const SAMPLE = {
  name: "usefy",
  tags: ["json", "viewer"],
  nested: { deep: { value: 42 } },
};

function rowTexts(): string[] {
  return Array.from(document.querySelectorAll("[data-row-index]")).map(
    (node) => node.textContent ?? "",
  );
}

describe("<JsonViewer />", () => {
  it("renders the root expanded one level by default", () => {
    render(<JsonViewer data={SAMPLE} />);
    expect(screen.getByTestId("json-row-count")).toHaveTextContent("5 rows");
    expect(rowTexts().some((text) => text.includes("name"))).toBe(true);
  });

  it("expands a container when its twisty is clicked", () => {
    render(<JsonViewer data={SAMPLE} />);
    const tagsRow = screen.getByTestId("json-row-2");
    fireEvent.click(tagsRow.querySelector("button")!);
    // Two array items plus the closing bracket row.
    expect(screen.getByTestId("json-row-count")).toHaveTextContent("8 rows");
  });

  it("expands and collapses everything from the toolbar", () => {
    render(<JsonViewer data={SAMPLE} />);
    fireEvent.click(screen.getByTestId("json-expand-all"));
    const expanded = screen.getByTestId("json-row-count").textContent;
    fireEvent.click(screen.getByTestId("json-collapse-all"));
    expect(screen.getByTestId("json-row-count")).toHaveTextContent("1 row");
    expect(expanded).not.toBe("1 row");
  });

  it("keeps the DOM bounded on a large document", () => {
    const big = { items: Array.from({ length: 50_000 }, (_, i) => `row-${i}`) };
    render(<JsonViewer data={big} defaultExpandDepth={2} />);

    expect(screen.getByTestId("json-row-count")).toHaveTextContent("50,004 rows");
    // The engine's promise, asserted: the DOM never sees the document.
    expect(document.querySelectorAll("[data-row-index]").length).toBeLessThan(60);
  });

  describe("accessibility", () => {
    it("exposes a tree with level, position and set size on every row", () => {
      render(<JsonViewer data={SAMPLE} />);
      const tree = screen.getByRole("tree");
      expect(tree).toHaveAttribute("tabindex", "0");

      const items = Array.from(tree.querySelectorAll('[role="treeitem"]'));
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        // Windowed siblings are absent from the DOM, so without these two a
        // screen reader reports the window size as the tree size.
        expect(item).toHaveAttribute("aria-level");
        expect(item).toHaveAttribute("aria-posinset");
        expect(item).toHaveAttribute("aria-setsize");
      }
    });

    it("reports the real sibling count, not the rendered one", () => {
      const big = { items: Array.from({ length: 5000 }, (_, i) => i) };
      render(<JsonViewer data={big} defaultExpandDepth={2} />);
      const child = screen.getByTestId("json-row-2").closest('[role="treeitem"]')!;
      expect(child).toHaveAttribute("aria-setsize", "5000");
    });

    it("does not announce a closing bracket as a second tree item", () => {
      render(<JsonViewer data={{ a: 1 }} />);
      expect(screen.getAllByRole("treeitem")).toHaveLength(2); // root + `a`
    });

    it("marks a container's expanded state", () => {
      render(<JsonViewer data={SAMPLE} />);
      const tags = screen.getByTestId("json-row-2");
      expect(tags).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(tags.querySelector("button")!);
      expect(screen.getByTestId("json-row-2")).toHaveAttribute("aria-expanded", "true");
    });

    it("has a polite live region for announcements", () => {
      render(<JsonViewer data={SAMPLE} />);
      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("keyboard", () => {
    it("moves down and up, skipping closing rows", () => {
      render(<JsonViewer data={SAMPLE} />);
      const tree = screen.getByRole("tree");

      fireEvent.keyDown(tree, { key: "ArrowDown" });
      expect(tree).toHaveAttribute("aria-activedescendant", expect.stringContaining("row-1"));
      fireEvent.keyDown(tree, { key: "ArrowUp" });
      expect(tree).toHaveAttribute("aria-activedescendant", expect.stringContaining("row-0"));
    });

    it("expands with ArrowRight and collapses with ArrowLeft", () => {
      render(<JsonViewer data={SAMPLE} />);
      const tree = screen.getByRole("tree");

      fireEvent.keyDown(tree, { key: "ArrowDown" }); // name
      fireEvent.keyDown(tree, { key: "ArrowDown" }); // tags
      fireEvent.keyDown(tree, { key: "ArrowRight" });
      expect(screen.getByTestId("json-row-count")).toHaveTextContent("8 rows");

      fireEvent.keyDown(tree, { key: "ArrowLeft" });
      expect(screen.getByTestId("json-row-count")).toHaveTextContent("5 rows");
    });

    it("toggles with Enter", () => {
      render(<JsonViewer data={SAMPLE} />);
      const tree = screen.getByRole("tree");
      fireEvent.keyDown(tree, { key: "ArrowDown" });
      fireEvent.keyDown(tree, { key: "ArrowDown" });
      fireEvent.keyDown(tree, { key: "Enter" });
      expect(screen.getByTestId("json-row-count")).toHaveTextContent("8 rows");
    });

    it("jumps to the ends with Home and End", () => {
      render(<JsonViewer data={SAMPLE} />);
      const tree = screen.getByRole("tree");
      fireEvent.keyDown(tree, { key: "End" });
      // The last row is the root's closing bracket, which is skipped.
      expect(tree.getAttribute("aria-activedescendant")).toContain("row-3");
      fireEvent.keyDown(tree, { key: "Home" });
      expect(tree.getAttribute("aria-activedescendant")).toContain("row-0");
    });

    it("ignores modified keystrokes so browser shortcuts still work", () => {
      render(<JsonViewer data={SAMPLE} />);
      const tree = screen.getByRole("tree");
      fireEvent.keyDown(tree, { key: "ArrowDown", ctrlKey: true });
      expect(tree.getAttribute("aria-activedescendant")).toContain("row-0");
    });

    it("moves to the parent with ArrowLeft on a collapsed node", () => {
      render(<JsonViewer data={SAMPLE} expanded={["", "/nested"]} />);
      const tree = screen.getByRole("tree");
      // Walk down to `nested.deep`, which is a collapsed container.
      for (let i = 0; i < 4; i++) fireEvent.keyDown(tree, { key: "ArrowDown" });
      const onDeep = tree.getAttribute("aria-activedescendant");

      fireEvent.keyDown(tree, { key: "ArrowLeft" });
      expect(tree.getAttribute("aria-activedescendant")).not.toBe(onDeep);
      expect(tree.getAttribute("aria-activedescendant")).toContain("row-3");
    });

    it("moves to the first child with ArrowRight on an open node", () => {
      render(<JsonViewer data={SAMPLE} expanded={["", "/nested"]} />);
      const tree = screen.getByRole("tree");
      for (let i = 0; i < 3; i++) fireEvent.keyDown(tree, { key: "ArrowDown" });
      // Row 3 is `nested`, already open.
      fireEvent.keyDown(tree, { key: "ArrowRight" });
      expect(tree.getAttribute("aria-activedescendant")).toContain("row-4");
    });

    it("pages up and down", () => {
      const big = { items: Array.from({ length: 200 }, (_, i) => i) };
      render(<JsonViewer data={big} expanded={["", "/items"]} height={440} />);
      const tree = screen.getByRole("tree");

      fireEvent.keyDown(tree, { key: "PageDown" });
      const afterDown = tree.getAttribute("aria-activedescendant");
      expect(afterDown).not.toContain("row-0");

      fireEvent.keyDown(tree, { key: "PageUp" });
      expect(tree.getAttribute("aria-activedescendant")).not.toBe(afterDown);
    });

    it("expands every sibling with * and announces how many", async () => {
      const data = { a: { x: 1 }, b: { y: 2 }, c: { z: 3 } };
      render(<JsonViewer data={data} />);
      const tree = screen.getByRole("tree");
      fireEvent.keyDown(tree, { key: "ArrowDown" });
      fireEvent.keyDown(tree, { key: "*" });

      // Three one-key objects opened: 3 × (1 child + 1 closing row).
      expect(screen.getByTestId("json-row-count")).toHaveTextContent("11 rows");
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Expanded 3 sibling nodes"),
      );
    });

    it("copies the value with c", async () => {
      const onCopy = vi.fn();
      render(<JsonViewer data={SAMPLE} onCopy={onCopy} />);
      const tree = screen.getByRole("tree");
      fireEvent.keyDown(tree, { key: "ArrowDown" });
      fireEvent.keyDown(tree, { key: "c" });
      await waitFor(() => expect(onCopy).toHaveBeenCalled());
      expect(onCopy.mock.calls[0]![0]).toMatchObject({ kind: "value" });
    });

    it("announces a refusal rather than doing nothing quietly", async () => {
      const big = { items: Array.from({ length: 5000 }, (_, i) => ({ id: i })) };
      render(<JsonViewer data={big} maxExpandedRows={1000} />);
      fireEvent.click(screen.getByTestId("json-expand-all"));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Too large to expand fully"),
      );
    });
  });

  describe("copying", () => {
    it("copies a path in the requested format", async () => {
      const onCopy = vi.fn();
      render(<JsonViewer data={SAMPLE} pathFormat="pointer" onCopy={onCopy} />);

      const row = screen.getByTestId("json-row-3");
      fireEvent.click(screen.getAllByLabelText(/Copy the path to/)[3]!);

      await waitFor(() => expect(onCopy).toHaveBeenCalled());
      expect(onCopy.mock.calls[0]![0]).toMatchObject({
        kind: "path",
        text: "/nested",
      });
      expect(row).toBeTruthy();
    });

    it("copies a value as re-serialized JSON", async () => {
      const onCopy = vi.fn();
      render(<JsonViewer data={SAMPLE} onCopy={onCopy} />);
      fireEvent.click(screen.getAllByLabelText(/Copy the value of/)[2]!);

      await waitFor(() => expect(onCopy).toHaveBeenCalled());
      expect(JSON.parse(onCopy.mock.calls[0]![0].text)).toEqual(["json", "viewer"]);
    });

    it("copies from the keyboard without a mouse", async () => {
      const onCopy = vi.fn();
      render(<JsonViewer data={SAMPLE} onCopy={onCopy} />);
      const tree = screen.getByRole("tree");
      fireEvent.keyDown(tree, { key: "ArrowDown" });
      fireEvent.keyDown(tree, { key: "p" });
      await waitFor(() => expect(onCopy).toHaveBeenCalled());
      expect(onCopy.mock.calls[0]![0]).toMatchObject({ kind: "path", text: "name" });
    });
  });

  describe("the full-value overlay", () => {
    const long = { text: "x".repeat(500) };

    it("opens as an overlay and leaves the row height alone", () => {
      render(<JsonViewer data={long} maxValueLength={20} />);
      const before = screen.getByTestId("json-row-1").getBoundingClientRect().height;

      fireEvent.click(screen.getByLabelText(/Show the full value/));
      const overlay = screen.getByTestId("json-value-overlay");
      expect(overlay.textContent).toContain("x".repeat(500));
      expect(screen.getByTestId("json-row-1").getBoundingClientRect().height).toBe(before);
    });

    it("closes on Escape", () => {
      render(<JsonViewer data={long} maxValueLength={20} />);
      fireEvent.click(screen.getByLabelText(/Show the full value/));
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByTestId("json-value-overlay")).toBeNull();
    });

    it("closes on an outside click and restores the originating row", () => {
      render(<JsonViewer data={long} maxValueLength={20} />);
      fireEvent.click(screen.getByLabelText(/Show the full value/));
      fireEvent.mouseDown(document.body);
      expect(screen.queryByTestId("json-value-overlay")).toBeNull();
      expect(screen.getByRole("tree").getAttribute("aria-activedescendant")).toContain(
        "row-1",
      );
    });

    it("copies the whole value from the overlay", async () => {
      render(<JsonViewer data={long} maxValueLength={20} />);
      fireEvent.click(screen.getByLabelText(/Show the full value/));
      fireEvent.click(screen.getByText("Copy"));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(/Copied|Could not copy/),
      );
    });

    it("reports the length of the value it is showing", () => {
      render(<JsonViewer data={long} maxValueLength={20} />);
      fireEvent.click(screen.getByLabelText(/Show the full value/));
      expect(screen.getByTestId("json-value-overlay")).toHaveTextContent("500 characters");
    });
  });

  describe("search", () => {
    it("finds matches inside collapsed subtrees and reports the count", async () => {
      render(<JsonViewer data={SAMPLE} />);
      fireEvent.change(screen.getByTestId("json-search-input"), {
        target: { value: "42" },
      });
      await waitFor(() =>
        expect(screen.getByTestId("json-search-count")).toHaveTextContent("1 of 1"),
      );
    });

    it("says so when there is nothing to find", async () => {
      render(<JsonViewer data={SAMPLE} />);
      fireEvent.change(screen.getByTestId("json-search-input"), {
        target: { value: "zzzz" },
      });
      await waitFor(() =>
        expect(screen.getByTestId("json-search-count")).toHaveTextContent("No matches"),
      );
    });

    it("does not claim 'No matches' while the scan is still pending", async () => {
      render(<JsonViewer data={SAMPLE} />);
      fireEvent.change(screen.getByTestId("json-search-input"), {
        target: { value: "42" },
      });
      // Between the keystroke and the debounced scan there are no results yet;
      // saying "No matches" there is simply false.
      expect(screen.queryByTestId("json-search-count")).toBeNull();
      expect(screen.getByTestId("json-search-scanning")).toBeTruthy();
      await waitFor(() =>
        expect(screen.getByTestId("json-search-count")).toHaveTextContent("1 of 1"),
      );
    });

    it("expands the ancestors of the match it jumps to", async () => {
      render(<JsonViewer data={SAMPLE} />);
      fireEvent.change(screen.getByTestId("json-search-input"), {
        target: { value: "42" },
      });
      // Wait for the scan to *finish*, not merely for the counter to exist —
      // "No matches" is rendered while a query is still pending.
      await waitFor(() =>
        expect(screen.getByTestId("json-search-count")).toHaveTextContent("1 of 1"),
      );

      fireEvent.click(screen.getByLabelText("Next match"));
      await waitFor(() =>
        expect(rowTexts().some((text) => text.includes("42"))).toBe(true),
      );
    });

    it("shows live progress while a big scan is running", async () => {
      const big = { items: Array.from({ length: 60_000 }, (_, i) => `v${i}`) };
      render(<JsonViewer data={big} searchOptions={{ budgetMs: 0 }} />);
      fireEvent.change(screen.getByTestId("json-search-input"), {
        target: { value: "v4242" },
      });
      await waitFor(() =>
        expect(screen.getByTestId("json-search-scanning")).toHaveTextContent(
          /Scanning… [\d,]+/,
        ),
      );
      await waitFor(
        () => expect(screen.getByTestId("json-search-count")).toBeTruthy(),
        { timeout: 15_000 },
      );
    });

    it("reports an invalid regular expression instead of throwing", async () => {
      render(<JsonViewer data={SAMPLE} searchOptions={{ regex: true }} />);
      fireEvent.change(screen.getByTestId("json-search-input"), {
        target: { value: "([" },
      });
      await waitFor(() => expect(screen.getByTestId("json-search-error")).toBeTruthy());
    });
  });

  describe("input handling", () => {
    it("parses a small JSON string synchronously", () => {
      render(<JsonViewer json='{"a":1}' />);
      expect(rowTexts().some((text) => text.includes("a"))).toBe(true);
    });

    it("surfaces a parse error as an alert and through onError", async () => {
      const onError = vi.fn();
      render(<JsonViewer json="{not json" onError={onError} />);
      expect(screen.getByRole("alert").textContent).toContain("Could not parse");
      await waitFor(() => expect(onError).toHaveBeenCalled());
    });

    it("paints a parsing state before a large parse", async () => {
      const big = JSON.stringify({ items: Array.from({ length: 400 }, (_, i) => i) });
      render(<JsonViewer json={big} parseSyncLimit={10} />);
      expect(screen.getByText("Parsing…")).toBeTruthy();
      await waitFor(() => expect(screen.queryByText("Parsing…")).toBeNull());
      expect(screen.getByTestId("json-row-count")).toBeTruthy();
    });

    it("never mutates or clones the data it was given", () => {
      const data = { a: [1, 2, 3] };
      const snapshot = JSON.stringify(data);
      const { rerender } = render(<JsonViewer data={data} />);
      fireEvent.click(screen.getByTestId("json-expand-all"));
      rerender(<JsonViewer data={data} />);
      expect(JSON.stringify(data)).toBe(snapshot);
    });
  });

  describe("controlled expansion", () => {
    it("renders exactly the pointers it is given", () => {
      render(<JsonViewer data={SAMPLE} expanded={["", "/nested"]} />);
      expect(rowTexts().some((text) => text.includes("deep"))).toBe(true);
    });

    it("reports every change", () => {
      const onExpandedChange = vi.fn();
      render(<JsonViewer data={SAMPLE} onExpandedChange={onExpandedChange} />);
      fireEvent.click(screen.getByTestId("json-row-2").querySelector("button")!);
      expect(onExpandedChange).toHaveBeenCalled();
      const calls = onExpandedChange.mock.calls;
      expect(calls[calls.length - 1]![0]).toContain("/tags");
    });

    it("obeys a parent that refuses the change", () => {
      // The controlled-component contract. If the owner does not echo the
      // change back, the component must snap to the prop — not quietly keep a
      // change its owner rejected and behave as uncontrolled from then on.
      const onExpandedChange = vi.fn();
      render(
        <JsonViewer
          data={SAMPLE}
          expanded={["", "/user"]}
          onExpandedChange={onExpandedChange}
        />,
      );
      const before = screen.getByTestId("json-row-count").textContent;

      fireEvent.click(screen.getByTestId("json-row-2").querySelector("button")!);

      expect(onExpandedChange).toHaveBeenCalled();
      expect(screen.getByTestId("json-row-count")).toHaveTextContent(before!);
      expect(rowTexts().some((text) => text.includes('"json"'))).toBe(false);
    });
  });

  describe("the imperative controller", () => {
    function Harness() {
      const ref = useRef<JsonViewerController>(null);
      return (
        <>
          <button type="button" onClick={() => ref.current?.expandAll()}>
            drive
          </button>
          <JsonViewer data={SAMPLE} controllerRef={ref} showToolbar />
        </>
      );
    }

    it("drives the viewer from outside", () => {
      render(<Harness />);
      fireEvent.click(screen.getByText("drive"));
      expect(screen.getByTestId("json-row-count")).not.toHaveTextContent("5 rows");
    });
  });

  describe("robustness", () => {
    it("survives StrictMode's double mount", () => {
      render(
        <StrictMode>
          <JsonViewer data={SAMPLE} />
        </StrictMode>,
      );
      expect(screen.getByTestId("json-row-count")).toHaveTextContent("5 rows");
    });

    it("renders a cycle rather than hanging", () => {
      const node: Record<string, unknown> = { name: "root" };
      node.self = node;
      render(<JsonViewer data={node} />);
      expect(rowTexts().some((text) => text.includes("[Circular]"))).toBe(true);
    });

    it("renders a throwing getter as its own row", () => {
      const hostile = {
        get boom(): never {
          throw new Error("nope");
        },
      };
      render(<JsonViewer data={hostile} />);
      expect(rowTexts().some((text) => text.includes("[Threw: nope]"))).toBe(true);
    });

    it("applies an explicit theme in both directions", () => {
      const { container, rerender } = render(<JsonViewer data={SAMPLE} theme="dark" />);
      expect(container.firstElementChild).toHaveAttribute("data-usefy-theme", "dark");
      rerender(<JsonViewer data={SAMPLE} theme="light" />);
      expect(container.firstElementChild).toHaveAttribute("data-usefy-theme", "light");
      rerender(<JsonViewer data={SAMPLE} theme="auto" />);
      expect(container.firstElementChild).not.toHaveAttribute("data-usefy-theme");
    });

    it("aborts its search when unmounted mid-scan", async () => {
      const big = { items: Array.from({ length: 40_000 }, (_, i) => `v${i}`) };
      const spy = vi.spyOn(AbortController.prototype, "abort");

      const { unmount } = render(<JsonViewer data={big} defaultQuery="v" />);
      // Let the debounce fire so a scan is genuinely in flight.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
      const beforeUnmount = spy.mock.calls.length;

      await act(async () => {
        unmount();
      });
      expect(spy.mock.calls.length).toBeGreaterThan(beforeUnmount);
    });

    it("renders on the server and hydrates without a mismatch", async () => {
      // `ESTIMATED_VIEWPORT` exists so the server render and the first client
      // render window identically; nothing verified that until now.
      const html = renderToString(<JsonViewer data={SAMPLE} />);
      // The server render is complete markup, not an empty shell: the tree and
      // its rows are all there before any JavaScript runs.
      expect(html).toContain('role="tree"');
      expect(html).toContain('role="treeitem"');
      expect(html).toContain("usefy");
      expect(html).toContain("nested");

      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);

      const errors: unknown[][] = [];
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation((...args: unknown[]) => {
          errors.push(args);
        });

      const root = await act(async () =>
        hydrateRoot(container, <JsonViewer data={SAMPLE} />),
      );

      const mismatches = errors.filter((args) =>
        String(args[0] ?? "").match(/hydrat|did not match|server HTML/i),
      );
      expect(mismatches, JSON.stringify(mismatches)).toHaveLength(0);

      await act(async () => root.unmount());
      consoleError.mockRestore();
      container.remove();
    });
  });

  describe("rendering options", () => {
    it("shows data types on request", () => {
      render(<JsonViewer data={{ a: 1 }} showDataTypes />);
      expect(rowTexts().some((text) => text.includes("number"))).toBe(true);
    });

    it("quotes keys on request", () => {
      render(<JsonViewer data={{ a: 1 }} quoteKeys />);
      expect(rowTexts().some((text) => text.includes('"a"'))).toBe(true);
    });

    it("colours every value kind it can render", () => {
      const shape = Symbol("shape");
      render(
        <JsonViewer
          data={{
            str: "s",
            num: 1,
            big: 1n,
            bool: true,
            nil: null,
            gone: undefined,
            fn: () => 1,
            sym: shape,
            map: new Map([["k", 1]]),
            set: new Set([1]),
            when: new Date(0),
          }}
        />,
      );
      // Every row must land on a colour class, not fall through to the bare
      // value style.
      const values = Array.from(document.querySelectorAll("[data-row-index] span"));
      const classed = values.filter((node) => node.className.includes("_value_"));
      expect(classed.length).toBeGreaterThan(10);
      for (const node of classed) {
        expect(node.className.split(" ").length).toBeGreaterThan(1);
      }
    });

    it("uses a custom value renderer", () => {
      render(
        <JsonViewer
          data={{ a: 1 }}
          renderValue={(row) => <span>{`<${String(row.kind)}>`}</span>}
        />,
      );
      expect(rowTexts().some((text) => text.includes("<number>"))).toBe(true);
    });
  });
});
