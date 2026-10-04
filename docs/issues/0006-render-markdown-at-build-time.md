---
id: 0006
title: Render markdown at build time and check for drift
status: implemented
quality: PoC
date: 2026-10-04
branches: [feature/0006-check-markdown-for-drift]
landedIn: 05b2616
related: [0001, 0007, 0008]
supersedes: null
reviewTrigger: A second docs consumer, or a generator that stops being deterministic.
---

# Render markdown at build time and check for drift

**Action:** Render `README.md` and `docs/pages/*.md` to HTML at build time into a committed
`src/generated/pages.ts`, and add a check that fails when the committed file no longer matches
what the generators produce.

## Why build time

`import.meta.glob` inlines markdown at build time, but calling the parser from a React
component still parses it at *runtime*, which ships the whole parser to every visitor.
Generating the HTML in a build step keeps both the markdown and the parser out of the client
bundle: 315.57 kB (93.95 kB gzip) for the chooser, against roughly 415 kB (142 kB gzip) for
the runtime-parsing version this replaces.

## Current state

Landed in both `packages/example-docs-markdown-it` and `packages/example-docs-marked`. Each
package runs `scripts/render-pages.mjs` from its `build` script.

**The gap this record closes:** because the generated file is *committed* - `pnpm typecheck`
runs before `pnpm build`, and tsc has to resolve the module - it can drift. An author edits a
doc page, `tsc -b` passes against the stale HTML, and if nobody rebuilds, the wrong content
ships. The comment at the top of the generator asserted "it cannot drift in practice", which
was an assumption rather than a check.

## Intended changes

- `scripts/check-generated.mjs`, exposed as `pnpm check:generated`, runs both generators
  directly with `node` and then `git diff --exit-code` on the two generated files.
- A CI step, after `Type check`, runs `pnpm build && pnpm check:generated`.

The generators are invoked **directly, not through turbo**, on purpose. A turbo cache hit
replays logs without running the task, so checking afterwards through turbo would compare the
file against itself and always pass. Running the generator forces real output. This is the
same hazard 0007 addresses, and the check is written to be immune to it.

The comparison is scoped to the two generated paths, not to `packages/` as a directory. A
blanket diff would also report unrelated in-progress edits and fail for the wrong reason.

## Alternatives considered

- **Not committing the generated file.** Cleanest, but `pnpm typecheck` runs before
  `pnpm build`, so tsc cannot resolve the module in a fresh checkout. Rejected.
- **Gitignoring the file and generating it in the Nix build only.** Same ordering problem.
- **Checking via `nix flake check` instead of a pnpm script.** Would also assert drift for
  anyone running the flake, at the cost of a much slower feedback loop for what is a
  millisecond comparison.
- **Relying on CI to always build before deploying.** The deploy job does run `nix build`,
  which regenerates. But a drifted commit still type-checks, still lints, and reaches
  `main`, and `verify` would not notice. Rejected as a substitute for a check.
- **A pnpm script plus a CI step. Chosen.**

## Recommendation

Keep the generated file committed and keep this check. The ordering constraint that forces
committing it is real, so the drift it creates is real, and a check is cheaper than
discovering a stale page in production.

## Where research or grilling would help

- Whether `pnpm check:generated` belongs in `pnpm build` itself, so drift cannot be introduced
  locally either. Not done: it makes the build non-hermetic and leaves a dirty tree as a side
  effect of building.
- Whether the generator is truly deterministic across platforms. It is deterministic here; a
  line-ending or sort-order difference on another platform would show up as permanent drift.
- Whether checking two hardcoded paths is the right shape once a third docs package exists. It
  will not scale, and a glob or a package manifest read would.

## Verification

The check was written red-first: a paragraph was appended to `docs/pages/tooling.md` and the
check was required to fail on it, which it did, naming both generated files. Reverting the
page and rebuilding returned it to green.

Both `pnpm check:generated` and `pnpm check:links` pass on this branch, and the same commands
run in CI.

Two defects were found while proving the check could go red, and both are worth recording:
the check initially diffed all of `packages/` and failed on intended `styles.css` edits, and
`git diff --exit-code` exits 1 on differences, which made `execFileSync` throw and discard the
very output the check needed. A check that cannot report the failure it detected is worse than
no check.