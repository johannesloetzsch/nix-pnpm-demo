---
id: 0009
title: Offer both renderers to template users
status: deployed
quality: PoC
date: 2026-10-04
branches: [feature/0001-write-the-docs-corpus]
landedIn: 7ce0fa3
related: [0010]
supersedes: null
reviewTrigger: A second consumer of either package, or an adopter deleting one.
---

# Offer both renderers to template users

**Action:** Ship `example-docs-markdown-it` and `example-docs-marked` as two complete
implementations of the same component, and let the adopter choose - do not pick one and delete
the other.

## Current state

Landed in `7ce0fa3`. `apps/vite` renders both through a chooser at `#/`, showing each variant's
install cost and footprint.

**The gap:** none outstanding.

## Why both

This is an early technical proof of concept, explicitly not a finished prototype and a long
way from an MVP. Both renderers are kept deliberately so a template user can pick the parser
that suits them and compare the two page by page. Choosing one and deleting the other is a
decision for whoever adopts this, not a pending cleanup.

That framing is load-bearing: an earlier draft of this work described the packages as a
"temporary comparison harness" whose "intended end state is a single docs package", in
`AGENTS.md` and in the app's own UI copy. Both contradicted the commit that shipped them, and
both were corrected in `0157b1d`. A template that tells a reader something is temporary while
its commit message calls it deliberate is worse than either framing alone.

## The comparison, measured rather than assumed

- Rendered HTML is **identical for all 9 pages** after normalising three serialisation details:
  `markdown-it-anchor` adds `tabindex="-1"` to anchored headings, `marked` escapes `'` as
  `&#39;`, and the two differ in whitespace between block elements. Nothing visible to a reader
  differs.
- Heading IDs are identical for all 60 headings.
- Client bundle barely moves: `267.04 kB` (markdown-it) vs `266.21 kB` (marked), because
  parsing happens at build time and neither parser ships.
- **Install cost differs sharply**: `markdown-it` pulls 9 store entries, including
  `@types/markdown-it@14.2.0`, auto-installed as a `markdown-it-anchor` peer, where `marked`
  pulls 1. For a template where install time is part of the first impression, that asymmetry is
  the most practically useful fact on this page.

## Alternatives considered

- **Ship one renderer, document the choice.** Leaner, and what a finished product would do.
  Rejected for a proof of concept: the comparison is the deliverable, and picking one would
  throw away the evidence.
- **One package with the parser as a parameter.** Less duplication. Against it: it makes the
  parser choice a runtime or bundler concern, and both packages here are types-only at build
  time with no runtime dependency to parameterise.
- **Both, with the chooser in the shipped app. Chosen.**

## Recommendation

Keep both, keep the chooser, and keep the equivalence test. When the docs browser is replaced
with real content, whichever package the adopter keeps becomes the one to maintain.

## Where research or grilling would help

- Whether a chooser is the right UI, or whether the variant belongs in configuration so the
  shipped app has one renderer and a build flag. A chooser is honest about the PoC; it is not
  what a template user wants in their final app.
- Whether the two packages should diverge deliberately at some point. Right now their identity
  is "identical except the parser", which the equivalence test enforces - so a future
  improvement to one has to be made to both or explicitly exempted.

## Verification

`apps/e2e/tests/smoke.spec.ts` renders every page through both implementations in a browser
and requires identical normalised HTML and identical heading IDs. Observed: 23 tests green,
locally and in CI run `37207937219`. The bundle contains no parser internals - verified by
grepping for `normalizeLinkToken`, `state.md` and `escapeHtml`, all 0 - while the 10
`markdown-it`/`marked` string hits are variant names, chooser copy and prose.

Not verified: behaviour under a browser other than the bundled headless shell, and whether the
two implementations stay identical if one of their shared dependencies is bumped.