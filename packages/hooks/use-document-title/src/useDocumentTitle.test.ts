import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useDocumentTitle } from "./useDocumentTitle";

describe("useDocumentTitle", () => {
  beforeEach(() => {
    document.title = "Original";
  });

  afterEach(() => {
    document.title = "Original";
  });

  it("sets the document title on mount", () => {
    renderHook(() => useDocumentTitle("Hello"));
    expect(document.title).toBe("Hello");
  });

  it("updates the title when it changes", () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: "A" },
    });
    expect(document.title).toBe("A");
    rerender({ title: "B" });
    expect(document.title).toBe("B");
  });

  it("does not restore on unmount by default", () => {
    const { unmount } = renderHook(() => useDocumentTitle("Temp"));
    expect(document.title).toBe("Temp");
    unmount();
    expect(document.title).toBe("Temp");
  });

  it("restores the original title on unmount when enabled", () => {
    const { unmount } = renderHook(() =>
      useDocumentTitle("Temp", { restoreOnUnmount: true })
    );
    expect(document.title).toBe("Temp");
    unmount();
    expect(document.title).toBe("Original");
  });

  it("restores the title captured at mount, not an intermediate one", () => {
    const { rerender, unmount } = renderHook(
      ({ title }) => useDocumentTitle(title, { restoreOnUnmount: true }),
      { initialProps: { title: "First" } }
    );
    rerender({ title: "Second" });
    expect(document.title).toBe("Second");
    unmount();
    expect(document.title).toBe("Original");
  });
});
