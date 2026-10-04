---
id: 0011
title: Guard the Playwright/nixpkgs browser pairing
status: todo
quality: MVP
date: 2026-10-04
branches: [feature/0001-write-the-docs-corpus]
landedIn: null
related: [0003]
supersedes: null
reviewTrigger: A nixpkgs bump, which invalidates the pairing by default.
---

# Guard the Playwright/nixpkgs browser pairing

**Action:** Add a check that fails when the pinned `@playwright/test` version does not match the
`playwright-driver` version nixpkgs provides.

## Current state

The pairing is real, enforced by nothing, and documented in `AGENTS.md` as a table a human is
expected to maintain. `@playwright/test` is pinned to an **exact** version in
`apps/e2e/package.json`; `playwright-core` hardcodes the browser revision it expects for that
version; nixpkgs names its browser directories by the revision it ships. If the two disagree,
Playwright reports the browser as missing and e2e fails with an error that does not mention
version mismatch.

| nixpkgs | `playwright-driver` | chromium revision | required `@playwright/test` |
|---|---|---|---|
| nixos-25.05 | 1.52.0 | 1169 | 1.52.0 |
| nixos-25.11 (current) | 1.56.1 | 1194 | 1.56.1 |
| nixos-unstable | 1.63.0 | - | 1.63.0 |

**The gap:** bumping nixpkgs silently breaks e2e. The error names a missing executable path
deep inside a store directory, and the actual cause is one version number in two places.

## Why the check is not trivial

The two sides live in different systems. The npm pin is a file in this repository; the Nix side
is an attribute of nixpkgs, only reachable by evaluating it. A check therefore has to either
evaluate nixpkgs or read something nixpkgs already computed, and the second is much cheaper.

The obvious cheap version compares `@playwright/test` in `package.json` against
`pkgs.playwright-driver.version` via `nix eval`. That catches the common case - someone bumps
one and not the other - and costs one `nix eval` per CI run.

It would **not** catch a nixpkgs bump, because `flake.lock` pins nixpkgs and a bump changes the
lock file, not this repository's `package.json`. Catching that needs the chromium *revision*
comparison described in `AGENTS.md`: read nixpkgs' `browsers.json` and compare its revision
against `playwright-core`'s `browsers.json` for the pinned version. That is the check that
actually closes the gap, and it is more work than it looks, because it needs both files at
build time.

## Intended changes

Not yet written. The two candidate checks:

1. **Version equality** - `package.json` against `nix eval pkgs.playwright-driver.version`. Cheap,
   catches a partial bump.
2. **Chromium revision equality** - nixpkgs' `browsers.json` against `playwright-core`'s. Catches
   a nixpkgs bump, which is the case that actually happens.

Check 2 is the one worth having. Check 1 alone would give false confidence, because it cannot
fail in the most likely scenario.

## Alternatives considered

- **Rely on the exact pin plus documentation.** Current state. Catches an accidental
  `^1.56.1`, does nothing about nixpkgs.
- **Pin the Playwright version from nixpkgs in `flake.nix`.** Removes the duplication at the
  source. Against it: the version is needed at `pnpm install` time, outside Nix, so a Nix
  attribute cannot inject it into a pnpm install cleanly without more machinery than the
  problem deserves.
- **Fail `nix build` rather than a CI step.** Would catch it earlier for anyone building the
  flake, but the check needs to read npm metadata, which is not available in the build sandbox
  the way it is in `nix develop`.
- **A pre-commit hook.** Too easy to bypass, and the failure is not urgent.

## Recommendation

Implement check 2 as a CI step, and keep the exact pin. If check 2 turns out to be impractical
to express reliably, implement check 1 *and say in the record that it cannot catch a nixpkgs
bump*, rather than presenting it as coverage.

## Where research or grilling would help

- How to obtain nixpkgs' `browsers.json` in CI without vendoring nixpkgs source. This is the
  crux and it is unresolved; the obvious answers are a `nix eval` on a raw attribute, a fetch,
  or a flake input that pins the file, and each has a different cost.
- Whether comparing revisions is stable across a Playwright upgrade, or whether revision
  numbering is only monotonic within a major version.
- Whether the check belongs in `nix flake check` after all, which would make it a real gate
  rather than a CI-only step that a local `nix flake check` does not run.

## Verification

Nothing. This record describes intended work and no check exists.

The pairing it protects is currently correct: `nix eval` of the pinned nixpkgs gives
`playwright-driver` 1.56.1, `apps/e2e` pins `@playwright/test` 1.56.1, and CI run
`37207937219` passed all 23 e2e tests with the Nix-provided browser. That is one observation of
a correct state, not a check.