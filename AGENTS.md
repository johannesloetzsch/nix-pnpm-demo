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
- `pnpm typecheck` - type check both TS projects (vite + e2e)
- `pnpm --filter nix-pnpm-demo-vite exec tsc -b --noEmit` - type check with project refs
- `pnpm dev` - run Vite app dev server
- `pnpm test` - run all test tasks via turbo (e2e; needs the devshell)

### Gotchas

**`pnpm exec tsc` does NOT work at the root.** `typescript` is not a root
devDependency, so root `pnpm exec tsc` fails with `Command "tsc" not found`.
Use `pnpm typecheck`, which runs the per-workspace commands. It is
deliberately sequential (`&&`, not parallel): both `tsc -b` invocations
reference the composite `packages/types` project and would race on its
single `tsbuildinfo`.

**Turborepo filters the environment (Strict Mode).** A turbo task only sees
the env vars listed in `env`/`globalEnv`/`passThroughEnv`. Because
`PLAYWRIGHT_BROWSERS_PATH` is exported by the devShell, `pnpm test:e2e` (which
calls Playwright directly) works, while `pnpm test` (via turbo) silently lost it
- Playwright fell back to `~/.cache/ms-playwright` and reported
`Executable doesn't exist at .../chromium_headless_shell-1194/...`.
Fixed by listing it in `globalPassThroughEnv` in `turbo.json`, deliberately
*pass-through* rather than `globalEnv`: the value is a Nix store path that
changes on every nixpkgs bump, and hashing it would invalidate every task
including `build`. When a task behaves differently under turbo than when run
directly, check this first.

**A failing Playwright run blocks forever locally.** With `reporter: "html"`,
Playwright auto-serves the report on port 9323 after a failure and does not
exit, so a red `pnpm test` looks like a hang until you Ctrl+C it. Playwright
does not do this when `CI` is set. Do not read this as a hung test run.

**Biome runs via a pnpm override to the musl binary.** NixOS cannot execute
`@biomejs/cli-linux-x64` (generic-linux glibc, `stub-ld` error), so
`pnpm-workspace.yaml` aliases that name to `@biomejs/cli-linux-x64-musl`, which
runs on both NixOS and glibc CI. Use `pnpm lint` / `pnpm lint:fix`.

Two things make this fragile, both worth re-checking when Biome is bumped:

- The override is an explicit **version**, not a range. `@biomejs/biome` is
  exact-pinned in the root `package.json` for this reason. Move both together or
  the CLI version will disagree with the wrapper.
- The override lives in **`pnpm-workspace.yaml`, not `package.json`.** pnpm
  >= 10.28 no longer reads the `pnpm` field of `package.json` and silently
  ignores it (it prints a warning). A `pnpm.overrides` block in
  `package.json` looks correct and does nothing.

**Biome 2 config schema.** Biome 2 sets `additionalProperties: false`, so an
unknown key is a hard error, not a warning. Changes made: top-level
`organizeImports` moved to `assist.actions.source.organizeImports` and became the
bare string `"on"` (no `enabled` key); `files.ignore` became `files.includes`
with `"**"` plus `!`-negated patterns; `linter.rules.recommended` became
`linter.rules.preset: "recommended"`; `$schema` bumped to the 2.5.15 URL.
`javascript.formatter.quoteStyle` is still valid and did *not* move.

**A config reached via `extends` still needs `"root": false`.** The root
`biome.json` uses `"extends": ["./packages/biome-config/biome.json"]` because no
workspace package declares `@repo/biome-config`, so the bare npm specifier
cannot resolve. Biome scans the tree and finds the shared file as a *nested*
config; without `"root": false` it raises `RootInRoot` ("Found a nested root
configuration..."). Marking it non-root is the documented fix.

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
1. `pnpm typecheck` (covers both vite and e2e)
2. `pnpm build` (Turbo)
3. `pnpm lint` (Biome; works on NixOS via the musl override)
4. `nix build`
5. confirm `apps/vite/dist/index.html` exists and assets are non-empty
6. `nix develop --command pnpm test:e2e` - needs the devshell, not a plain shell

For changes to dependency files, additionally verify in a clean clone that
`nix develop --command pnpm install --frozen-lockfile` succeeds - no
`configurePhase` is needed, the devshell's `pnpm.configHook` provides the store.

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
- `pnpm test:e2e:report` - view Playwright test report

**Playwright browsers ARE provisioned.** The devshell exports
`PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers.override { withChromium = false; withFirefox = false; withWebkit = false; }}"`.
The override keeps the closure small; **ffmpeg must stay enabled** because
`video: "retain-on-failure"` needs it. Playwright's driver and browser binaries
must both come from `nix develop` - running `pnpm test:e2e` in a plain shell has
no `PLAYWRIGHT_BROWSERS_PATH` and no browser, so it fails.

`apps/e2e/playwright.config.ts` uses a `webServer` block that runs
`pnpm --filter nix-pnpm-demo-vite dev` and waits on
`http://localhost:5173/nix-pnpm-demo/`, so no manual server is needed.
`reuseExistingServer` is on outside CI.

That URL must track the Vite `base` path. The two are only correct together:
Pages serves the repo at `/nix-pnpm-demo/`, and the build output is uploaded
from `./result`, so `base` is that path and not a deeper one.

## Known repo hygiene issues (unfixed, deliberately)

- The browser closure ships only `chromium_headless_shell` and `ffmpeg`.
  `withChromium = false` is safe here because `withChromiumHeadlessShell` is a
  separate flag that defaults to `true`; setting `withChromium = false` does not
  remove the headless shell. There is no headed browser, so `playwright test
  --ui` cannot work and the `test:e2e:ui` script is gone. If headed UI is ever
  needed, put the full browser back behind a second devshell rather than
  reinflating the default one.
- There is no `checks.e2e`, so e2e does not run as part of `nix build` or
  `nix flake check`. It does run in CI, via the `verify` job.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
