---
id: 0008
title: Post-process headings, callouts, and cross-document links
status: deployed
quality: PoC
date: 2026-10-04
branches: [feature/0001-write-the-docs-corpus]
landedIn: 7ce0fa3
related: [0006]
supersedes: null
reviewTrigger: A third markdown renderer, or a docs feature that cannot be expressed as a post-process.
---

# Post-process headings, callouts, and cross-document links

**Action:** Give every heading a stable id, render `> **Note**`-style callouts as styled
asides, and tag cross-document markdown links with a slug the app can intercept - all in the
generator, so neither the markdown source nor the client carries the machinery.

## Current state

Landed in `7ce0fa3` in both generators. The two implementations share this logic deliberately,
so a behavioural difference between them is attributable to the parser rather than to
post-processing.

**The gap:** none outstanding. This record explains why the generator is more than
`parse(markdown)`.

## What each transformation does

- **Heading ids** via `github-slugger`, not a library-specific slugger. That is why heading ids
  are identical across both renderers for all 60 headings - a shared slugger removes the most
  obvious source of divergence.
- **Callouts.** `> **Note**`, `> **Warning**` and friends become an aside with a class per
  kind. Purely presentational; no semantic claim.
- **Cross-document links.** Pages link to each other as `./nix.md`; the frontpage uses
  `./docs/pages/nix.md`. Both forms are matched and the *original href is preserved* - the
  regex keeps the whole match and appends `data-doc-slug`, so a link still works with
  JavaScript disabled and still points somewhere sensible when read as plain markdown.
- `data-doc-slug` is added only when the slug is a real page in the sidebar nav, so a link to a
  nonexistent page is left as a plain link rather than becoming a broken in-app navigation.

## The bug this transformation caused, and the test that now holds it

Only the frontpage form was being tagged. The 21 sibling links between pages were inert in the
app: nothing intercepted them, so clicking one triggered a full page load inside the hash-routed
app. `pnpm check:generated` and the e2e suite now assert that **no** markdown link in the prose
escapes tagging. Measured after the fix: 29 intercepted, 0 dead, in both renderers.

The honest process note: the fix landed before the tests, so they were green on first run and
the "21 dead links" figure came from an ad-hoc script rather than from the test. Reverting the
regex by hand later confirmed all four tests fail across both variants, which is evidence, but
it is not the same as having watched them fail first.

## Alternatives considered

- **Rewrite hrefs to `#/<variant>/<slug>`.** Simpler downstream, and it breaks the markdown as
  standalone content - every link would be wrong outside the app, including on GitHub.
  Rejected; preserving the href costs one extra attribute.
- **A remark/rehype plugin chain.** The conventional markdown tooling. Against it: heavier
  dependencies for two packages whose entire point is to *not* ship a parser, and no shared
  plugin ecosystem between `markdown-it` and `marked` that would avoid writing the same logic
  twice.
- **Normalise to a single link form.** Would remove the bug class rather than guarding it. The
  repository owner deferred this pending further review, so both forms exist and the test
  protects both. The two forms are load-bearing: `docs/pages/*.md` must resolve from the repo
  root for GitHub to render them.
- **Do the tagging in the React component at runtime.** Puts a DOM walk in the render path for
  something a build step can do once. Rejected.

## Recommendation

Keep post-processing in the generator, keep the href intact, and keep the assertion that every
markdown link is tagged. Revisit link-form normalisation as its own decision.

## Where research or grilling would help

- Whether `github-slugger` is the right shared slugger, or whether the right answer is for both
  packages to depend on one wrapper's slug output rather than slugging independently and
  comparing.
- Whether the callout syntax should be constrained to a fixed set of kinds. Right now an
  unrecognised bold-word is presumably left alone, and that fallback is untested.
- Whether 29 intercepted links is the whole corpus, or whether some legitimate `.md` link
  should *not* be in-app navigable. The nav-membership rule encodes an answer; whether it is
  the right answer is unexamined.

## Verification

`apps/e2e/tests/smoke.spec.ts` asserts that every markdown link in the prose carries
`data-doc-slug`, and a second test navigates between pages. Both fail when the regex is
reverted - observed, 4 failures across the two variants. Link census after the fix: 29
intercepted, 0 dead, in both renderers. The shipped bundle contains 62 `data-doc-slug`
occurrences, confirmed in the deployed Pages artefact.