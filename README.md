# nix-pnpm-demo

[Nix](https://nixos.org/) · [pnpm](https://pnpm.io/) · [Turborepo](https://turborepo.com/) · [Vite](https://vite.dev/) · [TypeScript](https://www.typescriptlang.org/) · [React](https://react.dev/)

A Vite + React + TypeScript monorepo template with reproducible Nix
environments, pnpm workspaces, Turborepo orchestration, centralised Biome and
TypeScript configs, and TypeScript project references. Shared packages are
types-only unless a runtime build is genuinely needed.

[Live Demo](https://johannesloetzsch.github.io/nix-pnpm-demo)

## Start here

```bash
nix flake init -t github:johannesloetzsch/nix-pnpm-demo
cd nix-pnpm-demo
nix develop
pnpm dev
```

The devshell installs dependencies itself, so there is no separate
`pnpm install` step. Playwright browsers come from Nix too, so the end-to-end
tests run without downloading anything.

```bash
nix build        # reproducible build of the Vite app, output in ./result
nix flake check  # asserts the package builds and type-checks
```

## Documentation

| Page | What it covers |
| --- | --- |
| [Getting started](./docs/pages/getting-started.md) | The commands you actually run, day one |
| [The docs browser](./docs/pages/docs-browser.md) | Rendering markdown docs as a site, and picking a parser |
| [Project structure](./docs/pages/structure.md) | Workspaces, project references, shared configs |
| [Tooling](./docs/pages/tooling.md) | Biome and Turborepo |
| [Nix](./docs/pages/nix.md) | Devshell, reproducible build, checks, template output |
| [Working offline](./docs/pages/offline.md) | When the devshell needs the network, and why |
| [Testing](./docs/pages/testing.md) | Playwright, browsers from Nix, version lockstep |
| [Continuous integration](./docs/pages/ci.md) | The verify job and the Pages deploy |
| [Adopting this template](./docs/pages/adopting.md) | Renaming it, changing the base path, removing parts |

## What you get

- [x] Reproducible builds and a devshell from a single `flake.nix`
- [x] A devshell that installs dependencies on entry, so a fresh clone just works
- [x] pnpm workspaces with a disk-efficient, content-addressed store
- [x] A `<DocsBrowser />` component that renders your markdown as a site, in two
      interchangeable parser implementations
- [x] Turborepo task orchestration with a minimal task graph
- [x] Centralised Biome and TypeScript configuration, extended rather than copied
- [x] TypeScript project references with `strict` mode and incremental builds
- [x] Playwright end-to-end tests with browsers supplied by Nix, not downloaded
- [x] CI that type-checks, builds, tests, and deploys to GitHub Pages

## Verify before you trust it

```bash
pnpm typecheck
pnpm build
pnpm lint
nix build
```