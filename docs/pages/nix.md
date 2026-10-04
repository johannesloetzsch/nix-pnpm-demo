# Nix

Everything this repo builds and every environment you work in comes from one
file: `flake.nix`. It provides three things.

| Output | What it gives you |
| --- | --- |
| `devShells.default` | A shell with Node, pnpm and Playwright browsers |
| `packages.default` | A reproducible build of the Vite app |
| `checks.typecheck` | An assertion that the package builds and type-checks |

## The devshell

```bash
nix develop
```

That is the whole setup step. The shell installs dependencies when
`node_modules` is missing or out of sync with `pnpm-lock.yaml`, so a fresh
clone needs no manual `pnpm install`. See [Working offline](./offline.md) for
exactly when that touches the network.

Playwright browsers come from Nix:

```bash
export PLAYWRIGHT_BROWSERS_PATH="${playwrightBrowsers}"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

The browser closure is trimmed to Chromium's headless shell plus ffmpeg.
`withChromium = false` is safe here because `withChromiumHeadlessShell` is a
**separate** flag that defaults to true — dropping the full browser does not
drop the headless shell. ffmpeg must stay enabled because
`video: "retain-on-failure"` needs it.

There is deliberately no headed browser, so `playwright test --ui` cannot work.

## Why the shell installs dependencies itself

This is the non-obvious part, and it is worth understanding rather than copying.

`mkShell` sets `phases = [ "buildPhase" ]`. `pnpm.configHook` is a
`postConfigureHook` that requires `pnpmDeps` — a devshell has no `pnpmDeps`, so
it would abort anyway. **Nothing in a devshell creates `node_modules`.**

So the `shellHook` does it:

```bash
if [ ! -d node_modules ] || ! cmp -s pnpm-lock.yaml node_modules/.pnpm/lock.yaml; then
  pnpm install --frozen-lockfile
fi
```

Two deliberate details:

- **`cmp`, not mtime.** `git checkout` preserves mtimes, so a timestamp guard
  silently keeps a stale `node_modules` across a branch switch. Comparing
  content costs one small read and makes an unchanged lockfile a hard no-op.
- **No `--ignore-scripts`.** nixpkgs passes that for sandboxed derivation
  builds, but postinstall scripts perform native builds in a devshell. Skipping
  them yields packages that fail at runtime rather than at install.

If the guard ever decides wrongly, `pnpm install --frozen-lockfile` always
fixes it. It degrades towards "install again", never "never install".

## The reproducible build

```bash
nix build
```

The result is a symlink at `./result` containing the built app. The build is
hermetic: dependencies come from the `pnpmDeps` derivation, not the network.

### Updating the dependency hash

`pnpmDeps` is a fixed-output derivation with a hash over all pnpm
dependencies:

```nix
pnpmDeps = pnpm.fetchDeps {
  inherit (finalAttrs) pname version src;
  fetcherVersion = 3;
  hash = "sha256-[...]";
};
```

Whenever a dependency is added or a version changes — in any `package.json` or
in `pnpm-lock.yaml` — the hash must be updated. Set `hash = ""`, run `nix
build`, and copy the `got: sha256-...` value from the error back in.

> [!TIP]
> Run that build detached. With an empty hash pnpm re-fetches the whole store
> into a fresh derivation, which takes several minutes — longer than a
> foreground command survives.
>
> ```bash
> setsid nohup nix build > /tmp/nixbuild.out 2>&1 < /dev/null &
> grep "got: sha256" /tmp/nixbuild.out
> ```

> [!WARNING]
> `fetcherVersion` is not optional. Since nixpkgs 25.05 a missing value is a hard
> evaluation error. Use `3`, which produces a reproducible `pnpm-store.tar.zst`;
> `1`, `2` and `3` are the supported values.

Only treat the hash as fixed once `nix build` completes successfully — not when
the mismatch message appears.

## Checks

```bash
nix flake check
```

Without a `checks` output this only evaluates `packages.default`, so it asserts
nothing about type safety. `checks.typecheck` reuses the package derivation, so
it inherits the same `pnpmDeps` closure, and runs `pnpm typecheck` as its check
phase.

## Using this repo as a template

```bash
nix flake init -t github:johannesloetzsch/nix-pnpm-demo
```

The `templates.default` output makes the whole repository instantiable. See
[Adopting this template](./adopting.md) for the renaming that should follow.

## What to run next

[Project structure](./structure.md) for the workspaces, or
[The docs browser](./docs-browser.md) if you want the site this repo renders.
