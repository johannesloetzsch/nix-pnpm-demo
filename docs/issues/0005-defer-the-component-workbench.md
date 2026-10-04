---
id: 0005
title: Defer a component workbench (Storybook)
status: todo
quality: null
date: 2026-10-04
branches: [feature/0001-write-the-docs-corpus]
landedIn: null
related: [0001]
supersedes: null
reviewTrigger: null
---

# Defer a component workbench (Storybook)

**Action:** Do not add Storybook or an equivalent component workbench yet. Revisit when
component-level rendering or visual regression is asked for.

## Trigger fired, work not yet started

The trigger was "a request for visual regression coverage, or a second consumer of the
docs-browser packages". The repository owner has since asked for Storybook component tests to
be integrated successfully, and has a further goal after that: shared base components reused
everywhere.

So the trigger has fired and this record's conclusion is **overturned**. It stays `todo`
rather than being rewritten, because the deferral reasoning below was sound *given the
premise*, and the premise is what changed. Storybook work is deliberately sequenced after
repo hygiene, not started here.

This makes the "Who the audience is" question below a settled one, and it was settled against
my assumption: template users *are* expected to build UI components on this.

## Current state

There is no workbench. `apps/vite` renders both renderer variants through `App.tsx` with a
hand-rolled variant switcher, so the components can only be exercised by running the whole
app.

**The gap:** a template user who wants to work on the docs-browser component has no isolated
way to do it, and no story- or snapshot-level rendering. Everything is verified at the
full-app level by `apps/e2e`, which does render both variants across all nine pages.

## Intended changes

None now, deliberately. The next work is repo hygiene and codegen correctness; Storybook
follows that, and the shared base components follow Storybook.

## Alternatives considered

- **Storybook.** Real isolated rendering, and the conventional answer. Against it: this
  template's stated principle is minimal tasks by default, and Storybook brings a heavy
  dependency, its own config, its own build, and a second way for the repository to break.
  For two components that already differ only in a `data-` attribute, that is a poor trade.
  **This reasoning no longer holds** once the template is expected to host shared base
  components, because the number of components is exactly what Storybook's cost is amortised
  over.
- **Vitest plus testing-library.** Solves a different problem - unit tests, not visual work.
  Orthogonal to this record, and possibly a prerequisite rather than an alternative.
- **Use the existing app as the workbench.** Already the case: `#/` is a chooser and
  `#/<variant>/<slug>` renders any page in either variant. Was chosen; is being outgrown.
- **Nothing, now.**

## Recommendation

Build Storybook once the hygiene work lands, and treat the shared base components as its
first real content - that is what makes the dependency cost defensible. Sequence: hygiene, then
Storybook, then shared components.

## Where research or grilling would help

- Whether Storybook or Vitest-plus-testing-library is the actual target. "Component tests" and
  "visual work" are different things and I have assumed Storybook from the mention of it.
- Whether Storybook runs in CI, and if so what it asserts. A workbench that builds but asserts
  nothing adds a failure mode without adding verification.
- Whether Storybook should be part of the template at all, or a documented opt-in an adopter
  adds. Given this template's minimal-by-default principle, opt-in is the honest answer and it
  has not been discussed.

## Verification

`apps/e2e/tests/smoke.spec.ts` renders every page through both implementations and asserts
normalised HTML and heading-ID equivalence. That is full-app coverage, and it is the baseline
any future workbench would have to justify itself against. Observed green: 23 tests in run
`37207937219`.

# Defer a component workbench (Storybook)

**Action:** Do not add Storybook or an equivalent component workbench. Revisit if anyone
needs visual regression coverage or a second consumer of the docs-browser packages.

## Current state

There is no workbench. `apps/vite` renders both renderer variants through `App.tsx` with a
hand-rolled variant switcher, so the components can only be exercised by running the whole
app.

**The gap:** a template user who wants to work on the docs-browser component has no isolated
way to do it, and no story- or snapshot-level rendering. Everything is verified at the
full-app level by `apps/e2e`, which does render both variants across all nine pages.

## Intended changes

None now.

## Alternatives considered

- **Storybook.** Real isolated rendering, and the conventional answer. Against it: this
  template's stated principle is minimal tasks by default, and Storybook brings a heavy
  dependency, its own config, its own build, and a second way for the repository to break.
  For two components that already differ only in a `data-` attribute, that is a poor trade.
  Rejected now, not rejected in principle.
- **Vitest plus testing-library.** Solves a different problem — unit tests, not visual work.
  Would be the right answer if the goal were component-level assertions, and it is
  orthogonal to this record.
- **Use the existing app as the workbench.** Already the case: `#/` is a chooser and
  `#/<variant>/<slug>` renders any page in either variant. **Chosen.**
- **Nothing, now.**

## Recommendation

Defer. The e2e suite already renders both variants of all nine pages, so the coverage a
workbench would partly duplicate is present. What is genuinely missing is speed of iteration
and visual regression, and neither has been asked for.

## Where research or grilling would help

- **Who the audience is.** If template users are expected to build UI components on top,
  a workbench becomes a real need and this record is wrong. My assumption is that most
  adopters will replace the docs browser with their own content and want a template that
  builds, not a component playground. That assumption is untested.
- Whether two variants of one component justifies any workbench at all, even once it
  exists. Two stories would not be a compelling case for Storybook.
- Whether visual regression matters for a template whose rendered output is mostly prose.
  Probably not, but I am guessing.

## Verification

`apps/e2e/tests/smoke.spec.ts` renders every page through both implementations and asserts
normalised HTML and heading-ID equivalence. That is full-app coverage, and it is the
baseline any future workbench would have to justify itself against.