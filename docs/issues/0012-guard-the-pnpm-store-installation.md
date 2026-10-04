---
id: 0012
title: Assert the pnpm store behaviour the README claims
status: todo
quality: null
date: 2026-10-04
branches: [main]
landedIn: null
related: [0003, 0004]
supersedes: null
reviewTrigger: A pnpm major bump, which could change the store layout or the lockfile handling.
---

# Assert the pnpm store behaviour the README claims

**Action:** Add a check that fails if a fresh checkout cannot install with the registry
unreachable, so the README's store and offline claims rest on a check rather than on one
recorded experiment.

## Current state

`README.md` lists this as a delivered feature:

> pnpm workspaces with a disk-efficient, content-addressed store

The behaviour is real. pnpm's store is content-addressed, `pnpm-lock.yaml` pins every
resolution, and the workspace globs in `pnpm-workspace.yaml` need no registration for a new
package. The workspace wiring is exercised constantly — every `pnpm build` and `pnpm typecheck`
resolves across two workspace roots through the store.

**The gap:** nothing in this repository asserts the part that would actually break, namely that
a *cold* install works from the store without contacting the registry. The evidence is one
manual experiment recorded in `AGENTS.md`: `node_modules` was deleted, `npm_config_registry` was
pointed at an unreachable port, and `pnpm install --frozen-lockfile` still completed. That is a
real observation, made once, by a human, and not repeatable by anyone else.

## Why it is worth a check

The claim has a failure mode that looks like nothing at all. If the lockfile and the store ever
disagree — a hand-edited `pnpm-lock.yaml`, a store pruned by a cleaner, a pnpm version that
changes hash placement — the failure is not an error. It is a silent network fetch, on a machine
that may be offline, in a project whose whole point is that `nix build` needs no network. The
user sees a hang, not a diagnostic.

This is the same class of bug as the ones already recorded here: a reference that renders as
prose (0008), a generated file that is committed and can drift (0006), a version pair that has
to be maintained by hand (0011). In each case the danger is a failure that no error message
describes.

## Intended changes

Not yet written. The candidate, in increasing cost:

1. **Install with the registry unreachable**, in CI, from a cold store. Catches the real case.
   Needs a seeded store or an acceptably long network install, and CI runners have no warm pnpm
   store, so this is the expensive version.
2. **Install twice and assert the second resolves from the store**, by pointing `pnpm` at a
   non-existent registry for the second run only. Cheaper, and catches the lockfile/store
   disagreement that is the likely cause.
3. **Assert the lockfile is complete and current** with `pnpm install --frozen-lockfile` in a
   clean worktree. Does not touch the registry at all, catches a stale or hand-edited lockfile,
   and is the cheapest thing that could fail.

Check 3 is the one to start with. It is close to free and covers the most likely human error.
Check 2 is the one that would cover the offline claim. Check 1 is the only complete version and
is probably too expensive to run on every build.

## Alternatives considered

- **Drop the bullet from the README.** Cheapest, and honest under a strict reading of "only
  tested features". Rejected because the behaviour is real, the workspace wiring *is* exercised
  by every build, and the useful outcome is the check rather than the silence.
- **Keep it as unchecked prose.** Same effect as dropping it, with more words.
- **Test the store, not the install.** pnpm exposes `pnpm store status`. Worth evaluating: it
  reports integrity of the store directly, which is closer to the claim than any install
  simulation.

## Recommendation

Implement check 3 as a CI step, and evaluate `pnpm store status` before writing check 2. If the
resulting coverage is partial, record what it does not cover here rather than letting the README
imply more than the check proves.

## Verification

Nothing. This record describes intended work and no check exists.

The behaviour it protects was observed once: deleting `node_modules` and installing against an
unreachable registry completed cleanly with a warm store and a complete lockfile. That is
recorded in `AGENTS.md` and is not a check.