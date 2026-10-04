# Working offline

The short version: **builds are hermetic, the devshell is not.**

| | Hermetic? | Installs from |
| --- | --- | --- |
| `nix build` | yes | the `pnpmDeps` derivation, no network |
| `nix flake check` | yes | the same derivation |
| `nix develop` | **no** | your user pnpm store |

That asymmetry is deliberate, and worth understanding so you can predict what a
command will do before running it.

## Why the devshell is not hermetic

pnpm resolves against the *user* store, `~/.local/share/pnpm/store`, because
`pnpm.configHook` never runs in a devshell. It is a `postConfigureHook` and
requires `pnpmDeps`, and a devshell has neither.

The consequence is that the devshell needs network **only when your pnpm store
does not already hold the packages.**

## When the shell installs

| Situation | What the shell does | Network |
| --- | --- | --- |
| Fresh clone or CI checkout, no `node_modules` | `pnpm install --frozen-lockfile` | only if the pnpm store is cold |
| Re-enter the shell, lockfile unchanged | nothing | no |
| Branch switch that changes `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` | only for packages the store lacks |
| Branch switch that leaves the lockfile untouched | nothing | no |
| `node_modules` deleted | `pnpm install --frozen-lockfile` | only if the pnpm store is cold |

So re-entering the devshell is free. It is not a network operation in the common
case, and describing it as one is misleading.

## `node_modules` is disposable

The pnpm store is the real cache; `node_modules` is a derived artefact you can
delete at any time.

With a complete lockfile and a warm store, pnpm skips resolution entirely and
never contacts the registry. This is verifiable: delete `node_modules`, point
the registry at an unreachable port, and the install still succeeds.

> [!NOTE]
> The one case that genuinely needs the network is a **first** install on a
> machine whose store is empty.

## Recovering from a wrong decision

The guard only ever errs towards installing too much. If it decides wrongly:

```bash
pnpm install --frozen-lockfile
```

Or start over completely:

```bash
rm -rf node_modules
nix develop
```

If the devshell's install was ever the wrong behaviour, this fixes it. There is
no path where the guard leaves you with a broken tree that this does not repair.

## Why CI installs explicitly

The same reasoning applies in CI, where the checkout is fresh and
`node_modules` does not exist. The workflow has an explicit install step:

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

This is not redundant with anything — CI does not enter the devshell. The step
exists so that a failure is attributed to *installing*, rather than to whichever
task happens to run first and happens to be the first thing that needs
`node_modules`.

That misattribution is not hypothetical: CI failed at the type-check step,
because `pnpm typecheck` was the first command that needed `node_modules`.

## What to run next

[The docs browser](./docs-browser.md), or
[Adopting this template](./adopting.md).
