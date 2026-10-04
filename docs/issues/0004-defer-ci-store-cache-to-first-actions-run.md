---
id: 0004
title: Defer CI pnpm-store caching until Actions has run once
status: todo
quality: null
date: 2026-10-04
branches: [feature/0001-write-the-docs-corpus]
landedIn: null
related: [0002]
supersedes: null
reviewTrigger: null
---

# Defer CI pnpm-store caching until Actions has run once

**Action:** Do not add pnpm-store caching to the CI workflow yet. Revisit after the first
Actions run, using the timings that run reports.

## Trigger fired

It has. Run `37207937219` on `7ce0fa3` succeeded, so the "no CI run has ever completed here"
premise below is no longer true. The record stays `todo` deliberately: the first run is a
single data point, and the owner's decision was to gather timings over time rather than act on
one.

## Measured, first run

| Step | Duration |
| --- | --- |
| Set up job | 1s |
| `actions/checkout` | 1s |
| `cachix/install-nix-action` | 4s |
| **Install dependencies** | **18s** |
| Type check | 3s |
| Lint | 1s |
| End-to-end tests | 13s |
| Build via Nix | 29s |
| Flake check | 11s |

Sum of steps: 82s. Run wall clock, `14:04:49Z` to `14:07:17Z`: 148s, so roughly 66s is
runner provisioning outside any step.

## Current state

The CI workflow installs dependencies on every run, with no cache. Locally the devshell is
effectively offline - `pnpm install --frozen-lockfile` against a warm store was verified to
succeed with the registry pointed at an unreachable port - but that behaviour is a property
of the *shell*, not of CI. CI has a cold store on every run.

**The gap:** every CI run pays a full dependency install. Now measured at 18s, which is 22% of
step time and 12% of wall clock. The Nix build is the slowest step at 29s.

## Intended changes

None yet. When this is acted on, the shape matters more than the fact:

- **Cache the store, not `node_modules`.** `AGENTS.md` already establishes `node_modules` as
  disposable and the pnpm store as the real cache.
- **Do not add `pnpm/action-setup`.** The workflow gets its pnpm from nixpkgs via
  `nix develop`. That action would install a *second* pnpm which can drift from
  `pkgs.pnpm` - the exact failure mode the Playwright/nixpkgs lockstep rule exists to prevent.
  Plain `actions/cache` against `~/.local/share/pnpm/store` is the consistent choice.
- **Key on `pnpm-lock.yaml` and the pnpm version.** A store written by a different pnpm major
  is not safely reusable, and the version comes from nixpkgs, so it has to be read at runtime.

## Alternatives considered

- **Add caching now.** Reasonable in principle; deferred so the before/after is measured
  rather than assumed.
- **Cache the Nix store instead.** Does not help: `pnpm install` in CI runs outside Nix and
  does not use `pnpmDeps`.
- **No caching. Current state.**

## Recommendation

Cache the store when this is next taken up, using the three constraints above. 18s is a
modest prize and cache restore is not free, so treat it as an experiment with a measurable
before/after rather than an obvious win.

## Where research or grilling would help

- Whether 18s justifies the complexity at all, or whether the Nix build (29s) is the better
  target. Caching Nix is harder, but it is where the time is.
- Whether the pnpm store path is stable across the runner image, and whether a cache restore
  costs more than 18s, in which case caching is a net loss.

## Verification

The 18s figure is observed from run `37207937219`. Everything else in this record is read from
the workflow file and `AGENTS.md`, not observed. No caching has been tried.