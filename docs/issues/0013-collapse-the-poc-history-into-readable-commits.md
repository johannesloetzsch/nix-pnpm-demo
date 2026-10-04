---
id: 0013
title: Collapse the PoC history into commits a human can read
status: todo
quality: null
date: 2026-10-04
branches: [main]
landedIn: null
related: [0001, 0009, 0010]
supersedes: null
reviewTrigger: Deciding to run the history rewrite, which is history-changing and needs explicit approval.
---

# Collapse the PoC history into commits a human can read

**Action:** Rewrite the branch history so the commit log reads as a small number of
intelligible changes, and move the low-level progress tracing into `docs/issues/*` where it
belongs.

## Current state

The docs-browser work was developed in visible steps, and the log carries the iteration:

```
7a0eb1e fix(ci): stop check:links from scanning itself
05b2616 chore: repo hygiene
7ce0fa3 feat: PoC docs-browser example-package
bc1fed1 fixed ci
bbb5b43 style: fix package.json indentation from a manual merge resolution
```

Two entries are noise rather than history. `bbb5b43` is a formatting fix from a hand-written
merge resolution, which means a commit exists only to repair the previous one. `bc1fed1` is
titled `fixed ci` and says nothing about what changed or why. Neither is a unit of work a reader
would want to find or revert.

## Why the tracing is not a loss

Every step in this history is already written down. `docs/issues/` holds twelve records with
the decision, the alternatives considered, and the evidence for each one — including the parts
that read like a diary: the false-green checks on `0006` and `0007`, the measured install time
behind `0004`, the claim corrections in `0009`. That is the record. The commit log is a
different artefact, for a different reader, and it does not need to carry the same detail twice.

## The complication, stated plainly

**Rewriting history invalidates the `landedIn` shas.** Records 0001, 0002, 0003, 0008, 0009 and
0010 all point at `7ce0fa6`, and 0006 and 0007 point at `05b2616`. If either commit is rewritten
or rebased, every one of those shas stops naming a real commit and the index becomes quietly
wrong — worse than the `pending` placeholder this replaced, because it would still *look*
authoritative.

So this is not one task. It is:

1. Decide the target commit set.
2. Rewrite or rebase.
3. Update eight `landedIn` values to the new shas.
4. Re-verify, because the deployed artifact in CI run `37207937219` was built from `7ce0fa3` and
   a rewritten tree produces a different build.

Step 3 is the one that will be forgotten, and it is the one that makes the records lie if it is.

## Alternatives considered

- **Leave the history alone.** The log is short and the noise is two commits. Against this: the
  user's stated preference is a log readable by a human, and `fixed ci` is not that.
- **Reword commits without rewriting history.** Only works for `bc1fed1`, and amending a commit
  that is already pushed still rewrites the sha, so the cost is the same as the real rewrite
  with less benefit.
- **Squash only the two noise commits** into their neighbours, leaving `7ce0fa3` and `05b2616`
  intact. Much smaller blast radius: no `landedIn` changes, no rebuild to compare against.
  This is the cheap version and it may be enough.

## Recommendation

Do the cheap version first: squash `bbb5b43` and `bc1fed1` away, leaving the four meaningful
commits. It gets most of the readability and needs no `landedIn` updates. Treat the full rewrite
as a separate decision, and if it happens, do step 3 in the same sitting and say so in the
commit message.

Whichever version is chosen, this is history-changing on a pushed branch and needs explicit
approval at the time, not now.

## Where grilling would help

- Whether the `landedIn` field should survive a rewrite at all. It is a useful pointer today and
  a liability on every rewrite; a tag, or a reference to the PR rather than the sha, would not
  rot.
- How far to squash. One commit for the whole PoC loses the distinction between "add the
  packages" and "make them link correctly"; four is probably right, one is probably too few.

## Verification

Nothing. This record describes intended work.

The current shas it refers to are real and verified: `7ce0fa3` and `05b2616` both exist in
`git log`, and `7a0eb1e` is the `check:links` fix verified in this file's own sibling record.