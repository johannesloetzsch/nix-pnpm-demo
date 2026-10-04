# Adopting this template

Two things to do after `nix flake init`: rename it, and delete the parts you do
not want.

```bash
nix flake init -t github:johannesloetzsch/nix-pnpm-demo
cd nix-pnpm-demo
```

## Renaming

The template name appears in **seven** places that matter. Renaming the
directory is not enough — a mismatch shows up as a broken filter or a 404, not
as an obvious error.

| File | What to change |
| --- | --- |
| `package.json` | `name`, and the workspace names in `scripts` |
| `apps/vite/package.json` | `name` — currently `<template>-vite` |
| `apps/e2e/package.json` | `name` — currently `<template>-e2e` |
| `apps/vite/vite.config.ts` | `base` |
| `apps/e2e/playwright.config.ts` | `baseURL`, and the dev-server `--filter` |
| `flake.nix` | `pname`, the package attribute, and the typecheck check name |
| GitHub repository settings | the Pages path |

Because the app and e2e names are prefixed with the template name
(`nix-pnpm-demo-vite`, `nix-pnpm-demo-e2e`), renaming means editing the `--filter`
targets in the root scripts too:

```json
"typecheck": "pnpm --filter <new>-vite exec tsc -b --noEmit && pnpm --filter <new>-e2e exec tsc -b --noEmit"
```

A search is the reliable way to catch them all:

```bash
grep -rIn "nix-pnpm-demo" --exclude-dir=node_modules --exclude-dir=.git .
```

### The base path

`base` must be the repository path, and two other places have to agree with it:

```ts
// apps/vite/vite.config.ts
base: "/your-repo/"
```

```ts
// apps/e2e/playwright.config.ts
const baseURL = "http://localhost:5173/your-repo/";
```

If they disagree, the end-to-end tests fail against a URL the dev server does
not serve. See [Continuous integration](./ci.md).

## Deleting the example packages

The `example-docs-*` packages exist to demonstrate how a workspace package is
wired in. They are optional.

### The documentation browser

To keep the docs and drop the browser:

1. Delete `packages/example-docs-markdown-it` and
   `packages/example-docs-marked`.
2. Remove both from `dependencies` in `apps/vite/package.json`.
3. Remove both from the `references` in `apps/vite/tsconfig.json` and the root
   `tsconfig.json`.
4. Rewrite `apps/vite/src/App.tsx` to render whatever you want instead of
   `<DocsBrowser />`.

Step 4 is the only one that is not mechanical, because `App.tsx` currently
exists only to host the browser.

The `docs/pages/*.md` files and `README.md` can stay. They are plain Markdown
and render on GitHub with no tooling at all — nothing in them depends on the
packages.

### Other removable pieces

| To remove | How |
| --- | --- |
| The e2e tests | Delete `apps/e2e`, drop `test` from `turbo.json` tasks, drop the `PLAYWRIGHT_BROWSERS_PATH` pass-through |
| Turborepo | Replace `turbo run ...` with `pnpm -r ...` in the root scripts, delete `turbo.json` |
| Biome | Delete `packages/biome-config`, the root `biome.json`, and the `lint` scripts |

Removing Turborepo or Biome means also removing the Playwright environment
pass-through or the NixOS musl override respectively — see
[Tooling](./tooling.md) for why each exists.

## After changing dependencies

If you added or removed a package, recompute the Nix hash:

```bash
setsid nohup nix build > /tmp/nixbuild.out 2>&1 < /dev/null &
grep "got: sha256" /tmp/nixbuild.out
```

Then copy the value into `flake.nix`. See [Nix](./nix.md).

## Verify

```bash
pnpm typecheck
pnpm build
pnpm lint
nix build
nix develop --command pnpm test:e2e
```

## What to run next

Back to [Getting started](./getting-started.md), or
[The docs browser](./docs-browser.md) if you kept it.
