import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import {
  SpotlightTour,
  SpotlightBeacon,
  type TourController,
} from "@usefy/spotlight-tour";
import { storyTheme } from "../styles/storyTheme";

// ============================================================================
// Demo content — a small fake dashboard the tours walk through
// ============================================================================

function Dashboard({ idPrefix }: { idPrefix: string }) {
  return (
    <div className={storyTheme.card} style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          id={`${idPrefix}-search`}
          data-testid={`${idPrefix}-search`}
          className={storyTheme.input}
          placeholder="Search projects…"
          style={{ flex: 1 }}
        />
        <button
          id={`${idPrefix}-notifications`}
          type="button"
          className={storyTheme.buttonNeutral}
          aria-label="Notifications"
        >
          🔔
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div
          id={`${idPrefix}-stats`}
          className={storyTheme.statBox}
          style={{ flex: 1, padding: 12 }}
        >
          <p className={storyTheme.statLabel}>Active projects</p>
          <p className={storyTheme.statValue}>12</p>
        </div>
        <div className={storyTheme.card} style={{ flex: 1, padding: 12 }}>
          <p className={storyTheme.statLabel}>Deployments today</p>
          <p className={storyTheme.statValue}>7</p>
        </div>
      </div>
      <button
        id={`${idPrefix}-create`}
        data-testid={`${idPrefix}-create`}
        type="button"
        className={storyTheme.buttonPrimary}
      >
        + Create project
      </button>
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SpotlightTour> = {
  title: "spotlight-tour",
  component: SpotlightTour,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `A guided onboarding tour: dims the page, cuts an animated spotlight hole around each step's target, and shows a step tooltip beside it. Ships as a styled \`<SpotlightTour />\` (plus a pulsing \`<SpotlightBeacon />\` invitation dot), with the whole state machine also available headless via \`@usefy/spotlight-tour/headless\`.

## Features
- **Spotlight overlay** — SVG-mask hole that morphs from target to target with CSS transitions; clicks pass through the hole (\`spotlightClicks\`)
- **Step model** — per-step \`placement\`, \`spotlightPadding\`/\`Radius\`, missing-target policies (\`skip\` / \`wait\` / \`center\`), centered modal steps, \`onEnter\`/\`onLeave\`
- **Interaction gates** — \`advanceOn: { event, selector? }\` disables Next (with a hint) until the user performs the action, then auto-advances
- **Enterprise a11y** — focus trap + restore, \`role="dialog"\` + \`aria-modal\` + labelling, \`aria-live\` step announcements, ←/→/Enter/Esc keys, scroll lock, reduced-motion support
- **Auto-scroll** — off-screen targets scroll into view before the step shows
- **Persistence** — \`tourId\` remembers finished/skipped tours (\`resetTour\` clears)
- **Theming** — \`--usefy-tour-*\` CSS variables, \`theme="light|dark|system"\`, per-part \`classNames\`, full \`renderStep\` replacement
- **Controlled or uncontrolled** — \`open\`/\`step\` props or \`defaultOpen\`/\`defaultStep\`, plus an imperative \`controllerRef\`
- **SSR-safe** — portals only after mount; nothing renders on the server

## Basic Usage
\`\`\`tsx
import { SpotlightTour } from "@usefy/spotlight-tour";

function App() {
  return (
    <SpotlightTour
      defaultOpen
      steps={[
        { title: "Welcome!", content: "A quick look around." }, // centered
        { target: "#search", title: "Search", content: "Find anything here." },
        { target: "#create", content: "Click to create your first project.",
          advanceOn: { event: "click" } }, // gated
      ]}
      onFinish={() => console.log("toured!")}
    />
  );
}
\`\`\``,
      },
    },
  },
  argTypes: {
    steps: {
      description: "The tour steps (targets, content, per-step behavior)",
      table: { type: { summary: "TourStep[]" } },
    },
    theme: {
      control: "select",
      options: ["light", "dark", "system"],
      description: "Color theme; 'system' follows prefers-color-scheme",
      table: {
        type: { summary: "'light' | 'dark' | 'system'" },
        defaultValue: { summary: "'system'" },
      },
    },
    maskColor: {
      control: "color",
      description: "Dim overlay color",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "'rgba(0 0 0 / 0.55)'" },
      },
    },
    transitionDuration: {
      control: { type: "number", min: 0, step: 50 },
      description:
        "Spotlight/tooltip transition ms (0 disables; forced to 0 under reduced motion)",
      table: { type: { summary: "number" }, defaultValue: { summary: "300" } },
    },
    overlayClick: {
      control: "select",
      options: ["ignore", "close", "next"],
      description: "What a click on the dimmed area does",
      table: {
        type: { summary: "'ignore' | 'close' | 'next'" },
        defaultValue: { summary: "'ignore'" },
      },
    },
    keyboard: {
      control: "boolean",
      description: "←/→/Enter/Esc navigation",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    scrollLock: {
      control: "boolean",
      description: "Lock background scroll while open",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    tourId: {
      control: "text",
      description:
        "Persistence key — a finished/skipped tour will not auto-open again",
      table: { type: { summary: "string" } },
    },
    zIndex: {
      control: { type: "number", min: 0, step: 100 },
      description: "z-index of the portal layer",
      table: { type: { summary: "number" }, defaultValue: { summary: "1000" } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SpotlightTour>;

/** The tour portals into document.body — query there, not the canvas div. */
const bodyOf = (canvasElement: HTMLElement) =>
  within(canvasElement.ownerDocument.body);

// ============================================================================
// App onboarding
// ============================================================================

const APP_ONBOARDING_CODE = `import { useRef } from "react";
import { SpotlightTour, type TourController } from "@usefy/spotlight-tour";

function App() {
  const controller = useRef<TourController>(null);

  return (
    <>
      <button onClick={() => controller.current?.start()}>Start tour</button>
      <Dashboard />

      <SpotlightTour
        controllerRef={controller}
        steps={[
          // A centered welcome step — no target.
          { title: "Welcome aboard! 👋", content: "Let's take a quick look around your new dashboard." },
          { target: "#search", title: "Search", content: "Find any project, deployment, or teammate from here." },
          { target: "#stats", title: "Your numbers", content: "Live counts of projects and deployments.", placement: "bottom" },
          // A gated step: Next stays disabled until the button is clicked.
          { target: "#create", title: "Try it", content: "Click “Create project” to continue the tour.",
            advanceOn: { event: "click" } },
          { target: "#notifications", content: "We'll nudge you here when a deployment finishes." },
        ]}
        onFinish={() => console.log("onboarding complete")}
      />
    </>
  );
}`;

export const AppOnboarding: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A five-step onboarding over a fake dashboard: a centered welcome, three spotlighted steps, and a gated step that only advances once the highlighted button is actually clicked.",
      },
      source: { language: "tsx", code: APP_ONBOARDING_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const controller = useRef<TourController>(null);
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>App onboarding</h2>
          <p className={storyTheme.subtitle}>
            A five-step guided tour across the dashboard below — including a
            centered welcome and a gated “click to continue” step.
          </p>
          <button
            type="button"
            data-testid="start-onboarding"
            className={storyTheme.buttonPrimary}
            onClick={() => controller.current?.start()}
          >
            Start tour
          </button>
          <Dashboard idPrefix="ob" />
          <SpotlightTour
            controllerRef={controller}
            steps={[
              {
                title: "Welcome aboard! 👋",
                content: "Let's take a quick look around your new dashboard.",
              },
              {
                target: "#ob-search",
                title: "Search",
                content:
                  "Find any project, deployment, or teammate from here.",
              },
              {
                target: "#ob-stats",
                title: "Your numbers",
                content: "Live counts of projects and deployments.",
                placement: "bottom",
              },
              {
                target: "#ob-create",
                title: "Try it",
                content: "Click “Create project” to continue the tour.",
                advanceOn: { event: "click" },
              },
              {
                target: "#ob-notifications",
                content: "We'll nudge you here when a deployment finishes.",
              },
            ]}
          />
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);

    await userEvent.click(canvas.getByTestId("start-onboarding"));

    // Step 1: centered welcome.
    const dialog = await body.findByRole("dialog");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(body.getByText("Welcome aboard! 👋")).toBeVisible();
    await expect(body.getByText("1 / 5")).toBeVisible();

    // Click through the spotlighted steps.
    await userEvent.click(body.getByText("Next"));
    await body.findByText("Search");
    await userEvent.click(body.getByText("Next"));
    await body.findByText("Your numbers");
    await userEvent.click(body.getByText("Next"));

    // Step 4 is gated: Next is disabled with a visible hint…
    await body.findByText("Try it");
    await expect(body.getByText("Next")).toBeDisabled();
    await expect(
      body.getByText("Complete the highlighted action to continue")
    ).toBeVisible();
    // …until the highlighted button is clicked, which auto-advances.
    await userEvent.click(canvas.getByTestId("ob-create"));
    await body.findByText(/nudge you here/);

    // Last step shows Done, which finishes the tour.
    await userEvent.click(body.getByText("Done"));
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector("[data-tour-root]")
      ).toBeNull()
    );
  },
};

// ============================================================================
// Keyboard navigation
// ============================================================================

const KEYBOARD_CODE = `import { SpotlightTour } from "@usefy/spotlight-tour";

// ArrowRight / Enter advance, ArrowLeft goes back, Escape dismisses (fires
// onSkip). Pass keyboard={false} to turn all of it off — the focus trap stays.
<SpotlightTour
  defaultOpen
  steps={[
    { target: "#search", title: "Search", content: "Arrow keys navigate this tour." },
    { target: "#create", content: "Escape closes it from anywhere." },
  ]}
  onSkip={(at) => console.log(\`dismissed at step \${at}\`)}
/>`;

export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Full keyboard control: ArrowRight/ArrowLeft move between steps and Escape dismisses the tour (Enter also advances unless a button is focused).",
      },
      source: { language: "tsx", code: KEYBOARD_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const controller = useRef<TourController>(null);
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Keyboard navigation</h2>
          <p className={storyTheme.subtitle}>
            Start the tour, then drive it with ← → and Esc.
          </p>
          <button
            type="button"
            data-testid="start-keyboard"
            className={storyTheme.buttonPrimary}
            onClick={() => controller.current?.start()}
          >
            Start tour
          </button>
          <Dashboard idPrefix="kb" />
          <SpotlightTour
            controllerRef={controller}
            steps={[
              {
                target: "#kb-search",
                title: "Search",
                content: "Arrow keys navigate this tour.",
              },
              {
                target: "#kb-create",
                title: "Create",
                content: "Escape closes it from anywhere.",
              },
            ]}
          />
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);

    await userEvent.click(canvas.getByTestId("start-keyboard"));
    await body.findByText("Arrow keys navigate this tour.");

    await userEvent.keyboard("{ArrowRight}");
    await body.findByText("Escape closes it from anywhere.");

    await userEvent.keyboard("{ArrowLeft}");
    await body.findByText("Arrow keys navigate this tour.");

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector("[data-tour-root]")
      ).toBeNull()
    );
  },
};

// ============================================================================
// Beacon-triggered tour
// ============================================================================

const BEACON_CODE = `import { useRef } from "react";
import { SpotlightTour, SpotlightBeacon, type TourController } from "@usefy/spotlight-tour";

function App() {
  const controller = useRef<TourController>(null);

  return (
    <>
      {/* A pulsing dot pinned to the feature's corner invites the tour. */}
      <SpotlightBeacon
        target="#new-feature"
        onActivate={() => controller.current?.start()}
      />
      <NewFeatureCard id="new-feature" />

      <SpotlightTour
        controllerRef={controller}
        steps={[
          { target: "#new-feature", title: "New: deploy previews",
            content: "Every PR now gets its own preview URL." },
        ]}
      />
    </>
  );
}`;

export const BeaconTriggered: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A pulsing SpotlightBeacon pinned to a feature card starts the tour on click — the classic “something new here” affordance.",
      },
      source: { language: "tsx", code: BEACON_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const controller = useRef<TourController>(null);
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Beacon-triggered</h2>
          <p className={storyTheme.subtitle}>
            Click the pulsing dot on the card's top-right corner.
          </p>
          <SpotlightBeacon
            target="#beacon-feature"
            onActivate={() => controller.current?.start()}
          />
          <div
            id="beacon-feature"
            className={storyTheme.cardInfo}
            style={{ marginTop: 16, padding: 20 }}
          >
            <p className={storyTheme.statLabel}>New: deploy previews</p>
            <p className={storyTheme.statTextSecondary}>
              Every pull request now gets its own preview URL.
            </p>
          </div>
          <SpotlightTour
            controllerRef={controller}
            steps={[
              {
                target: "#beacon-feature",
                title: "New: deploy previews",
                content: "Every PR now gets its own preview URL.",
              },
            ]}
          />
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const body = bodyOf(canvasElement);

    // The beacon is a real, labelled button portaled to the body.
    const beacon = await body.findByLabelText("Start tour");
    await userEvent.click(beacon);

    await body.findByRole("dialog");
    await body.findByText("Every PR now gets its own preview URL.");

    await userEvent.click(body.getByText("Done"));
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector("[data-tour-root]")
      ).toBeNull()
    );
  },
};

// ============================================================================
// Dark theme
// ============================================================================

const DARK_CODE = `import { SpotlightTour } from "@usefy/spotlight-tour";

// theme="dark" forces the dark palette; "system" (default) follows
// prefers-color-scheme. Everything is themable via --usefy-tour-* variables.
<SpotlightTour
  theme="dark"
  maskColor="rgba(2 6 23 / 0.7)"
  steps={[{ target: "#search", title: "Search", content: "Dark-mode tooltip." }]}
  defaultOpen
/>`;

export const DarkTheme: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The same tour with theme=\"dark\": tooltip surface, buttons, and dots switch to the dark palette (set via --usefy-tour-* variables).",
      },
      source: { language: "tsx", code: DARK_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const controller = useRef<TourController>(null);
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Dark theme</h2>
          <p className={storyTheme.subtitle}>
            The tooltip renders with the dark palette regardless of the page
            theme.
          </p>
          <button
            type="button"
            data-testid="start-dark"
            className={storyTheme.buttonPrimary}
            onClick={() => controller.current?.start()}
          >
            Start tour
          </button>
          <Dashboard idPrefix="dk" />
          <SpotlightTour
            controllerRef={controller}
            theme="dark"
            maskColor="rgba(2 6 23 / 0.7)"
            steps={[
              {
                target: "#dk-search",
                title: "Search",
                content: "Dark-mode tooltip surface and controls.",
              },
              {
                target: "#dk-create",
                content: "Same tour, darker clothes.",
              },
            ]}
          />
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);

    await userEvent.click(canvas.getByTestId("start-dark"));
    await body.findByRole("dialog");
    await body.findByText("Dark-mode tooltip surface and controls.");

    await userEvent.click(body.getByLabelText("Close"));
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector("[data-tour-root]")
      ).toBeNull()
    );
  },
};

// ============================================================================
// Custom renderStep
// ============================================================================

const RENDER_STEP_CODE = `import { SpotlightTour } from "@usefy/spotlight-tour";

// renderStep replaces the whole tooltip UI. Spread ctx.tooltipProps on your
// element for the dialog semantics; positioning stays automatic.
<SpotlightTour
  steps={[
    { target: "#search", content: "Find anything from here." },
    { target: "#create", content: "Start something new." },
  ]}
  renderStep={({ step, index, count, controller, tooltipProps }) => (
    <section
      {...tooltipProps}
      style={{ background: "#1e1b4b", color: "#e0e7ff", padding: 20,
               borderRadius: 14, maxWidth: 320, fontFamily: "system-ui" }}
    >
      <p style={{ margin: 0 }}>{step.content}</p>
      <button
        style={{ marginTop: 12 }}
        onClick={() => (index + 1 < count ? controller.next() : controller.finish())}
      >
        {index + 1 < count ? \`Got it (\${index + 1}/\${count})\` : "Finish"}
      </button>
    </section>
  )}
  defaultOpen
/>`;

export const CustomRenderStep: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "renderStep fully replaces the default tooltip with your own UI while the hook keeps handling positioning, focus, and navigation.",
      },
      source: { language: "tsx", code: RENDER_STEP_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const controller = useRef<TourController>(null);
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Custom renderStep</h2>
          <p className={storyTheme.subtitle}>
            The tooltip below is entirely custom — the tour only positions it.
          </p>
          <button
            type="button"
            data-testid="start-custom"
            className={storyTheme.buttonPrimary}
            onClick={() => controller.current?.start()}
          >
            Start tour
          </button>
          <Dashboard idPrefix="cs" />
          <SpotlightTour
            controllerRef={controller}
            steps={[
              { target: "#cs-search", content: "Find anything from here." },
              { target: "#cs-create", content: "Start something new." },
            ]}
            renderStep={({ step, index, count, controller: tour, tooltipProps }) => (
              <section
                {...tooltipProps}
                data-testid="custom-step"
                style={{
                  background: "#1e1b4b",
                  color: "#e0e7ff",
                  padding: 20,
                  borderRadius: 14,
                  maxWidth: 320,
                  fontFamily: "system-ui",
                }}
              >
                <p style={{ margin: 0 }}>{step.content}</p>
                <button
                  type="button"
                  className={storyTheme.buttonSecondary}
                  style={{ marginTop: 12 }}
                  onClick={() =>
                    index + 1 < count ? tour.next() : tour.finish()
                  }
                >
                  {index + 1 < count ? `Got it (${index + 1}/${count})` : "Finish"}
                </button>
              </section>
            )}
          />
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = bodyOf(canvasElement);

    await userEvent.click(canvas.getByTestId("start-custom"));
    const custom = await body.findByTestId("custom-step");
    // ctx.tooltipProps carries the dialog semantics onto the custom element.
    await expect(custom).toHaveAttribute("role", "dialog");

    await userEvent.click(body.getByText("Got it (1/2)"));
    await body.findByText("Start something new.");
    await userEvent.click(body.getByText("Finish"));
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector("[data-tour-root]")
      ).toBeNull()
    );
  },
};
