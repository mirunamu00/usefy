---
name: add-usefy-story
description: Author or review a Storybook story for a usefy hook to the house standard. Use whenever creating or improving a story under apps/storybook/src/stories for an @usefy hook — it ensures "Show code" shows real copy-pasteable usage (not the story's render/play internals), consistent docs descriptions, and demo richness matched to the hook's nature. Trigger on "add a story", "improve the storybook", "the show-code is wrong", or as part of the add-usefy-hook workflow's Storybook phase.
---

# Author a usefy Storybook story

A hook's story page should **teach the hook**: a consumer reads what it does,
sees it behave, and copies a real usage snippet into their app. Quality is not
one-size-fits-all — match the demo to the hook. But a few things are always
required.

Reference stories: `apps/storybook/src/stories/useHover.stories.tsx` and
`useWindowSize.stories.tsx` (the rich end). Shared styling lives in
`../styles/storyTheme`.

## Non-negotiables (every story, regardless of hook)

### 1. "Show code" must show real, copy-pasteable usage — never the story wiring

By default Storybook autodocs puts the transpiled story object in the "Show
code" panel:

```
{ render: () => <Demo />, play: async ({ canvasElement }) => { … } }
```

That is useless to a consumer. **Always** override the source on each exported
story with a self-contained example that imports from the published package and
uses the hook the way a real app would — no `Demo`, no `data-testid`, no `play`:

```tsx
export const Default: Story = {
  render: () => <Demo />,
  parameters: {
    docs: {
      description: { story: "One sentence on what this scenario shows." },
      source: {
        language: "tsx",
        code: `import { useX } from "@usefy/use-x";

function Component() {
  const value = useX();
  return <div>{value}</div>;
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    /* drive + assert the demo */
  },
};
```

### 2. Consistent descriptions

- `meta.parameters.docs.description.component` — short markdown: one-line
  purpose, a `## Features` list, and a `## Basic Usage` fenced block.
- Every story: `parameters.docs.description.story` — one sentence.
- `meta.tags = ["autodocs"]`.

Do not leave some stories with descriptions and others without.

### 3. Use the shared system + test it

Import `storyTheme` for layout/typography; give interactive elements
`data-testid`s; add a `play` test (`within`/`userEvent`/`expect` from
`@storybook/test`) that drives and asserts the demo where the behavior is
deterministic.

## The judgment call — how rich should the demo be?

**This is yours to decide per hook. Do not apply a fixed story count.**

- **Option-driven / visually-varying hooks** — the options change behavior in
  ways you can *see* (`useHover` enter/leave delays, `useThrottle` intervals,
  `useKeyPress` combos, `useWindowSize` debounce). Give a **separate demo per
  meaningful option/scenario** so the difference is visible; the demo is the
  teaching tool.
- **Simple / foundational hooks** — SSR & lifecycle utilities like `useIsClient`,
  `usePrevious`, `useLatest`, `useMount`, `useIsFirstRender`. **One clean,
  focused demo is enough.** Do not pad them with contrived variations; their
  value comes across through the single demo plus the real code example.
- The test: *"does another story show something a consumer couldn't already
  infer from the first?"* If no, don't add it. Padding a trivial hook is as bad
  as under-showing a rich one.

## Definition of done

- [ ] Every exported story has `parameters.docs.source.code` — real usage,
      `language: "tsx"`, imports the package, no story internals.
- [ ] `meta` has `docs.description.component` (purpose + Features + Basic Usage)
      and `tags: ["autodocs"]`.
- [ ] Every story has a one-line `docs.description.story`.
- [ ] Demo richness matches the hook's nature (deliberate judgment, not a count).
- [ ] `storyTheme` used; interactive nodes have `data-testid`; `play` asserts
      behavior where deterministic.
- [ ] `pnpm --filter @usefy/storybook build-storybook` compiles.
