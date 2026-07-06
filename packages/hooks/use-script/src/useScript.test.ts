import React, { StrictMode } from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useScript, getScriptStatus } from "./index";
import {
  subscribeToScript,
  __clearScriptRegistryForTests,
} from "./cache";

// Each test uses a fresh, unique src so the shared module-level registry can't
// leak state between tests; we still clear the registry + DOM for good measure.
let counter = 0;
function uniqueSrc(): string {
  counter += 1;
  return `https://cdn.test/script-${counter}.js`;
}

function scriptsFor(src: string): HTMLScriptElement[] {
  return Array.from(
    document.querySelectorAll<HTMLScriptElement>(`script[src="${src}"]`)
  );
}

function fire(el: Element, type: "load" | "error"): void {
  act(() => {
    el.dispatchEvent(new Event(type));
  });
}

beforeEach(() => {
  __clearScriptRegistryForTests();
  document.head
    .querySelectorAll("script")
    .forEach((node) => node.remove());
});

describe("useScript — conditional loading", () => {
  it("stays 'idle' and injects nothing when src is null", () => {
    const { result } = renderHook(() => useScript(null));
    expect(result.current).toBe("idle");
    expect(document.head.querySelectorAll("script")).toHaveLength(0);
  });

  it("stays 'idle' when src is undefined", () => {
    const { result } = renderHook(() => useScript(undefined));
    expect(result.current).toBe("idle");
    expect(document.head.querySelectorAll("script")).toHaveLength(0);
  });

  it("stays 'idle' when src is an empty string", () => {
    const { result } = renderHook(() => useScript(""));
    expect(result.current).toBe("idle");
    expect(document.head.querySelectorAll("script")).toHaveLength(0);
  });

  it("stays 'idle' and injects nothing when shouldPreventLoad is true", () => {
    const src = uniqueSrc();
    const { result } = renderHook(() =>
      useScript(src, { shouldPreventLoad: true })
    );
    expect(result.current).toBe("idle");
    expect(scriptsFor(src)).toHaveLength(0);
  });

  it("begins loading once shouldPreventLoad flips to false", () => {
    const src = uniqueSrc();
    const { result, rerender } = renderHook(
      ({ prevent }) => useScript(src, { shouldPreventLoad: prevent }),
      { initialProps: { prevent: true } }
    );
    expect(result.current).toBe("idle");
    expect(scriptsFor(src)).toHaveLength(0);

    rerender({ prevent: false });
    expect(result.current).toBe("loading");
    expect(scriptsFor(src)).toHaveLength(1);
  });
});

describe("useScript — injection & lifecycle", () => {
  it("injects a script, sets data-status='loading', and reports 'loading'", () => {
    const src = uniqueSrc();
    const { result } = renderHook(() => useScript(src));

    expect(result.current).toBe("loading");
    const tags = scriptsFor(src);
    expect(tags).toHaveLength(1);
    expect(tags[0].getAttribute("data-status")).toBe("loading");
    expect(tags[0].parentElement).toBe(document.head);
  });

  it("defaults the script to async", () => {
    const src = uniqueSrc();
    renderHook(() => useScript(src));
    expect(scriptsFor(src)[0].async).toBe(true);
  });

  it("transitions to 'ready' and data-status='ready' on load", () => {
    const src = uniqueSrc();
    const { result } = renderHook(() => useScript(src));
    fire(scriptsFor(src)[0], "load");

    expect(result.current).toBe("ready");
    expect(scriptsFor(src)[0].getAttribute("data-status")).toBe("ready");
  });

  it("transitions to 'error' and data-status='error' on error", () => {
    const src = uniqueSrc();
    const { result } = renderHook(() => useScript(src));
    fire(scriptsFor(src)[0], "error");

    expect(result.current).toBe("error");
    expect(scriptsFor(src)[0].getAttribute("data-status")).toBe("error");
  });
});

describe("useScript — attributes", () => {
  it("applies custom attributes to the created tag", () => {
    const src = uniqueSrc();
    renderHook(() =>
      useScript(src, {
        attributes: {
          id: "my-script",
          "data-token": "abc",
          crossorigin: "anonymous",
        },
      })
    );

    const el = scriptsFor(src)[0];
    expect(el.id).toBe("my-script");
    expect(el.getAttribute("data-token")).toBe("abc");
    expect(el.getAttribute("crossorigin")).toBe("anonymous");
  });

  it("lets attributes manage loading (defer set → not forced async)", () => {
    const src = uniqueSrc();
    renderHook(() => useScript(src, { attributes: { defer: "" } }));
    const el = scriptsFor(src)[0];
    // async is not force-enabled when the caller supplies defer.
    expect(el.async).not.toBe(true);
    expect(el.hasAttribute("defer")).toBe(true);
  });

  it("does not re-inject when the attributes object identity changes", () => {
    const src = uniqueSrc();
    const { rerender } = renderHook(
      ({ attrs }) => useScript(src, { attributes: attrs }),
      { initialProps: { attrs: { id: "a" } as Record<string, string> } }
    );
    expect(scriptsFor(src)).toHaveLength(1);

    // A brand-new attributes object every render must not create a new tag.
    rerender({ attrs: { id: "a" } });
    rerender({ attrs: { id: "different" } });
    expect(scriptsFor(src)).toHaveLength(1);
    // Attributes are honored only at creation time — the original id sticks.
    expect(scriptsFor(src)[0].id).toBe("a");
  });

  it("first-writer-wins: a second hook's attributes for the same src are ignored", () => {
    const src = uniqueSrc();
    // First subscriber creates the tag with its attributes...
    renderHook(() => useScript(src, { attributes: { id: "first" } }));
    // ...a second hook for the same src reuses the one tag; its attributes
    // (the src is already loading) do not apply and no second tag is injected.
    renderHook(() => useScript(src, { attributes: { id: "second" } }));

    expect(scriptsFor(src)).toHaveLength(1);
    expect(scriptsFor(src)[0].id).toBe("first");
  });
});

describe("useScript — deduplication (the core feature)", () => {
  it("shares ONE tag across two hooks with the same src", () => {
    const src = uniqueSrc();
    const a = renderHook(() => useScript(src));
    const b = renderHook(() => useScript(src));

    expect(scriptsFor(src)).toHaveLength(1);
    expect(a.result.current).toBe("loading");
    expect(b.result.current).toBe("loading");
  });

  it("notifies every subscriber when the shared script loads", () => {
    const src = uniqueSrc();
    const a = renderHook(() => useScript(src));
    const b = renderHook(() => useScript(src));

    fire(scriptsFor(src)[0], "load");

    expect(a.result.current).toBe("ready");
    expect(b.result.current).toBe("ready");
  });

  it("a hook mounting after load immediately observes 'ready'", () => {
    const src = uniqueSrc();
    const first = renderHook(() => useScript(src));
    fire(scriptsFor(src)[0], "load");
    expect(first.result.current).toBe("ready");

    const late = renderHook(() => useScript(src));
    expect(late.result.current).toBe("ready");
    expect(scriptsFor(src)).toHaveLength(1);
  });
});

describe("useScript — adopting a pre-existing tag", () => {
  it("adopts a tag with data-status and reports that status", () => {
    const src = uniqueSrc();
    const el = document.createElement("script");
    el.src = src;
    el.setAttribute("data-status", "ready");
    document.head.appendChild(el);

    const { result } = renderHook(() => useScript(src));
    expect(result.current).toBe("ready");
    expect(scriptsFor(src)).toHaveLength(1);
  });

  it("treats an untracked pre-existing tag (no data-status) as 'ready'", () => {
    const src = uniqueSrc();
    const el = document.createElement("script");
    el.src = src;
    document.head.appendChild(el);

    const { result } = renderHook(() => useScript(src));
    expect(result.current).toBe("ready");
    expect(scriptsFor(src)).toHaveLength(1);
  });

  it("coerces a garbage data-status on an adopted tag to 'ready'", () => {
    const src = uniqueSrc();
    const el = document.createElement("script");
    el.src = src;
    el.setAttribute("data-status", "bogus");
    document.head.appendChild(el);

    const { result } = renderHook(() => useScript(src));
    expect(result.current).toBe("ready");
  });

  it("adopts a pre-existing 'loading' tag and still reacts to its load event", () => {
    const src = uniqueSrc();
    const el = document.createElement("script");
    el.src = src;
    el.setAttribute("data-status", "loading");
    document.head.appendChild(el);

    const { result } = renderHook(() => useScript(src));
    expect(result.current).toBe("loading");

    fire(el, "load");
    expect(result.current).toBe("ready");
  });
});

describe("useScript — cleanup & ref-count", () => {
  it("keeps the tag on unmount by default (removeOnUnmount omitted)", () => {
    const src = uniqueSrc();
    const { unmount } = renderHook(() => useScript(src));
    expect(scriptsFor(src)).toHaveLength(1);

    unmount();
    expect(scriptsFor(src)).toHaveLength(1);
  });

  it("removes the tag on unmount when removeOnUnmount + last subscriber", () => {
    const src = uniqueSrc();
    const { unmount } = renderHook(() =>
      useScript(src, { removeOnUnmount: true })
    );
    expect(scriptsFor(src)).toHaveLength(1);

    unmount();
    expect(scriptsFor(src)).toHaveLength(0);
    expect(getScriptStatus(src)).toBe("idle");
  });

  it("keeps the tag while another subscriber remains (ref-count)", () => {
    const src = uniqueSrc();
    const a = renderHook(() => useScript(src, { removeOnUnmount: true }));
    const b = renderHook(() => useScript(src));
    expect(scriptsFor(src)).toHaveLength(1);

    a.unmount();
    // b still subscribed → tag must remain.
    expect(scriptsFor(src)).toHaveLength(1);

    b.unmount();
    // Now the last remover-requesting unmount already happened, but b did not
    // request removal, so the tag stays (only a removeOnUnmount unmount that is
    // also the last subscriber removes it).
    expect(scriptsFor(src)).toHaveLength(1);
  });

  it("removes the tag only when the removeOnUnmount hook unmounts last", () => {
    const src = uniqueSrc();
    const keeper = renderHook(() => useScript(src));
    const remover = renderHook(() => useScript(src, { removeOnUnmount: true }));
    expect(scriptsFor(src)).toHaveLength(1);

    keeper.unmount();
    expect(scriptsFor(src)).toHaveLength(1);

    remover.unmount(); // last subscriber AND removeOnUnmount → gone
    expect(scriptsFor(src)).toHaveLength(0);
  });

  it("reads removeOnUnmount live — a mid-mount toggle to true removes on unmount", () => {
    const src = uniqueSrc();
    const { unmount, rerender } = renderHook(
      ({ remove }) => useScript(src, { removeOnUnmount: remove }),
      { initialProps: { remove: false } }
    );
    expect(scriptsFor(src)).toHaveLength(1);

    // Flip to true without changing src (must NOT re-inject).
    rerender({ remove: true });
    expect(scriptsFor(src)).toHaveLength(1);

    unmount();
    expect(scriptsFor(src)).toHaveLength(0);
  });
});

describe("useScript — StrictMode safety", () => {
  it("injects only one tag and leaves one under a StrictMode double-mount", () => {
    const src = uniqueSrc();
    const { result } = renderHook(() => useScript(src), {
      wrapper: ({ children }) =>
        React.createElement(StrictMode, null, children),
    });

    expect(scriptsFor(src)).toHaveLength(1);
    expect(result.current).toBe("loading");

    fire(scriptsFor(src)[0], "load");
    expect(result.current).toBe("ready");
    expect(scriptsFor(src)).toHaveLength(1);
  });

  it("keeps exactly one tag under StrictMode even with removeOnUnmount", () => {
    const src = uniqueSrc();
    const { result } = renderHook(
      () => useScript(src, { removeOnUnmount: true }),
      {
        wrapper: ({ children }) =>
          React.createElement(StrictMode, null, children),
      }
    );

    // The double subscribe/unsubscribe converges to a single live tag.
    expect(scriptsFor(src)).toHaveLength(1);
    fire(scriptsFor(src)[0], "load");
    expect(result.current).toBe("ready");
    expect(scriptsFor(src)).toHaveLength(1);
  });
});

describe("useScript — changing src", () => {
  it("switches subscription to the new src", () => {
    const a = uniqueSrc();
    const b = uniqueSrc();
    const { result, rerender } = renderHook(({ src }) => useScript(src), {
      initialProps: { src: a },
    });
    expect(result.current).toBe("loading");
    fire(scriptsFor(a)[0], "load");
    expect(result.current).toBe("ready");

    rerender({ src: b });
    expect(result.current).toBe("loading");
    expect(scriptsFor(b)).toHaveLength(1);
  });
});

describe("getScriptStatus helper", () => {
  it("reflects the shared status and returns 'idle' for unknown src", () => {
    const src = uniqueSrc();
    expect(getScriptStatus(src)).toBe("idle");

    renderHook(() => useScript(src));
    expect(getScriptStatus(src)).toBe("loading");

    fire(scriptsFor(src)[0], "load");
    expect(getScriptStatus(src)).toBe("ready");
  });
});

describe("useScript — SSR safety", () => {
  it("subscribeToScript no-ops without a document and injects nothing", () => {
    const src = uniqueSrc();
    // Simulate the server: no DOM available.
    vi.stubGlobal("document", undefined);
    try {
      const unsubscribe = subscribeToScript(
        src,
        undefined,
        () => false,
        () => {}
      );
      expect(typeof unsubscribe).toBe("function");
      expect(() => unsubscribe()).not.toThrow();
      // Nothing was registered, so the shared status stays idle.
      expect(getScriptStatus(src)).toBe("idle");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
