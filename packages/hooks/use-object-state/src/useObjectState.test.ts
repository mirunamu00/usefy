import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderHook, act } from "@testing-library/react";
import { useObjectState } from "./useObjectState";

interface FormState {
  name: string;
  email: string;
  subscribe: boolean;
}

const initialForm: FormState = {
  name: "Alice",
  email: "alice@example.com",
  subscribe: false,
};

describe("useObjectState", () => {
  describe("initialization", () => {
    it("returns the initial object as the first tuple element", () => {
      const { result } = renderHook(() => useObjectState(initialForm));
      expect(result.current[0]).toEqual(initialForm);
    });

    it("returns a [state, patch, reset] tuple with function updaters", () => {
      const { result } = renderHook(() => useObjectState({ a: 1 }));
      const [state, patch, reset] = result.current;
      expect(state).toEqual({ a: 1 });
      expect(typeof patch).toBe("function");
      expect(typeof reset).toBe("function");
    });

    it("supports a lazy initializer and runs it exactly once", () => {
      const initializer = vi.fn(() => ({ count: 0, step: 2 }));
      const { result, rerender } = renderHook(() =>
        useObjectState(initializer)
      );

      expect(result.current[0]).toEqual({ count: 0, step: 2 });
      expect(initializer).toHaveBeenCalledTimes(1);

      // Re-render + a patch must not re-run the initializer.
      rerender();
      act(() => {
        result.current[1]({ count: 5 });
      });
      rerender();
      expect(initializer).toHaveBeenCalledTimes(1);
    });

    it("runs a lazy initializer once under StrictMode (double render)", () => {
      const initializer = vi.fn(() => ({ count: 0 }));
      const { result } = renderHook(() => useObjectState(initializer), {
        reactStrictMode: true,
      });

      // The null-sentinel ref survives StrictMode's paired render invocations.
      expect(initializer).toHaveBeenCalledTimes(1);
      expect(result.current[0]).toEqual({ count: 0 });
    });
  });

  describe("patch — object form", () => {
    it("shallow-merges a partial and preserves untouched keys", () => {
      const { result } = renderHook(() => useObjectState(initialForm));

      act(() => {
        result.current[1]({ name: "Bob" });
      });

      expect(result.current[0]).toEqual({
        name: "Bob",
        email: "alice@example.com",
        subscribe: false,
      });
    });

    it("produces a NEW object identity on each patch (immutable)", () => {
      const { result } = renderHook(() => useObjectState(initialForm));
      const before = result.current[0];

      act(() => {
        result.current[1]({ name: "Bob" });
      });

      expect(result.current[0]).not.toBe(before);
    });

    it("does not mutate the previous state object", () => {
      const { result } = renderHook(() => useObjectState(initialForm));
      const snapshot = result.current[0];
      const snapshotCopy = { ...snapshot };

      act(() => {
        result.current[1]({ name: "Bob", subscribe: true });
      });

      // The captured previous state reference is unchanged.
      expect(snapshot).toEqual(snapshotCopy);
      expect(snapshot).not.toBe(result.current[0]);
    });

    it("preserves the reference of untouched nested values", () => {
      const nested = { theme: "dark" };
      const { result } = renderHook(() =>
        useObjectState({ prefs: nested, name: "Alice" })
      );

      act(() => {
        result.current[1]({ name: "Bob" });
      });

      // `prefs` was not in the patch, so it is preserved by reference.
      expect(result.current[0].prefs).toBe(nested);
    });

    it("accumulates multiple sequential patches", () => {
      const { result } = renderHook(() => useObjectState(initialForm));

      act(() => {
        result.current[1]({ name: "Bob" });
      });
      act(() => {
        result.current[1]({ email: "bob@example.com" });
      });
      act(() => {
        result.current[1]({ subscribe: true });
      });

      expect(result.current[0]).toEqual({
        name: "Bob",
        email: "bob@example.com",
        subscribe: true,
      });
    });

    it("merges multiple patches applied within a single commit", () => {
      const { result } = renderHook(() => useObjectState({ count: 0, step: 1 }));

      act(() => {
        result.current[1]((prev) => ({ count: prev.count + 1 }));
        result.current[1]((prev) => ({ count: prev.count + 1 }));
        result.current[1]((prev) => ({ count: prev.count + 1 }));
      });

      expect(result.current[0].count).toBe(3);
    });
  });

  describe("patch — functional updater form", () => {
    it("computes the partial from the previous state", () => {
      const { result } = renderHook(() =>
        useObjectState({ count: 10, step: 5 })
      );

      act(() => {
        result.current[1]((prev) => ({ count: prev.count + prev.step }));
      });

      expect(result.current[0]).toEqual({ count: 15, step: 5 });
    });

    it("still merges shallowly (untouched keys preserved)", () => {
      const { result } = renderHook(() => useObjectState(initialForm));

      act(() => {
        result.current[1]((prev) => ({ name: prev.name.toUpperCase() }));
      });

      expect(result.current[0]).toEqual({
        name: "ALICE",
        email: "alice@example.com",
        subscribe: false,
      });
    });
  });

  describe("shallow-merge caveat", () => {
    it("replaces (does NOT deep-merge) nested objects", () => {
      const { result } = renderHook(() =>
        useObjectState({
          user: { name: "Alice", age: 30 },
          active: true,
        })
      );

      act(() => {
        // Only providing `name` for the nested object replaces the whole object.
        result.current[1]({ user: { name: "Bob" } as { name: string; age: number } });
      });

      // `age` is gone — the nested object was replaced, not merged.
      expect(result.current[0].user).toEqual({ name: "Bob" });
    });
  });

  describe("reset", () => {
    it("reset() restores the original initial state", () => {
      const { result } = renderHook(() => useObjectState(initialForm));

      act(() => {
        result.current[1]({ name: "Bob", subscribe: true });
      });
      expect(result.current[0]).not.toEqual(initialForm);

      act(() => {
        result.current[2]();
      });
      expect(result.current[0]).toEqual(initialForm);
    });

    it("reset(next) sets the provided object", () => {
      const { result } = renderHook(() => useObjectState(initialForm));
      const next: FormState = {
        name: "Carol",
        email: "carol@example.com",
        subscribe: true,
      };

      act(() => {
        result.current[2](next);
      });

      expect(result.current[0]).toEqual(next);
      expect(result.current[0]).toBe(next);
    });

    it("reset() restores the value produced by a lazy initializer", () => {
      const initializer = vi.fn(() => ({ count: 7 }));
      const { result } = renderHook(() => useObjectState(initializer));

      act(() => {
        result.current[1]({ count: 100 });
      });
      expect(result.current[0]).toEqual({ count: 100 });

      act(() => {
        result.current[2]();
      });
      expect(result.current[0]).toEqual({ count: 7 });
      // Initializer is not re-run by reset — the value was cached once.
      expect(initializer).toHaveBeenCalledTimes(1);
    });

    it("reset() after reset(next) still returns to the ORIGINAL initial", () => {
      const { result } = renderHook(() => useObjectState(initialForm));

      act(() => {
        result.current[2]({
          name: "Carol",
          email: "carol@example.com",
          subscribe: true,
        });
      });
      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toEqual(initialForm);
    });

    it("keeps the cached initial pristine across repeated patch/reset cycles", () => {
      const original = { ...initialForm };
      const { result } = renderHook(() => useObjectState(initialForm));

      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current[1]({ name: `iter-${i}`, subscribe: true });
        });
        act(() => {
          result.current[2]();
        });
        expect(result.current[0]).toEqual(original);
      }
    });
  });

  describe("referential stability", () => {
    it("keeps patch and reset stable across re-renders", () => {
      const { result, rerender } = renderHook(() =>
        useObjectState(initialForm)
      );
      const [, patch1, reset1] = result.current;

      rerender();
      const [, patch2, reset2] = result.current;

      expect(patch2).toBe(patch1);
      expect(reset2).toBe(reset1);
    });

    it("keeps patch and reset stable across state updates", () => {
      const { result } = renderHook(() => useObjectState(initialForm));
      const [, patch1, reset1] = result.current;

      act(() => {
        result.current[1]({ name: "Bob" });
      });

      const [, patch2, reset2] = result.current;
      expect(patch2).toBe(patch1);
      expect(reset2).toBe(reset1);
    });
  });

  describe("initial value isolation", () => {
    it("does not mutate the caller's initial object when patching", () => {
      const original = { name: "Alice", email: "a@x.com", subscribe: false };
      const { result } = renderHook(() => useObjectState(original));

      act(() => {
        result.current[1]({ name: "Bob" });
      });

      expect(original.name).toBe("Alice");
    });
  });

  describe("SSR", () => {
    it("renders on the server without touching the DOM", () => {
      function Probe() {
        const [state] = useObjectState({ label: "hi" });
        return React.createElement("span", null, state.label);
      }

      const html = renderToStaticMarkup(React.createElement(Probe));
      expect(html).toBe("<span>hi</span>");
    });
  });
});
