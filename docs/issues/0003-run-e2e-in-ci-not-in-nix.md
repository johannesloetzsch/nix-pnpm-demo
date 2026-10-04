---
id: 0003
title: Run e2e in CI rather than adding checks.e2e
status: deployed
quality: MVP
date: 2026-10-04
branches: [feature/0001-write-the-docs-corpus]
landedIn: 7ce0fa3
related: [0011]
supersedes: null
reviewTrigger: Reconsider once a sandboxed browser is validated on a real Nix builder, or if CI becomes too slow to be the sole gate.
---

# Run e2e in CI rather than adding `checks.e2e`

**Action:** Keep Playwright running in the GitHub Actions `verify` job, and do not add a
`checks.e2e` flake attribute.

## Current state

There is no `checks.e2e`. `nix build` and `nix flake check` build and type-check, but never
run a browser. End-to-end tests run only in CI's `verify` job.

**The gap:** a flake-level check would be nice-to-have, and its absence is a real coverage
limitation. It reads as an oversight rather than a decision unless that decision is written
down.

## Intended changes

None. `flake.nix` keeps its current shape. The work here is the record, so the omission
survives a future maintainer asking why.

The honest accounting: this is *concentration*, not improvement. The same tests run in one
place instead of two. No new verification is added by this decision.

## Alternatives considered

- **`checks.e2e` in the flake.** The most natural home, since the browsers are already
  provided by Nix. Against it: the Nix sandbox blocks the Chromium sandbox and constrains
  `/dev/shm`, which normally requires `--no-sandbox` and a larger `--disable-dev-shm-usage`.
  Those flags weaken the browser's own isolation, and I cannot validate them here.
  Rejected, but not because the idea is wrong.
- **A flake e2e derivation without the sandbox** (`__noChroot`). Avoids the flags. Flaky in
  a way that would be hard to debug from CI logs, for the same reason.
- **CI only. Chosen.**

## Recommendation

Keep e2e in CI. It is the environment where browsers actually run, and the one place that
already reports failures clearly. Revisit if CI becomes the bottleneck.

## Where research or grilling would help

- Whether the Nix sandbox plus Chromium needs both workarounds here, or neither. My claim
  that it does is **untested**, and it is the entire basis for rejecting `checks.e2e`.
  Testing it means writing a `checks.e2e` and running it under `nix build`, which is the
  experiment I am declining to do. This is the largest remaining unknown in this record.
- Whether Playwright's bundled headless shell behaves differently under the Nix sandbox than
  under a normal Linux runner. Untested.
- Whether anyone actually runs `nix flake check` as a pre-commit gate. If they do not, a
  flake-level e2e would be the only way it ever runs for anyone.

## Verification

`nix flake check` output confirms there is no e2e derivation.

"CI runs the tests" was previously read from the workflow file rather than observed. It has
since been observed: run `37207937219` on `7ce0fa3` passed the `End-to-end tests` step in
13s, with all 23 tests green under `CI=1`. The step is the claim, and it holds.

Still unverified: the two Nix-sandbox claims in "Alternatives considered". They are the basis
for rejecting `checks.e2e`, and nothing here tests them.