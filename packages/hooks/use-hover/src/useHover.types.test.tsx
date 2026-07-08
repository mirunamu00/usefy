import { render, fireEvent, renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useHover } from "./useHover";
import type { UseHoverReturn } from "./types";

/**
 * Tuple destructuring: `ref` must be assignable to a real element `ref` prop and
 * `isHovered` must be a `boolean` — NOT the widened union
 * `((node: T | null) => void) | boolean`. If the return type ever regresses to
 * a non-positional tuple, this component fails to typecheck.
 */
function TupleComponent() {
  const [ref, isHovered] = useHover<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="tuple-el">
      {isHovered ? "on" : "off"}
    </div>
  );
}

/**
 * Object destructuring must work identically off the same return value.
 */
function ObjectComponent() {
  const { ref, isHovered } = useHover<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="object-el">
      {isHovered ? "on" : "off"}
    </div>
  );
}

describe("useHover — typed destructuring", () => {
  it("attaches the tuple ref to a real element and tracks hover", () => {
    const { getByTestId } = render(<TupleComponent />);
    const el = getByTestId("tuple-el");

    expect(el.textContent).toBe("off");

    fireEvent.mouseEnter(el);
    expect(el.textContent).toBe("on");

    fireEvent.mouseLeave(el);
    expect(el.textContent).toBe("off");
  });

  it("attaches the object ref to a real element and tracks hover", () => {
    const { getByTestId } = render(<ObjectComponent />);
    const el = getByTestId("object-el");

    fireEvent.mouseEnter(el);
    expect(el.textContent).toBe("on");
  });

  it("infers precise positional and named types (compile-time guard)", () => {
    const { result } = renderHook(() => useHover<HTMLDivElement>());
    const value: UseHoverReturn<HTMLDivElement> = result.current;

    // Positional access is precisely typed, not a union.
    const posRef: (node: HTMLDivElement | null) => void = value[0];
    const posHovered: boolean = value[1];
    // Named access resolves to the same precise types.
    const namedRef: (node: HTMLDivElement | null) => void = value.ref;
    const namedHovered: boolean = value.isHovered;

    expect(typeof posRef).toBe("function");
    expect(typeof posHovered).toBe("boolean");
    expect(typeof namedRef).toBe("function");
    expect(typeof namedHovered).toBe("boolean");
    expect(posRef).toBe(namedRef);
    expect(posHovered).toBe(namedHovered);
  });
});
