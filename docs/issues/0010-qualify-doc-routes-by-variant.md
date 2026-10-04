---
id: 0010
title: Qualify doc routes by renderer variant
status: deployed
quality: PoC
date: 2026-10-04
branches: [feature/0001-write-the-docs-corpus]
landedIn: 7ce0fa3
related: [0009]
supersedes: null
reviewTrigger: An adopter replacing one renderer, or a third variant.
---

# Qualify doc routes by renderer variant

**Action:** Put the renderer variant in the hash route - `#/<variant>/<slug>` - so both
packages can coexist in one app and each link states which implementation rendered it.

## Current state

Landed in `7ce0fa3`. `apps/vite` parses `location.hash`, matches a variant against the
`VARIANTS` list, and renders `<DocsBrowser variant slug onNavigate />`. A click is intercepted
by the app and turns into a route change, not a browser navigation.

**The gap:** none outstanding.

## Why the variant is in the route

Without it, `#/nix` is ambiguous the moment two renderers are installed, and there is no way to
share a URL that identifies which output the author was looking at. For a PoC whose purpose is
comparing two implementations, that ambiguity would defeat the comparison.

## The invariant this creates

The chooser, the sidebar, and every intercepted link must all produce a route that keeps the
current variant. Losing the variant means silently switching implementations on navigation,
which is exactly the class of bug the equivalence test is there to make visible.

`base` and the route are separate concerns and both matter: `apps/vite` serves at
`/nix-pnpm-demo/`, and the Playwright `webServer` waits on that same URL. When one changed
without the other, e2e failed against a URL the dev server does not serve - which is recorded
in `docs/pages/ci.md`.

## Alternatives considered

- **A query parameter, `#/nix?variant=marked`.** Leaves `/nix` working for the default variant.
  Against it: links become easy to get wrong by hand, and a shared URL silently omits the part
  that matters.
- **Separate routes per package, `#/markdown-it/nix`.** Essentially what was chosen.
- **The variant in `localStorage` or a build flag, not the URL.** Then a URL cannot identify an
  implementation at all. Rejected: being able to share the exact view is worth one path segment.
- **No variant in the route, chooser only.** Breaks as soon as both are installed, which is the
  state this repo is in.

## Recommendation

Keep the variant in the route. It costs one segment and removes an entire class of ambiguity.

## Where research or grilling would help

- What happens to an unknown variant in the hash - 404, silent fallback to the first, or
  redirect. The behaviour is implemented but never exercised by a test, and a silent fallback
  would be indistinguishable from the bug above.
- Whether the sidebar's previous/next links preserve the variant. They are generated in the same
  pass as everything else, so they probably do, but nothing asserts it.
- Whether a path-based route (`/marked/nix`) would be better than a hash route, given Pages
  serves a static site with no rewrite rules. Probably not, but it has not been argued through.

## Verification

`apps/e2e/tests/smoke.spec.ts` navigates both variants across all nine pages and asserts the
route-driven content, including a test that clicks a cross-page link and requires the URL and
heading to change together. Observed green: 23 tests, locally and in CI run `37207937219`.

Not verified: malformed and unknown-variant hashes, and browser back/forward across a variant
change. Both are plausible failure modes with no coverage.