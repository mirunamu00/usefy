import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useUnmount } from "@usefy/use-unmount";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * Child component that uses useUnmount
 */
function UnmountChild({
  onUnmount,
  label,
}: {
  onUnmount: () => void;
  label: string;
}) {
  useUnmount(() => {
    onUnmount();
  });

  return (
    <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white text-center shadow-lg">
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-white/80 mt-1">
        Will call onUnmount when removed
      </p>
    </div>
  );
}

/**
 * Basic demo showing unmount callback
 */
function BasicDemo() {
  const [isVisible, setIsVisible] = useState(true);
  const [unmountCount, setUnmountCount] = useState(0);
  const [lastUnmountTime, setLastUnmountTime] = useState<string | null>(null);

  const handleUnmount = () => {
    setUnmountCount((prev) => prev + 1);
    setLastUnmountTime(new Date().toLocaleTimeString());
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Basic Unmount Callback
      </h2>

      <div className="w-80 mx-auto mb-6" style={{ minHeight: "100px" }}>
        {isVisible ? (
          <UnmountChild onUnmount={handleUnmount} label="Mounted Component" />
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl text-slate-400 text-center border-2 border-dashed border-slate-200">
            <p>Component Unmounted</p>
          </div>
        )}
      </div>

      <div className="w-80 mx-auto">
        <button
          onClick={() => setIsVisible((prev) => !prev)}
          className={`w-full ${
            isVisible ? storyTheme.buttonDanger : storyTheme.buttonPrimary
          }`}
          data-testid="toggle-button"
        >
          {isVisible ? "Unmount Component" : "Mount Component"}
        </button>
      </div>

      <div className={storyTheme.statBox + " mt-6 w-80 mx-auto bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className={storyTheme.statTextSecondary}>Unmount Count</p>
            <p
              className="text-2xl font-bold text-slate-800"
              data-testid="unmount-count"
            >
              {unmountCount}
            </p>
          </div>
          <div>
            <p className={storyTheme.statTextSecondary}>Last Unmount</p>
            <p
              className="text-lg font-semibold text-slate-800"
              data-testid="last-unmount-time"
            >
              {lastUnmountTime || "-"}
            </p>
          </div>
        </div>
      </div>

      <div className={storyTheme.infoBox + " mt-6 w-80 mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          Click the button to toggle the component. The unmount callback is
          called when the component is removed.
        </p>
      </div>
    </div>
  );
}

/**
 * Child component with latest state access
 */
function FormChild({
  onUnmount,
}: {
  onUnmount: (data: { name: string; email: string }) => void;
}) {
  const [formData, setFormData] = useState({ name: "", email: "" });

  useUnmount(() => {
    onUnmount(formData);
  });

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, name: e.target.value }))
        }
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
        data-testid="name-input"
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, email: e.target.value }))
        }
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
        data-testid="email-input"
      />
      <p className="text-sm text-slate-500 text-center">
        Data will be saved on unmount
      </p>
    </div>
  );
}

/**
 * Demo showing closure freshness - callback always sees latest state
 */
function ClosureFreshnessDemo() {
  const [isEditing, setIsEditing] = useState(true);
  const [savedData, setSavedData] = useState<{
    name: string;
    email: string;
  } | null>(null);

  const handleUnmount = (data: { name: string; email: string }) => {
    setSavedData(data);
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Closure Freshness
      </h2>

      <p className={storyTheme.subtitle + " mb-6"}>
        The callback always accesses the latest state values
      </p>

      <div className="w-80 mx-auto mb-6" style={{ minHeight: "180px" }}>
        {isEditing ? (
          <FormChild onUnmount={handleUnmount} />
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400">Form Closed</p>
          </div>
        )}
      </div>

      <div className="w-80 mx-auto">
        <button
          onClick={() => setIsEditing((prev) => !prev)}
          className={`w-full ${
            isEditing ? storyTheme.buttonDanger : storyTheme.buttonPrimary
          }`}
          data-testid="close-form-button"
        >
          {isEditing ? "Close Form (Save)" : "Open Form"}
        </button>
      </div>

      {savedData && (
        <div className={storyTheme.statBox + " mt-6 w-80 mx-auto bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
          <p className={storyTheme.statLabel + " mb-3"}>Saved Data:</p>
          <div className="space-y-2 text-sm">
            <p>
              <span className={storyTheme.statTextSecondary}>Name: </span>
              <span className="text-slate-800" data-testid="saved-name">
                {savedData.name || "(empty)"}
              </span>
            </p>
            <p>
              <span className={storyTheme.statTextSecondary}>Email: </span>
              <span className="text-slate-800" data-testid="saved-email">
                {savedData.email || "(empty)"}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className={storyTheme.infoBox + " mt-6 w-80 mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          Type in the form, then close it. The unmount callback captures the
          latest values.
        </p>
      </div>
    </div>
  );
}

/**
 * Child component with conditional unmount
 */
function ConditionalChild({
  onUnmount,
  enabled,
}: {
  onUnmount: () => void;
  enabled: boolean;
}) {
  useUnmount(
    () => {
      onUnmount();
    },
    { enabled }
  );

  return (
    <div
      className={`p-4 rounded-xl text-center ${
        enabled
          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
          : "bg-slate-100 text-slate-500 border border-slate-200"
      }`}
    >
      <p className="font-semibold">
        {enabled ? "Cleanup Enabled" : "Cleanup Disabled"}
      </p>
      <p
        className={`text-sm mt-1 ${
          enabled ? "text-white/80" : "text-slate-400"
        }`}
      >
        {enabled
          ? "Will call onUnmount when removed"
          : "Unmount callback is disabled"}
      </p>
    </div>
  );
}

/**
 * Demo showing conditional cleanup with enabled option
 */
function ConditionalCleanupDemo() {
  const [isVisible, setIsVisible] = useState(true);
  const [cleanupEnabled, setCleanupEnabled] = useState(true);
  const [unmountCount, setUnmountCount] = useState(0);
  const [history, setHistory] = useState<
    Array<{ enabled: boolean; time: string; id: number }>
  >([]);

  const handleUnmount = () => {
    setUnmountCount((prev) => prev + 1);
    setHistory((prev) => [
      {
        enabled: cleanupEnabled,
        time: new Date().toLocaleTimeString(),
        id: Date.now(),
      },
      ...prev.slice(0, 4),
    ]);
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Conditional Cleanup
      </h2>

      <div className="w-80 mx-auto mb-6" style={{ minHeight: "100px" }}>
        {isVisible ? (
          <ConditionalChild
            onUnmount={handleUnmount}
            enabled={cleanupEnabled}
          />
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl text-slate-400 text-center border-2 border-dashed border-slate-200">
            <p>Component Unmounted</p>
          </div>
        )}
      </div>

      <div className="w-80 mx-auto flex gap-2 mb-4">
        <button
          onClick={() => setIsVisible((prev) => !prev)}
          className={`flex-1 ${
            isVisible ? storyTheme.buttonDanger : storyTheme.buttonPrimary
          }`}
          data-testid="toggle-visibility-button"
        >
          {isVisible ? "Unmount" : "Mount"}
        </button>
        <button
          onClick={() => setCleanupEnabled((prev) => !prev)}
          className={`flex-1 ${
            cleanupEnabled
              ? storyTheme.buttonSecondary
              : storyTheme.buttonNeutral
          }`}
          data-testid="toggle-enabled-button"
        >
          {cleanupEnabled ? "Disable Cleanup" : "Enable Cleanup"}
        </button>
      </div>

      <div className={storyTheme.statBox + " mb-4 w-80 mx-auto bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className={storyTheme.statTextSecondary}>Cleanup Status</p>
            <p
              className={`text-lg font-semibold ${
                cleanupEnabled ? "text-green-600" : "text-slate-400"
              }`}
              data-testid="cleanup-status"
            >
              {cleanupEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div>
            <p className={storyTheme.statTextSecondary}>Unmount Calls</p>
            <p
              className="text-2xl font-bold text-slate-800"
              data-testid="conditional-unmount-count"
            >
              {unmountCount}
            </p>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className={storyTheme.statBox + " w-80 mx-auto bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
          <p className={storyTheme.statLabel + " mb-3"}>Unmount History:</p>
          <div className="space-y-2">
            {history.map(({ enabled, time, id }) => (
              <div
                key={id}
                className="flex justify-between items-center text-sm"
              >
                <span className={enabled ? "text-green-600" : "text-slate-400"}>
                  {enabled ? "Executed" : "Skipped"}
                </span>
                <span className="text-slate-400">{time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={storyTheme.infoBox + " mt-6 w-80 mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          Toggle cleanup on/off, then unmount to see conditional behavior.
        </p>
      </div>
    </div>
  );
}

/**
 * Child component for multiple instances demo
 */
function InstanceChild({
  id,
  onUnmount,
}: {
  id: number;
  onUnmount: (id: number) => void;
}) {
  useUnmount(() => {
    onUnmount(id);
  });

  return (
    <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white text-center shadow-sm">
      <p className="font-semibold">Instance #{id}</p>
    </div>
  );
}

/**
 * Demo showing multiple independent instances
 */
function MultipleInstancesDemo() {
  const [instances, setInstances] = useState([1, 2, 3]);
  const [nextId, setNextId] = useState(4);
  const [unmountLog, setUnmountLog] = useState<
    Array<{ id: number; time: string; key: number }>
  >([]);

  const handleUnmount = (id: number) => {
    setUnmountLog((prev) => [
      { id, time: new Date().toLocaleTimeString(), key: Date.now() },
      ...prev.slice(0, 9),
    ]);
  };

  const addInstance = () => {
    setInstances((prev) => [...prev, nextId]);
    setNextId((prev) => prev + 1);
  };

  const removeInstance = (id: number) => {
    setInstances((prev) => prev.filter((i) => i !== id));
  };

  const removeAll = () => {
    setInstances([]);
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Multiple Instances
      </h2>

      <div className="w-80 mx-auto mb-6">
        <div className="space-y-2 mb-4" style={{ minHeight: "150px" }}>
          {instances.length > 0 ? (
            instances.map((id) => (
              <div key={id} className="flex gap-2 items-center">
                <div className="flex-1">
                  <InstanceChild id={id} onUnmount={handleUnmount} />
                </div>
                <button
                  onClick={() => removeInstance(id)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  data-testid={`remove-${id}`}
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-slate-400 text-center border-2 border-dashed border-slate-200">
              <p>No instances</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={addInstance}
            className={storyTheme.buttonPrimary + " flex-1"}
            data-testid="add-instance"
          >
            Add Instance
          </button>
          <button
            onClick={removeAll}
            className={storyTheme.buttonDanger + " flex-1"}
            data-testid="remove-all"
            disabled={instances.length === 0}
          >
            Remove All
          </button>
        </div>
      </div>

      {unmountLog.length > 0 && (
        <div className={storyTheme.statBox + " w-80 mx-auto bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
          <p className={storyTheme.statLabel + " mb-3"}>
            Unmount Log ({unmountLog.length}):
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {unmountLog.map(({ id, time, key }) => (
              <div
                key={key}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-indigo-600 font-medium">
                  Instance #{id}
                </span>
                <span className="text-slate-400">{time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={storyTheme.infoBox + " mt-6 w-80 mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          Each instance has its own independent unmount callback.
        </p>
      </div>
    </div>
  );
}

/**
 * Demo showing analytics tracking use case
 */
function AnalyticsTrackingDemo() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [events, setEvents] = useState<
    Array<{ section: string; event: string; time: string; id: number }>
  >([]);

  const sections = ["Dashboard", "Settings", "Profile"];

  const logEvent = (section: string, event: string) => {
    setEvents((prev) => [
      { section, event, time: new Date().toLocaleTimeString(), id: Date.now() },
      ...prev.slice(0, 9),
    ]);
  };

  return (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title + " text-center mb-8"}>
        Analytics Tracking
      </h2>

      <p className={storyTheme.subtitle + " mb-6"}>
        Track page view duration and navigation
      </p>

      <div className="w-80 mx-auto mb-6">
        <div className="flex gap-2 mb-4">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => {
                logEvent(section, "view_start");
                setActiveSection(section);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              data-testid={`section-${section.toLowerCase()}`}
            >
              {section}
            </button>
          ))}
        </div>

        <div style={{ minHeight: "120px" }}>
          {activeSection && (
            <SectionView
              key={activeSection}
              section={activeSection}
              onUnmount={() => logEvent(activeSection, "view_end")}
            />
          )}
        </div>
      </div>

      {events.length > 0 && (
        <div className={storyTheme.statBox + " w-80 mx-auto bg-white rounded-2xl p-6 shadow-sm border border-slate-200"}>
          <p className={storyTheme.statLabel + " mb-3"}>Analytics Events:</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.map(({ section, event, time, id }) => (
              <div
                key={id}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  <span className="text-indigo-600 font-medium">{section}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span
                    className={
                      event === "view_start"
                        ? "text-green-600"
                        : "text-orange-600"
                    }
                  >
                    {event}
                  </span>
                </div>
                <span className="text-slate-400">{time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={storyTheme.infoBox + " mt-6 w-80 mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5"}>
        <p className={storyTheme.infoText + " text-slate-600"}>
          Click sections to navigate. Unmount tracks when you leave each
          section.
        </p>
      </div>
    </div>
  );
}

function SectionView({
  section,
  onUnmount,
}: {
  section: string;
  onUnmount: () => void;
}) {
  useUnmount(onUnmount);

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white text-center shadow-lg">
      <p className="text-2xl font-bold mb-2">{section}</p>
      <p className="text-white/80">Currently viewing this section</p>
    </div>
  );
}

const meta: Meta<typeof BasicDemo> = {
  title: "Hooks/useUnmount",
  component: BasicDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A React hook that executes a callback function when the component unmounts.`,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof BasicDemo>;

export const Default: Story = {
  render: () => <BasicDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useUnmount } from "@usefy/use-unmount";
import { useState } from "react";

function ChildComponent({ onUnmount }: { onUnmount: () => void }) {
  useUnmount(() => {
    onUnmount();
  });

  return (
    <div>
      <p>Mounted Component</p>
      <p>Will call onUnmount when removed</p>
    </div>
  );
}

function Example() {
  const [isVisible, setIsVisible] = useState(true);
  const [unmountCount, setUnmountCount] = useState(0);

  const handleUnmount = () => {
    setUnmountCount((prev) => prev + 1);
  };

  return (
    <div>
      {isVisible ? (
        <ChildComponent onUnmount={handleUnmount} />
      ) : (
        <div>Component Unmounted</div>
      )}
      <button onClick={() => setIsVisible((prev) => !prev)}>
        {isVisible ? "Unmount Component" : "Mount Component"}
      </button>
      <div>Unmount Count: {unmountCount}</div>
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
    await expect(canvas.getByTestId("unmount-count")).toHaveTextContent("0");
    await expect(canvas.getByTestId("last-unmount-time")).toHaveTextContent(
      "-"
    );

    // Click to unmount
    await userEvent.click(canvas.getByTestId("toggle-button"));

    // Verify unmount callback was called
    await waitFor(() => {
      expect(canvas.getByTestId("unmount-count")).toHaveTextContent("1");
    });

    // Click to mount again
    await userEvent.click(canvas.getByTestId("toggle-button"));

    // Click to unmount again
    await userEvent.click(canvas.getByTestId("toggle-button"));

    await waitFor(() => {
      expect(canvas.getByTestId("unmount-count")).toHaveTextContent("2");
    });
  },
};

export const ClosureFreshness: StoryObj<typeof ClosureFreshnessDemo> = {
  render: () => <ClosureFreshnessDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useUnmount } from "@usefy/use-unmount";
import { useState } from "react";

function FormChild({
  onUnmount,
}: {
  onUnmount: (data: { name: string; email: string }) => void;
}) {
  const [formData, setFormData] = useState({ name: "", email: "" });

  useUnmount(() => {
    onUnmount(formData);
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, name: e.target.value }))
        }
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, email: e.target.value }))
        }
      />
      <p>Data will be saved on unmount</p>
    </div>
  );
}

function Example() {
  const [isEditing, setIsEditing] = useState(true);
  const [savedData, setSavedData] = useState<{
    name: string;
    email: string;
  } | null>(null);

  const handleUnmount = (data: { name: string; email: string }) => {
    setSavedData(data);
  };

  return (
    <div>
      {isEditing ? (
        <FormChild onUnmount={handleUnmount} />
      ) : (
        <div>Form Closed</div>
      )}
      <button onClick={() => setIsEditing((prev) => !prev)}>
        {isEditing ? "Close Form (Save)" : "Open Form"}
      </button>
      {savedData && (
        <div>
          <p>Saved Name: {savedData.name || "(empty)"}</p>
          <p>Saved Email: {savedData.email || "(empty)"}</p>
        </div>
      )}
      <p>💡 The callback always accesses the latest state values.</p>
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

    // Type in the form
    const nameInput = canvas.getByTestId("name-input");
    const emailInput = canvas.getByTestId("email-input");

    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "john@example.com");

    // Close the form to trigger unmount
    await userEvent.click(canvas.getByTestId("close-form-button"));

    // Verify the latest values were captured
    await waitFor(() => {
      expect(canvas.getByTestId("saved-name")).toHaveTextContent("John Doe");
      expect(canvas.getByTestId("saved-email")).toHaveTextContent(
        "john@example.com"
      );
    });
  },
};

export const ConditionalCleanup: StoryObj<typeof ConditionalCleanupDemo> = {
  render: () => <ConditionalCleanupDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useUnmount } from "@usefy/use-unmount";
import { useState } from "react";

function ConditionalChild({
  onUnmount,
  enabled,
}: {
  onUnmount: () => void;
  enabled: boolean;
}) {
  useUnmount(
    () => {
      onUnmount();
    },
    { enabled }
  );

  return (
    <div>
      <p>{enabled ? "Cleanup Enabled" : "Cleanup Disabled"}</p>
      <p>
        {enabled
          ? "Will call onUnmount when removed"
          : "Unmount callback is disabled"}
      </p>
    </div>
  );
}

function Example() {
  const [isVisible, setIsVisible] = useState(true);
  const [cleanupEnabled, setCleanupEnabled] = useState(true);
  const [unmountCount, setUnmountCount] = useState(0);

  const handleUnmount = () => {
    setUnmountCount((prev) => prev + 1);
  };

  return (
    <div>
      {isVisible ? (
        <ConditionalChild
          onUnmount={handleUnmount}
          enabled={cleanupEnabled}
        />
      ) : (
        <div>Component Unmounted</div>
      )}
      <div>
        <button onClick={() => setIsVisible((prev) => !prev)}>
          {isVisible ? "Unmount" : "Mount"}
        </button>
        <button onClick={() => setCleanupEnabled((prev) => !prev)}>
          {cleanupEnabled ? "Disable Cleanup" : "Enable Cleanup"}
        </button>
      </div>
      <div>
        <p>Cleanup Status: {cleanupEnabled ? "Enabled" : "Disabled"}</p>
        <p>Unmount Calls: {unmountCount}</p>
      </div>
      <p>💡 Use the enabled option to conditionally run cleanup.</p>
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

    // Initial state - cleanup enabled
    await expect(canvas.getByTestId("cleanup-status")).toHaveTextContent(
      "Enabled"
    );
    await expect(
      canvas.getByTestId("conditional-unmount-count")
    ).toHaveTextContent("0");

    // Unmount with cleanup enabled
    await userEvent.click(canvas.getByTestId("toggle-visibility-button"));

    await waitFor(() => {
      expect(canvas.getByTestId("conditional-unmount-count")).toHaveTextContent(
        "1"
      );
    });

    // Mount again
    await userEvent.click(canvas.getByTestId("toggle-visibility-button"));

    // Disable cleanup - this triggers the previous cleanup due to effect re-run
    // (enabled is in the dependency array, so changing it calls the old cleanup)
    await userEvent.click(canvas.getByTestId("toggle-enabled-button"));

    await waitFor(() => {
      expect(canvas.getByTestId("cleanup-status")).toHaveTextContent(
        "Disabled"
      );
    });

    // Count is now 2 because changing enabled from true->false
    // triggers the previous effect's cleanup function
    await waitFor(() => {
      expect(canvas.getByTestId("conditional-unmount-count")).toHaveTextContent(
        "2"
      );
    });

    // Unmount with cleanup disabled - no additional cleanup should run
    await userEvent.click(canvas.getByTestId("toggle-visibility-button"));

    // Count should still be 2 (no new cleanup was registered when enabled=false)
    await waitFor(() => {
      expect(canvas.getByTestId("conditional-unmount-count")).toHaveTextContent(
        "2"
      );
    });
  },
};

export const MultipleInstances: StoryObj<typeof MultipleInstancesDemo> = {
  render: () => <MultipleInstancesDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useUnmount } from "@usefy/use-unmount";
import { useState } from "react";

function InstanceChild({
  id,
  onUnmount,
}: {
  id: number;
  onUnmount: (id: number) => void;
}) {
  useUnmount(() => {
    onUnmount(id);
  });

  return <div>Instance #{id}</div>;
}

function Example() {
  const [instances, setInstances] = useState([1, 2, 3]);
  const [nextId, setNextId] = useState(4);
  const [unmountLog, setUnmountLog] = useState<
    Array<{ id: number; time: string }>
  >([]);

  const handleUnmount = (id: number) => {
    setUnmountLog((prev) => [
      { id, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ]);
  };

  const addInstance = () => {
    setInstances((prev) => [...prev, nextId]);
    setNextId((prev) => prev + 1);
  };

  const removeInstance = (id: number) => {
    setInstances((prev) => prev.filter((i) => i !== id));
  };

  return (
    <div>
      <div>
        {instances.map((id) => (
          <div key={id}>
            <InstanceChild id={id} onUnmount={handleUnmount} />
            <button onClick={() => removeInstance(id)}>Remove</button>
          </div>
        ))}
      </div>
      <button onClick={addInstance}>Add Instance</button>
      {unmountLog.length > 0 && (
        <div>
          <p>Unmount Log:</p>
          {unmountLog.map(({ id, time }, index) => (
            <div key={index}>
              Instance #{id} - {time}
            </div>
          ))}
        </div>
      )}
      <p>💡 Each instance has its own independent unmount callback.</p>
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

    // Remove first instance
    await userEvent.click(canvas.getByTestId("remove-1"));

    // Wait for unmount log to appear
    await waitFor(() => {
      expect(canvas.getByText(/Instance #1/)).toBeInTheDocument();
    });

    // Add a new instance
    await userEvent.click(canvas.getByTestId("add-instance"));

    // Remove all
    await userEvent.click(canvas.getByTestId("remove-all"));

    // Multiple unmount logs should appear
    await waitFor(() => {
      const logItems = canvas.getAllByText(/Instance #/);
      expect(logItems.length).toBeGreaterThanOrEqual(3);
    });
  },
};

export const AnalyticsTracking: StoryObj<typeof AnalyticsTrackingDemo> = {
  render: () => <AnalyticsTrackingDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useUnmount } from "@usefy/use-unmount";
import { useState } from "react";

function SectionView({
  section,
  onUnmount,
}: {
  section: string;
  onUnmount: () => void;
}) {
  useUnmount(onUnmount);

  return (
    <div>
      <h2>{section}</h2>
      <p>Currently viewing this section</p>
    </div>
  );
}

function Example() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [events, setEvents] = useState<
    Array<{ section: string; event: string; time: string }>
  >([]);

  const sections = ["Dashboard", "Settings", "Profile"];

  const logEvent = (section: string, event: string) => {
    setEvents((prev) => [
      { section, event, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ]);
  };

  return (
    <div>
      <div>
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => {
              logEvent(section, "view_start");
              setActiveSection(section);
            }}
          >
            {section}
          </button>
        ))}
      </div>
      {activeSection && (
        <SectionView
          key={activeSection}
          section={activeSection}
          onUnmount={() => logEvent(activeSection, "view_end")}
        />
      )}
      {events.length > 0 && (
        <div>
          <p>Analytics Events:</p>
          {events.map(({ section, event, time }, index) => (
            <div key={index}>
              {section} • {event} - {time}
            </div>
          ))}
        </div>
      )}
      <p>💡 Track page view duration and navigation with unmount callbacks.</p>
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

    // Click Dashboard
    await userEvent.click(canvas.getByTestId("section-dashboard"));

    await waitFor(() => {
      // Check that section view is displayed (unique text in section view)
      expect(
        canvas.getByText("Currently viewing this section")
      ).toBeInTheDocument();
      // Check that view_start event was logged
      expect(canvas.getByText("view_start")).toBeInTheDocument();
    });

    // Click Settings (should trigger Dashboard unmount)
    await userEvent.click(canvas.getByTestId("section-settings"));

    await waitFor(() => {
      // Section view should still be visible with new section
      expect(
        canvas.getByText("Currently viewing this section")
      ).toBeInTheDocument();
      // Check that view_end event was logged (Dashboard was unmounted)
      expect(canvas.getByText("view_end")).toBeInTheDocument();
    });
  },
};
