import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DiffViewer } from "./DiffViewer";
import { computeDiff } from "./diff/computeDiff";

afterEach(() => {
  document.body.innerHTML = "";
});

/** A document of `n` numbered lines. */
const doc = (n: number, replace?: { at: number; with: string }) =>
  Array.from({ length: n }, (_, i) => (replace && i === replace.at ? replace.with : `line ${i}`))
    .join("\n") + "\n";

const BEFORE = "keep\nlet x = 1;\ncommon\n";
const AFTER = "keep\nconst x = 1;\ncommon\n";

/** The rendered table, whichever state the viewer is in. */
const table = () => document.querySelector("table");
const root = () => document.querySelector("[data-usefy-diff-state]") as HTMLElement;
/** Rendered body rows, as a real array of HTMLElements. */
const bodyRows = () =>
  Array.from(table()!.querySelectorAll("tbody tr")) as HTMLTableRowElement[];

describe("DiffViewer — table semantics and a11y (SPEC §8)", () => {
  it("renders a real table with row-header line numbers", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} />);

    const t = table();
    expect(t).not.toBeNull();
    const headers = t!.querySelectorAll("th[scope='row']");
    expect(headers.length).toBeGreaterThan(0);
    expect(t!.querySelectorAll("tr").length).toBeGreaterThan(0);
    expect(t!.querySelectorAll("td").length).toBeGreaterThan(0);
  });

  it("announces added and removed rows with visually-hidden text", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} />);
    expect(screen.getAllByText("Removed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Added").length).toBeGreaterThan(0);
  });

  it("shows +/- gutter glyphs so change type is never colour-only", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} />);
    const text = table()!.textContent ?? "";
    expect(text).toContain("+");
    expect(text).toContain("−");
  });

  it("hides the decorative marker column from assistive tech", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} />);
    const markers = table()!.querySelectorAll("td[aria-hidden='true']");
    expect(markers.length).toBeGreaterThan(0);
  });

  it("reports aria-rowcount as the number of ROWS, not the number of lines", () => {
    // A split row holds a line on each side, and a collapsed region is one
    // row standing in for many lines, so a line count is simply the wrong
    // number to hand assistive technology.
    render(<DiffViewer oldText={doc(60)} newText={doc(60, { at: 30, with: "changed" })} />);

    const rendered = table()!.querySelectorAll("tbody tr").length;
    expect(Number(table()!.getAttribute("aria-rowcount"))).toBe(rendered);
    // …and it really is smaller than the line count, because of collapsing.
    expect(rendered).toBeLessThan(60);
  });

  it("counts every rendered row in split view, where two lines share one row", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} view="split" />);
    // 3 rows: context / the paired change / context — from 4 model lines.
    expect(Number(table()!.getAttribute("aria-rowcount"))).toBe(3);
    expect(table()!.querySelectorAll("tbody tr")).toHaveLength(3);
  });

  it("counts every rendered row in unified view, where each line is a row", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} view="unified" />);
    expect(Number(table()!.getAttribute("aria-rowcount"))).toBe(4);
    expect(table()!.querySelectorAll("tbody tr")).toHaveLength(4);
  });

  it("numbers every row with a 1-based aria-rowindex", () => {
    render(<DiffViewer oldText={doc(60)} newText={doc(60, { at: 30, with: "changed" })} />);
    const indexes = Array.from(table()!.querySelectorAll("tbody tr"), (row) =>
      Number(row.getAttribute("aria-rowindex")),
    );
    expect(indexes).toEqual(indexes.map((_, i) => i + 1));
  });

  it("gives the table an accessible name and a spoken summary", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} />);
    const caption = table()!.querySelector("caption");
    expect(caption).not.toBeNull();
    expect(caption!.textContent).toContain("Diff");
    expect(caption!.textContent).toContain("1 added");
    expect(caption!.textContent).toContain("1 removed");
  });

  it("marks exactly ONE row header per row", () => {
    // Two `scope="row"` headers give assistive tech two competing answers
    // for "which row is this?" — the second number is a data cell.
    for (const view of ["split", "unified"] as const) {
      const { unmount } = render(<DiffViewer oldText={BEFORE} newText={AFTER} view={view} />);
      for (const row of bodyRows()) {
        expect(row.querySelectorAll("th[scope='row']"), view).toHaveLength(1);
      }
      unmount();
    }
  });

  it("uses overridable labels for the change announcements", () => {
    render(
      <DiffViewer
        oldText={BEFORE}
        newText={AFTER}
        labels={{ added: "Hinzugefügt", removed: "Entfernt" }}
      />,
    );
    expect(screen.getAllByText("Entfernt").length).toBeGreaterThan(0);
    expect(screen.queryByText("Removed")).toBeNull();
  });
});

describe("DiffViewer — views", () => {
  it("defaults to the split view", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} />);
    expect(root().dataset.usefyDiffView).toBe("split");
  });

  it("renders the unified view when asked", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} view="unified" />);
    expect(root().dataset.usefyDiffView).toBe("unified");
  });

  it("shows the same content in both views", () => {
    const { unmount } = render(<DiffViewer oldText={BEFORE} newText={AFTER} view="split" />);
    const splitText = table()!.textContent ?? "";
    unmount();

    render(<DiffViewer oldText={BEFORE} newText={AFTER} view="unified" />);
    const unifiedText = table()!.textContent ?? "";

    for (const fragment of ["keep", "let x = 1;", "const x = 1;", "common"]) {
      expect(splitText).toContain(fragment);
      expect(unifiedText).toContain(fragment);
    }
  });

  it("renders two line-number cells in the unified view (old and new)", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} view="unified" />);
    const firstRow = bodyRows()[0];
    const numbers = Array.from(firstRow.querySelectorAll("[class*='lineNumber']"));
    expect(numbers.map((n) => n.textContent)).toEqual(["1", "1"]);
    // Only the first is the row's header — the other is a data cell.
    expect(within(firstRow).getAllByRole("rowheader")).toHaveLength(1);
    expect(numbers[1].tagName).toBe("TD");
  });

  it("renders one line-number cell per side in the split view", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} view="split" />);
    const firstRow = bodyRows()[0];
    const numbers = Array.from(firstRow.querySelectorAll("[class*='lineNumber']"));
    expect(numbers).toHaveLength(2);
    expect(numbers.map((n) => n.textContent)).toEqual(["1", "1"]);
    expect(within(firstRow).getAllByRole("rowheader")).toHaveLength(1);
  });

  it("omits line numbers entirely with showLineNumbers={false}", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} showLineNumbers={false} />);
    expect(table()!.querySelectorAll("th").length).toBe(0);
  });

  it.each([
    ["split", true, 6],
    ["split", false, 4],
    ["unified", true, 4],
    ["unified", false, 2],
  ] as const)(
    "spans a gap across every column: %s view, line numbers %s",
    (view, showLineNumbers, expected) => {
      render(
        <DiffViewer
          oldText={doc(80)}
          newText={doc(80, { at: 40, with: "changed" })}
          view={view}
          showLineNumbers={showLineNumbers}
        />,
      );
      const gapCell = table()!.querySelector("td[colspan]")!;
      expect(Number(gapCell.getAttribute("colspan"))).toBe(expected);

      // …and the gap really does span the full row width.
      const bodyRow = Array.from(table()!.querySelectorAll("tr")).find(
        (row) => row.querySelector("td[colspan]") === null,
      )!;
      expect(bodyRow.children.length).toBe(expected);
    },
  );

  it("aligns unpaired lines with filler cells in the split view", () => {
    // Two additions against one removal — the extra row has an empty left.
    render(<DiffViewer oldText={"a\nold\nz\n"} newText={"a\nnew1\nnew2\nz\n"} view="split" />);
    expect(table()!.textContent).toContain("new2");
  });
});

describe("DiffViewer — the structure the stylesheet depends on", () => {
  // Two bugs that shipped past jsdom and were only caught in a browser.
  // These assert the DOM facts the CSS is written against, so a refactor
  // that breaks the styling breaks a test too.

  it("puts the change-type class on the SAME element as the role class", () => {
    // The stylesheet uses compound selectors (`.content.add`). If a refactor
    // ever wraps cells so the type class moves to an ancestor, every row
    // tint silently disappears — which is exactly what happened once.
    render(<DiffViewer oldText={BEFORE} newText={AFTER} />);

    const typed = Array.from(table()!.querySelectorAll("[class*='remove'], [class*='add']"));
    expect(typed.length).toBeGreaterThan(0);

    for (const cell of typed) {
      const cls = cell.className;
      const isCell = /content|marker|lineNumber/.test(cls);
      expect(isCell, `type class found on a non-cell element: ${cls}`).toBe(true);
    }

    // …and at least one content cell really does carry both.
    const both = table()!.querySelector("td[class*='content'][class*='remove']");
    expect(both).not.toBeNull();
  });

  it("declares explicit column widths via <colgroup>", () => {
    // `table-layout: fixed` otherwise takes its widths from the first row —
    // which is a collapsed-region row with one colSpan cell, so every column
    // ends up equal and the code gets shoved to the middle of the table.
    render(<DiffViewer oldText={doc(80)} newText={doc(80, { at: 40, with: "changed" })} />);

    const colgroup = table()!.querySelector("colgroup");
    expect(colgroup).not.toBeNull();
    expect(colgroup!.querySelectorAll("col")).toHaveLength(6);

    // The first body row IS a colspan row — the condition that broke it.
    const firstRow = table()!.querySelector("tbody tr")!;
    expect(firstRow.querySelector("td[colspan]")).not.toBeNull();
  });

  it("sizes the colgroup to match the column count in every view", () => {
    for (const [view, showLineNumbers, expected] of [
      ["split", true, 6],
      ["split", false, 4],
      ["unified", true, 4],
      ["unified", false, 2],
    ] as const) {
      const { unmount } = render(
        <DiffViewer
          oldText={BEFORE}
          newText={AFTER}
          view={view}
          showLineNumbers={showLineNumbers}
        />,
      );
      expect(
        table()!.querySelectorAll("colgroup col"),
        `${view}/${showLineNumbers}`,
      ).toHaveLength(expected);
      unmount();
    }
  });
});

describe("DiffViewer — stats header", () => {
  it("shows added, removed and unchanged counts", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} />);
    expect(screen.getByText("+1")).toBeTruthy();
    expect(screen.getByText("−1")).toBeTruthy();
    expect(screen.getByText("2 unchanged")).toBeTruthy();
  });

  it("lets a consumer replace the whole summary", () => {
    render(
      <DiffViewer
        oldText={BEFORE}
        newText={AFTER}
        labels={{ stats: (s) => <span>custom {s.added}/{s.removed}</span> }}
      />,
    );
    expect(screen.getByText("custom 1/1")).toBeTruthy();
  });
});

describe("DiffViewer — inline segment highlighting", () => {
  it("marks the changed words inside a paired line", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} />);
    const marks = table()!.querySelectorAll("mark");
    expect(marks.length).toBeGreaterThan(0);
    const texts = Array.from(marks, (m) => m.textContent);
    expect(texts).toContain("let");
    expect(texts).toContain("const");
  });

  it("renders no marks when the pair is below the similarity threshold", () => {
    render(
      <DiffViewer
        oldText={"const total = items.length;\n"}
        newText={"throw new Error('nope');\n"}
      />,
    );
    expect(table()!.querySelectorAll("mark").length).toBe(0);
  });

  it("renders no marks with inlineDiff={false}", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} inlineDiff={false} />);
    expect(table()!.querySelectorAll("mark").length).toBe(0);
  });

  it("still shows the full line text when segments are present", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} />);
    expect(table()!.textContent).toContain("let x = 1;");
    expect(table()!.textContent).toContain("const x = 1;");
  });
});

describe("DiffViewer — empty and guarded states", () => {
  it("renders an explicit 'No changes' state, not a blank box", () => {
    render(<DiffViewer oldText={BEFORE} newText={BEFORE} />);
    expect(root().dataset.usefyDiffState).toBe("unchanged");
    expect(screen.getByText("No changes")).toBeTruthy();
    expect(table()).toBeNull();
  });

  it("distinguishes 'too large' from 'too different'", () => {
    const { unmount } = render(
      <DiffViewer oldText={doc(50)} newText={doc(50, { at: 1, with: "x" })} maxLines={10} />,
    );
    expect(screen.getByText(/too large/i)).toBeTruthy();
    unmount();

    // Two unrelated documents inside every size limit — refused for cost.
    const a = Array.from({ length: 400 }, (_, i) => `alpha ${i}`).join("\n") + "\n";
    const b = Array.from({ length: 400 }, (_, i) => `beta ${i}`).join("\n") + "\n";
    render(<DiffViewer oldText={a} newText={b} maxEditDistance={50} />);
    expect(screen.getByText(/too little in common/i)).toBeTruthy();
  });

  it("offers 'Diff anyway' and honours it", () => {
    const a = Array.from({ length: 200 }, (_, i) => `alpha ${i}`).join("\n") + "\n";
    const b = Array.from({ length: 200 }, (_, i) => `beta ${i}`).join("\n") + "\n";
    render(<DiffViewer oldText={a} newText={b} maxEditDistance={10} />);

    expect(root().dataset.usefyDiffState).toBe("truncated");
    fireEvent.click(screen.getByRole("button", { name: "Diff anyway" }));

    expect(root().dataset.usefyDiffState).toBe("diff");
    expect(table()).not.toBeNull();
  });

  it("does not offer 'Diff anyway' for a pre-computed diff it cannot recompute", () => {
    const truncated = computeDiff(doc(50), doc(50, { at: 1, with: "x" }), { maxLines: 10 });
    render(<DiffViewer diff={truncated} />);
    expect(screen.queryByRole("button", { name: "Diff anyway" })).toBeNull();
  });

  it("uses overridable strings for the guarded states", () => {
    render(
      <DiffViewer
        oldText={doc(50)}
        newText={doc(50, { at: 1, with: "x" })}
        maxLines={10}
        labels={{ tooLarge: "Zu groß", diffAnyway: "Trotzdem" }}
      />,
    );
    expect(screen.getByText("Zu groß")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Trotzdem" })).toBeTruthy();
  });
});

describe("DiffViewer — expansion", () => {
  const LONG_BEFORE = doc(80);
  const LONG_AFTER = doc(80, { at: 40, with: "line 40 CHANGED" });

  it("collapses distant unchanged regions behind expanders", () => {
    render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} />);
    expect(screen.getAllByText(/unchanged lines/).length).toBeGreaterThan(0);
  });

  it("reveals lines when an expander is clicked", () => {
    render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} />);
    expect(table()!.textContent).not.toContain("line 0");

    fireEvent.click(screen.getAllByRole("button", { name: "Expand 20 lines above" })[0]);
    expect(table()!.textContent).toContain("line 0");
  });

  it("reveals from the bottom of a gap with the down control", () => {
    render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Expand 20 lines below" })[0]);
    // The lines just above the hunk become visible.
    expect(table()!.textContent).toContain("line 30");
  });

  it("gives the expanders descriptive accessible names, not glyphs", () => {
    // A screen reader reading the visible "↑ 20" announces "up arrow
    // twenty, button", and a label override that drops the glyph leaves two
    // identically-named "20, button" controls (SPEC §8).
    render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} />);

    expect(screen.getAllByRole("button", { name: "Expand 20 lines above" }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByRole("button", { name: "Expand 20 lines below" }).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByRole("button", { name: "Expand all hidden lines" }).length,
    ).toBeGreaterThan(0);

    // The compact glyph is still what you SEE.
    const up = screen.getAllByRole("button", { name: "Expand 20 lines above" })[0];
    expect(up.textContent).toBe("↑ 20");
    expect(up.getAttribute("aria-label")).toBe("Expand 20 lines above");
  });

  it("lets the accessible names be localised independently of the glyphs", () => {
    render(
      <DiffViewer
        oldText={LONG_BEFORE}
        newText={LONG_AFTER}
        labels={{
          ariaExpandUp: (n) => `${n} Zeilen oberhalb einblenden`,
          ariaExpandAll: "Alle einblenden",
        }}
      />,
    );
    expect(screen.getAllByRole("button", { name: "20 Zeilen oberhalb einblenden" })[0]).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Alle einblenden" })[0]).toBeTruthy();
  });

  it("reveals everything with 'Expand all'", () => {
    render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} />);
    for (const button of screen.getAllByRole("button", { name: "Expand all hidden lines" })) {
      fireEvent.click(button);
    }
    expect(screen.queryAllByText(/unchanged lines/)).toHaveLength(0);
    expect(table()!.textContent).toContain("line 0");
    expect(table()!.textContent).toContain("line 79");
  });

  it("keeps line numbers correct and continuous after expanding", () => {
    render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} view="unified" />);
    for (const button of screen.getAllByRole("button", { name: "Expand all hidden lines" })) {
      fireEvent.click(button);
    }

    // Old-side numbers are the first rowheader of each unified row.
    const numbers = Array.from(table()!.querySelectorAll("tr"), (row) => {
      const headers = row.querySelectorAll("th");
      return headers[0]?.textContent ?? "";
    }).filter((value) => value !== "");

    const asNumbers = numbers.map(Number);
    expect(asNumbers[0]).toBe(1);
    for (let i = 1; i < asNumbers.length; i++) {
      expect(asNumbers[i]).toBe(asNumbers[i - 1] + 1);
    }
    expect(asNumbers[asNumbers.length - 1]).toBe(80);
  });

  it("reveals everything up-front with defaultExpandAll", () => {
    render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} defaultExpandAll />);
    expect(screen.queryAllByText(/unchanged lines/)).toHaveLength(0);
    expect(table()!.textContent).toContain("line 0");
    expect(table()!.textContent).toContain("line 79");
  });

  it("fires onExpand with the hunk index and the line count", () => {
    const onExpand = vi.fn();
    render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} onExpand={onExpand} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Expand 20 lines above" })[0]);
    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onExpand).toHaveBeenCalledWith(0, 20);
  });

  it("fires onExpand exactly once per click under StrictMode", () => {
    const onExpand = vi.fn();
    render(
      <StrictMode>
        <DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} onExpand={onExpand} />
      </StrictMode>,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Expand all hidden lines" })[0]);
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("honours a custom expandStep", () => {
    const onExpand = vi.fn();
    render(
      <DiffViewer
        oldText={LONG_BEFORE}
        newText={LONG_AFTER}
        expandStep={5}
        onExpand={onExpand}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Expand 5 lines above" })[0]);
    expect(onExpand).toHaveBeenCalledWith(0, 5);
  });

  it("expands from a pre-computed diff with no source texts at all", () => {
    // SPEC decision #11: the model is self-sufficient.
    const model = computeDiff(LONG_BEFORE, LONG_AFTER);
    render(<DiffViewer diff={model} />);

    expect(table()!.textContent).not.toContain("line 0");
    fireEvent.click(screen.getAllByRole("button", { name: "Expand all hidden lines" })[0]);
    expect(table()!.textContent).toContain("line 0");
  });

  it("collapses the trailing region too, and can expand it", () => {
    render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} />);
    expect(table()!.textContent).not.toContain("line 79");

    const expanders = screen.getAllByRole("button", { name: "Expand all hidden lines" });
    expect(expanders.length).toBe(2); // leading gap AND trailing gap
    fireEvent.click(expanders[expanders.length - 1]);
    expect(table()!.textContent).toContain("line 79");
  });

  it("offers a single control when one step would reveal everything", () => {
    // Fewer hidden lines than expandStep — up/down would be identical, so
    // showing three buttons that all do the same thing would be a lie.
    render(
      <DiffViewer
        oldText={doc(14)}
        newText={doc(14, { at: 12, with: "changed" })}
        context={1}
        collapseThreshold={0}
      />,
    );
    expect(screen.queryByRole("button", { name: /lines above/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /lines above/ })).toBeNull();

    const all = screen.getAllByRole("button", { name: "Expand all hidden lines" });
    expect(all.length).toBeGreaterThan(0);
    fireEvent.click(all[0]);
    expect(table()!.textContent).toContain("line 0");
  });

  it("says 'line' not 'lines' for a single hidden line", () => {
    // context 1 + collapseThreshold 0 over a 3-line lead — exactly 1 hidden.
    render(
      <DiffViewer
        oldText={doc(20)}
        newText={doc(20, { at: 2, with: "changed" })}
        context={1}
        collapseThreshold={0}
      />,
    );
    expect(screen.getByText("⋯ 1 unchanged line")).toBeTruthy();
  });

  it("stops offering an expander once a region is fully revealed", () => {
    render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} />);
    // Reveal the leading gap from both ends until nothing is left.
    for (let i = 0; i < 10; i++) {
      const up = screen.queryAllByRole("button", { name: /lines above/ });
      const down = screen.queryAllByRole("button", { name: /lines above/ });
      if (up.length === 0 && down.length === 0) break;
      fireEvent.click((up[0] ?? down[0]) as HTMLElement);
    }
    // Whatever remains must be a genuine gap, never a zero-line one.
    for (const label of screen.queryAllByText(/unchanged line/)) {
      expect(label.textContent).not.toContain("⋯ 0 ");
    }
  });
});

describe("DiffViewer — state must not survive a prop swap", () => {
  // Nothing else in the suite changes props AFTER an interaction, which is
  // exactly why both of these shipped: every test rendered once and stopped.
  const LONG_BEFORE = doc(80);
  const LONG_AFTER = doc(80, { at: 40, with: "line 40 CHANGED" });
  const OTHER_BEFORE = doc(80, { at: 5, with: "totally different base" });
  const OTHER_AFTER = doc(80, { at: 5, with: "totally different base!" });

  it("collapses again when the documents change after expanding", () => {
    const { rerender } = render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Expand all hidden lines" })[0]);
    expect(table()!.textContent).toContain("line 0");

    rerender(<DiffViewer oldText={OTHER_BEFORE} newText={OTHER_AFTER} />);

    // The new diff must start collapsed, not inherit the old reveal counts.
    expect(screen.getAllByText(/unchanged lines/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Expand all hidden lines" }).length).toBeGreaterThan(
      0,
    );
  });

  it("never loses the gap marker when the new hidden run is shorter", () => {
    // A stale `top` larger than the new run drove the remaining count
    // negative, and the Gap silently disappeared with no way to expand.
    const { rerender } = render(<DiffViewer oldText={doc(200)} newText={doc(200, { at: 100, with: "x" })} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Expand all hidden lines" })[0]);

    rerender(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} />);

    const markers = screen.getAllByText(/unchanged lines/);
    expect(markers.length).toBeGreaterThan(0);
    for (const marker of markers) {
      expect(marker.textContent).not.toContain("-");
      expect(marker.textContent).not.toContain("⋯ 0 ");
    }
  });

  it("keeps expansion when an unrelated prop changes", () => {
    const { rerender } = render(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Expand all hidden lines" })[0]);
    expect(table()!.textContent).toContain("line 0");

    // `className` does not change the model, so the reveal must survive.
    rerender(<DiffViewer oldText={LONG_BEFORE} newText={LONG_AFTER} className="x" />);
    expect(table()!.textContent).toContain("line 0");
  });

  it("re-arms the guards when the documents change after 'Diff anyway'", () => {
    // The defect: `forced` was a bare boolean that never reset, so the NEXT
    // refused pair was diffed with every guard at Infinity — re-opening the
    // multi-second freeze the cost guard exists to prevent.
    const unrelated = (tag: string, n: number) =>
      Array.from({ length: n }, (_, i) => `${tag} ${i}`).join("\n") + "\n";

    const { rerender } = render(
      <DiffViewer
        oldText={unrelated("alpha", 200)}
        newText={unrelated("beta", 200)}
        maxEditDistance={10}
      />,
    );
    expect(root().dataset.usefyDiffState).toBe("truncated");
    fireEvent.click(screen.getByRole("button", { name: "Diff anyway" }));
    expect(root().dataset.usefyDiffState).toBe("diff");

    // A DIFFERENT refused pair must be refused again, not force-diffed.
    rerender(
      <DiffViewer
        oldText={unrelated("gamma", 200)}
        newText={unrelated("delta", 200)}
        maxEditDistance={10}
      />,
    );
    expect(root().dataset.usefyDiffState).toBe("truncated");
    expect(screen.getByRole("button", { name: "Diff anyway" })).toBeTruthy();
  });

  it("keeps the approval while the same inputs are shown", () => {
    const unrelated = (tag: string) =>
      Array.from({ length: 200 }, (_, i) => `${tag} ${i}`).join("\n") + "\n";
    const a = unrelated("alpha");
    const b = unrelated("beta");

    const { rerender } = render(
      <DiffViewer oldText={a} newText={b} maxEditDistance={10} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Diff anyway" }));
    expect(root().dataset.usefyDiffState).toBe("diff");

    // Same documents, unrelated prop change — the approval stands.
    rerender(<DiffViewer oldText={a} newText={b} maxEditDistance={10} className="y" />);
    expect(root().dataset.usefyDiffState).toBe("diff");
  });

  it("re-arms the guards when an option changes after 'Diff anyway'", () => {
    const a = Array.from({ length: 200 }, (_, i) => `alpha ${i}`).join("\n") + "\n";
    const b = Array.from({ length: 200 }, (_, i) => `beta ${i}`).join("\n") + "\n";

    const { rerender } = render(<DiffViewer oldText={a} newText={b} maxEditDistance={10} />);
    fireEvent.click(screen.getByRole("button", { name: "Diff anyway" }));
    expect(root().dataset.usefyDiffState).toBe("diff");

    rerender(<DiffViewer oldText={a} newText={b} maxEditDistance={12} />);
    expect(root().dataset.usefyDiffState).toBe("truncated");
  });
});

describe("DiffViewer — blank lines survive (B2)", () => {
  // An empty content cell generates no line box under `white-space: pre`,
  // so the row collapsed to zero height and a real unchanged line simply
  // vanished — while the header still counted it. jsdom computes no layout,
  // so the guard here is structural; the browser pass measures the heights.
  const WITH_BLANKS_BEFORE = "alpha\n\n\nbeta\n";
  const WITH_BLANKS_AFTER = "alpha\n\n\nBETA\n";

  it("renders a row for every line, blank or not", () => {
    for (const showLineNumbers of [true, false]) {
      const { unmount } = render(
        <DiffViewer
          oldText={WITH_BLANKS_BEFORE}
          newText={WITH_BLANKS_AFTER}
          view="unified"
          showLineNumbers={showLineNumbers}
        />,
      );
      // 2 blank context + 1 "alpha" context + remove + add = 5 rows.
      expect(table()!.querySelectorAll("tbody tr"), String(showLineNumbers)).toHaveLength(5);
      unmount();
    }
  });

  it("draws as many rows as the stats header claims", () => {
    render(
      <DiffViewer
        oldText={WITH_BLANKS_BEFORE}
        newText={WITH_BLANKS_AFTER}
        view="unified"
        showLineNumbers={false}
      />,
    );
    expect(screen.getByText("3 unchanged")).toBeTruthy();
    const contexts = Array.from(table()!.querySelectorAll("tbody tr")).filter(
      (row) => row.querySelector("[class*='add'], [class*='remove']") === null,
    );
    expect(contexts).toHaveLength(3);
  });

  it("gives every row the class that carries the fixed row height", () => {
    render(
      <DiffViewer
        oldText={WITH_BLANKS_BEFORE}
        newText={WITH_BLANKS_AFTER}
        showLineNumbers={false}
      />,
    );
    for (const row of bodyRows()) {
      expect(row.className).toMatch(/row/);
    }
  });
});

describe("DiffViewer — virtualization (SPEC §3.3, Phase 3)", () => {
  const scrollerEl = () =>
    document.querySelector("[data-usefy-diff-state] > div:nth-child(2)") as HTMLElement;

  /**
   * jsdom reports 0 for every layout box, so give the scroller real ones and
   * let the component re-measure.
   *
   * The measurement is rAF-batched (one render per frame, not per scroll
   * event), so the window only updates on the next frame — hence `waitFor`
   * rather than a synchronous assertion.
   */
  /**
   * The measurement is rAF-batched (one render per frame, not per scroll
   * event), and under the repo-wide parallel run a jsdom animation frame can
   * take far longer than testing-library's 1s default — so every wait here
   * gets a generous budget. Without it these pass alone and fail in CI,
   * which is the worst kind of test.
   */
  const SETTLE = { timeout: 15_000 } as const;

  async function scrollTo(viewport: number, scrollTop: number) {
    const scroller = scrollerEl();
    Object.defineProperty(scroller, "clientHeight", { value: viewport, configurable: true });
    Object.defineProperty(scroller, "scrollTop", {
      value: scrollTop,
      writable: true,
      configurable: true,
    });
    fireEvent.scroll(scroller);
    // The window follows the scroll on the next rAF flush. Waiting merely for
    // the virtualized attribute is not enough — windowing is now active from
    // the first render (from an estimated viewport), so the attribute is
    // already true; wait for the rendered window to actually reflect
    // `scrollTop`.
    const expectedFirst = Math.max(0, Math.floor(scrollTop / 22) - 8) + 1;
    await waitFor(() => expect(rowIndexes()[0]).toBe(expectedFirst), SETTLE);
    return scroller;
  }

  /** Rendered rows, excluding the aria-hidden spacers. */
  const realRows = () => bodyRows().filter((r) => r.getAttribute("aria-hidden") !== "true");
  const spacerRows = () => bodyRows().filter((r) => r.getAttribute("aria-hidden") === "true");
  const rowIndexes = () => realRows().map((r) => Number(r.getAttribute("aria-rowindex")));

  const big = (n: number) => Array.from({ length: n }, (_, i) => `line ${i}`).join("\n") + "\n";
  const bigChanged = (n: number) =>
    Array.from({ length: n }, (_, i) => (i % 2 === 0 ? `line ${i}` : `line ${i} CHANGED`)).join(
      "\n",
    ) + "\n";

  it("renders every row below the threshold", () => {
    render(
      <DiffViewer
        oldText={big(40)}
        newText={bigChanged(40)}
        context={Infinity}
        virtualizeThreshold={200}
      />,
    );
    expect(root().querySelector("[data-usefy-diff-virtualized]")).toBeNull();
    expect(bodyRows().length).toBeGreaterThan(30);
  });

  it("does not window when the threshold is Infinity", () => {
    render(
      <DiffViewer
        oldText={big(600)}
        newText={bigChanged(600)}
        context={Infinity}
        virtualizeThreshold={Infinity}
      />,
    );
    expect(root().querySelector("[data-usefy-diff-virtualized]")).toBeNull();
  });

  it("keeps the DOM small for a large diff", async () => {
    render(<DiffViewer oldText={big(2000)} newText={bigChanged(2000)} context={Infinity} />);
    const total = Number(table()!.getAttribute("aria-rowcount"));
    await scrollTo(440, 0);

    expect(realRows().length).toBeLessThan(100);
    expect(total).toBeGreaterThan(1000);
  });

  it("tells assistive tech the TRUE total, not the window", async () => {
    render(<DiffViewer oldText={big(2000)} newText={bigChanged(2000)} context={Infinity} />);
    const total = Number(table()!.getAttribute("aria-rowcount"));
    await scrollTo(440, 0);

    // The count must not shrink to the window size.
    expect(Number(table()!.getAttribute("aria-rowcount"))).toBe(total);
    expect(realRows().length).toBeLessThan(total);
  });

  it("gives every windowed row its true aria-rowindex", async () => {
    render(<DiffViewer oldText={big(2000)} newText={bigChanged(2000)} context={Infinity} />);
    await scrollTo(440, 22 * 500);

    const indexes = rowIndexes();
    // Contiguous, and offset into the document rather than restarting at 1.
    expect(indexes[0]).toBeGreaterThan(400);
    for (let i = 1; i < indexes.length; i++) {
      expect(indexes[i]).toBe(indexes[i - 1] + 1);
    }
  });

  it("preserves the scroll height with spacer rows", async () => {
    render(<DiffViewer oldText={big(2000)} newText={bigChanged(2000)} context={Infinity} />);
    await scrollTo(440, 22 * 500);

    const spacers = spacerRows();
    expect(spacers).toHaveLength(2); // above and below
    const total = Number(table()!.getAttribute("aria-rowcount"));
    const padding = spacers.reduce(
      (sum, r) => sum + parseInt((r.firstElementChild as HTMLElement).style.height || "0", 10),
      0,
    );
    expect(padding + realRows().length * 22).toBe(total * 22);
  });

  it("updates the window when the container scrolls", async () => {
    render(<DiffViewer oldText={big(2000)} newText={bigChanged(2000)} context={Infinity} />);
    const scroller = await scrollTo(440, 0);
    const firstAtTop = rowIndexes()[0];

    (scroller as unknown as { scrollTop: number }).scrollTop = 22 * 800;
    fireEvent.scroll(scroller);
    await waitFor(() => expect(rowIndexes()[0]).toBeGreaterThan(firstAtTop));
  });

  it("disables windowing under wrap, and says so", () => {
    // `mockClear` because the repo-root vitest setup does not restore spies
    // between tests, so a spy can arrive carrying an earlier test's calls.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warn.mockClear();
    render(<DiffViewer oldText={big(600)} newText={bigChanged(600)} context={Infinity} wrap />);

    expect(root().querySelector("[data-usefy-diff-virtualized]")).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("wrap is on"));
    expect(warn.mock.calls[0][0]).toContain("decision #6");
  });

  it("does not warn about wrap on a small diff", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warn.mockClear();
    render(<DiffViewer oldText={BEFORE} newText={AFTER} wrap />);
    expect(warn).not.toHaveBeenCalled();
  });

  it("keeps the scroller keyboard-reachable when it windows", async () => {
    render(<DiffViewer oldText={big(2000)} newText={bigChanged(2000)} context={Infinity} />);
    const scroller = await scrollTo(440, 0);

    expect(scroller.getAttribute("tabindex")).toBe("0");
    expect(scroller.getAttribute("role")).toBe("group");
    expect(scroller.getAttribute("aria-label")).toBeTruthy();
  });

  it("expands a collapsed region while windowed and keeps the total truthful", async () => {
    // Needs BOTH: enough rows to window, and something collapsed. A big
    // document with one change is only a handful of rows, so the changes
    // start well into the file and then run densely.
    const before = big(1200);
    const after = before
      .replace(/\n$/, "")
      .split("\n")
      .map((line, i) => (i >= 300 && i % 3 === 0 ? `${line} CHANGED` : line))
      .join("\n");
    render(<DiffViewer oldText={before} newText={`${after}\n`} />);
    const scroller = await scrollTo(440, 0);

    const total = Number(table()!.getAttribute("aria-rowcount"));
    expect(total).toBeGreaterThan(200);
    expect(realRows().length).toBeLessThan(total);

    // The leading gap's expander is in the first window.
    fireEvent.click(screen.getAllByRole("button", { name: "Expand 20 lines above" })[0]);
    await waitFor(
      () => expect(Number(table()!.getAttribute("aria-rowcount"))).toBe(total + 20),
      SETTLE,
    );
    // …and the list is still windowed afterwards.
    expect(scroller.getAttribute("data-usefy-diff-virtualized")).toBe("true");
    expect(realRows().length).toBeLessThan(total);
  });

  it("writes the row height it counts in to a CSS variable", () => {
    render(
      <DiffViewer oldText={big(600)} newText={bigChanged(600)} context={Infinity} rowHeight={30} />,
    );
    const scroller = document.querySelector(
      "[data-usefy-diff-state] > div:nth-child(2)",
    ) as HTMLElement;
    expect(scroller.style.getPropertyValue("--usefy-diff-row-height")).toBe("30px");
  });

  it("falls back for a degenerate rowHeight or threshold", () => {
    expect(() =>
      render(
        <DiffViewer
          oldText={big(600)}
          newText={bigChanged(600)}
          context={Infinity}
          rowHeight={NaN}
          virtualizeThreshold={NaN}
        />,
      ),
    ).not.toThrow();
    const scroller = document.querySelector(
      "[data-usefy-diff-state] > div:nth-child(2)",
    ) as HTMLElement;
    expect(scroller.style.getPropertyValue("--usefy-diff-row-height")).toBe("22px");
  });

  it("treats -Infinity threshold as the default, not as 'always window'", () => {
    // `virtualizeThreshold` admits +Infinity (never window) but not
    // -Infinity, which would otherwise force windowing on every diff.
    render(
      <DiffViewer oldText={BEFORE} newText={AFTER} virtualizeThreshold={-Infinity} />,
    );
    // A 3-row diff is far below the 200 default, so no windowing.
    expect(root().querySelector("[data-usefy-diff-virtualized]")).toBeNull();
  });

  it("renders every row on the server, so a small diff needs no JS", () => {
    const html = renderToString(
      <DiffViewer oldText={big(40)} newText={bigChanged(40)} context={Infinity} />,
    );
    expect(html).toContain("line 0");
    expect(html).toContain("line 39");
  });

  it("windows from the very first paint instead of rendering all rows", () => {
    // The freeze this prevents: without an estimated first-render viewport,
    // the pre-measure render materialised the whole 20k list (~1.1s) only to
    // tear it down a frame later. The server render is already bounded too.
    // Sparse changes keep whole-file mode from tripping the cost guard while
    // still leaving ~20k rows to window.
    const before = big(20_000);
    const after = before
      .replace(/\n$/, "")
      .split("\n")
      .map((line, i) => (i % 500 === 0 ? `${line} CHANGED` : line))
      .join("\n");
    const html = renderToString(
      <DiffViewer oldText={before} newText={`${after}\n`} context={Infinity} />,
    );
    // The top of the file is present…
    expect(html).toContain("line 0");
    // …but a line deep in the document is NOT — it was never rendered.
    expect(html).not.toContain("line 19000");
    // A spacer row stands in for the rest.
    expect(html).toMatch(/aria-hidden="true"/);
  });

  it("catches the keyboard when the focused control is windowed out", async () => {
    // Otherwise focus falls to <body> and a keyboard user loses the diff
    // entirely — including the ability to keep scrolling it.
    const before = big(1200);
    const after = before
      .replace(/\n$/, "")
      .split("\n")
      .map((line, i) => (i >= 300 && i % 3 === 0 ? `${line} CHANGED` : line))
      .join("\n");
    render(<DiffViewer oldText={before} newText={`${after}\n`} />);
    const scroller = await scrollTo(440, 0);

    const expander = screen.getAllByRole("button", { name: "Expand 20 lines above" })[0];
    fireEvent.focusIn(expander);
    expander.focus();
    expect(document.activeElement).toBe(expander);

    // Scroll far enough that the expander leaves the window.
    (scroller as unknown as { scrollTop: number }).scrollTop = 22 * 900;
    fireEvent.scroll(scroller);

    await waitFor(() => expect(document.activeElement).toBe(scroller));
  });

  it("does not steal focus when nothing inside was focused", async () => {
    render(<DiffViewer oldText={big(2000)} newText={bigChanged(2000)} context={Infinity} />);
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();

    const scroller = await scrollTo(440, 0);
    (scroller as unknown as { scrollTop: number }).scrollTop = 22 * 900;
    fireEvent.scroll(scroller);
    await waitFor(() => expect(rowIndexes()[0]).toBeGreaterThan(800));

    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("does not steal focus after the user deliberately leaves the scroller", async () => {
    // The tightening: a stale "focus was inside" flag used to let an
    // UNRELATED window change yank focus off <body> even though the user
    // chose to leave. Focus an expander, move off it deliberately, then move
    // the window — focus must stay put.
    const before = big(1200);
    const after = before
      .replace(/\n$/, "")
      .split("\n")
      .map((line, i) => (i >= 300 && i % 3 === 0 ? `${line} CHANGED` : line))
      .join("\n");
    render(<DiffViewer oldText={before} newText={`${after}\n`} />);
    const scroller = await scrollTo(440, 0);

    const expander = screen.getAllByRole("button", { name: "Expand 20 lines above" })[0];
    expander.focus();
    expect(document.activeElement).toBe(expander);

    // The user tabs/clicks away — the expander stays in the DOM, just blurs.
    expander.blur();
    expect(document.activeElement).toBe(document.body);

    // An unrelated window change moves the row window.
    (scroller as unknown as { scrollTop: number }).scrollTop = 22 * 900;
    fireEvent.scroll(scroller);
    await waitFor(() => expect(rowIndexes()[0]).toBeGreaterThan(800), SETTLE);

    // Focus was NOT chased back into the scroller.
    expect(document.activeElement).toBe(document.body);
  });

  it("falls back to window resize when ResizeObserver is missing", async () => {
    const saved = globalThis.ResizeObserver;
    // @ts-expect-error — simulating an environment without it.
    delete globalThis.ResizeObserver;
    try {
      render(<DiffViewer oldText={big(2000)} newText={bigChanged(2000)} context={Infinity} />);
      const scroller = await scrollTo(440, 0);
      expect(scroller.getAttribute("data-usefy-diff-virtualized")).toBe("true");

      // The resize path must drive a re-measure too.
      (scroller as unknown as { scrollTop: number }).scrollTop = 22 * 700;
      fireEvent(window, new Event("resize"));
      await waitFor(() => expect(rowIndexes()[0]).toBeGreaterThan(600));
    } finally {
      globalThis.ResizeObserver = saved;
    }
  });

  it("falls back to a timer when requestAnimationFrame is missing", async () => {
    const saved = globalThis.requestAnimationFrame;
    // @ts-expect-error — simulating an environment without it.
    delete globalThis.requestAnimationFrame;
    try {
      render(<DiffViewer oldText={big(2000)} newText={bigChanged(2000)} context={Infinity} />);
      const scroller = await scrollTo(440, 0);
      expect(scroller.getAttribute("data-usefy-diff-virtualized")).toBe("true");
    } finally {
      globalThis.requestAnimationFrame = saved;
    }
  });
  // Virtualization asserts on rAF-batched measurements, and coverage
  // instrumentation slows a jsdom frame by ~10×; without this the whole
  // block flakes under `--coverage`, passing when run alone.
}, 30_000);

describe("DiffViewer — renderContent seam (SPEC §4.5, §9)", () => {
  it("receives the text, segments, side and line", () => {
    const renderContent = vi.fn(({ text }: { text: string }) => <b>{text}</b>);
    render(<DiffViewer oldText={BEFORE} newText={AFTER} renderContent={renderContent} />);

    expect(renderContent).toHaveBeenCalled();
    const args = renderContent.mock.calls.map(([a]) => a) as Array<{
      text: string;
      segments?: unknown;
      side: string;
      line: { type: string };
    }>;

    expect(args.every((a) => typeof a.text === "string")).toBe(true);
    expect(args.every((a) => a.side === "old" || a.side === "new")).toBe(true);
    expect(args.every((a) => typeof a.line.type === "string")).toBe(true);

    const changed = args.find((a) => a.line.type === "remove");
    expect(changed?.text).toBe("let x = 1;");
    expect(changed?.side).toBe("old");
    expect(Array.isArray(changed?.segments)).toBe(true);
  });

  it("renders exactly what the seam returns", () => {
    render(
      <DiffViewer
        oldText={BEFORE}
        newText={AFTER}
        renderContent={({ text }) => <b data-testid="seam">{text}</b>}
      />,
    );
    expect(screen.getAllByTestId("seam").length).toBeGreaterThan(0);
    // The default segment marks are replaced, not layered on top.
    expect(table()!.querySelectorAll("mark").length).toBe(0);
  });

  it("passes side='new' for added lines and side='old' for removed", () => {
    const seen: string[] = [];
    render(
      <DiffViewer
        oldText={BEFORE}
        newText={AFTER}
        view="unified"
        renderContent={({ side, line }) => {
          seen.push(`${line.type}:${side}`);
          return line.content;
        }}
      />,
    );
    expect(seen).toContain("remove:old");
    expect(seen).toContain("add:new");
  });

  it("never uses dangerouslySetInnerHTML for diff content", () => {
    // Content that would execute if it were injected as markup.
    const evil = "<img src=x onerror=alert(1)>\n";
    render(<DiffViewer oldText={"safe\n"} newText={evil} />);
    expect(table()!.querySelector("img")).toBeNull();
    expect(table()!.textContent).toContain("<img src=x onerror=alert(1)>");
  });
});

describe("DiffViewer — theming and class slots", () => {
  it("applies the dark class for theme='dark'", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} theme="dark" />);
    expect(root().className).toMatch(/dark/);
  });

  it("applies the light class for theme='light'", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} theme="light" />);
    expect(root().className).toMatch(/light/);
    expect(root().className).not.toMatch(/_dark_/);
  });

  it("follows prefers-color-scheme for theme='system'", () => {
    const listeners: Array<() => void> = [];
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: (_: string, fn: () => void) => listeners.push(fn),
        removeEventListener: () => {},
      }),
    );

    render(<DiffViewer oldText={BEFORE} newText={AFTER} theme="system" />);
    expect(root().className).toMatch(/dark/);
  });

  it("survives an environment with no matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(() =>
      render(<DiffViewer oldText={BEFORE} newText={AFTER} theme="system" />),
    ).not.toThrow();
  });

  it("applies every className slot", () => {
    render(
      <DiffViewer
        oldText={doc(80)}
        newText={doc(80, { at: 40, with: "changed" })}
        className="my-root"
        classNames={{
          root: "slot-root",
          header: "slot-header",
          row: "slot-row",
          lineNumber: "slot-number",
          content: "slot-content",
          marker: "slot-marker",
          gap: "slot-gap",
        }}
      />,
    );
    expect(document.querySelector(".my-root")).not.toBeNull();
    expect(document.querySelector(".slot-root")).not.toBeNull();
    expect(document.querySelector(".slot-header")).not.toBeNull();
    expect(document.querySelector(".slot-row")).not.toBeNull();
    expect(document.querySelector(".slot-number")).not.toBeNull();
    expect(document.querySelector(".slot-content")).not.toBeNull();
    expect(document.querySelector(".slot-marker")).not.toBeNull();
    expect(document.querySelector(".slot-gap")).not.toBeNull();
  });

  it("applies the wrap class when asked", () => {
    render(<DiffViewer oldText={BEFORE} newText={AFTER} wrap />);
    expect(root().className).toMatch(/wrap/);
  });
});

describe("DiffViewer — SSR and StrictMode", () => {
  it("renders real rows on the server", () => {
    const html = renderToString(<DiffViewer oldText={BEFORE} newText={AFTER} />);
    expect(html).toContain("<table");
    expect(html).toContain("<th scope=\"row\"");
    expect(html).toContain("keep");
    expect(html).toContain("common");
    // The changed line ships its inline segments, so its text is split
    // across elements rather than emitted as one string.
    expect(html).toContain(">let</mark>");
    expect(html).toContain(">const</mark>");
    expect(html).toContain(" x = 1;");
    // …and the change type is announced, not just coloured.
    expect(html).toContain("Removed");
    expect(html).toContain("Added");
  });

  it("renders the whole line as one string when there are no segments", () => {
    const html = renderToString(
      <DiffViewer oldText={BEFORE} newText={AFTER} inlineDiff={false} />,
    );
    expect(html).toContain("let x = 1;");
    expect(html).toContain("const x = 1;");
  });

  it("renders the no-changes state on the server", () => {
    const html = renderToString(<DiffViewer oldText={BEFORE} newText={BEFORE} />);
    expect(html).toContain("No changes");
  });

  it("renders the guarded state on the server", () => {
    const html = renderToString(
      <DiffViewer oldText={doc(50)} newText={doc(50, { at: 1, with: "x" })} maxLines={10} />,
    );
    expect(html).toContain("too large");
  });

  it("touches no DOM API during a server render", () => {
    const savedWindow = globalThis.window;
    const savedDocument = globalThis.document;
    try {
      // @ts-expect-error — deliberately simulating a server environment.
      delete globalThis.window;
      // @ts-expect-error — deliberately simulating a server environment.
      delete globalThis.document;
      expect(() => renderToString(<DiffViewer oldText={BEFORE} newText={AFTER} />)).not.toThrow();
    } finally {
      globalThis.window = savedWindow;
      globalThis.document = savedDocument;
    }
  });

  it("renders identically under StrictMode", () => {
    const { unmount } = render(<DiffViewer oldText={BEFORE} newText={AFTER} />);
    const plain = table()!.textContent;
    unmount();

    render(
      <StrictMode>
        <DiffViewer oldText={BEFORE} newText={AFTER} />
      </StrictMode>,
    );
    expect(table()!.textContent).toBe(plain);
  });

  it("does not warn under StrictMode", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StrictMode>
        <DiffViewer oldText={doc(80)} newText={doc(80, { at: 40, with: "changed" })} />
      </StrictMode>,
    );
    expect(error).not.toHaveBeenCalled();
  });
});

describe("DiffViewer — options pass-through", () => {
  it("honours ignoreWhitespace", () => {
    render(<DiffViewer oldText={"a  \nb\n"} newText={"a\nb\n"} ignoreWhitespace="trailing" />);
    expect(root().dataset.usefyDiffState).toBe("unchanged");
  });

  it("honours ignoreCase", () => {
    render(<DiffViewer oldText={"Alpha\n"} newText={"alpha\n"} ignoreCase />);
    expect(root().dataset.usefyDiffState).toBe("unchanged");
  });

  it("honours context: Infinity by rendering the whole file", () => {
    render(
      <DiffViewer
        oldText={doc(80)}
        newText={doc(80, { at: 40, with: "changed" })}
        context={Infinity}
      />,
    );
    expect(screen.queryAllByText(/unchanged lines/)).toHaveLength(0);
    expect(table()!.textContent).toContain("line 0");
    expect(table()!.textContent).toContain("line 79");
  });

  it("prefers a supplied diff over recomputing", () => {
    const model = computeDiff("x\n", "y\n");
    // oldText/newText say otherwise; the model must win.
    render(<DiffViewer oldText={BEFORE} newText={AFTER} diff={model} />);
    expect(table()!.textContent).toContain("x");
    expect(table()!.textContent).not.toContain("let x = 1;");
  });

  it("renders an empty pair as 'No changes' rather than throwing", () => {
    expect(() => render(<DiffViewer />)).not.toThrow();
    expect(root().dataset.usefyDiffState).toBe("unchanged");
  });
});
