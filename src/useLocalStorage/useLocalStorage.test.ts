import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
};

const localStorageMock = createLocalStorageMock();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Helper to create and dispatch storage event (jsdom compatible)
function dispatchStorageEvent(key: string, newValue: string | null) {
  const event = new StorageEvent("storage", {
    key,
    newValue,
    oldValue: null,
    url: window.location.href,
  });
  window.dispatchEvent(event);
}

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should return initial value when localStorage is empty", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "defaultValue")
      );

      expect(result.current[0]).toBe("defaultValue");
    });

    it("should return stored value when localStorage has data", () => {
      localStorageMock.setItem("testKey", JSON.stringify("storedValue"));

      const { result } = renderHook(() =>
        useLocalStorage("testKey", "defaultValue")
      );

      expect(result.current[0]).toBe("storedValue");
    });

    it("should support lazy initialization with function", () => {
      const initializer = vi.fn(() => "lazyValue");

      const { result } = renderHook(() =>
        useLocalStorage("testKey", initializer)
      );

      expect(result.current[0]).toBe("lazyValue");
      // May be called more than once due to React StrictMode or effects
      expect(initializer).toHaveBeenCalled();
    });

    it("should not call initializer function when localStorage has data", () => {
      localStorageMock.setItem("testKey", JSON.stringify("storedValue"));
      const initializer = vi.fn(() => "lazyValue");

      const { result } = renderHook(() =>
        useLocalStorage("testKey", initializer)
      );

      expect(result.current[0]).toBe("storedValue");
      expect(initializer).not.toHaveBeenCalled();
    });

    it("should fallback to initial value when JSON parse fails", () => {
      localStorageMock.setItem("testKey", "invalid json {{{");

      const { result } = renderHook(() =>
        useLocalStorage("testKey", "fallbackValue")
      );

      expect(result.current[0]).toBe("fallbackValue");
    });

    it("should call onError when localStorage read fails", () => {
      localStorageMock.setItem("testKey", "invalid json");
      const onError = vi.fn();

      renderHook(() =>
        useLocalStorage("testKey", "default", { onError })
      );

      expect(onError).toHaveBeenCalled();
    });

    it("should return all required functions", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "value")
      );

      expect(result.current).toHaveLength(3);
      expect(typeof result.current[0]).toBe("string");
      expect(typeof result.current[1]).toBe("function");
      expect(typeof result.current[2]).toBe("function");
    });
  });

  describe("setValue", () => {
    it("should update value and localStorage", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      act(() => {
        result.current[1]("newValue");
      });

      expect(result.current[0]).toBe("newValue");
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "testKey",
        JSON.stringify("newValue")
      );
    });

    it("should support functional updates", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", 10)
      );

      act(() => {
        result.current[1]((prev) => prev + 5);
      });

      expect(result.current[0]).toBe(15);
    });

    it("should handle object values", () => {
      interface User {
        name: string;
        age: number;
      }

      const { result } = renderHook(() =>
        useLocalStorage<User>("user", { name: "John", age: 25 })
      );

      act(() => {
        result.current[1]((prev) => ({ ...prev, age: 26 }));
      });

      expect(result.current[0]).toEqual({ name: "John", age: 26 });
    });

    it("should handle array values", () => {
      const { result } = renderHook(() =>
        useLocalStorage<string[]>("items", ["a", "b"])
      );

      act(() => {
        result.current[1]((prev) => [...prev, "c"]);
      });

      expect(result.current[0]).toEqual(["a", "b", "c"]);
    });

    it("should call onError when localStorage write fails", () => {
      const onError = vi.fn();
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      const { result } = renderHook(() =>
        useLocalStorage("testKey", "initial", { onError })
      );

      act(() => {
        result.current[1]("newValue");
      });

      expect(onError).toHaveBeenCalled();
    });
  });

  describe("removeValue", () => {
    it("should reset to initial value and remove from localStorage", () => {
      localStorageMock.setItem("testKey", JSON.stringify("storedValue"));

      const { result } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      expect(result.current[0]).toBe("storedValue");

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe("initial");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("testKey");
    });

    it("should use lazy initializer on remove", () => {
      const initializer = vi.fn(() => "lazyInitial");
      localStorageMock.setItem("testKey", JSON.stringify("stored"));

      const { result } = renderHook(() =>
        useLocalStorage("testKey", initializer)
      );

      act(() => {
        result.current[2]();
      });

      // Initializer called once on remove (not on init since localStorage had value)
      expect(initializer).toHaveBeenCalledTimes(1);
      expect(result.current[0]).toBe("lazyInitial");
    });
  });

  describe("type preservation", () => {
    it("should preserve string type", () => {
      const { result } = renderHook(() =>
        useLocalStorage("key", "hello")
      );

      expect(typeof result.current[0]).toBe("string");
    });

    it("should preserve number type", () => {
      const { result } = renderHook(() =>
        useLocalStorage("key", 42)
      );

      expect(typeof result.current[0]).toBe("number");
    });

    it("should preserve boolean type", () => {
      const { result } = renderHook(() =>
        useLocalStorage("key", true)
      );

      expect(typeof result.current[0]).toBe("boolean");
    });

    it("should preserve null", () => {
      const { result } = renderHook(() =>
        useLocalStorage<string | null>("key", null)
      );

      expect(result.current[0]).toBeNull();
    });

    it("should preserve object structure", () => {
      const initialObj = {
        nested: {
          value: 123,
          array: [1, 2, 3],
        },
        flag: true,
      };

      const { result } = renderHook(() =>
        useLocalStorage("key", initialObj)
      );

      expect(result.current[0]).toEqual(initialObj);
    });
  });

  describe("custom serializer/deserializer", () => {
    it("should use custom serializer", () => {
      const serializer = vi.fn((value: Date) => value.toISOString());
      const date = new Date("2024-01-01");

      const { result } = renderHook(() =>
        useLocalStorage("date", date, {
          serializer,
          deserializer: (s) => new Date(s),
        })
      );

      act(() => {
        result.current[1](new Date("2024-06-15"));
      });

      expect(serializer).toHaveBeenCalled();
    });

    it("should use custom deserializer", () => {
      const dateString = "2024-01-01T00:00:00.000Z";
      localStorageMock.setItem("date", dateString);

      const deserializer = vi.fn((s: string) => new Date(s));

      const { result } = renderHook(() =>
        useLocalStorage("date", new Date(), {
          serializer: (d) => d.toISOString(),
          deserializer,
        })
      );

      expect(deserializer).toHaveBeenCalledWith(dateString);
      expect(result.current[0]).toBeInstanceOf(Date);
    });
  });

  describe("cross-tab synchronization", () => {
    it("should update value when storage event is fired", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      act(() => {
        dispatchStorageEvent("testKey", JSON.stringify("updatedFromOtherTab"));
      });

      expect(result.current[0]).toBe("updatedFromOtherTab");
    });

    it("should reset to initial when key is removed in another tab", () => {
      localStorageMock.setItem("testKey", JSON.stringify("stored"));

      const { result } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      expect(result.current[0]).toBe("stored");

      act(() => {
        dispatchStorageEvent("testKey", null);
      });

      expect(result.current[0]).toBe("initial");
    });

    it("should ignore storage events for different keys", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      act(() => {
        dispatchStorageEvent("differentKey", JSON.stringify("otherValue"));
      });

      expect(result.current[0]).toBe("initial");
    });

    it("should not sync when syncTabs is false", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "initial", { syncTabs: false })
      );

      act(() => {
        dispatchStorageEvent("testKey", JSON.stringify("updated"));
      });

      expect(result.current[0]).toBe("initial");
    });

    it("should fallback to initial value when storage event has invalid JSON", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "fallback")
      );

      act(() => {
        result.current[1]("validValue");
      });

      expect(result.current[0]).toBe("validValue");

      act(() => {
        dispatchStorageEvent("testKey", "invalid json {{{");
      });

      expect(result.current[0]).toBe("fallback");
    });
  });

  describe("key changes", () => {
    it("should read new key value when key changes", () => {
      localStorageMock.setItem("key1", JSON.stringify("value1"));
      localStorageMock.setItem("key2", JSON.stringify("value2"));

      const { result, rerender } = renderHook(
        ({ storageKey }) => useLocalStorage(storageKey, "default"),
        { initialProps: { storageKey: "key1" } }
      );

      expect(result.current[0]).toBe("value1");

      rerender({ storageKey: "key2" });

      expect(result.current[0]).toBe("value2");
    });

    it("should use initial value when new key has no stored value", () => {
      localStorageMock.setItem("key1", JSON.stringify("value1"));

      const { result, rerender } = renderHook(
        ({ storageKey }) => useLocalStorage(storageKey, "default"),
        { initialProps: { storageKey: "key1" } }
      );

      expect(result.current[0]).toBe("value1");

      rerender({ storageKey: "newKey" });

      expect(result.current[0]).toBe("default");
    });
  });

  describe("function reference stability", () => {
    it("should maintain stable setValue reference across renders", () => {
      const { result, rerender } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      const initialSetValue = result.current[1];

      act(() => {
        result.current[1]("newValue");
      });

      rerender();

      expect(result.current[1]).toBe(initialSetValue);
    });

    it("should maintain stable removeValue reference across renders", () => {
      const { result, rerender } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      const initialRemoveValue = result.current[2];

      act(() => {
        result.current[1]("newValue");
      });

      rerender();

      expect(result.current[2]).toBe(initialRemoveValue);
    });

    it("should create new setValue reference when key changes", () => {
      const { result, rerender } = renderHook(
        ({ storageKey }) => useLocalStorage(storageKey, "default"),
        { initialProps: { storageKey: "key1" } }
      );

      const initialSetValue = result.current[1];

      rerender({ storageKey: "key2" });

      expect(result.current[1]).not.toBe(initialSetValue);
    });
  });

  describe("multiple instances", () => {
    it("should maintain separate state for different keys", () => {
      const { result: result1 } = renderHook(() =>
        useLocalStorage("key1", "default1")
      );
      const { result: result2 } = renderHook(() =>
        useLocalStorage("key2", "default2")
      );

      act(() => {
        result1.current[1]("value1");
      });

      expect(result1.current[0]).toBe("value1");
      expect(result2.current[0]).toBe("default2");
    });

    it("should sync instances with same key via storage event", () => {
      const { result: result1 } = renderHook(() =>
        useLocalStorage("sharedKey", "default")
      );
      const { result: result2 } = renderHook(() =>
        useLocalStorage("sharedKey", "default")
      );

      // Simulate storage event (as if update came from another tab)
      act(() => {
        dispatchStorageEvent("sharedKey", JSON.stringify("synced"));
      });

      expect(result1.current[0]).toBe("synced");
      expect(result2.current[0]).toBe("synced");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string as value", () => {
      const { result } = renderHook(() =>
        useLocalStorage("key", "default")
      );

      act(() => {
        result.current[1]("");
      });

      expect(result.current[0]).toBe("");
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "key",
        JSON.stringify("")
      );
    });

    it("should handle 0 as value", () => {
      const { result } = renderHook(() =>
        useLocalStorage("key", 100)
      );

      act(() => {
        result.current[1](0);
      });

      expect(result.current[0]).toBe(0);
    });

    it("should handle false as value", () => {
      const { result } = renderHook(() =>
        useLocalStorage("key", true)
      );

      act(() => {
        result.current[1](false);
      });

      expect(result.current[0]).toBe(false);
    });

    it("should handle undefined in object", () => {
      interface Config {
        value?: string;
      }

      const { result } = renderHook(() =>
        useLocalStorage<Config>("key", { value: "initial" })
      );

      act(() => {
        result.current[1]({ value: undefined });
      });

      // Note: JSON.stringify removes undefined values
      expect(result.current[0]).toEqual({});
    });

    it("should handle rapid successive updates", () => {
      const { result } = renderHook(() =>
        useLocalStorage("key", 0)
      );

      act(() => {
        result.current[1](1);
        result.current[1](2);
        result.current[1](3);
        result.current[1](4);
        result.current[1](5);
      });

      expect(result.current[0]).toBe(5);
    });

    it("should handle setting same value multiple times", () => {
      const { result } = renderHook(() =>
        useLocalStorage("key", "value")
      );

      act(() => {
        result.current[1]("same");
        result.current[1]("same");
        result.current[1]("same");
      });

      expect(result.current[0]).toBe("same");
    });
  });

  describe("cleanup", () => {
    it("should remove storage event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "storage",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
