import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import {
  Confetti,
  useConfetti,
  fireConfetti,
  runPreset,
  celebration,
  fireworks,
  sideCannons,
  pride,
  stars,
  snow,
  textShape,
  pathShape,
  type ConfettiController,
  type PresetRun,
} from "@usefy/confetti";
import { SpotlightTour, type TourController } from "@usefy/spotlight-tour";
import { storyTheme } from "../styles/storyTheme";

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof Confetti> = {
  title: "confetti",
  component: Confetti,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Canvas confetti and celebration engine: performant particle bursts and continuous effects (snow, cannons) on a full-viewport overlay or your own canvas — driven by a hand-written, zero-dependency physics engine.

## Features
- **One API, three layers** — \`fireConfetti()\` one-liner → \`<Confetti />\` component / \`useConfetti()\` hook → framework-free \`createConfettiEngine\` (\`@usefy/confetti/headless\`)
- **Real particle physics** — gravity, drag, drift, 3D tumble, wobble; time-based (consistent at any fps), object-pooled (zero steady-state allocations)
- **Shapes** — squares, circles, strips, stars, emoji/text (\`textShape("🎉")\`), images (\`imageShape\`), custom \`Path2D\` (\`pathShape\`)
- **Presets** — \`celebration\`, \`fireworks\`, \`sideCannons\`, \`pride\`, \`stars\`, continuous \`snow\`/\`rain\` via \`runPreset\`
- **Respectful by default** — \`prefers-reduced-motion\` no-ops, rAF fully idle when nothing animates, pauses in background tabs, overlay never blocks clicks
- **SSR & StrictMode safe** — React 18 + 19

## Basic Usage
\`\`\`tsx
import { fireConfetti } from "@usefy/confetti";

<button onClick={() => fireConfetti()}>🎉 Celebrate</button>
\`\`\``,
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["overlay", "inline"],
      description: "Full-viewport portal overlay, or fill the parent element",
      table: {
        type: { summary: "'overlay' | 'inline'" },
        defaultValue: { summary: "'overlay'" },
      },
    },
    zIndex: {
      control: { type: "number", min: 0, step: 100 },
      description: "Stacking order of the overlay canvas",
      table: { type: { summary: "number" }, defaultValue: { summary: "1100" } },
    },
    reducedMotion: {
      control: "select",
      options: ["respect", "ignore"],
      description: "Whether prefers-reduced-motion turns effects into no-ops",
      table: {
        type: { summary: "'respect' | 'ignore'" },
        defaultValue: { summary: "'respect'" },
      },
    },
    fireOnMount: {
      description: "Fire one burst right after mount (true or FireOptions)",
      table: { type: { summary: "boolean | FireOptions" } },
    },
    onComplete: {
      description: "Called each time the engine goes idle",
      table: { type: { summary: "() => void" } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Confetti>;

// ============================================================================
// Quick start — the one-liner
// ============================================================================

const QUICK_START_CODE = `import { fireConfetti } from "@usefy/confetti";

function ShipItButton() {
  return (
    <button onClick={() => fireConfetti({ origin: { y: 0.8 }, spread: 70 })}>
      🚀 Ship it
    </button>
  );
}`;

export const QuickStart: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The 5-second quick start: fireConfetti() manages its own full-viewport canvas — created on first call, removed automatically after the confetti settles.",
      },
      source: { language: "tsx", code: QUICK_START_CODE },
    },
  },
  render: () => (
    <div className={storyTheme.containerCentered}>
      <h2 className={storyTheme.title}>fireConfetti()</h2>
      <p className={storyTheme.subtitle}>
        One import, one call. The overlay canvas appears for the burst and
        cleans itself up afterwards.
      </p>
      <button
        type="button"
        data-testid="quick-start-fire"
        className={storyTheme.buttonPrimary}
        onClick={() => void fireConfetti({ origin: { y: 0.8 }, spread: 70 })}
      >
        🚀 Ship it
      </button>
    </div>
  ),
};

// ============================================================================
// Preset gallery
// ============================================================================

const PRESET_GALLERY_CODE = `import { useRef, useState } from "react";
import {
  Confetti, runPreset,
  celebration, fireworks, sideCannons, pride, stars, snow,
  type ConfettiController, type PresetRun,
} from "@usefy/confetti";

function PresetGallery() {
  const confetti = useRef<ConfettiController>(null);
  const snowRun = useRef<PresetRun | null>(null);
  const [snowing, setSnowing] = useState(false);

  const play = (preset: typeof celebration) => {
    if (confetti.current) void runPreset(confetti.current, preset);
  };

  const toggleSnow = () => {
    if (snowing) {
      snowRun.current?.cancel(); // flakes already falling finish naturally
      snowRun.current = null;
      setSnowing(false);
    } else if (confetti.current) {
      snowRun.current = runPreset(confetti.current, snow);
      setSnowing(true);
    }
  };

  return (
    <>
      <Confetti controllerRef={confetti} />
      <button onClick={() => play(celebration)}>🎉 Celebration</button>
      <button onClick={() => play(fireworks)}>🎆 Fireworks</button>
      <button onClick={() => play(sideCannons)}>🎊 Side cannons</button>
      <button onClick={() => play(pride)}>🏳️‍🌈 Pride</button>
      <button onClick={() => play(stars)}>⭐ Stars</button>
      <button onClick={toggleSnow}>{snowing ? "⏹ Stop snow" : "❄️ Snow"}</button>
      <button onClick={() => confetti.current?.clear()}>Clear</button>
    </>
  );
}`;

export const PresetGallery: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Every built-in preset on one overlay — bursts, timed cannons, and the continuous snow toggle (runPreset returns a cancelable run handle).",
      },
      source: { language: "tsx", code: PRESET_GALLERY_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const confetti = useRef<ConfettiController>(null);
      const snowRun = useRef<PresetRun | null>(null);
      const [snowing, setSnowing] = useState(false);

      const play = (preset: typeof celebration) => {
        if (confetti.current) void runPreset(confetti.current, preset);
      };

      const toggleSnow = () => {
        if (snowing) {
          snowRun.current?.cancel();
          snowRun.current = null;
          setSnowing(false);
        } else if (confetti.current) {
          snowRun.current = runPreset(confetti.current, snow);
          setSnowing(true);
        }
      };

      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Preset gallery</h2>
          <p className={storyTheme.subtitle}>
            Click a preset — bursts play out on the full-viewport overlay;
            snow keeps falling until you stop it.
          </p>
          <Confetti controllerRef={confetti} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="button" data-testid="preset-celebration" className={storyTheme.buttonPrimary} onClick={() => play(celebration)}>
              🎉 Celebration
            </button>
            <button type="button" data-testid="preset-fireworks" className={storyTheme.buttonPrimary} onClick={() => play(fireworks)}>
              🎆 Fireworks
            </button>
            <button type="button" data-testid="preset-side-cannons" className={storyTheme.buttonPrimary} onClick={() => play(sideCannons)}>
              🎊 Side cannons
            </button>
            <button type="button" data-testid="preset-pride" className={storyTheme.buttonPrimary} onClick={() => play(pride)}>
              🏳️‍🌈 Pride
            </button>
            <button type="button" data-testid="preset-stars" className={storyTheme.buttonPrimary} onClick={() => play(stars)}>
              ⭐ Stars
            </button>
            <button type="button" data-testid="preset-snow" className={snowing ? storyTheme.buttonDanger : storyTheme.buttonSecondary} onClick={toggleSnow}>
              {snowing ? "⏹ Stop snow" : "❄️ Snow"}
            </button>
            <button type="button" data-testid="preset-clear" className={storyTheme.buttonNeutral} onClick={() => confetti.current?.clear()}>
              Clear
            </button>
          </div>
          <div
            data-testid="night-sky"
            style={{
              marginTop: 20,
              height: 340,
              borderRadius: 16,
              background: "linear-gradient(180deg, #0b1026 0%, #1a2151 60%, #2b2d5e 100%)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 18,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
              ❄️ The white snowfall shows best over this night sky
            </span>
          </div>
        </div>
      );
    };
    return <Demo />;
  },
};

// ============================================================================
// Emoji & brand shapes
// ============================================================================

const SHAPES_CODE = `import { useRef } from "react";
import { Confetti, textShape, pathShape, type ConfettiController } from "@usefy/confetti";

// Emoji raster once and draw as sprites; Path2D shapes fill with the palette.
const emojiMix = [textShape("🎉", { size: 26 }), textShape("🎊", { size: 24 })];
const triangle = pathShape(() => {
  const p = new Path2D();
  p.moveTo(0.5, 0); p.lineTo(1, 1); p.lineTo(0, 1); p.closePath();
  return p;
}, { size: 12 });

function BrandBurst() {
  const confetti = useRef<ConfettiController>(null);
  return (
    <>
      <Confetti controllerRef={confetti} />
      <button onClick={() => confetti.current?.fire({ shapes: emojiMix, count: 60 })}>
        Emoji burst
      </button>
      <button onClick={() => confetti.current?.fire({ shapes: [triangle, "star"], count: 80 })}>
        Brand shapes
      </button>
    </>
  );
}`;

const emojiMix = [textShape("🎉", { size: 26 }), textShape("🎊", { size: 24 })];
const brandTriangle = pathShape(
  () => {
    const p = new Path2D();
    p.moveTo(0.5, 0);
    p.lineTo(1, 1);
    p.lineTo(0, 1);
    p.closePath();
    return p;
  },
  { size: 12, key: "story-triangle" },
);

export const EmojiAndBrandShapes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Custom shapes: emoji sprites via textShape and a palette-colored Path2D triangle via pathShape, mixed freely with the built-ins.",
      },
      source: { language: "tsx", code: SHAPES_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const confetti = useRef<ConfettiController>(null);
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Emoji &amp; brand shapes</h2>
          <p className={storyTheme.subtitle}>
            textShape("🎉") rasters the glyph once and draws it as a tumbling
            sprite; pathShape fills your Path2D with the burst palette.
          </p>
          <Confetti controllerRef={confetti} />
          <div className={storyTheme.buttonGroup}>
            <button
              type="button"
              data-testid="shapes-emoji"
              className={storyTheme.buttonPrimary}
              onClick={() =>
                confetti.current?.fire({ shapes: emojiMix, count: 60, spread: 80 })
              }
            >
              🎉 Emoji burst
            </button>
            <button
              type="button"
              data-testid="shapes-brand"
              className={storyTheme.buttonSecondary}
              onClick={() =>
                confetti.current?.fire({
                  shapes: [brandTriangle, "star"],
                  count: 80,
                  spread: 90,
                })
              }
            >
              △ Brand shapes
            </button>
          </div>
        </div>
      );
    };
    return <Demo />;
  },
};

// ============================================================================
// Origin from click
// ============================================================================

const ORIGIN_CLICK_CODE = `import { useRef } from "react";
import { Confetti, type ConfettiController } from "@usefy/confetti";

function ClickToBurst() {
  const confetti = useRef<ConfettiController>(null);

  const burstAtPointer = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    void confetti.current?.fire({
      origin: {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      },
      count: 50,
      startVelocity: 25,
      spread: 360,
    });
  };

  return (
    <div onClick={burstAtPointer} style={{ position: "relative", height: 320 }}>
      {/* inline variant fills this container instead of the viewport */}
      <Confetti variant="inline" controllerRef={confetti} />
      Click anywhere in here
    </div>
  );
}`;

export const OriginFromClick: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The inline variant fills its container; clicking converts the pointer position to normalized origin coordinates and bursts right there.",
      },
      source: { language: "tsx", code: ORIGIN_CLICK_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const confetti = useRef<ConfettiController>(null);
      const burstAtPointer = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        void confetti.current?.fire({
          origin: {
            x: (event.clientX - rect.left) / rect.width,
            y: (event.clientY - rect.top) / rect.height,
          },
          count: 50,
          startVelocity: 25,
          spread: 360,
        });
      };
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Origin from click</h2>
          <p className={storyTheme.subtitle}>
            Click anywhere in the area below — the burst starts exactly at the
            pointer.
          </p>
          <div
            data-testid="click-area"
            onClick={burstAtPointer}
            className={storyTheme.cardInfo}
            style={{
              position: "relative",
              height: 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "crosshair",
              userSelect: "none",
              overflow: "hidden",
            }}
          >
            <Confetti variant="inline" controllerRef={confetti} />
            <span style={{ color: "#6366f1", fontWeight: 600 }}>
              Click anywhere in here ✨
            </span>
          </div>
        </div>
      );
    };
    return <Demo />;
  },
};

// ============================================================================
// useConfetti — component-scoped canvas
// ============================================================================

const USE_CONFETTI_CODE = `import { useConfetti } from "@usefy/confetti";

function CardCelebration() {
  const { canvasRef, fire, isActive } = useConfetti();

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          pointerEvents: "none",
        }}
      />
      <button disabled={isActive} onClick={() => fire({ origin: { y: 0.9 } })}>
        {isActive ? "Celebrating…" : "🎉 Celebrate in this card"}
      </button>
    </div>
  );
}`;

export const UseConfettiInline: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The useConfetti hook drives a canvas you own — isActive re-renders only when the animation starts or ends, never per frame.",
      },
      source: { language: "tsx", code: USE_CONFETTI_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const { canvasRef, fire, isActive } = useConfetti();
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>useConfetti</h2>
          <p className={storyTheme.subtitle}>
            A component-scoped canvas: the confetti stays inside the card, and
            the button reflects the engine's idle↔active state.
          </p>
          <div
            className={storyTheme.card}
            style={{
              position: "relative",
              height: 280,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />
            <button
              type="button"
              data-testid="hook-fire"
              className={storyTheme.buttonPrimary}
              disabled={isActive}
              onClick={() => void fire({ origin: { y: 0.9 }, spread: 70 })}
            >
              {isActive ? "Celebrating…" : "🎉 Celebrate in this card"}
            </button>
          </div>
        </div>
      );
    };
    return <Demo />;
  },
};

// ============================================================================
// SpotlightTour integration — celebrate onFinish
// ============================================================================

const TOUR_FINISH_CODE = `import { useRef } from "react";
import { Confetti, runPreset, celebration, type ConfettiController } from "@usefy/confetti";
import { SpotlightTour, type TourController } from "@usefy/spotlight-tour";

function OnboardingWithCelebration() {
  const tour = useRef<TourController>(null);
  const confetti = useRef<ConfettiController>(null);

  return (
    <>
      <button onClick={() => tour.current?.start(0)}>Start tour</button>
      <Dashboard />

      <SpotlightTour
        controllerRef={tour}
        steps={[
          { target: "#search", title: "Search", content: "Find anything from here." },
          { target: "#create", title: "Create", content: "Your first project starts here." },
        ]}
        onFinish={() => {
          if (confetti.current) void runPreset(confetti.current, celebration);
        }}
      />
      {/* zIndex above the tour's 1000 so the burst lands on top */}
      <Confetti controllerRef={confetti} />
    </>
  );
}`;

export const TourFinishCelebration: Story = {
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "The natural pairing: a two-step spotlight tour whose Done button fires the celebration preset over the page.",
      },
      source: { language: "tsx", code: TOUR_FINISH_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const tour = useRef<TourController>(null);
      const confetti = useRef<ConfettiController>(null);
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Tour finish → confetti</h2>
          <p className={storyTheme.subtitle}>
            Run the mini tour to the end — finishing it triggers the
            celebration preset.
          </p>
          <button
            type="button"
            data-testid="tour-start"
            className={storyTheme.buttonPrimary}
            onClick={() => tour.current?.start(0)}
          >
            Start tour
          </button>
          <div className={storyTheme.card} style={{ marginTop: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                id="confetti-tour-search"
                className={storyTheme.input}
                placeholder="Search projects…"
                style={{ flex: 1 }}
              />
            </div>
            <button
              id="confetti-tour-create"
              type="button"
              className={storyTheme.buttonSuccess}
            >
              + Create project
            </button>
          </div>
          <SpotlightTour
            controllerRef={tour}
            steps={[
              {
                target: "#confetti-tour-search",
                title: "Search",
                content: "Find anything from here.",
              },
              {
                target: "#confetti-tour-create",
                title: "Create",
                content: "Your first project starts here. Hit Done to finish!",
              },
            ]}
            onFinish={() => {
              if (confetti.current) void runPreset(confetti.current, celebration);
            }}
          />
          <Confetti controllerRef={confetti} />
        </div>
      );
    };
    return <Demo />;
  },
};

// ============================================================================
// Interaction test (auto-runs — not part of the docs page)
// ============================================================================

export const InteractionTest: Story = {
  tags: ["!autodocs"],
  parameters: {
    docs: {
      description: {
        story:
          "Automated check (auto-runs when opened): fires a short burst on the hook demo and asserts the active → idle lifecycle.",
      },
      source: { language: "tsx", code: USE_CONFETTI_CODE },
    },
  },
  render: () => {
    const Demo = () => {
      const { canvasRef, fire, isActive } = useConfetti();
      return (
        <div className={storyTheme.container}>
          <h2 className={storyTheme.title}>Interaction test</h2>
          <p className={storyTheme.subtitle}>
            This story auto-runs: it fires a short burst and waits for the
            engine to go idle again.
          </p>
          <div
            className={storyTheme.card}
            style={{ position: "relative", height: 200, overflow: "hidden" }}
          >
            <canvas
              ref={canvasRef}
              data-testid="test-canvas"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />
            <button
              type="button"
              data-testid="test-fire"
              className={storyTheme.buttonPrimary}
              onClick={() => void fire({ count: 40, lifetime: 900 })}
            >
              Fire test burst
            </button>
            <p data-testid="test-status" style={{ marginTop: 12 }}>
              {isActive ? "active" : "idle"}
            </p>
          </div>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByTestId("test-status");
    await expect(status).toHaveTextContent("idle");

    await userEvent.click(canvas.getByTestId("test-fire"));
    // Engine flips active synchronously on fire.
    await waitFor(() => expect(status).toHaveTextContent("active"));

    // The 900ms burst dies out and the rAF loop provably idles again.
    await waitFor(() => expect(status).toHaveTextContent("idle"), {
      timeout: 5000,
    });
  },
};
