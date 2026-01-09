import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useToggle } from "./useToggle";

describe("useToggle", () => {
  describe("initialization", () => {
    it("should initialize with default value of false", () => {
      const { result } = renderHook(() => useToggle());
      expect(result.current.value).toBe(false);
    });

    it("should initialize with provided initial value of true", () => {
      const { result } = renderHook(() => useToggle(true));
      expect(result.current.value).toBe(true);
    });

    it("should initialize with provided initial value of false", () => {
      const { result } = renderHook(() => useToggle(false));
      expect(result.current.value).toBe(false);
    });

    it("should return all required functions on initialization", () => {
      const { result } = renderHook(() => useToggle());

      expect(result.current).toHaveProperty("value");
      expect(result.current).toHaveProperty("toggle");
      expect(result.current).toHaveProperty("setTrue");
      expect(result.current).toHaveProperty("setFalse");
      expect(result.current).toHaveProperty("setValue");

      expect(typeof result.current.toggle).toBe("function");
      expect(typeof result.current.setTrue).toBe("function");
      expect(typeof result.current.setFalse).toBe("function");
      expect(typeof result.current.setValue).toBe("function");
    });
  });

  describe("toggle", () => {
    it("should toggle from false to true", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.value).toBe(true);
    });

    it("should toggle from true to false", () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.value).toBe(false);
    });

    it("should handle multiple toggles", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.toggle();
      });
      expect(result.current.value).toBe(true);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.value).toBe(false);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.value).toBe(true);
    });

    it("should toggle from default state", () => {
      const { result } = renderHook(() => useToggle());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.value).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.value).toBe(false);
    });

    it("should handle rapid successive toggles", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.toggle();
        result.current.toggle();
        result.current.toggle();
        result.current.toggle();
      });

      expect(result.current.value).toBe(false);
    });
  });

  describe("setTrue", () => {
    it("should set value to true from false", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.setTrue();
      });

      expect(result.current.value).toBe(true);
    });

    it("should maintain true when already true", () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current.setTrue();
      });

      expect(result.current.value).toBe(true);
    });

    it("should set value to true from default state", () => {
      const { result } = renderHook(() => useToggle());

      act(() => {
        result.current.setTrue();
      });

      expect(result.current.value).toBe(true);
    });

    it("should handle multiple setTrue calls", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.setTrue();
        result.current.setTrue();
        result.current.setTrue();
      });

      expect(result.current.value).toBe(true);
    });

    it("should set true after toggle", () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current.toggle();
      });
      expect(result.current.value).toBe(false);

      act(() => {
        result.current.setTrue();
      });
      expect(result.current.value).toBe(true);
    });
  });

  describe("setFalse", () => {
    it("should set value to false from true", () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current.setFalse();
      });

      expect(result.current.value).toBe(false);
    });

    it("should maintain false when already false", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.setFalse();
      });

      expect(result.current.value).toBe(false);
    });

    it("should set value to false from default state", () => {
      const { result } = renderHook(() => useToggle());

      act(() => {
        result.current.setFalse();
      });

      expect(result.current.value).toBe(false);
    });

    it("should handle multiple setFalse calls", () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current.setFalse();
        result.current.setFalse();
        result.current.setFalse();
      });

      expect(result.current.value).toBe(false);
    });

    it("should set false after toggle", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.toggle();
      });
      expect(result.current.value).toBe(true);

      act(() => {
        result.current.setFalse();
      });
      expect(result.current.value).toBe(false);
    });
  });

  describe("setValue", () => {
    it("should set value to true", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.setValue(true);
      });

      expect(result.current.value).toBe(true);
    });

    it("should set value to false", () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current.setValue(false);
      });

      expect(result.current.value).toBe(false);
    });

    it("should set value to true from default state", () => {
      const { result } = renderHook(() => useToggle());

      act(() => {
        result.current.setValue(true);
      });

      expect(result.current.value).toBe(true);
    });

    it("should set value to false from default state", () => {
      const { result } = renderHook(() => useToggle());

      act(() => {
        result.current.setValue(false);
      });

      expect(result.current.value).toBe(false);
    });

    it("should handle setting same value multiple times", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.setValue(true);
        result.current.setValue(true);
        result.current.setValue(true);
      });

      expect(result.current.value).toBe(true);
    });

    it("should handle alternating setValue calls", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.setValue(true);
      });
      expect(result.current.value).toBe(true);

      act(() => {
        result.current.setValue(false);
      });
      expect(result.current.value).toBe(false);

      act(() => {
        result.current.setValue(true);
      });
      expect(result.current.value).toBe(true);
    });
  });

  describe("complex scenarios", () => {
    it("should handle mixed operations in sequence", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.setTrue();
      });
      expect(result.current.value).toBe(true);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.value).toBe(false);

      act(() => {
        result.current.setValue(true);
      });
      expect(result.current.value).toBe(true);

      act(() => {
        result.current.setFalse();
      });
      expect(result.current.value).toBe(false);
    });

    it("should handle operations starting from true", () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current.toggle();
      });
      expect(result.current.value).toBe(false);

      act(() => {
        result.current.setTrue();
      });
      expect(result.current.value).toBe(true);

      act(() => {
        result.current.setValue(false);
      });
      expect(result.current.value).toBe(false);
    });

    it("should maintain value stability with no operations", () => {
      const { result } = renderHook(() => useToggle(true));

      expect(result.current.value).toBe(true);
      expect(result.current.value).toBe(true);
      expect(result.current.value).toBe(true);
    });

    it("should handle toggle after setTrue", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.setTrue();
        result.current.toggle();
      });

      expect(result.current.value).toBe(false);
    });

    it("should handle toggle after setFalse", () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current.setFalse();
        result.current.toggle();
      });

      expect(result.current.value).toBe(true);
    });

    it("should handle all operations in single act", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.toggle();
        result.current.setFalse();
        result.current.setTrue();
        result.current.setValue(false);
        result.current.toggle();
      });

      expect(result.current.value).toBe(true);
    });

    it("should maintain separate state across multiple hook instances", () => {
      const { result: result1 } = renderHook(() => useToggle(false));
      const { result: result2 } = renderHook(() => useToggle(true));

      act(() => {
        result1.current.setTrue();
        result2.current.setFalse();
      });

      expect(result1.current.value).toBe(true);
      expect(result2.current.value).toBe(false);
    });

    it("should handle independent operations on multiple instances", () => {
      const { result: result1 } = renderHook(() => useToggle());
      const { result: result2 } = renderHook(() => useToggle());

      act(() => {
        result1.current.toggle();
      });

      expect(result1.current.value).toBe(true);
      expect(result2.current.value).toBe(false);

      act(() => {
        result2.current.setTrue();
      });

      expect(result1.current.value).toBe(true);
      expect(result2.current.value).toBe(true);
    });
  });

  describe("function references", () => {
    it("should maintain stable toggle reference across renders", () => {
      const { result, rerender } = renderHook(() => useToggle(false));

      const initialToggle = result.current.toggle;

      act(() => {
        result.current.toggle();
      });

      rerender();

      expect(result.current.toggle).toBe(initialToggle);
    });

    it("should maintain stable setTrue reference across renders", () => {
      const { result, rerender } = renderHook(() => useToggle(false));

      const initialSetTrue = result.current.setTrue;

      act(() => {
        result.current.setTrue();
      });

      rerender();

      expect(result.current.setTrue).toBe(initialSetTrue);
    });

    it("should maintain stable setFalse reference across renders", () => {
      const { result, rerender } = renderHook(() => useToggle(true));

      const initialSetFalse = result.current.setFalse;

      act(() => {
        result.current.setFalse();
      });

      rerender();

      expect(result.current.setFalse).toBe(initialSetFalse);
    });

    it("should maintain stable setValue reference across renders", () => {
      const { result, rerender } = renderHook(() => useToggle(false));

      const initialSetValue = result.current.setValue;

      act(() => {
        result.current.setValue(true);
      });

      rerender();

      expect(result.current.setValue).toBe(initialSetValue);
    });

    it("should maintain all function references after multiple operations", () => {
      const { result, rerender } = renderHook(() => useToggle(false));

      const initialToggle = result.current.toggle;
      const initialSetTrue = result.current.setTrue;
      const initialSetFalse = result.current.setFalse;
      const initialSetValue = result.current.setValue;

      act(() => {
        result.current.toggle();
        result.current.setTrue();
        result.current.setFalse();
        result.current.setValue(true);
      });

      rerender();

      expect(result.current.toggle).toBe(initialToggle);
      expect(result.current.setTrue).toBe(initialSetTrue);
      expect(result.current.setFalse).toBe(initialSetFalse);
      expect(result.current.setValue).toBe(initialSetValue);
    });
  });

  describe("edge cases", () => {
    it("should handle operations on unmounted hook gracefully", () => {
      const { result, unmount } = renderHook(() => useToggle(false));

      const toggle = result.current.toggle;
      unmount();

      expect(() => toggle()).not.toThrow();
    });

    it("should work correctly after reinitialization", () => {
      const { result, rerender } = renderHook(
        ({ initialValue }) => useToggle(initialValue),
        { initialProps: { initialValue: false } }
      );

      act(() => {
        result.current.toggle();
      });

      expect(result.current.value).toBe(true);

      rerender({ initialValue: false });

      expect(result.current.value).toBe(true);
    });

    it("should handle setValue with current value", () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current.setValue(true);
      });

      expect(result.current.value).toBe(true);
    });

    it("should handle setTrue when value is already true", () => {
      const { result } = renderHook(() => useToggle(true));

      const initialValue = result.current.value;

      act(() => {
        result.current.setTrue();
      });

      expect(result.current.value).toBe(initialValue);
      expect(result.current.value).toBe(true);
    });

    it("should handle setFalse when value is already false", () => {
      const { result } = renderHook(() => useToggle(false));

      const initialValue = result.current.value;

      act(() => {
        result.current.setFalse();
      });

      expect(result.current.value).toBe(initialValue);
      expect(result.current.value).toBe(false);
    });
  });

  describe("type safety", () => {
    it("should only accept boolean values in setValue", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current.setValue(true);
      });

      expect(result.current.value).toBe(true);

      act(() => {
        result.current.setValue(false);
      });

      expect(result.current.value).toBe(false);
    });

    it("should return boolean value", () => {
      const { result } = renderHook(() => useToggle(false));

      expect(typeof result.current.value).toBe("boolean");

      act(() => {
        result.current.toggle();
      });

      expect(typeof result.current.value).toBe("boolean");
    });
  });
});
