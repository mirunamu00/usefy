import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useStep } from "@usefy/use-step";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

// ============ Demo Components ============

const STEPS = [
  { title: "정보 입력", body: "Enter your details" },
  { title: "확인", body: "Review your order" },
  { title: "결제", body: "Complete payment" },
  { title: "완료", body: "All done! 🎉" },
];

/**
 * A 4-step checkout wizard (the ROADMAP example).
 */
function WizardDemo() {
  const [
    step,
    { goToNextStep, goToPrevStep, canGoToNextStep, canGoToPrevStep, reset },
  ] = useStep(STEPS.length);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useStep</h2>
      <p className={storyTheme.subtitle}>Multi-step wizard navigation</p>

      {/* Step indicator */}
      <ol className="flex gap-2 mb-6" data-testid="steps">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className={`flex-1 text-center px-2 py-2 rounded-lg text-sm border-2 ${
              i === step
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                : i < step
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-400"
            }`}
            data-testid={`indicator-${i}`}
          >
            {i < step ? "✓ " : `${i + 1}. `}
            {s.title}
          </li>
        ))}
      </ol>

      <div className={`${storyTheme.card} mb-6`} data-testid="panel">
        <p className="text-lg font-medium text-gray-800">{STEPS[step].title}</p>
        <p className="text-gray-500">{STEPS[step].body}</p>
        <p className="mt-2 text-sm text-gray-400" data-testid="progress">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          className={storyTheme.buttonNeutral}
          onClick={goToPrevStep}
          disabled={!canGoToPrevStep}
          data-testid="prev-btn"
        >
          이전
        </button>
        <button
          className={storyTheme.buttonPrimary}
          onClick={goToNextStep}
          disabled={!canGoToNextStep}
          data-testid="next-btn"
        >
          다음
        </button>
        <button
          className={storyTheme.buttonDanger}
          onClick={reset}
          data-testid="reset-btn"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/**
 * A carousel-style demo driven by `setStep` (jump to any dot).
 */
function CarouselDemo() {
  const slides = ["🏔️", "🌊", "🏜️", "🌆", "🌲"];
  const [index, { setStep, canGoToNextStep, goToNextStep }] = useStep(
    slides.length
  );

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Carousel</h2>
      <p className={storyTheme.subtitle}>
        Jump to any slide with <code>setStep</code>
      </p>

      <div
        className={`${storyTheme.gradientBox} text-center text-7xl mb-4`}
        data-testid="slide"
      >
        {slides[index]}
      </div>

      <div className="flex justify-center gap-2 mb-4" data-testid="dots">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`w-3 h-3 rounded-full transition-colors ${
              i === index ? "bg-indigo-600" : "bg-gray-300 hover:bg-gray-400"
            }`}
            data-testid={`dot-${i}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <button
        className={`${storyTheme.buttonPrimary} w-full`}
        onClick={goToNextStep}
        disabled={!canGoToNextStep}
        data-testid="next-slide"
      >
        Next slide
      </button>
    </div>
  );
}

// ============ Meta & Stories ============

const meta: Meta<typeof WizardDemo> = {
  title: "Hooks/useStep",
  component: WizardDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `A hook for navigating a fixed number of steps — wizards, multi-step forms, onboarding, and carousels.

## Features
- **0-based indexing** with automatic range validation (clamping)
- **\`goToNextStep\` / \`goToPrevStep\`** with **\`canGoToNextStep\` / \`canGoToPrevStep\`** flags
- **\`setStep(index | updater)\`** - Jump to any step (value or \`prev => next\`)
- **\`reset\`** - Back to the initial step
- **Stable controls** - Navigation functions keep their identity, safe as effect deps
- **Resilient to a changing \`count\`** - the current step stays within range
- **No-op skipping** - Moving past an edge doesn't trigger a re-render

## Basic Usage
\`\`\`tsx
const [step, { goToNextStep, goToPrevStep, canGoToNextStep }] = useStep(4);
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof WizardDemo>;

export const Wizard: Story = {
  render: () => <WizardDemo />,
  parameters: {
    docs: {
      description: { story: "A 4-step checkout flow with Prev/Next bounds." },
      source: {
        code: `import { useStep } from "@usefy/use-step";

function Wizard() {
  const [step, { goToNextStep, goToPrevStep, canGoToNextStep, canGoToPrevStep }] =
    useStep(4);

  return (
    <>
      {step === 0 && <InfoForm />}
      {step === 1 && <ConfirmForm />}
      {step === 2 && <PaymentForm />}
      {step === 3 && <CompleteMessage />}
      <button onClick={goToPrevStep} disabled={!canGoToPrevStep}>Back</button>
      <button onClick={goToNextStep} disabled={!canGoToNextStep}>Next</button>
    </>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("progress")).toHaveTextContent(
      "Step 1 of 4"
    );
    await expect(canvas.getByTestId("prev-btn")).toBeDisabled();

    // Advance to the last step.
    await userEvent.click(canvas.getByTestId("next-btn"));
    await userEvent.click(canvas.getByTestId("next-btn"));
    await userEvent.click(canvas.getByTestId("next-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("progress")).toHaveTextContent("Step 4 of 4");
      expect(canvas.getByTestId("next-btn")).toBeDisabled();
    });

    // Step back once.
    await userEvent.click(canvas.getByTestId("prev-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("progress")).toHaveTextContent("Step 3 of 4");
    });

    // Reset to the first step.
    await userEvent.click(canvas.getByTestId("reset-btn"));
    await waitFor(() => {
      expect(canvas.getByTestId("progress")).toHaveTextContent("Step 1 of 4");
      expect(canvas.getByTestId("prev-btn")).toBeDisabled();
    });
  },
};

export const Carousel: Story = {
  render: () => <CarouselDemo />,
  parameters: {
    docs: {
      description: {
        story: "Jump straight to any slide with `setStep`.",
      },
      source: {
        code: `import { useStep } from "@usefy/use-step";

function Carousel({ slides }) {
  const [index, { setStep }] = useStep(slides.length);

  return (
    <>
      <Slide data={slides[index]} />
      {slides.map((_, i) => (
        <Dot key={i} active={i === index} onClick={() => setStep(i)} />
      ))}
    </>
  );
}`,
        language: "tsx",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("slide")).toHaveTextContent("🏔️");

    // Jump directly to the 4th slide via its dot.
    await userEvent.click(canvas.getByTestId("dot-3"));
    await waitFor(() => {
      expect(canvas.getByTestId("slide")).toHaveTextContent("🌆");
    });

    // Advance once more.
    await userEvent.click(canvas.getByTestId("next-slide"));
    await waitFor(() => {
      expect(canvas.getByTestId("slide")).toHaveTextContent("🌲");
      expect(canvas.getByTestId("next-slide")).toBeDisabled();
    });
  },
};
