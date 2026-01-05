# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**usefy** is a monorepo containing production-ready React hooks. All packages are under `@usefy/*` namespace and published to npm.

## Common Commands

```bash
# Install dependencies (MUST use pnpm)
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in UI mode
pnpm test:ui

# Type check all packages
pnpm typecheck

# Run Storybook (port 6006)
pnpm storybook

# Development mode (watch all packages)
pnpm dev

# Create changeset for release
pnpm changeset
```

### Single Package Commands

From a package directory (e.g., `packages/use-toggle`):
```bash
pnpm test          # Run tests for this package only
pnpm test:watch    # Watch mode for this package
pnpm build         # Build this package only
pnpm typecheck     # Type check this package
```

## Architecture

### Monorepo Structure
```
packages/
├── use-toggle, use-counter, use-debounce, ...  # Individual hook packages
└── usefy/                                        # Umbrella package (re-exports all hooks)
apps/
└── storybook/                                    # Interactive documentation
```

### Package Organization
Each hook package follows this structure:
```
packages/use-<name>/
├── src/
│   ├── index.ts              # Re-exports hook
│   ├── use<Name>.ts          # Implementation with JSDoc + exported types
│   └── use<Name>.test.ts     # Tests
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

### Key Tools
- **pnpm** (v9.15.0) - Package manager with workspace protocol
- **Turbo** - Build orchestration with caching
- **tsup** - TypeScript bundler (outputs CJS + ESM + .d.ts)
- **Vitest** - Test runner with jsdom environment
- **Changesets** - Version management and changelog generation

### Hook Conventions
1. Export hook function + return type interface (e.g., `useToggle` + `UseToggleReturn`)
2. Use `useCallback` for all returned functions (stable references)
3. Include comprehensive JSDoc with `@example`
4. Maintain 90%+ test coverage

## Release Process

This project uses Changesets for automated releases:

1. Make changes in a feature branch
2. Run `pnpm changeset` and select affected packages + version bump type
3. Commit the changeset file with your changes
4. Create PR to master
5. On merge, GitHub Actions creates a "Version Packages" PR
6. Merging that PR triggers npm publish

**Important**: Without a changeset, changes won't be released to npm.

## Pre-commit Hooks

Husky + lint-staged automatically runs:
- `vitest related --run` for affected test files
- `turbo run typecheck` for TypeScript validation
