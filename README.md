# nix-pnpm-demo

## [Nix](https://nixos.org/) + [pnpm](https://pnpm.io/) + [Turbo](https://turbo.build/) + [Vite](https://vite.dev/) + [Typescript](https://www.typescriptlang.org/) + [React](https://react.dev/)

A clean, simple, and maintainable Vite + React + TypeScript monorepo template with Nix for reproducible environments, pnpm workspaces, Turborepo, shared centralized configs (Biome, TypeScript project references), and good monorepo practices. Types-only shared packages where possible.

## Usage

### As a Nix flake template (recommended)

```bash
nix flake init -t github:johannesloetzsch/nix-pnpm-demo
```

### Nix build

```bash
nix build
```

This will create a reproducible build of the Vite app. The result is available in `./result`.

### Nix develop

```bash
nix develop
configurePhase

pnpm build

cd apps/vite; pnpm dev
```

You can use `nix develop` and run the `configurePhase` function to get a reproducible development environment.

Inside this shell, pnpm can be used in the usual way.

### Update dependencies hash

The file `flake.nix` contains a hash over all pnpm-dependencies.

```nix
pnpmDeps = pnpm.fetchDeps {
  [...]
  hash = "sha256-[...]";
};
```

Whenever a nodejs-package is added or its version changed (in `package.json` or `pnpm-lock.yaml`), the hash needs to be updated.

## Structure

```
apps/
  vite/        # Vite + React + TypeScript app
packages/
  typescript-config/  # Shared TypeScript configs (bases, project refs)
  biome-config/       # Shared Biome config
  types/              # Shared TypeScript types (types-only)
```

## TypeScript Project References

This template uses TypeScript Project References (`composite: true`, `declaration: true`) for better incremental type-checking, clearer boundaries, and good monorepo practices. All packages/apps are orchestrated from the root `tsconfig.json` solution. Use `tsc -b --noEmit` for workspace-wide type checking.

When adding a new package/app:
- Put it in the correct workspace location (`apps/*` or `packages/*`)
- Extend from `@repo/typescript-config` bases
- If it depends on workspace packages, add a project reference to them in its `tsconfig.json` and ensure the dependency exists in `package.json` as `workspace:*`
- Add it to the root solution `tsconfig.json` references if it needs to be orchestrated at the root
- Keep shared packages types-only where possible; only add build outputs if you actually need to emit JS

## Tooling

- **Biome**: Centralized linting/formatting with `@repo/biome-config` (convention over configuration).
- **Turborepo**: Build orchestration with minimal task graph by default.

## Features

- Reproducible builds with Nix
- Fast, disk space efficient workspaces with pnpm
- Optimized builds with Turborepo caching
- Vite for fast development
- TypeScript with strict mode
- React with functional components
