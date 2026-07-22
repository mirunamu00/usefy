import { StrictMode, type CSSProperties } from "react";
import { act, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_OFFLINE_MESSAGE,
  DEFAULT_ONLINE_DURATION,
  DEFAULT_ONLINE_MESSAGE,
  NetworkIndicator,
  type NetworkIndicatorState,
} from "./NetworkIndicator";

// ---------------------------------------------------------------------------
// Connectivity simulation helpers
// ---------------------------------------------------------------------------

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    writable: true,
    value,
  });
}

/** Flip `navigator.onLine` and fire the matching window event. */
function goOffline(): void {
  act(() => {
    setOnline(false);
    window.dispatchEvent(new Event("offline"));
  });
}

function goOnline(): void {
  act(() => {
    setOnline(true);
    window.dispatchEvent(new Event("online"));
  });
}

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  setOnline(true);
});

afterEach(() => {
  vi.useRealTimers();
  setOnline(true);
});

// ---------------------------------------------------------------------------
// Steady state & first mount
// ---------------------------------------------------------------------------

describe("steady state", () => {
  it("renders nothing while online on mount", () => {
    const { container } = render(<NetworkIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not flash 'Back online' on first mount for always-online users", () => {
    vi.useFakeTimers();
    const onStatusChange = vi.fn();
    const { container } = render(
      <NetworkIndicator onStatusChange={onStatusChange} />
    );

    expect(container).toBeEmptyDOMElement();
    advance(DEFAULT_ONLINE_DURATION * 2);
    expect(container).toBeEmptyDOMElement();
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("does not flash or fire callbacks on first mount under StrictMode", () => {
    vi.useFakeTimers();
    const onStatusChange = vi.fn();
    const { container } = render(
      <StrictMode>
        <NetworkIndicator onStatusChange={onStatusChange} />
      </StrictMode>
    );

    expect(container).toBeEmptyDOMElement();
    advance(DEFAULT_ONLINE_DURATION * 2);
    expect(container).toBeEmptyDOMElement();
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("shows the offline banner immediately when mounted while offline", () => {
    setOnline(false);
    const onStatusChange = vi.fn();
    render(<NetworkIndicator onStatusChange={onStatusChange} />);

    const banner = screen.getByRole("alert");
    expect(banner).toHaveTextContent(DEFAULT_OFFLINE_MESSAGE);
    expect(banner).toHaveAttribute("data-status", "offline");
    // Mount is not a transition.
    expect(onStatusChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Offline banner
// ---------------------------------------------------------------------------

describe("offline banner", () => {
  it("appears when the connection is lost, as an assertive alert", () => {
    render(<NetworkIndicator />);
    goOffline();

    // role="alert" is the canonical assertive live region (implicit aria-live).
    const banner = screen.getByRole("alert");
    expect(banner).toHaveTextContent(DEFAULT_OFFLINE_MESSAGE);
    expect(banner).toHaveAttribute("aria-atomic", "true");
    expect(banner).toHaveAttribute("data-status", "offline");
    expect(banner).toHaveStyle({ pointerEvents: "none" });
  });

  it("renders a custom offlineMessage ReactNode", () => {
    render(
      <NetworkIndicator
        offlineMessage={<strong data-testid="custom-offline">No signal</strong>}
      />
    );
    goOffline();

    expect(screen.getByTestId("custom-offline")).toHaveTextContent("No signal");
  });

  it("persists while offline (no auto-dismiss)", () => {
    vi.useFakeTimers();
    render(<NetworkIndicator />);
    goOffline();

    advance(DEFAULT_ONLINE_DURATION * 10);
    expect(screen.getByRole("alert")).toHaveAttribute(
      "data-status",
      "offline"
    );
  });
});

// ---------------------------------------------------------------------------
// Reconnected confirmation
// ---------------------------------------------------------------------------

describe("reconnected confirmation", () => {
  it("shows 'Back online' politely after reconnecting, then auto-dismisses", () => {
    vi.useFakeTimers();
    const { container } = render(<NetworkIndicator />);

    goOffline();
    goOnline();

    // role="status" is an implicitly polite live region.
    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent(DEFAULT_ONLINE_MESSAGE);
    expect(banner).toHaveAttribute("data-status", "reconnected");

    advance(DEFAULT_ONLINE_DURATION - 1);
    expect(screen.getByRole("status")).toBeInTheDocument();

    advance(1);
    expect(container).toBeEmptyDOMElement();
  });

  it("honors a custom onlineDuration", () => {
    vi.useFakeTimers();
    const { container } = render(<NetworkIndicator onlineDuration={500} />);

    goOffline();
    goOnline();
    expect(screen.getByRole("status")).toHaveTextContent(
      DEFAULT_ONLINE_MESSAGE
    );

    advance(499);
    expect(screen.getByRole("status")).toBeInTheDocument();
    advance(1);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a custom onlineMessage ReactNode", () => {
    render(<NetworkIndicator onlineMessage={<em>Reconnected!</em>} />);
    goOffline();
    goOnline();

    expect(screen.getByRole("status")).toHaveTextContent("Reconnected!");
  });

  it("onlineDuration={0} disables the confirmation entirely", () => {
    vi.useFakeTimers();
    const { container } = render(<NetworkIndicator onlineDuration={0} />);

    goOffline();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    goOnline();
    expect(container).toBeEmptyDOMElement();
    advance(DEFAULT_ONLINE_DURATION);
    expect(container).toBeEmptyDOMElement();
  });

  it("a negative onlineDuration also disables the confirmation", () => {
    const { container } = render(<NetworkIndicator onlineDuration={-1} />);

    goOffline();
    goOnline();
    expect(container).toBeEmptyDOMElement();
  });

  it("dismisses immediately when onlineDuration drops to 0 mid-confirmation", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<NetworkIndicator />);

    goOffline();
    goOnline();
    expect(screen.getByRole("status")).toHaveAttribute(
      "data-status",
      "reconnected"
    );

    rerender(<NetworkIndicator onlineDuration={0} />);
    advance(0);
    expect(container).toBeEmptyDOMElement();
  });

  it("swaps back to the offline banner if the connection drops mid-confirmation", () => {
    vi.useFakeTimers();
    const { container } = render(<NetworkIndicator />);

    goOffline();
    goOnline();
    expect(screen.getByRole("status")).toHaveAttribute(
      "data-status",
      "reconnected"
    );

    goOffline();
    expect(screen.getByRole("alert")).toHaveAttribute(
      "data-status",
      "offline"
    );

    // The cancelled dismiss timer must not hide the offline banner later.
    advance(DEFAULT_ONLINE_DURATION * 2);
    expect(screen.getByRole("alert")).toHaveAttribute(
      "data-status",
      "offline"
    );

    // And a fresh reconnect still works.
    goOnline();
    expect(screen.getByRole("status")).toHaveAttribute(
      "data-status",
      "reconnected"
    );
    advance(DEFAULT_ONLINE_DURATION);
    expect(container).toBeEmptyDOMElement();
  });

  it("works across repeated offline/online cycles under StrictMode", () => {
    vi.useFakeTimers();
    const { container } = render(
      <StrictMode>
        <NetworkIndicator />
      </StrictMode>
    );

    for (let i = 0; i < 2; i++) {
      goOffline();
      expect(screen.getByRole("alert")).toHaveAttribute(
        "data-status",
        "offline"
      );
      goOnline();
      expect(screen.getByRole("status")).toHaveAttribute(
        "data-status",
        "reconnected"
      );
      advance(DEFAULT_ONLINE_DURATION);
      expect(container).toBeEmptyDOMElement();
    }
  });
});

// ---------------------------------------------------------------------------
// onStatusChange
// ---------------------------------------------------------------------------

describe("onStatusChange", () => {
  it("fires once per transition with the new connectivity", () => {
    const onStatusChange = vi.fn();
    render(<NetworkIndicator onStatusChange={onStatusChange} />);

    goOffline();
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenLastCalledWith(false);

    goOnline();
    expect(onStatusChange).toHaveBeenCalledTimes(2);
    expect(onStatusChange).toHaveBeenLastCalledWith(true);
  });

  it("sees the latest callback prop without re-subscribing", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<NetworkIndicator onStatusChange={first} />);

    rerender(<NetworkIndicator onStatusChange={second} />);
    goOffline();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(false);
  });

  it("fires transitions exactly once under StrictMode", () => {
    const onStatusChange = vi.fn();
    render(
      <StrictMode>
        <NetworkIndicator onStatusChange={onStatusChange} />
      </StrictMode>
    );

    goOffline();
    goOnline();
    expect(onStatusChange).toHaveBeenCalledTimes(2);
    expect(onStatusChange.mock.calls).toEqual([[false], [true]]);
  });
});

// ---------------------------------------------------------------------------
// render escape hatch
// ---------------------------------------------------------------------------

describe("render prop", () => {
  it("receives { online, reconnected } and fully owns the UI", () => {
    vi.useFakeTimers();
    const states: NetworkIndicatorState[] = [];
    const { container } = render(
      <NetworkIndicator
        render={(state) => {
          states.push(state);
          if (state.online && !state.reconnected) return null;
          return (
            <span data-testid="custom">
              {state.online ? "back" : "offline"}
            </span>
          );
        }}
      />
    );

    // Steady-state online: called, renders nothing, no default banner.
    expect(states[0]).toEqual({ online: true, reconnected: false });
    expect(container).toBeEmptyDOMElement();

    goOffline();
    expect(screen.getByTestId("custom")).toHaveTextContent("offline");
    // The default banner (either role) never renders alongside the render prop.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    goOnline();
    expect(screen.getByTestId("custom")).toHaveTextContent("back");
    expect(states[states.length - 1]).toEqual({
      online: true,
      reconnected: true,
    });

    // The state machine (auto-dismiss) still runs behind the render prop.
    advance(DEFAULT_ONLINE_DURATION);
    expect(container).toBeEmptyDOMElement();
    expect(states[states.length - 1]).toEqual({
      online: true,
      reconnected: false,
    });
  });
});

// ---------------------------------------------------------------------------
// Presentation props
// ---------------------------------------------------------------------------

describe("presentation", () => {
  it("pins to the top by default", () => {
    render(<NetworkIndicator />);
    goOffline();

    const banner = screen.getByRole("alert");
    expect(banner).toHaveAttribute("data-position", "top");
    expect(banner).toHaveStyle({ position: "fixed", top: "0px" });
  });

  it("pins to the bottom with position='bottom'", () => {
    render(<NetworkIndicator position="bottom" />);
    goOffline();

    const banner = screen.getByRole("alert");
    expect(banner).toHaveAttribute("data-position", "bottom");
    expect(banner).toHaveStyle({ bottom: "0px" });
  });

  it("passes through className and lets style overrides win", () => {
    const style: CSSProperties = { backgroundColor: "rgb(1, 2, 3)", zIndex: 42 };
    render(<NetworkIndicator className="my-banner" style={style} />);
    goOffline();

    const banner = screen.getByRole("alert");
    expect(banner).toHaveClass("my-banner");
    expect(banner).toHaveStyle({
      backgroundColor: "rgb(1, 2, 3)",
      zIndex: 42,
    });
  });
});

// ---------------------------------------------------------------------------
// SSR
// ---------------------------------------------------------------------------

describe("SSR", () => {
  it("server-renders to nothing (assumes online) without touching window", () => {
    expect(renderToStaticMarkup(<NetworkIndicator />)).toBe("");
  });

  it("server-renders the render prop with { online: true, reconnected: false }", () => {
    const html = renderToStaticMarkup(
      <NetworkIndicator
        render={({ online, reconnected }) => (
          <span>{`${online}/${reconnected}`}</span>
        )}
      />
    );
    expect(html).toBe("<span>true/false</span>");
  });
});

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

describe("cleanup", () => {
  it("clears the dismiss timer on unmount (no setState after unmount)", () => {
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = render(<NetworkIndicator />);

    goOffline();
    goOnline();
    expect(screen.getByRole("status")).toHaveAttribute(
      "data-status",
      "reconnected"
    );

    unmount();
    expect(() => {
      act(() => {
        vi.runAllTimers();
      });
    }).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("removes connectivity listeners on unmount", () => {
    const { container, unmount } = render(<NetworkIndicator />);
    unmount();

    // Firing events after unmount must be a no-op (no crash, nothing rendered).
    expect(() => {
      goOffline();
      goOnline();
    }).not.toThrow();
    expect(container).toBeEmptyDOMElement();
  });
});
