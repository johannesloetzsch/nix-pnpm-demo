---
id: 0007
title: Declare doc inputs and build outputs in turbo.json
status: implemented
quality: PoC
date: 2026-10-04
branches: [feature/0006-check-markdown-for-drift]
landedIn: 05b2616
related: [0006]
supersedes: null
reviewTrigger: A third package that writes files during build, or a decision to make turbo caching useful again.
---

# Declare doc inputs and build outputs in `turbo.json`

**Action:** Name the markdown sources in `globalDependencies` so a prose edit invalidates the
docs build, and stop turbo from serving a cached hit in place of running the docs generator.

## The incident that forced this

Reverting a regex, rebuilding, and restoring it again, in that order, left the generated file
**stale while the build log claimed success**. Turborepo hashed the restored sources, found a
matching cache entry from before the revert, replayed its stdout - which included the
generator's `rendered 9 pages` line - and never ran the task. Because the generated file was
not declared as a task output, turbo had nothing to restore either.

The confusing part is that the log looked correct. A green build and a stale artefact is the
worst combination, and nothing in the output said otherwise.

## Current state

Two halves, addressed separately.

**Inputs.** Root `turbo.json` `globalDependencies` names `README.md` and `docs/pages/*.md`.
Turbo hashes file *content*, so `touch` correctly does not invalidate. Verified by editing a
page rather than touching it. `docs/issues/` is deliberately excluded, so editing a decision
record does not invalidate the docs build.

**Outputs.** Root `turbo.json` declares **no `outputs` for any task**. With no declared
outputs, turbo restores no files for any package, which makes turbo caching effectively
inert repo-wide, not only for the docs packages. That is a larger issue than this record
fixes, and it is recorded rather than silently expanded into.

## Intended changes

`packages/example-docs-markdown-it/turbo.json` and
`packages/example-docs-marked/turbo.json`, each:

```json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "cache": false
    }
  }
}
```

Per-package configuration is the mechanism turbo documents for this: `cache` is a scalar, so
it is inherited from the root and a package may override it. Verified against the installed
turbo 2.11.7 docs rather than from memory.

## Alternatives considered

- **`outputs: ["dist/**", "src/generated/pages.ts"]`.** Fixes the docs packages *and* makes
  turbo caching useful for the Vite app's `dist`. Against it: it asserts a convention that
  must be maintained as packages are added, and it leaves turbo reasoning about a side-effect
  write it did not cause. Chosen against, and it remains real work.
- **`cache: false` on the two docs packages. Chown.** Targeted, and honest about the fact that
  the generator's write is a side effect rather than a declared output.
- **`cache: false` at the root.** Would also stop caching `apps/vite`'s build, which is the one
  expensive task worth caching. Rejected as too broad.
- **Nothing, and rely on 0006's drift check to catch it.** Against it: the drift check runs the
  generators directly, so it *would* catch this in CI. It does not help the local loop, where
  the stale file misleads you first.

## Recommendation

`cache: false` on the two docs packages now. Treat root `outputs` as separate work: it is the
difference between turbo caching doing nothing and doing something useful.

## Where research or grilling would help

- Whether declaring `outputs` is better after all, once there is a second package writing files.
  The argument against it was convenience of maintenance, not correctness.
- Whether the codegen step should be a separate task from `build`, so that turbo can cache the
  Vite build and skip codegen independently. That is probably the correct long-term shape and
  was not considered carefully enough here.

## Verification

Red-first, by assertion rather than by inspection: a check built the packages to warm the
turbo cache, deleted both `src/generated/pages.ts`, ran `pnpm build` again **without**
clearing the cache, and required both files back. It failed, naming both missing files. With
the two `turbo.json` files in place it passed.

An earlier attempt at that check deleted `node_modules/.cache/turbo` as well, which made the
second build a cache *miss* and the check passed for the wrong reason - the exact failure mode
this repository's working agreement warns about. The fix was to leave the cache warm; the
value was in noticing the difference rather than in the first result.

What remains unverified: turbo's behaviour under a *populated remote* cache, and whether the
per-package override behaves the same in CI, where no local cache exists at all.