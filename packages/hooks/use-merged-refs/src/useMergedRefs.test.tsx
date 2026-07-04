import { describe, it, expect, vi } from "vitest";
import { createRef, type Ref } from "react";
import { render, renderHook } from "@testing-library/react";
import { useMergedRefs } from "./useMergedRefs";
import { mergeRefs, setRef } from "./utils";

describe("setRef", () => {
  it("sets .current on a ref object", () => {
    const ref = createRef<string>();
    setRef(ref, "value");
    expect(ref.current).toBe("value");
  });

  it("invokes a callback ref with the value", () => {
    const cb = vi.fn<(node: string | null) => void>();
    setRef(cb, "value");
    expect(cb).toHaveBeenCalledWith("value");
  });

  it("returns the cleanup a callback ref returns", () => {
    const cleanup = vi.fn();
    const result = setRef(() => cleanup, "value");
    expect(result).toBe(cleanup);
  });

  it("returns void for object refs", () => {
    const ref = createRef<string>();
    expect(setRef(ref, "value")).toBeUndefined();
  });

  it("is a no-op for null and undefined", () => {
    expect(() => setRef(null, "x")).not.toThrow();
    expect(() => setRef(undefined, "x")).not.toThrow();
  });
});

describe("mergeRefs", () => {
  it("fans a node out to object and callback refs", () => {
    const objRef = createRef<string>();
    const cb = vi.fn<(node: string | null) => void>();
    const merged = mergeRefs<string>(objRef, cb);

    merged("node");
    expect(objRef.current).toBe("node");
    expect(cb).toHaveBeenCalledWith("node");
  });

  it("skips null and undefined refs", () => {
    const objRef = createRef<string>();
    const merged = mergeRefs<string>(null, undefined, objRef);
    expect(() => merged("node")).not.toThrow();
    expect(objRef.current).toBe("node");
  });

  it("returns void when no ref returns a cleanup", () => {
    const merged = mergeRefs<string>(
      createRef<string>(),
      vi.fn<(node: string | null) => void>()
    );
    expect(merged("node")).toBeUndefined();
  });

  it("returns a cleanup when a callback ref returns one", () => {
    const innerCleanup = vi.fn();
    const merged = mergeRefs<string>(
      (() => innerCleanup) as (node: string | null) => () => void
    );

    const cleanup = merged("node");
    expect(typeof cleanup).toBe("function");

    cleanup?.();
    expect(innerCleanup).toHaveBeenCalledTimes(1);
  });

  it("resets non-cleanup refs to null in the returned cleanup", () => {
    const objRef = createRef<string>();
    const plainCb = vi.fn<(node: string | null) => void>();
    const innerCleanup = vi.fn();
    const cleanupCb = vi.fn<(node: string | null) => () => void>(
      () => innerCleanup
    );

    const merged = mergeRefs<string>(objRef, plainCb, cleanupCb);
    const cleanup = merged("node");

    expect(objRef.current).toBe("node");

    cleanup?.();
    // cleanup-returning ref uses its own cleanup...
    expect(innerCleanup).toHaveBeenCalledTimes(1);
    // ...others are reset to null.
    expect(objRef.current).toBeNull();
    expect(plainCb).toHaveBeenLastCalledWith(null);
  });
});

describe("useMergedRefs", () => {
  it("populates a local ref and a forwarded ref with the same node", () => {
    const local = createRef<HTMLDivElement>();
    const forwarded = createRef<HTMLDivElement>();

    function Component({ forwardedRef }: { forwardedRef: Ref<HTMLDivElement> }) {
      const ref = useMergedRefs(local, forwardedRef);
      return <div ref={ref} data-testid="node" />;
    }

    const { getByTestId } = render(<Component forwardedRef={forwarded} />);
    const node = getByTestId("node");

    expect(local.current).toBe(node);
    expect(forwarded.current).toBe(node);
  });

  it("calls a forwarded callback ref with the node", () => {
    const cb = vi.fn<(node: HTMLDivElement | null) => void>();

    function Component() {
      const ref = useMergedRefs<HTMLDivElement>(cb);
      return <div ref={ref} data-testid="node" />;
    }

    const { getByTestId } = render(<Component />);
    expect(cb).toHaveBeenCalledWith(getByTestId("node"));
  });

  it("resets refs to null on unmount", () => {
    const forwarded = createRef<HTMLDivElement>();

    function Component() {
      const ref = useMergedRefs(forwarded);
      return <div ref={ref} />;
    }

    const { unmount } = render(<Component />);
    expect(forwarded.current).toBeInstanceOf(HTMLDivElement);

    unmount();
    expect(forwarded.current).toBeNull();
  });

  it("keeps a stable callback identity when refs are unchanged", () => {
    const a = createRef<string>();
    const b = createRef<string>();
    const { result, rerender } = renderHook(() => useMergedRefs(a, b));

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("changes identity when a ref changes", () => {
    const a = createRef<string>();
    const b1 = createRef<string>();
    const b2 = createRef<string>();

    const { result, rerender } = renderHook(
      ({ b }) => useMergedRefs(a, b),
      { initialProps: { b: b1 } }
    );
    const first = result.current;

    rerender({ b: b2 });
    expect(result.current).not.toBe(first);
  });
});
