---
id: 0002
title: Work in stacked, issue-linked branches with park-and-proceed
status: implemented
quality: MVP
date: 2026-10-04
branches: [feature/0001-write-the-docs-corpus]
landedIn: 7ce0fa3
related: [0001]
supersedes: null
reviewTrigger: null
---

# Work in stacked, issue-linked branches with park-and-proceed

**Action:** Deliver this work as four stacked, issue-linked branches, each fully verified
before it is committed, with a defined behaviour for major decisions that differ between
planning and building.

## Current state

Before this record: seventeen modified tracked files and twenty-eight untracked files in a
single dirty tree on `main`, with no branch, no commit, and no written record of why any of
it was built.

**The gap:** the working state has no reviewable unit smaller than "all of it". Nothing can
be handed off, reverted, or attributed to a decision.

## Intended changes

**Stack.** Linear, one branch at a time, so there is a single merge order.

| # | Branch | Introduces |
| --- | --- | --- |
| 1 | `feature/0001-write-the-docs-corpus` | 0001–0005 |
| 2 | `feature/0006-render-markdown-at-build-time` | 0006–0008 |
| 3 | `feature/0009-offer-both-renderers` | 0009, 0010 |
| 4 | `feature/0011-guard-the-playwright-nixpkgs-pairing` | 0011 |

**Naming.** `feature/NNNN-action-slug`, taken from the lowest-numbered issue the branch
introduces. Extra issues found mid-implementation get new numbers on the same branch and do
not rename it.

**Verification before commit.** The tree that passes verification is byte-identical to the
tree that gets committed. Because Nix's `src = ./.` reads the working tree, verification
runs on a clean `path:` copy of exactly the files in that branch, and `nix build` is re-run
against the committed git tree afterwards.

**`flake.nix`.** Branches 2 and 3 change only the `pnpmDeps` hash. A bounded
pre-authorisation allows that single line, provided `git diff --numstat flake.nix` reports
exactly `1 1`, the old and new hash are reported verbatim, and nothing else in the file
moves. Anything else stops and asks.

**Major decisions during planning** are asked immediately.

**Major decisions during building** do not stop the work. The protocol is *park and
proceed*:

1. Record first — open the issue with `status: blocked`, including options, implications, a
   recommendation, and the quarantine boundary, so the reasoning survives interruption.
2. Draw the quarantine line — classify remaining steps as *independent* (byte-identical
   under every option) or *dependent*. Only independent work proceeds. The test: would I
   write this line identically whichever option wins?
3. Build seams, not decisions — construct the interface every option shares; never pick an
   implementation. Nothing may foreclose an option.
4. Split rather than commit a partial branch — a blocked non-trivial task becomes a new
   issue and its own branch for the independent part, and a `blocked` record with explicit
   entry criteria for the dependent part.
5. Batch the escalation — blocked issues accumulate and are reported together with
   recommendations, rather than interrupting one at a time.

**Hard stops.** A major decision is parkable; these are not, because they protect the
invariant rather than expressing uncertainty: a verification failure that cannot be fixed
within the branch's scope, anything requiring a weakened check or a red commit, secrets or
security exposure, and any `flake.nix` change beyond the hash line or `flake.lock` movement.

## Alternatives considered

- **One commit for all of it.** Fastest, unreviewable, and impossible to revert in part.
  Rejected.
- **One commit per package.** Better granularity, but a commit still spans ~17 files.
  Rejected.
- **A branch per issue (eleven).** Maximum isolation, excessive fragmentation, and
  dependencies between issues would force reordering. Rejected.
- **Stacked branches.** Rejected as too coarse in the other direction: branch 2 is the
  largest unit in this stack. It stays one commit because splitting it would change the
  stack, and one verified commit is preferable to two unverifiable ones.
- **Holding both hash-touching commits for review instead of the bounded override.**
  Zero-violation, costs incremental review of two commits for a computed value.
  Available as a fallback.

## Recommendation

Proceed with the bounded `flake.nix` override. The hash is a computed value rather than a
design choice, and the `git diff --numstat` check makes the boundary mechanical instead of
a matter of judgement.

## Where research or grilling would help

- Whether the bounded override is the right control at all, versus holding branches 2 and 3
  for review. This was accepted, not proven.
- The branch-2 size concern is real and was argued down on instruction. Worth revisiting
  if review feedback finds it unwieldy.
- Whether "four stacked branches" is right in the abstract, or just right for this change.

## Outcome

The workflow is adopted. **The four-branch stack described above was not used.** The
repository owner collapsed it to a single commit, `7ce0fa3`, on `main`, and rewrote its
subject. So the `branches:` field on every record written in that batch names a branch that
never existed, and the "Not yet created" table in the index pointed at branches 2, 3 and 4
that were never created either.

The naming and verification rules are still in force and still useful - `feature/0006-...`,
named for the lowest issue it introduces, is the first branch to actually follow them. What
did not survive is the *stack*: it was the wrong unit for a change whose parts could not be
reviewed apart, since the renderers, the corpus and the app wiring only mean something
together.

## Verification

The rules in this record are drawn from this repository's own `AGENTS.md`, and every one of
them was violated at least once earlier in this work: a non-building flake with `hash = ""`,
a Playwright setup that could not launch, a `checks.typecheck` probe that broke `apps/vite`
while proving nothing, and a merge conflict asserted before any probe was run. This
repository is the test case for the process.

The park-and-proceed rules remain **unexercised as a stack**, because no branch was ever
stacked on another. `feature/0006-check-markdown-for-drift` is the first branch and has no
base to stack onto.