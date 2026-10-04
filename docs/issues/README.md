# Issue index

Decision records for this template. One file per coherent architectural question.
Filenames are `NNNN-action-slug.md`: each title names the **next step**, not the gap.

## Frontmatter

| Field | Meaning |
| --- | --- |
| `id` | Record number, matching the filename. |
| `title` | The action, imperative. |
| `status` | Where the work is. See below. |
| `quality` | Intended quality bar of the *subject*. See below. |
| `date` | When the decision was taken. |
| `branches` | Branches implementing it. May name branches that were never created - see *0002*. |
| `landedIn` | Commit that carried it, or `null` while unlanded. |
| `related` | Other records this connects to. |
| `supersedes` | Record this replaces, or `null`. |
| `reviewTrigger` | The observable event that should reopen it, or `null`. |

**Status.** `status` and `quality` are orthogonal: `status` says how far the work got,
`quality` says how finished it is meant to be.

| Status | Meaning |
| --- | --- |
| `todo` | Decided or triggered, not started. |
| `implemented` | Built and verified, not yet released. |
| `deployed` | Built, verified, and observed running. |
| `blocked` | A major decision is needed before work can continue. |
| `superseded` | Replaced by a later record; kept for history. |

`accepted`, `proposed` and `todo` were conflated in the first five records. They are now
separated: a decision can be taken and the work still be `todo`.

**Quality.** What the subject is *meant* to be, independent of whether it got there. `null`
means the record is about process or infrastructure, where the ladder does not apply.

| Quality | Meaning |
| --- | --- |
| `PoC` | Proof of concept. Demonstrates a mechanism. Not a prototype. |
| `PT` | Prototype. Works end to end, not hardened. |
| `MVP` | Minimal viable. Usable as-is by its intended audience. |

The two `example-docs-*` packages are `PoC` and say so in their commit message, in `AGENTS.md`,
and in the app's own UI copy. An earlier draft called them a "temporary comparison harness"
whose "intended end state is a single docs package", which contradicted the commit that shipped
them.

## Conventions

**Branch naming.** A branch is named after the lowest-numbered issue it introduces:
`feature/NNNN-action-slug`. Extra issues discovered while implementing get their own numbers on
the same branch and are listed in that branch's commit, but do not rename it.

**Where an issue lands.** An issue file is created in the branch that implements it. It is not
written earlier, because Nix's `src = ./.` includes untracked files: a record sitting in the
working tree would enter the *next* branch's `nix build path:` copy and describe a mechanism
that branch does not implement.

**Sections.** Every record leads with `Action:` (imperative), then states the current state and
the gap honestly, then the intended changes, then alternatives with a recommendation, then what
was *not* verified. Records whose `reviewTrigger` has fired say so at the top.

**Relation to the rendered docs.** `docs/issues/` is deliberately *not* a docs source. The page
renderer (0006) reads only `README.md` and `docs/pages/*.md`. `docs/` is also not a workspace
glob (`pnpm-workspace.yaml` matches `apps/*` and `packages/*`) and not listed in `turbo.json`
`globalDependencies`, which names `docs/pages/*.md` specifically so that editing a record here
does not invalidate the docs build.

## Open records

| ID | Action | Status | Quality | Landed in |
| --- | --- | --- | --- | --- |
| [0001](0001-write-the-docs-corpus.md) | Write the README frontpage and the eight doc pages | `deployed` | `PoC` | `7ce0fa3` |
| [0002](0002-adopt-stacked-issue-linked-branches.md) | Work in stacked, issue-linked branches with park-and-proceed | `implemented` | `MVP` | `7ce0fa3` |
| [0003](0003-run-e2e-in-ci-not-in-nix.md) | Run e2e in CI rather than adding `checks.e2e` | `deployed` | `MVP` | `7ce0fa3` |
| [0004](0004-defer-ci-store-cache-to-first-actions-run.md) | Defer CI pnpm-store caching until Actions has run once | `todo` | - | - |
| [0005](0005-defer-the-component-workbench.md) | Defer a component workbench (Storybook) | `todo` | - | - |
| [0006](0006-render-markdown-at-build-time.md) | Render markdown at build time and check for drift | `implemented` | `PoC` | `05b2616` |
| [0007](0007-declare-turbo-inputs-and-outputs.md) | Declare doc inputs and build outputs in `turbo.json` | `implemented` | `PoC` | `05b2616` |
| [0008](0008-post-process-headings-callouts-and-links.md) | Post-process headings, callouts, and cross-document links | `deployed` | `PoC` | `7ce0fa3` |
| [0009](0009-offer-both-renderers.md) | Offer both renderers to template users | `deployed` | `PoC` | `7ce0fa3` |
| [0010](0010-qualify-doc-routes-by-variant.md) | Qualify doc routes by renderer variant | `deployed` | `PoC` | `7ce0fa3` |
| [0011](0011-guard-the-playwright-nixpkgs-pairing.md) | Guard the Playwright/nixpkgs browser pairing | `todo` | `MVP` | - |
| [0012](0012-guard-the-pnpm-store-installation.md) | Assert the pnpm store behaviour the README claims | `todo` | - | - |
| [0013](0013-collapse-the-poc-history-into-readable-commits.md) | Collapse the PoC history into commits a human can read | `todo` | - | - |

Every `Landed in` value is a real commit in `git log`. A history rewrite would invalidate all of
them at once — see [0013](0013-collapse-the-poc-history-into-readable-commits.md).

## Triggers that have fired

Both deferrals in the first batch have been overtaken by events. Neither is closed, because
neither has been started; the records say so at the top rather than quietly changing their
conclusions.

| Record | Trigger | Fired by |
| --- | --- | --- |
| 0004 | First successful Actions run | Run `37207937219`, which also supplied the 18s install measurement the record was waiting for. |
| 0005 | A request for visual regression coverage, or a second consumer | The owner asked for Storybook component tests, then for shared base components. |

## The branch stack was not used

0002 describes four stacked branches. They were never created: the owner collapsed the work
into one commit, `7ce0fa3`, on `main`. `branches:` on records 0001-0005 therefore names
`feature/0001-write-the-docs-corpus`, which does not exist.

The naming and verification rules are in force. `feature/0006-check-markdown-for-drift` is the
first branch to follow them, and the first that has a base to stack onto.

## What has been verified

GitHub Actions has run. Run `37207937219` on `7ce0fa3` passed every `verify` step - install,
type check, lint, 23 e2e tests, `nix build`, `nix flake check` - and the `Build and deploy` job
published to GitHub Pages. The deployed bundle is byte-identical to the local `nix build`
output (`sha256` prefix `4f2bb8cf17ac4be6`), which also means the Nix build is reproducible
across the two environments.

`gh` is not installed in the devshell, so this was read from the public Actions API rather than
`gh run watch`. A first Actions run is also why 0004 and 0005 are no longer hypothetical.

Not verified anywhere: the Nix-sandbox claims in 0003, cross-platform determinism of the
generators in 0006, turbo behaviour under a populated *remote* cache in 0007, and any check at
all for 0011.