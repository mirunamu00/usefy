# File templates

Copy-paste boilerplate for a new hook package. Replace the placeholders:

- `<name>` — kebab-case, e.g. `key-press`
- `<Name>` — PascalCase, e.g. `KeyPress`
- `<description>` / `<keywords>` — package-specific
- version — match the current `@usefy/*` group version (check any existing package's `package.json`)

The config files (`tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `vitest.setup.ts`) are byte-for-byte identical across all hooks except nothing package-specific — you can literally copy them from a sibling. Only `package.json` needs edits.

## package.json

```json
{
  "name": "@usefy/use-<name>",
  "version": "0.3.1",
  "description": "<description>",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.1",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.0.0",
    "jsdom": "^27.3.0",
    "react": "^19.0.0",
    "rimraf": "^6.0.1",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^4.0.16"
  },
  "publishConfig": { "access": "public" },
  "repository": {
    "type": "git",
    "url": "https://github.com/mirunamu00/usefy.git",
    "directory": "packages/hooks/use-<name>"
  },
  "license": "MIT",
  "keywords": ["react", "hooks", "<keywords>", "use<Name>"]
}
```

## tsconfig.json

```json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "composite": false
  },
  "include": ["src/**/*", "vitest.setup.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## tsup.config.ts

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom"],
});
```

## vitest.config.ts

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

## vitest.setup.ts

```ts
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

## src/index.ts

Re-export the hook, its public types, and any genuinely useful helpers. Example:

```ts
export { use<Name> } from "./use<Name>";
export type {
  Use<Name>Options,
  Use<Name>Return,
} from "./types";
export { /* public helpers only */ } from "./utils";
```

## Umbrella re-export block

Add to `packages/hooks/src/index.ts`. Re-export only the public surface (hook + public types + high-value helpers), never generically-named internals:

```ts
// use<Name>
export {
  use<Name>,
  type Use<Name>Options,
  type Use<Name>Return,
} from "@usefy/use-<name>";
```

## Changeset

`.changeset/<some-name>.md`:

```md
---
"@usefy/use-<name>": minor
"@usefy/hooks": minor
---

feat(use-<name>): add use<Name> hook for <one-line purpose>

<short bullet summary of the API and notable features>
```

## Coverage badge (for packages/hooks/README.md table)

```md
![NN%](https://img.shields.io/badge/coverage-NN%25-brightgreen?style=flat-square)
```

## Storybook story skeleton

`apps/storybook/src/stories/use<Name>.stories.tsx`:

```tsx
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { use<Name> } from "@usefy/use-<name>";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

function BasicDemo() {
  // use the hook; render state with data-testid attributes
  return <div className={storyTheme.containerCentered}>{/* ... */}</div>;
}

const meta: Meta<typeof BasicDemo> = {
  title: "Hooks/use<Name>",
  component: BasicDemo,
  parameters: { layout: "centered", docs: { description: { component: "..." } } },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof BasicDemo>;

export const Default: Story = {
  render: () => <BasicDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // await userEvent...; await waitFor(() => expect(...));
  },
};
```
