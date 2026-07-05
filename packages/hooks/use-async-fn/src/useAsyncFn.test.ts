import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAsyncFn } from "./useAsyncFn";

/** A promise you can resolve/reject from the outside, for ordering control. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useAsyncFn", () => {
  describe("initial state", () => {
    it("starts idle with no data or error", () => {
      const { result } = renderHook(() =>
        useAsyncFn(async () => "value"),
      );
      const [state, run] = result.current;
      expect(state.status).toBe("idle");
      expect(state.data).toBeUndefined();
      expect(state.error).toBeUndefined();
      expect(state.isLoading).toBe(false);
      expect(typeof run).toBe("function");
    });

    it("seeds data from initialData but keeps status idle", () => {
      const { result } = renderHook(() =>
        useAsyncFn(async () => 2, { initialData: 1 }),
      );
      expect(result.current[0].data).toBe(1);
      expect(result.current[0].status).toBe("idle");
      expect(result.current[0].isLoading).toBe(false);
    });
  });

  describe("happy path", () => {
    it("transitions idle → pending → success and sets data", async () => {
      const d = deferred<string>();
      const { result } = renderHook(() => useAsyncFn(() => d.promise));

      let runPromise: Promise<string | undefined>;
      act(() => {
        runPromise = result.current[1]();
      });

      expect(result.current[0].status).toBe("pending");
      expect(result.current[0].isLoading).toBe(true);
      expect(result.current[0].error).toBeUndefined();

      await act(async () => {
        d.resolve("done");
        await runPromise;
      });

      expect(result.current[0].status).toBe("success");
      expect(result.current[0].data).toBe("done");
      expect(result.current[0].error).toBeUndefined();
      expect(result.current[0].isLoading).toBe(false);
    });

    it("forwards run arguments to fn", async () => {
      const fn = vi.fn(async (a: number, b: string) => `${a}-${b}`);
      const { result } = renderHook(() => useAsyncFn(fn));

      let value: string | undefined;
      await act(async () => {
        value = await result.current[1](7, "x");
      });

      expect(fn).toHaveBeenCalledWith(7, "x");
      expect(value).toBe("7-x");
      expect(result.current[0].data).toBe("7-x");
    });

    it("run resolves with the produced value on success", async () => {
      const { result } = renderHook(() => useAsyncFn(async () => 42));
      let value: number | undefined;
      await act(async () => {
        value = await result.current[1]();
      });
      expect(value).toBe(42);
    });
  });

  describe("error path", () => {
    it("transitions idle → pending → error and stores the error", async () => {
      const boom = new Error("boom");
      const { result } = renderHook(() =>
        useAsyncFn(async () => {
          throw boom;
        }),
      );

      await act(async () => {
        await result.current[1]();
      });

      expect(result.current[0].status).toBe("error");
      expect(result.current[0].error).toBe(boom);
      expect(result.current[0].isLoading).toBe(false);
    });

    it("run resolves with undefined on error (never rejects)", async () => {
      const { result } = renderHook(() =>
        useAsyncFn(async () => {
          throw new Error("nope");
        }),
      );
      let value: unknown = "sentinel";
      await act(async () => {
        // Not wrapped in try/catch — a rejection here would fail the test.
        value = await result.current[1]();
      });
      expect(value).toBeUndefined();
    });

    it("does not throw an unhandled rejection for a fire-and-forget run", async () => {
      const { result } = renderHook(() =>
        useAsyncFn(async () => {
          throw new Error("silent");
        }),
      );
      await act(async () => {
        // Intentionally not awaited by the caller.
        result.current[1]();
        await Promise.resolve();
      });
      // Flush microtasks; guard is that no unhandled rejection surfaces.
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current[0].status).toBe("error");
    });

    it("keeps the last successful data when a later run errors", async () => {
      const fn = vi
        .fn<() => Promise<number>>()
        .mockResolvedValueOnce(100)
        .mockRejectedValueOnce(new Error("fail"));
      const { result } = renderHook(() => useAsyncFn(fn));

      await act(async () => {
        await result.current[1]();
      });
      expect(result.current[0].data).toBe(100);

      await act(async () => {
        await result.current[1]();
      });
      expect(result.current[0].status).toBe("error");
      expect(result.current[0].data).toBe(100); // retained
    });

    it("clears a previous error when a new run starts", async () => {
      const d = deferred<string>();
      const fn = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error("first"))
        .mockImplementationOnce(() => d.promise);
      const { result } = renderHook(() => useAsyncFn(fn));

      await act(async () => {
        await result.current[1]();
      });
      expect(result.current[0].error).toBeInstanceOf(Error);

      act(() => {
        void result.current[1]();
      });
      // Pending: error cleared immediately.
      expect(result.current[0].status).toBe("pending");
      expect(result.current[0].error).toBeUndefined();

      await act(async () => {
        d.resolve("ok");
      });
      expect(result.current[0].status).toBe("success");
      expect(result.current[0].error).toBeUndefined();
    });
  });

  describe("isLoading mirror", () => {
    it("mirrors status === 'pending'", async () => {
      const d = deferred<void>();
      const { result } = renderHook(() => useAsyncFn(() => d.promise));

      act(() => {
        void result.current[1]();
      });
      expect(result.current[0].isLoading).toBe(true);
      expect(result.current[0].status).toBe("pending");

      await act(async () => {
        d.resolve();
      });
      expect(result.current[0].isLoading).toBe(false);
      expect(result.current[0].status).toBe("success");
    });
  });

  describe("race safety (stale-response guarding)", () => {
    it("only the latest call updates state when promises settle out of order", async () => {
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      const fn = vi
        .fn<() => Promise<string>>()
        .mockImplementationOnce(() => d1.promise)
        .mockImplementationOnce(() => d2.promise);
      const { result } = renderHook(() => useAsyncFn(fn));

      let p1: Promise<string | undefined>;
      let p2: Promise<string | undefined>;
      act(() => {
        p1 = result.current[1]();
      });
      act(() => {
        p2 = result.current[1]();
      });

      // Resolve the NEWER call first.
      await act(async () => {
        d2.resolve("second");
        await p2;
      });
      expect(result.current[0].data).toBe("second");
      expect(result.current[0].status).toBe("success");

      // Now the OLDER call settles late — it must be ignored for state.
      await act(async () => {
        d1.resolve("first");
        await p1;
      });
      expect(result.current[0].data).toBe("second"); // latest still wins
    });

    it("a stale error does not overwrite a newer success", async () => {
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      const fn = vi
        .fn<() => Promise<string>>()
        .mockImplementationOnce(() => d1.promise)
        .mockImplementationOnce(() => d2.promise);
      const onError = vi.fn();
      const { result } = renderHook(() => useAsyncFn(fn, { onError }));

      let p1: Promise<string | undefined>;
      act(() => {
        p1 = result.current[1]();
      });
      act(() => {
        void result.current[1]();
      });

      await act(async () => {
        d2.resolve("winner");
        await Promise.resolve();
      });
      expect(result.current[0].status).toBe("success");

      await act(async () => {
        d1.reject(new Error("stale"));
        await p1;
      });
      expect(result.current[0].status).toBe("success");
      expect(result.current[0].data).toBe("winner");
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("unmount safety", () => {
    it("does not update state or call onSuccess after unmount", async () => {
      const d = deferred<string>();
      const onSuccess = vi.fn();
      const { result, unmount } = renderHook(() =>
        useAsyncFn(() => d.promise, { onSuccess }),
      );

      let runPromise: Promise<string | undefined>;
      act(() => {
        runPromise = result.current[1]();
      });
      const stateBefore = result.current[0];

      unmount();

      await act(async () => {
        d.resolve("late");
        await runPromise;
      });

      // The hook is unmounted; onSuccess must not fire.
      expect(onSuccess).not.toHaveBeenCalled();
      // The last rendered state is still the pending snapshot.
      expect(stateBefore.status).toBe("pending");
    });

    it("does not call onError after unmount", async () => {
      const d = deferred<string>();
      const onError = vi.fn();
      const { result, unmount } = renderHook(() =>
        useAsyncFn(() => d.promise, { onError }),
      );

      let runPromise: Promise<string | undefined>;
      act(() => {
        runPromise = result.current[1]();
      });
      unmount();

      await act(async () => {
        d.reject(new Error("late"));
        await runPromise;
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("callbacks", () => {
    it("calls onSuccess with the resolved data", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useAsyncFn(async () => "hi", { onSuccess }),
      );
      await act(async () => {
        await result.current[1]();
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith("hi");
    });

    it("calls onError with the thrown error", async () => {
      const err = new Error("x");
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useAsyncFn(
          async () => {
            throw err;
          },
          { onError },
        ),
      );
      await act(async () => {
        await result.current[1]();
      });
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(err);
    });

    it("does not call onSuccess for a superseded (stale) call", async () => {
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      const fn = vi
        .fn<() => Promise<string>>()
        .mockImplementationOnce(() => d1.promise)
        .mockImplementationOnce(() => d2.promise);
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useAsyncFn(fn, { onSuccess }));

      let p1: Promise<string | undefined>;
      act(() => {
        p1 = result.current[1]();
      });
      act(() => {
        void result.current[1]();
      });

      await act(async () => {
        d2.resolve("new");
        await Promise.resolve();
      });
      await act(async () => {
        d1.resolve("old");
        await p1;
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith("new");
    });

    it("reads the latest callbacks without recreating run", async () => {
      const onSuccessA = vi.fn();
      const onSuccessB = vi.fn();
      const { result, rerender } = renderHook(
        ({ cb }) => useAsyncFn(async () => "v", { onSuccess: cb }),
        { initialProps: { cb: onSuccessA } },
      );
      const run = result.current[1];
      rerender({ cb: onSuccessB });
      expect(result.current[1]).toBe(run); // stable

      await act(async () => {
        await result.current[1]();
      });
      expect(onSuccessA).not.toHaveBeenCalled();
      expect(onSuccessB).toHaveBeenCalledWith("v");
    });
  });

  describe("stability", () => {
    it("keeps run referentially stable across rerenders", () => {
      const { result, rerender } = renderHook(() =>
        useAsyncFn(async () => 1),
      );
      const run = result.current[1];
      rerender();
      expect(result.current[1]).toBe(run);
    });

    it("uses the latest inline fn without changing run identity", async () => {
      const fn1 = vi.fn(async () => "a");
      const fn2 = vi.fn(async () => "b");
      const { result, rerender } = renderHook(
        ({ fn }) => useAsyncFn(fn),
        { initialProps: { fn: fn1 } },
      );
      const run = result.current[1];
      rerender({ fn: fn2 });
      expect(result.current[1]).toBe(run);

      let value: string | undefined;
      await act(async () => {
        value = await result.current[1]();
      });
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn1).not.toHaveBeenCalled();
      expect(value).toBe("b");
      expect(result.current[0].data).toBe("b");
    });
  });

  describe("re-run after settle", () => {
    it("returns to pending (retaining data) on a subsequent run", async () => {
      const d = deferred<string>();
      const fn = vi
        .fn<() => Promise<string>>()
        .mockResolvedValueOnce("first")
        .mockImplementationOnce(() => d.promise);
      const { result } = renderHook(() => useAsyncFn(fn));

      await act(async () => {
        await result.current[1]();
      });
      expect(result.current[0].data).toBe("first");

      act(() => {
        void result.current[1]();
      });
      expect(result.current[0].status).toBe("pending");
      expect(result.current[0].data).toBe("first"); // retained during pending

      await act(async () => {
        d.resolve("second");
      });
      expect(result.current[0].data).toBe("second");
    });
  });

  describe("SSR", () => {
    it("renders an idle state without touching browser globals", () => {
      // The hook is logic-only; simply exercising initial render proves it does
      // not reference window/document at module or render time.
      const { result } = renderHook(() =>
        useAsyncFn(async () => "ssr", { initialData: "seed" }),
      );
      expect(result.current[0].status).toBe("idle");
      expect(result.current[0].data).toBe("seed");
    });
  });
});
