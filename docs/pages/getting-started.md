# Getting started

This repo is a monorepo: several small workspaces that depend on shared
configuration packages. You will mostly work in one of two places — the Vite app
or the shared packages.

## Enter the devshell

Everything below assumes you are inside the devshell:

```bash
nix develop
```

This is the only setup step. The shell installs dependencies when `node_modules`
is missing or no longer matches `pnpm-lock.yaml`, so a fresh clone needs no
manual `pnpm install`. See [Working offline](./offline.md) for exactly when that
install touches the network.

Playwright browsers come from Nix as well, which is why the end-to-end tests
work from this shell without downloading a browser.

## Layout at a glance

```
apps/
  vite/                    Vite + React + TypeScript app
  e2e/                     Playwright end-to-end tests
packages/
  typescript-config/       Shared TypeScript configs
  biome-config/            Shared Biome config
  types/                   Shared types (types-only, no build)
  example-docs-markdown-it/  Example: docs browser, markdown-it renderer
  example-docs-marked/       Example: docs browser, marked renderer
```

## The commands you actually run

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Build every package and app through Turborepo |
| `pnpm typecheck` | Type-check both TypeScript projects |
| `pnpm lint` | Lint and format-check with Biome |
| `pnpm lint:fix` | Apply Biome's fixes |
| `pnpm test` | Run the end-to-end tests through Turborepo |
| `pnpm test:e2e` | Run Playwright directly |
| `nix build` | Reproducible build of the app into `./result` |
| `nix flake check` | Assert the package builds and type-checks |

Run `pnpm build`, not `turbo build` directly — the root script is what wires up
the workspace filters.

## The verify loop

This repo has one rule worth adopting early: **run the full verification list
before you call anything done.**

```bash
pnpm typecheck
pnpm build
pnpm lint
nix build
```

If a check cannot run, say so explicitly instead of implying it passed. A check
you skipped is information; a check you assumed is a surprise waiting to
happen.

## A note on `pnpm exec`

`pnpm exec <tool>` only works in a workspace that actually depends on that tool.
`typescript` lives in `apps/vite` and `apps/e2e`, not at the root, so this
fails:

```bash
pnpm exec tsc -b   # Command "tsc" not found
```

Use `pnpm typecheck`, which runs each workspace's own command, or scope
explicitly:

```bash
pnpm --filter nix-pnpm-demo-vite exec tsc -b --noEmit
```

## What to run next

[Nix](./nix.md) for what the devshell gives you, then
[Project structure](./structure.md) for how the workspaces fit together.
