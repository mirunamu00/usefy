import React, { useState, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  useOnClickOutside,
  type ClickOutsideEvent,
} from "@usefy/use-on-click-outside";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Demo component for Modal with outside click
 */
function ModalDemo({ enabled = true }: { enabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(
    modalRef,
    () => {
      setIsOpen(false);
      setClickCount((prev) => prev + 1);
    },
    { enabled: isOpen && enabled }
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-4"}>
        useOnClickOutside Demo
      </h2>
      <p className={storyTheme.subtitle}>
        Click the button to open modal, then click outside to close
      </p>

      <button
        onClick={() => setIsOpen(true)}
        className={storyTheme.buttonPrimary + " mb-6"}
        data-testid="open-modal-btn"
      >
        Open Modal
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            data-testid="modal"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Modal Content
            </h3>
            <p className="text-gray-600 mb-6">
              Click anywhere outside this modal to close it.
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className={storyTheme.buttonNeutral}
              data-testid="close-modal-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className={storyTheme.statBox + " mt-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Outside clicks: </span>
          <span className={storyTheme.statValue} data-testid="click-count">
            {clickCount}
          </span>
        </p>
        <p className={storyTheme.statLabel + " mt-2"}>
          <span className={storyTheme.statTextSecondary}>Modal: </span>
          <span
            className={isOpen ? "text-green-600" : "text-gray-500"}
            data-testid="modal-status"
          >
            {isOpen ? "Open" : "Closed"}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for Dropdown with multiple refs
 */
function DropdownDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside([buttonRef, menuRef], () => setIsOpen(false), {
    enabled: isOpen,
  });

  const menuItems = ["Profile", "Settings", "Help", "Logout"];

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-4"}>
        Dropdown with Multiple Refs
      </h2>
      <p className={storyTheme.subtitle}>
        Button and menu are both considered "inside"
      </p>

      <div className="relative inline-block">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={storyTheme.buttonPrimary}
          data-testid="dropdown-btn"
        >
          {isOpen ? "Close Menu" : "Open Menu"} ▼
        </button>

        {isOpen && (
          <div
            ref={menuRef}
            className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-10"
            data-testid="dropdown-menu"
          >
            {menuItems.map((item) => (
              <button
                key={item}
                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                onClick={() => {
                  alert(`Clicked: ${item}`);
                  setIsOpen(false);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={storyTheme.infoBox + " mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          Click outside both the button and menu to close the dropdown.
          <br />
          Clicking the button toggles the menu without triggering outside click.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for exclude refs
 */
function ExcludeRefsDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(modalRef, () => setIsOpen(false), {
    enabled: isOpen,
    excludeRefs: [notificationRef],
  });

  const addNotification = () => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, id]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n !== id));
    }, 3000);
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-4"}>
        With Exclude Refs
      </h2>
      <p className={storyTheme.subtitle}>
        Clicking notifications won't close the modal
      </p>

      <button
        onClick={() => setIsOpen(true)}
        className={storyTheme.buttonPrimary + " mb-6"}
        data-testid="open-modal-btn"
      >
        Open Modal
      </button>

      {/* Notification area - excluded from outside click */}
      <div
        ref={notificationRef}
        className="fixed top-4 right-4 z-50 space-y-2"
        data-testid="notification-area"
      >
        {notifications.map((id) => (
          <div
            key={id}
            className="bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse"
          >
            Notification #{id.slice(-4)}
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            data-testid="modal"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Modal with Excluded Area
            </h3>
            <p className="text-gray-600 mb-4">
              Click the button below to add notifications.
              <br />
              Clicking on notifications won't close this modal!
            </p>
            <div className="flex gap-3">
              <button
                onClick={addNotification}
                className={storyTheme.buttonSecondary}
                data-testid="add-notification-btn"
              >
                Add Notification
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className={storyTheme.buttonNeutral}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={storyTheme.statBox + " mt-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Modal: </span>
          <span
            className={isOpen ? "text-green-600" : "text-gray-500"}
            data-testid="modal-status"
          >
            {isOpen ? "Open" : "Closed"}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for conditional activation
 */
function ConditionalDemo() {
  const [isListening, setIsListening] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [outsideClicks, setOutsideClicks] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(
    boxRef,
    () => {
      setOutsideClicks((prev) => prev + 1);
      if (isOpen) setIsOpen(false);
    },
    { enabled: isListening }
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-4"}>
        Conditional Activation
      </h2>
      <p className={storyTheme.subtitle}>
        Toggle listener on/off to control detection
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsListening((prev) => !prev);
        }}
        data-testid="toggle-listener-btn"
        className={`w-full py-4 px-6 text-lg font-semibold border-none rounded-xl cursor-pointer transition-all duration-300 mb-6 ${
          isListening
            ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-[0_6px_20px_rgba(16,185,129,0.4)]"
            : "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_6px_20px_rgba(239,68,68,0.4)]"
        }`}
      >
        Listener: {isListening ? "Active" : "Inactive"}
      </button>

      <div
        ref={boxRef}
        className={`p-8 rounded-xl transition-all duration-300 cursor-pointer ${
          isOpen
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl"
            : "bg-gray-100 text-gray-700"
        }`}
        onClick={() => setIsOpen(true)}
        data-testid="target-box"
      >
        <p className="text-lg font-semibold">
          {isOpen ? "Box is OPEN" : "Click to open"}
        </p>
        <p className="text-sm mt-2 opacity-80">
          {isOpen
            ? "Click outside to close (if listener is active)"
            : "This box toggles on click"}
        </p>
      </div>

      <div className={storyTheme.statBox + " mt-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Listener: </span>
          <span
            className={isListening ? "text-green-600" : "text-red-500"}
            data-testid="listener-status"
          >
            {isListening ? "Active" : "Inactive"}
          </span>
        </p>
        <p className={storyTheme.statLabel + " mt-2"}>
          <span className={storyTheme.statTextSecondary}>Outside Clicks: </span>
          <span className={storyTheme.statValue} data-testid="outside-count">
            {outsideClicks}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Demo component for shouldExclude function
 */
function ShouldExcludeDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastClick, setLastClick] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(
    menuRef,
    (event) => {
      const target = event.target as Element;
      setLastClick(
        target.className?.includes?.("ignore")
          ? "Ignored element"
          : "Outside element"
      );
      setIsOpen(false);
    },
    {
      enabled: isOpen,
      shouldExclude: (target) =>
        (target as Element).closest?.(".ignore-outside-click") !== null,
    }
  );

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-4"}>
        Custom shouldExclude
      </h2>
      <p className={storyTheme.subtitle}>
        Elements with ".ignore-outside-click" class are ignored
      </p>

      <button
        onClick={() => setIsOpen(true)}
        className={storyTheme.buttonPrimary + " mb-6"}
        data-testid="open-btn"
      >
        Open Menu
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="bg-white rounded-xl p-6 shadow-xl border border-slate-200 mb-6"
          data-testid="menu"
        >
          <p className="text-gray-700 font-semibold mb-4">
            Menu Content - Click outside to close
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className={storyTheme.buttonNeutral}
          >
            Close
          </button>
        </div>
      )}

      <div className="flex gap-4 justify-center mb-6">
        <button
          className={storyTheme.buttonNeutral + " ignore-outside-click"}
          onClick={() =>
            setLastClick("Clicked ignore button (menu stays open)")
          }
          data-testid="ignore-btn"
        >
          Ignored Button
        </button>
        <button
          className={storyTheme.buttonDanger}
          onClick={() => setLastClick("Clicked normal button")}
          data-testid="normal-btn"
        >
          Normal Button
        </button>
      </div>

      <div className={storyTheme.statBox + " bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <p className={storyTheme.statLabel}>
          <span className={storyTheme.statTextSecondary}>Menu: </span>
          <span
            className={isOpen ? "text-green-600" : "text-gray-500"}
            data-testid="menu-status"
          >
            {isOpen ? "Open" : "Closed"}
          </span>
        </p>
        {lastClick && (
          <p className={storyTheme.statLabel + " mt-2"}>
            <span className={storyTheme.statTextSecondary}>Last Action: </span>
            <span className={storyTheme.statValue} data-testid="last-click">
              {lastClick}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

const meta: Meta<typeof ModalDemo> = {
  title: "Hooks/useOnClickOutside",
  component: ModalDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A hook for detecting clicks outside of specified elements. Perfect for modals, dropdowns, popovers, and similar UI components.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    enabled: {
      control: "boolean",
      description: "Whether the outside click detection is active",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalDemo>;

/**
 * Default modal demo - click outside to close
 */
export const Default: Story = {
  args: {
    enabled: true,
  },
  parameters: {
    docs: {
      source: {
        code: `import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useState, useRef } from "react";

function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(modalRef, () => {
    setIsOpen(false);
    setClickCount((prev) => prev + 1);
  }, { enabled: isOpen });

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div ref={modalRef} style={{ background: "white", padding: "2rem", borderRadius: "0.5rem" }}>
            <h3>Modal Content</h3>
            <p>Click anywhere outside this modal to close it.</p>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
      <p>Outside clicks: {clickCount}</p>
      <p>Modal: {isOpen ? "Open" : "Closed"}</p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state
    await expect(canvas.getByTestId("modal-status")).toHaveTextContent(
      "Closed"
    );

    // Open modal
    await userEvent.click(canvas.getByTestId("open-modal-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("modal-status")).toHaveTextContent("Open");
    });
  },
};

/**
 * Dropdown with multiple refs - button and menu
 */
export const Dropdown: StoryObj<typeof DropdownDemo> = {
  render: () => <DropdownDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useState, useRef } from "react";

function DropdownExample() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside([buttonRef, menuRef], () => setIsOpen(false), {
    enabled: isOpen,
  });

  const menuItems = ["Profile", "Settings", "Help", "Logout"];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Close Menu" : "Open Menu"} ▼
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "0.5rem",
            width: "12rem",
            background: "white",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
            zIndex: 10,
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => {
                alert(\`Clicked: \${item}\`);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                textAlign: "left",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open dropdown
    await userEvent.click(canvas.getByTestId("dropdown-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("dropdown-menu")).toBeInTheDocument();
    });

    // Click button again (should toggle, not trigger outside click)
    await userEvent.click(canvas.getByTestId("dropdown-btn"));
    await waitFor(() => {
      expect(canvas.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });
  },
};

/**
 * With exclude refs - notifications area is excluded
 */
export const WithExclusion: StoryObj<typeof ExcludeRefsDemo> = {
  render: () => <ExcludeRefsDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useState, useRef } from "react";

function ExcludeRefsExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(modalRef, () => setIsOpen(false), {
    enabled: isOpen,
    excludeRefs: [notificationRef],
  });

  const addNotification = () => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, id]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n !== id));
    }, 3000);
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      {/* Notification area - excluded from outside click */}
      <div
        ref={notificationRef}
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 50,
        }}
      >
        {notifications.map((id) => (
          <div
            key={id}
            style={{
              background: "#4f46e5",
              color: "white",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            Notification #{id.slice(-4)}
          </div>
        ))}
      </div>

      {isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40 }}>
          <div ref={modalRef} style={{ background: "white", padding: "2rem", borderRadius: "0.5rem", maxWidth: "28rem", width: "100%" }}>
            <h3>Modal with Excluded Area</h3>
            <p>
              Click the button below to add notifications.
              <br />
              Clicking on notifications won't close this modal!
            </p>
            <div>
              <button onClick={addNotification}>Add Notification</button>
              <button onClick={() => setIsOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      <p>Modal: {isOpen ? "Open" : "Closed"}</p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open modal
    await userEvent.click(canvas.getByTestId("open-modal-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("modal-status")).toHaveTextContent("Open");
    });
  },
};

/**
 * Conditional activation - toggle listener on/off
 */
export const Conditional: StoryObj<typeof ConditionalDemo> = {
  render: () => <ConditionalDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useState, useRef } from "react";

function ConditionalExample() {
  const [isListening, setIsListening] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [outsideClicks, setOutsideClicks] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(
    boxRef,
    () => {
      setOutsideClicks((prev) => prev + 1);
      if (isOpen) setIsOpen(false);
    },
    { enabled: isListening }
  );

  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsListening((prev) => !prev);
        }}
        style={{
          width: "100%",
          padding: "1rem",
          background: isListening ? "#10b981" : "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
          marginBottom: "1.5rem",
        }}
      >
        Listener: {isListening ? "Active" : "Inactive"}
      </button>

      <div
        ref={boxRef}
        onClick={() => setIsOpen(true)}
        style={{
          padding: "2rem",
          borderRadius: "0.5rem",
          cursor: "pointer",
          background: isOpen ? "linear-gradient(to bottom right, #6366f1, #9333ea)" : "#f3f4f6",
          color: isOpen ? "white" : "#374151",
        }}
      >
        <p style={{ fontWeight: "600" }}>
          {isOpen ? "Box is OPEN" : "Click to open"}
        </p>
        <p style={{ fontSize: "0.875rem", marginTop: "0.5rem", opacity: 0.8 }}>
          {isOpen
            ? "Click outside to close (if listener is active)"
            : "This box toggles on click"}
        </p>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <p>Listener: <span style={{ color: isListening ? "#10b981" : "#ef4444" }}>{isListening ? "Active" : "Inactive"}</span></p>
        <p>Outside Clicks: {outsideClicks}</p>
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state - listener active
    await expect(canvas.getByTestId("listener-status")).toHaveTextContent(
      "Active"
    );

    // Toggle listener off
    await userEvent.click(canvas.getByTestId("toggle-listener-btn"));
    await expect(canvas.getByTestId("listener-status")).toHaveTextContent(
      "Inactive"
    );

    // Toggle listener back on
    await userEvent.click(canvas.getByTestId("toggle-listener-btn"));
    await expect(canvas.getByTestId("listener-status")).toHaveTextContent(
      "Active"
    );
  },
};

/**
 * Custom shouldExclude function
 */
export const CustomExclude: StoryObj<typeof ShouldExcludeDemo> = {
  render: () => <ShouldExcludeDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useState, useRef } from "react";

function CustomExcludeExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastClick, setLastClick] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(
    menuRef,
    (event) => {
      const target = event.target as Element;
      setLastClick(
        target.className?.includes?.("ignore")
          ? "Ignored element"
          : "Outside element"
      );
      setIsOpen(false);
    },
    {
      enabled: isOpen,
      shouldExclude: (target) =>
        (target as Element).closest?.(".ignore-outside-click") !== null,
    }
  );

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Menu</button>

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            background: "white",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ fontWeight: "600", marginBottom: "1rem" }}>
            Menu Content - Click outside to close
          </p>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "1.5rem" }}>
        <button
          className="ignore-outside-click"
          onClick={() => setLastClick("Clicked ignore button (menu stays open)")}
          style={{
            padding: "0.5rem 1rem",
            background: "#e5e7eb",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Ignored Button
        </button>
        <button
          onClick={() => setLastClick("Clicked normal button")}
          style={{
            padding: "0.5rem 1rem",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Normal Button
        </button>
      </div>

      <div>
        <p>Menu: <span style={{ color: isOpen ? "#10b981" : "#6b7280" }}>{isOpen ? "Open" : "Closed"}</span></p>
        {lastClick && <p>Last Action: {lastClick}</p>}
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open menu
    await userEvent.click(canvas.getByTestId("open-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("menu-status")).toHaveTextContent("Open");
    });

    // Click ignored button - menu should stay open
    await userEvent.click(canvas.getByTestId("ignore-btn"));
    await expect(canvas.getByTestId("menu-status")).toHaveTextContent("Open");

    // Close and reopen for next test
    await userEvent.click(canvas.getByTestId("open-btn"));
  },
};
