import { describe, it, expect, vi } from "vitest";
import { StrictMode } from "react";
import { renderHook, act } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { useAsync } from "./useAsync";

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

describe("useAsync", () => {
  describe("initial state", () => {
    it("starts idle with no data or error (immediate: false)", () => {
      const { result } = renderHook(() =>
        useAsync(async () => "value", { immediate: false }),
      );
      expect(result.current.status).toBe("idle");
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.execute).toBe("function");
      expect(typeof result.current.reset).toBe("function");
    });

    it("seeds data from initialData but keeps status idle", () => {
      const { result } = renderHook(() =>
        useAsync(async () => 2, { immediate: false, initialData: 1 }),
      );
      expect(result.current.data).toBe(1);
      expect(result.current.status).toBe("idle");
    });
  });

  describe("execute lifecycle", () => {
    it("transitions idle → pending → success and sets data", async () => {
      const d = deferred<string>();
      const { result } = renderHook(() =>
        useAsync(() => d.promise, { immediate: false }),
      );

      let p: Promise<string | undefined>;
      act(() => {
        p = result.current.execute();
      });

      expect(result.current.status).toBe("pending");
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeUndefined();

      await act(async () => {
        d.resolve("done");
        await p;
      });

      expect(result.current.status).toBe("success");
      expect(result.current.data).toBe("done");
      expect(result.current.error).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it("transitions to error and stores the error", async () => {
      const boom = new Error("boom");
      const { result } = renderHook(() =>
        useAsync(
          async () => {
            throw boom;
          },
          { immediate: false },
        ),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.status).toBe("error");
      expect(result.current.error).toBe(boom);
      expect(result.current.isLoading).toBe(false);
    });

    it("execute resolves with the value on success and undefined on error", async () => {
      const fn = vi
        .fn<(s: AbortSignal) => Promise<number>>()
        .mockResolvedValueOnce(42)
        .mockRejectedValueOnce(new Error("nope"));
      const { result } = renderHook(() => useAsync(fn, { immediate: false }));

      let ok: number | undefined;
      await act(async () => {
        ok = await result.current.execute();
      });
      expect(ok).toBe(42);

      let bad: unknown = "sentinel";
      await act(async () => {
        // Not wrapped in try/catch — a rejection here would fail the test.
        bad = await result.current.execute();
      });
      expect(bad).toBeUndefined();
    });

    it("forwards execute arguments to fn (after the signal)", async () => {
      const fn = vi.fn(
        async (_signal: AbortSignal, a: number, b: string) => `${a}-${b}`,
      );
      const { result } = renderHook(() => useAsync(fn, { immediate: false }));

      let value: string | undefined;
      await act(async () => {
        value = await result.current.execute(7, "x");
      });

      expect(fn).toHaveBeenCalledWith(expect.any(AbortSignal), 7, "x");
      expect(value).toBe("7-x");
      expect(result.current.data).toBe("7-x");
    });

    it("isLoading mirrors status === 'pending'", async () => {
      const d = deferred<void>();
      const { result } = renderHook(() =>
        useAsync(() => d.promise, { immediate: false }),
      );

      act(() => {
        void result.current.execute();
      });
      expect(result.current.isLoading).toBe(true);
      expect(result.current.status).toBe("pending");

      await act(async () => {
        d.resolve();
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.status).toBe("success");
    });

    it("retains the last successful data when a later run errors", async () => {
      const fn = vi
        .fn<(s: AbortSignal) => Promise<number>>()
        .mockResolvedValueOnce(100)
        .mockRejectedValueOnce(new Error("fail"));
      const { result } = renderHook(() => useAsync(fn, { immediate: false }));

      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.data).toBe(100);

      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.status).toBe("error");
      expect(result.current.data).toBe(100); // retained
    });

    it("clears a previous error when a new run starts", async () => {
      const d = deferred<string>();
      const fn = vi
        .fn<(s: AbortSignal) => Promise<string>>()
        .mockRejectedValueOnce(new Error("first"))
        .mockImplementationOnce(() => d.promise);
      const { result } = renderHook(() => useAsync(fn, { immediate: false }));

      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.error).toBeInstanceOf(Error);

      act(() => {
        void result.current.execute();
      });
      expect(result.current.status).toBe("pending");
      expect(result.current.error).toBeUndefined();

      await act(async () => {
        d.resolve("ok");
      });
      expect(result.current.status).toBe("success");
      expect(result.current.error).toBeUndefined();
    });
  });

  describe("AbortController cancellation", () => {
    it("passes a fresh, un-aborted AbortSignal to fn", async () => {
      let received: AbortSignal | undefined;
      const { result } = renderHook(() =>
        useAsync(
          async (signal: AbortSignal) => {
            received = signal;
            return "ok";
          },
          { immediate: false },
        ),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(received).toBeInstanceOf(AbortSignal);
      expect(received!.aborted).toBe(false);
    });

    it("aborts the previous in-flight request when a new execute starts", async () => {
      const signals: AbortSignal[] = [];
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      const fn = vi
        .fn<(s: AbortSignal) => Promise<string>>()
        .mockImplementationOnce((s) => {
          signals.push(s);
          return d1.promise;
        })
        .mockImplementationOnce((s) => {
          signals.push(s);
          return d2.promise;
        });
      const { result } = renderHook(() => useAsync(fn, { immediate: false }));

      act(() => {
        void result.current.execute();
      });
      act(() => {
        void result.current.execute();
      });

      expect(signals[0].aborted).toBe(true); // previous aborted
      expect(signals[1].aborted).toBe(false); // current still live

      await act(async () => {
        d2.resolve("second");
      });
      expect(result.current.data).toBe("second");
      d1.resolve("ignored"); // settle the aborted one to avoid dangling
    });

    it("stale-guards: a superseded slow call that ignores its signal does not win", async () => {
      const d1 = deferred<string>();
      const d2 = deferred<string>();
      const fn = vi
        .fn<(s: AbortSignal) => Promise<string>>()
        // Both implementations ignore the signal on purpose — proving the
        // call-id guard, not the abort, is what protects state here.
        .mockImplementationOnce(() => d1.promise)
        .mockImplementationOnce(() => d2.promise);
      const { result } = renderHook(() => useAsync(fn, { immediate: false }));

      let p1: Promise<string | undefined>;
      act(() => {
        p1 = result.current.execute();
      });
      act(() => {
        void result.current.execute();
      });

      // Newer (second) call resolves first and wins.
      await act(async () => {
        d2.resolve("second");
      });
      expect(result.current.data).toBe("second");

      // Older (first) call settles late — must be ignored despite resolving.
      await act(async () => {
        d1.resolve("first");
        await p1;
      });
      expect(result.current.data).toBe("second");
      expect(result.current.status).toBe("success");
    });

    it("does not surface an AbortError as state.error for the superseded call", async () => {
      const onError = vi.fn();
      const d2 = deferred<string>();
      const fn = vi
        .fn<(s: AbortSignal) => Promise<string>>()
        // First call rejects when aborted, mimicking fetch(signal).
        .mockImplementationOnce(
          (s) =>
            new Promise<string>((_res, rej) => {
              s.addEventListener("abort", () =>
                rej(new DOMException("Aborted", "AbortError")),
              );
            }),
        )
        .mockImplementationOnce(() => d2.promise);
      const { result } = renderHook(() =>
        useAsync(fn, { immediate: false, onError }),
      );

      let p1: Promise<string | undefined>;
      act(() => {
        p1 = result.current.execute();
      });
      act(() => {
        void result.current.execute(); // aborts call 1
      });

      await act(async () => {
        await p1; // the aborted call settles (rejects) here
      });
      // The aborted, superseded call must not become the error state.
      expect(result.current.status).not.toBe("error");
      expect(onError).not.toHaveBeenCalled();

      await act(async () => {
        d2.resolve("winner");
      });
      expect(result.current.status).toBe("success");
      expect(result.current.data).toBe("winner");
    });

    it("aborts the in-flight request on unmount", async () => {
      let signal: AbortSignal | undefined;
      const d = deferred<string>();
      const { result, unmount } = renderHook(() =>
        useAsync(
          (s: AbortSignal) => {
            signal = s;
            return d.promise;
          },
          { immediate: false },
        ),
      );

      act(() => {
        void result.current.execute();
      });
      expect(signal!.aborted).toBe(false);

      unmount();
      expect(signal!.aborted).toBe(true);
      d.resolve("late"); // no throw, no state update
    });
  });

  describe("reset", () => {
    it("returns state to idle (restoring initialData) and aborts in-flight", async () => {
      let signal: AbortSignal | undefined;
      const d = deferred<string>();
      const { result } = renderHook(() =>
        useAsync(
          (s: AbortSignal) => {
            signal = s;
            return d.promise;
          },
          { immediate: false, initialData: "seed" },
        ),
      );

      act(() => {
        void result.current.execute();
      });
      expect(result.current.status).toBe("pending");
      expect(signal!.aborted).toBe(false);

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe("idle");
      expect(result.current.data).toBe("seed");
      expect(result.current.error).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(signal!.aborted).toBe(true);
    });

    it("supersedes the in-flight call so its late resolution is ignored", async () => {
      const d = deferred<string>();
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useAsync(() => d.promise, { immediate: false, onSuccess }),
      );

      let p: Promise<string | undefined>;
      act(() => {
        p = result.current.execute();
      });
      act(() => {
        result.current.reset();
      });

      await act(async () => {
        d.resolve("late"); // ignores the signal, resolves anyway
        await p;
      });

      expect(result.current.status).toBe("idle");
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("immediate (auto-run)", () => {
    it("runs once on mount by default and reaches success", async () => {
      const fn = vi.fn(async () => "auto");
      const { result } = renderHook(() => useAsync(fn));

      // Effect has already fired synchronously after mount → pending.
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe("pending");

      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.status).toBe("success");
      expect(result.current.data).toBe("auto");
    });

    it("does not auto-run when immediate is false", () => {
      const fn = vi.fn(async () => "x");
      renderHook(() => useAsync(fn, { immediate: false }));
      expect(fn).not.toHaveBeenCalled();
    });

    it("passes options.args to the immediate run", async () => {
      const fn = vi.fn(async (_s: AbortSignal, id: number) => id * 2);
      const { result } = renderHook(() =>
        useAsync(fn, { immediate: true, args: [21] }),
      );

      await act(async () => {
        await Promise.resolve();
      });
      expect(fn).toHaveBeenCalledWith(expect.any(AbortSignal), 21);
      expect(result.current.data).toBe(42);
    });

    it("does NOT run during SSR (server render)", () => {
      const fn = vi.fn(async () => "server");
      function Probe() {
        useAsync(fn, { immediate: true });
        return createElement("div");
      }
      renderToStaticMarkup(createElement(Probe));
      // Effects never run on the server, so the auto-run must not fire.
      expect(fn).not.toHaveBeenCalled();
    });

    it("StrictMode double-mount: aborts the first run, second wins, state intact", async () => {
      const signals: AbortSignal[] = [];
      const fn = vi.fn(async (s: AbortSignal) => {
        signals.push(s);
        return "value";
      });
      const { result } = renderHook(() => useAsync(fn), {
        wrapper: StrictMode,
      });

      await act(async () => {
        await Promise.resolve();
      });

      // StrictMode invokes the mount effect twice → two runs.
      expect(fn).toHaveBeenCalledTimes(2);
      // The first run's controller was aborted by the interleaved cleanup.
      expect(signals[0].aborted).toBe(true);
      expect(signals[1].aborted).toBe(false);
      // State is coherent — success from the surviving run.
      expect(result.current.status).toBe("success");
      expect(result.current.data).toBe("value");
    });
  });

  describe("unmount safety", () => {
    it("does not update state or call onSuccess after unmount", async () => {
      const d = deferred<string>();
      const onSuccess = vi.fn();
      const { result, unmount } = renderHook(() =>
        useAsync(() => d.promise, { immediate: false, onSuccess }),
      );

      let p: Promise<string | undefined>;
      act(() => {
        p = result.current.execute();
      });
      const statusBefore = result.current.status;

      unmount();

      await act(async () => {
        d.resolve("late");
        await p;
      });

      expect(onSuccess).not.toHaveBeenCalled();
      expect(statusBefore).toBe("pending");
    });

    it("does not call onError after unmount", async () => {
      const d = deferred<string>();
      const onError = vi.fn();
      const { result, unmount } = renderHook(() =>
        useAsync(() => d.promise, { immediate: false, onError }),
      );

      let p: Promise<string | undefined>;
      act(() => {
        p = result.current.execute();
      });
      unmount();

      await act(async () => {
        d.reject(new Error("late"));
        await p;
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("callbacks", () => {
    it("calls onSuccess with the resolved data", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useAsync(async () => "hi", { immediate: false, onSuccess }),
      );
      await act(async () => {
        await result.current.execute();
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith("hi");
    });

    it("calls onError with the thrown error", async () => {
      const err = new Error("x");
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useAsync(
          async () => {
            throw err;
          },
          { immediate: false, onError },
        ),
      );
      await act(async () => {
        await result.current.execute();
      });
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(err);
    });

    it("reads the latest callbacks without recreating execute", async () => {
      const onSuccessA = vi.fn();
      const onSuccessB = vi.fn();
      const { result, rerender } = renderHook(
        ({ cb }) =>
          useAsync(async () => "v", { immediate: false, onSuccess: cb }),
        { initialProps: { cb: onSuccessA } },
      );
      const execute = result.current.execute;
      rerender({ cb: onSuccessB });
      expect(result.current.execute).toBe(execute); // stable

      await act(async () => {
        await result.current.execute();
      });
      expect(onSuccessA).not.toHaveBeenCalled();
      expect(onSuccessB).toHaveBeenCalledWith("v");
    });
  });

  describe("stability", () => {
    it("keeps execute and reset referentially stable across rerenders", () => {
      const { result, rerender } = renderHook(() =>
        useAsync(async () => 1, { immediate: false }),
      );
      const { execute, reset } = result.current;
      rerender();
      expect(result.current.execute).toBe(execute);
      expect(result.current.reset).toBe(reset);
    });

    it("uses the latest inline fn without changing execute identity", async () => {
      const fn1 = vi.fn(async () => "a");
      const fn2 = vi.fn(async () => "b");
      const { result, rerender } = renderHook(
        ({ fn }) => useAsync(fn, { immediate: false }),
        { initialProps: { fn: fn1 } },
      );
      const execute = result.current.execute;
      rerender({ fn: fn2 });
      expect(result.current.execute).toBe(execute);

      let value: string | undefined;
      await act(async () => {
        value = await result.current.execute();
      });
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn1).not.toHaveBeenCalled();
      expect(value).toBe("b");
      expect(result.current.data).toBe("b");
    });
  });
});
