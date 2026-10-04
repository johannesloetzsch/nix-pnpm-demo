---
id: 0001
title: Write the README frontpage and the eight doc pages
status: deployed
quality: PoC
date: 2026-10-04
branches: [feature/0001-write-the-docs-corpus]
landedIn: 7ce0fa3
related: [0006, 0008, 0009]
supersedes: null
reviewTrigger: null
---

# Write the README frontpage and the eight doc pages

**Action:** Ship a README frontpage and eight doc pages, rendered in-app by the two
`example-docs-*` packages, so the template documents itself through its own example code.

## Current state

Landed as `7ce0fa3` and deployed. The corpus is `README.md` plus `docs/pages/*.md`:
`getting-started`, `structure`, `tooling`, `nix`, `offline`, `testing`, `ci`, `adopting`.
`docs/issues/` holds the decision records and is deliberately not rendered.

**The gap:** none outstanding. This record is retained because it explains why the corpus
lives where it does.

## Intended changes

None. The layout is as landed.

`README.md` stays at the repository root because GitHub renders the landing page from it;
everything else lives under `docs/`.

## Alternatives considered

- **Keep the pages as loose files with no in-app browser.** Less machinery, but the template
  would demonstrate documentation wiring only in prose. Rejected: the point of this corpus is
  that a template user can see a workspace package wired end to end.
- **A separate docs site or a second app.** Rejected as disproportionate for a template.
- **One page set under `doc/`.** Renamed to `docs/` during implementation, with `docs/pages/`
  and `docs/issues/` beneath it, because a single flat directory would mix rendered content
  with internal records.

## Recommendation

Shipped. Keep the two directories separate: `docs/pages/` is user-facing content and
`docs/issues/` is internal, and only the former is rendered and hashed by Turbo.

## Where research or grilling would help

Whether eight pages is the right amount for a template, and whether an adopter can delete the
docs browser without losing the corpus. The `adopting` page answers the second question, but
nobody has tested the path by actually following it.

## Verification

Landed in `7ce0fa3`, whose CI run `37207937219` passed every `verify` step, and whose
published bundle is byte-identical to the local `nix build` output
(`sha256` prefix `4f2bb8cf17ac4be6`). `pnpm check:links` and `pnpm check:generated` both pass.

The pages' prose quality is not verified by anything; only their links and generation are.