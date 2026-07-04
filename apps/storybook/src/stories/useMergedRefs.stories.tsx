import React, { forwardRef, useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useMergedRefs } from "@usefy/use-merged-refs";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

/**
 * A `forwardRef` input that ALSO needs its own ref — it measures its rendered
 * width through a local ref while still exposing the node to the parent's
 * forwarded ref. `useMergedRefs` lets both point at the same `<input>`.
 */
const MeasuredInput = forwardRef<HTMLInputElement, { placeholder?: string }>(
  function MeasuredInput({ placeholder }, forwardedRef) {
    const localRef = useRef<HTMLInputElement>(null);
    const ref = useMergedRefs(localRef, forwardedRef);
    const [width, setWidth] = useState(0);

    useEffect(() => {
      // Read from the LOCAL ref — proof it received the node too.
      if (localRef.current) {
        setWidth(Math.round(localRef.current.getBoundingClientRect().width));
      }
    }, []);

    return (
      <div>
        <input
          ref={ref}
          placeholder={placeholder}
          data-testid="input"
          className={storyTheme.input}
        />
        <p className={`${storyTheme.statLabel} mt-2`}>
          measured width (via local ref):{" "}
          <span className={storyTheme.statValue} data-testid="width">
            {width}px
          </span>
        </p>
      </div>
    );
  }
);

function Demo() {
  // The PARENT keeps its own ref to the same input — proof the forwarded ref
  // received the node.
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>useMergedRefs</h2>
      <p className={storyTheme.subtitle}>
        One node, two refs — a component's local ref and a forwarded ref at once
      </p>

      <div className={storyTheme.card}>
        <MeasuredInput ref={inputRef} placeholder="Type here…" />

        <button
          className={`${storyTheme.buttonPrimary} mt-4`}
          data-testid="focus"
          onClick={() => inputRef.current?.focus()}
        >
          Focus from parent
        </button>

        <p className={`${storyTheme.statTextSecondary} text-sm mt-3`}>
          The button focuses the input through the <em>parent's</em> forwarded
          ref, while the width above is read from the component's <em>local</em>{" "}
          ref — both pointing at the same <code>&lt;input&gt;</code>.
        </p>
      </div>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: "Hooks/useMergedRefs",
  component: Demo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `Merge multiple refs (callback or object) into a single stable callback ref — the missing piece for \`forwardRef\` components that also need their own ref to a node.

## Features
- **Any ref shape** — callback refs, ref objects, and \`null\` / \`undefined\`, mixed freely
- **React 18 & 19** — supports React 19 callback-ref cleanup functions, with the classic "set null on unmount" fallback
- **Stable identity** — memoized on the given refs, so React re-runs the ref only when a ref actually changes
- **\`mergeRefs\` helper** — a non-hook version for composing refs outside render

## Basic Usage
\`\`\`tsx
const ref = useMergedRefs(localRef, forwardedRef);
<input ref={ref} />;
\`\`\``,
      },
    },
  },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {
  render: () => <Demo />,
  parameters: {
    docs: {
      description: {
        story:
          "A `forwardRef` input measures itself through a local ref while the parent focuses it through the forwarded ref — both refs share the one DOM node.",
      },
      source: {
        language: "tsx",
        code: `import { forwardRef, useRef } from "react";
import { useMergedRefs } from "@usefy/use-merged-refs";

const Input = forwardRef<HTMLInputElement, InputProps>((props, forwardedRef) => {
  // The component needs its own ref (to measure, focus, observe…)
  // *and* must honor the forwarded ref. Merge them into one.
  const localRef = useRef<HTMLInputElement>(null);
  const ref = useMergedRefs(localRef, forwardedRef);

  return <input {...props} ref={ref} />;
});

// Parent keeps its own ref to the same node:
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </>
  );
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Local ref measured the node (non-zero width).
    await waitFor(() =>
      expect(canvas.getByTestId("width")).not.toHaveTextContent("0px")
    );

    // Forwarded ref reaches the same node — the parent can focus it.
    const input = canvas.getByTestId("input");
    await userEvent.click(canvas.getByTestId("focus"));
    await waitFor(() => expect(input).toHaveFocus());
  },
};
