# AGENTS.md

## Project
Vite + React + TypeScript monorepo template with Nix, pnpm, Turborepo, Biome, and TypeScript Project References. Clean, simple, maintainable. Types-only shared packages where possible.

## Git rules (hard rules)

**Never commit without explicit, current instruction to do so.** A previous
request to commit does not carry over to later work.

**Never commit a broken or unverified state.** This repo has a history of
commits that landed a non-building flake (`hash = ""`, missing
`fetcherVersion`) and a Playwright setup that could never launch. Before any
commit, run the verification list below and report results honestly. If a check
cannot run, say so in the commit message or to the user - do not commit it as
if it passed.

**Never stage or commit `flake.nix` without the user reviewing the diff.** The
user reviews and approves before anything is staged, committed, or pushed.

**Never push.** The user pushes after reviewing.

When work is finished but unverified or partially complete, leave it uncommitted
and report exactly what is and is not green.

## Key commands
- `pnpm build` - build all packages/apps via Turborepo (root)
- `pnpm install` - install deps (pnpm workspaces)
- `pnpm --filter nix-pnpm-demo-vite exec tsc -b --noEmit` - type check with project refs
- `pnpm --filter nix-pnpm-demo-vite dev` - run Vite app dev server

### Gotchas

**`pnpm exec tsc` does NOT work at the root.** `typescript` is not a root
devDependency, so root `pnpm exec tsc` fails with `Command "tsc" not found`.
Type check per-app instead:
`pnpm --filter nix-pnpm-demo-vite exec tsc -b --noEmit`

**Biome cannot run from node_modules on NixOS.** `pnpm exec biome` resolves to
`@biomejs/cli-linux-x64`, a generic-linux glibc binary that NixOS refuses to run
(stub-ld error). The devshell does not provide a `biome` binary. A `stub-ld`
error means nothing was linted - do not report a clean lint pass.

**Biome 2 config schema.** After upgrading to Biome 2.x, top-level
`organizeImports` is removed (moves to `assist.actions.source.organizeImports`)
and `$schema` must be bumped from the 1.9.4 URL. Biome 2 rejects unknown
top-level keys, so a stale 1.x config is a hard error.

**TypeScript 7 removed `baseUrl`.** `"baseUrl": "."` in a tsconfig now fails
with TS5102. Use relative paths and tsconfig `references` instead. This bit
`apps/vite/tsconfig.app.json`.

**`pnpm exec <tool>` only works if that workspace has the dependency.** Prefer
`--filter <pkg> exec ...` over root-level `exec`.

**`pnpm.fetchDeps` requires `fetcherVersion`.** Since nixpkgs 25.05 a missing
`fetcherVersion` is a hard eval error (`fetcherVersion is not set`). Use
`fetcherVersion = 3` (reproducible `pnpm-store.tar.zst`); supported values are
1, 2, 3.

**`packageManager` in `package.json` does not have to match nixpkgs' pnpm.**
`pnpm.configHook` runs `pnpm config set manage-package-manager-versions false`
during the build, so a mismatch will not trigger a (network-requiring) pnpm
self-download inside the no-network Nix sandbox. The fields are kept aligned
(`pnpm@10.28.0` == nixpkgs 25.11 `nodePackages_latest.pnpm`) anyway, so that
local and Nix builds use the same pnpm.

## Playwright / nixpkgs lockstep (important)

Playwright browsers are provided by `pkgs.playwright-driver.browsers`, not
downloaded. That makes the **nixpkgs revision the source of truth for the
Playwright version**:

- nixpkgs builds `playwright-driver` at a pinned version and names its browser
  directories by the revision it ships, e.g.
  `chromium_headless_shell-1194/chrome-linux/headless_shell`.
- `playwright-core` hardcodes the browser revision it expects for its own
  version. If the two disagree, Playwright reports the browser as missing.

So `@playwright/test` must be pinned to an **exact** version matching
`pkgs.playwright-driver.version`. Current state:

| nixpkgs | `playwright-driver` | chromium revision | required `@playwright/test` |
|---|---|---|---|
| nixos-25.05 | 1.52.0 | 1169 | 1.52.0 |
| nixos-25.11 (current) | 1.56.1 | 1194 | 1.56.1 |
| nixos-unstable | 1.63.0 | - | 1.63.0 |

**When bumping nixpkgs, re-pin `@playwright/test` or e2e breaks.** Verify the
pair before spending build time by comparing the two `browsers.json` files:

```bash
nix eval --raw github:NixOS/nixpkgs/nixos-25.11#playwright-driver.version
cat pkgs/by-name/../development/web/playwright/browsers.json   # in nixpkgs src
# then compare against node_modules/playwright-core/browsers.json for that version
```

Both must report the same chromium revision. `devices["Desktop Chrome"]` has no
`channel` key, so do not set `channel`/`launchOptions` overrides - the bundled
headless shell is used.

## Nix
- `nix build` - build Vite app (reproducible)
- `nix develop` - enter devshell (run `configurePhase` first as per README)
- `nix flake init -t .#default` (in template context) - instantiate template

When `package.json` or `pnpm-lock.yaml` changes, update `pnpmDeps.hash` in
`flake.nix`. To recompute it: set `hash = ""`, run `nix build`, then copy the
`got: sha256-...` value from the build error back into `flake.nix`.

**Run that hash-recompute build detached, not in the foreground.** With an empty
hash pnpm re-fetches the whole store into a fresh FOD; this takes several
minutes and a foreground build gets killed by command timeouts, wasting the run.
Instead:

```
nohup nix build > /tmp/nixbuild.out 2>&1 &
# poll
grep "got: sha256" /tmp/nixbuild.out
```

Only treat the hash as fixed once `nix build` completes successfully, not when
the mismatch message appears.

If the process gets killed by a tool timeout, relaunch it detached from the
process group or it dies with the shell:
`setsid nohup nix build > /tmp/nixbuild.out 2>&1 < /dev/null &`

## Verification (run all before declaring work done)
1. `pnpm --filter nix-pnpm-demo-vite exec tsc -b --noEmit`
2. `pnpm --filter nix-pnpm-demo-e2e exec tsc -b --noEmit`
3. `pnpm build` (Turbo)
4. `pnpm exec biome check .` - **currently impossible on NixOS**, see gotcha above
5. `nix build`
6. confirm `apps/vite/dist/index.html` exists and assets are non-empty
7. `nix develop --command pnpm test:e2e` - needs the devshell, not a plain shell

Never report a step as passing if it errored or was skipped. If a check cannot
run, say so explicitly instead of implying success.

## Monorepo conventions
- Workspaces: `apps/*`, `packages/*`
- Shared configs: extend from `@repo/typescript-config` and `@repo/biome-config`
- TS Project References: packages/apps that need to be orchestrated must be in root `tsconfig.json` references; referenced projects need `composite: true` (and `declaration: true` for packages). If A depends on B, add reference in A's tsconfig and `workspace:*` dep in package.json.
- Types-only where possible for shared packages (no runtime build unless needed)
- Use relative extends for tsconfig in contexts where workspace package resolution may differ (e.g. Nix sandbox) if issues arise; prefer workspace package names locally.

## Structure
- `apps/vite` - Vite + React + TS
- `packages/typescript-config` - TS base configs (base/vite/node/package) with project refs
- `packages/biome-config` - centralized Biome config
- `packages/types` - shared types

## Notes
- Biome only (no ESLint/Prettier). Keep configs centralized; minimal tasks by default.
- Strict TypeScript (`strict: true`). No astro/next in this template.
- `pnpm test:e2e` - run Playwright E2E tests (auto-starts the Vite dev server)
- `pnpm test:e2e:ui` - run Playwright tests with UI
- `pnpm test:e2e:report` - view Playwright test report

**Playwright browsers ARE provisioned.** The devshell exports
`PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers.override { withFirefox = false; withWebkit = false; }}"`.
The override keeps the closure small; **ffmpeg must stay enabled** because
`video: "retain-on-failure"` needs it. Playwright's driver and browser binaries
must both come from `nix develop` - running `pnpm test:e2e` in a plain shell has
no `PLAYWRIGHT_BROWSERS_PATH` and no browser, so it fails.

`apps/e2e/playwright.config.ts` uses a `webServer` block that runs
`pnpm --filter nix-pnpm-demo-vite dev` and waits on
`http://localhost:5173/nix-pnpm-demo/vite/`, so no manual server is needed.
`reuseExistingServer` is on outside CI.

**Not yet done:** there is no `checks` output in the flake, so e2e does not run
as part of `nix build` or `nix flake check`. Adding a `checks.e2e` derivation
(chromium inside the Nix build sandbox may need `/dev/shm` handling) is open.
CI (`.github/workflows/deploy.yml`) does not run e2e either.

## Known repo hygiene issues (unfixed, deliberately)

- `packages/types/tsconfig.tsbuildinfo` is **tracked in git**. It is a build
  artifact and changes on every typecheck, which perturbs the `src = ./.` hash.
  It should be untracked and gitignored.
- `apps/vite/eslint.config.js` is dead: ESLint is not a dependency anywhere and
  the project is Biome-only.
- `.github/workflows/deploy.yml` is stale: `actions/checkout@v3`,
  `upload-pages-artifact@v3`, `deploy-pages@v4`. It runs no
  install/typecheck/lint/test, and `nix flake check` is a no-op because the flake
  has no `checks` output. GitHub Pages serves at `/nix-pnpm-demo/` but the Vite
  `base` is `/nix-pnpm-demo/vite`, so deployed assets would 404.
- `README.md` has a duplicated `## Testing` section, and tells you to run
  `tsc -b --noEmit` at the root, which does not work (see gotcha above).
- Biome config is still 1.x-schema with a top-level `organizeImports`, which
  Biome 2 rejects. Removal was requested but not performed yet.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
