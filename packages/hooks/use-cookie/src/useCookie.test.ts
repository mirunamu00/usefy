import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useCookie } from "./useCookie";
import { clearAllListeners, getListenerCount } from "./store";
import {
  parseCookie,
  buildCookieString,
  buildRemovalCookieString,
  defaultSerializer,
  defaultDeserializer,
  isDocumentAvailable,
  readRawCookie,
} from "./utils";

/** Remove every cookie currently in the jsdom cookie jar. */
function clearAllCookies() {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const pair of cookies) {
    const name = pair.split("=")[0];
    document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=-1; Path=/`;
  }
}

describe("utils", () => {
  describe("parseCookie", () => {
    it("returns undefined for an empty cookie string", () => {
      expect(parseCookie("", "key")).toBeUndefined();
    });

    it("returns undefined when the key is absent", () => {
      expect(parseCookie("a=1; b=2", "c")).toBeUndefined();
    });

    it("reads and decodes a value", () => {
      expect(parseCookie("theme=dark", "theme")).toBe("dark");
    });

    it("decodes URL-encoded values", () => {
      expect(parseCookie("k=a%3Db%3B%20c", "k")).toBe("a=b; c");
    });

    it("decodes URL-encoded keys", () => {
      expect(parseCookie("my%20key=v", "my key")).toBe("v");
    });

    it("handles a valueless cookie", () => {
      expect(parseCookie("flag", "flag")).toBe("");
    });

    it("falls back to raw value when decode fails", () => {
      // A lone '%' is invalid percent-encoding.
      expect(parseCookie("k=%", "k")).toBe("%");
    });
  });

  describe("buildCookieString", () => {
    it("encodes name and value", () => {
      expect(buildCookieString("my key", "a=b", {})).toContain(
        "my%20key=a%3Db"
      );
    });

    it("defaults Path to /", () => {
      expect(buildCookieString("k", "v")).toBe("k=v; Path=/");
    });

    it("serializes Max-Age", () => {
      expect(buildCookieString("k", "v", { maxAge: 3600 })).toContain(
        "Max-Age=3600"
      );
    });

    it("serializes expires as a number of days", () => {
      const str = buildCookieString("k", "v", { expires: 7 });
      expect(str).toContain("Expires=");
      // 7 days ahead should be a valid future date string.
      const expiresPart = str.split("Expires=")[1].split(";")[0];
      expect(new Date(expiresPart).getTime()).toBeGreaterThan(Date.now());
    });

    it("serializes expires as a Date", () => {
      const date = new Date("2030-01-01T00:00:00Z");
      expect(buildCookieString("k", "v", { expires: date })).toContain(
        `Expires=${date.toUTCString()}`
      );
    });

    it("serializes domain, secure and sameSite", () => {
      const str = buildCookieString("k", "v", {
        domain: ".example.com",
        secure: true,
        sameSite: "lax",
      });
      expect(str).toContain("Domain=.example.com");
      expect(str).toContain("; Secure");
      expect(str).toContain("SameSite=Lax");
    });

    it("capitalizes each SameSite value", () => {
      expect(buildCookieString("k", "v", { sameSite: "strict" })).toContain(
        "SameSite=Strict"
      );
      expect(buildCookieString("k", "v", { sameSite: "none" })).toContain(
        "SameSite=None"
      );
    });

    it("omits Path when explicitly empty", () => {
      expect(buildCookieString("k", "v", { path: "" })).toBe("k=v");
    });
  });

  describe("buildRemovalCookieString", () => {
    it("builds an expired cookie assignment with Path", () => {
      const str = buildRemovalCookieString("k");
      expect(str).toContain("k=;");
      expect(str).toContain("Max-Age=-1");
      expect(str).toContain("Expires=Thu, 01 Jan 1970");
      expect(str).toContain("Path=/");
    });

    it("preserves domain and a custom path", () => {
      const str = buildRemovalCookieString("k", {
        path: "/app",
        domain: ".example.com",
      });
      expect(str).toContain("Path=/app");
      expect(str).toContain("Domain=.example.com");
    });
  });

  describe("default (de)serialization", () => {
    it("serializes with JSON.stringify", () => {
      expect(defaultSerializer({ a: 1 })).toBe('{"a":1}');
      expect(defaultSerializer("hi")).toBe('"hi"');
    });

    it("deserializes valid JSON", () => {
      expect(defaultDeserializer('{"a":1}')).toEqual({ a: 1 });
    });

    it("falls back to the raw string for non-JSON", () => {
      expect(defaultDeserializer("plain-string")).toBe("plain-string");
    });
  });

  describe("SSR guards", () => {
    it("isDocumentAvailable is true in jsdom", () => {
      expect(isDocumentAvailable()).toBe(true);
    });

    it("readRawCookie returns undefined when document is unavailable", () => {
      vi.stubGlobal("document", undefined);
      expect(isDocumentAvailable()).toBe(false);
      expect(readRawCookie("anything")).toBeUndefined();
      vi.unstubAllGlobals();
    });
  });
});

describe("useCookie", () => {
  beforeEach(() => {
    clearAllCookies();
    clearAllListeners();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearAllCookies();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("initialization", () => {
    it("returns initialValue when the cookie is absent", () => {
      const { result } = renderHook(() =>
        useCookie("missing", { initialValue: "default" })
      );
      expect(result.current[0]).toBe("default");
    });

    it("returns undefined when absent and no initialValue is given", () => {
      const { result } = renderHook(() => useCookie("missing"));
      expect(result.current[0]).toBeUndefined();
    });

    it("reads an existing plain (non-JSON) cookie without throwing", () => {
      document.cookie = "existing=hello";
      const { result } = renderHook(() =>
        useCookie("existing", { initialValue: "fallback" })
      );
      expect(result.current[0]).toBe("hello");
    });

    it("reads an existing JSON cookie", () => {
      document.cookie = `user=${encodeURIComponent('{"name":"Ada"}')}`;
      const { result } = renderHook(() =>
        useCookie<{ name: string }>("user")
      );
      expect(result.current[0]).toEqual({ name: "Ada" });
    });

    it("supports lazy initialization", () => {
      const init = vi.fn(() => "lazy");
      const { result } = renderHook(() =>
        useCookie("missing", { initialValue: init })
      );
      expect(result.current[0]).toBe("lazy");
      expect(init).toHaveBeenCalled();
    });

    it("returns a 3-tuple", () => {
      const { result } = renderHook(() =>
        useCookie("k", { initialValue: "v" })
      );
      expect(result.current).toHaveLength(3);
      expect(typeof result.current[1]).toBe("function");
      expect(typeof result.current[2]).toBe("function");
    });
  });

  describe("setValue", () => {
    it("writes the cookie and updates state", () => {
      const { result } = renderHook(() =>
        useCookie("theme", { initialValue: "light" })
      );

      act(() => {
        result.current[1]("dark");
      });

      expect(result.current[0]).toBe("dark");
      // JSON-serialized "dark" is the string with quotes, URL-encoded.
      expect(document.cookie).toContain(
        `theme=${encodeURIComponent(JSON.stringify("dark"))}`
      );
    });

    it("supports functional updates", () => {
      const { result } = renderHook(() =>
        useCookie<number>("count", { initialValue: 10 })
      );

      act(() => {
        result.current[1]((prev) => (prev ?? 0) + 5);
      });

      expect(result.current[0]).toBe(15);
    });

    it("round-trips an object via JSON", () => {
      interface Prefs {
        lang: string;
        compact: boolean;
      }
      const { result } = renderHook(() =>
        useCookie<Prefs>("prefs", {
          initialValue: { lang: "en", compact: false },
        })
      );

      act(() => {
        result.current[1]((prev) => ({ ...prev!, compact: true }));
      });

      expect(result.current[0]).toEqual({ lang: "en", compact: true });
      expect(document.cookie).toContain(
        `prefs=${encodeURIComponent(JSON.stringify({ lang: "en", compact: true }))}`
      );
    });

    it("encodes special characters (=, ;, spaces) safely", () => {
      const { result } = renderHook(() =>
        useCookie<string>("raw", {
          // Store the raw string as-is so we can assert exact encoding.
          serializer: (v) => v,
          deserializer: (v) => v,
        })
      );

      const tricky = "a=b; c d&e";
      act(() => {
        result.current[1](tricky);
      });

      // The value round-trips through state...
      expect(result.current[0]).toBe(tricky);
      // ...and is percent-encoded in document.cookie (no bare ';' splitting it).
      expect(document.cookie).toContain(`raw=${encodeURIComponent(tricky)}`);
    });

    it("invokes onError and falls back when the deserializer throws on read", () => {
      document.cookie = "bad=whatever";
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCookie("bad", {
          initialValue: "fallback",
          deserializer: () => {
            throw new Error("parse fail");
          },
          onError,
        })
      );

      expect(onError).toHaveBeenCalled();
      expect(result.current[0]).toBe("fallback");
    });

    it("invokes onError when the serializer throws", () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCookie("k", {
          initialValue: "v",
          serializer: () => {
            throw new Error("boom");
          },
          onError,
        })
      );

      act(() => {
        result.current[1]("next");
      });

      expect(onError).toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("deletes the cookie and resets state to initialValue", () => {
      document.cookie = "session=abc123";
      const { result } = renderHook(() =>
        useCookie("session", { initialValue: "none" })
      );

      expect(result.current[0]).toBe("abc123");

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe("none");
      expect(parseCookie(document.cookie, "session")).toBeUndefined();
    });

    it("invokes onError when writing the removal cookie throws", () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCookie("k", { initialValue: "v", onError })
      );

      const spy = vi.spyOn(document, "cookie", "set").mockImplementation(() => {
        throw new Error("cookie write blocked");
      });

      act(() => {
        result.current[2]();
      });

      expect(onError).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("resets to undefined when no initialValue is given", () => {
      const { result } = renderHook(() => useCookie("k"));

      act(() => {
        result.current[1]("value");
      });
      expect(result.current[0]).toBe("value");

      act(() => {
        result.current[2]();
      });
      expect(result.current[0]).toBeUndefined();
    });
  });

  describe("same-document synchronization", () => {
    it("syncs a second instance when the first sets a value", () => {
      const { result: a } = renderHook(() =>
        useCookie("shared", { initialValue: "x" })
      );
      const { result: b } = renderHook(() =>
        useCookie("shared", { initialValue: "x" })
      );

      act(() => {
        a.current[1]("updated");
      });

      expect(a.current[0]).toBe("updated");
      expect(b.current[0]).toBe("updated");
    });

    it("syncs a second instance when the first removes the cookie", () => {
      document.cookie = "shared=stored";
      const { result: a } = renderHook(() =>
        useCookie("shared", { initialValue: "def" })
      );
      const { result: b } = renderHook(() =>
        useCookie("shared", { initialValue: "def" })
      );

      expect(b.current[0]).toBe("stored");

      act(() => {
        a.current[2]();
      });

      expect(a.current[0]).toBe("def");
      expect(b.current[0]).toBe("def");
    });

    it("does not affect instances with a different key", () => {
      const { result: a } = renderHook(() =>
        useCookie("keyA", { initialValue: "a" })
      );
      const { result: b } = renderHook(() =>
        useCookie("keyB", { initialValue: "b" })
      );

      act(() => {
        a.current[1]("changed");
      });

      expect(a.current[0]).toBe("changed");
      expect(b.current[0]).toBe("b");
    });

    it("cleans up listeners on unmount", () => {
      const { unmount: unmountA } = renderHook(() =>
        useCookie("cleanup", { initialValue: "x" })
      );
      renderHook(() => useCookie("cleanup", { initialValue: "x" }));

      expect(getListenerCount("cleanup")).toBe(2);
      unmountA();
      expect(getListenerCount("cleanup")).toBe(1);
    });
  });

  describe("reference stability", () => {
    it("keeps setValue and remove stable across renders", () => {
      const { result, rerender } = renderHook(() =>
        useCookie("k", { initialValue: "v" })
      );

      const setValue = result.current[1];
      const remove = result.current[2];

      act(() => {
        result.current[1]("next");
      });
      rerender();

      expect(result.current[1]).toBe(setValue);
      expect(result.current[2]).toBe(remove);
    });

    it("creates a new setValue when the key changes", () => {
      const { result, rerender } = renderHook(
        ({ k }) => useCookie(k, { initialValue: "v" }),
        { initialProps: { k: "k1" } }
      );

      const first = result.current[1];
      rerender({ k: "k2" });
      expect(result.current[1]).not.toBe(first);
    });

    it("reads the new key's value when the key changes", () => {
      document.cookie = "k1=one";
      document.cookie = "k2=two";

      const { result, rerender } = renderHook(
        ({ k }) => useCookie(k, { initialValue: "def" }),
        { initialProps: { k: "k1" } }
      );

      expect(result.current[0]).toBe("one");
      rerender({ k: "k2" });
      expect(result.current[0]).toBe("two");
    });
  });

  describe("cookie attributes", () => {
    it("passes write attributes through to document.cookie", () => {
      const spy = vi.spyOn(document, "cookie", "set");
      const { result } = renderHook(() =>
        useCookie("attr", {
          initialValue: "v",
          maxAge: 3600,
          path: "/app",
          sameSite: "strict",
          secure: true,
        })
      );

      act(() => {
        result.current[1]("value");
      });

      const written = spy.mock.calls[0][0];
      expect(written).toContain("Max-Age=3600");
      expect(written).toContain("Path=/app");
      expect(written).toContain("SameSite=Strict");
      expect(written).toContain("; Secure");
      spy.mockRestore();
    });
  });

  describe("SSR safety", () => {
    it("setValue is a no-op (no throw) when document is unavailable", () => {
      const { result } = renderHook(() =>
        useCookie("k", { initialValue: "v" })
      );

      vi.stubGlobal("document", undefined);
      expect(() => {
        act(() => {
          result.current[1]("new");
        });
      }).not.toThrow();
      vi.unstubAllGlobals();
    });

    it("remove is a no-op (no throw) when document is unavailable", () => {
      const { result } = renderHook(() =>
        useCookie("k", { initialValue: "v" })
      );

      vi.stubGlobal("document", undefined);
      expect(() => {
        act(() => {
          result.current[2]();
        });
      }).not.toThrow();
      vi.unstubAllGlobals();
    });
  });
});
