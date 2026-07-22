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

### 3. Demos are interactive-first — a `play` must NEVER consume the demo

A story's `play` function **auto-runs every time its canvas is opened**. A play
that drives the flow to completion (finishing a tour, submitting the form,
dismissing the overlay, clearing the list) makes the demo self-destruct in front
of the visitor — the worst possible first impression, and exactly how one release
already embarrassed the project. Rules:

- **Demo stories:** no flow-completing or state-destroying `play`. A play on a
  demo is acceptable only when it leaves the demo visually idle and fully usable
  afterwards (e.g. asserting the initial render). When in doubt, the demo gets
  **no play**.
- **Interaction tests:** put flow-driving assertions in ONE dedicated story
  (e.g. `InteractionTest`) tagged `tags: ["!autodocs"]`, named and described so
  anyone opening it knows it auto-runs and will drive the UI by itself. Keep it
  robust: portal-aware queries, `findBy*`/`waitFor`, no fixed timeouts.
- Multi-step / flow components (tours, wizards, dialogs, forms) are where this
  matters most — their demos exist to be *driven by the visitor*.

### 4. Use the shared system

Import `storyTheme` for layout/typography; give interactive elements
`data-testid`s (used by the dedicated interaction-test story, never leaked into
"Show code"); use `within`/`userEvent`/`expect` from `@storybook/test` in the
interaction-test story.

### 5. Verify in a RUNNING browser — compiling is not done

`build-storybook` compiling proves nothing about the experience. Before done:
run `pnpm storybook`, open **every** story canvas, and use it like a first-time
visitor — nothing auto-runs or self-completes, interactions work, the demo is
restartable after finishing, animation is smooth (things that move together move
together — no teleporting or rubber-banding), disabled/pending states are
clearly visible, and light **and** dark themes both look right. Screenshot the
key states as evidence (CLAUDE.md "Quality bar").

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
- [ ] **No demo story self-runs or self-completes** — flow-driving plays live
      only in a dedicated `!autodocs` interaction-test story (rule 3).
- [ ] `storyTheme` used; interactive nodes have `data-testid`.
- [ ] `pnpm --filter @usefy/storybook build-storybook` compiles.
- [ ] **Every story driven by hand in a running Storybook** (rule 5): idle on
      open, interactive, restartable, smooth motion, visible states, both themes.
