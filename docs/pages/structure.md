# Project structure

Two workspace roots, declared once in `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`apps/*` holds things you run. `packages/*` holds things you import.

## Workspaces

| Workspace | Kind | Built? |
| --- | --- | --- |
| `apps/vite` | application | yes, emits `dist/` |
| `apps/e2e` | application | no, has no build |
| `packages/typescript-config` | shared config | no |
| `packages/biome-config` | shared config | no |
| `packages/types` | types only | no |
| `packages/example-docs-*` | example library | no, consumed as source |

Workspace packages refer to each other by name, never by path:

```json
"@repo/types": "workspace:*"
```

## TypeScript project references

Projects are wired together with TypeScript project references rather than one
wide `include`. Each project declares what it depends on, so `tsc` can build
them in order and reuse prior output.

The root `tsconfig.json` is a solution file — it has no files of its own, only
references:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/types" },
    { "path": "./apps/vite" },
    { "path": "./apps/e2e" }
  ]
}
```

The base config sets `composite: true` and `declaration: true`, which is what
makes referencing possible.

## Three shared config packages

Configuration lives in packages so there is exactly one copy, extended rather
than duplicated.

**`@repo/typescript-config`** provides the bases — `tsconfig.base.json` and
specialised variants:

| Config | For |
| --- | --- |
| `tsconfig.base.json` | shared compiler options |
| `tsconfig.vite.json` | browser + JSX, `noEmit` |
| `tsconfig.node.json` | tooling config files |
| `tsconfig.package.json` | packages that emit to `dist/` |

Extend one, override only what differs:

```json
{
  "extends": "@repo/typescript-config/tsconfig.vite.json",
  "include": ["src"]
}
```

**`@repo/biome-config`** is the single Biome configuration. The root
`biome.json` extends it:

```json
{ "extends": ["./packages/biome-config/biome.json"] }
```

**`@repo/types`** holds types shared across workspaces. It is types-only: no
build step, no runtime code.

```json
{
  "name": "@repo/types",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

## Types-only where possible

The default answer to "how do I share code" in this repo is *don't share code*.
A types-only package costs nothing to build and cannot drift at runtime. Add a
build output only when you genuinely need to emit JavaScript.

The two `example-docs-*` packages are the deliberate exception: they ship
`.tsx` and CSS, and they are still consumed as TypeScript source, compiled by
whatever application imports them. See [Tooling](./tooling.md).

## Adding a workspace

1. Put it in `apps/*` or `packages/*` — no registration needed, pnpm globs it.
2. Give it a `package.json` with `"type": "module"` and a name like
   `@repo/thing` or `my-app`.
3. Add a `tsconfig.json` extending the closest base from
   `@repo/typescript-config`.
4. If it imports another workspace package, add **both** a `workspace:*`
   dependency in `package.json` **and** a project reference in its
   `tsconfig.json`. Missing either one produces a confusing error.
5. Add it to the root `tsconfig.json` if it should be type-checked from the root.
6. If it emits JS, add a `build` script — Turborepo runs it. Otherwise Turborepo
   has nothing to do for that workspace.

## A trap worth knowing

`baseUrl` was removed in TypeScript 7. `"baseUrl": "."` now fails with `TS5102`.
Use relative paths and project references instead.

## What to run next

[Tooling](./tooling.md) for Biome and Turborepo, or
[The docs browser](./docs-browser.md) for how a package like those is wired in.
